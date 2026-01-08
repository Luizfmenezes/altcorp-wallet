import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';

const COLORS = [
  'hsl(217, 91%, 60%)',   // primary blue
  'hsl(142, 76%, 36%)',   // green
  'hsl(38, 92%, 50%)',    // orange
  'hsl(280, 65%, 60%)',   // purple
  'hsl(0, 84%, 60%)',     // red
  'hsl(190, 80%, 45%)',   // cyan
  'hsl(330, 70%, 55%)',   // pink
  'hsl(60, 70%, 45%)',    // yellow
];

export const ExpensesPieChart: React.FC = () => {
  const { cards } = useFinance();

  // Aggregate expenses by category
  const categoryTotals = cards.reduce((acc, card) => {
    card.invoiceItems.forEach((item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhuma despesa registrada
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
