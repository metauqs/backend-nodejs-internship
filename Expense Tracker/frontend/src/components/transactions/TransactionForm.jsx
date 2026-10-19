import React, { useState, useMemo } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { TRANSACTION_TYPES, DEFAULT_CATEGORIES } from '../../utils/constants';
import { formatDateForInput } from '../../utils/formatDate';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import { useBudget } from '../../context/BudgetContext';
import CategoryIconGrid from './CategoryIconGrid';
import SetBudgetModal from './SetBudgetModal';
import {
  AlertTriangle,
  Target,
  Wallet,
  Building2,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  Settings,
} from 'lucide-react';

export const TransactionForm = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  onCancel,
  existingTransactions = [],
}) => {
  const { format, currencyDetails } = useCurrency();
  const { accounts } = useAccounts();
  const { getBudgetStatus, getMonthKey, monthlyBudget } = useBudget();

  // Form State
  const [formData, setFormData] = useState(() => ({
    title: initialData.title || '',
    amount: initialData.amount || '',
    type: initialData.type || TRANSACTION_TYPES.EXPENSE,
    category: initialData.category || 'Food',
    date: initialData.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date()),
    accountId: initialData.accountId || initialData.account || accounts[0]?.id || accounts[0]?._id || '',
    description: initialData.description || '',
    hasReminder: Boolean(initialData.hasReminder),
    reminderDate: initialData.reminderDate || '',
    reminderNote: initialData.reminderNote || '',
  }));

  const [errors, setErrors] = useState({});
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Keep accountId in sync once accounts finish loading if initially empty
  useEffect(() => {
    if (!formData.accountId && accounts.length > 0) {
      const defaultId = accounts[0]?.id || accounts[0]?._id || '';
      setFormData((prev) => ({
        ...prev,
        accountId: prev.accountId || defaultId,
      }));
    }
  }, [accounts, formData.accountId]);

  // Selected account details
  const selectedAccount = useMemo(() => {
    if (!formData.accountId) return accounts[0] || null;
    return (
      accounts.find(
        (a) =>
          (a.id && String(a.id) === String(formData.accountId)) ||
          (a._id && String(a._id) === String(formData.accountId))
      ) ||
      accounts[0] ||
      null
    );
  }, [accounts, formData.accountId]);

  // Live Budget Calculation for the transaction's month
  const budgetStatus = useMemo(() => {
    const txDate = formData.date ? new Date(formData.date) : new Date();
    const prospectiveExpense = formData.type === TRANSACTION_TYPES.EXPENSE
      ? parseFloat(formData.amount) || 0
      : 0;
    return getBudgetStatus(existingTransactions, txDate, prospectiveExpense);
  }, [formData.date, formData.amount, formData.type, existingTransactions, getBudgetStatus]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategorySelect = (categoryName) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      // If user hasn't typed a title yet, auto-suggest the category name
      title: prev.title.trim() === '' ? categoryName : prev.title,
    }));

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.accountId && accounts.length > 0) {
      newErrors.accountId = 'Please select an account';
    }
    if (formData.hasReminder && !formData.reminderDate) {
      newErrors.reminderDate = 'Please select a reminder date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const numAmount = parseFloat(formData.amount);
    const chosenAccountId =
      formData.accountId ||
      selectedAccount?.id ||
      selectedAccount?._id ||
      accounts[0]?.id ||
      accounts[0]?._id ||
      '';

    const txPayload = {
      ...formData,
      amount: numAmount,
      accountId: chosenAccountId,
      accountName: selectedAccount?.name || 'Primary Account',
      accountNumber: selectedAccount?.accountNumber || '',
      accountType: selectedAccount?.type || 'bank',
    };

    if (onSubmit) {
      onSubmit(txPayload);
    }
  };

  const isExpense = formData.type === TRANSACTION_TYPES.EXPENSE;
  const numAmount = parseFloat(formData.amount) || 0;
  const isInsufficientAccount = selectedAccount && isExpense && numAmount > (selectedAccount.balance || 0);

  return (
    <form onSubmit={handleSubmit} className="transaction-form-modern">
      {/* 1. Monthly Budget Indicator & Warning at Top */}
      {isExpense && (
        <div className={`budget-live-alert-card ${budgetStatus.willExceed || budgetStatus.isExceeded ? 'alert-exceeded' : 'alert-normal'}`}>
          <div className="budget-live-alert-left">
            <div className="budget-alert-icon">
              {budgetStatus.willExceed || budgetStatus.isExceeded ? (
                <AlertTriangle size={20} />
              ) : (
                <Target size={20} />
              )}
            </div>
            <div>
              <div className="budget-alert-title-row">
                <span className="budget-alert-title">
                  {budgetStatus.budget === 0
                    ? 'No Monthly Budget Set'
                    : budgetStatus.willExceed
                    ? `⚠️ Hit & Exceeded Monthly Budget by ${format(budgetStatus.willExceedAmount)}!`
                    : budgetStatus.isExceeded
                    ? `⚠️ Monthly Budget Already Exceeded by ${format(budgetStatus.exceededAmount)}!`
                    : `Monthly Budget: ${format(budgetStatus.budget)}`}
                </span>
                <button
                  type="button"
                  className="budget-adjust-link"
                  onClick={() => setIsBudgetModalOpen(true)}
                >
                  <Settings size={12} />
                  <span>{budgetStatus.budget === 0 ? 'Set Budget' : 'Adjust Budget'}</span>
                </button>
              </div>

              <div className="budget-alert-desc">
                {budgetStatus.budget === 0 ? (
                  <span>
                    No spending limit defined for this month. Set a budget to receive alerts when expenses approach or exceed your limit.
                  </span>
                ) : budgetStatus.willExceed ? (
                  <span>
                    Adding this expense of <strong>{format(numAmount)}</strong> will push monthly spending to <strong>{format(budgetStatus.totalWithProspective)}</strong>, exceeding your <strong>{format(budgetStatus.budget)}</strong> budget!
                  </span>
                ) : (
                  <span>
                    Spent so far this month: <strong>{format(budgetStatus.currentSpent)}</strong> • Available: <strong>{format(budgetStatus.remaining)}</strong> ({budgetStatus.percentSpent}% used)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Type Selector Tabs: Expense vs Income */}
      <div className="tx-type-tabs">
        <button
          type="button"
          className={`tx-type-tab ${formData.type === TRANSACTION_TYPES.EXPENSE ? 'active-expense' : ''}`}
          onClick={() => {
            setFormData((p) => ({ ...p, type: TRANSACTION_TYPES.EXPENSE, category: 'Food' }));
            if (errors.type) setErrors((p) => ({ ...p, type: '' }));
          }}
        >
          Expense
        </button>
        <button
          type="button"
          className={`tx-type-tab ${formData.type === TRANSACTION_TYPES.INCOME ? 'active-income' : ''}`}
          onClick={() => {
            setFormData((p) => ({ ...p, type: TRANSACTION_TYPES.INCOME, category: 'Salary' }));
            if (errors.type) setErrors((p) => ({ ...p, type: '' }));
          }}
        >
          Income
        </button>
      </div>

      {/* 3. Amount & Date Row */}
      <div className="tx-form-row-2col">
        <Input
          label={`Amount (${currencyDetails.symbol.trim()})`}
          name="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={handleChange}
          error={errors.amount}
          required
          autoFocus
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
          required
        />
      </div>

      {/* 4. Title Input */}
      <Input
        label="Title / Payee"
        name="title"
        placeholder="e.g. Grocery store, Salary, Fuel, Electric Bill"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        required
      />

      {/* 5. Account Selection with Balance Display & Auto-Deduction */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <label htmlFor="accountId" className="form-label" style={{ marginBottom: 0 }}>
            {isExpense ? 'Deduct from Account' : 'Deposit into Account'} <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {selectedAccount && (
            <span className="account-balance-tag font-numeric">
              Balance: <strong>{format(selectedAccount.balance)}</strong>
            </span>
          )}
        </div>

        <select
          id="accountId"
          name="accountId"
          className={`form-select ${isInsufficientAccount ? 'select-warning' : ''}`}
          value={formData.accountId}
          onChange={handleChange}
        >
          {accounts.map((acc) => {
            const accKey = acc.id || acc._id;
            return (
              <option key={accKey} value={accKey}>
                {acc.type === 'bank' ? '🏦 ' : '📱 '}
                {acc.name} ({acc.accountNumber}) — {format(acc.balance)}
              </option>
            );
          })}
        </select>

        {isInsufficientAccount && (
          <div className="account-warning-notice">
            <AlertTriangle size={13} />
            <span>
              Warning: Account balance ({format(selectedAccount.balance)}) is lower than this expense ({format(numAmount)}).
            </span>
          </div>
        )}
        {errors.accountId && <span className="form-error">{errors.accountId}</span>}
      </div>

      {/* 6. Category Selection Grid */}
      {isExpense ? (
        <CategoryIconGrid
          selectedCategory={formData.category}
          onSelectCategory={handleCategorySelect}
          error={errors.category}
        />
      ) : (
        <div className="form-group">
          <label className="form-label">
            Income Category <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div className="income-category-chips">
            {DEFAULT_CATEGORIES.income.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`income-chip ${formData.category === cat ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && <span className="form-error">{errors.category}</span>}
        </div>
      )}

      {/* 7. Notes / Description */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">Notes (Optional)</label>
        <textarea
          id="description"
          name="description"
          className="form-textarea"
          rows="2"
          placeholder="Add memo, receipt reference, or extra details..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* 8. Reminder Section */}
      <div className="reminder-box-card">
        <div className="reminder-toggle-header">
          <label className="reminder-checkbox-label">
            <input
              type="checkbox"
              name="hasReminder"
              checked={formData.hasReminder}
              onChange={handleChange}
              className="reminder-checkbox"
            />
            <Bell size={16} />
            <span>Set Reminder for this transaction</span>
          </label>
        </div>

        {formData.hasReminder && (
          <div className="reminder-inputs-grid">
            <Input
              label="Reminder Date & Time"
              name="reminderDate"
              type="datetime-local"
              value={formData.reminderDate}
              onChange={handleChange}
              error={errors.reminderDate}
              required={formData.hasReminder}
            />

            <Input
              label="Reminder Note"
              name="reminderNote"
              placeholder="e.g. Verify receipt, Pay remaining balance"
              value={formData.reminderNote}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* 9. Action Buttons */}
      <div className="form-actions-row">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" type="submit" isLoading={isLoading}>
          {isExpense ? 'Record Expense' : 'Record Income'}
        </Button>
      </div>

      <SetBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        targetMonthKey={getMonthKey(formData.date ? new Date(formData.date) : new Date())}
      />
    </form>
  );
};

export default TransactionForm;
