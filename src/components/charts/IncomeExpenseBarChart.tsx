import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';

export const IncomeExpenseBarChart: React.FC = () => {
  const { getTotalIncome, getTotalExpenses, getBalance } = useFinance();

  const income = getTotalIncome();
  const expenses = getTotalExpenses();
  const balance = getBalance();

  const data = [
    { name: 'Receitas', value: income, color: 'hsl(142, 76%, 36%)' },
    { name: 'Despesas', value: expenses, color: 'hsl(0, 84%, 60%)' },
    { name: 'Saldo', value: Math.abs(balance), color: balance >= 0 ? 'hsl(217, 91%, 60%)' : 'hsl(38, 92%, 50%)' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis 
          type="category" 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          width={70}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
