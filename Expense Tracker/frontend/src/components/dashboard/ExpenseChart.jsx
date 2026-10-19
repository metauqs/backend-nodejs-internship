import React from 'react';
import formatCurrency from '../../utils/formatCurrency';

export const ExpenseChart = ({
  data = [],
  title = 'Expense Breakdown by Category',
  loading = false,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading chart data...
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No expense category data recorded yet for this period.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {data.map((item, idx) => {
            const percentage = item.percentage || 0;
            return (
              <div key={item.category || idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>{item.category}</span>
                  <span className="font-numeric" style={{ color: 'var(--color-text-muted)' }}>
                    {formatCurrency(item.amount)} ({percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-cream)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;
