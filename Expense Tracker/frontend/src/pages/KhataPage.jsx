import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useAccounts } from '../context/AccountsContext';
import useAuth from '../hooks/useAuth';
import khataService from '../services/khataService';
import transactionService from '../services/transactionService';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Phone,
  Search,
  Filter,
  Plus,
  Wallet,
  Building2,
  DollarSign,
  AlertCircle,
  X,
  Send,
  MessageCircle,
  Copy,
  Check,
  Trash2,
  Receipt,
  Share2,
  TrendingUp,
  Scale,
  CreditCard,
  Sparkles,
  Zap,
} from 'lucide-react';

const RELATIONSHIPS = ['All', 'Friend', 'Relative', 'Family', 'Colleague', 'Client', 'Other'];

export const KhataPage = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || null;
  const { format } = useCurrency();
  const { accounts, refreshAccounts } = useAccounts();

  // State initialized cleanly per user session
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'lend' | 'borrow' | 'settled'
  const [searchQuery, setSearchQuery] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'amount-desc' | 'due-asc'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Toast / feedback message
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedReminder, setCopiedReminder] = useState(false);

  // New Khata Form state
  const [newKhataForm, setNewKhataForm] = useState({
    type: 'lend', // 'lend' (Lene Hain) | 'borrow' (Dene Hain)
    partyName: '',
    partyPhone: '',
    relationship: 'Friend',
    totalAmount: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    linkedAccountId: accounts[0]?.id || '',
    syncAccount: true,
    notes: '',
  });

  // Repayment Form state
  const [payForm, setPayForm] = useState({
    amount: '',
    accountId: accounts[0]?.id || '',
    syncAccount: true,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  // Fetch entries
  const fetchKhata = async () => {
    if (!userId) {
      setEntries([]);
      return;
    }
    try {
      const data = await khataService.getAllEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch Khata entries:', err);
    }
  };

  useEffect(() => {
    fetchKhata();
  }, [userId]);

  // Lock body scroll and close on Escape when any modal is open
  const anyModalOpen = isAddModalOpen || isPayModalOpen || isReminderModalOpen || isHistoryModalOpen;

  useEffect(() => {
    if (anyModalOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsAddModalOpen(false);
          setIsPayModalOpen(false);
          setIsReminderModalOpen(false);
          setIsHistoryModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = origOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [anyModalOpen]);

  // Compute Summary KPI
  const summary = useMemo(() => {
    return khataService.calculateSummary(entries);
  }, [entries]);

  // Filtered & Sorted Entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((item) => {
        // Tab filter
        if (activeTab === 'lend') return item.type === 'lend' && item.status !== 'settled';
        if (activeTab === 'borrow') return item.type === 'borrow' && item.status !== 'settled';
        if (activeTab === 'settled') return item.status === 'settled';
        return true; // 'all'
      })
      .filter((item) => {
        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.partyName.toLowerCase().includes(q) ||
          item.partyPhone.includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      })
      .filter((item) => {
        // Relationship filter
        if (relationshipFilter === 'All') return true;
        return item.relationship?.toLowerCase() === relationshipFilter.toLowerCase();
      })
      .sort((a, b) => {
        if (sortBy === 'amount-desc') return b.remainingAmount - a.remainingAmount;
        if (sortBy === 'due-asc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      });
  }, [entries, activeTab, searchQuery, relationshipFilter, sortBy]);

  // Handle Create Khata Entry
  const handleCreateKhata = async (e) => {
    e.preventDefault();
    const amountNum = Math.abs(Number(newKhataForm.totalAmount));
    if (!newKhataForm.partyName.trim()) {
      setFeedback({ type: 'error', message: 'Please provide name' });
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid loan amount' });
      return;
    }

    const linkedAcc = accounts.find((a) => (a.id && a.id === newKhataForm.linkedAccountId) || (a._id && a._id === newKhataForm.linkedAccountId)) || accounts[0];

    // Bank Account & Wallet validation on creation
    if (newKhataForm.syncAccount && linkedAcc && newKhataForm.type === 'lend') {
      if (Number(linkedAcc.balance || 0) < amountNum) {
        setFeedback({ type: 'error', message: `Cannot lend: Insufficient balance in ${linkedAcc.name}` });
        return;
      }
    }

    try {
      await khataService.createEntry({
        ...newKhataForm,
        totalAmount: amountNum,
        linkedAccountId: linkedAcc?.id || linkedAcc?._id || '',
        linkedAccountName: linkedAcc?.name || 'Primary Account',
      });

      // Synchronize into Transactions with skipAccountAdjustment so the backend doesn't double-charge the account
      if (newKhataForm.syncAccount) {
        const isLend = newKhataForm.type === 'lend';
        try {
          await transactionService.createTransaction({
            title: isLend
              ? `Loan Given to ${newKhataForm.partyName}`
              : `Loan Received from ${newKhataForm.partyName}`,
            amount: amountNum,
            type: isLend ? 'expense' : 'income',
            category: 'Khata / Loan',
            date: newKhataForm.date || new Date().toISOString().slice(0, 10),
            accountId: linkedAcc?.id || linkedAcc?._id || '',
            accountName: linkedAcc?.name || 'Primary Account',
            accountNumber: linkedAcc?.accountNumber || '•••• 1024',
            accountType: linkedAcc?.type || 'bank',
            description: newKhataForm.notes || (isLend
              ? `Personal loan advance given to ${newKhataForm.partyName} (${newKhataForm.relationship}) - Synced with ${linkedAcc?.name || 'Account'}`
              : `Personal loan amount borrowed from ${newKhataForm.partyName} (${newKhataForm.relationship}) - Synced with ${linkedAcc?.name || 'Account'}`),
            partyName: newKhataForm.partyName,
            skipAccountAdjustment: true,
            hasReminder: false,
          });
        } catch (txErr) {
          console.warn('Note: Transaction sync fallback:', txErr);
        }
      }

      await fetchKhata();
      if (refreshAccounts) {
        await refreshAccounts();
      }
      setIsAddModalOpen(false);
      setFeedback({
        type: 'success',
        message: `${newKhataForm.type === 'lend' ? 'Loan given' : 'Loan received'} successfully recorded! Added to Recent Transactions and synced with ${linkedAcc?.name || 'account'}!`,
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4500);

      // Reset form
      setNewKhataForm({
        type: 'lend',
        partyName: '',
        partyPhone: '',
        relationship: 'Friend',
        totalAmount: '',
        date: new Date().toISOString().slice(0, 10),
        dueDate: '',
        linkedAccountId: accounts[0]?.id || '',
        syncAccount: true,
        notes: '',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to record Khata entry.' });
    }
  };

  // Open Repayment Modal
  const handleOpenPayModal = (entry) => {
    setSelectedEntry(entry);
    setPayForm({
      amount: entry.remainingAmount,
      accountId: accounts[0]?.id || '',
      syncAccount: true,
      date: new Date().toISOString().slice(0, 10),
      note: entry.type === 'lend' ? 'Loan repayment received' : 'Paid back loan installment',
    });
    setIsPayModalOpen(true);
  };

  // Handle Settle / Repayment submit
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntry) return;

    const payAmount = Math.abs(Number(payForm.amount));
    if (isNaN(payAmount) || payAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid repayment amount' });
      return;
    }
    if (payAmount > selectedEntry.remainingAmount) {
      setFeedback({
        type: 'error',
        message: `Amount exceeds remaining balance of ${format(selectedEntry.remainingAmount)}`,
      });
      return;
    }

    const chosenAcc = accounts.find((a) => (a.id && a.id === payForm.accountId) || (a._id && a._id === payForm.accountId)) || accounts[0];

    // Validate balance if repaying borrowed money
    if (payForm.syncAccount && chosenAcc && selectedEntry.type !== 'lend') {
      if (Number(chosenAcc.balance || 0) < payAmount) {
        setFeedback({
          type: 'error',
          message: `Cannot pay loan: Insufficient balance in ${chosenAcc.name}`,
        });
        return;
      }
    }

    try {
      await khataService.recordPayment(selectedEntry.id, {
        amount: payAmount,
        accountId: chosenAcc?.id || chosenAcc?._id || '',
        accountName: chosenAcc?.name || 'Primary Account',
        date: payForm.date,
        note: payForm.note,
      });

      // Synchronize directly into Transactions with skipAccountAdjustment
      const isLend = selectedEntry.type === 'lend';
      try {
        await transactionService.createTransaction({
          title: isLend
            ? `Loan Repayment from ${selectedEntry.partyName}`
            : `Loan Paid to ${selectedEntry.partyName}`,
          amount: payAmount,
          type: isLend ? 'income' : 'expense',
          category: 'Khata / Loan',
          date: payForm.date || new Date().toISOString().slice(0, 10),
          accountId: chosenAcc?.id || chosenAcc?._id || '',
          accountName: chosenAcc?.name || 'Primary Account',
          accountNumber: chosenAcc?.accountNumber || '•••• 1024',
          accountType: chosenAcc?.type || 'bank',
          description: payForm.note || (isLend
            ? `Loan repayment received from ${selectedEntry.partyName} (${selectedEntry.relationship}) - Synced with ${chosenAcc?.name || 'Account'}`
            : `Paid back loan installment to ${selectedEntry.partyName} (${selectedEntry.relationship}) - Synced with ${chosenAcc?.name || 'Account'}`),
          partyName: selectedEntry.partyName,
          khataId: selectedEntry.id,
          skipAccountAdjustment: true,
          hasReminder: false,
        });
      } catch (txErr) {
        console.warn('Note: Transaction sync fallback:', txErr);
      }

      await fetchKhata();
      if (refreshAccounts) {
        await refreshAccounts();
      }
      setIsPayModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Payment of ${format(payAmount)} recorded! Added to Recent Transactions and synced with ${chosenAcc?.name || 'account'}.`,
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
    } catch {
      setFeedback({ type: 'error', message: 'Could not record repayment.' });
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id, partyName) => {
    if (window.confirm(`Are you sure you want to delete Khata record for "${partyName}"?`)) {
      try {
        await khataService.deleteEntry(id);
        await fetchKhata();
        setFeedback({ type: 'success', message: 'Khata entry removed successfully.' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
      } catch {
        setFeedback({ type: 'error', message: 'Failed to delete Khata entry.' });
      }
    }
  };

  // Generate WhatsApp Reminder Text
  const reminderMessage = useMemo(() => {
    if (!selectedEntry) return '';
    const formattedAmt = format(selectedEntry.remainingAmount);
    const dueTxt = selectedEntry.dueDate ? `due by ${selectedEntry.dueDate}` : 'as discussed';
    return `Assalam-o-Alaikum ${selectedEntry.partyName}, hope you are well. This is a gentle reminder regarding the loan balance of ${formattedAmt} (${dueTxt}). Kindly transfer once convenient. JazakAllah khair!`;
  }, [selectedEntry, format]);

  // Copy Reminder to Clipboard
  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 3000);
  };

  return (
    <div className="khata-page-container">
      {/* Hero Header Section */}
      <div className="khata-hero-header">
        <div>
          <div className="khata-badge-pill">
            <BookOpen size={14} />
            <span>Personal Loan & Udhaar Ledger</span>
          </div>
          <h1 className="khata-main-title">Khata Ledger</h1>
          <p className="khata-sub-title">
          </p>
        </div>

        <div className="khata-header-action-group">
          <button
            type="button"
            className="khata-action-btn lend-btn"
            onClick={() => {
              setNewKhataForm((p) => ({ ...p, type: 'lend' }));
              setIsAddModalOpen(true);
            }}
          >
            <span className="khata-action-btn-bubble">
              <ArrowDownLeft size={13} strokeWidth={2.5} />
            </span>
            <span>+ LENT</span>
          </button>

          <button
            type="button"
            className="khata-action-btn borrow-btn"
            onClick={() => {
              setNewKhataForm((p) => ({ ...p, type: 'borrow' }));
              setIsAddModalOpen(true);
            }}
          >
            <span className="khata-action-btn-bubble">
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </span>
            <span>- OWE</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div style={{ marginBottom: '1.25rem' }}>
          {feedback.type === 'error' ? (
            <ErrorMessage message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />
          ) : (
            <div className="khata-toast-success animate-fade-in">
              <CheckCircle2 size={18} />
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 4 KPI Metric Summary Cards */}
      <div className="khata-kpi-grid">
        {/* Net Khata Balance */}
        <div className="khata-kpi-card highlight-card">
          <div className="khata-kpi-icon-row">
            <span className="khata-kpi-label">Net Khata Balance</span>
            <div className="khata-kpi-icon-circle balance-circle">
              <Scale size={18} />
            </div>
          </div>
          <div className="khata-kpi-amount font-numeric" style={{ color: summary.netBalance >= 0 ? '#1B5E20' : '#8E3200' }}>
            {summary.netBalance >= 0 ? '+' : ''}{format(summary.netBalance)}
          </div>
          <p className="khata-kpi-subtext font-numeric">
            {summary.netBalance >= 0
              ? `You are net owed across all personal loans`
              : `You net owe across personal loans`}
          </p>
        </div>

        {/* LENT */}
        <div className="khata-kpi-card">
          <div className="khata-kpi-icon-row">
            <span className="khata-kpi-label">LENT</span>
            <div className="khata-kpi-icon-circle lend-circle">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="khata-kpi-amount font-numeric" style={{ color: '#1B5E20' }}>
            {format(summary.toReceiveTotal)}
          </div>
          <p className="khata-kpi-subtext font-numeric">
            Lent by you to {summary.debtorsCount} {summary.debtorsCount === 1 ? 'person' : 'people'} (Receivables)
          </p>
        </div>

        {/* OWE */}
        <div className="khata-kpi-card">
          <div className="khata-kpi-icon-row">
            <span className="khata-kpi-label">OWE</span>
            <div className="khata-kpi-icon-circle borrow-circle">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="khata-kpi-amount font-numeric" style={{ color: '#8E3200' }}>
            {format(summary.toPayTotal)}
          </div>
          <p className="khata-kpi-subtext font-numeric">
            Owed by you to {summary.creditorsCount} {summary.creditorsCount === 1 ? 'person' : 'people'} (Payables)
          </p>
        </div>

        {/* Settled / Resolved */}
        <div className="khata-kpi-card">
          <div className="khata-kpi-icon-row">
            <span className="khata-kpi-label">Settled & Returned</span>
            <div className="khata-kpi-icon-circle settled-circle">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="khata-kpi-amount font-numeric" style={{ color: '#5C554E' }}>
            {format(summary.settledTotal)}
          </div>
          <p className="khata-kpi-subtext font-numeric">
            Fully settled loans & returned funds
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Strip */}
      <div className="khata-filter-strip">
        {/* Navigation Tabs */}
        <div className="khata-tabs-group">
          <button
            type="button"
            className={`khata-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Khata</span>
            <span className="khata-tab-badge font-numeric">{entries.length}</span>
          </button>

          <button
            type="button"
            className={`khata-tab-pill lend ${activeTab === 'lend' ? 'active' : ''}`}
            onClick={() => setActiveTab('lend')}
          >
            <ArrowDownLeft size={14} />
            <span>LENT</span>
            <span className="khata-tab-badge font-numeric">{summary.debtorsCount}</span>
          </button>

          <button
            type="button"
            className={`khata-tab-pill borrow ${activeTab === 'borrow' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrow')}
          >
            <ArrowUpRight size={14} />
            <span>OWE</span>
            <span className="khata-tab-badge font-numeric">{summary.creditorsCount}</span>
          </button>

          <button
            type="button"
            className={`khata-tab-pill ${activeTab === 'settled' ? 'active' : ''}`}
            onClick={() => setActiveTab('settled')}
          >
            <CheckCircle2 size={14} />
            <span>Settled</span>
          </button>
        </div>

        {/* Search & Select Controls */}
        <div className="khata-controls-group">
          <div className="khata-search-box">
            <Search size={15} className="khata-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="khata-search-input"
            />
          </div>

          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            className="khata-select-pill"
          >
            {RELATIONSHIPS.map((rel) => (
              <option key={rel} value={rel}>
                {rel === 'All' ? 'All Relations' : rel}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="khata-select-pill font-numeric"
          >
            <option value="date-desc">Newest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="due-asc">Due Date (Upcoming)</option>
          </select>
        </div>
      </div>

      {/* Khata Ledger List */}
      <div className="khata-ledger-list">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((item) => {
            const isLend = item.type === 'lend';
            const isSettled = item.status === 'settled';
            const paidPercent = item.totalAmount > 0
              ? Math.min(100, Math.round((item.amountPaid / item.totalAmount) * 100))
              : 0;

            return (
              <div key={item.id} className={`khata-entry-card ${isSettled ? 'settled-card' : ''}`}>
                {/* Left: Avatar, Name, Relationship & Details */}
                <div className="khata-entry-left">
                  <div className={`khata-party-avatar ${isLend ? 'lend-avatar' : 'borrow-avatar'}`}>
                    {item.partyName ? item.partyName.charAt(0).toUpperCase() : 'P'}
                  </div>

                  <div className="khata-party-meta">
                    <div className="khata-party-title-row">
                      <h3 className="khata-party-name">{item.partyName}</h3>
                      <span className="khata-rel-badge">{item.relationship}</span>
                      <span className={`khata-type-pill ${isLend ? 'lend-pill' : 'borrow-pill'}`}>
                        {isLend ? 'LENT' : 'OWE'}
                      </span>
                      {isSettled && (
                        <span className="khata-settled-pill">
                          <CheckCircle2 size={12} />
                          Settled
                        </span>
                      )}
                    </div>

                    <div className="khata-party-subline font-numeric">
                      {item.partyPhone && (
                        <span className="khata-sub-item">
                          <Phone size={12} />
                          {item.partyPhone}
                        </span>
                      )}
                      <span>•</span>
                      <span className="khata-sub-item">
                        <CreditCard size={12} />
                        {item.linkedAccountName || 'Account'}
                      </span>
                      {item.dueDate && (
                        <>
                          <span>•</span>
                          <span className="khata-sub-item" style={{ color: '#8E3200', fontWeight: 600 }}>
                            <Clock size={12} />
                            Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>

                    {item.notes && (
                      <p className="khata-party-notes">"{item.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Right: Amounts, Progress & Action Hub */}
                <div className="khata-entry-right">
                  <div className="khata-amounts-box font-numeric">
                    <span className="khata-amount-label">
                      {isSettled ? 'Settled Amount' : 'Remaining Balance'}
                    </span>
                    <div
                      className="khata-remaining-amount"
                      style={{ color: isSettled ? '#5C554E' : isLend ? '#1B5E20' : '#8E3200' }}
                    >
                      {format(item.remainingAmount)}
                    </div>
                    <div className="khata-total-original">
                      Total: {format(item.totalAmount)}
                      {item.amountPaid > 0 && ` (${format(item.amountPaid)} paid)`}
                    </div>

                    {/* Progress Bar for partial */}
                    {!isSettled && item.totalAmount > 0 && (
                      <div className="khata-mini-progress-track">
                        <div
                          className="khata-mini-progress-fill"
                          style={{
                            width: `${paidPercent}%`,
                            background: isLend ? '#2E7D32' : '#8E3200',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions Strip */}
                  <div className="khata-actions-strip">
                    {!isSettled && (
                      <button
                        type="button"
                        className="khata-btn-primary"
                        onClick={() => handleOpenPayModal(item)}
                        title={isLend ? 'Record received loan payback' : 'Pay back loan to friend/relative'}
                      >
                        <DollarSign size={14} />
                        <span>{isLend ? 'Collect / Settle' : 'Pay Back'}</span>
                      </button>
                    )}

                    {isLend && !isSettled && item.partyPhone && (
                      <button
                        type="button"
                        className="khata-btn-secondary"
                        onClick={() => {
                          setSelectedEntry(item);
                          setIsReminderModalOpen(true);
                        }}
                        title="Send polite WhatsApp reminder"
                      >
                        <MessageCircle size={14} />
                        <span>Reminder</span>
                      </button>
                    )}

                    {item.history && item.history.length > 0 && (
                      <button
                        type="button"
                        className="khata-btn-icon"
                        onClick={() => {
                          setSelectedEntry(item);
                          setIsHistoryModalOpen(true);
                        }}
                        title="View repayment timeline"
                      >
                        <Receipt size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="khata-btn-icon delete"
                      onClick={() => handleDeleteEntry(item.id, item.partyName)}
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="khata-empty-state">
            <BookOpen size={42} style={{ color: '#D7A86E', marginBottom: '0.85rem' }} />
            <h3 style={{ margin: '0 0 0.35rem 0', color: '#12100E' }}>No Khata Records Found</h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#706860', fontSize: '0.9rem', maxWidth: '420px' }}>
              Keep track of personal debts and loan amounts with friends, relatives, and colleagues while keeping your bank & mobile wallet balances in sync.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="khata-action-btn lend-btn"
                onClick={() => {
                  setNewKhataForm((p) => ({ ...p, type: 'lend' }));
                  setIsAddModalOpen(true);
                }}
              >
                <span className="khata-action-btn-bubble">
                  <ArrowDownLeft size={13} strokeWidth={2.5} />
                </span>
                <span>+ LENT</span>
              </button>
              <button
                type="button"
                className="khata-action-btn borrow-btn"
                onClick={() => {
                  setNewKhataForm((p) => ({ ...p, type: 'borrow' }));
                  setIsAddModalOpen(true);
                }}
              >
                <span className="khata-action-btn-bubble">
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                </span>
                <span>- OWE</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          1. Add Khata Entry Modal (Lend / Borrow with Account Sync)
          ==================================================================== */}
      {isAddModalOpen && createPortal(
        <div className="cat-details-modal-overlay" onClick={() => setIsAddModalOpen(false)} role="dialog" aria-modal="true">
          <div className="cat-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="cat-details-header">
              <div className="cat-details-header-left">
                <div
                  className="cat-details-icon-box"
                  style={{
                    backgroundColor: newKhataForm.type === 'lend' ? '#E8F5E9' : '#FFF1EC',
                    color: newKhataForm.type === 'lend' ? '#1B5E20' : '#8E3200',
                  }}
                >
                  {newKhataForm.type === 'lend' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <h3 className="cat-details-title">
                    {newKhataForm.type === 'lend' ? 'Record LENT' : 'Record OWE'}
                  </h3>
                  <p className="cat-details-subtitle">
                    Record loan with friend or relative and sync bank account balance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cat-details-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKhata} className="khata-modal-form">
              <div className="cat-details-body">
                {/* Type Toggle */}
                <div className="khata-modal-type-strip">
                  <button
                    type="button"
                    className={`khata-modal-type-btn ${newKhataForm.type === 'lend' ? 'active-lend' : ''}`}
                    onClick={() => setNewKhataForm((p) => ({ ...p, type: 'lend' }))}
                  >
                    <ArrowDownLeft size={16} />
                    <span>+ LENT</span>
                  </button>
                  <button
                    type="button"
                    className={`khata-modal-type-btn ${newKhataForm.type === 'borrow' ? 'active-borrow' : ''}`}
                    onClick={() => setNewKhataForm((p) => ({ ...p, type: 'borrow' }))}
                  >
                    <ArrowUpRight size={16} />
                    <span>- OWE</span>
                  </button>
                </div>

                {/* Name & Phone */}
                <div className="profile-form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="khata-input-group">
                    <label className="khata-input-label">Person / Relative Name *</label>
                    <div className="khata-input-wrapper">
                      <User size={16} className="khata-input-prefix-icon" style={{ left: '0.95rem', color: '#8C7B70' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ali Ahmed"
                        value={newKhataForm.partyName}
                        onChange={(e) => setNewKhataForm((p) => ({ ...p, partyName: e.target.value }))}
                        className="khata-input-field"
                      />
                    </div>
                  </div>

                  <div className="khata-input-group">
                    <label className="khata-input-label">Phone / WhatsApp Number</label>
                    <div className="khata-input-wrapper">
                      <Phone size={16} className="khata-input-prefix-icon" style={{ left: '0.95rem', color: '#8C7B70' }} />
                      <input
                        type="text"
                        placeholder="e.g. 03001234567"
                        value={newKhataForm.partyPhone}
                        onChange={(e) => setNewKhataForm((p) => ({ ...p, partyPhone: e.target.value }))}
                        className="khata-input-field font-numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Relationship & Amount */}
                <div className="profile-form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="khata-input-group">
                    <label className="khata-input-label">Relationship Tag</label>
                    <select
                      value={newKhataForm.relationship}
                      onChange={(e) => setNewKhataForm((p) => ({ ...p, relationship: e.target.value }))}
                      className="khata-select-field"
                    >
                      {RELATIONSHIPS.filter((r) => r !== 'All').map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="khata-input-group">
                    <label className="khata-input-label">Loan Amount *</label>
                    <div className="khata-input-wrapper">
                      <span className="khata-input-prefix-icon font-numeric">₨</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder="0.00"
                        value={newKhataForm.totalAmount}
                        onChange={(e) => setNewKhataForm((p) => ({ ...p, totalAmount: e.target.value }))}
                        className="khata-input-field font-numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Linked Bank / Wallet Account Sync */}
                <div className="khata-sync-box" style={{ marginTop: '1rem' }}>
                  <div className="khata-input-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <label className="khata-input-label" style={{ margin: 0 }}>
                        {newKhataForm.type === 'lend' ? 'Payment Account (Deduct from)' : 'Receiving Account (Deposit to)'}
                      </label>
                      <span className="khata-sync-badge font-numeric">
                        <Zap size={11} />
                        Live Sync
                      </span>
                    </div>
                    <select
                      value={newKhataForm.linkedAccountId}
                      onChange={(e) => setNewKhataForm((p) => ({ ...p, linkedAccountId: e.target.value }))}
                      className="khata-select-field font-numeric"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — Current Balance: {format(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="khata-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newKhataForm.syncAccount}
                      onChange={(e) => setNewKhataForm((p) => ({ ...p, syncAccount: e.target.checked }))}
                    />
                    <span>
                      <strong>Auto-Sync Account & Transactions:</strong>{' '}
                      {newKhataForm.type === 'lend'
                        ? 'Deduct from account now & record in Recent Transactions'
                        : 'Deposit into account now & record in Recent Transactions'}
                    </span>
                  </label>
                </div>

                {/* Issue & Due Date */}
                <div className="profile-form-grid" style={{ marginTop: '0.85rem' }}>
                  <div className="khata-input-group">
                    <label className="khata-input-label">Issue Date</label>
                    <input
                      type="date"
                      value={newKhataForm.date}
                      onChange={(e) => setNewKhataForm((p) => ({ ...p, date: e.target.value }))}
                      className="khata-input-field font-numeric"
                    />
                  </div>

                  <div className="khata-input-group">
                    <label className="khata-input-label">Expected Due Date</label>
                    <input
                      type="date"
                      value={newKhataForm.dueDate}
                      onChange={(e) => setNewKhataForm((p) => ({ ...p, dueDate: e.target.value }))}
                      className="khata-input-field font-numeric"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="khata-input-group" style={{ marginTop: '0.85rem' }}>
                  <label className="khata-input-label">Purpose / Notes</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Emergency loan for car repairs, to be returned by next month..."
                    value={newKhataForm.notes}
                    onChange={(e) => setNewKhataForm((p) => ({ ...p, notes: e.target.value }))}
                    className="khata-textarea-field"
                  />
                </div>
              </div>

              {/* Pinned Footer Actions */}
              <div className="cat-details-footer" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="pill-glass-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="khata-submit-btn font-numeric"
                  style={{
                    background: newKhataForm.type === 'lend'
                      ? 'linear-gradient(135deg, #1B5E20 0%, #144918 100%)'
                      : 'linear-gradient(135deg, #8E3200 0%, #702700 100%)',
                  }}
                >
                  <Check size={16} />
                  <span>Save Khata Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          2. Record Payment / Settle Modal (Syncs with Bank/Wallet & Transactions)
          ==================================================================== */}
      {isPayModalOpen && selectedEntry && createPortal(
        <div className="cat-details-modal-overlay" onClick={() => setIsPayModalOpen(false)} role="dialog" aria-modal="true">
          <div className="cat-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="cat-details-header">
              <div className="cat-details-header-left">
                <div
                  className="cat-details-icon-box"
                  style={{
                    backgroundColor: selectedEntry.type === 'lend' ? '#E8F5E9' : '#FFF1EC',
                    color: selectedEntry.type === 'lend' ? '#1B5E20' : '#8E3200',
                  }}
                >
                  {selectedEntry.type === 'lend' ? <ArrowDownLeft size={22} strokeWidth={2.4} /> : <ArrowUpRight size={22} strokeWidth={2.4} />}
                </div>
                <div>
                  <h3 className="cat-details-title">
                    {selectedEntry.type === 'lend' ? 'Collect Repayment (LENT)' : 'Pay Back (OWE)'}
                  </h3>
                  <p className="cat-details-subtitle">
                    Party: <strong>{selectedEntry.partyName}</strong> • Outstanding: <strong className="font-numeric">{format(selectedEntry.remainingAmount)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cat-details-close-btn"
                onClick={() => setIsPayModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="khata-modal-form">
              <div className="cat-details-body">
                {/* Payment Amount */}
                <div className="khata-input-group">
                  <label className="khata-input-label">
                    <span>Payment Amount *</span>
                    <span className="font-numeric" style={{ fontSize: '0.785rem', color: '#8C7B70', fontWeight: 600 }}>
                      Max: {format(selectedEntry.remainingAmount)}
                    </span>
                  </label>
                  <div className="khata-input-wrapper">
                    <span className="khata-input-prefix-icon font-numeric">₨</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedEntry.remainingAmount}
                      step="any"
                      value={payForm.amount}
                      onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                      className="khata-input-field font-numeric"
                      placeholder="Enter amount..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`khata-quick-amt-btn font-numeric ${Number(payForm.amount) === selectedEntry.remainingAmount ? 'active' : ''}`}
                      onClick={() => setPayForm((p) => ({ ...p, amount: selectedEntry.remainingAmount }))}
                    >
                      <span>Full Balance ({format(selectedEntry.remainingAmount)})</span>
                    </button>
                    {selectedEntry.remainingAmount > 1000 && (
                      <button
                        type="button"
                        className={`khata-quick-amt-btn font-numeric ${Number(payForm.amount) === Math.round(selectedEntry.remainingAmount / 2) ? 'active' : ''}`}
                        onClick={() => setPayForm((p) => ({ ...p, amount: Math.round(selectedEntry.remainingAmount / 2) }))}
                      >
                        <span>50% ({format(Math.round(selectedEntry.remainingAmount / 2))})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sync Bank Account Picker */}
                <div className="khata-sync-box" style={{ marginTop: '1rem' }}>
                  <div className="khata-input-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <label className="khata-input-label" style={{ margin: 0 }}>
                        {selectedEntry.type === 'lend' ? 'Deposit Repayment Into Account' : 'Pay From Account / Wallet'}
                      </label>
                      <span className="khata-sync-badge font-numeric">
                        <Zap size={11} />
                        Live Sync
                      </span>
                    </div>
                    <select
                      value={payForm.accountId}
                      onChange={(e) => setPayForm((p) => ({ ...p, accountId: e.target.value }))}
                      className="khata-select-field font-numeric"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — Balance: {format(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="khata-checkbox-label">
                    <input
                      type="checkbox"
                      checked={payForm.syncAccount}
                      onChange={(e) => setPayForm((p) => ({ ...p, syncAccount: e.target.checked }))}
                    />
                    <span>
                      <strong>Auto-Sync Account & Transactions:</strong>{' '}
                      {selectedEntry.type === 'lend'
                        ? 'Automatically deposits into selected account & records in Recent Transactions.'
                        : 'Automatically deducts from selected account & records in Recent Transactions.'}
                    </span>
                  </label>
                </div>

                {/* Payment Date & Note in Grid */}
                <div className="khata-input-group" style={{ marginTop: '0.85rem' }}>
                  <label className="khata-input-label">Payment Date</label>
                  <input
                    type="date"
                    value={payForm.date}
                    onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                    className="khata-input-field font-numeric"
                  />
                </div>

                <div className="khata-input-group" style={{ marginTop: '0.85rem' }}>
                  <label className="khata-input-label">Transaction Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Received via JazzCash / Bank transfer"
                    value={payForm.note}
                    onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                    className="khata-input-field"
                  />
                </div>
              </div>

              {/* Pinned Footer Actions */}
              <div className="cat-details-footer" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="pill-glass-btn" onClick={() => setIsPayModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="khata-submit-btn font-numeric">
                  <Check size={16} />
                  <span>Confirm & Sync Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          3. WhatsApp / SMS Reminder Modal
          ==================================================================== */}
      {isReminderModalOpen && selectedEntry && createPortal(
        <div className="cat-details-modal-overlay" onClick={() => setIsReminderModalOpen(false)} role="dialog" aria-modal="true">
          <div className="cat-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="cat-details-header">
              <div className="cat-details-header-left">
                <div className="cat-details-icon-box" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="cat-details-title">Friendly Loan Reminder</h3>
                  <p className="cat-details-subtitle">For {selectedEntry.partyName} ({selectedEntry.partyPhone})</p>
                </div>
              </div>
              <button
                type="button"
                className="cat-details-close-btn"
                onClick={() => setIsReminderModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cat-details-body">
              <div className="khata-reminder-card">
                <p className="khata-reminder-text">{reminderMessage}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="khata-btn-primary"
                  style={{ flex: 1, backgroundColor: '#2E7D32' }}
                  onClick={handleCopyReminder}
                >
                  {copiedReminder ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedReminder ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                </button>

                {selectedEntry.partyPhone && (
                  <a
                    href={`https://wa.me/${selectedEntry.partyPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reminderMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="khata-btn-secondary"
                    style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                  >
                    <Send size={15} />
                    <span>Open in WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          4. Payment Timeline / History Modal
          ==================================================================== */}
      {isHistoryModalOpen && selectedEntry && createPortal(
        <div className="cat-details-modal-overlay" onClick={() => setIsHistoryModalOpen(false)} role="dialog" aria-modal="true">
          <div className="cat-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="cat-details-header">
              <div className="cat-details-header-left">
                <div className="cat-details-icon-box" style={{ backgroundColor: '#FAF8F5', color: '#8E3200' }}>
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="cat-details-title">Repayment History</h3>
                  <p className="cat-details-subtitle">Ledger timeline for {selectedEntry.partyName}</p>
                </div>
              </div>
              <button
                type="button"
                className="cat-details-close-btn"
                onClick={() => setIsHistoryModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cat-details-body">
              <div className="cat-details-kpi-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="cat-details-kpi-card">
                  <span className="cat-details-kpi-label">Total Loan</span>
                  <div className="cat-details-kpi-value font-numeric">{format(selectedEntry.totalAmount)}</div>
                </div>
                <div className="cat-details-kpi-card">
                  <span className="cat-details-kpi-label">Total Paid Back</span>
                  <div className="cat-details-kpi-value font-numeric" style={{ color: '#1B5E20' }}>
                    {format(selectedEntry.amountPaid)}
                  </div>
                </div>
              </div>

              {selectedEntry.history && selectedEntry.history.length > 0 ? (
                <div className="cat-details-tx-list">
                  {selectedEntry.history.map((h, i) => (
                    <div key={h.id || i} className="cat-details-tx-item">
                      <div>
                        <div style={{ fontWeight: 600, color: '#12100E', fontSize: '0.9rem' }}>
                          {h.note || 'Repayment Installment'}
                        </div>
                        <div className="cat-details-tx-sub font-numeric">
                          <Calendar size={11} />
                          <span>{h.date}</span>
                          <span>•</span>
                          <span>{h.accountName || 'Account'}</span>
                        </div>
                      </div>
                      <div className="font-numeric" style={{ fontWeight: 700, color: '#1B5E20', fontSize: '1rem' }}>
                        +{format(h.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#706860', fontSize: '0.85rem' }}>
                  No payment events recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KhataPage;
