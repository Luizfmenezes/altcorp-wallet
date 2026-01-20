import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';

export const MonthlyTrendChart: React.FC = () => {
  const { selectedMonth, getTotalIncome, getTotalExpenses } = useFinance();

  // Generate mock data for last 6 months trend
  const generateTrendData = () => {
    const income = getTotalIncome();
    const expenses = getTotalExpenses();
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (selectedMonth - 5 + i + 12) % 12;
      const variance = 0.8 + Math.random() * 0.4;
      const expenseVariance = 0.7 + Math.random() * 0.5;
      
      return {
        month: getMonthName(monthIndex).substring(0, 3),
        receita: Math.round(income * variance),
        despesa: Math.round(expenses * expenseVariance),
      };
    });
  };

  const data = generateTrendData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis hide />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'receita' ? 'Receita' : 'Despesa'
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="hsl(142, 76%, 36%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorReceita)"
        />
        <Area
          type="monotone"
          dataKey="despesa"
          stroke="hsl(0, 84%, 60%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorDespesa)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
