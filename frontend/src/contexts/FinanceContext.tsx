import React, { createContext, useContext, useState, ReactNode } from 'react';
import { financeService } from '../services/financeService';

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
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addCard: (card: Omit<Card, 'id' | 'invoiceItems'>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  addInvoiceItem: (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => Promise<void>;
  updateInvoiceItem: (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => Promise<void>;
  removeInvoiceItem: (cardId: string, itemId: string) => Promise<void>;
  importCSV: (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => Promise<void>;
  addPerson: (name: string) => void;
  removePerson: (name: string) => void;
  setPeople: (people: string[]) => void;
  setInitialIncome: (amount: number) => Promise<void>;
  setInitialCards: (cards: Array<{ name: string; limit: number }>) => Promise<void>;
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
  loadFinanceData: () => Promise<void>;
  clearFinanceData: () => void;
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
  const [people, setPeopleState] = useState<string[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('altcorp_people');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['Eu'];
      }
    }
    return ['Eu'];
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [lastRecurringCheck, setLastRecurringCheck] = useState<string>(
    localStorage.getItem('lastRecurringCheck') || ''
  );

  const [incomes, setIncomes] = useState<Income[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [cards, setCards] = useState<Card[]>([]);

  // Helper to update people with localStorage sync
  const setPeople = (newPeople: string[]) => {
    setPeopleState(newPeople);
    localStorage.setItem('altcorp_people', JSON.stringify(newPeople));
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    try {
      const newIncome = await financeService.createIncome(income);
      setIncomes(prev => [...prev, newIncome]);
    } catch { /* silent */ }
  };

  const removeIncome = async (id: string) => {
    try {
      await financeService.deleteIncome(id);
      setIncomes(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await financeService.createExpense(expense);
      setExpenses(prev => [...prev, newExpense]);
    } catch { /* silent */ }
  };

  const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id'>>) => {
    try {
      const updatedExpense = await financeService.updateExpense(id, updates);
      setExpenses(prev => prev.map(exp => {
        if (exp.id === id) {
          return { ...exp, ...updatedExpense };
        }
        return exp;
      }));
    } catch { /* silent */ }
  };

  const removeExpense = async (id: string) => {
    try {
      await financeService.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch { /* silent */ }
  };

  const addCard = async (card: Omit<Card, 'id' | 'invoiceItems'>) => {
    try {
      const newCard = await financeService.createCard(card);
      setCards(prev => [...prev, newCard]);
    } catch { /* silent */ }
  };

  const removeCard = async (id: string) => {
    try {
      await financeService.deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch { /* silent */ }
  };

  const addInvoiceItem = async (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => {
    try {
      const newItems = await financeService.addInvoiceItem(cardId, item, installments);
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            invoiceItems: [...card.invoiceItems, ...newItems],
          };
        }
        return card;
      }));
    } catch { /* silent */ }
  };

  const updateInvoiceItem = async (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => {
    try {
      const updatedItem = await financeService.updateInvoiceItem(cardId, itemId, updates);
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            invoiceItems: card.invoiceItems.map(item => {
              if (item.id === itemId) {
                return { ...item, ...updatedItem };
              }
              return item;
            }),
          };
        }
        return card;
      }));
    } catch { /* silent */ }
  };

  const removeInvoiceItem = async (cardId: string, itemId: string) => {
    try {
      await financeService.deleteInvoiceItem(cardId, itemId);
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            invoiceItems: card.invoiceItems.filter(item => item.id !== itemId),
          };
        }
        return card;
      }));
    } catch { /* silent */ }
  };

  const importCSV = async (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => {
    try {
      const addedItems: InvoiceItem[] = [];
      for (const item of items) {
        const created = await financeService.addInvoiceItem(cardId, item);
        addedItems.push(...created);
      }

      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            invoiceItems: [
              ...card.invoiceItems,
              ...addedItems
            ],
          };
        }
        return card;
      }));
    } catch { /* silent */ }
  };

  const addPerson = (name: string) => {
    if (name.trim() && !people.includes(name.trim())) {
      const newPeople = [...people, name.trim()];
      setPeople(newPeople);
    }
  };

  const removePerson = (name: string) => {
    if (name !== 'Eu') {
      const newPeople = people.filter(p => p !== name);
      setPeople(newPeople);
    }
  };

  const setPeopleList = (newPeople: string[]) => {
    setPeople(newPeople);
  };

  const setInitialIncome = async (amount: number) => {
    try {
      const newIncome = await financeService.createIncome({
        description: 'Salário',
        amount,
        type: 'fixed',
      });
      setIncomes([newIncome]);
    } catch {
      setIncomes([
        { id: generateId(), description: 'Salário', amount, type: 'fixed' },
      ]);
    }
  };

  const setInitialCards = async (newCards: Array<{ name: string; limit: number }>) => {
    const cardColors = ['#8B5CF6', '#F97316', '#EF4444', '#3B82F6', '#10B981', '#6366F1'];
    const createdCards: Card[] = [];
    
    for (let index = 0; index < newCards.length; index++) {
      const card = newCards[index];
      try {
        const newCard = await financeService.createCard({
          name: card.name,
          type: 'credit',
          color: cardColors[index % cardColors.length],
        });
        createdCards.push(newCard);
      } catch { /* silent */ }
    }
    
    setCards(createdCards);
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

  // Function to load finance data (called after login)
  const loadFinanceData = async () => {
    try {
      const [loadedIncomes, loadedExpenses, loadedCards] = await Promise.all([
        financeService.getIncomes(),
        financeService.getExpenses(),
        financeService.getCards()
      ]);
      setIncomes(loadedIncomes);
      setExpenses(loadedExpenses);
      setCards(loadedCards);
      
      // Load people from localStorage
      const savedPeople = localStorage.getItem('altcorp_people');
      if (savedPeople) {
        try {
          const parsed = JSON.parse(savedPeople);
          setPeopleState(parsed);
        } catch {
          setPeopleState(['Eu']);
        }
      }
    } catch { /* silent */ }
  };

  const clearFinanceData = () => {
    setIncomes([]);
    setExpenses([]);
    setCards([]);
    setBudgets([]);
  };

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
      loadFinanceData,
      clearFinanceData,
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
