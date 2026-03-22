import api from './api';
import { Income, Expense, Card, Budget, InvoiceItem } from '@/contexts/FinanceContext';

type CreateIncome = Omit<Income, 'id'>;
type CreateExpense = Omit<Expense, 'id'>;
type CreateCard = Omit<Card, 'id' | 'invoiceItems'>;
type CreateBudget = Omit<Budget, 'id'>;

const adaptCard = (serverCard: any): Card => {
  if (!serverCard) return { id: 'temp', name: 'Erro', type: 'bank', color: '#000', invoiceItems: [], paidInvoices: [] };
  
  return {
    id: String(serverCard.id),
    name: serverCard.name || 'Sem Nome',
    type: serverCard.type || 'bank',
    color: serverCard.color || '#000000',
    icon: serverCard.icon ?? null,
    closingDay: serverCard.closing_day ?? null,
    dueDay: serverCard.due_day ?? null,
    creditLimit: serverCard.credit_limit ?? null,
    invoiceItems: Array.isArray(serverCard.invoice_items) 
      ? serverCard.invoice_items.map((item: any) => ({
          ...item,
          id: String(item.id),
          isRecurring: item.is_recurring ?? false,
          frequency: item.frequency ?? undefined,
        })) 
      : [],
    paidInvoices: Array.isArray(serverCard.paid_invoices)
      ? serverCard.paid_invoices.map((p: any) => ({
          id: String(p.id),
          month: p.month,
          year: p.year,
        }))
      : [],
  };
};

