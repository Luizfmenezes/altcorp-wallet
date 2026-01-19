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
  isRecurring?: boolean;
  frequency?: 'monthly' | 'weekly';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface InvoiceItem {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  owner: string;
  isRecurring?: boolean;
  frequency?: 'monthly' | 'weekly';
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
  budgets: Budget[];
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
  setPeople: (people: string[]) => void;
  setInitialIncome: (amount: number) => void;
  setInitialCards: (cards: Array<{ name: string; limit: number }>) => void;
  setBudget: (category: string, limit: number) => void;
  removeBudget: (category: string) => void;
  getBudgetStatus: (category: string) => { spent: number; limit: number; percentage: number };
  checkRecurringExpenses: () => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getTotalDirectExpenses: () => number;
  getBalance: () => number;
  getPreviousMonthExpenses: () => number;
  getExpensesByCategory: () => { category: string; amount: number }[];
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [lastRecurringCheck, setLastRecurringCheck] = useState<string>(
    localStorage.getItem('lastRecurringCheck') || ''
  );

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

  const setPeopleList = (newPeople: string[]) => {
    setPeople(newPeople);
  };

  const setInitialIncome = (amount: number) => {
    // Clear existing fixed income and set new one
    setIncomes([
      { id: generateId(), description: 'Salário', amount, type: 'fixed' },
    ]);
  };

  const setInitialCards = (newCards: Array<{ name: string; limit: number }>) => {
    const cardColors = ['#8B5CF6', '#F97316', '#EF4444', '#3B82F6', '#10B981', '#6366F1'];
    setCards(
      newCards.map((card, index) => ({
        id: generateId(),
        name: card.name,
        type: 'credit' as const,
        color: cardColors[index % cardColors.length],
        invoiceItems: [],
      }))
    );
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

  // Budget Management
  const setBudget = (category: string, limit: number) => {
    setBudgets(prev => {
      const existing = prev.find(
        b => b.category === category && b.month === selectedMonth && b.year === selectedYear
      );
      if (existing) {
        return prev.map(b =>
          b.id === existing.id ? { ...b, limit } : b
        );
      }
      return [...prev, {
        id: generateId(),
        category,
        limit,
        month: selectedMonth,
        year: selectedYear,
      }];
    });
  };

  const removeBudget = (category: string) => {
    setBudgets(prev =>
      prev.filter(
        b => !(b.category === category && b.month === selectedMonth && b.year === selectedYear)
      )
    );
  };

  const getBudgetStatus = (category: string) => {
    const budget = budgets.find(
      b => b.category === category && b.month === selectedMonth && b.year === selectedYear
    );
    
    if (!budget) {
      return { spent: 0, limit: 0, percentage: 0 };
    }

    // Calculate spent from both direct expenses and card expenses
    const directSpent = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return (
          exp.category === category &&
          expDate.getMonth() === selectedMonth &&
          expDate.getFullYear() === selectedYear
        );
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    const cardSpent = cards.reduce((total, card) => {
      return total + card.invoiceItems
        .filter(item => {
          const itemDate = new Date(item.date);
          return (
            item.category === category &&
            itemDate.getMonth() === selectedMonth &&
            itemDate.getFullYear() === selectedYear
          );
        })
        .reduce((sum, item) => sum + item.amount, 0);
    }, 0);

    const spent = directSpent + cardSpent;
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    return { spent, limit: budget.limit, percentage };
  };

  // Recurring Expenses Logic
  const checkRecurringExpenses = () => {
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${today.getMonth()}`;
    
    // Check if we already processed this month
    if (lastRecurringCheck === currentMonthYear) {
      return;
    }

    // Get last month's date
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthNum = lastMonth.getMonth();
    const lastMonthYear = lastMonth.getFullYear();

    // Find recurring expenses from last month
    const recurringExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return (
        exp.isRecurring &&
        exp.frequency === 'monthly' &&
        expDate.getMonth() === lastMonthNum &&
        expDate.getFullYear() === lastMonthYear
      );
    });

    // Clone them to current month
    if (recurringExpenses.length > 0) {
      const newExpenses = recurringExpenses.map(exp => {
        const newDate = new Date(today.getFullYear(), today.getMonth(), new Date(exp.date).getDate());
        return {
          ...exp,
          id: generateId(),
          date: newDate.toISOString().split('T')[0],
        };
      });

      setExpenses(prev => [...prev, ...newExpenses]);
      
      // Update last check
      localStorage.setItem('lastRecurringCheck', currentMonthYear);
      setLastRecurringCheck(currentMonthYear);
    }

    // Check recurring card invoice items (reuse same date variables)
    cards.forEach(card => {
      const recurringItems = card.invoiceItems.filter(item => {
        const itemDate = new Date(item.date);
        return (
          item.isRecurring &&
          item.frequency === 'monthly' &&
          itemDate.getMonth() === lastMonthNum &&
          itemDate.getFullYear() === lastMonthYear
        );
      });

      if (recurringItems.length > 0) {
        const newItems = recurringItems.map(item => {
          const newDate = new Date(today.getFullYear(), today.getMonth(), new Date(item.date).getDate());
          return {
            ...item,
            id: generateId(),
            date: newDate.toISOString().split('T')[0],
          };
        });

        // Add new recurring items to the card
        const updatedCard = {
          ...card,
          invoiceItems: [...card.invoiceItems, ...newItems],
        };

        setCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
      }
    });
  };

  // Get previous month expenses for comparison
  const getPreviousMonthExpenses = () => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const cardExpenses = cards.reduce((total, card) => {
      return total + card.invoiceItems
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);
    }, 0);

    const directExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === prevMonth && expDate.getFullYear() === prevYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    return cardExpenses + directExpenses;
  };

  // Get expenses grouped by category
  const getExpensesByCategory = () => {
    const categoryMap: { [key: string]: number } = {};

    // Direct expenses
    expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
      })
      .forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
      });

    // Card expenses
    cards.forEach(card => {
      card.invoiceItems
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        })
        .forEach(item => {
          categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
        });
    });

    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));
  };

  // Check recurring expenses on mount
  React.useEffect(() => {
    checkRecurringExpenses();
  }, []);

  return (
    <FinanceContext.Provider value={{
      incomes,
      expenses,
      cards,
      people,
      budgets,
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
      setPeople: setPeopleList,
      setInitialIncome,
      setInitialCards,
      setBudget,
      removeBudget,
      getBudgetStatus,
      checkRecurringExpenses,
      getTotalIncome,
      getTotalExpenses,
      getTotalDirectExpenses,
      getBalance,
      getPreviousMonthExpenses,
      getExpensesByCategory,
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
