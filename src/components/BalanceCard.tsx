import React from 'react';

interface BalanceCardProps {
  title: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ title, value, type, icon }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
 
  const getTypeStyles = () => {
    switch (type) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      case 'neutral':
        return 'text-primary';
    }
  };
 
  const getBgStyles = () => {
    switch (type) {
      case 'positive':
        return 'bg-success/5 border-success/20';
      case 'negative':
        return 'bg-destructive/5 border-destructive/20';
      case 'neutral':
        return 'bg-primary/5 border-primary/20';
    }
  };

  return (
    <div className={`balance-card border ${getBgStyles()} animate-fade-in`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl ${type === 'neutral' ? 'bg-primary/10' : type === 'positive' ? 'bg-success/10' : 'bg-destructive/10'}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${getTypeStyles()}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
};
