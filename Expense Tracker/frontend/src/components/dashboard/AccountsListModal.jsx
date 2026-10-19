import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import { getAccountBadge } from '../../utils/pakistanInstitutions';
import { Building2, Wallet, Plus, Trash2, ArrowUpDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const AccountsListModal = ({
  isOpen,
  onClose,
  onOpenAddModal,
  onOpenActionModal,
}) => {
  const { format } = useCurrency();
  const {
    accounts,
    banks,
    wallets,
    totalBalance,
    banksTotal,
    walletsTotal,
    deleteAccount,
  } = useAccounts();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'banks', 'wallets'

  const filteredAccounts =
    activeTab === 'banks'
      ? banks
      : activeTab === 'wallets'
      ? wallets
      : accounts;

  const handleDelete = (acc) => {
    if (window.confirm(`Are you sure you want to remove ${acc.name} (${acc.accountNumber})?`)) {
      deleteAccount(acc.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      maxWidth="680px"
      title="All Bank Accounts & Wallets"
      subtitle="Inspect individual balances, make instant deposits or transfer funds"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onClose();
              if (onOpenActionModal) onOpenActionModal('transfer');
            }}
          >
            <ArrowUpDown size={15} />
            <span>Transfer Funds</span>
          </Button>

          <Button
            variant="primary"
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAddModal) onOpenAddModal();
            }}
          >
            <Plus size={16} />
            <span>Add New Account</span>
          </Button>
        </div>
      }
    >
      <div className="accounts-list-modal-body">
        {/* Top Summary Banner: Combined & Split Totals */}
        <div className="accounts-summary-banner">
          <div className="accounts-summary-top-row">
            <span className="accounts-summary-label">Total Combined Balance</span>
            <span className="accounts-count-pill font-numeric">
              {accounts.length} Accounts Linked
            </span>
          </div>

          <div className="accounts-summary-amount font-numeric">
            {format(totalBalance)}
          </div>

          <div className="accounts-summary-sub">
            Real-time combined liquid balance across Pakistani banks & digital wallets
          </div>

          <div className="accounts-split-stat-row">
            <div className="accounts-split-box">
              <div className="split-box-header">
                <Building2 size={15} />
                <span>Pakistani Banks ({banks.length})</span>
              </div>
              <div className="split-box-val font-numeric">{format(banksTotal)}</div>
            </div>

            <div className="accounts-split-box">
              <div className="split-box-header">
                <Wallet size={15} />
                <span>Digital Wallets ({wallets.length})</span>
              </div>
              <div className="split-box-val font-numeric">{format(walletsTotal)}</div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="accounts-filter-tabs">
          <button
            type="button"
            className={`accounts-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Accounts ({accounts.length})
          </button>
          <button
            type="button"
            className={`accounts-tab-btn ${activeTab === 'banks' ? 'active' : ''}`}
            onClick={() => setActiveTab('banks')}
          >
            Banks ({banks.length})
          </button>
          <button
            type="button"
            className={`accounts-tab-btn ${activeTab === 'wallets' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallets')}
          >
            Wallets ({wallets.length})
          </button>
        </div>

        {/* Individual Accounts Breakdown List */}
        <div className="accounts-cards-scroll">
          {filteredAccounts.length === 0 ? (
            <div className="empty-accounts-view">
              <p>No accounts in this category yet.</p>
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const badgeText = getAccountBadge(acc);
              const isBank = acc.type === 'bank';

              return (
                <div key={acc.id} className="account-item-card">
                  {/* Top Row: Left Identity & Right Balance */}
                  <div className="account-item-main-row">
                    <div className="account-item-identity">
                      <div
                        className="account-brand-icon"
                        style={{ backgroundColor: acc.color || (isBank ? '#005BAC' : '#FF6B00') }}
                      >
                        {badgeText}
                      </div>

                      <div className="account-title-stack">
                        <div className="account-name-badge-row">
                          <span className="account-item-name">{acc.name}</span>
                          <span className={`account-type-tag ${isBank ? 'tag-bank' : 'tag-wallet'}`}>
                            {isBank ? 'Bank Account' : 'Digital Wallet'}
                          </span>
                        </div>

                        <div className="account-item-sub font-numeric">
                          <span>{acc.accountNumber}</span>
                          {acc.network && <span className="network-pill">{acc.network}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Individual Balance */}
                    <div className="account-item-balance-block">
                      <span className="account-balance-label">Individual Balance</span>
                      <span className="account-item-balance font-numeric">
                        {format(acc.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Sub-Row: Status dot & Quick Action Buttons */}
                  <div className="account-item-bottom-row">
                    <div className="account-status-pill">
                      <span className="account-status-dot" />
                      <span>Active & Verified</span>
                    </div>

                    <div className="account-actions-group">
                      <button
                        type="button"
                        className="account-action-pill-btn deposit"
                        title="Deposit into this account"
                        onClick={() => {
                          onClose();
                          if (onOpenActionModal) onOpenActionModal('deposit', acc.id);
                        }}
                      >
                        <ArrowUpRight size={13} />
                        <span>Deposit</span>
                      </button>

                      <button
                        type="button"
                        className="account-action-pill-btn withdraw"
                        title="Withdraw from this account"
                        onClick={() => {
                          onClose();
                          if (onOpenActionModal) onOpenActionModal('withdraw', acc.id);
                        }}
                      >
                        <ArrowDownLeft size={13} />
                        <span>Withdraw</span>
                      </button>

                      <button
                        type="button"
                        className="account-action-pill-btn transfer"
                        title="Transfer from this account"
                        onClick={() => {
                          onClose();
                          if (onOpenActionModal) onOpenActionModal('transfer', acc.id);
                        }}
                      >
                        <ArrowUpDown size={13} />
                        <span>Transfer</span>
                      </button>

                      <button
                        type="button"
                        className="account-delete-btn"
                        title="Delete account"
                        onClick={() => handleDelete(acc)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AccountsListModal;
