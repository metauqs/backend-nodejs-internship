/**
 * Common input validation utilities
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPassword = (password, minLength = 8) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
};

export const validatePasswordRequirements = (password) => {
  const pwd = password || '';
  return {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>[\]\\/'`~_+=; \-]/.test(pwd),
  };
};

export const isStrongPassword = (password) => {
  const reqs = validatePasswordRequirements(password);
  return (
    reqs.minLength &&
    reqs.hasUpper &&
    reqs.hasLower &&
    reqs.hasNumber &&
    reqs.hasSpecial
  );
};

export const isValidAmount = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};
