import React, { useState, useMemo } from 'react';
import {
  Receipt, Plus, Edit2, Calendar, User, Tag, DollarSign,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  List, RefreshCw, CheckCircle2, Circle, Filter, X,
  Search, Trash2, Users,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CalendarView } from '@/components/CalendarView';
import CategoryIcon from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Alimentacao', 'Transporte', 'Moradia', 'Lazer',
  'Saude', 'Educacao', 'Compras', 'Servicos', 'Outros',
];

const CATEGORY_LABELS: Record<string, string> = {
  'Alimentacao': 'Alimentação', 'Transporte': 'Transporte', 'Moradia': 'Moradia',
  'Lazer': 'Lazer', 'Saude': 'Saúde', 'Educacao': 'Educação',
  'Compras': 'Compras', 'Servicos': 'Serviços', 'Outros': 'Outros',
};

// Map display labels back to keys for matching server data
const labelToKey = (label: string): string => {
  for (const [key, val] of Object.entries(CATEGORY_LABELS)) {
    if (val === label) return key;
  }
  return label;
};

const getCategoryLabel = (cat: string): string => {
  return CATEGORY_LABELS[cat] || CATEGORY_LABELS[labelToKey(cat)] || cat;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Expenses: React.FC = () => {
  const {
    expenses, people, selectedMonth, selectedYear,
    setSelectedMonth, setSelectedYear,
    addExpense, updateExpense, removeExpense, addPerson,
  } = useFinance();
  const { toast } = useToast();

  // UI state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    owner: 'Eu',
    isRecurring: false,
    frequency: 'monthly' as 'monthly' | 'weekly',
  });

  // Filtered + sorted expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const d = new Date(exp.date);
        if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
        if (filterPerson !== 'all' && exp.owner !== filterPerson) return false;
        if (filterCategory !== 'all') {
          const catKey = labelToKey(exp.category);
          if (catKey !== filterCategory && exp.category !== CATEGORY_LABELS[filterCategory]) return false;
        }
        if (filterStatus === 'paid' && !exp.isPaid) return false;
        if (filterStatus === 'unpaid' && exp.isPaid) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!exp.description.toLowerCase().includes(q) && !exp.category.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth, selectedYear, filterPerson, filterCategory, filterStatus, searchQuery]);

  const totalMonth = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = filteredExpenses.filter((e) => e.isPaid).reduce((s, e) => s + e.amount, 0);
  const totalUnpaid = totalMonth - totalPaid;

  const activeFilterCount = [filterPerson !== 'all', filterCategory !== 'all', filterStatus !== 'all'].filter(Boolean).length;

  // Group by category
  const categoryTotals = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {};
    for (const exp of filteredExpenses) {
      const cat = exp.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(exp);
    }
    return Object.entries(groups)
      .map(([category, items]) => ({
        category,
        total: items.reduce((s, i) => s + i.amount, 0),
        paidTotal: items.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0),
        items,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // Navigation
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };
  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const toggleCategory = (cat: string) =>
    setExpandedCategories((p) => ({ ...p, [cat]: !p[cat] }));

  // Toggle paid
  const togglePaid = async (expenseId: string, currentPaid: boolean) => {
    await updateExpense(expenseId, { isPaid: !currentPaid });
  };

  // Form handlers
  const handleSubmit = () => {
    if (!formData.description || !formData.category || !formData.amount) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatorios.', variant: 'destructive' });
      return;
    }
    addExpense({
      date: formData.date,
      description: formData.description,
      category: CATEGORY_LABELS[formData.category] ?? formData.category,
      amount: Number.parseFloat(formData.amount),
      owner: formData.owner,
      isRecurring: formData.isRecurring,
      frequency: formData.frequency,
    });
    toast({ title: 'Sucesso', description: 'Gasto adicionado!' });
    resetForm(); setIsAddOpen(false);
  };

  const handleEdit = () => {
    if (!editingExpense || !formData.description || !formData.category || !formData.amount) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatorios.', variant: 'destructive' });
      return;
    }
    updateExpense(editingExpense, {
      date: formData.date,
      description: formData.description,
      category: CATEGORY_LABELS[formData.category] ?? formData.category,
      amount: Number.parseFloat(formData.amount),
      owner: formData.owner,
      isRecurring: formData.isRecurring,
      frequency: formData.frequency,
    });
    toast({ title: 'Sucesso', description: 'Gasto atualizado!' });
    resetForm(); setIsEditOpen(false); setEditingExpense(null);
  };

  const openEditDialog = (expense: typeof expenses[0]) => {
    setEditingExpense(expense.id);
    const catKey = labelToKey(expense.category);
    setFormData({
      date: expense.date,
      description: expense.description,
      category: CATEGORIES.includes(catKey) ? catKey : expense.category,
      amount: expense.amount.toString(),
      owner: expense.owner,
      isRecurring: expense.isRecurring || false,
      frequency: expense.frequency || 'monthly',
    });
    setIsEditOpen(true);
  };

  const resetForm = () => setFormData({
    date: new Date().toISOString().split('T')[0],
    description: '', category: '', amount: '', owner: 'Eu',
    isRecurring: false, frequency: 'monthly',
  });

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setFormData({ ...formData, owner: newPersonName.trim() });
      setNewPersonName(''); setIsAddPersonOpen(false);
      toast({ title: 'Sucesso', description: 'Pessoa adicionada!' });
    }
  };

  const clearFilters = () => {
    setFilterPerson('all'); setFilterCategory('all'); setFilterStatus('all'); setSearchQuery('');
  };

  const formatDate = (dateStr: string) => format(new Date(dateStr), "dd 'de' MMM", { locale: ptBR });

  // Form fields (reusable between Add and Edit)
  const renderFormFields = () => (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-finance" />
      </div>
      <Input placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-finance" />
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger className="input-finance flex-1"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              <div className="flex items-center gap-2">
                <CategoryIcon category={cat} size={20} iconSize={12} />
                {getCategoryLabel(cat)}
              </div>
            </SelectItem>
          ))}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input type="number" placeholder="Valor" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-finance" step="0.01" />
      </div>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={formData.owner} onValueChange={(v) => setFormData({ ...formData, owner: v })}>
          <SelectTrigger className="input-finance flex-1"><SelectValue placeholder="Titular" /></SelectTrigger>
          <SelectContent>{people.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
        </Select>
        <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader><DialogTitle>Adicionar Pessoa</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Nome" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} className="input-finance" onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()} />
              <Button onClick={handleAddPerson} className="w-full h-11 rounded-xl">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Recurring */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center space-x-2">
          <Checkbox id="isRec" checked={formData.isRecurring} onCheckedChange={(c) => setFormData({ ...formData, isRecurring: c as boolean })} />
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="isRec" className="text-sm font-medium cursor-pointer">Despesa Recorrente</Label>
          </div>
        </div>
        {formData.isRecurring && (
          <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v as 'monthly' | 'weekly' })}>
            <SelectTrigger className="input-finance"><SelectValue placeholder="Frequencia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <header className="bg-destructive text-destructive-foreground p-6 pb-8 rounded-b-3xl lg:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl lg:text-2xl font-bold text-center tracking-wide mb-4">GASTOS AVULSOS</h1>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-destructive-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 min-w-[200px] justify-center">
              <span className="text-lg font-semibold">{getMonthName(selectedMonth)} {selectedYear}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-destructive-foreground">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 -mt-4 max-w-7xl mx-auto">

        {/* === Person Quick Filter (scrollable pills) === */}
        {people.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFilterPerson('all')}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterPerson === 'all'
                    ? 'bg-destructive text-destructive-foreground shadow-md'
                    : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                }`}
              >
                Todos
              </button>
              {people.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPerson(filterPerson === p ? 'all' : p)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                    filterPerson === p
                      ? 'bg-destructive text-destructive-foreground shadow-md'
                      : 'bg-card text-muted-foreground border border-border hover:bg-accent'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* === Summary Cards === */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-4">
          <div className="card-finance p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold text-destructive">R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div
            onClick={() => setFilterStatus(filterStatus === 'paid' ? 'all' : 'paid')}
            className={`card-finance p-3 text-center cursor-pointer transition-all ${filterStatus === 'paid' ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pago</p>
            <p className="text-lg font-bold text-emerald-500">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div
            onClick={() => setFilterStatus(filterStatus === 'unpaid' ? 'all' : 'unpaid')}
            className={`card-finance p-3 text-center cursor-pointer transition-all ${filterStatus === 'unpaid' ? 'ring-2 ring-amber-500' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pendente</p>
            <p className="text-lg font-bold text-amber-500">R$ {totalUnpaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </motion.div>

        {/* === Toolbar: Search + Filters + View Toggle === */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-finance mb-4 p-3">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gastos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-md">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl relative shrink-0">
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                <div className="space-y-6 py-4">
                  {/* Category filter */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setFilterCategory('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          filterCategory === 'all' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >Todas</button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 justify-center ${
                            filterCategory === cat ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <CategoryIcon category={cat} size={18} iconSize={11} />
                          <span className="truncate">{getCategoryLabel(cat)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Status filter */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ v: 'all' as const, l: 'Todos' }, { v: 'paid' as const, l: 'Pagos' }, { v: 'unpaid' as const, l: 'Pendentes' }].map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setFilterStatus(o.v)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            filterStatus === o.v ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >{o.l}</button>
                      ))}
                    </div>
                  </div>
                  {/* Person filter */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Pessoa</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilterPerson('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filterPerson === 'all' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >Todos</button>
                      {people.map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilterPerson(filterPerson === p ? 'all' : p)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            filterPerson === p ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="w-full rounded-xl">
                      <X className="w-4 h-4 mr-2" /> Limpar Filtros
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* View toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')} className="shrink-0">
              <TabsList className="h-9 p-0.5">
                <TabsTrigger value="list" className="h-8 px-2"><List className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="calendar" className="h-8 px-2"><Calendar className="w-4 h-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {filterPerson !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilterPerson('all')}>
                  <Users className="w-3 h-3" /> {filterPerson} <X className="w-3 h-3" />
                </Badge>
              )}
              {filterCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer" onClick={() => setFilterCategory('all')}>
                  <CategoryIcon category={filterCategory} size={16} iconSize={10} />
                  {getCategoryLabel(filterCategory)} <X className="w-3 h-3" />
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilterStatus('all')}>
                  {filterStatus === 'paid' ? 'Pagos' : 'Pendentes'} <X className="w-3 h-3" />
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* === Content === */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div key="cal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <CalendarView month={selectedMonth} year={selectedYear} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="card-finance text-center py-12">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum gasto encontrado</p>
                  <p className="text-sm text-muted-foreground">para {getMonthName(selectedMonth)} de {selectedYear}</p>
                  {activeFilterCount > 0 && (
                    <Button variant="link" onClick={clearFilters} className="mt-2 text-destructive">Limpar filtros</Button>
                  )}
                </div>
              ) : (
                categoryTotals.map((group, gi) => (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.04 }}
                    className="card-finance p-0 overflow-hidden"
                  >
                    {/* Category header */}
                    <button onClick={() => toggleCategory(group.category)} className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={group.category} size={40} iconSize={20} />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{getCategoryLabel(group.category)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{group.items.length} {group.items.length === 1 ? 'item' : 'itens'}</span>
                            {group.paidTotal > 0 && group.paidTotal < group.total && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {Math.round((group.paidTotal / group.total) * 100)}% pago
                              </Badge>
                            )}
                            {group.paidTotal === group.total && group.total > 0 && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                                Tudo pago
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-destructive">- R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {expandedCategories[group.category] ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Items */}
                    <AnimatePresence>
                      {expandedCategories[group.category] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border/50 bg-accent/5"
                        >
                          {group.items.map((expense) => (
                            <div key={expense.id} className="flex items-center gap-2 px-4 py-3 border-b border-border/20 last:border-b-0 group">
                              {/* Toggle paid */}
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePaid(expense.id, !!expense.isPaid); }}
                                className="shrink-0 p-0.5 transition-transform active:scale-90"
                                title={expense.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                              >
                                {expense.isPaid ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                                )}
                              </button>

                              {/* Info */}
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDialog(expense)}>
                                <p className={`font-medium truncate ${expense.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {expense.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatDate(expense.date)}</span>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                  <span>{expense.owner}</span>
                                  {expense.isRecurring && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                      <RefreshCw className="w-3 h-3" />
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Amount + edit */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`font-semibold whitespace-nowrap ${expense.isPaid ? 'text-muted-foreground line-through' : 'text-destructive'}`}>
                                  - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <button onClick={() => openEditDialog(expense)} className="p-1 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
                                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === Add Dialog === */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 right-4 lg:bottom-8 w-14 h-14 rounded-2xl shadow-lg" size="icon">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar Gasto</DialogTitle></DialogHeader>
          {renderFormFields()}
          <Button onClick={handleSubmit} className="w-full h-12 rounded-xl mt-2">Adicionar Gasto</Button>
        </DialogContent>
      </Dialog>

      {/* === Edit Dialog === */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Gasto</DialogTitle></DialogHeader>
          {renderFormFields()}
          <div className="flex gap-2 mt-2">
            <Button variant="destructive" onClick={() => {
              if (editingExpense) {
                removeExpense(editingExpense); setIsEditOpen(false); setEditingExpense(null); resetForm();
                toast({ title: 'Removido', description: 'Gasto removido com sucesso.' });
              }
            }} className="flex-1 h-12 rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
            <Button onClick={handleEdit} className="flex-1 h-12 rounded-xl">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Expenses;