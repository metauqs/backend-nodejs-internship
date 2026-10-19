import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useAccounts } from '../context/AccountsContext';
import { useCurrency } from '../context/CurrencyContext';
import transactionService from '../services/transactionService';
import AddAccountModal from '../components/dashboard/AddAccountModal';
import QuickAccountActionModal from '../components/dashboard/QuickAccountActionModal';
import EditAccountModal from '../components/dashboard/EditAccountModal';
import { formatDate } from '../utils/formatDate';
import {
  Building2,
  Wallet,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Calendar,
  Bell,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const AccountsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || null;
  const { format, formatParts } = useCurrency();
  const {
    accounts,
    banks,
    wallets,
    totalBalance,
    banksTotal,
    walletsTotal,
    deleteAccount,
    reconcileAccount,
    reconcileAllAccounts,
    refreshAccounts,
  } = useAccounts();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isReconcilingAll, setIsReconcilingAll] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [actionModalConfig, setActionModalConfig] = useState({
    isOpen: false,
    mode: 'deposit',
    accountId: '',
  });

  // Selected account for transaction history drill-down ('all' or account ID)
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all'); // 'all' | 'bank' | 'wallet'
  const [historySearch, setHistorySearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync selected account if accounts list changes
  useEffect(() => {
    if (
      selectedAccountId !== 'all' &&
      !accounts.some((a) => String(a.id || a._id) === String(selectedAccountId))
    ) {
      setSelectedAccountId('all');
    }
  }, [accounts, selectedAccountId]);

  // Load all transactions to associate with accounts
  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await transactionService.getAllTransactions();
      const list = res.data || res || [];
      setTransactions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load transactions for accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Currently selected account object (or null if 'all')
  const selectedAccount = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return accounts.find((a) => String(a.id || a._id) === String(selectedAccountId)) || null;
  }, [accounts, selectedAccountId]);

  // Filter accounts by type tab
  const displayedAccounts = useMemo(() => {
    if (accountTypeFilter === 'bank') return banks;
    if (accountTypeFilter === 'wallet') return wallets;
    return accounts;
  }, [accounts, banks, wallets, accountTypeFilter]);

  // Helper to match transaction to account accurately
  const isTransactionForAccount = useCallback((tx, acc) => {
    if (!tx || !acc) return false;

    const accId = String(acc.id || acc._id || '').trim();
    const accClientId = acc.clientId ? String(acc.clientId).trim() : '';
    const accName = String(acc.name || '').trim().toLowerCase();

    // 1. Transaction account identifier: could be MongoDB ObjectId string, populated object, or accountId
    const txAccId = String(
      (typeof tx.account === 'object' && tx.account !== null
        ? (tx.account._id || tx.account.id)
        : tx.account) ||
      tx.accountId ||
      ''
    ).trim();

    // Direct ID comparison
    if (txAccId) {
      if (accId && txAccId === accId) return true;
      if (accClientId && txAccId === accClientId) return true;

      // If this transaction's account ID explicitly matches another account in the accounts list,
      // then it definitely does NOT belong to this account.
      const belongsToAnotherAccount = accounts.some((other) => {
        const otherId = String(other.id || other._id || '').trim();
        const otherClientId = other.clientId ? String(other.clientId).trim() : '';
        if (otherId === accId || (accClientId && otherClientId === accClientId)) return false;
        return (otherId && otherId === txAccId) || (otherClientId && otherClientId === txAccId);
      });

      if (belongsToAnotherAccount) {
        return false;
      }
    }

    // 2. Account Name comparison
    const txAccName = String(
      (typeof tx.account === 'object' && tx.account !== null ? tx.account.name : '') ||
      tx.accountName ||
      ''
    ).trim().toLowerCase();

    if (txAccName && accName) {
      if (txAccName === accName) return true;

      // Clean out common corporate / generic tokens
      const cleanTokens = (s) =>
        s
          .replace(/[()]/g, ' ')
          .split(/\s+/)
          .filter((w) => !['bank', 'wallet', 'other', 'account', 'the', 'limited', 'ltd', 'pakistan'].includes(w))
          .join(' ');

      const strippedTx = cleanTokens(txAccName);
      const strippedAcc = cleanTokens(accName);

      if (strippedTx && strippedAcc) {
        if (strippedTx === strippedAcc) return true;
        if (strippedTx.includes(strippedAcc) || strippedAcc.includes(strippedTx)) {
          return true;
        }
      }
    }

    return false;
  }, [accounts]);

  // Transactions filtered by selected account and search query
  const accountTransactions = useMemo(() => {
    let list = transactions;

    if (selectedAccount) {
      list = list.filter((tx) => isTransactionForAccount(tx, selectedAccount));
    }

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.accountName && t.accountName.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, selectedAccount, historySearch, isTransactionForAccount]);

  // Financial statistics for the active account history view
  const accountStats = useMemo(() => {
    let spent = 0;
    let income = 0;
    let expenseCount = 0;
    let incomeCount = 0;

    accountTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'expense') {
        spent += amt;
        expenseCount += 1;
      } else if (tx.type === 'income') {
        income += amt;
        incomeCount += 1;
      }
    });

    return {
      spent,
      income,
      net: income - spent,
      count: accountTransactions.length,
      expenseCount,
      incomeCount,
    };
  }, [accountTransactions]);

  const handleDeleteAccount = (acc, e) => {
    e.stopPropagation();
    const accKey = String(acc.id || acc._id);
    if (
      window.confirm(
        `Are you sure you want to delete ${acc.name} (${acc.accountNumber})? This will not delete historical transactions.`
      )
    ) {
      deleteAccount(accKey);
      if (String(selectedAccountId) === accKey) {
        setSelectedAccountId('all');
      }
    }
  };

  const handleReconcileAll = async () => {
    try {
      setIsReconcilingAll(true);
      await reconcileAllAccounts();
      await fetchTransactions();
      setToastMsg('All accounts successfully reconciled with recorded transactions!');
      setTimeout(() => setToastMsg(''), 4500);
    } catch (err) {
      console.warn('Reconcile all failed:', err);
      alert('Failed to reconcile accounts.');
    } finally {
      setIsReconcilingAll(false);
    }
  };

  const handleOpenAction = (mode, accountId, e) => {
    if (e) e.stopPropagation();
    const fallbackId = String(selectedAccount?.id || selectedAccount?._id || accounts[0]?.id || accounts[0]?._id || '');
    setActionModalConfig({
      isOpen: true,
      mode,
      accountId: accountId ? String(accountId) : fallbackId,
    });
  };

  const { symbol, dollars, cents } = formatParts(totalBalance);

  return (
    <div className="accounts-page-wrapper">
      {/* Top Page Header */}
      <div className="accounts-page-header">
        <div>
          <h1 className="accounts-page-title">Accounts & Wallets</h1>
          <p className="accounts-page-subtitle">
            Manage your bank accounts, digital cards, balances, and inspect account-specific transaction history.
          </p>
        </div>

        <div className="accounts-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReconcileAll}
            disabled={isReconcilingAll}
            title="Auto-reconcile all account balances against recorded transactions"
          >
            <RotateCcw size={15} className={isReconcilingAll ? 'animate-spin' : ''} />
            <span>{isReconcilingAll ? 'Reconciling...' : 'Reconcile All'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={(e) => handleOpenAction('transfer', '', e)}
          >
            <ArrowUpDown size={16} />
            <span>Transfer / Action</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="khata-toast-success animate-fade-in" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Financial Overview Strip */}
      <div className="accounts-overview-grid">
        {/* Total Combined Balance Card */}
        <div className="accounts-stat-card total-balance-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Combined Balance</span>
            <div className="stat-card-icon total-icon">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-card-amount font-numeric text-primary">
            <span style={{ fontSize: '0.85em', marginRight: '2px' }}>{symbol}</span>
            {dollars}
            <span style={{ fontSize: '0.7em', opacity: 0.85 }}>.{cents}</span>
          </div>
          <div className="stat-card-sub">
            Combined across {accounts.length} active institutions
          </div>
        </div>

        {/* Bank Accounts Total Card */}
        <div className="accounts-stat-card bank-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Bank Accounts ({banks.length})</span>
            <div className="stat-card-icon bank-icon">
              <Building2 size={18} />
            </div>
          </div>
          <div className="stat-card-amount font-numeric text-primary">
            {format(banksTotal)}
          </div>
          <div className="stat-card-sub">
            Commercial & Islamic Banking
          </div>
        </div>

        {/* Digital Wallets Total Card */}
        <div className="accounts-stat-card wallet-stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Digital Wallets ({wallets.length})</span>
            <div className="stat-card-icon wallet-icon">
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-card-amount font-numeric text-primary">
            {format(walletsTotal)}
          </div>
          <div className="stat-card-sub">
            NayaPay, SadaPay, JazzCash & Microfinance
          </div>
        </div>
      </div>

      {/* Interactive Accounts Showcase */}
      <div className="accounts-section-header">
        <div>
          <h2 className="accounts-section-title">Connected Accounts & Cards</h2>
          <p className="accounts-section-desc">
            Click any account to inspect its individual transaction history below.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="accounts-filter-tabs">
          <button
            type="button"
            className={`accounts-tab-pill ${accountTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAccountTypeFilter('all')}
          >
            All ({accounts.length})
          </button>
          <button
            type="button"
            className={`accounts-tab-pill ${accountTypeFilter === 'bank' ? 'active' : ''}`}
            onClick={() => setAccountTypeFilter('bank')}
          >
            Banks ({banks.length})
          </button>
          <button
            type="button"
            className={`accounts-tab-pill ${accountTypeFilter === 'wallet' ? 'active' : ''}`}
            onClick={() => setAccountTypeFilter('wallet')}
          >
            Wallets ({wallets.length})
          </button>
        </div>
      </div>

      {/* Grid of Debit / Wallet Cards */}
      <div className="accounts-cards-grid">
        {displayedAccounts.map((acc) => {
          const accKey = String(acc.id || acc._id);
          const isSelected = String(selectedAccountId) === accKey;
          const cardColor = acc.color || (acc.type === 'bank' ? '#005BAC' : '#FF6B00');

          return (
            <div
              key={accKey}
              className={`visual-bank-card-container ${isSelected ? 'active-selected-account' : ''}`}
              onClick={() => setSelectedAccountId(accKey)}
            >
              {/* Luxury Virtual Card Face */}
              <div
                className="virtual-card-face"
                style={{
                  background: `linear-gradient(135deg, ${cardColor} 0%, #1A1613 120%)`,
                }}
              >
                {/* Chip & Network */}
                <div className="virtual-card-top">
                  <div className="virtual-card-chip">
                    <div className="chip-line" />
                  </div>
                  <div className="virtual-card-network-badge">
                    {acc.network || (acc.type === 'bank' ? 'VISA' : 'WALLET')}
                  </div>
                </div>

                {/* Account Name & Type */}
                <div className="virtual-card-name-row">
                  <span className="virtual-card-institution">{acc.name}</span>
                  <span className="virtual-card-type-tag">
                    {acc.type === 'bank' ? 'Bank' : 'Digital Wallet'}
                  </span>
                </div>

                {/* Account Number */}
                <div className="virtual-card-number font-numeric">
                  {acc.accountNumber || '•••• •••• •••• 0000'}
                </div>

                {/* Bottom Row: Balance & Expiry */}
                <div className="virtual-card-bottom">
                  <div>
                    <div className="virtual-card-balance-label">Available Balance</div>
                    <div className="virtual-card-balance font-numeric">
                      {format(acc.balance || 0)}
                    </div>
                  </div>

                  {acc.expiry && (
                    <div className="virtual-card-expiry">
                      <span className="expiry-label">VALID THRU</span>
                      <span className="expiry-val font-numeric">{acc.expiry}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="account-card-bottom-bar">
                <div className="account-card-status-indicator">
                  {isSelected ? (
                    <span className="status-badge-active">
                      <CheckCircle2 size={13} />
                      <span>Viewing History</span>
                    </span>
                  ) : (
                    <span className="status-badge-hint">
                      <span>Click to view history</span>
                      <ArrowRight size={13} />
                    </span>
                  )}
                </div>

                <div className="account-card-action-btns">
                  <button
                    type="button"
                    className="card-quick-btn edit-btn"
                    title="Edit account details or auto-reconcile balance"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(acc);
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    className="card-quick-btn deposit-btn"
                    title="Quick Deposit to this account"
                    onClick={(e) => handleOpenAction('deposit', accKey, e)}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Deposit</span>
                  </button>

                  <button
                    type="button"
                    className="card-quick-btn withdraw-btn"
                    title="Quick Withdraw from this account"
                    onClick={(e) => handleOpenAction('withdraw', accKey, e)}
                  >
                    <ArrowUpRight size={14} />
                    <span>Withdraw</span>
                  </button>

                  <button
                    type="button"
                    className="card-quick-btn delete-btn"
                    title="Delete Account"
                    onClick={(e) => handleDeleteAccount(acc, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Account Card Tile */}
        <button
          type="button"
          className="add-account-tile"
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="add-tile-icon-circle">
            <Plus size={24} />
          </div>
          <span className="add-tile-title">Link New Bank or Wallet</span>
          <span className="add-tile-subtitle">UBL, HBL, Meezan, NayaPay, SadaPay, JazzCash & more</span>
        </button>
      </div>

      {/* Account Transaction History Drill-Down Section */}
      <div className="account-history-section">
        <div className="account-history-header">
          <div>
            <div className="account-history-badge-row">
              <span className="history-section-badge">Transaction History</span>
              {selectedAccount ? (
                <span className="history-account-name-badge">
                  {selectedAccount.type === 'bank' ? <Building2 size={13} /> : <Wallet size={13} />}
                  <span>{selectedAccount.name} ({selectedAccount.accountNumber})</span>
                </span>
              ) : (
                <span className="history-account-name-badge">
                  <Layers size={13} />
                  <span>All Accounts Combined</span>
                </span>
              )}
            </div>
            <h2 className="account-history-title">
              {selectedAccount
                ? `${selectedAccount.name} Activity & Statements`
                : 'All Accounts Activity & History'}
            </h2>
            <p className="account-history-desc">
              {selectedAccount
                ? `Detailed record of every expense deducted and income credited to ${selectedAccount.name}.`
                : 'Detailed record of every expense deducted and income credited across all accounts.'}
            </p>
          </div>

          {/* Quick Account Switcher Pills */}
          <div className="account-switcher-pills">
            <button
              type="button"
              className={`switcher-pill ${selectedAccountId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedAccountId('all')}
            >
              All Accounts
            </button>
            {accounts.map((acc) => {
              const accKey = String(acc.id || acc._id);
              const isSelected = String(selectedAccountId) === accKey;
              return (
                <button
                  key={accKey}
                  type="button"
                  className={`switcher-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedAccountId(accKey)}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Flow Summary Strip */}
        <div className="account-flow-summary-strip">
          <div className="flow-stat-box outflow-box">
            <div className="flow-stat-label">
              <TrendingDown size={14} />
              <span>Total Outflow (Spent)</span>
            </div>
            <div className="flow-stat-amount font-numeric text-danger">
              {format(accountStats.spent)}
            </div>
            <div className="flow-stat-caption">
              {accountStats.expenseCount} {accountStats.expenseCount === 1 ? 'expense transaction' : 'expenses deducted'}
            </div>
          </div>

          <div className="flow-stat-box inflow-box">
            <div className="flow-stat-label">
              <TrendingUp size={14} />
              <span>Total Inflow (Deposited)</span>
            </div>
            <div className="flow-stat-amount font-numeric text-success">
              {format(accountStats.income)}
            </div>
            <div className="flow-stat-caption">
              {accountStats.incomeCount} {accountStats.incomeCount === 1 ? 'deposit transaction' : 'deposits credited'}
            </div>
          </div>

          <div className="flow-stat-box net-box">
            <div className="flow-stat-label">
              <Wallet size={14} />
              <span>Net Movement</span>
            </div>
            <div
              className={`flow-stat-amount font-numeric ${
                accountStats.net >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {accountStats.net >= 0 ? `+${format(accountStats.net)}` : format(accountStats.net)}
            </div>
            <div className="flow-stat-caption">
              {accountStats.net >= 0 ? 'Net positive inflow' : 'Net negative outflow'}
            </div>
          </div>

          <div className="flow-stat-box activity-box">
            <div className="flow-stat-label">
              <Layers size={14} />
              <span>Total Recorded</span>
            </div>
            <div className="flow-stat-amount font-numeric text-primary">
              {accountStats.count}
            </div>
            <div className="flow-stat-caption">
              Transactions linked to this account
            </div>
          </div>
        </div>

        {/* Transaction Search & Actions Filter Bar */}
        <div className="account-history-filter-bar">
          <div className="account-history-search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by transaction title, category, description..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="account-history-search-input"
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/transactions/new')}
          >
            <Plus size={14} />
            <span>Record New Expense</span>
          </button>
        </div>

        {/* Account Transactions Table */}
        <div className="account-transactions-table-wrapper">
          {accountTransactions.length === 0 ? (
            <div className="account-empty-history-state">
              <div className="empty-history-icon">
                <CreditCard size={32} />
              </div>
              <h3 className="empty-history-title">No transactions found</h3>
              <p className="empty-history-text">
                {selectedAccount
                  ? `No transactions have been recorded using ${selectedAccount.name} yet.`
                  : 'No transactions match your search criteria.'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/transactions/new')}
              >
                <Plus size={14} />
                <span>Record Expense for this Account</span>
              </button>
            </div>
          ) : (
            <table className="account-transactions-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Account Used</th>
                  <th>Date</th>
                  <th>Reminder / Note</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {accountTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr key={tx._id || tx.id} className="account-tx-row">
                      {/* Title & Description */}
                      <td>
                        <div className="tx-title-bold">{tx.title}</div>
                        {tx.description && (
                          <div className="tx-description-sub">{tx.description}</div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className="tx-category-badge">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      {/* Account Used */}
                      <td>
                        <span className="tx-account-pill">
                          {tx.accountType === 'wallet' ? (
                            <Wallet size={12} />
                          ) : (
                            <Building2 size={12} />
                          )}
                          <span>
                            {tx.accountName || selectedAccount?.name || 'Account'}{' '}
                            {tx.accountNumber ? `(${tx.accountNumber})` : ''}
                          </span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="tx-date-cell font-numeric">
                        {formatDate(tx.date)}
                      </td>

                      {/* Reminder / Note */}
                      <td>
                        {tx.hasReminder ? (
                          <span className="tx-reminder-chip" title={tx.reminderNote || 'Reminder set'}>
                            <Bell size={11} />
                            <span>{tx.reminderDate ? formatDate(tx.reminderDate) : 'Reminder'}</span>
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`tx-amount-value font-numeric ${
                            isExpense ? 'expense-amount' : 'income-amount'
                          }`}
                        >
                          {isExpense ? `-${format(tx.amount)}` : `+${format(tx.amount)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAccountAdded={() => fetchTransactions()}
      />

      {/* Quick Deposit / Withdraw / Transfer Modal */}
      <QuickAccountActionModal
        isOpen={actionModalConfig.isOpen}
        onClose={() => setActionModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialMode={actionModalConfig.mode}
        initialAccountId={actionModalConfig.accountId}
      />

      {/* Edit Account & Reconcile Modal */}
      <EditAccountModal
        isOpen={Boolean(editingAccount)}
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onAccountUpdated={() => {
          fetchTransactions();
          if (refreshAccounts) refreshAccounts();
        }}
      />
    </div>
  );
};

export default AccountsPage;
