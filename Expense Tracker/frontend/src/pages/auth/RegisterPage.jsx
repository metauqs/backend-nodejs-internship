import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import useAuth from '../../hooks/useAuth';
import { useCurrency } from '../../context/CurrencyContext';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../../utils/constants';
import { validatePasswordRequirements } from '../../utils/validators';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: DEFAULT_CURRENCY, // Default to PKR
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { setCurrency } = useCurrency();
  const navigate = useNavigate();

  const passwordReqs = validatePasswordRequirements(formData.password);
  const passwordsMatch = Boolean(
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!passwordReqs.hasUpper) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }

    if (!passwordReqs.hasLower) {
      setError('Password must contain at least one lowercase letter (a-z)');
      return;
    }

    if (!passwordReqs.hasNumber) {
      setError('Password must contain at least one numeric digit (0-9)');
      return;
    }

    if (!passwordReqs.hasSpecial) {
      setError('Password must contain at least one special character (!, @, #, $, %, etc.)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match. Please verify.');
      return;
    }

    try {
      setIsLoading(true);
      setCurrency(formData.currency);

      const { confirmPassword, ...registerPayload } = formData;
      await register(registerPayload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-content register-compact-content">
      <div className="auth-form-header register-header">
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">
          
Personal Expense Tracker
        </p>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="auth-form register-form">
        {/* Row 1: Full Name & Email Address (Side-by-Side) */}
        <div className="auth-2col-row">
          <Input
            label="Full Name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            className="compact-form-group"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="compact-form-group"
          />
        </div>

        {/* Row 2: Password & Confirm Password (Side-by-Side) */}
        <div className="auth-2col-row">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="compact-form-group"
          />

          <div className="form-group compact-form-group">
            <div className="label-with-badge">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span style={{ color: 'var(--color-expense)' }}>*</span>
              </label>
              {formData.confirmPassword.length > 0 && (
                <span className={`match-pill ${passwordsMatch ? 'match-pill-success' : 'match-pill-error'}`}>
                  {passwordsMatch ? '✓ Match' : '✕ No match'}
                </span>
              )}
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="form-input"
            />
          </div>
        </div>

        {/* Compact Password Security Criteria (2x3 Grid - Always visible to ensure fixed no-scroll layout) */}
        <div className="password-checklist-grid">
          <div className={`req-chip ${passwordReqs.minLength ? 'valid' : ''}`}>
            <span className="req-icon">{passwordReqs.minLength ? '✓' : '•'}</span>
            <span>8+ characters</span>
          </div>
          <div className={`req-chip ${passwordReqs.hasUpper ? 'valid' : ''}`}>
            <span className="req-icon">{passwordReqs.hasUpper ? '✓' : '•'}</span>
            <span>1 Uppercase (A-Z)</span>
          </div>
          <div className={`req-chip ${passwordReqs.hasLower ? 'valid' : ''}`}>
            <span className="req-icon">{passwordReqs.hasLower ? '✓' : '•'}</span>
            <span>1 Lowercase (a-z)</span>
          </div>
          <div className={`req-chip ${passwordReqs.hasNumber ? 'valid' : ''}`}>
            <span className="req-icon">{passwordReqs.hasNumber ? '✓' : '•'}</span>
            <span>1 Number (0-9)</span>
          </div>
          <div className={`req-chip ${passwordReqs.hasSpecial ? 'valid' : ''}`}>
            <span className="req-icon">{passwordReqs.hasSpecial ? '✓' : '•'}</span>
            <span>1 Special (!@#$%)</span>
          </div>
          <div className={`req-chip ${passwordsMatch ? 'valid' : ''}`}>
            <span className="req-icon">{passwordsMatch ? '✓' : '•'}</span>
            <span>Passwords match</span>
          </div>
        </div>

        {/* Row 3: Preferred Currency Dropdown */}
        <div className="form-group compact-form-group">
          <label htmlFor="currency-select" className="form-label">
            Preferred Currency <span style={{ color: 'var(--color-expense)' }}>*</span>
          </label>
          <select
            id="currency-select"
            name="currency"
            className="form-select font-numeric"
            value={formData.currency}
            onChange={handleChange}
            required
            style={{ fontWeight: 600 }}
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.label} ({curr.symbol}) — {curr.code}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-btn register-submit-btn"
          isLoading={isLoading}
        >
          Register & Get Started
        </Button>
      </form>

      <div className="auth-card-footer register-footer">
        Already have an account?{' '}
        <Link to="/login" className="auth-switch-link">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
