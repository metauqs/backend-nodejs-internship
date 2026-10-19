import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

// Helper to get cached local transactions
function getLocalTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading cached transactions:', e);
  }
  return [];
}

// Helper to save local cached transactions
function saveLocalTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
  } catch (e) {
    console.warn('Error caching local transactions:', e);
  }
}

export const transactionService = {
  getLocalTransactions,
  saveLocalTransactions,

  clearLocalTransactions() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    } catch (e) {
      console.warn('Failed to clear local transactions:', e);
    }
  },

  /**
   * Fetch paginated and filtered transactions
   */
  async getTransactions(params = {}) {
    try {
      const response = await api.get('/transactions', { params });
      if (response?.data) {
        const items = response.data.data || response.data.transactions || [];
        if (Array.isArray(items)) {
          saveLocalTransactions(items);
        }
        return response.data;
      }
    } catch (err) {
      console.warn('Error fetching transactions from backend, falling back to local cache:', err);
      // Offline cache fallback only upon network/backend error
      let list = getLocalTransactions();

      if (params.search) {
        const s = params.search.toLowerCase();
        list = list.filter((t) =>
          (t.title && t.title.toLowerCase().includes(s)) ||
          (t.category && t.category.toLowerCase().includes(s)) ||
          (t.description && t.description.toLowerCase().includes(s))
        );
      }
      if (params.type) {
        list = list.filter((t) => t.type === params.type);
      }
      if (params.category) {
        list = list.filter((t) => t.category?.toLowerCase() === params.category.toLowerCase());
      }
      if (params.startDate) {
        const startStr = String(params.startDate).slice(0, 10);
        list = list.filter((t) => (t.date ? String(t.date).slice(0, 10) >= startStr : true));
      }
      if (params.endDate) {
        const endStr = String(params.endDate).slice(0, 10);
        list = list.filter((t) => (t.date ? String(t.date).slice(0, 10) <= endStr : true));
      }

      if (params.sort) {
        if (params.sort === '-date') {
          list.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (params.sort === 'date') {
          list.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (params.sort === '-amount') {
          list.sort((a, b) => b.amount - a.amount);
        } else if (params.sort === 'amount') {
          list.sort((a, b) => a.amount - b.amount);
        }
      } else {
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedItems = list.slice(startIndex, startIndex + limit);

      return {
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }

    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch all transactions (unpaginated) for accurate summary calculations
   */
  async getAllTransactions() {
    try {
      const response = await api.get('/transactions/all');
      if (response?.data) {
        const list = response.data.data || response.data.transactions || response.data;
        if (Array.isArray(list)) {
          saveLocalTransactions(list);
          return { data: list };
        }
        return response.data;
      }
    } catch (err) {
      console.warn('Error fetching all transactions from backend, falling back to local cache:', err);
      const list = getLocalTransactions();
      return { data: list };
    }

    return { data: [] };
  },

  /**
   * Fetch single transaction by ID
   */
  async getTransactionById(id) {
    try {
      const response = await api.get(`/transactions/${id}`);
      if (response?.data) return response.data;
    } catch (err) {
      console.warn('Error fetching transaction by id:', err);
    }

    const list = getLocalTransactions();
    const found = list.find((t) => t.id === id || t._id === id);
    if (!found) throw new Error('Transaction not found');
    return { data: found };
  },

  /**
   * Create a new transaction on the backend
   */
  async createTransaction(transactionData) {
    const response = await api.post('/transactions', transactionData);
    const created = response.data?.data || response.data?.transaction || response.data;

    // Cache to local storage
    if (created) {
      const list = getLocalTransactions();
      saveLocalTransactions([created, ...list]);
    }

    return response.data;
  },

  /**
   * Update an existing transaction on the backend
   */
  async updateTransaction(id, transactionData) {
    const response = await api.put(`/transactions/${id}`, transactionData);
    const updated = response.data?.data || response.data?.transaction || response.data;

    if (updated) {
      const list = getLocalTransactions();
      const updatedList = list.map((t) => (t.id === id || t._id === id ? { ...t, ...updated } : t));
      saveLocalTransactions(updatedList);
    }

    return response.data;
  },

  /**
   * Delete a transaction on the backend
   */
  async deleteTransaction(id) {
    const response = await api.delete(`/transactions/${id}`);

    const list = getLocalTransactions();
    const updated = list.filter((t) => t.id !== id && t._id !== id);
    saveLocalTransactions(updated);

    return response.data;
  },

  /**
   * Optional receipt upload
   */
  async uploadReceipt(id, formData) {
    const response = await api.post(`/transactions/${id}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default transactionService;
