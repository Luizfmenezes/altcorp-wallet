import React, { useState } from 'react';
import { Plus, Trash2, Banknote, Gift } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const Incomes: React.FC = () => {
  const { incomes, selectedMonth, selectedYear, addIncome, removeIncome } = useFinance();
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-center tracking-wide">
          RENDAS
        </h1>
        <p className="text-center text-primary-foreground/80 text-sm mt-1">
          {getMonthName(selectedMonth)} {selectedYear}
        </p>
      </header>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-6">
        {/* Fixed Incomes */}
        <section className="card-finance animate-fade-in">
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
        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
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

      {/* Add Income Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating">
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
              <SelectContent>
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
