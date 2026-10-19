import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STORAGE_KEYS, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../utils/constants';
import { formatCurrency, formatCurrencyParts, getCurrencyDetails } from '../utils/formatCurrency';
import AuthContext from './AuthContext';

export const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const auth = useContext(AuthContext);

  const [currency, setCurrencyState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (stored) return stored;
      if (auth?.user?.currency) return auth.user.currency;
      return DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  // Keep currency synced if user logs in with a specific currency preference
  useEffect(() => {
    if (auth?.user?.currency && auth.user.currency !== currency) {
      setCurrencyState(auth.user.currency);
      localStorage.setItem(STORAGE_KEYS.CURRENCY, auth.user.currency);
    }
  }, [auth?.user?.currency, currency]);

  const setCurrency = useCallback((newCode) => {
    const valid = SUPPORTED_CURRENCIES.find((c) => c.code === newCode);
    const codeToSet = valid ? valid.code : DEFAULT_CURRENCY;

    setCurrencyState(codeToSet);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, codeToSet);

    if (auth?.updateUser && auth?.user) {
      auth.updateUser({ currency: codeToSet });
    }
  }, [auth]);

  const currencyDetails = useMemo(() => getCurrencyDetails(currency), [currency]);

  const format = useCallback(
    (amount) => formatCurrency(amount, currency),
    [currency]
  );

  const formatParts = useCallback(
    (amount) => formatCurrencyParts(amount, currency),
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      currencyDetails,
      setCurrency,
      format,
      formatParts,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    }),
    [currency, currencyDetails, setCurrency, format, formatParts]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback outside provider
    return {
      currency: DEFAULT_CURRENCY,
      currencyDetails: getCurrencyDetails(DEFAULT_CURRENCY),
      setCurrency: () => {},
      format: (val) => formatCurrency(val, DEFAULT_CURRENCY),
      formatParts: (val) => formatCurrencyParts(val, DEFAULT_CURRENCY),
      supportedCurrencies: SUPPORTED_CURRENCIES,
    };
  }
  return context;
};

export default CurrencyContext;
