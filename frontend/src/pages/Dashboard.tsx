import React, { useState } from 'react';
import { Eye, EyeOff, MessageCircle, Bell, CreditCard, Building2, ChevronRight, BarChart3, ScrollText } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { cards, getTotalIncome, getTotalExpenses, getBalance, selectedMonth, selectedYear } = useFinance();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  const totalBalance = getBalance();
  const totalIncome = getTotalIncome();

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
    if (user?.profile?.firstName) return user.profile.firstName;
    if (user?.name) return user.name.split(' ')[0];
    return 'Usuário';
  };

  // Calculate balance per card (simulated - using income minus card expenses)
  const getCardBalance = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return 0;
    
    const cardExpenses = card.invoiceItems
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    
    if (card.type === 'bank') {
      return totalIncome / cards.length - cardExpenses;
    }
    return -cardExpenses;
  };

  const getCardIcon = (type: string, color: string) => {
    if (type === 'bank') {
      return (
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Building2 className="w-5 h-5 text-white" />
        </div>
      );
    }
    return (
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <CreditCard className="w-5 h-5 text-white" />
      </div>
    );
  };

  const currentMonthName = getMonthName(selectedMonth);

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Blue Gradient Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-sky-500 text-white px-5 pt-12 pb-8 rounded-b-[2rem] md:rounded-none md:pt-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-white">
                    {getFirstName().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Greeting */}
              <div>
                <p className="text-white/80 text-sm">{getGreeting()},</p>
                <p className="text-white font-semibold text-lg">{getFirstName()}</p>
              </div>
            </div>
          
            {/* Action Icons */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </button>
            </div>
        </div>

        {/* Cards Bar + Análise Mensal */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button 
            onClick={() => navigate('/monthly-analysis')}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-4 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-semibold">Análise Mensal</span>
          </button>
        </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="px-5 md:px-6 lg:px-8 -mt-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Saldo + Stats */}
          <div className="lg:col-span-2 space-y-6">
        {/* General Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 shadow-lg border border-border/50"
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">Saldo geral</span>
              <p className="text-primary text-sm font-semibold -mt-0.5">{currentMonthName} {selectedYear}</p>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <motion.p 
            className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            {showBalance ? formatCurrency(totalBalance) : '••••••'}
          </motion.p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Receitas</p>
              <p className="text-lg font-bold text-success">
                {showBalance ? formatCurrency(getTotalIncome()) : '••••••'}
              </p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Despesas</p>
              <p className="text-lg font-bold text-destructive">
                {showBalance ? formatCurrency(getTotalExpenses()) : '••••••'}
              </p>
            </div>
          </div>

          {/* Botão Histórico de Saldos / Extrato */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => navigate('/history')}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <ScrollText className="w-5 h-5" />
            Histórico de Saldos / Extrato
          </motion.button>
        </motion.div>
        </div>

          {/* Coluna direita: Minhas Contas */}
          <div className="space-y-4">
        {/* My Accounts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground">Minhas contas</h2>
          
          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
            {cards.filter(card => card && card.id).map((card, index) => {
              const balance = getCardBalance(card.id);
              return (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => navigate(`/wallet/${card.id}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getCardIcon(card.type, card.color)}
                    <span className="font-medium text-foreground">{card.name ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {showBalance ? formatCurrency(balance) : '••••••'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Manage Accounts Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/wallet')}
            className="w-full py-3 px-4 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
          >
            Gerenciar contas
          </motion.button>
        </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
