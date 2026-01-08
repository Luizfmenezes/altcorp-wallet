import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { MonthSelector } from '@/components/MonthSelector';
import { BalanceCard } from '@/components/BalanceCard';
import { useFinance } from '@/contexts/FinanceContext';

const Dashboard: React.FC = () => {
  const { getTotalIncome, getTotalExpenses, getBalance } = useFinance();

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-center tracking-wide">
          ORÇAMENTO MENSAL
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Month Selector */}
        <MonthSelector />

        {/* Balance Cards */}
        <div className="space-y-3">
          <BalanceCard
            title="Saldo Previsto"
            value={totalIncome}
            type="neutral"
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
          />
          
          <BalanceCard
            title="Saldo Real"
            value={totalIncome - totalExpenses}
            type="positive"
            icon={<Scale className="w-5 h-5 text-success" />}
          />
          
          <BalanceCard
            title="Despesas Totais"
            value={totalExpenses}
            type="negative"
            icon={<TrendingDown className="w-5 h-5 text-destructive" />}
          />

          {/* Difference Card */}
          <div className={`balance-card border animate-fade-in ${
            balance >= 0 
              ? 'bg-success/5 border-success/20' 
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Diferença
              </span>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {balance >= 0 ? '+' : ''}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? 'Você está no positivo!' : 'Atenção: gastos excedem a receita'}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
