import api from './api';
import transactionService from './transactionService';
import { STORAGE_KEYS } from '../utils/constants';
import { DEFAULT_ACCOUNTS } from '../utils/pakistanInstitutions';

export const dashboardService = {
  /**
   * Fetch financial summary (balance, monthly income, monthly expense)
   * @param {Object} params - { month, year }
   */
  async getSummary(params = {}) {
    try {
      const response = await api.get('/dashboard/summary', { params });
      if (response?.data) return response.data;
    } catch {
      // Backend offline fallback handled by caller or defaults
    }

    let accountsList = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          accountsList = parsed.filter(
            (a) => !['acc-ubl-1', 'acc-nayapay-2', 'acc-jazzcash-3', 'acc-meezan-4', 'acc-hbl-5', 'acc-alfalah-6'].includes(a.id)
          );
        }
      }
    } catch {}

    const totalBalance = accountsList.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0
    );

    return {
      totalBalance,
    };
  },

  /**
   * Fetch monthly spending and income statistics for charts
   * @param {number|string} year
   * @param {number|string} month
   */
  async getMonthlyStats(year, month) {
    const response = await api.get('/dashboard/stats', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Fetch recent transactions for dashboard widget
   * @param {number} limit
   */
  async getRecentTransactions(limit = 20) {
    try {
      const response = await api.get('/dashboard/recent-transactions', {
        params: { limit },
      });
      if (response?.data) return response.data;
    } catch {
      // Backend offline fallback: fetch from transactionService
    }
    try {
      const all = await transactionService.getAllTransactions();
      const list = all?.data || (Array.isArray(all) ? all : []);
      return Array.isArray(list) ? list.slice(0, limit) : [];
    } catch {
      return [];
    }
  },
};

export default dashboardService;
