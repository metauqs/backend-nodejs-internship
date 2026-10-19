import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

const getStoredKhata = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KHATA);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveKhata = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEYS.KHATA, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save Khata entries to localStorage:', err);
  }
};

export const khataService = {
  clearLocalKhata() {
    try {
      localStorage.removeItem(STORAGE_KEYS.KHATA);
    } catch (err) {
      console.warn('Failed to clear Khata cache:', err);
    }
  },

  /**
   * Get all khata ledger entries
   */
  async getAllEntries() {
    try {
      const response = await api.get('/khata');
      const list = response.data?.data || response.data?.entries || response.data;
      if (Array.isArray(list)) {
        saveKhata(list);
        return list;
      }
    } catch (e) {
      console.warn('Backend Khata fetch error, using local fallback:', e);
      return getStoredKhata();
    }
    return [];
  },

  /**
   * Create a new khata loan entry
   */
  async createEntry(data) {
    try {
      const response = await api.post('/khata', data);
      const created = response.data?.data || response.data?.entry || response.data;
      if (created) {
        const list = getStoredKhata();
        saveKhata([created, ...list]);
        return created;
      }
    } catch (e) {
      console.warn('Backend create Khata error:', e);
    }

    const list = getStoredKhata();
    const totalAmount = Math.abs(Number(data.totalAmount) || 0);
    const newEntry = {
      id: `khata-${Date.now()}`,
      type: data.type || 'lend',
      partyName: (data.partyName || 'Party').trim(),
      partyPhone: (data.partyPhone || '').trim(),
      relationship: data.relationship || 'Friend',
      totalAmount,
      amountPaid: 0,
      remainingAmount: totalAmount,
      linkedAccountId: data.linkedAccountId || '',
      linkedAccountName: data.linkedAccountName || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      dueDate: data.dueDate || '',
      notes: (data.notes || '').trim(),
      status: 'pending',
      history: [],
      createdAt: new Date().toISOString(),
    };

    saveKhata([newEntry, ...list]);
    return newEntry;
  },

  /**
   * Record a payment / installment on an existing entry
   */
  async recordPayment(id, { amount, accountId, accountName, note, date }) {
    try {
      const response = await api.post(`/khata/${id}/payment`, {
        amount,
        accountId,
        note,
        date,
      });
      const updated = response.data?.data || response.data?.entry || response.data;
      if (updated) {
        const list = getStoredKhata();
        const updatedList = list.map((item) => ((item.id === id || item._id === id) ? updated : item));
        saveKhata(updatedList);
        return updated;
      }
    } catch (e) {
      console.warn('Backend record payment error:', e);
    }

    const list = getStoredKhata();
    const entry = list.find((item) => item.id === id || item._id === id);
    if (!entry) throw new Error('Khata entry not found');

    const paymentAmount = Math.abs(Number(amount) || 0);
    const newAmountPaid = (Number(entry.amountPaid) || 0) + paymentAmount;
    const newRemaining = Math.max(0, (Number(entry.totalAmount) || 0) - newAmountPaid);

    const newHistoryItem = {
      id: `pay-${Date.now()}`,
      date: date || new Date().toISOString().slice(0, 10),
      amount: paymentAmount,
      accountId: accountId || '',
      accountName: accountName || 'Primary Account',
      note: (note || 'Payment recorded').trim(),
    };

    const updatedEntry = {
      ...entry,
      amountPaid: newAmountPaid,
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? 'settled' : 'partial',
      history: [newHistoryItem, ...(entry.history || [])],
    };

    const updatedList = list.map((item) => ((item.id === id || item._id === id) ? updatedEntry : item));
    saveKhata(updatedList);
    return updatedEntry;
  },

  /**
   * Update full entry details
   */
  async updateEntry(id, updatedFields) {
    try {
      const response = await api.put(`/khata/${id}`, updatedFields);
      const updated = response.data?.data || response.data?.entry || response.data;
      if (updated) {
        const list = getStoredKhata();
        const updatedList = list.map((item) => ((item.id === id || item._id === id) ? updated : item));
        saveKhata(updatedList);
        return updated;
      }
    } catch (e) {
      console.warn('Backend update Khata error:', e);
    }

    const list = getStoredKhata();
    const updatedList = list.map((item) => {
      if (item.id !== id && item._id !== id) return item;
      const totalAmount = updatedFields.totalAmount !== undefined
        ? Math.abs(Number(updatedFields.totalAmount) || 0)
        : item.totalAmount;
      const amountPaid = updatedFields.amountPaid !== undefined
        ? Math.abs(Number(updatedFields.amountPaid) || 0)
        : item.amountPaid;
      const remainingAmount = Math.max(0, totalAmount - amountPaid);

      return {
        ...item,
        ...updatedFields,
        totalAmount,
        amountPaid,
        remainingAmount,
        status: remainingAmount === 0 ? 'settled' : amountPaid > 0 ? 'partial' : 'pending',
      };
    });

    saveKhata(updatedList);
    return updatedList.find((item) => item.id === id || item._id === id);
  },

  /**
   * Delete a khata entry
   */
  async deleteEntry(id) {
    try {
      await api.delete(`/khata/${id}`);
    } catch (e) {
      console.warn('Backend delete Khata error:', e);
    }

    const list = getStoredKhata();
    const filtered = list.filter((item) => item.id !== id && item._id !== id);
    saveKhata(filtered);
    return { success: true };
  },

  /**
   * Calculate ledger summary KPI statistics
   */
  calculateSummary(entries = []) {
    let toReceiveTotal = 0; // Maine Lene Hain
    let toPayTotal = 0;     // Maine Dene Hain
    let settledTotal = 0;
    let pendingCount = 0;
    let debtorsCount = 0;
    let creditorsCount = 0;

    entries.forEach((e) => {
      const rem = Number(e.remainingAmount) || 0;
      const paid = Number(e.amountPaid) || 0;

      if (e.status === 'settled') {
        settledTotal += Number(e.totalAmount) || 0;
      } else {
        settledTotal += paid;
      }

      if (e.type === 'lend') {
        toReceiveTotal += rem;
        if (rem > 0) debtorsCount += 1;
      } else {
        toPayTotal += rem;
        if (rem > 0) creditorsCount += 1;
      }

      if (e.status !== 'settled') pendingCount += 1;
    });

    const netBalance = toReceiveTotal - toPayTotal;

    return {
      toReceiveTotal,
      toPayTotal,
      netBalance,
      settledTotal,
      pendingCount,
      debtorsCount,
      creditorsCount,
    };
  },
};

export default khataService;