export const financeService = {
  // === RENDAS ===
  getIncomes: async () => {
    try {
      const response = await api.get('/incomes/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({
        ...item,
        id: String(item.id),
        payDay: item.pay_day ?? null,
        accountingMonth: item.accounting_month ?? null,
        accountingYear: item.accounting_year ?? null,
        isRecurring: item.is_recurring ?? false,
      }));
    } catch {
      return [];
    }
  },
  createIncome: async (data: CreateIncome) => {
    const payload = {
      description: data.description,
      amount: data.amount,
      type: data.type,
      month: data.month,
      year: data.year,
      pay_day: data.payDay ?? null,
      accounting_month: data.accountingMonth ?? null,
      accounting_year: data.accountingYear ?? null,
      is_recurring: data.isRecurring ?? false,
    };
    const response = await api.post('/incomes/', payload);
    return {
      ...response.data,
      id: String(response.data.id),
      payDay: response.data.pay_day ?? null,
      accountingMonth: response.data.accounting_month ?? null,
      accountingYear: response.data.accounting_year ?? null,
      isRecurring: response.data.is_recurring ?? false,
    };
  },
  updateIncome: async (id: string, data: Partial<CreateIncome>) => {
    const payload: any = {};
    if (data.description !== undefined) payload.description = data.description;
    if (data.amount !== undefined) payload.amount = data.amount;
    if (data.type !== undefined) payload.type = data.type;
    if (data.month !== undefined) payload.month = data.month;
    if (data.year !== undefined) payload.year = data.year;
    if (data.payDay !== undefined) payload.pay_day = data.payDay;
    if (data.accountingMonth !== undefined) payload.accounting_month = data.accountingMonth;
    if (data.accountingYear !== undefined) payload.accounting_year = data.accountingYear;
    if (data.isRecurring !== undefined) payload.is_recurring = data.isRecurring;
    const response = await api.put(`/incomes/${id}`, payload);
    return {
      ...response.data,
      id: String(response.data.id),
      payDay: response.data.pay_day ?? null,
      accountingMonth: response.data.accounting_month ?? null,
      accountingYear: response.data.accounting_year ?? null,
      isRecurring: response.data.is_recurring ?? false,
    };
  },
  processRecurringIncomes: async (targetMonth: number, targetYear: number) => {
    try {
      const response = await api.post(`/incomes/process-recurring?target_month=${targetMonth}&target_year=${targetYear}`);
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({
        ...item,
        id: String(item.id),
        payDay: item.pay_day ?? null,
        accountingMonth: item.accounting_month ?? null,
        accountingYear: item.accounting_year ?? null,
        isRecurring: item.is_recurring ?? false,
      }));
    } catch {
      return [];
    }
  },
  deleteIncome: async (id: string) => {
    await api.delete(`/incomes/${id}`);
  },

  // === DESPESAS ===
  getExpenses: async () => {
    try {
      const response = await api.get('/expenses/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({
        ...item,
        id: String(item.id),
        isRecurring: item.is_recurring ?? false,
        isPaid: item.is_paid ?? false,
        frequency: item.frequency ?? undefined,
      }));
    } catch {
      return [];
    }
  },
  createExpense: async (data: CreateExpense) => {
    const payload: any = { ...data };
    if ('isRecurring' in data) {
      payload.is_recurring = data.isRecurring;
      delete payload.isRecurring;
    }
    if ('isPaid' in data) {
      payload.is_paid = data.isPaid;
      delete payload.isPaid;
    }
    const response = await api.post('/expenses/', payload);
    return { ...response.data, id: String(response.data.id), isPaid: response.data.is_paid ?? false, isRecurring: response.data.is_recurring ?? false };
  },
  updateExpense: async (id: string, data: Partial<CreateExpense>) => {
    const payload: any = { ...data };
    if ('isRecurring' in data) {
      payload.is_recurring = data.isRecurring;
      delete payload.isRecurring;
    }
    if ('isPaid' in data) {
      payload.is_paid = data.isPaid;
      delete payload.isPaid;
    }
    const response = await api.put(`/expenses/${id}`, payload);
    return { ...response.data, id: String(response.data.id), isPaid: response.data.is_paid ?? false, isRecurring: response.data.is_recurring ?? false };
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
    } catch {
      return [];
    }
  },
  createCard: async (data: CreateCard) => {
    const payload: any = { ...data };
    if ('closingDay' in data) {
      payload.closing_day = data.closingDay;
      delete payload.closingDay;
    }
    if ('dueDay' in data) {
      payload.due_day = data.dueDay;
      delete payload.dueDay;
    }
    if ('creditLimit' in data) {
      payload.credit_limit = data.creditLimit;
      delete payload.creditLimit;
    }
    const response = await api.post('/cards/', payload);
    return adaptCard(response.data);
  },
  deleteCard: async (id: string) => {
    await api.delete(`/cards/${id}`);
  },
  updateCard: async (id: string, data: Partial<CreateCard>) => {
    const payload: any = { ...data };
    if ('closingDay' in data) {
      payload.closing_day = data.closingDay;
      delete payload.closingDay;
    }
    if ('dueDay' in data) {
      payload.due_day = data.dueDay;
      delete payload.dueDay;
    }
    if ('creditLimit' in data) {
      payload.credit_limit = data.creditLimit;
      delete payload.creditLimit;
    }
    const response = await api.put(`/cards/${id}`, payload);
    return adaptCard(response.data);
  },

  // === ITENS DE FATURA ===
  addInvoiceItem: async (cardId: string, item: Omit<InvoiceItem, 'id'>, installments?: number) => {
    const payload = { ...item, installments }; 
    const response = await api.post(`/cards/${cardId}/items`, payload);
    const items = Array.isArray(response.data) ? response.data : [response.data];
    return items.map((i: any) => ({ ...i, id: String(i.id) }));
  },
  
  // AQUI A CORREÇÃO DA DELEÇÃO
  deleteInvoiceItem: async (cardId: string, itemId: string) => {
    await api.delete(`/cards/${cardId}/items/${itemId}`);
  },
  updateInvoiceItem: async (cardId: string, itemId: string, updates: Partial<Omit<InvoiceItem, 'id'>>) => {
    const response = await api.put(`/cards/${cardId}/items/${itemId}`, updates);
    return { ...response.data, id: String(response.data.id) };
  },

  // === ORÇAMENTOS ===
  getBudgets: async () => {
    try {
      const response = await api.get('/budgets/');
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any) => ({ ...item, id: String(item.id) }));
    } catch {
      return [];
    }
  },
  createBudget: async (data: CreateBudget) => {
    const response = await api.post('/budgets/', data);
    return { ...response.data, id: String(response.data.id) };
  },
  deleteBudget: async (id: string) => {
    await api.delete(`/budgets/${id}`);
  },

  // === RECORRÊNCIA ===
  processRecurring: async (): Promise<{ processed: boolean; created_expenses: number; created_invoice_items: number; month: string }> => {
    const response = await api.post('/expenses/process-recurring');
    return response.data;
  },

  // === FATURAS PAGAS ===
  markInvoicePaid: async (cardId: string, month: number, year: number): Promise<{ id: number; month: number; year: number }> => {
    const response = await api.post(`/cards/${cardId}/paid-invoices`, { month, year });
    return response.data;
  },
  unmarkInvoicePaid: async (cardId: string, month: number, year: number): Promise<void> => {
    await api.delete(`/cards/${cardId}/paid-invoices/${month}/${year}`);
  },

  // === PESSOAS ===
  getPeople: async (): Promise<string[]> => {
    try {
      const response = await api.get('/users/me/people');
      return response.data.people ?? ['Eu'];
    } catch {
      return ['Eu'];
    }
  },
  savePeople: async (people: string[]): Promise<string[]> => {
    try {
      const response = await api.put('/users/me/people', { people });
      return response.data.people ?? people;
    } catch {
      return people;
    }
  },
};
