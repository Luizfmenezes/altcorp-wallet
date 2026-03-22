import React, { useState } from 'react';
import { Eye, EyeOff, ChevronRight, BarChart3, ScrollText, TrendingUp, TrendingDown, Calendar, Settings, CreditCard, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BankLogo from '@/components/BankLogo';

const Dashboard: React.FC = () => {
  const { cards, getTotalIncome, getTotalExpenses, getBalance, selectedMonth, selectedYear } = useFinance();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  // Gradiente do header: azul escuro no tema Escuro, azul vibrante nos outros
  const headerStyle = theme === 'dark'
    ? { background: 'linear-gradient(135deg, #0D1A6E 0%, #1A2FA8 100%)' }
    : undefined;
  const headerClassName = theme === 'dark'
    ? 'text-white px-5 pt-12 pb-8 rounded-b-[2rem] lg:rounded-none lg:pt-8'
    : 'bg-gradient-to-br from-blue-600 to-sky-500 text-white px-5 pt-12 pb-8 rounded-b-[2rem] lg:rounded-none lg:pt-8';

  const totalBalance = getBalance();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFirstName = () => {
    if (user?.username) return user.username;
    if (user?.profile?.firstName) return user.profile.firstName;
    if (user?.name) return user.name.split(' ')[0];
    return 'Usuário';
  };

  // Calculate balance per card
  const getCardBalance = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return 0;

    // Se a fatura do mês selecionado já foi paga, saldo = 0
    const isInvoicePaid = (card.paidInvoices ?? []).some(
      p => p.month === selectedMonth && p.year === selectedYear
    );
    if (isInvoicePaid) return 0;

    const cardExpenses = card.invoiceItems
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    if (card.type === 'bank') {
      return getTotalIncome() / cards.length - cardExpenses;
    }
    return -cardExpenses;
  };

  const getCardIcon = (type: string, color: string, icon?: string | null) => {
    return (
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <BankLogo bankId={icon} size={28} fallbackType={type as 'credit' | 'debit' | 'bank'} />
      </div>
    );
  };

  const currentMonthName = getMonthName(selectedMonth);

  // ── Card Item (reutilizado em mobile e desktop) ──
  const renderCardItem = (card: typeof cards[0], index: number, compact = false) => {
    const balance = getCardBalance(card.id);
    const limit = card.creditLimit ?? 0;
    const spent = Math.abs(balance);
    const usagePercent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    let barColor = 'bg-emerald-500';
    if (usagePercent > 80) barColor = 'bg-destructive';
    else if (usagePercent > 50) barColor = 'bg-yellow-500';

    return (
      <motion.button
        key={card.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 + index * 0.05 }}
        onClick={() => navigate(`/wallet/${card.id}`)}
        className={`w-full text-left bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3 min-w-0">
            {getCardIcon(card.type, card.color, card.icon)}
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-sm block truncate">{card.name ?? '—'}</span>
              {card.type === 'credit' && !!card.dueDay && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Venc. dia {card.dueDay}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`font-bold text-sm ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {showBalance ? formatCurrency(balance) : '••••••'}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        {card.type === 'credit' && limit > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{showBalance ? formatCurrency(spent) : '•••'} usado</span>
              <span className="text-[10px] text-muted-foreground">{showBalance ? formatCurrency(limit) : '•••'} limite</span>
            </div>
          </div>
        )}
      </motion.button>
    );
  };

  const creditCards = cards.filter(c => c?.id && c.type === 'credit');
  const bankCards = cards.filter(c => c?.id && c.type !== 'credit');

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* ═══════════════════════════════════════════════════════
          MOBILE LAYOUT (< lg) — mantido exatamente como antes
         ═══════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* Blue Gradient Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={headerClassName}
          style={headerStyle}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                  {user?.profile_photo ? (
                    <img src={user.profile_photo} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-white">
                      {getFirstName().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white/80 text-sm">{getGreeting()},</p>
                  <p className="text-white font-semibold text-lg">{getFirstName()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Mobile Main Content */}
        <div className="px-5 -mt-4 max-w-7xl mx-auto space-y-4">
          {/* Saldo Geral */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-5 shadow-lg border border-border/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Saldo geral</p>
                <p className="text-primary text-sm font-semibold">{currentMonthName} {selectedYear}</p>
              </div>
              <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground hover:text-foreground transition-colors">
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <motion.p className={`text-3xl font-bold tracking-tight ${totalBalance >= 0 ? 'text-foreground' : 'text-destructive'}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              {showBalance ? formatCurrency(totalBalance) : '••••••'}
            </motion.p>
          </motion.div>

          {/* Receitas & Despesas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Receitas</p>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{showBalance ? formatCurrency(getTotalIncome()) : '••••••'}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-500" /></div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Despesas</p>
              </div>
              <p className="text-xl font-bold text-destructive">{showBalance ? formatCurrency(getTotalExpenses()) : '••••••'}</p>
            </div>
          </motion.div>

          {/* Botões de ação */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/history')}
              className={`h-12 flex items-center justify-center gap-2 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm ${theme === 'dark' ? 'hover:brightness-110' : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600'}`}
              style={theme === 'dark' ? { background: 'linear-gradient(90deg, #0D1A6E, #1A2FA8)' } : undefined}
            >
              <ScrollText className="w-4 h-4" /> Extrato
            </button>
            <button onClick={() => navigate('/monthly-analysis')}
              className="h-12 flex items-center justify-center gap-2 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary/5 transition-colors text-sm"
            >
              <BarChart3 className="w-4 h-4" /> Análise Mensal
            </button>
          </motion.div>

          {/* Minhas contas (mobile) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Minhas contas</h2>
            <div className="space-y-3">
              {cards.filter(card => card?.id).map((card, index) => renderCardItem(card, index))}
            </div>
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              onClick={() => navigate('/wallet')}
              className="w-full py-3 px-4 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors text-sm"
            >
              Gerenciar contas
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP LAYOUT (lg+) — layout profissional 
         ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Desktop Header */}
        <div className="px-8 py-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {getFirstName()}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Aqui está o resumo das suas finanças em <span className="font-medium text-primary">{currentMonthName} {selectedYear}</span>
              </p>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm">{showBalance ? 'Ocultar valores' : 'Mostrar valores'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Content Grid */}
        <div className="p-8">
          {/* Top Stats Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Saldo Geral */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Saldo geral</p>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, rgba(43,75,242,0.2), rgba(26,47,168,0.2))'
                      : 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.1))',
                  }}
                >
                  <PiggyBank className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight ${totalBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {showBalance ? formatCurrency(totalBalance) : '••••••'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{currentMonthName} {selectedYear}</p>
            </motion.div>

            {/* Receitas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Receitas</p>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {showBalance ? formatCurrency(getTotalIncome()) : '••••••'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total do mês</p>
            </motion.div>

            {/* Despesas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Despesas</p>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-destructive tracking-tight">
                {showBalance ? formatCurrency(getTotalExpenses()) : '••••••'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total do mês</p>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left Column (3/5) */}
            <div className="col-span-3 space-y-6">
              {/* Acesso Rápido */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <h2 className="text-base font-semibold text-foreground mb-4">Acesso rápido</h2>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => navigate('/history')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background hover:bg-accent border border-border/50 transition-all group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                      style={{
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #2B4BF2, #1A2FA8)'
                          : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      }}
                    >
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Extrato</span>
                  </button>
                  <button
                    onClick={() => navigate('/monthly-analysis')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background hover:bg-accent border border-border/50 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Análise</span>
                  </button>
                  <button
                    onClick={() => navigate('/incomes')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background hover:bg-accent border border-border/50 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Receitas</span>
                  </button>
                  <button
                    onClick={() => navigate('/expenses')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background hover:bg-accent border border-border/50 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Despesas</span>
                  </button>
                </div>
              </motion.div>

              {/* Minhas Contas (Banco) */}
              {bankCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-foreground">Minhas contas</h2>
                    <button onClick={() => navigate('/wallet')} className="text-xs text-primary hover:underline font-medium">Ver tudo</button>
                  </div>
                  <div className="space-y-2">
                    {bankCards.map((card, index) => renderCardItem(card, index, true))}
                  </div>
                </motion.div>
              )}

              {/* Todos os cards (se não tem separação) */}
              {bankCards.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-foreground">Minhas contas</h2>
                    <button onClick={() => navigate('/wallet')} className="text-xs text-primary hover:underline font-medium">Gerenciar</button>
                  </div>
                  <div className="space-y-2">
                    {cards.filter(c => c?.id).map((card, index) => renderCardItem(card, index, true))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column (2/5) */}
            <div className="col-span-2 space-y-6">
              {/* Meus Cartões (Crédito) */}
              {creditCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-foreground">Meus cartões</h2>
                    <button onClick={() => navigate('/wallet')} className="text-xs text-primary hover:underline font-medium">Ver tudo</button>
                  </div>
                  <div className="space-y-3">
                    {creditCards.map((card, index) => {
                      const balance = getCardBalance(card.id);
                      const limit = card.creditLimit ?? 0;
                      const spent = Math.abs(balance);
                      const usagePercent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                      let barColor = 'bg-emerald-500';
                      if (usagePercent > 80) barColor = 'bg-destructive';
                      else if (usagePercent > 50) barColor = 'bg-yellow-500';

                      return (
                        <button
                          key={card.id}
                          onClick={() => navigate(`/wallet/${card.id}`)}
                          className="w-full text-left p-4 rounded-xl bg-background border border-border/50 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {getCardIcon(card.type, card.color, card.icon)}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">{card.name ?? '—'}</p>
                              {card.dueDay && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Venc. dia {card.dueDay}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>

                          {/* Fatura atual */}
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Fatura atual</span>
                            <span className={`font-bold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                              {showBalance ? formatCurrency(spent) : '••••••'}
                            </span>
                          </div>

                          {/* Barra de uso */}
                          {limit > 0 && (
                            <>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePercent}%` }} />
                              </div>
                              <div className="flex justify-between mt-1.5">
                                <span className="text-[11px] text-muted-foreground">
                                  {showBalance ? `${usagePercent.toFixed(0)}% utilizado` : '•••'}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Limite: {showBalance ? formatCurrency(limit) : '•••'}
                                </span>
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Resumo financeiro */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <h2 className="text-base font-semibold text-foreground mb-4">Resumo financeiro</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Receitas</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {showBalance ? formatCurrency(getTotalIncome()) : '••••••'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Despesas</span>
                    <span className="text-sm font-semibold text-destructive">
                      {showBalance ? formatCurrency(getTotalExpenses()) : '••••••'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">Saldo</span>
                    <span className={`text-sm font-bold ${totalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {showBalance ? formatCurrency(totalBalance) : '••••••'}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual */}
                {getTotalIncome() > 0 && (
                  <div className="mt-4">
                    <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(100 - (getTotalExpenses() / getTotalIncome() * 100), 0)}%` }}
                      />
                      <div
                        className="h-full bg-destructive transition-all duration-500"
                        style={{ width: `${Math.min((getTotalExpenses() / getTotalIncome() * 100), 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      {getTotalIncome() > 0
                        ? `Você gastou ${((getTotalExpenses() / getTotalIncome()) * 100).toFixed(0)}% da sua receita`
                        : 'Nenhuma receita registrada'
                      }
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
