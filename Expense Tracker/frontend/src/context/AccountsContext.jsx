import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { DEFAULT_ACCOUNTS } from '../utils/pakistanInstitutions';
import accountService from '../services/accountService';
import useAuth from '../hooks/useAuth';

export const AccountsContext = createContext(null);

export const AccountsProvider = ({ children }) => {
  const { user, token } = useAuth();
  const userId = user?._id || user?.id || user?.email || null;

  const [accounts, setAccounts] = useState(() => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!currentToken || currentToken.startsWith('demo-jwt-token')) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return DEFAULT_ACCOUNTS;
    } catch (e) {
      console.warn('Failed to parse stored accounts:', e);
      return DEFAULT_ACCOUNTS;
    }
  });

  // Fetch accounts from backend whenever authenticated user is active
  const refreshAccounts = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || token;
    if (!currentToken || currentToken.startsWith('demo-jwt-token') || !userId) {
      setAccounts([]);
      return;
    }

    try {
      const res = await accountService.getAccounts();
      const list = res.data || res.accounts || res;
      if (Array.isArray(list)) {
        setAccounts(list);
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('Could not fetch accounts from backend:', err);
    }
  }, [token, userId]);

  // Synchronize when active user changes or logs out
  useEffect(() => {
    if (!userId || !token) {
      setAccounts([]);
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    } else {
      refreshAccounts();
    }
  }, [userId, token, refreshAccounts]);

  // Sync to localStorage on change if authenticated
  useEffect(() => {
    if (!userId || !token) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to persist accounts:', e);
    }
  }, [accounts, userId, token]);

  // Combined totals
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [accounts]);

  const banks = useMemo(() => accounts.filter((a) => a.type === 'bank'), [accounts]);
  const wallets = useMemo(() => accounts.filter((a) => a.type === 'wallet'), [accounts]);

  const banksTotal = useMemo(() => {
    return banks.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [banks]);

  const walletsTotal = useMemo(() => {
    return wallets.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [wallets]);

  // Add new bank account or wallet
  const addAccount = useCallback(async (newAcc) => {
    const formatted = {
      ...newAcc,
      id: newAcc.id || `acc-${Date.now()}`,
      balance: Math.max(0, Number(newAcc.balance) || 0),
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [formatted, ...prev]);

    try {
      const res = await accountService.createAccount(newAcc);
      const saved = res.data || res.account || res;
      if (saved?.id || saved?._id) {
        setAccounts((prev) => prev.map((a) => (a.id === formatted.id ? { ...saved, id: saved.id || saved._id } : a)));
        return saved;
      }
    } catch (e) {
      console.warn('Backend addAccount error:', e);
    }
    return formatted;
  }, []);

  // Update existing account
  const updateAccount = useCallback(async (id, updates) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id || acc._id === id) {
          const newBal = updates.balance !== undefined ? Number(updates.balance) : acc.balance;
          return { ...acc, ...updates, balance: Number(newBal) || 0 };
        }
        return acc;
      })
    );
    try {
      await accountService.updateAccount(id, updates);
    } catch (e) {
      console.warn('Backend updateAccount error:', e);
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (id) => {
    setAccounts((prev) => {
      return prev.filter((acc) => acc.id !== id && acc._id !== id);
    });
    try {
      await accountService.deleteAccount(id);
    } catch (e) {
      console.warn('Backend deleteAccount error:', e);
    }
  }, []);

  // Quick Deposit to a specific account
  const depositToAccount = useCallback(async (id, amount) => {
    const cleanId = String(id || '').trim();
    const num = Number(amount);
    if (!cleanId || isNaN(num) || num <= 0) return false;

    setAccounts((prev) =>
      prev.map((acc) => {
        const matches = (acc.id && String(acc.id) === cleanId) || (acc._id && String(acc._id) === cleanId);
        return matches ? { ...acc, balance: (Number(acc.balance) || 0) + num } : acc;
      })
    );

    try {
      await accountService.deposit(cleanId, num);
    } catch (e) {
      console.warn('Backend deposit error:', e);
    }
    return true;
  }, []);

  // Quick Withdraw from a specific account
  const withdrawFromAccount = useCallback(async (id, amount) => {
    const cleanId = String(id || '').trim();
    const num = Number(amount);
    if (!cleanId) return { success: false, message: 'Invalid account ID' };
    if (isNaN(num) || num <= 0) return { success: false, message: 'Invalid amount' };

    let found = false;
    setAccounts((prev) =>
      prev.map((acc) => {
        const matches = (acc.id && String(acc.id) === cleanId) || (acc._id && String(acc._id) === cleanId);
        if (matches) {
          found = true;
          return { ...acc, balance: (Number(acc.balance) || 0) - num };
        }
        return acc;
      })
    );

    try {
      await accountService.withdraw(cleanId, num);
    } catch (e) {
      console.warn('Backend withdraw error:', e);
    }
    return { success: found, message: found ? 'Withdrawn' : 'Account not found' };
  }, []);

  // Transfer between two accounts
  const transferBetweenAccounts = useCallback(async (fromId, toId, amount) => {
    const fromCleanId = String(fromId || '').trim();
    const toCleanId = String(toId || '').trim();
    const num = Number(amount);

    if (!fromCleanId || !toCleanId || fromCleanId === toCleanId || isNaN(num) || num <= 0) {
      return { success: false, message: 'Invalid transfer details' };
    }

    let ok = false;
    setAccounts((prev) => {
      const fromAcc = prev.find(
        (a) => (a.id && String(a.id) === fromCleanId) || (a._id && String(a._id) === fromCleanId)
      );
      if (!fromAcc || Number(fromAcc.balance || 0) < num) {
        return prev;
      }
      ok = true;
      return prev.map((acc) => {
        const matchesFrom = (acc.id && String(acc.id) === fromCleanId) || (acc._id && String(acc._id) === fromCleanId);
        const matchesTo = (acc.id && String(acc.id) === toCleanId) || (acc._id && String(acc._id) === toCleanId);
        if (matchesFrom) return { ...acc, balance: (Number(acc.balance) || 0) - num };
        if (matchesTo) return { ...acc, balance: (Number(acc.balance) || 0) + num };
        return acc;
      });
    });

    try {
      if (ok) {
        await accountService.transfer(fromCleanId, toCleanId, num);
      }
    } catch (e) {
      console.warn('Backend transfer error:', e);
    }

    return {
      success: ok,
      message: ok ? 'Transfer completed' : 'Insufficient balance in source account',
    };
  }, []);

  // Helper to resolve an account ID from a transaction
  const resolveAccountId = useCallback(
    (tx) => {
      if (!tx) return accounts[0]?.id || accounts[0]?._id || '';
      const targetId = String(tx.accountId || tx.account || '').trim();
      if (targetId) {
        const found = accounts.find(
          (a) => (a.id && String(a.id) === targetId) || (a._id && String(a._id) === targetId)
        );
        if (found) return found.id || found._id;
      }
      if (tx.accountName) {
        const nameQuery = String(tx.accountName).trim().toLowerCase();
        const match = accounts.find((a) => {
          const aName = String(a.name || '').trim().toLowerCase();
          return aName === nameQuery || aName.includes(nameQuery) || nameQuery.includes(aName);
        });
        if (match) return match.id || match._id;
      }
      return accounts[0]?.id || accounts[0]?._id || '';
    },
    [accounts]
  );

  // Reconcile single account
  const reconcileAccount = useCallback(
    async (id) => {
      try {
        const res = await accountService.reconcileAccount(id);
        await refreshAccounts();
        return res.data || res;
      } catch (e) {
        console.warn('reconcileAccount error:', e);
        throw e;
      }
    },
    [refreshAccounts]
  );

  // Reconcile all accounts
  const reconcileAllAccounts = useCallback(
    async () => {
      try {
        const res = await accountService.reconcileAll();
        await refreshAccounts();
        return res.data || res;
      } catch (e) {
        console.warn('reconcileAll error:', e);
        throw e;
      }
    },
    [refreshAccounts]
  );

  // Apply a transaction's financial effect (safely refreshes from backend for logged in users)
  const applyTransaction = useCallback(
    (tx) => {
      if (token && userId) {
        refreshAccounts();
        return;
      }
      if (!tx) return;
      const amount = Number(tx.amount);
      if (isNaN(amount) || amount <= 0) return;
      const accId = String(tx.accountId || resolveAccountId(tx) || '').trim();
      if (!accId) return;

      setAccounts((prev) =>
        prev.map((acc) => {
          const matches = (acc.id && String(acc.id) === accId) || (acc._id && String(acc._id) === accId);
          if (!matches) return acc;
          const curr = Number(acc.balance) || 0;
          const delta = tx.type === 'expense' ? -amount : amount;
          return { ...acc, balance: curr + delta };
        })
      );
    },
    [token, userId, refreshAccounts, resolveAccountId]
  );

  // Revert a transaction's financial effect (safely refreshes from backend for logged in users)
  const revertTransaction = useCallback(
    (tx) => {
      if (token && userId) {
        refreshAccounts();
        return;
      }
      if (!tx) return;
      const amount = Number(tx.amount);
      if (isNaN(amount) || amount <= 0) return;
      const accId = String(tx.accountId || resolveAccountId(tx) || '').trim();
      if (!accId) return;

      setAccounts((prev) =>
        prev.map((acc) => {
          const matches = (acc.id && String(acc.id) === accId) || (acc._id && String(acc._id) === accId);
          if (!matches) return acc;
          const curr = Number(acc.balance) || 0;
          const delta = tx.type === 'expense' ? amount : -amount;
          return { ...acc, balance: curr + delta };
        })
      );
    },
    [token, userId, refreshAccounts, resolveAccountId]
  );

  // Adjust account balances when an existing transaction is updated
  const adjustTransaction = useCallback(
    (oldTx, newTx) => {
      if (token && userId) {
        refreshAccounts();
        return;
      }
      if (oldTx) {
        revertTransaction(oldTx);
      }
      if (newTx) {
        applyTransaction(newTx);
      }
    },
    [token, userId, refreshAccounts, revertTransaction, applyTransaction]
  );

  const value = useMemo(
    () => ({
      accounts,
      banks,
      wallets,
      totalBalance,
      banksTotal,
      walletsTotal,
      refreshAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
      depositToAccount,
      withdrawFromAccount,
      transferBetweenAccounts,
      reconcileAccount,
      reconcileAllAccounts,
      resolveAccountId,
      applyTransaction,
      revertTransaction,
      adjustTransaction,
    }),
    [
      accounts,
      banks,
      wallets,
      totalBalance,
      banksTotal,
      walletsTotal,
      refreshAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
      depositToAccount,
      withdrawFromAccount,
      transferBetweenAccounts,
      reconcileAccount,
      reconcileAllAccounts,
      resolveAccountId,
      applyTransaction,
      revertTransaction,
      adjustTransaction,
    ]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};

export default AccountsContext;
