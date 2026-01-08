import React from 'react';
import { TrendingUp, TrendingDown, Scale, PieChart, BarChart3, TrendingUp as TrendIcon } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { MonthSelector } from '@/components/MonthSelector';
import { BalanceCard } from '@/components/BalanceCard';
import { ExpensesPieChart } from '@/components/charts/ExpensesPieChart';
import { IncomeExpenseBarChart } from '@/components/charts/IncomeExpenseBarChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { useFinance } from '@/contexts/FinanceContext';

const Dashboard: React.FC = () => {
  const { getTotalIncome, getTotalExpenses, getBalance } = useFinance();

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide">
            ORÇAMENTO MENSAL
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-7xl mx-auto">
        {/* Month Selector */}
        <MonthSelector />

        {/* Balance Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <BalanceCard
            title="Receitas"
            value={totalIncome}
            type="neutral"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
          />
          
          <BalanceCard
            title="Despesas"
            value={totalExpenses}
            type="negative"
            icon={<TrendingDown className="w-4 h-4 text-destructive" />}
          />

          {/* Main Balance Card - Full width on mobile, spans 2 cols on lg */}
          <div className={`col-span-2 balance-card border animate-fade-in ${
            balance >= 0 
              ? 'bg-success/5 border-success/20' 
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Saldo do Mês
              </span>
              <Scale className={`w-5 h-5 ${balance >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {balance >= 0 ? '+' : ''}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? '🎉 Você está no positivo!' : '⚠️ Atenção: gastos excedem a receita'}
            </p>
          </div>
        </div>

        {/* Charts Section - Responsive Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Income vs Expense Bar Chart */}
          <div className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Resumo Financeiro</h2>
            </div>
            <IncomeExpenseBarChart />
          </div>

          {/* Monthly Trend Chart */}
          <div className="card-finance animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendIcon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Tendência Mensal</h2>
            </div>
            <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span>Receita</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>Despesa</span>
              </div>
            </div>
            <MonthlyTrendChart />
          </div>

          {/* Expenses by Category Pie Chart */}
          <div className="card-finance animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Despesas por Categoria</h2>
            </div>
            <ExpensesPieChart />
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
