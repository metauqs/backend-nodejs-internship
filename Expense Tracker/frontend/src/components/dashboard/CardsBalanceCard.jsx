import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowUpDown, Plus, ChevronLeft, ChevronRight, Building2, Wallet } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccounts } from '../../context/AccountsContext';
import AddAccountModal from './AddAccountModal';
import AccountsListModal from './AccountsListModal';
import QuickAccountActionModal from './QuickAccountActionModal';

export const CardsBalanceCard = ({
  trend = '0.0%',
  onDeposit,
  onWithdraw,
  onTransfer,
}) => {
  const { format, formatParts } = useCurrency();
  const {
    accounts,
    banks,
    wallets,
    totalBalance,
  } = useAccounts();

  // Active account index for cycling through individual accounts in the card graphic
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [actionModalConfig, setActionModalConfig] = useState({
    isOpen: false,
    mode: 'deposit',
    accountId: '',
  });

  // Safe active account
  const currentAccount = accounts[activeAccountIdx] || accounts[0] || null;

  const handlePrevCard = (e) => {
    e.stopPropagation();
    setActiveAccountIdx((prev) => (prev > 0 ? prev - 1 : accounts.length - 1));
  };

  const handleNextCard = (e) => {
    e.stopPropagation();
    setActiveAccountIdx((prev) => (prev < accounts.length - 1 ? prev + 1 : 0));
  };

  const openAction = (mode, accountId = '') => {
    if (accounts.length === 0) {
      setIsAddModalOpen(true);
      return;
    }
    setActionModalConfig({
      isOpen: true,
      mode,
      accountId: accountId || currentAccount?.id || accounts[0]?.id || '',
    });
  };

  // Format the combined balance across all accounts
  const { symbol, dollars, cents } = formatParts(totalBalance);

  return (
    <>
      <div className="hero-gradient-card">
        <div>
          {/* Top Header Row */}
          <div className="card-top-row">
            <span className="card-label">Bank Accounts & Wallets</span>
            <div className="pill-action-group">
              <button
                type="button"
                className="pill-glass-btn"
                onClick={() => setIsListModalOpen(true)}
                title="View all bank accounts & wallets"
              >
                <span className="font-numeric">All Accounts ({accounts.length})</span>
              </button>
              <button
                type="button"
                className="circle-glass-btn"
                title="Add Bank Account or Wallet"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Big Balance Stat with Global Currency Symbol (Combined Balance) */}
          <div className="hero-balance-stat font-numeric" title="Combined balance across all accounts">
            <span style={{ fontSize: '0.85em', marginRight: '2px' }}>{symbol}</span>
            {dollars}
            <span className="hero-balance-cents font-numeric">.{cents}</span>
          </div>

          {/* Badges: Trend & Combined Balance / Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div className="hero-trend-badge font-numeric">
              <ArrowUpRight size={13} />
              <span>{trend} this month</span>
            </div>

            <div
              className="hero-trend-badge font-numeric"
              style={{ background: 'rgba(255, 255, 255, 0.14)', cursor: 'pointer' }}
              onClick={() => setIsListModalOpen(true)}
              title="Click to inspect all individual balances"
            >
              <span>Balance: {format(totalBalance)}</span>
            </div>

            <div
              className="hero-trend-badge font-numeric"
              style={{ background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.7rem' }}
            >
              <span>{banks.length} Banks • {wallets.length} Wallets</span>
            </div>
          </div>

          {/* Quick Action Buttons (Deposit / Transfer / Withdraw) */}
          <div className="card-actions-row">
            <button
              type="button"
              className="white-pill-btn"
              onClick={() => (onDeposit ? onDeposit() : openAction('deposit'))}
            >
              <ArrowUpRight size={16} />
              <span>Deposit</span>
            </button>

            <button
              type="button"
              className="white-circle-btn"
              onClick={() => (onTransfer ? onTransfer() : openAction('transfer'))}
              title="Transfer Between Accounts"
            >
              <ArrowUpDown size={17} />
            </button>

            <button
              type="button"
              className="white-pill-btn"
              onClick={() => (onWithdraw ? onWithdraw() : openAction('withdraw'))}
            >
              <ArrowDownLeft size={16} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Stacked Interactive Card Mockup at Bottom */}
        <div
          className="stacked-card-graphic interactive-account-card-wrap"
          onClick={() => (accounts.length > 0 ? setIsListModalOpen(true) : setIsAddModalOpen(true))}
          title={accounts.length > 0 ? 'Click to view all accounts or use arrows to cycle' : 'Click to link your first account'}
        >
          <div className="card-layer-back-2" />
          <div className="card-layer-back-1" />
          
          <div className="card-layer-front interactive-card-surface">
            {accounts.length > 0 && currentAccount ? (
              <>
                {/* Top row of card surface: Name & Type Badge */}
                <div className="card-front-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {currentAccount.type === 'bank' ? (
                      <Building2 size={15} style={{ opacity: 0.9 }} />
                    ) : (
                      <Wallet size={15} style={{ opacity: 0.9 }} />
                    )}
                    <span className="card-account-title">{currentAccount.name}</span>
                    <span className="card-type-mini-pill">
                      {currentAccount.type === 'bank' ? 'Bank' : 'Wallet'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="card-num-text font-numeric">{currentAccount.accountNumber}</span>
                    <span className="card-indiv-bal font-numeric">
                      {format(currentAccount.balance)}
                    </span>
                  </div>
                </div>

                {/* Right side: Network & Switcher Arrows */}
                <div className="card-front-right">
                  <span className="card-visa-logo">{currentAccount.network || 'VISA'}</span>
                  
                  {accounts.length > 1 && (
                    <div className="card-cycle-arrows" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="card-arrow-btn"
                        onClick={handlePrevCard}
                        title="Previous Account"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="card-cycle-counter font-numeric">
                        {activeAccountIdx + 1}/{accounts.length}
                      </span>
                      <button
                        type="button"
                        className="card-arrow-btn"
                        onClick={handleNextCard}
                        title="Next Account"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Building2 size={18} style={{ opacity: 0.85 }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No Accounts Linked Yet</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Link your bank or wallet to track balance</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="pill-glass-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddModalOpen(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                >
                  <Plus size={13} />
                  <span>Link Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Bank Account or Wallet Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAccountAdded={(newAcc) => {
          // Switch active card to the newly created account
          setActiveAccountIdx(0);
        }}
      />

      {/* View All Accounts & Individual Balances Modal */}
      <AccountsListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenActionModal={(mode, accountId) => openAction(mode, accountId)}
      />

      {/* Quick Deposit / Withdraw / Transfer Modal */}
      <QuickAccountActionModal
        isOpen={actionModalConfig.isOpen}
        onClose={() => setActionModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialMode={actionModalConfig.mode}
        initialAccountId={actionModalConfig.accountId}
      />
    </>
  );
};

export default CardsBalanceCard;
