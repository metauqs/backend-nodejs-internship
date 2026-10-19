import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';
import transactionService from '../services/transactionService';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAccounts } from '../context/AccountsContext';

export const EditTransactionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshAccounts } = useAccounts();
  const [transaction, setTransaction] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const [txRes, allRes] = await Promise.all([
          transactionService.getTransactionById(id),
          transactionService.getAllTransactions(),
        ]);
        setTransaction(txRes.data || txRes);
        const allList = allRes.data || allRes || [];
        // Exclude the current editing transaction from existing list so it doesn't double-count
        setAllTransactions(allList.filter((t) => (t._id || t.id) !== id));
      } catch (err) {
        console.warn('Failed to load transaction for editing:', err);
        setError('Transaction details could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handleSubmit = async (updatedData) => {
    try {
      setSubmitting(true);
      await transactionService.updateTransaction(id, updatedData);
      if (refreshAccounts) {
        await refreshAccounts();
      }
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading transaction details..." />;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Edit Transaction</h1>
        <p>Update transaction details or correct values.</p>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <div className="card">
        <TransactionForm
          initialData={transaction || {}}
          onSubmit={handleSubmit}
          isLoading={submitting}
          onCancel={() => navigate('/transactions')}
          existingTransactions={allTransactions}
        />
      </div>
    </div>
  );
};

export default EditTransactionPage;
