/**
 * Application constants for Expense Tracker
 */

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  SUBSCRIPTION: 'subscription',
};

export const CATEGORY_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  SUBSCRIPTION: 'subscription',
};

export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', symbol: '₨', label: 'Pakistani Rupee (PKR)', prefix: '₨ ' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)', prefix: '$' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)', prefix: '€' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', prefix: '£' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)', prefix: 'AED ' },
  { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal (SAR)', prefix: 'SAR ' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)', prefix: 'CA$' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)', prefix: '₹' },
];

export const DEFAULT_CURRENCY = 'PKR';

export const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds', 'Other'],
  expense: [
    'Food & Dining',
    'Housing & Rent',
    'Utilities',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Education',
    'Other',
  ],
};

export const SORT_OPTIONS = [
  { label: 'Date (Newest first)', value: '-date' },
  { label: 'Date (Oldest first)', value: 'date' },
  { label: 'Amount (Highest first)', value: '-amount' },
  { label: 'Amount (Lowest first)', value: 'amount' },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;

export const STORAGE_KEYS = {
  TOKEN: 'expense_tracker_token',
  USER: 'expense_tracker_user',
  CURRENCY: 'expense_tracker_currency',
  ACCOUNTS: 'expense_tracker_accounts',
  TRANSACTIONS: 'expense_tracker_transactions',
  BUDGET: 'expense_tracker_monthly_budget',
  BUDGET_MAP: 'expense_tracker_monthly_budgets_map',
  KHATA: 'expense_tracker_khata',
};

/**
 * Remove all user-scoped local cached records to guarantee 100% profile isolation
 */
export const clearUserStorageData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_MAP);
    localStorage.removeItem(STORAGE_KEYS.KHATA);
  } catch (e) {
    console.warn('Failed to clear user storage cache:', e);
  }
};

// 28 Expense Categories matching the exact icon grid from user screenshot
export const EXPENSE_CATEGORY_ICONS = [
  { id: 'food', name: 'Food', icon: 'Utensils' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Mic' },
  { id: 'telephone', name: 'Telephone', icon: 'Smartphone' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingCart' },
  { id: 'education', name: 'Education', icon: 'BookOpen' },
  { id: 'beauty', name: 'Beauty', icon: 'Sparkles' },
  { id: 'sport', name: 'Sport', icon: 'Activity' },
  { id: 'social', name: 'Social', icon: 'Users' },
  { id: 'transportation', name: 'Transportation', icon: 'Bus' },
  { id: 'clothing', name: 'Clothing', icon: 'Shirt' },
  { id: 'car', name: 'Car', icon: 'Car' },
  { id: 'wine', name: 'Wine', icon: 'Wine' },
  { id: 'cigarette', name: 'Cigarette', icon: 'Flame' },
  { id: 'electronics', name: 'Electronics', icon: 'Headphones' },
  { id: 'travel', name: 'Travel', icon: 'Plane' },
  { id: 'health', name: 'Health', icon: 'HeartPulse' },
  { id: 'pet', name: 'Pet', icon: 'PawPrint' },
  { id: 'repair', name: 'Repair', icon: 'Wrench' },
  { id: 'housing', name: 'Housing', icon: 'Paintbrush' },
  { id: 'home', name: 'Home', icon: 'Home' },
  { id: 'gift', name: 'Gift', icon: 'Gift' },
  { id: 'donate', name: 'Donate', icon: 'Heart' },
  { id: 'lottery', name: 'Lottery', icon: 'Ticket' },
  { id: 'snacks', name: 'Snacks', icon: 'Cookie' },
  { id: 'baby', name: 'Baby', icon: 'Baby' },
  { id: 'vegetable', name: 'vegetable', icon: 'Carrot' },
  { id: 'fruit', name: 'Fruit', icon: 'Apple' },
  { id: 'setting', name: 'Setting', icon: 'Settings' },
];

export const DEFAULT_MONTHLY_BUDGET = 0;

