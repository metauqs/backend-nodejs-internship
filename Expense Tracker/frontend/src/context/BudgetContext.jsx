import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, DEFAULT_MONTHLY_BUDGET } from '../utils/constants';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const { user, token } = useAuth();
  const userId = user?._id || user?.id || user?.email || null;

  // Global / Default monthly budget
  const [monthlyBudget, setMonthlyBudgetState] = useState(() => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!currentToken || currentToken.startsWith('demo-jwt-token')) return DEFAULT_MONTHLY_BUDGET;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGET);
      return stored ? Number(stored) : DEFAULT_MONTHLY_BUDGET;
    } catch {
      return DEFAULT_MONTHLY_BUDGET;
    }
  });

  // Month-specific budgets: { '2026-04': 60000, '2026-05': 55000 }
  const [budgetsByMonth, setBudgetsByMonth] = useState(() => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!currentToken || currentToken.startsWith('demo-jwt-token')) return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGET_MAP);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Load budgets from backend whenever authenticated user is active
  const fetchBudgets = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || token;
    if (!currentToken || currentToken.startsWith('demo-jwt-token') || !userId) {
      setMonthlyBudgetState(DEFAULT_MONTHLY_BUDGET);
      setBudgetsByMonth({});
      return;
    }

    try {
      const res = await api.get('/budgets');
      const data = res.data?.data || res.data;
      const map = data?.budgets || res.data?.budgetsByMonth || res.data?.budgets;
      if (map && typeof map === 'object') {
        setBudgetsByMonth(map);
        localStorage.setItem(STORAGE_KEYS.BUDGET_MAP, JSON.stringify(map));
      } else {
        setBudgetsByMonth({});
      }
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthBudget = (map && map[currentMonthKey] !== undefined) ? Number(map[currentMonthKey]) : DEFAULT_MONTHLY_BUDGET;
      setMonthlyBudgetState(currentMonthBudget);
      localStorage.setItem(STORAGE_KEYS.BUDGET, String(currentMonthBudget));
    } catch (err) {
      console.warn('Could not fetch budgets from backend:', err);
    }
  }, [token, userId]);

  // Synchronize when active user changes or logs out
  useEffect(() => {
    if (!userId || !token) {
      setMonthlyBudgetState(DEFAULT_MONTHLY_BUDGET);
      setBudgetsByMonth({});
      localStorage.removeItem(STORAGE_KEYS.BUDGET);
      localStorage.removeItem(STORAGE_KEYS.BUDGET_MAP);
    } else {
      fetchBudgets();
    }
  }, [userId, token, fetchBudgets]);

  // Persist default budget
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, String(monthlyBudget));
    } catch (e) {
      console.warn('Failed to save monthly budget:', e);
    }
  }, [monthlyBudget]);

  // Persist monthly budget map
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET_MAP, JSON.stringify(budgetsByMonth));
    } catch (e) {
      console.warn('Failed to save budgets by month map:', e);
    }
  }, [budgetsByMonth]);

  // Helper to format date into 'YYYY-MM'
  const getMonthKey = useCallback((date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Get budget for a specific month - defaults to 0 if not set for that month
  const getBudgetForMonth = useCallback((dateOrMonthKey) => {
    if (!dateOrMonthKey) return 0;
    const key = typeof dateOrMonthKey === 'string' && dateOrMonthKey.includes('-') && dateOrMonthKey.length === 7
      ? dateOrMonthKey
      : getMonthKey(dateOrMonthKey);
    return (budgetsByMonth && budgetsByMonth[key] !== undefined && budgetsByMonth[key] !== null)
      ? Number(budgetsByMonth[key])
      : 0;
  }, [budgetsByMonth, getMonthKey]);

  // Set budget for a specific month
  const setMonthlyBudget = useCallback(async (amount, monthKey = null) => {
    const num = Math.max(0, Number(amount) || 0);
    const key = monthKey || getMonthKey(new Date());

    setBudgetsByMonth((prev) => {
      const next = { ...prev, [key]: num };
      try {
        localStorage.setItem(STORAGE_KEYS.BUDGET_MAP, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save budgets map to localStorage:', e);
      }
      return next;
    });

    const currentKey = getMonthKey(new Date());
    if (key === currentKey) {
      setMonthlyBudgetState(num);
      try {
        localStorage.setItem(STORAGE_KEYS.BUDGET, String(num));
      } catch (e) {
        console.warn('Failed to save monthly budget to localStorage:', e);
      }
    }

    // Persist directly to backend MongoDB on a monthly basis
    const res = await api.put(`/budgets/${key}`, { amount: num, monthKey: key });
    return res.data?.data || num;
  }, [getMonthKey]);

  // Calculate budget statistics given a list of transactions
  const getBudgetStatus = useCallback((transactions = [], targetDate = new Date(), prospectiveAmount = 0) => {
    const targetKey = getMonthKey(targetDate);
    const budget = getBudgetForMonth(targetKey);

    // Sum all expenses for this month
    const currentSpent = transactions.reduce((sum, tx) => {
      if (!tx || tx.type !== 'expense') return sum;
      const txKey = getMonthKey(tx.date || new Date());
      if (txKey === targetKey) {
        return sum + Math.abs(Number(tx.amount) || 0);
      }
      return sum;
    }, 0);

    const prospectiveNum = Math.max(0, Number(prospectiveAmount) || 0);
    const totalWithProspective = currentSpent + prospectiveNum;

    const remaining = Math.max(0, budget - currentSpent);
    const isExceeded = budget > 0 && currentSpent > budget;
    const exceededAmount = isExceeded ? currentSpent - budget : 0;
    const percentSpent = budget > 0 ? (currentSpent / budget) * 100 : 0;

    const willExceed = budget > 0 && prospectiveNum > 0 && totalWithProspective > budget;
    const willExceedAmount = willExceed ? totalWithProspective - budget : 0;
    const prospectivePercent = budget > 0 ? (totalWithProspective / budget) * 100 : 0;

    return {
      monthKey: targetKey,
      budget,
      currentSpent,
      totalWithProspective,
      remaining,
      isExceeded,
      exceededAmount,
      percentSpent: Math.round(percentSpent * 10) / 10,
      willExceed,
      willExceedAmount,
      prospectivePercent: Math.round(prospectivePercent * 10) / 10,
    };
  }, [getBudgetForMonth, getMonthKey]);

  return (
    <BudgetContext.Provider
      value={{
        monthlyBudget,
        budgetsByMonth,
        setMonthlyBudget,
        getBudgetForMonth,
        getMonthKey,
        getBudgetStatus,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

export default BudgetContext;
