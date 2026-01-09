import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';

export const IncomeGrowthChart: React.FC = () => {
  const { incomes, selectedMonth, selectedYear } = useFinance();

  const getMonthIncome = (month: number, year: number) => {
    const fixedIncome = incomes
      .filter((i) => i.type === 'fixed')
      .reduce((sum, i) => sum + i.amount, 0);

    const extraIncome = incomes
      .filter((i) => i.type === 'extra' && i.month === month && i.year === year)
      .reduce((sum, i) => sum + i.amount, 0);

    return fixedIncome + extraIncome;
  };

  const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

  const currentIncome = getMonthIncome(selectedMonth, selectedYear);
  const previousIncome = getMonthIncome(previousMonth, previousYear);

  const data = [
    {
      name: getMonthName(previousMonth).substring(0, 3),
      value: previousIncome,
      fill: 'hsl(var(--muted-foreground))',
    },
    {
      name: getMonthName(selectedMonth).substring(0, 3),
      value: currentIncome,
      fill: 'hsl(var(--success))',
    },
  ];

  const growth = previousIncome > 0 
    ? ((currentIncome - previousIncome) / previousIncome * 100).toFixed(1)
    : currentIncome > 0 ? '100' : '0';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value: number) => formatCurrency(value)}
                style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <span className={`text-sm font-semibold ${parseFloat(growth) >= 0 ? 'text-success' : 'text-destructive'}`}>
          {parseFloat(growth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(growth))}% 
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          vs. mês anterior
        </span>
      </div>
    </div>
  );
};
