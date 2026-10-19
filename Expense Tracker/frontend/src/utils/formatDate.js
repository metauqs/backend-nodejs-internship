/**
 * Format date values into clean readable representations
 */

/**
 * Formats a date into a human readable string (e.g. "Oct 12, 2026")
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '-';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
};

/**
 * Formats a date into YYYY-MM-DD input format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${year}-${month}-${day}`;
};

export default formatDate;
