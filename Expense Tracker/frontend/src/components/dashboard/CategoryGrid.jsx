import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Shirt,
  Coffee,
  Dumbbell,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Car,
  Utensils,
  Zap,
  X,
  ChevronRight,
  Calendar,
  CreditCard,
  PlusCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Minus,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import transactionService from '../../services/transactionService';

// Helper to robustly parse transaction dates without timezone distortion
const parseTxDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const parts = dateVal.slice(0, 10).split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10),
    };
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
};

// The 4 Primary Master Expense Groups covering all 28 transaction categories
const MASTER_GROUPS = [
  {
    id: 'groceries-food',
    name: 'Groceries & Food',
    icon: <ShoppingCart size={18} />,
    color: '#8E3200',
    bgColor: '#FFF3E0',
    categories: ['food', 'groceries', 'fruit', 'vegetable', 'supermarket', 'market', 'pantry'],
    description: 'Pantry groceries, supermarket supplies, fresh produce, and dining essentials',
  },
  {
    id: 'housing-bills',
    name: 'Housing & Utilities',
    icon: <Home size={18} />,
    color: '#D84315',
    bgColor: '#FBE9E7',
    categories: ['housing', 'home', 'telephone', 'bills', 'electricity', 'internet', 'repair', 'setting', 'water', 'gas'],
    description: 'Electricity bills, fiber internet, rent, repairs, and household utilities',
  },
  {
    id: 'transport-mobility',
    name: 'Transport & Fuel',
    icon: <Car size={18} />,
    color: '#512DA8',
    bgColor: '#EDE7F6',
    categories: ['car', 'fuel', 'transportation', 'travel', 'bus', 'petrol', 'taxi', 'uber'],
    description: 'Vehicle fuel refills, car maintenance, public transit, and travel fares',
  },
  {
    id: 'lifestyle-shopping',
    name: 'Clothes & Lifestyle',
    icon: <Shirt size={18} />,
    color: '#C2185B',
    bgColor: '#FCE4EC',
    categories: [
      'clothes', 'clothes and shoes', 'clothing', 'shopping', 'sport', 'sport & wellness',
      'entertainment', 'beauty', 'social', 'health', 'pet', 'baby', 'gift',
      'donate', 'lottery', 'education', 'cigarette', 'electronics', 'snacks', 'cafes', 'restaurants', 'wine'
    ],
    description: 'Clothing, footwear, fitness, cafes, personal care, and recreational shopping',
  },
];

