import React, { useState } from 'react';
import { Receipt, Plus, Edit2, Calendar, User, Tag, DollarSign } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Compras',
  'Serviços',
  'Outros',
];

const CATEGORY_ICONS: { [key: string]: string } = {
  'Alimentação': '🍔',
  'Transporte': '🚗',
  'Moradia': '🏠',
  'Lazer': '🎮',
  'Saúde': '💊',
  'Educação': '📚',
  'Compras': '🛒',
  'Serviços': '⚙️',
  'Outros': '📝',
};

const Expenses: React.FC = () => {
  const { 
    expenses, 
    people, 
    selectedMonth, 
    selectedYear, 
    setSelectedMonth, 
    setSelectedYear,
    addExpense,
    updateExpense,
    removeExpense,
    addPerson 
  } = useFinance();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    owner: 'Eu',
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: getMonthName(i),
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (new Date().getFullYear() - 2 + i).toString(),
    label: (new Date().getFullYear() - 2 + i).toString(),
  }));

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalMonthExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleSubmit = () => {
    if (!formData.description || !formData.category || !formData.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    addExpense({
      date: formData.date,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      owner: formData.owner,
    });

    toast({
      title: 'Sucesso',
      description: 'Gasto adicionado com sucesso!',
    });

    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = () => {
    if (!editingExpense || !formData.description || !formData.category || !formData.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    updateExpense(editingExpense, {
      date: formData.date,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      owner: formData.owner,
    });

    toast({
      title: 'Sucesso',
      description: 'Gasto atualizado com sucesso!',
    });

    resetForm();
    setIsEditOpen(false);
    setEditingExpense(null);
  };

  const openEditDialog = (expense: typeof expenses[0]) => {
    setEditingExpense(expense.id);
    setFormData({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      owner: expense.owner,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      amount: '',
      owner: 'Eu',
    });
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setFormData({ ...formData, owner: newPersonName.trim() });
      setNewPersonName('');
      setIsAddPersonOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Pessoa adicionada!',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <header className="bg-destructive text-destructive-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide mb-4">
            GASTOS DO MÊS
          </h1>
          
          {/* Month/Year Filters */}
          <div className="flex gap-2 justify-center">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-destructive-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-24 bg-white/10 border-white/20 text-destructive-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 max-w-4xl mx-auto">
        {/* Total Summary */}
        <div className="card-finance mb-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-destructive" />
              <span className="font-medium text-muted-foreground">Total do Mês</span>
            </div>
            <span className="text-2xl font-bold text-destructive">
              R$ {totalMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          {sortedExpenses.length === 0 ? (
            <div className="card-finance text-center py-12 animate-fade-in">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum gasto registrado</p>
              <p className="text-sm text-muted-foreground">para {getMonthName(selectedMonth)} de {selectedYear}</p>
            </div>
          ) : (
            sortedExpenses.map((expense, index) => (
              <div
                key={expense.id}
                onClick={() => openEditDialog(expense)}
                className="card-finance flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-lg">
                  {CATEGORY_ICONS[expense.category] || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(expense.date)}</span>
                    <span>•</span>
                    <span>{expense.category}</span>
                    <span>•</span>
                    <span>{expense.owner}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-destructive whitespace-nowrap">
                    - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-24 right-4 md:bottom-8 w-14 h-14 rounded-2xl shadow-lg"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-finance"
              />
            </div>
            
            <Input
              placeholder="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-finance"
            />
            
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="input-finance flex-1">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Valor"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-finance"
                step="0.01"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={formData.owner} 
                onValueChange={(v) => setFormData({ ...formData, owner: v })}
              >
                <SelectTrigger className="input-finance flex-1">
                  <SelectValue placeholder="Titular" />
                </SelectTrigger>
                <SelectContent>
                  {people.map(person => (
                    <SelectItem key={person} value={person}>{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Adicionar Pessoa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="Nome"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="input-finance"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                    />
                    <Button onClick={handleAddPerson} className="w-full h-11 rounded-xl">
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Button onClick={handleSubmit} className="w-full h-12 rounded-xl">
              Adicionar Gasto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-finance"
              />
            </div>
            
            <Input
              placeholder="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-finance"
            />
            
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="input-finance flex-1">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Valor"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-finance"
                step="0.01"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={formData.owner} 
                onValueChange={(v) => setFormData({ ...formData, owner: v })}
              >
                <SelectTrigger className="input-finance flex-1">
                  <SelectValue placeholder="Titular" />
                </SelectTrigger>
                <SelectContent>
                  {people.map(person => (
                    <SelectItem key={person} value={person}>{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editingExpense) {
                    removeExpense(editingExpense);
                    setIsEditOpen(false);
                    setEditingExpense(null);
                    resetForm();
                    toast({ title: 'Removido', description: 'Gasto removido com sucesso.' });
                  }
                }}
                className="flex-1 h-12 rounded-xl"
              >
                Excluir
              </Button>
              <Button onClick={handleEdit} className="flex-1 h-12 rounded-xl">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Expenses;