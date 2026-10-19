import React from 'react';
import formatCurrency from '../../utils/formatCurrency';
import { BalanceIcon, IncomeIcon, ExpenseIcon } from '../../assets/icons';

export const SummaryCard = ({
  title,
  amount = 0,
  icon,
  type = 'default', // 'balance' | 'income' | 'expense' | 'default'
  subtitle,
}) => {
  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  const isBalance = type === 'balance';

  const amountColor = isIncome
    ? 'var(--color-income)'
    : isExpense
    ? 'var(--color-expense)'
    : 'var(--color-primary-dark)';

  const defaultIcon = isIncome ? (
    <IncomeIcon size={22} color="var(--color-income)" />
  ) : isExpense ? (
    <ExpenseIcon size={22} color="var(--color-expense)" />
  ) : isBalance ? (
    <BalanceIcon size={22} color="var(--color-primary)" />
  ) : null;

  return (
    <div className="card summary-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {title}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isIncome
              ? 'var(--color-income-bg)'
              : isExpense
              ? 'var(--color-expense-bg)'
              : 'var(--color-cream-light)',
          }}
        >
          {icon || defaultIcon}
        </span>
      </div>
      <div
        className="summary-amount"
        style={{
          fontSize: '1.65rem',
          fontWeight: 700,
          color: amountColor,
          fontFamily: 'var(--font-numeric)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {formatCurrency(amount)}
      </div>
      {subtitle && (
        <span style={{ fontSize: '0.775rem', color: 'var(--color-text-subtle)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default SummaryCard;
