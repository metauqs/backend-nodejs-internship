import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ArrowUpRight, Share2, ChevronDown, Calendar, Layers, Clock } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const MONTH_CONFIG = [
  { month: 'Jan', fullMonth: 'January' },
  { month: 'Feb', fullMonth: 'February' },
  { month: 'Mar', fullMonth: 'March' },
  { month: 'Apr', fullMonth: 'April' },
  { month: 'May', fullMonth: 'May' },
  { month: 'Jun', fullMonth: 'June' },
  { month: 'Jul', fullMonth: 'July' },
  { month: 'Aug', fullMonth: 'August' },
  { month: 'Sep', fullMonth: 'September' },
  { month: 'Oct', fullMonth: 'October' },
  { month: 'Nov', fullMonth: 'November' },
  { month: 'Dec', fullMonth: 'December' },
];

const DAYS_IN_MONTH = {
  Jan: 31,
  Feb: 28,
  Mar: 31,
  Apr: 30,
  May: 31,
  Jun: 30,
  Jul: 31,
  Aug: 31,
  Sep: 30,
  Oct: 31,
  Nov: 30,
  Dec: 31,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to parse dates reliably across formats ('YYYY-MM-DD', ISO, etc.)
const parseTxDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const parts = dateVal.split('T')[0].split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1, // 0-indexed
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

export const OverviewCard = ({
  transactions = [],
  trend = '0.0%',
  selectedYear = '2026',
  monthlyData = null,
}) => {
  const { format, formatParts } = useCurrency();
  const barsContainerRef = useRef(null);

  // Current calendar date defaults
  const now = useMemo(() => new Date(), []);
  const currentMonthIdx = now.getMonth(); // 9 (October)
  const currentDayNum = now.getDate(); // e.g. 13 or 14

  // View mode: 'monthly' (12 months overview) vs 'daily' (day-to-day for a month)
  const [viewMode, setViewMode] = useState('monthly');

  // Month selection:
  // - selectedMonthIdx: locked selected month (defaults to currentMonthIdx, e.g. 9 for October)
  // - hoveredMonthIdx: temporary preview on hover (null when not hovering)
  // - activeMonthIdx: hoveredMonthIdx ?? selectedMonthIdx (guarantees current month is active by default!)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() =>
    currentMonthIdx >= 0 && currentMonthIdx < 12 ? currentMonthIdx : 9
  );
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);
  const activeMonthIdx = hoveredMonthIdx !== null ? hoveredMonthIdx : selectedMonthIdx;

  // Day selection (for Day-to-Day view):
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => Math.max(0, currentDayNum - 1));
  const [hoveredDayIdx, setHoveredDayIdx] = useState(null);
  const activeDayIdx = hoveredDayIdx !== null ? hoveredDayIdx : selectedDayIdx;

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchTimerRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setMonthDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    dropdownTimeoutRef.current = setTimeout(() => {
      setMonthDropdownOpen(false);
    }, 220);
  };

  // 1. Calculate real monthly expenditures from transactions for the 12 months
  const monthsData = useMemo(() => {
    const yrNum = parseInt(selectedYear, 10) || 2026;
    const monthTotals = Array(12).fill(0);
    const monthTxCounts = Array(12).fill(0);

    if (Array.isArray(transactions) && transactions.length > 0) {
      transactions.forEach((t) => {
        if (t.type === 'expense' && t.date) {
          const parsed = parseTxDate(t.date);
          if (parsed && parsed.year === yrNum && parsed.month >= 0 && parsed.month < 12) {
            monthTotals[parsed.month] += Number(t.amount) || 0;
            monthTxCounts[parsed.month] += 1;
          }
        }
      });
    }

    const list = MONTH_CONFIG.map((mObj, idx) => {
      let amt = monthTotals[idx];
      // Fallback to monthlyData prop if available and transactions had 0 for this month
      if (amt === 0 && Array.isArray(monthlyData) && monthlyData[idx]) {
        amt = Number(monthlyData[idx].amount) || 0;
      }
      return {
        month: mObj.month,
        fullMonth: mObj.fullMonth,
        amount: amt,
        txCount: monthTxCounts[idx],
      };
    });

    const maxAmount = Math.max(...list.map((m) => m.amount), 1);

    return list.map((item, idx, arr) => {
      const amt = item.amount;
      // Proportional bar height with a clean minimal floor of 8% for baseline dots
      const computedHeight =
        maxAmount > 0 ? Math.max(8, Math.min(95, Math.round((amt / maxAmount) * 95))) : 8;

      let growthVal = '+0.00%';
      if (idx > 0) {
        const prevAmt = arr[idx - 1].amount;
        if (prevAmt > 0) {
          const diff = ((amt - prevAmt) / prevAmt) * 100;
          growthVal = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
        } else if (amt > 0) {
          growthVal = '+100%';
        }
      }

      return {
        ...item,
        height: computedHeight,
        growth: growthVal,
        isPeak: amt === maxAmount && amt > 0,
      };
    });
  }, [transactions, selectedYear, monthlyData]);

  // Total expenditure across the entire year
  const totalYearlySpend = useMemo(() => {
    return monthsData.reduce((sum, m) => sum + m.amount, 0);
  }, [monthsData]);

  // Selected month object (defaults to October)
  const activeMonth = monthsData[activeMonthIdx] || monthsData[currentMonthIdx] || monthsData[0];

  // 2. Calculate day-to-day expenditure breakdown for the active month from real transactions
  const dailyData = useMemo(() => {
    const totalDays = DAYS_IN_MONTH[activeMonth.month] || 31;
    const yrNum = parseInt(selectedYear, 10) || 2026;
    const mIdx = activeMonthIdx;

    const dayBuckets = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(yrNum, mIdx, d);
      const dayOfWeek = dateObj.getDay();
      dayBuckets.push({
        day: d,
        dayName: DAY_NAMES[dayOfWeek],
        dateLabel: `${activeMonth.month} ${d}`,
        fullDate: `${DAY_NAMES[dayOfWeek]}, ${activeMonth.fullMonth} ${d}, ${yrNum}`,
        amount: 0,
        items: [],
      });
    }

    if (Array.isArray(transactions) && transactions.length > 0) {
      transactions.forEach((t) => {
        if (t.type === 'expense' && t.date) {
          const parsed = parseTxDate(t.date);
          if (
            parsed &&
            parsed.year === yrNum &&
            parsed.month === mIdx &&
            parsed.day >= 1 &&
            parsed.day <= totalDays
          ) {
            dayBuckets[parsed.day - 1].amount += Number(t.amount) || 0;
            dayBuckets[parsed.day - 1].items.push(t);
          }
        }
      });
    }

    const maxDayAmount = Math.max(...dayBuckets.map((d) => d.amount), 1);

    return dayBuckets.map((d) => {
      const amt = d.amount;
      const computedHeight =
        maxDayAmount > 0 ? Math.max(8, Math.min(95, Math.round((amt / maxDayAmount) * 95))) : 8;

      return {
        ...d,
        height: computedHeight,
        isPeak: amt === maxDayAmount && amt > 0,
        itemCount: d.items.length,
      };
    });
  }, [activeMonth, activeMonthIdx, selectedYear, transactions]);

  // Active day object
  const activeDay = dailyData[activeDayIdx] || dailyData[0];

  // Daily average for the active month
  const dailyAverage = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return 0;
    return activeMonth.amount / dailyData.length;
  }, [dailyData, activeMonth.amount]);

  // Touch scrubbing handler across bars
  const handleTouchMove = useCallback(
    (e) => {
      if (!barsContainerRef.current) return;
      setIsHovered(true);
      const touch = e.touches[0];
      const rect = barsContainerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));

      if (viewMode === 'monthly') {
        const idx = Math.min(monthsData.length - 1, Math.floor(ratio * monthsData.length));
        setHoveredMonthIdx(idx);
      } else {
        const idx = Math.min(dailyData.length - 1, Math.floor(ratio * dailyData.length));
        setHoveredDayIdx(idx);
      }
    },
    [viewMode, monthsData.length, dailyData.length]
  );

  const handleTouchStart = (e) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setIsHovered(true);
    handleTouchMove(e);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setIsHovered(false);
      setHoveredMonthIdx(null);
      setHoveredDayIdx(null);
    }, 2500);
  };

  // Clicking a month bar switches directly to Day-to-Day view for that month
  const handleMonthClick = (idx) => {
    setSelectedMonthIdx(idx);
    setHoveredMonthIdx(null);
    // Focus on today if viewing current month, or first day
    if (idx === currentMonthIdx) {
      setSelectedDayIdx(Math.max(0, currentDayNum - 1));
    } else {
      setSelectedDayIdx(0);
    }
    setHoveredDayIdx(null);
    setViewMode('daily');
    setIsHovered(true);
  };

  // Safe Tooltip Positioning with Clamping so it never overflows edges
  const currentItemsCount = viewMode === 'monthly' ? monthsData.length : dailyData.length;
  const currentActiveIdx = viewMode === 'monthly' ? activeMonthIdx : activeDayIdx;
  const rawPercent = ((currentActiveIdx + 0.5) / currentItemsCount) * 100;
  const clampedPercent = Math.max(16, Math.min(84, rawPercent));
  const arrowOffsetPercent = rawPercent - clampedPercent;

  // Live responsive hero amount:
  // - In 'monthly' mode: shows monthly spend of the active month
  // - In 'daily' mode: shows day-to-day spend of the active day
  const displayedAmount = viewMode === 'monthly' ? activeMonth.amount : activeDay.amount;
  const { symbol, dollars, cents } = formatParts(displayedAmount);

  return (
    <div className="hero-gradient-card overview-interactive-card">
      <div>
        {/* Top Header Row */}
        <div className="card-top-row">
          <span className="card-label">Overview</span>

          <div className="pill-action-group">
            {/* Toggle: Months vs Day-to-Day */}
            <div className="chart-mode-toggle-group">
              <button
                type="button"
                className={`chart-mode-pill ${viewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('monthly');
                  setHoveredMonthIdx(null);
                  setHoveredDayIdx(null);
                  setIsHovered(false);
                }}
                title="View 12 months overview"
              >
                Months
              </button>
              <button
                type="button"
                className={`chart-mode-pill ${viewMode === 'daily' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('daily');
                  setHoveredMonthIdx(null);
                  setHoveredDayIdx(null);
                  setIsHovered(false);
                }}
                title="View day-to-day breakdown"
              >
                Day-to-Day
              </button>
            </div>

            {/* Month Switcher Dropdown */}
            <div
              className="month-dropdown-wrapper"
              style={{ position: 'relative' }}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <button
                type="button"
                className="pill-glass-btn"
                onClick={() => setMonthDropdownOpen((p) => !p)}
                title="Select month / year (Hover to view month table)"
              >
                <Calendar size={13} />
                <span className="font-numeric">
                  {viewMode === 'daily' ? `${activeMonth.month} ${selectedYear}` : `Year ${selectedYear}`}
                </span>
                <ChevronDown size={13} />
              </button>

              {monthDropdownOpen && (
                <div
                  className="overview-month-dropdown"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="overview-month-dropdown-header">
                    <span>Monthly Breakdown</span>
                    <span className="font-numeric">{selectedYear}</span>
                  </div>
                  {monthsData.map((m, idx) => (
                    <button
                      key={m.month}
                      type="button"
                      className={`month-dropdown-item ${idx === activeMonthIdx ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMonthIdx(idx);
                        setHoveredMonthIdx(null);
                        setSelectedDayIdx(0);
                        setHoveredDayIdx(null);
                        setMonthDropdownOpen(false);
                      }}
                      title={`${m.fullMonth}: ${format(m.amount)} (${m.txCount || 0} expenses)`}
                    >
                      <span>{m.fullMonth}</span>
                      <span className="font-numeric">{format(m.amount)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="circle-glass-btn" title="Share Overview">
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Dual Stats Row: Day-to-Day Spend AND Monthly Spend */}
        <div className="overview-stats-row">
          <div className="overview-main-stat">
            <span className="overview-stat-tag">
              <Clock size={12} />
              {viewMode === 'daily'
                ? `Day Spend • ${activeDay.dateLabel}${
                    activeMonthIdx === currentMonthIdx && activeDay.day === currentDayNum
                      ? ' (Today)'
                      : ''
                  }`
                : `Monthly Spend • ${activeMonth.fullMonth} ${selectedYear}`}
            </span>
            <div className="hero-balance-stat font-numeric">
              <span style={{ fontSize: '0.85em', marginRight: '2px' }}>{symbol}</span>
              {dollars}
              <span className="hero-balance-cents font-numeric">.{cents}</span>
            </div>
          </div>

          {/* Secondary Reference Stat */}
          {viewMode === 'daily' ? (
            <div
              className="overview-secondary-stat"
              title={`${activeMonth.fullMonth} total expenditure`}
            >
              <span className="overview-stat-tag">
                <Layers size={11} /> {activeMonth.fullMonth} Monthly Total
              </span>
              <div className="overview-secondary-value font-numeric">
                {format(activeMonth.amount)}
              </div>
            </div>
          ) : (
            <div
              className="overview-secondary-stat"
              title={`Total expenditure across all 12 months in ${selectedYear}`}
            >
              <span className="overview-stat-tag">
                <Layers size={11} /> {selectedYear} Total Spend
              </span>
              <div className="overview-secondary-value font-numeric">
                {format(totalYearlySpend)}
              </div>
            </div>
          )}
        </div>

        {/* Subtitle Badges & Context Row */}
        <div className="overview-badges-row">
          <div className="hero-trend-badge font-numeric">
            <ArrowUpRight size={13} />
            <span>
              {viewMode === 'daily'
                ? activeDay.itemCount > 0
                  ? `${activeDay.itemCount} transaction${activeDay.itemCount === 1 ? '' : 's'} on ${activeDay.dateLabel}`
                  : `No expenses recorded on ${activeDay.dateLabel}`
                : `${activeMonth.growth} vs prev month`}
            </span>
          </div>

          <div
            className="hero-trend-badge font-numeric"
            style={{ background: 'rgba(255, 255, 255, 0.12)', fontSize: '0.72rem' }}
          >
            <span>
              {viewMode === 'daily'
                ? `Daily Avg: ${format(dailyAverage)} (${dailyData.length} days)`
                : activeMonthIdx === currentMonthIdx
                  ? `Current Month Active`
                  : `${activeMonth.fullMonth} Active`}
            </span>
          </div>
        </div>
      </div>

      {/* Histogram Bar Chart */}
      <div
        className="histogram-chart-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredMonthIdx(null);
          setHoveredDayIdx(null);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Tooltip Card */}
        <div
          className={`chart-floating-tooltip ${isHovered ? 'visible' : ''}`}
          style={{
            left: `${clampedPercent}%`,
          }}
        >
          <div
            className="tooltip-pointer-arrow"
            style={{
              left: `calc(50% + ${arrowOffsetPercent * 1.5}px)`,
            }}
          />

          {viewMode === 'monthly' ? (
            <>
              <div className="tooltip-amount-row">
                <span className="tooltip-val font-numeric">{format(activeMonth.amount)}</span>
                {activeMonthIdx === currentMonthIdx && (
                  <span
                    className="tooltip-badge font-numeric"
                    style={{ background: '#FFEBC1', color: '#8E3200', fontWeight: 700 }}
                  >
                    Current Month
                  </span>
                )}
                {activeMonth.isPeak && (
                  <span className="tooltip-badge peak-badge font-numeric">Peak Month</span>
                )}
              </div>
              <div className="tooltip-sub">
                Total spend in {activeMonth.fullMonth} {selectedYear}
              </div>
              <div className="tooltip-drill-hint">
                {activeMonth.txCount > 0
                  ? `${activeMonth.txCount} transaction${activeMonth.txCount === 1 ? '' : 's'} • Tap to view days ↗`
                  : 'Tap to view daily breakdown ↗'}
              </div>
            </>
          ) : (
            <>
              <div className="tooltip-amount-row">
                <span className="tooltip-val font-numeric">{format(activeDay.amount)}</span>
                {activeMonthIdx === currentMonthIdx && activeDay.day === currentDayNum && (
                  <span
                    className="tooltip-badge font-numeric"
                    style={{ background: '#FFEBC1', color: '#8E3200', fontWeight: 700 }}
                  >
                    Today
                  </span>
                )}
                {activeDay.isPeak && (
                  <span className="tooltip-badge peak-badge font-numeric">Peak Day</span>
                )}
              </div>
              <div className="tooltip-sub">{activeDay.fullDate}</div>

              {activeDay.items.length > 0 && (
                <div className="tooltip-items-list">
                  {activeDay.items.slice(0, 2).map((item, i) => (
                    <div key={item.id || i} className="tooltip-item-row">
                      <span className="tooltip-item-title">{item.title}</span>
                      <span className="tooltip-item-amt font-numeric">
                        {format(item.amount)}
                      </span>
                    </div>
                  ))}
                  {activeDay.items.length > 2 && (
                    <div style={{ fontSize: '0.65rem', color: '#8C827A', marginTop: '2px' }}>
                      +{activeDay.items.length - 2} more transaction
                      {activeDay.items.length - 2 === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              )}

              <div className="tooltip-drill-hint">
                Month Total: {format(activeMonth.amount)}
              </div>
            </>
          )}
        </div>

        {/* Vertical Bars Container */}
        <div
          className={`histogram-bars-container ${
            viewMode === 'daily' ? 'daily-bars-grid' : 'monthly-bars-grid'
          }`}
          ref={barsContainerRef}
        >
          {viewMode === 'monthly'
            ? monthsData.map((item, idx) => {
                const isActive = idx === activeMonthIdx;
                const isCurrent = idx === currentMonthIdx;
                return (
                  <div
                    key={item.month}
                    className={`histogram-col ${isActive ? 'active' : ''} ${
                      item.isPeak ? 'peak-col' : ''
                    } ${isCurrent ? 'is-current-month' : ''}`}
                    onMouseEnter={() => {
                      setIsHovered(true);
                      setHoveredMonthIdx(idx);
                    }}
                    onMouseMove={() => {
                      setIsHovered(true);
                      setHoveredMonthIdx(idx);
                    }}
                    onClick={() => handleMonthClick(idx)}
                    title={`${item.fullMonth}: ${format(item.amount)} (${item.txCount || 0} expenses)${
                      isCurrent ? ' • Current Month' : ''
                    } - Tap to view day-to-day`}
                  >
                    <div
                      className="histogram-bar-fill"
                      style={{ height: `${item.height}%` }}
                    />
                  </div>
                );
              })
            : dailyData.map((dayItem, idx) => {
                const isActive = idx === activeDayIdx;
                const isToday = activeMonthIdx === currentMonthIdx && dayItem.day === currentDayNum;
                return (
                  <div
                    key={dayItem.day}
                    className={`histogram-col daily-col ${isActive ? 'active' : ''} ${
                      dayItem.isPeak ? 'peak-col' : ''
                    } ${isToday ? 'is-current-day' : ''}`}
                    onMouseEnter={() => {
                      setIsHovered(true);
                      setHoveredDayIdx(idx);
                    }}
                    onMouseMove={() => {
                      setIsHovered(true);
                      setHoveredDayIdx(idx);
                    }}
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      setHoveredDayIdx(null);
                      setIsHovered(true);
                    }}
                    title={`${dayItem.dateLabel}: ${format(dayItem.amount)} (${dayItem.itemCount} transactions)${
                      isToday ? ' • Today' : ''
                    }`}
                  >
                    <div
                      className="histogram-bar-fill daily-bar-fill"
                      style={{ height: `${dayItem.height}%` }}
                    />
                  </div>
                );
              })}
        </div>

        {/* Axis Labels */}
        <div className="histogram-labels">
          {viewMode === 'monthly' ? (
            monthsData.map((item, idx) => {
              const isActive = idx === activeMonthIdx;
              const isCurrent = idx === currentMonthIdx;
              return (
                <span
                  key={item.month}
                  className={`${isActive ? 'active-label' : ''} ${
                    isCurrent ? 'current-month-label' : ''
                  }`}
                  onClick={() => {
                    setSelectedMonthIdx(idx);
                    setHoveredMonthIdx(null);
                  }}
                  onDoubleClick={() => handleMonthClick(idx)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                  title={`${item.fullMonth}${isCurrent ? ' (Current Month)' : ''} - Tap to select, double-tap for day-to-day`}
                >
                  {item.month}
                  {isCurrent && <span className="current-month-dot" />}
                </span>
              );
            })
          ) : (
            // Day milestones in day-to-day view
            [1, 5, 10, 15, 20, 25, dailyData.length].map((d) => (
              <span
                key={d}
                className={activeDay?.day === d ? 'active-label' : ''}
                onClick={() => {
                  setSelectedDayIdx(d - 1);
                  setHoveredDayIdx(null);
                }}
                style={{ cursor: 'pointer' }}
              >
                {activeMonth.month} {d}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
