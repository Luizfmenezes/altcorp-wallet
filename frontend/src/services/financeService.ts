import api from './api';
import { Income, Expense, Card, Budget, InvoiceItem } from '@/contexts/FinanceContext';

type CreateIncome = Omit<Income, 'id'>;
type CreateExpense = Omit<Expense, 'id'>;
type CreateCard = Omit<Card, 'id' | 'invoiceItems'>;
type CreateBudget = Omit<Budget, 'id'>;

const adaptCard = (serverCard: any): Card => {
  if (!serverCard) return { id: 'temp', name: 'Erro', type: 'bank', color: '#000', invoiceItems: [] };
  
  return {
    id: String(serverCard.id),
    name: serverCard.name || 'Sem Nome',
    type: serverCard.type || 'bank',
    color: serverCard.color || '#000000',
    invoiceItems: Array.isArray(serverCard.invoice_items) 
      ? serverCard.invoice_items.map((item: any) => ({
          ...item,
          id: String(item.id),
        })) 
      : [] 
  };
};

export const financeService = {
  // === RENDAS ===
  getIncomes: async () => {
    try {
      const response = await api.get('/incomes/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({ ...item, id: String(item.id) }));
    } catch (error) {
      console.error("Erro getIncomes:", error);
      return [];
    }
  },
  createIncome: async (data: CreateIncome) => {
    const response = await api.post('/incomes/', data);
    return { ...response.data, id: String(response.data.id) };
  },
  deleteIncome: async (id: string) => {
    await api.delete(`/incomes/${id}`);
  },

  // === DESPESAS ===
  getExpenses: async () => {
    try {
      const response = await api.get('/expenses/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({ ...item, id: String(item.id) }));
    } catch (error) {
      console.error("Erro getExpenses:", error);
      return [];
    }
  },
  createExpense: async (data: CreateExpense) => {
    const response = await api.post('/expenses/', data);
    return { ...response.data, id: String(response.data.id) };
  },
  updateExpense: async (id: string, data: Partial<CreateExpense>) => {
    const response = await api.put(`/expenses/${id}`, data);
    return { ...response.data, id: String(response.data.id) };
  },
  deleteExpense: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },

  // === CARTÕES ===
  getCards: async () => {
    try {
      const response = await api.get('/cards/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map(adaptCard);
    } catch (error) {
      console.error("Erro getCards:", error);
      return [];
    }
  },
  createCard: async (data: CreateCard) => {
    const response = await api.post('/cards/', data);
    return adaptCard(response.data);
  },
  deleteCard: async (id: string) => {
    await api.delete(`/cards/${id}`);
  },

  // === ITENS DE FATURA ===
  addInvoiceItem: async (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => {
    const payload = { ...item, installments }; 
    const response = await api.post(`/cards/${cardId}/items`, payload);
    const createdItem = Array.isArray(response.data) ? response.data[0] : response.data;
    return { ...createdItem, id: String(createdItem.id) };
  },
  
  // AQUI A CORREÇÃO DA DELEÇÃO
  deleteInvoiceItem: async (cardId: string, itemId: string) => {
    await api.delete(`/cards/${cardId}/items/${itemId}`);
  },

  // === ORÇAMENTOS ===
  getBudgets: async () => {
    try {
      const response = await api.get('/budgets/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({ ...item, id: String(item.id) }));
    } catch (error) {
      console.error("Erro getBudgets:", error);
      return [];
    }
  },
  createBudget: async (data: CreateBudget) => {
    const response = await api.post('/budgets/', data);
    return { ...response.data, id: String(response.data.id) };
  },
  deleteBudget: async (id: string) => {
    await api.delete(`/budgets/${id}`);
  }
};
