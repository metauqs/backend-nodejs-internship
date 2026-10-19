import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import useAuth from '../../hooks/useAuth';

export const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-content">
      <div className="auth-form-header">
        <h2 className="auth-form-title">Welcome Back</h2>
        <p className="auth-form-subtitle">
          Personal Expense Tracker
        </p>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={credentials.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={credentials.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-btn"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="auth-card-footer">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="auth-switch-link">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
