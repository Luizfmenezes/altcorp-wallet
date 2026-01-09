import React, { useState } from 'react';
import { Plus, Trash2, Banknote, Gift, TrendingUp } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { IncomeGrowthChart } from '@/components/charts/IncomeGrowthChart';

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const Incomes: React.FC = () => {
  const { incomes, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, addIncome, removeIncome } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: '',
    type: 'fixed' as 'fixed' | 'extra',
  });

  const fixedIncomes = incomes.filter(i => i.type === 'fixed');
  const extraIncomes = incomes.filter(
    i => i.type === 'extra' && i.month === selectedMonth && i.year === selectedYear
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleAddIncome = () => {
    if (!newIncome.description || !newIncome.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    addIncome({
      description: newIncome.description,
      amount: parseFloat(newIncome.amount),
      type: newIncome.type,
      month: newIncome.type === 'extra' ? selectedMonth : undefined,
      year: newIncome.type === 'extra' ? selectedYear : undefined,
    });

    toast({
      title: 'Sucesso',
      description: 'Renda adicionada com sucesso!',
    });

    setNewIncome({ description: '', amount: '', type: 'fixed' });
    setIsDialogOpen(false);
  };

  const handleRemoveIncome = (id: string) => {
    removeIncome(id);
    toast({
      title: 'Removido',
      description: 'Renda removida com sucesso.',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide">
            RENDAS
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-7xl mx-auto">
        {/* Month/Year Filters */}
        <div className="card-finance animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Mês
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl bg-secondary/50 border-0">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Ano
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl bg-secondary/50 border-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Income Growth Chart */}
        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="font-semibold text-foreground">Crescimento de Renda</h2>
          </div>
          <IncomeGrowthChart />
        </section>

        {/* Grid for larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fixed Incomes */}
          <section className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Renda Mensal</h2>
            </div>
            
            {fixedIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma renda fixa cadastrada
              </p>
            ) : (
              <div className="space-y-2">
                {fixedIncomes.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-foreground">{income.description}</p>
                      <p className="text-sm text-success font-semibold">
                        {formatCurrency(income.amount)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIncome(income.id)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Extra Incomes */}
          <section className="card-finance animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-warning" />
              <h2 className="font-semibold text-foreground">Renda Extra</h2>
            </div>
            
            {extraIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma renda extra neste mês
              </p>
            ) : (
              <div className="space-y-2">
                {extraIncomes.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-foreground">{income.description}</p>
                      <p className="text-sm text-warning font-semibold">
                        {formatCurrency(income.amount)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIncome(income.id)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add Income Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating md:bottom-8 md:right-8">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Renda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Descrição"
              value={newIncome.description}
              onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
              className="input-finance"
            />
            <Input
              type="number"
              placeholder="Valor"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              className="input-finance"
            />
            <Select
              value={newIncome.type}
              onValueChange={(value: 'fixed' | 'extra') => setNewIncome({ ...newIncome, type: value })}
            >
              <SelectTrigger className="input-finance">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="fixed">Renda Mensal (Fixa)</SelectItem>
                <SelectItem value="extra">Renda Extra</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddIncome} className="w-full h-12 rounded-xl">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Incomes;
