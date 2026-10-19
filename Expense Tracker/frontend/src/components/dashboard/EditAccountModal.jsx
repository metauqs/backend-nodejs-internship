import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import {
  CreditCard,
  Building2,
  Wallet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  Zap,
} from 'lucide-react';

const COLOR_PRESETS = [
  '#FF6B00', // NayaPay Orange
  '#6D4AFF', // Purple
  '#005BAC', // UBL Blue
  '#1D6F42', // HBL Green
  '#7B2CBF', // Zindigi Violet
  '#00A389', // SadaPay Teal
  '#C06B24', // Cash Brown
  '#E63946', // Red
  '#1E293B', // Slate Dark
];

export const EditAccountModal = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const { format, currencyDetails } = useCurrency();
  const { updateAccount, reconcileAccount } = useAccounts();

  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    color: '#FF6B00',
    network: 'VISA',
    initialBalance: '',
    balance: '',
  });

  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        accountNumber: account.accountNumber || '',
        color: account.color || '#FF6B00',
        network: account.network || 'VISA',
        initialBalance: account.initialBalance !== undefined ? String(account.initialBalance) : '0',
        balance: account.balance !== undefined ? String(account.balance) : '0',
      });
      setReconcileResult(null);
      setError('');
      setSuccessMsg('');
    }
  }, [account]);

  if (!account) return null;

  const accountId = String(account.id || account._id || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleReconcile = async () => {
    try {
      setIsReconciling(true);
      setError('');
      setSuccessMsg('');

      // First save any edited initialBalance if changed
      const numInit = parseFloat(formData.initialBalance);
      if (!isNaN(numInit) && numInit >= 0 && numInit !== Number(account.initialBalance)) {
        await updateAccount(accountId, { initialBalance: numInit });
      }

      const res = await reconcileAccount(accountId);
      const updated = res.data || res;
      if (updated && updated.balance !== undefined) {
        setFormData((prev) => ({
          ...prev,
          balance: String(updated.balance),
          initialBalance: String(updated.initialBalance ?? prev.initialBalance),
        }));
      }

      if (updated?.reconciliation) {
        setReconcileResult(updated.reconciliation);
      }

      setSuccessMsg('Account balance reconciled with recorded transactions!');
      if (onAccountUpdated) onAccountUpdated(updated);
    } catch (err) {
      console.warn('Reconcile error:', err);
      setError(err.response?.data?.message || 'Failed to reconcile account.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Account name is required.');
      return;
    }

    const numInitial = parseFloat(formData.initialBalance);
    if (isNaN(numInitial) || numInitial < 0) {
      setError('Starting balance must be a non-negative number.');
      return;
    }

    const numBalance = parseFloat(formData.balance);
    if (isNaN(numBalance) || numBalance < 0) {
      setError('Current balance must be a non-negative number.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        accountNumber: formData.accountNumber.trim() || '•••• 0000',
        color: formData.color,
        network: formData.network,
        initialBalance: numInitial,
        balance: numBalance,
      };

      await updateAccount(accountId, payload);
      setSuccessMsg('Account updated successfully!');
      if (onAccountUpdated) {
        onAccountUpdated({ ...account, ...payload });
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      maxWidth="580px"
      title={`Edit Account: ${account.name}`}
      subtitle="Correct balances, reconcile transaction history, or update card branding"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleReconcile}
            disabled={isReconciling}
            title="Recalculate balance directly from all recorded transactions"
          >
            <RotateCcw size={14} className={isReconciling ? 'animate-spin' : ''} />
            <span>{isReconciling ? 'Reconciling...' : 'Auto-Reconcile Balance'}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={handleSubmit}>
              <Save size={15} />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="account-modal-form">
        {error && (
          <div className="error-banner" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="khata-toast-success animate-fade-in" style={{ marginBottom: '1rem', padding: '0.65rem 1rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Card Mini-Preview */}
        <div
          className="virtual-card-face"
          style={{
            background: `linear-gradient(135deg, ${formData.color} 0%, #1A1613 120%)`,
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            marginBottom: '1.25rem',
          }}
        >
          <div className="virtual-card-top" style={{ marginBottom: '0.5rem' }}>
            <div className="virtual-card-chip" style={{ width: '28px', height: '20px' }}>
              <div className="chip-line" />
            </div>
            <div className="virtual-card-network-badge" style={{ fontSize: '0.7rem' }}>
              {formData.network}
            </div>
          </div>

          <div className="virtual-card-name-row" style={{ marginBottom: '0.25rem' }}>
            <span className="virtual-card-institution" style={{ fontSize: '1rem' }}>
              {formData.name || 'Account Name'}
            </span>
            <span className="virtual-card-type-tag" style={{ fontSize: '0.7rem' }}>
              {account.type === 'bank' ? 'Bank Account' : 'Digital Wallet'}
            </span>
          </div>

          <div className="virtual-card-number font-numeric" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {formData.accountNumber || '•••• •••• •••• 0000'}
          </div>

          <div className="virtual-card-bottom">
            <div>
              <div className="virtual-card-balance-label" style={{ fontSize: '0.65rem' }}>Current Balance</div>
              <div className="virtual-card-balance font-numeric" style={{ fontSize: '1.15rem' }}>
                {format(Number(formData.balance) || 0)}
              </div>
            </div>
            <div className="virtual-card-expiry">
              <span className="expiry-label">STARTING</span>
              <span className="expiry-val font-numeric">
                {format(Number(formData.initialBalance) || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Reconcile Status Banner if run */}
        {reconcileResult && (
          <div
            style={{
              background: 'var(--color-surface-hover, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <Zap size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Transaction Ledger Reconciliation Report</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }} className="font-numeric">
              <div>Starting Balance: <strong>{format(reconcileResult.initialBalance)}</strong></div>
              <div>Transactions Count: <strong>{reconcileResult.transactionCount}</strong></div>
              <div style={{ color: 'var(--color-success, #16A34A)' }}>
                Total Inflow (+): <strong>{format(reconcileResult.totalIncome)}</strong>
              </div>
              <div style={{ color: 'var(--color-danger, #DC2626)' }}>
                Total Outflow (-): <strong>{format(reconcileResult.totalExpense)}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', paddingTop: '0.35rem', borderTop: '1px dashed var(--color-border)' }}>
                Reconciled True Balance: <strong style={{ color: 'var(--color-primary)' }}>{format(reconcileResult.calculatedBalance)}</strong>
                {reconcileResult.discrepancy !== 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                    (Corrected {reconcileResult.discrepancy > 0 ? `+${format(reconcileResult.discrepancy)}` : format(reconcileResult.discrepancy)} discrepancy)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. Account Name & Account Number */}
        <div className="auth-2col-row" style={{ gap: '1rem', marginBottom: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-acc-name" className="form-label">
              Account / Institution Name <span style={{ color: 'var(--color-expense)' }}>*</span>
            </label>
            <input
              id="edit-acc-name"
              name="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-acc-num" className="form-label">
              Account No. / IBAN
            </label>
            <input
              id="edit-acc-num"
              name="accountNumber"
              type="text"
              className="form-input font-numeric"
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 2. Starting Balance & Current Balance */}
        <div className="auth-2col-row" style={{ gap: '1rem', marginBottom: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-initial-bal" className="form-label">
              Starting / Initial Balance ({currencyDetails?.symbol || '₨'})
            </label>
            <input
              id="edit-initial-bal"
              name="initialBalance"
              type="number"
              step="0.01"
              min="0"
              className="form-input font-numeric"
              value={formData.initialBalance}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'block' }}>
              Base balance before recorded transactions
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-current-bal" className="form-label">
              Current Available Balance ({currencyDetails?.symbol || '₨'})
            </label>
            <input
              id="edit-current-bal"
              name="balance"
              type="number"
              step="0.01"
              min="0"
              className="form-input font-numeric"
              value={formData.balance}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'block' }}>
              Current real-time ledger balance
            </span>
          </div>
        </div>

        {/* 3. Card Network & Color Selector */}
        <div className="auth-2col-row" style={{ gap: '1rem', marginBottom: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-network" className="form-label">Payment Network</label>
            <select
              id="edit-network"
              name="network"
              className="form-select font-numeric"
              value={formData.network}
              onChange={handleChange}
            >
              <option value="VISA">VISA</option>
              <option value="Mastercard">Mastercard</option>
              <option value="PayPak">PayPak (Pakistan)</option>
              <option value="UnionPay">UnionPay</option>
              <option value="Wallet">Direct Digital Wallet</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Card Theme Color</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', minHeight: '38px' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, color: c }))}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: formData.color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: formData.color === c ? '0 0 0 2px var(--color-primary)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title={c}
                >
                  {formData.color === c && <Check size={12} color="#fff" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditAccountModal;
