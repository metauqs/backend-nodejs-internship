import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useBudget } from '../../context/BudgetContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Target, AlertTriangle } from 'lucide-react';

export const SetBudgetModal = ({
  isOpen,
  onClose,
  targetMonthKey = null,
}) => {
  const { monthlyBudget, getBudgetForMonth, setMonthlyBudget } = useBudget();
  const { format, currencyDetails } = useCurrency();

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format month name for display
  const displayMonthName = targetMonthKey
    ? (() => {
        try {
          const [y, m] = targetMonthKey.split('-');
          return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
        } catch {
          return targetMonthKey;
        }
      })()
    : 'Monthly';

  // Synchronize amount whenever modal is opened or month changes
  useEffect(() => {
    if (isOpen) {
      const budgetForTarget = targetMonthKey ? getBudgetForMonth(targetMonthKey) : 0;
      setAmount(budgetForTarget > 0 ? String(budgetForTarget) : '');
      setError('');
    }
  }, [isOpen, targetMonthKey, getBudgetForMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid budget amount (0 or greater)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await setMonthlyBudget(num, targetMonthKey);
      onClose();
    } catch (err) {
      console.error('Failed to save monthly budget:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetMonthKey ? `Set Budget — ${displayMonthName}` : 'Set Monthly Budget'}
    >
      <form onSubmit={handleSubmit} className="set-budget-form">
        <div className="budget-modal-hero">
          <div className="budget-modal-icon-circle">
            <Target size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
              Monthly Expenditure Limit
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Set your target spending budget. When recording expenses, the tracker will alert you if your spending reaches or exceeds this limit.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <Input
            label={`Monthly Budget Limit (${currencyDetails.symbol.trim()})`}
            name="budgetAmount"
            type="number"
            step="100"
            min="0"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError('');
            }}
            error={error}
            required
            autoFocus
          />
        </div>

        <div className="budget-quick-presets">
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Quick Presets:
          </span>
          {[25000, 50000, 75000, 100000, 150000].map((preset) => (
            <button
              key={preset}
              type="button"
              className="budget-preset-chip"
              onClick={() => {
                setAmount(String(preset));
                if (error) setError('');
              }}
            >
              {format(preset)}
            </button>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SetBudgetModal;
