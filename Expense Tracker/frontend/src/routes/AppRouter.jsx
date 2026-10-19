import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import TransactionsPage from '../pages/TransactionsPage';
import AddTransactionPage from '../pages/AddTransactionPage';
import EditTransactionPage from '../pages/EditTransactionPage';
import CategoriesPage from '../pages/CategoriesPage';
import AccountsPage from '../pages/AccountsPage';
import KhataPage from '../pages/KhataPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Root redirect to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/new" element={<AddTransactionPage />} />
          <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
          <Route path="/khata" element={<KhataPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<Navigate to="/accounts" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Not Found Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
