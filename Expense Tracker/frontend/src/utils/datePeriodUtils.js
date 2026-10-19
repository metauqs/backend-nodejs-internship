/**
 * Date period helper functions for Weekly, Monthly, and Yearly transaction analysis
 */
import { formatDateForInput } from './formatDate';

/**
 * Get the Monday-Sunday date range for a given date
 * @param {Date|string} date
 * @returns {{ startDate: string, endDate: string, label: string, shortLabel: string, isCurrent: boolean }}
 */
export const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  // Distance from Monday
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrent = today >= monday && today <= sunday;

  const formatOpts = { month: 'short', day: 'numeric' };
  const mondayStr = monday.toLocaleDateString('en-US', formatOpts);
  const sundayStr = sunday.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' });

  return {
    startDate: formatDateForInput(monday),
    endDate: formatDateForInput(sunday),
    label: `${mondayStr} – ${sundayStr}`,
    shortLabel: `${mondayStr} – ${sundayStr}`,
    isCurrent,
    referenceDate: monday,
  };
};

/**
 * Get the first and last day of the month for a given date
 * @param {Date|string} date
 * @returns {{ startDate: string, endDate: string, label: string, shortLabel: string, isCurrent: boolean }}
 */
export const getMonthRange = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() === month;

  const label = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    startDate: formatDateForInput(firstDay),
    endDate: formatDateForInput(lastDay),
    label,
    shortLabel: firstDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    isCurrent,
    referenceDate: firstDay,
    month,
    year,
  };
};

/**
 * Get the full year range (Jan 1 - Dec 31) for a given date
 * @param {Date|string} date
 * @returns {{ startDate: string, endDate: string, label: string, shortLabel: string, isCurrent: boolean }}
 */
export const getYearRange = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();

  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

  const today = new Date();
  const isCurrent = today.getFullYear() === year;

  return {
    startDate: formatDateForInput(firstDay),
    endDate: formatDateForInput(lastDay),
    label: `Year ${year}`,
    shortLabel: `${year}`,
    isCurrent,
    referenceDate: firstDay,
    year,
  };
};

/**
 * Shift a date by delta periods based on period type
 * @param {'weekly'|'monthly'|'yearly'} periodType
 * @param {Date} referenceDate
 * @param {number} delta (+1 or -1)
 * @returns {Date}
 */
export const shiftDateByPeriod = (periodType, referenceDate, delta = 1) => {
  const d = new Date(referenceDate);
  if (periodType === 'weekly') {
    d.setDate(d.getDate() + delta * 7);
  } else if (periodType === 'monthly') {
    d.setMonth(d.getMonth() + delta);
  } else if (periodType === 'yearly') {
    d.setFullYear(d.getFullYear() + delta);
  }
  return d;
};

/**
 * Calculate financial totals (expenses, income, net, count) from a list of transactions
 * @param {Array} transactions
 * @returns {{ totalExpense: number, totalIncome: number, netBalance: number, count: number, expenseCount: number, incomeCount: number }}
 */
export const calculatePeriodSummary = (transactions = []) => {
  let totalExpense = 0;
  let totalIncome = 0;
  let expenseCount = 0;
  let incomeCount = 0;

  transactions.forEach((tx) => {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'expense') {
      totalExpense += amt;
      expenseCount += 1;
    } else if (tx.type === 'income') {
      totalIncome += amt;
      incomeCount += 1;
    }
  });

  return {
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
    count: transactions.length,
    expenseCount,
    incomeCount,
  };
};
