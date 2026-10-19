import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileText,
  RotateCcw,
  BarChart3,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';

export const TransactionPeriodRecords = ({
  periodType = 'all', // 'all' | 'weekly' | 'monthly' | 'yearly'
  onPeriodTypeChange,
  referenceDate = new Date(),
  onDateShift,
  onResetToCurrent,
  periodInfo = {},
  summary = {
    totalExpense: 0,
    totalIncome: 0,
    netBalance: 0,
    count: 0,
    expenseCount: 0,
    incomeCount: 0,
  },
}) => {
  const { format } = useCurrency();

  const PERIOD_TABS = [
    { id: 'all', label: 'All Records', icon: BarChart3 },
    { id: 'weekly', label: 'Weekly', icon: CalendarDays },
    { id: 'monthly', label: 'Monthly', icon: Calendar },
    { id: 'yearly', label: 'Yearly', icon: CalendarRange },
  ];

  return (
    <div className="period-records-container">
      {/* Top Header: Period Selector Tabs & Navigator */}
      <div className="period-records-header">
        {/* Period Mode Tabs */}
        <div className="period-tabs-wrapper" role="tablist">
          {PERIOD_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = periodType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`period-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPeriodTypeChange(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Period Navigator (Visible for weekly, monthly, yearly) */}
        {periodType !== 'all' && (
          <div className="period-nav-controls">
            <button
              type="button"
              className="period-nav-arrow"
              onClick={() => onDateShift(-1)}
              title={`Previous ${periodType}`}
              aria-label={`Previous ${periodType}`}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="period-nav-badge">
              <span className="period-label-text">{periodInfo.label}</span>
              {periodInfo.isCurrent ? (
                <span className="period-tag current-tag">Current {periodType === 'weekly' ? 'Week' : periodType === 'monthly' ? 'Month' : 'Year'}</span>
              ) : (
                <button
                  type="button"
                  className="period-reset-btn"
                  onClick={onResetToCurrent}
                  title="Jump to current period"
                >
                  <RotateCcw size={12} />
                  <span>Current</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="period-nav-arrow"
              onClick={() => onDateShift(1)}
              title={`Next ${periodType}`}
              aria-label={`Next ${periodType}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Period Financial Summary Strip */}
      <div className="period-summary-grid">
        {/* Period Spending / Expense */}
        <div className="period-summary-card expense-card">
          <div className="period-card-top">
            <span className="period-card-label">
              {periodType === 'all' ? 'Total Spending' : `${periodInfo.shortLabel || ''} Spending`}
            </span>
            <div className="period-card-icon expense-icon">
              <TrendingDown size={17} />
            </div>
          </div>
          <div className="period-card-amount font-numeric amount-expense">
            {format(summary.totalExpense)}
          </div>
          <div className="period-card-sub">
            <span className="sub-dot expense-dot" />
            <span>{summary.expenseCount} {summary.expenseCount === 1 ? 'expense recorded' : 'expenses recorded'}</span>
          </div>
        </div>

        {/* Period Earnings / Income */}
        <div className="period-summary-card income-card">
          <div className="period-card-top">
            <span className="period-card-label">
              {periodType === 'all' ? 'Total Income' : `${periodInfo.shortLabel || ''} Income`}
            </span>
            <div className="period-card-icon income-icon">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="period-card-amount font-numeric amount-income">
            {format(summary.totalIncome)}
          </div>
          <div className="period-card-sub">
            <span className="sub-dot income-dot" />
            <span>{summary.incomeCount} {summary.incomeCount === 1 ? 'income deposit' : 'income deposits'}</span>
          </div>
        </div>

        {/* Net Cashflow / Balance */}
        <div className="period-summary-card net-card">
          <div className="period-card-top">
            <span className="period-card-label">Net Cash Flow</span>
            <div className="period-card-icon net-icon">
              <Wallet size={17} />
            </div>
          </div>
          <div className="period-card-amount font-numeric amount-net">
            <span className={summary.netBalance >= 0 ? 'net-positive' : 'net-negative'}>
              {summary.netBalance >= 0 ? `+${format(summary.netBalance)}` : format(summary.netBalance)}
            </span>
          </div>
          <div className="period-card-sub">
            <span className={`sub-pill ${summary.netBalance >= 0 ? 'pill-surplus' : 'pill-deficit'}`}>
              {summary.netBalance >= 0 ? 'Surplus / Saved' : 'Deficit / Overspent'}
            </span>
          </div>
        </div>

        {/* Total Records Count */}
        <div className="period-summary-card records-card">
          <div className="period-card-top">
            <span className="period-card-label">Period Records</span>
            <div className="period-card-icon records-icon">
              <FileText size={17} />
            </div>
          </div>
          <div className="period-card-amount font-numeric amount-records">
            {summary.count}
          </div>
          <div className="period-card-sub">
            <span className="sub-dot records-dot" />
            <span>Transactions in record</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPeriodRecords;
