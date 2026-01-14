import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Income {
  id: string;
  description: string;
  amount: number;
  type: 'fixed' | 'extra';
  month?: number;
  year?: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  owner: string;
}

export interface InvoiceItem {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  owner: string;
  installmentInfo?: {
    currentInstallment: number;
    totalInstallments: number;
    originalAmount: number;
  };
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
  expenses: Expense[];
  cards: Card[];
  people: string[];
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  removeIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  addCard: (card: Omit<Card, 'id' | 'invoiceItems'>) => void;
  removeCard: (id: string) => void;
  addInvoiceItem: (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => void;
  updateInvoiceItem: (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => void;
  removeInvoiceItem: (cardId: string, itemId: string) => void;
  importCSV: (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => void;
  addPerson: (name: string) => void;
  removePerson: (name: string) => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getTotalDirectExpenses: () => number;
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
  const [people, setPeople] = useState<string[]>(['Eu', 'Ana', 'Outro']);

  const [incomes, setIncomes] = useState<Income[]>([
    { id: '1', description: 'Salário', amount: 5000, type: 'fixed' },
    { id: '2', description: 'Freelance', amount: 1500, type: 'extra', month: currentDate.getMonth(), year: currentDate.getFullYear() },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', date: '2026-01-03', description: 'Mercado', category: 'Alimentação', amount: 320.00, owner: 'Eu' },
    { id: '2', date: '2026-01-05', description: 'Uber', category: 'Transporte', amount: 45.50, owner: 'Eu' },
    { id: '3', date: '2026-01-08', description: 'Farmácia', category: 'Saúde', amount: 89.90, owner: 'Ana' },
    { id: '4', date: '2026-01-10', description: 'Restaurante', category: 'Alimentação', amount: 156.00, owner: 'Eu' },
    { id: '5', date: '2026-01-12', description: 'Conta de Luz', category: 'Moradia', amount: 180.00, owner: 'Eu' },
  ]);

  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      name: 'Cartão Nubank',
      type: 'credit',
      color: '#8B5CF6',
      invoiceItems: [
        { id: '1', date: '2026-01-05', description: 'Supermercado', category: 'Alimentação', amount: 450.00, owner: 'Eu' },
        { id: '2', date: '2026-01-10', description: 'Netflix', category: 'Streaming', amount: 55.90, owner: 'Eu' },
        { id: '3', date: '2026-01-15', description: 'Combustível', category: 'Transporte', amount: 200.00, owner: 'Ana' },
        { id: '4', date: '2026-01-20', description: 'Celular (1/3)', category: 'Compras', amount: 500.00, owner: 'Eu', installmentInfo: { currentInstallment: 1, totalInstallments: 3, originalAmount: 1500 } },
        { id: '5', date: '2026-02-20', description: 'Celular (2/3)', category: 'Compras', amount: 500.00, owner: 'Eu', installmentInfo: { currentInstallment: 2, totalInstallments: 3, originalAmount: 1500 } },
        { id: '6', date: '2026-03-20', description: 'Celular (3/3)', category: 'Compras', amount: 500.00, owner: 'Eu', installmentInfo: { currentInstallment: 3, totalInstallments: 3, originalAmount: 1500 } },
      ],
    },
    {
      id: '2',
      name: 'Conta Itaú',
      type: 'bank',
      color: '#F97316',
      invoiceItems: [
        { id: '1', date: '2026-01-01', description: 'Aluguel', category: 'Moradia', amount: 1500.00, owner: 'Eu' },
        { id: '2', date: '2026-01-05', description: 'Internet', category: 'Serviços', amount: 120.00, owner: 'Eu' },
      ],
    },
  ]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: generateId() }]);
  };

  const removeIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: generateId() }]);
  };

  const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id'>>) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        return { ...exp, ...updates };
      }
      return exp;
    }));
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addCard = (card: Omit<Card, 'id' | 'invoiceItems'>) => {
    setCards(prev => [...prev, { ...card, id: generateId(), invoiceItems: [] }]);
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const addInvoiceItem = (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        const newItems: InvoiceItem[] = [];
        
        if (installments && installments > 1) {
          const installmentAmount = parseFloat((item.amount / installments).toFixed(2));
          const baseDate = new Date(item.date);
          
          for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + i);
            
            newItems.push({
              ...item,
              id: generateId(),
              date: installmentDate.toISOString().split('T')[0],
              description: `${item.description} (${i + 1}/${installments})`,
              amount: installmentAmount,
              installmentInfo: {
                currentInstallment: i + 1,
                totalInstallments: installments,
                originalAmount: item.amount,
              },
            });
          }
        } else {
          newItems.push({ ...item, id: generateId() });
        }
        
        return {
          ...card,
          invoiceItems: [...card.invoiceItems, ...newItems],
        };
      }
      return card;
    }));
  };

  const updateInvoiceItem = (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          invoiceItems: card.invoiceItems.map(item => {
            if (item.id === itemId) {
              return { ...item, ...updates };
            }
            return item;
          }),
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

  const addPerson = (name: string) => {
    if (name.trim() && !people.includes(name.trim())) {
      setPeople(prev => [...prev, name.trim()]);
    }
  };

  const removePerson = (name: string) => {
    if (name !== 'Eu') {
      setPeople(prev => prev.filter(p => p !== name));
    }
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
    // Card expenses for selected month
    const cardExpenses = cards.reduce((total, card) => {
      return total + card.invoiceItems
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);
    }, 0);

    // Direct expenses for selected month
    const directExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    return cardExpenses + directExpenses;
  };

  const getTotalDirectExpenses = () => {
    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  return (
    <FinanceContext.Provider value={{
      incomes,
      expenses,
      cards,
      people,
      selectedMonth,
      selectedYear,
      setSelectedMonth,
      setSelectedYear,
      addIncome,
      removeIncome,
      addExpense,
      updateExpense,
      removeExpense,
      addCard,
      removeCard,
      addInvoiceItem,
      updateInvoiceItem,
      removeInvoiceItem,
      importCSV,
      addPerson,
      removePerson,
      getTotalIncome,
      getTotalExpenses,
      getTotalDirectExpenses,
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
