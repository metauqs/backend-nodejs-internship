import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, STORAGE_KEYS } from './constants';

/**
 * Get active currency details
 * @param {string} [code] - Currency code (e.g. 'PKR', 'USD', 'CAD', 'INR')
 */
export const getCurrencyDetails = (code) => {
  const targetCode = code || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CURRENCY) : null) || DEFAULT_CURRENCY;
  const match = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === targetCode.toUpperCase());
  return match || SUPPORTED_CURRENCIES[0];
};

/**
 * Format a numeric amount as currency string based on active currency
 * @param {number|string} amount
 * @param {string} [currencyCode] - Optional override, defaults to active currency
 * @returns {string} Formatted currency string (e.g. "₨ 1,842.56")
 */
export const formatCurrency = (amount, currencyCode) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const currency = getCurrencyDetails(currencyCode);

  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return `${currency.prefix}0.00`;
  }

  const formattedNumber = Math.abs(numericAmount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = numericAmount < 0 ? '-' : '';
  return `${sign}${currency.prefix}${formattedNumber}`;
};

/**
 * Break formatted currency into parts (symbol, integer dollars, fraction cents)
 * Ideal for styling hero cards where decimals are smaller.
 * @param {number|string} amount
 * @param {string} [currencyCode]
 */
export const formatCurrencyParts = (amount, currencyCode) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const currency = getCurrencyDetails(currencyCode);

  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return {
      symbol: currency.prefix,
      dollars: '0',
      cents: '00',
      full: `${currency.prefix}0.00`,
      isNegative: false,
    };
  }

  const isNegative = numericAmount < 0;
  const absAmount = Math.abs(numericAmount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [dollars, cents] = formatted.split('.');

  return {
    symbol: currency.prefix,
    dollars: (isNegative ? '-' : '') + dollars,
    cents: cents || '00',
    full: (isNegative ? '-' : '') + `${currency.prefix}${formatted}`,
    isNegative,
  };
};

export default formatCurrency;
