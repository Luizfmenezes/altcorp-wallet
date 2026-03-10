import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, CreditCard, ChevronLeft, ChevronRight, Calendar, Filter, Search, Wallet } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'card_expense';
  cardName?: string;
  cardColor?: string;
  owner?: string;
}

const History: React.FC = () => {
  const { incomes, expenses, cards, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, getTotalIncome } = useFinance();
  const navigate = useNavigate();
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [filterCard, setFilterCard] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Navegar entre meses
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Montar lista de transações
  const allTransactions = useMemo<Transaction[]>(() => {
    const txs: Transaction[] = [];

    // Receitas fixas (aparecem como dia 1 do mês)
    incomes
      .filter(i => {
        if (i.type === 'fixed') return true;
        return i.month === selectedMonth && i.year === selectedYear;
      })
      .forEach(inc => {
        const dateStr = inc.type === 'extra' && inc.month !== undefined && inc.year !== undefined
          ? `${inc.year}-${String(inc.month + 1).padStart(2, '0')}-01`
          : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
        txs.push({
          id: `inc-${inc.id}`,
          date: dateStr,
          description: inc.description,
          category: inc.type === 'fixed' ? 'Salário' : 'Renda Extra',
          amount: inc.amount,
          type: 'income',
        });
      });

    // Despesas diretas
    expenses
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .forEach(exp => {
        txs.push({
          id: `exp-${exp.id}`,
          date: exp.date,
          description: exp.description,
          category: exp.category,
          amount: exp.amount,
          type: 'expense',
          owner: exp.owner,
        });
      });

    // Despesas de cartão
    cards.forEach(card => {
      card.invoiceItems
        .filter(item => {
          const d = new Date(item.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .forEach(item => {
          txs.push({
            id: `card-${card.id}-${item.id}`,
            date: item.date,
            description: item.description,
            category: item.category,
            amount: item.amount,
            type: 'card_expense',
            cardName: card.name,
            cardColor: card.color,
            owner: item.owner,
          });
        });
    });

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses, cards, selectedMonth, selectedYear]);

  // Filtrar
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      if (filterDay !== null) {
        const d = new Date(tx.date);
        if (d.getDate() !== filterDay) return false;
      }
      if (filterCard !== null) {
        if (tx.type !== 'card_expense' || tx.cardName !== filterCard) return false;
      }
      if (filterType === 'income' && tx.type !== 'income') return false;
      if (filterType === 'expense' && tx.type !== 'expense' && tx.type !== 'card_expense') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!tx.description.toLowerCase().includes(q) && !tx.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allTransactions, filterDay, filterCard, filterType, searchQuery]);

  // Agrupar por dia
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach(tx => {
      const day = tx.date.substring(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(tx);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredTransactions]);

  // Calcular saldo acumulado por dia
  const getDailyBalance = (dayTransactions: Transaction[]) => {
    const income = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = dayTransactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0);
    return income - expense;
  };

  // Dias do mês para filtro
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${d.getDate()} de ${getMonthName(d.getMonth())} · ${dayNames[d.getDay()]}`;
  };

  // Contadores
  const totalIncoming = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOutgoing = filteredTransactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-sky-500 text-white px-5 pt-12 pb-6 rounded-b-[2rem] md:rounded-none md:pt-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Histórico de Saldos</h1>
          </div>

          {/* Seletor de mês */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button onClick={goToPreviousMonth} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold">{getMonthName(selectedMonth)}</p>
              <p className="text-white/70 text-xs">{selectedYear}</p>
            </div>
            <button onClick={goToNextMonth} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Resumo do período filtrado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs mb-0.5">Entradas</p>
              <p className="text-lg font-bold text-green-200">{formatCurrency(totalIncoming)}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs mb-0.5">Saídas</p>
              <p className="text-lg font-bold text-red-200">{formatCurrency(totalOutgoing)}</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Filtros */}
      <div className="px-5 max-w-4xl mx-auto -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 space-y-3"
        >
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 rounded-xl border-0 focus:ring-2 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filtros inline */}
          <div className="flex gap-2 flex-wrap">
            {/* Tipo */}
            <div className="flex bg-muted/50 rounded-lg p-0.5">
              {(['all', 'income', 'expense'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filterType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>

            {/* Dia */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterDay ?? ''}
                onChange={e => setFilterDay(e.target.value ? Number(e.target.value) : null)}
                className="bg-muted/50 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground border-0 outline-none cursor-pointer"
              >
                <option value="">Todos os dias</option>
                {dayOptions.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>

            {/* Cartão */}
            {cards.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={filterCard ?? ''}
                  onChange={e => setFilterCard(e.target.value || null)}
                  className="bg-muted/50 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground border-0 outline-none cursor-pointer"
                >
                  <option value="">Todos os cartões</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Lista por dia */}
      <div className="px-5 max-w-4xl mx-auto mt-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {groupedByDay.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Wallet className="w-16 h-16 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhuma transação encontrada</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Ajuste os filtros ou selecione outro mês</p>
            </motion.div>
          ) : (
            groupedByDay.map(([day, transactions], groupIndex) => {
              const dayBalance = getDailyBalance(transactions);
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: groupIndex * 0.04 }}
                  className="space-y-1"
                >
                  {/* Header do dia */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-sm font-semibold text-foreground">{formatDate(day)}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      dayBalance >= 0 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {dayBalance >= 0 ? '+' : ''}{formatCurrency(dayBalance)}
                    </span>
                  </div>

                  {/* Transações */}
                  <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30 overflow-hidden">
                    {transactions.map((tx, txIndex) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIndex * 0.04 + txIndex * 0.02 }}
                        className="flex items-center justify-between p-3.5"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Ícone */}
                          {tx.type === 'income' ? (
                            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <ArrowUpCircle className="w-5 h-5 text-green-500" />
                            </div>
                          ) : tx.type === 'card_expense' ? (
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${tx.cardColor}20` }}
                            >
                              <CreditCard className="w-5 h-5" style={{ color: tx.cardColor }} />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                              <ArrowDownCircle className="w-5 h-5 text-red-500" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-muted-foreground">{tx.category}</span>
                              {tx.cardName && (
                                <>
                                  <span className="text-muted-foreground/30">·</span>
                                  <span className="text-xs font-medium" style={{ color: tx.cardColor }}>
                                    {tx.cardName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Valor */}
                        <span className={`text-sm font-bold flex-shrink-0 ml-2 ${
                          tx.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

export default History;
