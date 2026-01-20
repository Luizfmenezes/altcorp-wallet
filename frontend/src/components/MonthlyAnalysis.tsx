import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/contexts/FinanceContext';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Compras',
  'Serviços',
  'Streaming',
  'Outros',
];

export const MonthlyAnalysis: React.FC = () => {
  const {
    budgets,
    getBudgetStatus,
    setBudget,
    removeBudget,
    getTotalExpenses,
    getPreviousMonthExpenses,
    getExpensesByCategory,
    cards,
    selectedMonth,
    selectedYear,
  } = useFinance();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  const currentExpenses = getTotalExpenses();
  const previousExpenses = getPreviousMonthExpenses();
  const difference = currentExpenses - previousExpenses;
  const percentageChange = previousExpenses > 0 ? (difference / previousExpenses) * 100 : 0;

  const expensesByCategory = getExpensesByCategory();

  // Calcular gastos por cartão no mês atual
  const getCardExpenses = (cardId: string, month: number, year: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return 0;
    
    return card.invoiceItems
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const cardComparison = cards.map(card => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    
    const currentTotal = getCardExpenses(card.id, selectedMonth, selectedYear);
    const previousTotal = getCardExpenses(card.id, prevMonth, prevYear);
    const cardDifference = currentTotal - previousTotal;
    
    return {
      id: card.id,
      name: card.name,
      color: card.color,
      currentTotal,
      previousTotal,
      difference: cardDifference,
    };
  });

  const handleAddBudget = () => {
    if (!selectedCategory || !budgetLimit) {
      toast({
        title: 'Erro',
        description: 'Selecione uma categoria e defina um limite.',
        variant: 'destructive',
      });
      return;
    }

    setBudget(selectedCategory, Number.parseFloat(budgetLimit));
    setSelectedCategory('');
    setBudgetLimit('');
    setIsBudgetDialogOpen(false);
    
    toast({
      title: 'Orçamento definido',
      description: `Orçamento de R$ ${budgetLimit} definido para ${selectedCategory}.`,
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Target className="w-5 h-5 mr-2" />
          Visualizar Análise Mensal
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Análise Mensal Completa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comparativo com mês anterior */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-semibold mb-3">Comparativo Mensal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mês Atual</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(currentExpenses)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mês Anterior</p>
                <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(previousExpenses)}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-background rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">Diferença</span>
              <div className="flex items-center gap-2">
                {difference > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                )}
                <span className={`text-lg font-bold ${difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
                <span className={`text-sm ${difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ({Math.abs(percentageChange).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Gastos por Cartão */}
          {cards.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="font-semibold mb-3">Gastos por Cartão</h4>
              <div className="space-y-3">
                {cardComparison.map(card => {
                  const hasExpenses = card.currentTotal > 0 || card.previousTotal > 0;
                  if (!hasExpenses) return null;
                  
                  return (
                    <div key={card.id} className="bg-background rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="font-medium text-sm">{card.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mês Atual</p>
                          <p className="text-lg font-bold">{formatCurrency(card.currentTotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mês Anterior</p>
                          <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(card.previousTotal)}</p>
                        </div>
                      </div>
                      {card.difference !== 0 && (
                        <div className="mt-2 pt-2 border-t border-muted flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Diferença</span>
                          <div className="flex items-center gap-1">
                            {card.difference > 0 ? (
                              <TrendingUp className="w-3 h-3 text-red-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-green-500" />
                            )}
                            <span className={`text-sm font-semibold ${card.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {card.difference > 0 ? '+' : ''}{formatCurrency(card.difference)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orçamentos por Categoria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Orçamentos por Categoria</h4>
              <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Definir Orçamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="budget-category" className="text-sm font-medium mb-2 block">Categoria</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger id="budget-category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="budget-limit" className="text-sm font-medium mb-2 block">Limite (R$)</label>
                      <Input
                        id="budget-limit"
                        type="number"
                        placeholder="0.00"
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddBudget} className="w-full">
                      Salvar Orçamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum orçamento definido</p>
                <p className="text-xs">Defina metas para controlar seus gastos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map(budget => {
                  const status = getBudgetStatus(budget.category);
                  
                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-muted/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{budget.category}</h5>
                        <button
                          onClick={() => removeBudget(budget.category)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(status.spent)} de {formatCurrency(status.limit)}
                          </span>
                          <span className={`font-bold ${status.percentage > 100 ? 'text-red-500' : 'text-foreground'}`}>
                            {status.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(status.percentage, 100)}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full ${getProgressColor(status.percentage)}`}
                          />
                        </div>
                        {status.percentage > 100 && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Orçamento excedido em {formatCurrency(status.spent - status.limit)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gastos por Categoria (sem orçamento) */}
          {expensesByCategory.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Gastos por Categoria</h4>
              <div className="space-y-2">
                {[...expensesByCategory]
                  .sort((a, b) => b.amount - a.amount)
                  .map(({ category, amount }) => {
                    const hasBudget = budgets.some(b => b.category === category);
                    if (hasBudget) return null;
                    
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
