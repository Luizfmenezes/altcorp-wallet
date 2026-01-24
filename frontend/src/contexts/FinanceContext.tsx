import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { financeService } from '../services/financeService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

// Interfaces
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
  updateCard: (id: string, updates: Partial<Omit<Card, 'id' | 'invoiceItems'>>) => void;
  removeCard: (id: string) => Promise<void>;
  addInvoiceItem: (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => Promise<void>;
  updateInvoiceItem: (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => void;
  removeInvoiceItem: (cardId: string, itemId: string) => Promise<void>;
  importCSV: (cardId: string, items: Omit<InvoiceItem, 'id'>[]) => void;
  addPerson: (name: string) => void;
  removePerson: (name: string) => void;
  setPeople: (people: string[]) => void;
  setInitialIncome: (amount: number) => void;
  setInitialCards: (cards: Array<{ name: string; limit: number }>) => void;
  setBudget: (category: string, limit: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  getBudgetStatus: (category: string) => { spent: number; limit: number; percentage: number };
  checkRecurringExpenses: () => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getTotalDirectExpenses: () => number;
  getBalance: () => number;
  getPreviousMonthExpenses: () => number;
  getExpensesByCategory: () => { category: string; amount: number }[];
  getFilteredExpenses: () => Expense[];
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getMonthName = (month: number) => MONTHS[month];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // PROTEÇÃO NO LOCALSTORAGE
  const [people, setPeople] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('altcorp_people');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garante que é um array e que todos os itens são strings válidas
        if (Array.isArray(parsed)) {
            return parsed.filter(p => p && typeof p === 'string');
        }
      }
      return ['Eu'];
    } catch {
      return ['Eu'];
    }
  });

  const fetchData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [incomesData, expensesData, cardsData, budgetsData] = await Promise.all([
        financeService.getIncomes(),
        financeService.getExpenses(),
        financeService.getCards(),
        financeService.getBudgets(),
      ]);
      
      setIncomes(Array.isArray(incomesData) ? incomesData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({ title: 'Erro de Conexão', description: 'Não foi possível carregar os dados.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('altcorp_people', JSON.stringify(people));
  }, [people]);

  // === HELPER INTELIGENTE DE FILTRO ===
  const isExpenseVisible = (exp: Expense) => {
    const expDate = new Date(exp.date);
    const targetDate = new Date(selectedYear, selectedMonth, 1);
    const expStart = new Date(expDate.getFullYear(), expDate.getMonth(), 1);

    if (expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear) return true;
    if (exp.isRecurring) {
        if (expStart <= targetDate) return true;
    }
    return false;
  };

  const getFilteredExpenses = () => {
    return (expenses || []).filter(isExpenseVisible);
  }

  // === FUNÇÕES DO CONTEXTO ===

  // 🛡️ CORREÇÃO CRÍTICA DO ADDPERSON
  const addPerson = (name: string) => {
    // 1. Se for nulo/undefined, aborta
    if (!name) return;
    
    // 2. Converte para string para garantir
    const safeName = String(name);

    // 3. Usa safeName na verificação e na inserção
    if (safeName.trim() && !people.includes(safeName.trim())) {
      setPeople(prev => [...prev, safeName.trim()]);
    }
  };

  const removePerson = (name: string) => {
    if (name !== 'Eu') {
      setPeople(prev => prev.filter(p => p !== name));
    }
  };

  const setPeopleList = (newPeople: string[]) => {
      // Filtra valores nulos antes de salvar
      const safeList = newPeople.filter(p => p && typeof p === 'string');
      setPeople(safeList);
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    try {
      const newIncome = await financeService.createIncome(income);
      setIncomes(prev => [...prev, newIncome]);
      toast({ title: 'Sucesso', description: 'Renda adicionada' });
    } catch (e) { console.error(e); }
  };
  const removeIncome = async (id: string) => {
    try {
      await financeService.deleteIncome(id);
      setIncomes(prev => prev.filter(i => i.id !== id));
    } catch (e) { console.error(e); }
  };
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await financeService.createExpense(expense);
      setExpenses(prev => [...prev, newExpense]);
      toast({ title: 'Sucesso', description: 'Despesa adicionada' });
    } catch (e) { console.error(e); }
  };
  const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id'>>) => {
    try {
      const updated = await financeService.updateExpense(id, updates);
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
    } catch (e) { console.error(e); }
  };
  const removeExpense = async (id: string) => {
    try {
      await financeService.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
  };
  const addCard = async (card: Omit<Card, 'id' | 'invoiceItems'>) => {
    try {
      const newCard = await financeService.createCard(card);
      setCards(prev => [...prev, newCard]);
      toast({ title: 'Sucesso', description: 'Cartão criado' });
    } catch (e) { console.error(e); }
  };
  const removeCard = async (id: string) => {
    try {
      await financeService.deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error(e); }
  };
  const updateCard = (id: string, updates: Partial<Omit<Card, 'id' | 'invoiceItems'>>) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  };
  
  const addInvoiceItem = async (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => {
    try {
      await financeService.addInvoiceItem(cardId, item, installments);
      const cardsData = await financeService.getCards();
      setCards(Array.isArray(cardsData) ? cardsData : []);
      toast({ title: 'Sucesso', description: 'Compra adicionada' });
    } catch (e) { console.error(e); }
  };

  const removeInvoiceItem = async (cardId: string, itemId: string) => {
    try {
      await financeService.deleteInvoiceItem(cardId, itemId);
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            invoiceItems: (card.invoiceItems || []).filter(item => item.id !== itemId),
          };
        }
        return card;
      }));
    } catch (e) { console.error(e); }
  };

  const setBudget = async (category: string, limit: number) => {
    try {
      const newBudget = await financeService.createBudget({
        category, limit, month: selectedMonth, year: selectedYear
      });
      setBudgets(prev => {
        const filtered = prev.filter(b => !(b.category === category && b.month === selectedMonth && b.year === selectedYear));
        return [...filtered, newBudget];
      });
    } catch (e) { console.error(e); }
  };
  const removeBudget = async (category: string) => {
    const budget = budgets.find(b => b.category === category && b.month === selectedMonth && b.year === selectedYear);
    if (budget) {
      await financeService.deleteBudget(budget.id);
      setBudgets(prev => prev.filter(b => b.id !== budget.id));
    }
  };

  // Cálculos
  const getTotalIncome = () => {
    const safeIncomes = incomes || [];
    const fixedIncome = safeIncomes
      .filter(i => i.type === 'fixed')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const extraIncome = safeIncomes
      .filter(i => i.type === 'extra' && i.month === selectedMonth && i.year === selectedYear)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    return fixedIncome + extraIncome;
  };

  const getTotalDirectExpenses = () => {
    return (expenses || [])
      .filter(isExpenseVisible)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  };

  const getTotalExpenses = () => {
    const safeCards = cards || [];
    const cardExpenses = safeCards.reduce((total, card) => {
      const items = card.invoiceItems || [];
      return total + items
        .filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        })
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, 0);
    return cardExpenses + getTotalDirectExpenses();
  };

  const getBalance = () => getTotalIncome() - getTotalExpenses();

  const getBudgetStatus = (category: string) => {
    const budget = (budgets || []).find(
      b => b.category === category && b.month === selectedMonth && b.year === selectedYear
    );
    if (!budget) return { spent: 0, limit: 0, percentage: 0 };

    const directSpent = (expenses || [])
      .filter(exp => exp.category === category && isExpenseVisible(exp))
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const cardSpent = (cards || []).reduce((total, card) => {
      const items = card.invoiceItems || [];
      return total + items
        .filter(item => {
          const itemDate = new Date(item.date);
          return item.category === category && itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        })
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, 0);

    const spent = directSpent + cardSpent;
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    return { spent, limit: budget.limit, percentage };
  };

  const getPreviousMonthExpenses = () => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const directExpenses = (expenses || [])
      .filter(exp => {
          const d = new Date(exp.date);
          if (exp.isRecurring && new Date(d.getFullYear(), d.getMonth(), 1) <= new Date(prevYear, prevMonth, 1)) return true;
          return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      return directExpenses; 
  };

  const getExpensesByCategory = () => {
    const categoryMap: { [key: string]: number } = {};
    (expenses || [])
      .filter(isExpenseVisible)
      .forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + (Number(exp.amount) || 0);
      });
    (cards || []).forEach(card => {
      const items = card.invoiceItems || [];
      items
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        })
        .forEach(item => {
          categoryMap[item.category] = (categoryMap[item.category] || 0) + (Number(item.amount) || 0);
        });
    });
    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));
  };

  // Stubs
  const updateInvoiceItem = () => {}; 
  const importCSV = () => {};
  const setInitialIncome = () => {};
  const setInitialCards = () => {};
  const checkRecurringExpenses = () => {};

  return (
    <FinanceContext.Provider value={{
      incomes, expenses, cards, people, budgets,
      selectedMonth, selectedYear,
      setSelectedMonth, setSelectedYear,
      addIncome, removeIncome,
      addExpense, updateExpense, removeExpense,
      addCard, updateCard, removeCard,
      addInvoiceItem, updateInvoiceItem, removeInvoiceItem,
      importCSV, addPerson, removePerson, setPeople: setPeopleList,
      setInitialIncome, setInitialCards,
      setBudget, removeBudget, getBudgetStatus, checkRecurringExpenses,
      getTotalIncome, getTotalExpenses, getTotalDirectExpenses,
      getBalance, getPreviousMonthExpenses, getExpensesByCategory,
      getFilteredExpenses,
      isLoading,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
