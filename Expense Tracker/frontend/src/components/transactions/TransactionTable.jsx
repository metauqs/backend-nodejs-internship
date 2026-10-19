import React from 'react';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import EmptyState from '../common/EmptyState';
import Loader from '../common/Loader';
import { EditIcon, DeleteIcon, TransactionsIcon, IncomeIcon, ExpenseIcon } from '../../assets/icons';

export const TransactionTable = ({
  transactions = [],
  onEdit,
  onDelete,
  isLoading = false,
  onAddFirst,
}) => {
  if (isLoading) {
    return (
      <div className="card" style={{ minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader message="Loading transactions..." />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card" style={{ minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="No transactions found"
          message="Start tracking your expenses and income by adding your first transaction."
          icon={<TransactionsIcon size={44} color="var(--color-primary)" />}
          actionLabel={onAddFirst ? "Add Transaction" : undefined}
          onAction={onAddFirst}
        />
      </div>
    );
  }

  return (
    <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden', minHeight: '420px' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const txId = tx._id || tx.id;

            return (
              <tr key={txId}>
                <td className="tx-date" style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {formatDate(tx.date)}
                </td>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>{tx.title}</span>
                    {tx.hasReminder && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: '#FFF0DE',
                          color: '#8E3200',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontWeight: 600,
                        }}
                        title={`Reminder: ${tx.reminderDate ? new Date(tx.reminderDate).toLocaleString() : ''} - ${tx.reminderNote || 'Scheduled'}`}
                      >
                        ⏰ Reminder
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.785rem', color: 'var(--color-text-subtle)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
                    {tx.accountName && (
                      <span style={{ background: '#F3F4F6', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {tx.accountType === 'wallet' ? '📱 ' : '🏦 '}
                        {tx.accountName}
                      </span>
                    )}
                    {tx.description && <span>{tx.description}</span>}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {isIncome ? <IncomeIcon size={12} /> : <ExpenseIcon size={12} />}
                    {tx.type}
                  </span>
                </td>
                <td>{tx.category || 'General'}</td>
                <td
                  className="tx-amount"
                  style={{
                    fontWeight: 700,
                    color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
                    fontFamily: 'var(--font-numeric)',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(txId)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Edit Transaction"
                      >
                        <EditIcon size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(txId)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Delete Transaction"
                      >
                        <DeleteIcon size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
