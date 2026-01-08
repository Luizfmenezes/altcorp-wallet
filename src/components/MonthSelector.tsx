import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';

export const MonthSelector: React.FC = () => {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useFinance();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="flex items-center justify-between bg-card rounded-2xl p-3 shadow-card">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="h-10 w-10 rounded-xl hover:bg-secondary"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <div className="text-center">
        <span className="text-lg font-semibold text-foreground">
          {getMonthName(selectedMonth)}
        </span>
        <span className="text-sm text-muted-foreground ml-2">
          {selectedYear}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        className="h-10 w-10 rounded-xl hover:bg-secondary"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};
