import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarViewProps {
  month: number;
  year: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ month, year }) => {
  const { expenses, cards } = useFinance();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Get all expenses for a specific date
  const getExpensesForDate = (date: string) => {
    const directExpenses = expenses.filter(exp => exp.date === date);
    
    const cardExpenses = cards.flatMap(card =>
      card.invoiceItems
        .filter(item => item.date === date)
        .map(item => ({
          ...item,
          cardName: card.name,
          cardColor: card.color,
        }))
    );

    return [...directExpenses, ...cardExpenses];
  };

  // Get total amount for a specific date
  const getTotalForDate = (date: string) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayClick = (day: number | null) => {
    if (day === null) return;
    const date = formatDate(day);
    const dayExpenses = getExpensesForDate(date);
    if (dayExpenses.length > 0) {
      setSelectedDate(date);
    }
  };

  const selectedDayExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];
  const selectedDayTotal = selectedDate ? getTotalForDate(selectedDate) : 0;

  return (
    <>
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(day);
            const total = getTotalForDate(dateStr);
            const hasExpenses = total > 0;
            const isToday = 
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <motion.button
                key={day}
                whileHover={hasExpenses ? { scale: 1.05 } : {}}
                whileTap={hasExpenses ? { scale: 0.95 } : {}}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center relative
                  transition-colors text-sm
                  ${hasExpenses ? 'cursor-pointer hover:bg-primary/10' : 'cursor-default'}
                  ${isToday ? 'bg-primary/20 font-bold' : ''}
                `}
              >
                <span className={`${hasExpenses ? 'font-semibold' : ''} ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {day}
                </span>
                {hasExpenses && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                  </div>
                )}
                {hasExpenses && (
                  <span className="text-[10px] text-red-500 font-medium mt-0.5">
                    {formatCurrency(total).replace('R$', '').trim().substring(0, 6)}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Com gastos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span>Hoje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gastos de {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Total do dia */}
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Total do dia</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(selectedDayTotal)}</p>
            </div>

            {/* Lista de gastos */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Detalhamento</h4>
              <AnimatePresence>
                {selectedDayExpenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-muted/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                            {expense.category}
                          </span>
                          {('cardName' in expense) && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: (expense as any).cardColor }}
                            >
                              {String((expense as any).cardName)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-destructive ml-2">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    {expense.owner && (
                      <p className="text-xs text-muted-foreground">Titular: {expense.owner}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
