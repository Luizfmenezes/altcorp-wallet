import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, CreditCard, Settings, Target, Star, Zap, ShieldCheck, Award, Plus, X, Repeat, PieChart, BarChart3, Wallet, CalendarDays } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryIcon from '@/components/CategoryIcon';
import BankLogo from '@/components/BankLogo';

const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde',
  'Educação', 'Compras', 'Serviços', 'Streaming', 'Outros',
];

const CATEGORY_COLORS = [
  '#8B5CF6', '#F97316', '#EF4444', '#3B82F6', '#10B981',
  '#EC4899', '#F59E0B', '#6366F1', '#14B8A6', '#6B7280',
];

const MonthlyAnalysisPage: React.FC = () => {
  const {
    expenses, cards, budgets, selectedMonth, selectedYear,
    getTotalExpenses, getTotalIncome, getPreviousMonthExpenses,
    getExpensesByCategory, getBudgetStatus, setBudget, removeBudget,
  } = useFinance();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [currentSlide, setCurrentSlide] = useState(0);  const [showBudgetConfig, setShowBudgetConfig] = useState(false);
  const [configCategory, setConfigCategory] = useState('');
  const [configLimit, setConfigLimit] = useState('');

  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const previousExpenses = getPreviousMonthExpenses();
  const expensesByCategory = getExpensesByCategory();
  const monthName = getMonthName(selectedMonth);

  // Dados por categoria com cores
  const categoryData = useMemo(() => {
    return [...expensesByCategory]
      .sort((a, b) => b.amount - a.amount)
      .map((item, i) => ({
        ...item,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
      }));
  }, [expensesByCategory, totalExpenses]);

  // Gastos por dia
  const dailyExpenses = useMemo(() => {
    const days: Record<number, number> = {};
    
    expenses
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .forEach(exp => {
        const day = new Date(exp.date).getDate();
        days[day] = (days[day] || 0) + exp.amount;
      });

    cards.forEach(card => {
      card.invoiceItems
        .filter(item => {
          const d = new Date(item.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .forEach(item => {
          const day = new Date(item.date).getDate();
          days[day] = (days[day] || 0) + item.amount;
        });
    });

    return Object.entries(days)
      .map(([day, amount]) => ({ day: Number(day), amount }))
      .sort((a, b) => a.day - b.day);
  }, [expenses, cards, selectedMonth, selectedYear]);

  const maxDailyExpense = Math.max(...dailyExpenses.map(d => d.amount), 1);

  // Cartão vs Direto
  const cardExpensesTotal = useMemo(() => {
    return cards.reduce((total, card) => {
      return total + card.invoiceItems
        .filter(item => {
          const d = new Date(item.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);
    }, 0);
  }, [cards, selectedMonth, selectedYear]);

  const directExpensesTotal = useMemo(() => {
    return expenses
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, selectedMonth, selectedYear]);

  // Recorrentes
  const recurringCount = useMemo(() => {
    const recurringExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && exp.isRecurring;
    });
    const recurringCards = cards.flatMap(c => c.invoiceItems).filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && item.isRecurring;
    });
    return recurringExpenses.length + recurringCards.length;
  }, [expenses, cards, selectedMonth, selectedYear]);

  const recurringTotal = useMemo(() => {
    let total = 0;
    expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && exp.isRecurring;
    }).forEach(exp => { total += exp.amount; });
    
    cards.forEach(card => {
      card.invoiceItems.filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && item.isRecurring;
      }).forEach(item => { total += item.amount; });
    });
    return total;
  }, [expenses, cards, selectedMonth, selectedYear]);

  // Resumo por cartão
  const cardSummary = useMemo(() => {
    return cards.map(card => {
      const total = card.invoiceItems
        .filter(item => {
          const d = new Date(item.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);
      const itemCount = card.invoiceItems.filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }).length;
      return { id: card.id, name: card.name, color: card.color, icon: card.icon, total, itemCount, type: card.type };
    }).filter(c => c.total > 0 || c.itemCount > 0);
  }, [cards, selectedMonth, selectedYear]);

  // Comparativo
  const difference = totalExpenses - previousExpenses;
  const percentageChange = previousExpenses > 0 ? (difference / previousExpenses) * 100 : 0;
  const isSpendingLess = difference <= 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Slides
  const slides = [
    'categories',     // 0: Gastos por categoria
    'daily',          // 1: Gastos por dia
    'cardVsDirect',   // 2: Cartão vs Direto
    'recurring',      // 3: Recorrentes
    'budget',         // 4: Comparação orçamento + elogio
    'cardSummary',    // 5: Resumo por cartão
  ];
  const totalSlides = slides.length;

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const handleAddBudget = () => {
    if (!configCategory || !configLimit) return;
    setBudget(configCategory, parseFloat(configLimit));
    setConfigCategory('');
    setConfigLimit('');
    setShowBudgetConfig(false);
  };

  // Variantes de animação
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const [direction, setDirection] = useState(0);
  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    if (newDirection > 0) nextSlide();
    else prevSlide();
  };

  // Render cada slide
  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case 'categories':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                <PieChart className="w-7 h-7 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gastos por Categoria</h2>
              <p className="text-sm text-muted-foreground mt-1">{monthName} {selectedYear}</p>
            </div>

            {categoryData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma despesa registrada neste mês</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat, i) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-card rounded-xl p-3.5 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon category={cat.category} size={32} iconSize={17} />
                        <span className="font-medium text-sm text-foreground">{cat.category}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: cat.color }}>
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cat.percentage.toFixed(1)}% do total</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'daily':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-7 h-7 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gastos por Dia</h2>
              <p className="text-sm text-muted-foreground mt-1">Quando você mais gastou</p>
            </div>

            {dailyExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma despesa neste mês</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dailyExpenses.map((d, i) => (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    style={{ transformOrigin: 'left' }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{d.day}</span>
                    <div className="flex-1 h-7 bg-muted/50 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.amount / maxDailyExpense) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-lg"
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-foreground">
                        {formatCurrency(d.amount)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'cardVsDirect':
        const cardPct = totalExpenses > 0 ? (cardExpensesTotal / totalExpenses) * 100 : 0;
        const directPct = totalExpenses > 0 ? (directExpensesTotal / totalExpenses) * 100 : 0;
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Cartão vs Gasto Avulso</h2>
              <p className="text-sm text-muted-foreground mt-1">Como você está pagando</p>
            </div>

            {/* Visual grande */}
            <div className="flex items-center justify-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{cardPct.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Cartão</p>
                <p className="text-sm font-semibold text-violet-500 mt-1">{formatCurrency(cardExpensesTotal)}</p>
              </motion.div>

              <div className="text-3xl text-muted-foreground/30 font-light">vs</div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{directPct.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Gasto Avulso</p>
                <p className="text-sm font-semibold text-emerald-500 mt-1">{formatCurrency(directExpensesTotal)}</p>
              </motion.div>
            </div>

            {/* Barra */}
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cardPct}%` }}
                transition={{ duration: 0.8 }}
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${directPct}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full"
              />
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
              <p className="text-sm text-muted-foreground">Total de gastos em {monthName}</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
            </div>

            {/* Detalhes por cartão */}
            {cardSummary.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Por cartão</p>
                {cardSummary.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: card.color }}
                    >
                      <BankLogo bankId={card.icon} size={26} fallbackType={card.type as 'credit' | 'debit' | 'bank'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.itemCount} transações</p>
                    </div>
                    <span className="text-sm font-bold text-violet-500 flex-shrink-0">{formatCurrency(card.total)}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Detalhes gastos avulsos por categoria */}
            {directExpensesTotal > 0 && (() => {
              const byCat = expenses
                .filter(exp => {
                  const d = new Date(exp.date);
                  return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                })
                .reduce<Record<string, number>>((acc, exp) => {
                  acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                  return acc;
                }, {});
              const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gastos avulsos por categoria</p>
                  {catList.map(([cat, amount], i) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50"
                    >
                      <CategoryIcon category={cat} size={36} iconSize={19} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{cat}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-500 flex-shrink-0">{formatCurrency(amount)}</span>
                    </motion.div>
                  ))}
                </div>
              );
            })()}
          </div>
        );

      case 'recurring':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <Repeat className="w-7 h-7 text-cyan-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Gastos Recorrentes</h2>
              <p className="text-sm text-muted-foreground mt-1">Compromissos mensais fixos</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-4 border border-border/50 text-center"
              >
                <p className="text-3xl font-bold text-cyan-500">{recurringCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Itens recorrentes</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl p-4 border border-border/50 text-center"
              >
                <p className="text-xl font-bold text-foreground">{formatCurrency(recurringTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total recorrente</p>
              </motion.div>
            </div>

            {totalIncome > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Comprometimento da renda</span>
                  <span className="font-bold text-foreground">{((recurringTotal / totalIncome) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((recurringTotal / totalIncome) * 100, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${
                      (recurringTotal / totalIncome) > 0.5 ? 'bg-red-500' :
                      (recurringTotal / totalIncome) > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                </div>
              </motion.div>
            )}

            {recurringCount === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Nenhum gasto recorrente neste mês</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Marque despesas como recorrentes para acompanhar aqui</p>
              </div>
            )}
          </div>
        );

      case 'budget':
        const activeBudgets = budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
        const allOnBudget = activeBudgets.length > 0 && activeBudgets.every(b => {
          const status = getBudgetStatus(b.category);
          return status.percentage <= 100;
        });
        const avgPercentage = activeBudgets.length > 0
          ? activeBudgets.reduce((s, b) => s + getBudgetStatus(b.category).percentage, 0) / activeBudgets.length
          : 0;

        return (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Orçamento</h2>
              <p className="text-sm text-muted-foreground mt-1">Suas metas vs realidade</p>
            </div>

            {/* Comparativo mês anterior */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">vs Mês anterior</span>
                <div className="flex items-center gap-1.5">
                  {isSpendingLess ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-bold ${isSpendingLess ? 'text-green-500' : 'text-red-500'}`}>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)} ({Math.abs(percentageChange).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anterior</p>
                  <p className="font-bold text-muted-foreground">{formatCurrency(previousExpenses)}</p>
                </div>
              </div>
            </motion.div>

            {/* Elogio / Feedback */}
            {activeBudgets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`rounded-xl p-4 text-center ${
                  allOnBudget
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20'
                    : avgPercentage <= 100
                    ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20'
                    : 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20'
                }`}
              >
                {allOnBudget ? (
                  <>
                    <Award className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-600 dark:text-green-400">Excelente! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos os orçamentos estão dentro do limite. Parabéns pelo controle!</p>
                  </>
                ) : avgPercentage <= 100 ? (
                  <>
                    <Star className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                    <p className="font-bold text-yellow-600 dark:text-yellow-400">Quase lá! ⭐</p>
                    <p className="text-sm text-muted-foreground mt-1">Alguns orçamentos estão próximos do limite. Fique atento!</p>
                  </>
                ) : (
                  <>
                    <Zap className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <p className="font-bold text-red-600 dark:text-red-400">Atenção! ⚠️</p>
                    <p className="text-sm text-muted-foreground mt-1">Alguns orçamentos foram ultrapassados. Hora de ajustar os gastos.</p>
                  </>
                )}
              </motion.div>
            )}

            {/* Orçamentos */}
            {activeBudgets.length > 0 ? (
              <div className="space-y-2.5">
                {activeBudgets.map((budget, i) => {
                  const status = getBudgetStatus(budget.category);
                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="bg-card rounded-xl p-3.5 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={budget.category} size={28} iconSize={15} />
                          <span className="text-sm font-medium">{budget.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${status.percentage > 100 ? 'text-red-500' : 'text-foreground'}`}>
                            {status.percentage.toFixed(0)}%
                          </span>
                          <button onClick={() => removeBudget(budget.category)} className="text-red-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(status.percentage, 100)}%` }}
                          transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                          className={`h-full rounded-full ${
                            status.percentage > 100 ? 'bg-red-500' :
                            status.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(status.spent)} de {formatCurrency(status.limit)}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum orçamento definido</p>
                <p className="text-xs text-muted-foreground/60">Use a engrenagem para configurar</p>
              </div>
            )}

            {/* Botão config engrenagem */}
            <button
              onClick={() => setShowBudgetConfig(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Configurar Orçamentos</span>
            </button>
          </div>
        );

      case 'cardSummary':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Resumo por Cartão</h2>
              <p className="text-sm text-muted-foreground mt-1">Detalhamento de cada conta</p>
            </div>

            {cardSummary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhuma movimentação nos cartões este mês</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cardSummary.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: card.color }}
                      >
                        <BankLogo bankId={card.icon} size={28} fallbackType={card.type as 'credit' | 'debit' | 'bank'} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{card.name}</p>
                        <p className="text-xs text-muted-foreground">{card.itemCount} transações</p>
                      </div>
                      <p className="text-lg font-bold" style={{ color: card.color }}>
                        {formatCurrency(card.total)}
                      </p>
                    </div>
                    {/* Barra proporcional */}
                    {totalExpenses > 0 && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(card.total / totalExpenses) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Final - Resumão */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={theme === 'dark' ? 'rounded-xl p-5 text-white text-center' : 'bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl p-5 text-white text-center'}
              style={theme === 'dark' ? { background: 'linear-gradient(135deg, #0D1A6E 0%, #1A2FA8 100%)' } : undefined}
            >
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-white/80" />
              <p className="font-bold text-lg">Resumo de {monthName}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-white/70 text-xs">Receita</p>
                  <p className="font-bold">{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Despesa</p>
                  <p className="font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-white/70 text-xs">Saldo</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpenses)}</p>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={theme === 'dark' ? 'text-white px-5 pt-12 pb-6 rounded-b-[2rem] lg:rounded-none lg:pt-8' : 'bg-gradient-to-br from-blue-600 to-sky-500 text-white px-5 pt-12 pb-6 rounded-b-[2rem] lg:rounded-none lg:pt-8'}
        style={theme === 'dark' ? { background: 'linear-gradient(135deg, #0D1A6E 0%, #1A2FA8 100%)' } : undefined}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Análise Mensal</h1>
                <p className="text-white/70 text-xs">{monthName} {selectedYear}</p>
              </div>
            </div>
            <button
              onClick={() => setShowBudgetConfig(true)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.header>

      {/* Conteúdo do slide */}
      <div className="px-5 max-w-4xl mx-auto mt-5">
        <div className="min-h-[60vh] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              {renderSlide()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <button
            onClick={() => paginate(-1)}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentSlide === 0
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-primary hover:bg-primary/5'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground">{currentSlide + 1} / {totalSlides}</span>

          <button
            onClick={() => paginate(1)}
            disabled={currentSlide === totalSlides - 1}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentSlide === totalSlides - 1
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-white bg-primary hover:bg-primary/90 shadow-md'
            }`}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de configuração de orçamento */}
      <AnimatePresence>
        {showBudgetConfig && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBudgetConfig(false)}
            />
            {/* Modal centralizado — não fica bloqueado pelo teclado virtual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 bg-card rounded-3xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
              style={{ maxWidth: 520, margin: '0 auto' }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 pt-2 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Orçamentos</h3>
                    <p className="text-xs text-muted-foreground">{monthName} {selectedYear}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBudgetConfig(false)} 
                  className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
                {/* Orçamentos existentes */}
                {budgets.filter(b => b.month === selectedMonth && b.year === selectedYear).length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Orçamentos ativos</p>
                    <div className="space-y-2">
                      {budgets
                        .filter(b => b.month === selectedMonth && b.year === selectedYear)
                        .map(b => {
                          const status = getBudgetStatus(b.category);
                          return (
                            <div key={b.id} className="flex items-center justify-between bg-muted/40 rounded-xl p-3.5">
                              <div className="flex items-center gap-2.5">
                                <CategoryIcon category={b.category} size={32} iconSize={17} />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{b.category}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(status.spent)} de {formatCurrency(status.limit)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  status.percentage > 100 
                                    ? 'bg-red-500/10 text-red-500' 
                                    : status.percentage > 70 
                                    ? 'bg-yellow-500/10 text-yellow-600' 
                                    : 'bg-green-500/10 text-green-600'
                                }`}>
                                  {status.percentage.toFixed(0)}%
                                </span>
                                <button 
                                  onClick={() => removeBudget(b.category)} 
                                  className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Separador */}
                <div className="border-t border-border/50 my-4" />

                {/* Adicionar novo */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Novo orçamento</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                      <select
                        value={configCategory}
                        onChange={e => setConfigCategory(e.target.value)}
                        className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground border border-border/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      >
                        <option value="">Selecione a categoria</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Limite mensal</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={configLimit}
                        onChange={e => setConfigLimit(e.target.value)}
                        className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground border border-border/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                    <button
                      onClick={handleAddBudget}
                      disabled={!configCategory || !configLimit}
                      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Orçamento
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default MonthlyAnalysisPage;
