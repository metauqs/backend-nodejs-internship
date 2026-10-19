import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';
import transactionService from '../services/transactionService';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAccounts } from '../context/AccountsContext';

export const AddTransactionPage = () => {
  const navigate = useNavigate();
  const { refreshAccounts } = useAccounts();
  const [existingTransactions, setExistingTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await transactionService.getTransactions({ limit: 100 });
        const list = res.data || res.transactions || res || [];
        setExistingTransactions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load existing transactions for budget calculation:', err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (transactionData) => {
    try {
      setIsLoading(true);
      await transactionService.createTransaction(transactionData);
      if (refreshAccounts) {
        await refreshAccounts();
      }
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.35rem 0' }}>Add New Transaction</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Record an expense or income, select your payment account, and monitor your monthly budget in real time.
        </p>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <div className="card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <TransactionForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => navigate('/transactions')}
          existingTransactions={existingTransactions}
        />
      </div>
    </div>
  );
};

export default AddTransactionPage;

