import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Income {
  id: string;
  description: string;
  amount: number;
  type: 'fixed' | 'extra';
  month?: number;
  year?: number;
}

export interface InvoiceItem {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface Card {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'bank';
  color: string;
  invoiceItems: InvoiceItem[];
}

interface FinanceContextType {
  incomes: Income[];
  cards: Card[];
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  removeIncome: (id: string) => void;
  addCard: (card: Omit<Card, 'id' | 'invoiceItems'>) => void;
  removeCard: (id: string) => void;
  addInvoiceItem: (cardId: string, item: Omit<InvoiceItem, 'id'>) => void;
  removeInvoiceItem: (cardId: string, itemId: string) => void;
  importCSV: (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getMonthName = (month: number) => MONTHS[month];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [incomes, setIncomes] = useState<Income[]>([
    { id: '1', description: 'Salário', amount: 5000, type: 'fixed' },
    { id: '2', description: 'Freelance', amount: 1500, type: 'extra', month: currentDate.getMonth(), year: currentDate.getFullYear() },
  ]);

  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      name: 'Cartão Nubank',
      type: 'credit',
      color: '#8B5CF6',
      invoiceItems: [
        { id: '1', date: '2024-01-05', description: 'Supermercado', category: 'Alimentação', amount: 450.00 },
        { id: '2', date: '2024-01-10', description: 'Netflix', category: 'Streaming', amount: 55.90 },
        { id: '3', date: '2024-01-15', description: 'Combustível', category: 'Transporte', amount: 200.00 },
      ],
    },
    {
      id: '2',
      name: 'Conta Itaú',
      type: 'bank',
      color: '#F97316',
      invoiceItems: [
        { id: '1', date: '2024-01-01', description: 'Aluguel', category: 'Moradia', amount: 1500.00 },
        { id: '2', date: '2024-01-05', description: 'Internet', category: 'Serviços', amount: 120.00 },
      ],
    },
  ]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: generateId() }]);
  };

  const removeIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addCard = (card: Omit<Card, 'id' | 'invoiceItems'>) => {
    setCards(prev => [...prev, { ...card, id: generateId(), invoiceItems: [] }]);
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const addInvoiceItem = (cardId: string, item: Omit<InvoiceItem, 'id'>) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          invoiceItems: [...card.invoiceItems, { ...item, id: generateId() }],
        };
      }
      return card;
    }));
  };

  const removeInvoiceItem = (cardId: string, itemId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          invoiceItems: card.invoiceItems.filter(item => item.id !== itemId),
        };
      }
      return card;
    }));
  };

  const importCSV = (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          invoiceItems: [
            ...card.invoiceItems,
            ...items.map(item => ({ ...item, id: generateId() })),
          ],
        };
      }
      return card;
    }));
  };

  const getTotalIncome = () => {
    const fixedIncome = incomes
      .filter(i => i.type === 'fixed')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const extraIncome = incomes
      .filter(i => i.type === 'extra' && i.month === selectedMonth && i.year === selectedYear)
      .reduce((sum, i) => sum + i.amount, 0);
    
    return fixedIncome + extraIncome;
  };

  const getTotalExpenses = () => {
    return cards.reduce((total, card) => {
      return total + card.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    }, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  return (
    <FinanceContext.Provider value={{
      incomes,
      cards,
      selectedMonth,
      selectedYear,
      setSelectedMonth,
      setSelectedYear,
      addIncome,
      removeIncome,
      addCard,
      removeCard,
      addInvoiceItem,
      removeInvoiceItem,
      importCSV,
      getTotalIncome,
      getTotalExpenses,
      getBalance,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
