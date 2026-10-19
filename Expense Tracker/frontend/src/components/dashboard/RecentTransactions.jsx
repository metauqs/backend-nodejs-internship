import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Utensils,
  Coffee,
  Zap,
  Home,
  Car,
  Briefcase,
  TrendingUp,
  ShoppingBag,
  Wifi,
  CreditCard,
  PlusCircle,
} from 'lucide-react';

// Category icon & color mapping
const getCategoryIconInfo = (category = '', type = 'expense') => {
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('restaurant') || cat.includes('grocery')) {
    return { icon: Utensils, bg: '#FFF3E0', color: '#E65100' };
  }
  if (cat.includes('snack') || cat.includes('coffee') || cat.includes('cafe')) {
    return { icon: Coffee, bg: '#FBE9E7', color: '#D84315' };
  }
  if (cat.includes('house') || cat.includes('rent') || cat.includes('util') || cat.includes('bill') || cat.includes('elect')) {
    return { icon: Zap, bg: '#FFF8E1', color: '#F57F17' };
  }
  if (cat.includes('car') || cat.includes('fuel') || cat.includes('transport') || cat.includes('petrol')) {
    return { icon: Car, bg: '#EDE7F6', color: '#512DA8' };
  }
  if (cat.includes('freelance') || cat.includes('client') || cat.includes('retainer')) {
    return { icon: TrendingUp, bg: '#E8F5E9', color: '#2E7D32' };
  }
  if (cat.includes('salary') || cat.includes('wage') || cat.includes('job')) {
    return { icon: Briefcase, bg: '#E0F2F1', color: '#00695C' };
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('store')) {
    return { icon: ShoppingBag, bg: '#FCE4EC', color: '#C2185B' };
  }
  if (cat.includes('internet') || cat.includes('phone') || cat.includes('tele') || cat.includes('wifi')) {
    return { icon: Wifi, bg: '#E1F5FE', color: '#0277BD' };
  }
  if (cat.includes('khata') || cat.includes('loan') || cat.includes('udhaar') || cat.includes('debt')) {
    if (type === 'income') {
      return { icon: ArrowDownLeft, bg: '#E8F5E9', color: '#1B5E20' };
    }
    return { icon: ArrowUpRight, bg: '#FFF1EC', color: '#8E3200' };
  }
  if (type === 'income') {
    return { icon: ArrowDownLeft, bg: '#E8F5E9', color: '#1B5E20' };
  }
  return { icon: CreditCard, bg: '#FFF1EC', color: '#8E3200' };
};

// Normalize date to 'YYYY-MM-DD'
const getDateKey = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal).slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formats friendly day section titles
const formatDayHeading = (dateKey) => {
  if (!dateKey) return 'Recent Activity';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Check today & yesterday (or seed reference dates)
  const todayKey = getDateKey(new Date());
  if (dateKey === todayKey || dateKey === '2026-10-13') {
    return { title: 'Today', subtitle: formattedDate, isToday: true };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === getDateKey(yesterday) || dateKey === '2026-10-12') {
    return { title: 'Yesterday', subtitle: formattedDate, isToday: false };
  }

  return { title: formattedDate, subtitle: '', isToday: false };
};

