import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import { ArrowUpRight, ArrowDownLeft, ArrowUpDown } from 'lucide-react';

export const QuickAccountActionModal = ({
  isOpen,
  onClose,
  initialMode = 'deposit', // 'deposit', 'withdraw', 'transfer'
  initialAccountId = '',
}) => {
  const { format, currencyDetails } = useCurrency();
  const { accounts, depositToAccount, withdrawFromAccount, transferBetweenAccounts } = useAccounts();

  const [mode, setMode] = useState(initialMode);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    } else if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }

    // Set a different toAccountId for transfer if available
    if (accounts.length > 1) {
      const other = accounts.find((a) => a.id !== (initialAccountId || accounts[0]?.id));
      if (other) setToAccountId(other.id);
    }
  }, [initialMode, initialAccountId, accounts]);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (mode === 'deposit') {
      const ok = depositToAccount(selectedAccountId, num);
      if (ok) {
        setSuccessMsg(`Successfully deposited ${format(num)} to ${activeAccount?.name}!`);
        setTimeout(() => {
          onClose();
          setAmount('');
          setSuccessMsg('');
        }, 1200);
      } else {
        setError('Failed to deposit. Please try again.');
      }
    } else if (mode === 'withdraw') {
      const res = withdrawFromAccount(selectedAccountId, num);
      if (res.success) {
        setSuccessMsg(`Successfully withdrew ${format(num)} from ${activeAccount?.name}!`);
        setTimeout(() => {
          onClose();
          setAmount('');
          setSuccessMsg('');
        }, 1200);
      } else {
        setError(res.message || 'Insufficient funds in this account.');
      }
    } else if (mode === 'transfer') {
      if (!toAccountId || toAccountId === selectedAccountId) {
        setError('Please select a different destination account.');
        return;
      }
      const res = transferBetweenAccounts(selectedAccountId, toAccountId, num);
      if (res.success) {
        const destAcc = accounts.find((a) => a.id === toAccountId);
        setSuccessMsg(`Transferred ${format(num)} from ${activeAccount?.name} to ${destAcc?.name}!`);
        setTimeout(() => {
          onClose();
          setAmount('');
          setSuccessMsg('');
        }, 1200);
      } else {
        setError(res.message || 'Transfer failed.');
      }
    }
  };

  const getTitle = () => {
    if (mode === 'deposit') return 'Deposit Funds';
    if (mode === 'withdraw') return 'Withdraw Funds';
    return 'Transfer Between Accounts';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      maxWidth="540px"
      title={getTitle()}
      subtitle={
        mode === 'deposit'
          ? 'Add funds directly into your selected account'
          : mode === 'withdraw'
          ? 'Deduct funds from your selected account'
          : 'Instantly transfer funds between your linked accounts'
      }
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit}>
            {mode === 'deposit' && <ArrowUpRight size={16} />}
            {mode === 'withdraw' && <ArrowDownLeft size={16} />}
            {mode === 'transfer' && <ArrowUpDown size={16} />}
            <span>Confirm {mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="account-action-form">
        {/* Mode Selector Tabs */}
        <div className="accounts-filter-tabs" style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`accounts-tab-btn ${mode === 'deposit' ? 'active' : ''}`}
            onClick={() => { setMode('deposit'); setError(''); }}
          >
            Deposit
          </button>
          <button
            type="button"
            className={`accounts-tab-btn ${mode === 'withdraw' ? 'active' : ''}`}
            onClick={() => { setMode('withdraw'); setError(''); }}
          >
            Withdraw
          </button>
          <button
            type="button"
            className={`accounts-tab-btn ${mode === 'transfer' ? 'active' : ''}`}
            onClick={() => { setMode('transfer'); setError(''); }}
          >
            Transfer
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '1rem' }}>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              &times;
            </button>
          </div>
        )}

        {successMsg && (
          <div className="match-pill match-pill-success" style={{ display: 'block', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {/* Source Account Dropdown */}
        <div className="form-group" style={{ marginBottom: '1.15rem' }}>
          <label htmlFor="source-acc" className="form-label">
            {mode === 'transfer' ? 'From Bank / Wallet' : 'Target Bank / Wallet'}
          </label>
          <select
            id="source-acc"
            className="form-select font-numeric"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.accountNumber}) — Bal: {format(acc.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Account Dropdown (Transfer Mode) */}
        {mode === 'transfer' && (
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="dest-acc" className="form-label">
              To Bank / Wallet
            </label>
            <select
              id="dest-acc"
              className="form-select font-numeric"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {accounts
                .filter((acc) => acc.id !== selectedAccountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumber}) — Bal: {format(acc.balance)}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Amount Input */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="action-amt" className="form-label">
            Amount ({currencyDetails?.symbol || '₨'})
          </label>
          <input
            id="action-amt"
            type="number"
            step="0.01"
            min="0"
            className="form-input font-numeric"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
            style={{ fontSize: '1.15rem', fontWeight: 600 }}
          />
        </div>

        {activeAccount && mode !== 'deposit' && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textAlign: 'right' }}>
            Available balance: <span className="font-numeric" style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{format(activeAccount.balance)}</span>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default QuickAccountActionModal;
