import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionActions from '../components/transactions/TransactionActions';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import MonthlyBudgetWidget from '../components/transactions/MonthlyBudgetWidget';
import TransactionPeriodRecords from '../components/transactions/TransactionPeriodRecords';
import Pagination from '../components/common/Pagination';
import transactionService from '../services/transactionService';
import ErrorMessage from '../components/common/ErrorMessage';
import { EXPENSE_CATEGORY_ICONS } from '../utils/constants';
import {
  getWeekRange,
  getMonthRange,
  getYearRange,
  shiftDateByPeriod,
  calculatePeriodSummary,
} from '../utils/datePeriodUtils';
import useAuth from '../hooks/useAuth';
import { useAccounts } from '../context/AccountsContext';

export const TransactionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || null;
  const { refreshAccounts } = useAccounts();

  // Period filter states: 'all' | 'weekly' | 'monthly' | 'yearly'
  const [periodType, setPeriodType] = useState('monthly');
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  // Data states cleanly initialized per session
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    sort: '-date',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute period range information
  const periodInfo = useMemo(() => {
    if (periodType === 'weekly') {
      return getWeekRange(referenceDate);
    } else if (periodType === 'monthly') {
      return getMonthRange(referenceDate);
    } else if (periodType === 'yearly') {
      return getYearRange(referenceDate);
    }
    return {
      startDate: '',
      endDate: '',
      label: 'All Time Records',
      shortLabel: 'All Time',
      isCurrent: true,
      referenceDate,
    };
  }, [periodType, referenceDate]);

  // Sync date range filters with the selected period
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: periodInfo.startDate || '',
      endDate: periodInfo.endDate || '',
      page: 1,
    }));
  }, [periodInfo]);

  // Load all transactions for full summary calculations
  const fetchAllTransactions = useCallback(async () => {
    try {
      const res = await transactionService.getAllTransactions();
      const list = res.data || res || [];
      setAllTransactions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load full transaction list:', err);
    }
  }, []);

  // Fetch paginated transactions based on filters
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionService.getTransactions(filters);
      const data = res.data || res.transactions || res;
      setTransactions(Array.isArray(data) ? data : data.transactions || []);

      if (res.pagination) {
        setPagination({
          currentPage: res.pagination.page || 1,
          totalPages: res.pagination.totalPages || 1,
          totalRecords: res.pagination.total || 0,
        });
      }
    } catch (err) {
      console.warn('Transactions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setAllTransactions([]);
      setPagination({ currentPage: 1, totalPages: 1, totalRecords: 0 });
      return;
    }
    fetchTransactions();
    fetchAllTransactions();
  }, [userId, fetchTransactions, fetchAllTransactions]);

  // Compute period summary totals
  const periodSummary = useMemo(() => {
    let filtered = allTransactions;
    if (periodInfo.startDate) {
      filtered = filtered.filter((t) => t.date && String(t.date).slice(0, 10) >= periodInfo.startDate);
    }
    if (periodInfo.endDate) {
      filtered = filtered.filter((t) => t.date && String(t.date).slice(0, 10) <= periodInfo.endDate);
    }
    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    if (filters.category) {
      filtered = filtered.filter((t) => t.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.title && t.title.toLowerCase().includes(s)) ||
        (t.category && t.category.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s))
      );
    }
    return calculatePeriodSummary(filtered);
  }, [allTransactions, periodInfo, filters.type, filters.category, filters.search]);

  // Handlers for period navigation
  const handlePeriodTypeChange = (newType) => {
    setPeriodType(newType);
    setReferenceDate(new Date());
  };

  const handleDateShift = (delta) => {
    setReferenceDate((prev) => shiftDateByPeriod(periodType, prev, delta));
  };

  const handleResetToCurrent = () => {
    setReferenceDate(new Date());
  };

  const handleEdit = (id) => {
    navigate(`/transactions/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(id);
        if (refreshAccounts) {
          await refreshAccounts();
        }
        fetchTransactions();
        fetchAllTransactions();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete transaction.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      <TransactionActions
        totalCount={pagination.totalRecords || transactions.length}
        onAddClick={() => navigate('/transactions/new')}
      />

      {/* Weekly, Monthly, and Yearly Record Navigation & Financial Summary Strip */}
      <TransactionPeriodRecords
        periodType={periodType}
        onPeriodTypeChange={handlePeriodTypeChange}
        referenceDate={referenceDate}
        onDateShift={handleDateShift}
        onResetToCurrent={handleResetToCurrent}
        periodInfo={periodInfo}
        summary={periodSummary}
      />

      {/* Monthly Budget Widget (Syncs dynamically with viewed month) */}
      <MonthlyBudgetWidget
        transactions={allTransactions}
        selectedMonth={referenceDate}
      />

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <TransactionFilters
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters({
            ...newFilters,
            startDate: periodInfo.startDate || newFilters.startDate || '',
            endDate: periodInfo.endDate || newFilters.endDate || '',
            page: 1,
          });
        }}
        categories={EXPENSE_CATEGORY_ICONS}
      />

      <TransactionTable
        transactions={transactions}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddFirst={() => navigate('/transactions/new')}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default TransactionsPage;
