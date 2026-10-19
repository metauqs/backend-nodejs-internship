import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import { PAKISTAN_BANKS, PAKISTAN_WALLETS } from '../../utils/pakistanInstitutions';
import { Building2, Wallet, Plus, Check } from 'lucide-react';

export const AddAccountModal = ({ isOpen, onClose, onAccountAdded }) => {
  const { currencyDetails } = useCurrency();
  const { addAccount } = useAccounts();

  const [accountType, setAccountType] = useState('bank'); // 'bank' or 'wallet'
  const [selectedInstId, setSelectedInstId] = useState('ubl');
  const [customName, setCustomName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [cardNetwork, setCardNetwork] = useState('VISA');
  const [error, setError] = useState('');

  const currentCatalog = accountType === 'bank' ? PAKISTAN_BANKS : PAKISTAN_WALLETS;
  const isCustom = selectedInstId === 'custom_bank' || selectedInstId === 'custom_wallet';

  const handleTypeChange = (type) => {
    setAccountType(type);
    if (type === 'bank') {
      setSelectedInstId('ubl');
      setCardNetwork('VISA');
    } else {
      setSelectedInstId('nayapay');
      setCardNetwork('VISA');
    }
    setError('');
  };

  const handleInstChange = (e) => {
    const instId = e.target.value;
    setSelectedInstId(instId);
    const found = currentCatalog.find((c) => c.id === instId);
    if (found && found.network) {
      setCardNetwork(found.network);
    }
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalName = '';
    let finalColor = '#8E3200';

    if (isCustom) {
      if (!customName.trim()) {
        setError('Please enter the name of the bank or wallet');
        return;
      }
      finalName = customName.trim();
      finalColor = accountType === 'bank' ? '#004B87' : '#00A389';
    } else {
      const found = currentCatalog.find((c) => c.id === selectedInstId);
      finalName = found ? found.name : 'Account';
      finalColor = found ? found.color : '#8E3200';
    }

    if (!accountNumber.trim()) {
      setError('Please provide the account number, IBAN, or mobile number');
      return;
    }

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance) || numBalance < 0) {
      setError('Please enter a valid starting balance (e.g. 5000)');
      return;
    }

    // Format display account number
    let formattedNum = accountNumber.trim();
    if (!formattedNum.startsWith('••••') && formattedNum.length > 4) {
      formattedNum = `•••• ${formattedNum.slice(-4)}`;
    }

    const newAcc = addAccount({
      name: finalName,
      institutionId: selectedInstId,
      type: accountType,
      accountNumber: formattedNum,
      balance: numBalance,
      color: finalColor,
      network: cardNetwork,
      expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')} / ${Math.floor(Math.random() * 5) + 28}`,
    });

    if (onAccountAdded) {
      onAccountAdded(newAcc);
    }

    // Reset and close
    setCustomName('');
    setAccountNumber('');
    setBalance('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      maxWidth="560px"
      title="Add Bank Account or Wallet"
      subtitle="Link your Pakistani bank account or digital wallet to track finances"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit}>
            <Plus size={16} />
            <span>Add Account</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="account-modal-form">
        {error && (
          <div className="error-banner" style={{ marginBottom: '1rem' }}>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              &times;
            </button>
          </div>
        )}

        {/* 1. Account Type Toggle (Bank vs Wallet) */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Account Category</label>
          <div className="account-type-toggle-grid">
            <button
              type="button"
              className={`account-type-toggle-btn ${accountType === 'bank' ? 'active' : ''}`}
              onClick={() => handleTypeChange('bank')}
            >
              <Building2 size={18} />
              <span>Pakistani Bank</span>
              {accountType === 'bank' && <Check size={14} className="toggle-check-icon" />}
            </button>

            <button
              type="button"
              className={`account-type-toggle-btn ${accountType === 'wallet' ? 'active' : ''}`}
              onClick={() => handleTypeChange('wallet')}
            >
              <Wallet size={18} />
              <span>Digital Wallet</span>
              {accountType === 'wallet' && <Check size={14} className="toggle-check-icon" />}
            </button>
          </div>
        </div>

        {/* 2. Institution Dropdown Selector */}
        <div className="form-group" style={{ marginBottom: '1.15rem' }}>
          <label htmlFor="inst-select" className="form-label">
            {accountType === 'bank' ? 'Select Bank (or Other)' : 'Select Digital Wallet (or Other)'}
          </label>
          <select
            id="inst-select"
            className="form-select"
            value={selectedInstId}
            onChange={handleInstChange}
            style={{ fontWeight: 600 }}
          >
            {currentCatalog.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Manual Name Input if "Other / Custom" selected */}
        {isCustom && (
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="custom-name" className="form-label">
              Manual {accountType === 'bank' ? 'Bank' : 'Wallet'} Name <span style={{ color: 'var(--color-expense)' }}>*</span>
            </label>
            <input
              id="custom-name"
              type="text"
              className="form-input"
              placeholder={accountType === 'bank' ? 'e.g. Dubai Islamic Bank' : 'e.g. Zindigi Wallet'}
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
            />
          </div>
        )}

        {/* 4. Account Number / IBAN / Phone & Initial Balance */}
        <div className="auth-2col-row" style={{ gap: '1rem', marginBottom: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="account-num" className="form-label">
              {accountType === 'bank' ? 'Account No. / IBAN' : 'Mobile / Account No.'} <span style={{ color: 'var(--color-expense)' }}>*</span>
            </label>
            <input
              id="account-num"
              type="text"
              className="form-input font-numeric"
              placeholder={accountType === 'bank' ? 'e.g. 9286 or PK36...' : 'e.g. 0300 1234567'}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="account-bal" className="form-label">
              Starting Balance ({currencyDetails?.symbol || '₨'}) <span style={{ color: 'var(--color-expense)' }}>*</span>
            </label>
            <input
              id="account-bal"
              type="number"
              step="0.01"
              min="0"
              className="form-input font-numeric"
              placeholder="0.00"
              value={balance}
              onChange={(e) => {
                setBalance(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>
        </div>

        {/* 5. Card / Payment Network */}
        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="card-network" className="form-label">Card / Payment Network</label>
          <select
            id="card-network"
            className="form-select font-numeric"
            value={cardNetwork}
            onChange={(e) => setCardNetwork(e.target.value)}
          >
            <option value="VISA">VISA</option>
            <option value="Mastercard">Mastercard</option>
            <option value="PayPak">PayPak (Pakistan National)</option>
            <option value="UnionPay">UnionPay</option>
            <option value="Wallet">Direct Digital Wallet</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default AddAccountModal;