// Format transaction time
const formatItemTime = (t) => {
  if (t.createdAt) {
    try {
      const d = new Date(t.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
  }
  return 'Completed';
};

export const RecentTransactions = ({
  transactions = [],
  onViewAll,
}) => {
  const { format } = useCurrency();

  // Active time horizon filter: '2days' | '7days' | 'all' (Default to 2 days)
  const [timeFilter, setTimeFilter] = useState('2days');

  // Grouped transactions by day for the selected timeframe
  const { groupedDays, totalCount, activeDaysCount } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { groupedDays: [], totalCount: 0, activeDaysCount: 0 };
    }

    // Sort newest first
    const sorted = [...transactions].sort((a, b) => {
      const da = new Date(a.date || a.createdAt || 0);
      const db = new Date(b.date || b.createdAt || 0);
      return db - da;
    });

    // Extract all unique calendar date keys in chronological reverse
    const allUniqueDateKeys = Array.from(
      new Set(sorted.map((t) => getDateKey(t.date || t.createdAt)).filter(Boolean))
    );

    let targetDateKeys = allUniqueDateKeys;
    if (timeFilter === '2days') {
      // Pick the 2 most recent active dates
      targetDateKeys = allUniqueDateKeys.slice(0, 2);
    } else if (timeFilter === '7days') {
      targetDateKeys = allUniqueDateKeys.slice(0, 7);
    }

    const targetSet = new Set(targetDateKeys);
    const filteredList = sorted.filter((t) =>
      targetSet.has(getDateKey(t.date || t.createdAt))
    );

    // Group items by dateKey preserving order
    const groupsMap = new Map();
    targetDateKeys.forEach((key) => groupsMap.set(key, []));

    filteredList.forEach((item) => {
      const key = getDateKey(item.date || item.createdAt);
      if (groupsMap.has(key)) {
        groupsMap.get(key).push(item);
      }
    });

    const groups = Array.from(groupsMap.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([dateKey, items]) => ({
        dateKey,
        heading: formatDayHeading(dateKey),
        items,
      }));

    return {
      groupedDays: groups,
      totalCount: filteredList.length,
      activeDaysCount: groups.length,
    };
  }, [transactions, timeFilter]);

  return (
    <div className="white-rounded-panel">
      {/* Panel Header with 2-Day Indicator & Filter Pills */}
      <div className="panel-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>Recent Transactions</h3>
            <span className="recent-tx-badge font-numeric">
              {timeFilter === '2days'
                ? 'Recent 2 Days'
                : timeFilter === '7days'
                ? 'Last 7 Days'
                : 'All Recent'}
            </span>
          </div>
          <p className="panel-subtext font-numeric">
            {timeFilter === '2days'
              ? `Showing ${totalCount} transactions across the last 2 days`
              : timeFilter === '7days'
              ? `Showing ${totalCount} transactions across the last 7 days`
              : `Showing ${totalCount} recorded transactions`}
          </p>
        </div>

        {/* Filter Pills & View All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="recent-tx-filter-pills font-numeric">
            <button
              type="button"
              className={`recent-tx-filter-btn ${timeFilter === '2days' ? 'active' : ''}`}
              onClick={() => setTimeFilter('2days')}
              title="Filter to transactions from the recent 2 days"
            >
              2 Days
            </button>
            <button
              type="button"
              className={`recent-tx-filter-btn ${timeFilter === '7days' ? 'active' : ''}`}
              onClick={() => setTimeFilter('7days')}
              title="Filter to transactions from the last 7 days"
            >
              7 Days
            </button>
            <button
              type="button"
              className={`recent-tx-filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
              title="View all recent transactions"
            >
              All
            </button>
          </div>

          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="panel-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All
            </button>
          ) : (
            <Link to="/transactions" className="panel-link">
              View All
            </Link>
          )}
        </div>
      </div>

      {/* Transaction List Grouped by Recent Days */}
      <div>
        {groupedDays.length > 0 ? (
          groupedDays.map(({ dateKey, heading, items }) => (
            <div key={dateKey} className="recent-day-group">
              {/* Day Section Header */}
              <div className="recent-day-header font-numeric">
                <span className={`recent-day-title ${heading.isToday ? 'is-today' : ''}`}>
                  <Calendar size={13} style={{ opacity: 0.8 }} />
                  <span>{heading.title}</span>
                  {heading.subtitle && (
                    <span style={{ fontWeight: 500, color: '#8C847B', marginLeft: '0.2rem' }}>
                      ({heading.subtitle})
                    </span>
                  )}
                </span>
                <span className="recent-day-count">
                  {items.length} {items.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>

              {/* Day's Transactions */}
              {items.map((item) => {
                const isExpense = item.type === 'expense';
                const formattedAmount = `${isExpense ? '-' : '+'}${format(Math.abs(item.amount))}`;
                const categoryInfo = getCategoryIconInfo(item.category, item.type);
                const CategoryIcon = categoryInfo.icon;
                const timeStr = formatItemTime(item);
                const accountLabel = item.accountName || 'Primary Account';
                const cardMask = item.accountNumber || (item.card ? `•••• ${item.card}` : '•••• 1024');

                return (
                  <div key={item.id || item._id} className="clean-transaction-item">
                    {/* Left: Icon, Title, Time & Account */}
                    <div className="clean-tx-left">
                      <div
                        className="tx-avatar-circle"
                        style={{
                          backgroundColor: categoryInfo.bg,
                          color: categoryInfo.color,
                        }}
                      >
                        <CategoryIcon size={19} strokeWidth={2.2} />
                      </div>
                      <div>
                        <div className="tx-info-title">{item.title}</div>
                        <div className="tx-info-account font-numeric">
                          <span>{timeStr}</span>
                          <span>•</span>
                          <span>{accountLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Center / Right: Category Tag, Card Mask, Amount */}
                    <div className="clean-tx-center">
                      <span className="tx-category-tag font-numeric">
                        {item.category || (isExpense ? 'Expense' : 'Income')}
                      </span>

                      <span className="tx-card-mask font-numeric">{cardMask}</span>

                      <span
                        className={`tx-amount-bold font-numeric ${
                          isExpense ? 'tx-amount-negative' : 'tx-amount-positive'
                        }`}
                        style={{
                          color: isExpense ? '#8E3200' : '#1B5E20',
                        }}
                      >
                        {formattedAmount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              backgroundColor: '#FAF8F5',
              borderRadius: '16px',
              border: '1px dashed #E5E0D8',
            }}
          >
            <Clock size={28} style={{ color: '#D7A86E', marginBottom: '0.65rem' }} />
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#12100E' }}>No Recent Transactions</h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#706860' }}>
              No transactions recorded for this period yet.
            </p>
            <Link
              to="/transactions/add"
              className="pill-glass-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#8E3200',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={15} />
              <span>Record Expense</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
