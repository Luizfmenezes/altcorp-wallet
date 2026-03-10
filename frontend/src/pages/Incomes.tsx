import React, { useState } from 'react';
import { Plus, Trash2, Banknote, Gift, TrendingUp, ChevronLeft, ChevronRight, Pencil, RefreshCw } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { IncomeGrowthChart } from '@/components/charts/IncomeGrowthChart';
import { Switch } from '@/components/ui/switch';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const Incomes: React.FC = () => {
  const { incomes, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, addIncome, updateIncome, removeIncome, getTotalIncome } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const displayMonth = selectedMonth + 1;

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'fixed' | 'extra'>('fixed');
  const [payDay, setPayDay] = useState('');
  const [accMonth, setAccMonth] = useState(String(displayMonth));
  const [accYear, setAccYear] = useState(String(selectedYear));
  const [isRecurring, setIsRecurring] = useState(true);

  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'fixed' | 'extra'>('fixed');
  const [editPayDay, setEditPayDay] = useState('');
  const [editAccMonth, setEditAccMonth] = useState('');
  const [editAccYear, setEditAccYear] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);

  const fixedIncomes = incomes.filter(i => {
    if (i.type !== 'fixed') return false;
    if (i.accountingMonth) return i.accountingMonth === displayMonth && i.accountingYear === selectedYear;
    return true;
  });

  const extraIncomes = incomes.filter(i => {
    if (i.type !== 'extra') return false;
    if (i.accountingMonth) return i.accountingMonth === displayMonth && i.accountingYear === selectedYear;
    return i.month === selectedMonth && i.year === selectedYear;
  });

  const totalFixed = fixedIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExtra = extraIncomes.reduce((s, i) => s + i.amount, 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else { setSelectedMonth(selectedMonth - 1); }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else { setSelectedMonth(selectedMonth + 1); }
  };

  const resetForm = () => {
    setDesc(''); setAmount(''); setType('fixed'); setPayDay('');
    setAccMonth(String(displayMonth)); setAccYear(String(selectedYear)); setIsRecurring(true);
  };

  const handleAddIncome = () => {
    if (!desc || !amount) {
      toast({ title: 'Erro', description: 'Preencha descricao e valor.', variant: 'destructive' });
      return;
    }
    addIncome({
      description: desc, amount: Number(amount), type,
      month: displayMonth, year: selectedYear,
      payDay: payDay ? Number(payDay) : null,
      accountingMonth: Number(accMonth), accountingYear: Number(accYear),
      isRecurring,
    });
    toast({ title: 'Sucesso', description: 'Renda adicionada!' });
    resetForm(); setIsDialogOpen(false);
  };

  const handleOpenEdit = (income: typeof incomes[0]) => {
    setEditingIncome(income.id);
    setEditDesc(income.description);
    setEditAmount(String(income.amount));
    setEditType(income.type);
    setEditPayDay(income.payDay ? String(income.payDay) : '');
    setEditAccMonth(income.accountingMonth ? String(income.accountingMonth) : String(displayMonth));
    setEditAccYear(income.accountingYear ? String(income.accountingYear) : String(selectedYear));
    setEditIsRecurring(income.isRecurring || false);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingIncome || !editDesc || !editAmount) {
      toast({ title: 'Erro', description: 'Preencha descricao e valor.', variant: 'destructive' });
      return;
    }
    updateIncome(editingIncome, {
      description: editDesc, amount: Number(editAmount), type: editType,
      month: Number(editAccMonth), year: Number(editAccYear),
      payDay: editPayDay ? Number(editPayDay) : null,
      accountingMonth: Number(editAccMonth), accountingYear: Number(editAccYear),
      isRecurring: editIsRecurring,
    });
    toast({ title: 'Atualizado', description: 'Renda atualizada!' });
    setIsEditDialogOpen(false); setEditingIncome(null);
  };

  const handleRemoveIncome = (id: string) => {
    removeIncome(id);
    toast({ title: 'Removido', description: 'Renda removida.' });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">RENDAS</h1>
          <p className="text-2xl font-bold mt-2">{formatCurrency(getTotalIncome())}</p>
          <p className="text-xs opacity-80">Total do mes</p>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-7xl mx-auto">
        <div className="card-finance animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="bg-primary/10 rounded-2xl px-6 py-2 min-w-[200px] text-center">
              <span className="text-lg font-semibold">{getMonthName(selectedMonth)} {selectedYear}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="font-semibold text-foreground">Crescimento de Renda</h2>
          </div>
          <IncomeGrowthChart />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Renda Mensal</h2>
              </div>
              <span className="text-sm font-bold text-success">{formatCurrency(totalFixed)}</span>
            </div>
            {fixedIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma renda fixa para {MONTH_NAMES[selectedMonth]}</p>
            ) : (
              <div className="space-y-2">
                {fixedIncomes.map((income) => (
                  <div key={income.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{income.description}</p>
                        {income.isRecurring && <RefreshCw className="w-3 h-3 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-semibold text-success">{formatCurrency(income.amount)}</p>
                      {income.payDay && (
                        <p className="text-xs text-muted-foreground">Dia {income.payDay} - Contab. {MONTH_NAMES[(income.accountingMonth || displayMonth) - 1]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(income)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveIncome(income.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card-finance animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-warning" />
                <h2 className="font-semibold text-foreground">Renda Extra</h2>
              </div>
              <span className="text-sm font-bold text-warning">{formatCurrency(totalExtra)}</span>
            </div>
            {extraIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma renda extra em {MONTH_NAMES[selectedMonth]}</p>
            ) : (
              <div className="space-y-2">
                {extraIncomes.map((income) => (
                  <div key={income.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{income.description}</p>
                        {income.isRecurring && <RefreshCw className="w-3 h-3 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-semibold text-warning">{formatCurrency(income.amount)}</p>
                      {income.payDay && (
                        <p className="text-xs text-muted-foreground">Dia {income.payDay} - Contab. {MONTH_NAMES[(income.accountingMonth || displayMonth) - 1]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(income)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveIncome(income.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating md:bottom-8 md:right-8">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Renda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <Input placeholder="Descricao (ex: Salario)" value={desc} onChange={(e) => setDesc(e.target.value)} className="input-finance" />
            <Input type="number" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-finance" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={type} onValueChange={(v: 'fixed' | 'extra') => setType(v)}>
                <SelectTrigger className="input-finance"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="fixed">Mensal</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={31} placeholder="Dia pgto (ex: 20)" value={payDay} onChange={(e) => setPayDay(e.target.value)} className="input-finance" />
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Contabilizar para:</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={accMonth} onValueChange={setAccMonth}>
                  <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {MONTH_NAMES.map((name, i) => (<SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={accYear} onValueChange={setAccYear}>
                  <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="text-sm">Recorrente</span>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            <Button onClick={handleAddIncome} className="w-full h-12 rounded-xl font-semibold">Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingIncome(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Renda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <Input placeholder="Descricao" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input-finance" />
            <Input type="number" placeholder="Valor (R$)" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="input-finance" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={editType} onValueChange={(v: 'fixed' | 'extra') => setEditType(v)}>
                <SelectTrigger className="input-finance"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="fixed">Mensal</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={31} placeholder="Dia pgto" value={editPayDay} onChange={(e) => setEditPayDay(e.target.value)} className="input-finance" />
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Contabilizar para:</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={editAccMonth} onValueChange={setEditAccMonth}>
                  <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {MONTH_NAMES.map((name, i) => (<SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={editAccYear} onValueChange={setEditAccYear}>
                  <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="text-sm">Recorrente</span>
              </div>
              <Switch checked={editIsRecurring} onCheckedChange={setEditIsRecurring} />
            </div>
            <Button onClick={handleSaveEdit} className="w-full h-12 rounded-xl font-semibold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Incomes;
