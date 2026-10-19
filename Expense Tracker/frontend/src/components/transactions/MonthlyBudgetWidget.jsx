import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useCurrency } from '../../context/CurrencyContext';
import SetBudgetModal from './SetBudgetModal';
import { Target, AlertTriangle, CheckCircle2, TrendingUp, Settings } from 'lucide-react';

export const MonthlyBudgetWidget = ({
  transactions = [],
  selectedMonth = new Date(),
}) => {
  const { getBudgetStatus, getMonthKey } = useBudget();
  const { format } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);


  
  const monthKey = getMonthKey(selectedMonth);
  const status = getBudgetStatus(transactions, selectedMonth, 0);

  const monthName = new Date(selectedMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className={`monthly-budget-card ${status.isExceeded ? 'budget-exceeded-state' : ''}`}>
        <div className="budget-card-top">
          <div className="budget-card-header-left">
            <div className={`budget-icon-circle ${status.isExceeded ? 'exceeded-icon' : ''}`}>
              {status.isExceeded ? <AlertTriangle size={20} /> : <Target size={20} />}
            </div>
            <div>
              <div className="budget-card-title-row">
                <h3 className="budget-card-title">Monthly Budget — {monthName}</h3>
                {status.isExceeded && (
                  <span className="budget-status-badge exceeded-badge">
                    Hit & Exceeded Limit
                  </span>
                )}
                {!status.isExceeded && status.percentSpent >= 80 && (
                  <span className="budget-status-badge warning-badge">
                    Near Limit ({status.percentSpent}%)
                  </span>
                )}
              </div>
              <p className="budget-card-subtitle">
                {status.budget === 0
                  ? 'No budget set for this month. Click "Set Budget" to define your spending limit.'
                  : status.isExceeded
                  ? `You have exceeded your monthly budget by ${format(status.exceededAmount)}!`
                  : `${format(status.remaining)} remaining of ${format(status.budget)} budget`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="budget-edit-btn"
            onClick={() => setIsModalOpen(true)}
            title="Adjust Monthly Budget"
          >
            <Settings size={14} />
            <span>{status.budget === 0 ? 'Set Budget' : 'Adjust Budget'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="budget-bar-track">
          <div
            className={`budget-bar-fill ${status.budget === 0 ? '' : status.isExceeded ? 'fill-exceeded' : status.percentSpent > 80 ? 'fill-warning' : 'fill-healthy'}`}
            style={{ width: `${status.budget === 0 ? 0 : Math.min(100, status.percentSpent)}%` }}
          />
        </div>

        {/* Stats Row */}
        <div className="budget-stats-row">
          <div className="budget-stat-item">
            <span className="budget-stat-label">Budget Limit</span>
            <span className="budget-stat-value font-numeric">
              {status.budget === 0 ? 'Not Set' : format(status.budget)}
            </span>
          </div>

          <div className="budget-stat-item">
            <span className="budget-stat-label">Total Spent</span>
            <span className={`budget-stat-value font-numeric ${status.isExceeded ? 'text-danger' : ''}`}>
              {format(status.currentSpent)}
            </span>
          </div>

          <div className="budget-stat-item">
            <span className="budget-stat-label">
              {status.budget === 0 ? 'Remaining' : status.isExceeded ? 'Exceeded By' : 'Remaining'}
            </span>
            <span className={`budget-stat-value font-numeric ${status.budget === 0 ? 'text-muted' : status.isExceeded ? 'text-danger-bold' : 'text-success'}`}>
              {status.budget === 0 ? '—' : status.isExceeded ? `+${format(status.exceededAmount)}` : format(status.remaining)}
            </span>
          </div>

          <div className="budget-stat-item">
            <span className="budget-stat-label">Usage</span>
            <span className={`budget-stat-value font-numeric ${status.isExceeded ? 'text-danger' : ''}`}>
              {status.budget === 0 ? '0%' : `${status.percentSpent}%`}
            </span>
          </div>
        </div>
      </div>

      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetMonthKey={monthKey}
      />
    </>
  );
};

export default MonthlyBudgetWidget;
