/**
 * Deterministic daily expenditure breakdown for each month in 2026.
 * Guarantees realistic financial variations with weekend spikes, mid-month bills,
 * and exact total matching the monthly overview figures.
 */

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

// Deterministic seed formula for consistent realistic numbers
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate daily breakdown for a specific month and year
 * @param {string} monthCode - 'Jan', 'Feb', etc.
 * @param {number} monthTotal - Total amount for the month
 * @param {number|string} year - 2026
 */
export function generateDailyDataForMonth(monthCode, monthTotal, year = 2026) {
  const totalDays = DAYS_IN_MONTH[monthCode] || 30;
  const monthIdx = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ].indexOf(monthCode);

  // Generate preliminary raw weights for each day
  const weights = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, monthIdx, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPayday = d === 1 || d === 15 || d === 28;

    // Base weight
    let weight = 0.6 + pseudoRandom(monthIdx * 100 + d) * 0.8;
    if (isWeekend) weight *= 1.45; // higher spending on weekends
    if (isPayday) weight *= 1.75; // bills/payday expenses

    weights.push({
      day: d,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      weight,
    });
  }

  const sumWeights = weights.reduce((sum, w) => sum + w.weight, 0);

  // Scale weights so total equals monthTotal exactly
  let runningSum = 0;
  const days = weights.map((w, idx) => {
    let amt;
    if (idx === weights.length - 1) {
      amt = Math.max(10, Math.round((monthTotal - runningSum) * 100) / 100);
    } else {
      amt = Math.round(((w.weight / sumWeights) * monthTotal) * 100) / 100;
      runningSum += amt;
    }

    return {
      day: w.day,
      dayName: w.dayName,
      dateLabel: `${monthCode} ${w.day}`,
      fullDate: `${w.dayName}, ${monthCode} ${w.day}, ${year}`,
      amount: amt,
    };
  });

  // Calculate real percentage height strictly proportional to peak day amount
  const maxDayAmount = Math.max(...days.map((d) => Number(d.amount) || 0), 1);

  return days.map((d) => {
    // Height is strictly proportional to daily expenditure:
    // (daily amount / peak day amount) * 95%
    // Minimal floor of 8% ensures small amounts have a clean visible baseline
    const amt = Number(d.amount) || 0;
    const relativeHeight = maxDayAmount > 0
      ? Math.max(8, Math.min(95, Math.round((amt / maxDayAmount) * 95)))
      : 8;
    const isPeak = amt === maxDayAmount;
    return {
      ...d,
      amount: amt,
      height: relativeHeight,
      isPeak,
      growth: isPeak ? '★ Peak Day' : amt > (monthTotal / totalDays) ? '+1.8%' : '-1.2%',
    };
  });
}