export const CategoryGrid = ({ transactions: propTransactions = [] }) => {
  const { format, formatParts } = useCurrency();
  const navigate = useNavigate();

  const [localList, setLocalList] = useState(() => {
    try {
      return transactionService.getLocalTransactions() || [];
    } catch {
      return [];
    }
  });
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Load transactions locally if not provided via props
  useEffect(() => {
    if (!propTransactions || propTransactions.length === 0) {
      const load = async () => {
        try {
          const list = await transactionService.getAllTransactions();
          if (Array.isArray(list)) {
            setLocalList(list);
          }
        } catch (err) {
          console.warn('Could not load local transactions for CategoryGrid:', err);
        }
      };
      load();
    }
  }, [propTransactions]);

  const allTransactions = propTransactions.length > 0 ? propTransactions : localList;

  // Filter current month & previous month expense transactions to compute real trends
  const { groupMetrics, totalMonthlyExpenses } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthExpenses = [];
    const prevMonthExpenses = [];

    (allTransactions || []).forEach((t) => {
      if (t.type !== 'expense') return;
      const parsed = parseTxDate(t.date || t.createdAt);
      if (!parsed) {
        currentMonthExpenses.push(t);
        return;
      }

      if (parsed.year === currentYear && parsed.month === currentMonth) {
        currentMonthExpenses.push(t);
      } else if (parsed.year === prevYear && parsed.month === prevMonth) {
        prevMonthExpenses.push(t);
      }
    });

    const totalExpenseSum = currentMonthExpenses.reduce(
      (acc, t) => acc + Math.abs(Number(t.amount) || 0),
      0
    );

    // Aggregate expenses into the 4 Master Groups
    const groups = MASTER_GROUPS.map((group) => {
      // Find all current month transactions matching this group's category keywords
      const matchedCurrent = currentMonthExpenses.filter((t) => {
        const cat = (t.category || '').toLowerCase().trim();
        return group.categories.some((kw) => cat.includes(kw));
      });

      // Find all previous month transactions matching this group's category keywords
      const matchedPrev = prevMonthExpenses.filter((t) => {
        const cat = (t.category || '').toLowerCase().trim();
        return group.categories.some((kw) => cat.includes(kw));
      });

      const currentAmount = matchedCurrent.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount) || 0),
        0
      );

      const prevAmount = matchedPrev.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount) || 0),
        0
      );

      const percentage =
        totalExpenseSum > 0 ? ((currentAmount / totalExpenseSum) * 100).toFixed(1) : '0.0';

      // Calculate dynamic Month-over-Month trend
      let trendText = '0.0%';
      let trendDirection = 'neutral'; // 'up' | 'down' | 'neutral'

      if (prevAmount === 0 && currentAmount === 0) {
        trendText = '0.0%';
        trendDirection = 'neutral';
      } else if (prevAmount === 0 && currentAmount > 0) {
        trendText = '+100%';
        trendDirection = 'up';
      } else if (prevAmount > 0 && currentAmount === 0) {
        trendText = '-100%';
        trendDirection = 'down';
      } else if (prevAmount > 0) {
        const diff = ((currentAmount - prevAmount) / prevAmount) * 100;
        if (Math.abs(diff) < 0.05) {
          trendText = '0.0%';
          trendDirection = 'neutral';
        } else if (diff > 0) {
          trendText = `${diff.toFixed(1)}%`;
          trendDirection = 'up';
        } else {
          trendText = `${Math.abs(diff).toFixed(1)}%`;
          trendDirection = 'down';
        }
      }

      // Extract unique sub-categories present in this group
      const subCategoryMap = new Map();
      matchedCurrent.forEach((t) => {
        const catName = t.category || 'General';
        const cur = subCategoryMap.get(catName) || { count: 0, amount: 0 };
        subCategoryMap.set(catName, {
          count: cur.count + 1,
          amount: cur.amount + Math.abs(Number(t.amount) || 0),
        });
      });

      const subCategories = Array.from(subCategoryMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
      }));

      return {
        ...group,
        totalAmount: currentAmount,
        prevAmount,
        trendText,
        trendDirection,
        transactions: matchedCurrent,
        count: matchedCurrent.length,
        percentage,
        subCategories,
      };
    });

    return {
      groupMetrics: groups,
      totalMonthlyExpenses: totalExpenseSum,
    };
  }, [allTransactions]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedGroup(null);
    };
    if (selectedGroup) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGroup]);

  return (
    <>
      {/* 2x2 Category Spending Grid */}
      <div className="category-2x2-grid">
        {groupMetrics.map((group) => {
          const { symbol, dollars, cents } = formatParts(group.totalAmount);

          return (
            <div
              key={group.id}
              className="category-metric-card interactive-card"
              onClick={() => setSelectedGroup(group)}
              title={`Click to view detailed breakdown for ${group.name}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedGroup(group);
                }
              }}
            >
              <div className="cat-card-header">
                <div>
                  <span className="cat-card-name">{group.name}</span>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#8C847B',
                      marginTop: '0.2rem',
                      fontWeight: 500,
                    }}
                  >
                    {group.count} {group.count === 1 ? 'transaction' : 'transactions'}
                  </div>
                </div>

                <div
                  className="cat-card-icon-circle"
                  style={{
                    backgroundColor: group.bgColor,
                    color: group.color,
                  }}
                >
                  {group.icon}
                </div>
              </div>

              <div>
                <div className="cat-card-amount font-numeric">
                  <span style={{ fontSize: '0.85em', marginRight: '2px' }}>{symbol}</span>
                  {dollars}
                  <span className="cat-card-cents font-numeric">.{cents}</span>
                </div>

                <div
                  className="cat-card-footer-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.45rem',
                  }}
                >
                  <div
                    className={`cat-card-trend font-numeric ${
                      group.trendDirection === 'down'
                        ? 'trend-down-green'
                        : group.trendDirection === 'up'
                        ? 'trend-up-red'
                        : 'trend-neutral'
                    }`}
                    style={{ margin: 0 }}
                  >
                    {group.trendDirection === 'up' && <ArrowUpRight size={13} />}
                    {group.trendDirection === 'down' && <ArrowDownRight size={13} />}
                    {group.trendDirection === 'neutral' && <Minus size={13} />}
                    <span>{group.trendText} from last month</span>
                  </div>

                  <span className="cat-card-action-cue">
                    <span>Details</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====================================================================
          Category Details Modal (Drill-down view on section click)
          ==================================================================== */}
      {selectedGroup && createPortal(
        <div
          className="cat-details-modal-overlay"
          onClick={() => setSelectedGroup(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="cat-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cat-details-header">
              <div className="cat-details-header-left">
                <div
                  className="cat-details-icon-box"
                  style={{
                    backgroundColor: selectedGroup.bgColor,
                    color: selectedGroup.color,
                  }}
                >
                  {React.cloneElement(selectedGroup.icon, { size: 24 })}
                </div>
                <div>
                  <h3 className="cat-details-title">{selectedGroup.name}</h3>
                  <p className="cat-details-subtitle">
                    Monthly Expense Breakdown • {selectedGroup.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="cat-details-close-btn"
                onClick={() => setSelectedGroup(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cat-details-body">
              {/* Top 3 KPI Stat Cards */}
              <div className="cat-details-kpi-row">
                <div className="cat-details-kpi-card">
                  <span className="cat-details-kpi-label">Total Monthly Spent</span>
                  <div className="cat-details-kpi-value font-numeric" style={{ color: '#8E3200' }}>
                    {format(selectedGroup.totalAmount)}
                  </div>
                </div>

                <div className="cat-details-kpi-card">
                  <span className="cat-details-kpi-label">Recorded Activity</span>
                  <div className="cat-details-kpi-value font-numeric">
                    {selectedGroup.count} {selectedGroup.count === 1 ? 'Record' : 'Records'}
                  </div>
                </div>

                <div className="cat-details-kpi-card">
                  <span className="cat-details-kpi-label">Share of Spending</span>
                  <div className="cat-details-kpi-value font-numeric" style={{ color: '#2E7D32' }}>
                    {selectedGroup.percentage}%
                  </div>
                </div>
              </div>

              {/* Subcategories Breakdown Pills */}
              {selectedGroup.subCategories.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5C554E', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Active Sub-Categories
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedGroup.subCategories.map((sub) => (
                      <div
                        key={sub.name}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: '#FAF8F5',
                          border: '1px solid #ECE7DF',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#12100E' }}>{sub.name}</span>
                        <span className="font-numeric" style={{ color: '#8E3200', fontWeight: 700 }}>
                          {format(sub.amount)}
                        </span>
                        <span style={{ fontSize: '0.725rem', color: '#8C847B' }}>
                          ({sub.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recorded Transactions List for this Category */}
              <div>
                <h4 className="cat-details-tx-section-title">
                  <span>Recorded Transactions ({selectedGroup.transactions.length})</span>
                  <span style={{ fontSize: '0.785rem', fontWeight: 500, color: '#8C847B' }}>
                    Current Month
                  </span>
                </h4>

                {selectedGroup.transactions.length > 0 ? (
                  <div className="cat-details-tx-list">
                    {selectedGroup.transactions.map((t, idx) => {
                      const dateStr = t.date
                        ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Recent';
                      const accountStr = t.accountName || 'Primary Account';
                      const cardStr = t.accountNumber || (t.card ? `•••• ${t.card}` : '');

                      return (
                        <div key={t.id || t._id || idx} className="cat-details-tx-item">
                          <div className="cat-details-tx-left">
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: selectedGroup.bgColor,
                                color: selectedGroup.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <CreditCard size={18} />
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <p className="cat-details-tx-title">{t.title}</p>
                              <div className="cat-details-tx-sub font-numeric">
                                <Calendar size={11} style={{ opacity: 0.7 }} />
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span>{accountStr} {cardStr}</span>
                                {t.category && (
                                  <>
                                    <span>•</span>
                                    <span style={{ color: '#8E3200', fontWeight: 600 }}>{t.category}</span>
                                  </>
                                )}
                              </div>
                              {t.description && (
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#8C847B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="cat-details-tx-amount font-numeric">
                            -{format(Math.abs(t.amount))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '2.5rem 1rem',
                      textAlign: 'center',
                      background: '#FAF8F5',
                      borderRadius: '16px',
                      border: '1px dashed #E5E0D8',
                    }}
                  >
                    <Clock size={28} style={{ color: '#D7A86E', marginBottom: '0.5rem' }} />
                    <h5 style={{ margin: '0 0 0.35rem', color: '#12100E' }}>No Expenses Recorded</h5>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#706860' }}>
                      You haven't recorded any expenses in {selectedGroup.name} for this month yet.
                    </p>
                    <button
                      type="button"
                      className="pill-glass-btn"
                      onClick={() => {
                        setSelectedGroup(null);
                        navigate('/transactions/add');
                      }}
                      style={{
                        backgroundColor: '#8E3200',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <PlusCircle size={15} />
                      <span>Record Expense Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="cat-details-footer">
              <button
                type="button"
                className="pill-glass-btn"
                onClick={() => {
                  setSelectedGroup(null);
                  navigate('/transactions');
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#2E2722',
                  border: '1px solid #E5E0D8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View in Transactions Table
              </button>

              <button
                type="button"
                className="profile-save-btn"
                onClick={() => {
                  setSelectedGroup(null);
                  navigate('/transactions/add');
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.875rem',
                }}
              >
                <PlusCircle size={15} />
                <span>Record New Expense</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CategoryGrid;
