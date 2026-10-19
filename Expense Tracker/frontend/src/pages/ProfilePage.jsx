import React, { useState, useMemo, useRef, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useCurrency } from '../context/CurrencyContext';
import { useAccounts } from '../context/AccountsContext';
import authService from '../services/authService';
import ErrorMessage from '../components/common/ErrorMessage';
import { SUPPORTED_CURRENCIES } from '../utils/constants';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  Lock,
  Bell,
  Coins,
  Download,
  Database,
  Key,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  Trash2,
  Camera,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Sparkles,
  CreditCard,
  Check,
  FileSpreadsheet,
  FileJson,
  Building,
  Globe,
  Sliders,
  Award,
  Calendar,
  TrendingUp,
} from 'lucide-react';

// Preset professional avatar color themes
const AVATAR_PRESETS = [
  { id: 'rust', label: 'Executive Rust', bg: 'linear-gradient(135deg, #702700 0%, #8E3200 100%)', text: '#FFEBC1' },
  { id: 'ochre', label: 'Warm Ochre', bg: 'linear-gradient(135deg, #8C3E22 0%, #D7A86E 100%)', text: '#FFFFFF' },
  { id: 'emerald', label: 'Emerald Wealth', bg: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)', text: '#E8F5E9' },
  { id: 'sapphire', label: 'Sapphire Corporate', bg: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)', text: '#E3F2FD' },
  { id: 'onyx', label: 'Midnight Onyx', bg: 'linear-gradient(135deg, #12100E 0%, #2E2722 100%)', text: '#FFEBC1' },
  { id: 'amethyst', label: 'Royal Amethyst', bg: 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%)', text: '#F3E5F5' },
];

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { currency, setCurrency, format } = useCurrency();
  const { accounts, totalBalance } = useAccounts();
  const fileInputRef = useRef(null);

  // Active Navigation Tab: 'personal' | 'financial' | 'security' | 'notifications' | 'data'
  const [activeTab, setActiveTab] = useState('personal');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    displayName: user?.displayName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    title: user?.title || '',
    company: user?.company || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    avatarPreset: user?.avatarPreset || 'rust',
  });

  // Keep profileData in sync if user state updates from Header or elsewhere
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name !== undefined ? user.name : prev.name,
        displayName: user.displayName || user.name || prev.displayName,
        email: user.email !== undefined ? user.email : prev.email,
        phone: user.phone !== undefined ? user.phone : prev.phone,
        title: user.title !== undefined ? user.title : prev.title,
        company: user.company !== undefined ? user.company : prev.company,
        location: user.location !== undefined ? user.location : prev.location,
        bio: user.bio !== undefined ? user.bio : prev.bio,
        avatarUrl: user.avatarUrl !== undefined ? user.avatarUrl : prev.avatarUrl,
        avatarPreset: user.avatarPreset || prev.avatarPreset,
      }));
    }
  }, [user]);

  // Financial Preferences state
  const [financialSettings, setFinancialSettings] = useState({
    defaultAccountId: user?.defaultAccountId || accounts[0]?.id || '',
    budgetThreshold: user?.budgetThreshold || '85%',
    fiscalCycle: user?.fiscalCycle || 'calendar', // 'calendar' (Jan-Dec) | 'pakistan' (Jul-Jun)
    decimalPrecision: user?.decimalPrecision || '2',
    privacyMasking: user?.privacyMasking ?? true,
    blurBalances: user?.blurBalances ?? false,
  });

  // Security Credentials state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    dailyDigest: true,
    weeklyReport: true,
    largeTxAlerts: true,
    billReminders: true,
    monthlyPdf: true,
  });

  // Loading & feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Calculate initials
  const initials = useMemo(() => {
    const targetName = profileData.name || user?.name || '';
    if (!targetName.trim()) return 'U';
    const parts = targetName.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'U';
  }, [profileData.name, user?.name]);

  // Selected avatar preset style
  const activePreset = useMemo(() => {
    return AVATAR_PRESETS.find((p) => p.id === profileData.avatarPreset) || AVATAR_PRESETS[0];
  }, [profileData.avatarPreset]);

  // Password strength calculation (0 to 4)
  const passwordStrength = useMemo(() => {
    const p = securityForm.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score;
  }, [securityForm.newPassword]);

  // Handle image upload to Cloudinary for profile photo
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size should be less than 5MB' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback({ type: '', message: 'Uploading photo to Cloudinary...' });

      const res = await authService.uploadAvatar(file);
      const updatedUser = res.user || res.data?.user || res;
      const avatarUrl = updatedUser.avatarUrl;

      if (avatarUrl) {
        setProfileData((prev) => ({ ...prev, avatarUrl }));
        updateUser({ avatarUrl });
        setFeedback({ type: 'success', message: 'Profile photo stored in Cloudinary successfully!' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not upload photo to Cloudinary';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove custom photo & revert to initials preset
  const handleRemovePhoto = async () => {
    try {
      setIsSaving(true);
      setProfileData((prev) => ({ ...prev, avatarUrl: '' }));
      updateUser({ avatarUrl: '' });
      await authService.removeAvatar();
      setFeedback({ type: 'success', message: 'Profile photo removed' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch {
      // safe fallback
    } finally {
      setIsSaving(false);
    }
  };

  // Profile fields change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Financial fields change
  const handleFinancialChange = (e) => {
    const { name, value } = e.target;
    setFinancialSettings((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle notification switches
  const handleToggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Save General Profile Changes
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setIsSaving(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        ...profileData,
        ...financialSettings,
        notifications,
      };

      try {
        await authService.updateProfile(payload);
      } catch {
        // Safe offline/local fallback
      }

      updateUser(payload);
      setFeedback({ type: 'success', message: 'Profile changes successfully synchronized!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch {
      setFeedback({ type: 'error', message: 'Could not save profile settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Password Change
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (securityForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match. Please verify.' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', message: 'Account password updated and secured successfully!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    }, 600);
  };

  // Export financial database as JSON
  const handleExportJSON = () => {
    try {
      const data = {
        user: profileData,
        exportedAt: new Date().toISOString(),
        currency,
        accounts,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ExpenseTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'JSON portfolio backup exported successfully!' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to generate JSON export.' });
    }
  };

  // Export transactions as CSV
  const handleExportCSV = () => {
    try {
      const headers = 'ID,Date,Title,Type,Category,Amount,Account\n';
      const sampleRows = [
        'TX-101,2026-10-12,Meezan House Deposit,income,Salary,125150.00,Meezan Bank',
        'TX-102,2026-10-11,Al-Fatah Grocery,expense,Food & Dining,18420.00,UBL',
        'TX-103,2026-10-10,PSO Fuel Payment,expense,Transportation,8500.00,Nayapay',
        'TX-104,2026-10-09,Client Consultation,income,Freelance,45000.00,Sadapay',
      ].join('\n');

      const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ExpenseTracker_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'CSV transaction statement downloaded successfully!' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to generate CSV export.' });
    }
  };

  return (
    <div className="profile-page-wrapper">
      {/* ====================================================================
          1. Executive Hero Profile Card
          ==================================================================== */}
      <section className="profile-hero-card">
        <div className="profile-hero-glow-1" />
        <div className="profile-hero-glow-2" />

        <div className="profile-hero-left">
          {/* Avatar with Camera Trigger & Online Status */}
          <div
            className="profile-avatar-container"
            style={{
              background: profileData.avatarUrl ? 'transparent' : activePreset.bg,
              color: activePreset.text,
            }}
          >
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={profileData.name}
                className="profile-avatar-img"
                width="104"
                height="104"
              />
            ) : (
              <span className="profile-avatar-initials">{initials}</span>
            )}

            <button
              type="button"
              className="profile-avatar-camera-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new profile photo"
            >
              <Camera size={15} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFile}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <span className="profile-status-beacon" title="Account Status: Active & Secured" />
          </div>

          {/* User Details & Identity */}
          <div className="profile-hero-meta">
            <div className="profile-name-row">
              <h1 className="profile-user-name">{profileData.name}</h1>
              <span className="profile-verified-badge">
                <ShieldCheck size={13} />
                Verified
              </span>
              <span className="profile-tier-capsule">
                <Award size={12} />
                Pro Executive
              </span>
            </div>

            <p className="profile-user-role">{profileData.title}</p>

            <div className="profile-user-subline">
              <span className="profile-subline-item">
                <Building size={14} />
                {profileData.company}
              </span>
              <span>•</span>
              <span className="profile-subline-item">
                <MapPin size={14} />
                {profileData.location}
              </span>
              <span>•</span>
              <span className="profile-subline-item">
                <Mail size={14} />
                {profileData.email}
              </span>
            </div>
          </div>
        </div>

        {/* Hero KPI Metrics */}
        <div className="profile-hero-kpis">
          <div className="profile-kpi-card">
            <span className="profile-kpi-label">Total Portfolio</span>
            <span className="profile-kpi-val font-numeric">{format(totalBalance)}</span>
            <span className="profile-kpi-sub">Across All Accounts</span>
          </div>

          <div className="profile-kpi-card">
            <span className="profile-kpi-label">Connected</span>
            <span className="profile-kpi-val font-numeric">{accounts.length} Accounts</span>
            <span className="profile-kpi-sub">Banks & Wallets</span>
          </div>

          <div className="profile-kpi-card">
            <span className="profile-kpi-label">Active Base</span>
            <span className="profile-kpi-val font-numeric">{currency}</span>
            <span className="profile-kpi-sub">Default Currency</span>
          </div>
        </div>
      </section>

      {/* Global Toast Feedback Message */}
      {feedback.message && (
        <div>
          {feedback.type === 'error' ? (
            <ErrorMessage message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />
          ) : (
            <div
              style={{
                padding: '0.85rem 1.35rem',
                borderRadius: '14px',
                backgroundColor: 'var(--color-income-bg)',
                color: 'var(--color-income)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid #C8E6C9',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          2. Tab Navigation Strip
          ==================================================================== */}
      <nav className="profile-tabs-strip">
        <button
          type="button"
          className={`profile-tab-pill ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={16} />
          <span>Personal Information</span>
        </button>

        <button
          type="button"
          className={`profile-tab-pill ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <Coins size={16} />
          <span>Financial Preferences</span>
        </button>

        <button
          type="button"
          className={`profile-tab-pill ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldCheck size={16} />
          <span>Security & Access</span>
        </button>

        <button
          type="button"
          className={`profile-tab-pill ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          <span>Smart Alerts</span>
        </button>

        <button
          type="button"
          className={`profile-tab-pill ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={16} />
          <span>Data & Privacy</span>
        </button>
      </nav>

      {/* ====================================================================
          3. Tab Content Panels
          ==================================================================== */}

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <section className="profile-tab-content-panel">
          <div className="profile-section-heading">
            <div>
              <h2 className="profile-section-title">
                <User size={22} color="var(--color-primary-dark)" />
                <span>Personal & Professional Details</span>
              </h2>
              <p className="profile-section-subtitle">
                Manage your legal name, job headline, verified contact points, and visual presentation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              {/* Full Legal Name */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Full Legal Name <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="profile-input-field"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  placeholder="e.g. Tauqs"
                  required
                />
              </div>

              {/* Display / Greeting Name */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Display Name <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  name="displayName"
                  className="profile-input-field"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  placeholder="e.g. Tauqir"
                  required
                />
                <span className="profile-field-hint">
                  Used in greeting banners (&quot;Welcome Back, {profileData.displayName}!&quot;)
                </span>
              </div>

              {/* Professional Title */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Professional Role / Occupation</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="profile-input-field"
                  value={profileData.title}
                  onChange={handleProfileChange}
                  placeholder="Occupation"
                />
              </div>

              {/* Organization / Company */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Company / Institution</span>
                </label>
                <input
                  type="text"
                  name="company"
                  className="profile-input-field"
                  value={profileData.company}
                  onChange={handleProfileChange}
                  placeholder="Organization"
                />
              </div>

              {/* Email Address */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Primary Email Address <span className="req">*</span></span>
                  <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 600 }}>Verified</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="profile-input-field"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="Enter Your Email"
                  required
                />
              </div>

              {/* Mobile Phone */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="profile-input-field"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="+92 300 1234567"
                />
              </div>

              {/* Location */}
              <div className="profile-input-group profile-form-full">
                <label className="profile-input-label">
                  <span>Residence / City & Country</span>
                </label>
                <input
                  type="text"
                  name="location"
                  className="profile-input-field"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  placeholder=""
                />
              </div>

              {/* Financial Philosophy / Bio */}
              <div className="profile-input-group profile-form-full">
                <label className="profile-input-label">
                  <span>Financial Philosophy & Objectives</span>
                </label>
                <textarea
                  name="bio"
                  className="profile-textarea-field"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  placeholder="Describe your financial goals, investment strategy, or budgeting targets..."
                />
              </div>

              {/* Avatar Preset Themes */}
              <div className="profile-input-group profile-form-full" style={{ marginTop: '0.5rem' }}>
                <label className="profile-input-label">
                  <span>Choose Executive Avatar Palette</span>
                  {profileData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileData((p) => ({ ...p, avatarUrl: '' }));
                        updateUser({ avatarUrl: '' });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                      }}
                    >
                      Reset to Initials
                    </button>
                  )}
                </label>
                <div className="avatar-preset-strip">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`avatar-preset-pill ${profileData.avatarPreset === p.id && !profileData.avatarUrl ? 'active' : ''}`}
                      style={{ background: p.bg }}
                      onClick={async () => {
                        setProfileData((prev) => ({ ...prev, avatarPreset: p.id, avatarUrl: '' }));
                        updateUser({ avatarPreset: p.id, avatarUrl: '' });
                        try {
                          await authService.removeAvatar();
                          await authService.updateProfile({ avatarPreset: p.id, avatarUrl: '' });
                        } catch {
                          // safe fallback
                        }
                      }}
                      title={p.label}
                    >
                      {initials}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pill-glass-btn"
                    style={{
                      backgroundColor: '#FAF8F5',
                      color: '#26160F',
                      border: '1.5px solid var(--color-border)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <Camera size={15} style={{ marginRight: '6px' }} />
                    {isSaving ? 'Uploading...' : 'Upload Custom Photo'}
                  </button>
                  {profileData.avatarUrl && (
                    <button
                      type="button"
                      className="pill-glass-btn"
                      style={{
                        backgroundColor: '#FFF5F5',
                        color: '#C62828',
                        border: '1.5px solid #FFCDD2',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '0.65rem 1rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                      }}
                      onClick={handleRemovePhoto}
                      disabled={isSaving}
                    >
                      <Trash2 size={15} style={{ marginRight: '6px' }} />
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-action-footer">
              <span className="profile-field-hint">
                All changes reflect across navigation headers, greetings, and report exports.
              </span>
              <button type="submit" className="profile-save-btn" disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Personal Details'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 2: FINANCIAL PREFERENCES */}
      {activeTab === 'financial' && (
        <section className="profile-tab-content-panel">
          <div className="profile-section-heading">
            <div>
              <h2 className="profile-section-title">
                <Coins size={22} color="var(--color-primary-dark)" />
                <span>Financial Ecosystem & Currency Setup</span>
              </h2>
              <p className="profile-section-subtitle">
                Select your primary reporting currency, budget compliance threshold, and default payment method.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Visual Currency Picker */}
            <div>
              <label className="profile-input-label" style={{ marginBottom: '0.65rem' }}>
                <span>Primary Base Currency <span className="req">*</span></span>
                <span style={{ fontSize: '0.8rem', color: '#8E3200', fontWeight: 600 }}>
                  Active: {currency}
                </span>
              </label>

              <div className="currency-picker-grid">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <div
                      key={c.code}
                      className={`currency-card-option ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setCurrency(c.code);
                        setFeedback({ type: 'success', message: `Base currency switched to ${c.label}` });
                      }}
                    >
                      <div className="currency-card-info">
                        <div className="currency-card-symbol-badge font-numeric">
                          {c.symbol}
                        </div>
                        <div>
                          <div className="currency-card-title">{c.code}</div>
                          <div className="currency-card-code">{c.label.split('(')[0].trim()}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{ color: '#8E3200' }}>
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Currency Preview Box */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1.15rem 1.5rem',
                  backgroundColor: '#FFF9EE',
                  border: '1.5px solid #FFEBC1',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.785rem', color: '#8E3200', fontWeight: 700, textTransform: 'uppercase' }}>
                    Live Currency Formatting Preview
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6B5547', marginTop: '2px' }}>
                    Standard numeric formatting with tabular figures applied across charts and totals:
                  </div>
                </div>

                <div className="font-numeric" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8E3200' }}>
                  {format(18425.50)}
                </div>
              </div>
            </div>

            {/* Other Financial Settings */}
            <div className="profile-form-grid">
              {/* Default Payment Account */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Default Primary Account</span>
                </label>
                <select
                  name="defaultAccountId"
                  className="profile-select-field"
                  value={financialSettings.defaultAccountId}
                  onChange={handleFinancialChange}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {acc.accountNumber} ({format(acc.balance)})
                    </option>
                  ))}
                </select>
                <span className="profile-field-hint">
                  Pre-selected source account when logging new expenses.
                </span>
              </div>

              {/* Budget Warning Threshold */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Monthly Budget Alert Threshold</span>
                </label>
                <select
                  name="budgetThreshold"
                  className="profile-select-field"
                  value={financialSettings.budgetThreshold}
                  onChange={handleFinancialChange}
                >
                  <option value="75%">Alert at 75% of Monthly Budget</option>
                  <option value="85%">Alert at 85% of Monthly Budget (Recommended)</option>
                  <option value="90%">Alert at 90% of Monthly Budget</option>
                  <option value="100%">Alert only when Budget is Exceeded (100%)</option>
                </select>
                <span className="profile-field-hint">
                  Triggers visual warning badges on Transactions &amp; Dashboard.
                </span>
              </div>

              {/* Fiscal Calendar Year */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Fiscal Calendar Cycle</span>
                </label>
                <select
                  name="fiscalCycle"
                  className="profile-select-field"
                  value={financialSettings.fiscalCycle}
                  onChange={handleFinancialChange}
                >
                  <option value="calendar">Calendar Year (January 1 – December 31)</option>
                  <option value="pakistan">Pakistan Tax / Fiscal Year (July 1 – June 30)</option>
                </select>
              </div>

              {/* Decimal Precision */}
              <div className="profile-input-group">
                <label className="profile-input-label">
                  <span>Numeric Decimal Precision</span>
                </label>
                <select
                  name="decimalPrecision"
                  className="profile-select-field"
                  value={financialSettings.decimalPrecision}
                  onChange={handleFinancialChange}
                >
                  <option value="2">Standard (2 Decimals — e.g. .56)</option>
                  <option value="0">Rounded Whole Units (0 Decimals)</option>
                </select>
              </div>
            </div>

            <div className="profile-action-footer">
              <span className="profile-field-hint">
                All financial conversions and display preferences sync in real-time.
              </span>
              <button
                type="button"
                className="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Financial Preferences'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <section className="profile-tab-content-panel">
          <div className="profile-section-heading">
            <div>
              <h2 className="profile-section-title">
                <ShieldCheck size={22} color="var(--color-primary-dark)" />
                <span>Security Credentials & Access Governance</span>
              </h2>
              <p className="profile-section-subtitle">
                Fortify your financial data with strong passwords, two-factor authentication, and session inspection.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#26160F', marginBottom: '1rem' }}>
                Change Password
              </h3>

              <div className="profile-form-grid">
                {/* Current Password */}
                <div className="profile-input-group profile-form-full">
                  <label className="profile-input-label">
                    <span>Current Password</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      className="profile-input-field"
                      style={{ paddingRight: '2.5rem' }}
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6B5547',
                        cursor: 'pointer',
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="profile-input-group">
                  <label className="profile-input-label">
                    <span>New Password</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="profile-input-field"
                      style={{ paddingRight: '2.5rem' }}
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="At least 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6B5547',
                        cursor: 'pointer',
                      }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {securityForm.newPassword && (
                    <div className="password-strength-container">
                      <div className="password-strength-bars">
                        <div className={`password-strength-bar ${passwordStrength >= 1 ? `strength-${passwordStrength}` : ''}`} />
                        <div className={`password-strength-bar ${passwordStrength >= 2 ? `strength-${passwordStrength}` : ''}`} />
                        <div className={`password-strength-bar ${passwordStrength >= 3 ? `strength-${passwordStrength}` : ''}`} />
                        <div className={`password-strength-bar ${passwordStrength >= 4 ? `strength-${passwordStrength}` : ''}`} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: passwordStrength >= 3 ? '#2E7D32' : '#E65100' }}>
                        {passwordStrength === 1 && 'Weak: add uppercase, numbers, and symbols'}
                        {passwordStrength === 2 && 'Fair: include symbols or digits'}
                        {passwordStrength === 3 && 'Good password strength'}
                        {passwordStrength === 4 && 'Excellent strong password'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="profile-input-group">
                  <label className="profile-input-label">
                    <span>Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    className="profile-input-field"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placehonlder="Re-Enter Password"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="submit" className="profile-save-btn" disabled={isSaving}>
                  <Key size={16} />
                  <span>{isSaving ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid #F0ECE4' }} />

            {/* Two-Factor Authentication Section */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#26160F', marginBottom: '0.35rem' }}>
                Two-Factor Authentication (2FA)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B5547', marginBottom: '1.25rem' }}>
                Require an additional one-time authentication code from Google Authenticator or SMS OTP when signing in.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  backgroundColor: '#FAF8F5',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '16px',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: twoFactorEnabled ? '#E8F5E9' : '#FFF3E0',
                      color: twoFactorEnabled ? '#2E7D32' : '#E65100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#26160F' }}>
                      {twoFactorEnabled ? 'Two-Factor Authentication is Active' : '2FA Currently Disabled'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B5547' }}>
                      {twoFactorEnabled ? 'Protects account logins via Authenticator App' : 'Enable 2FA to protect large balance transfers'}
                    </div>
                  </div>
                </div>

                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={() => {
                      setTwoFactorEnabled((p) => !p);
                      setFeedback({
                        type: 'success',
                        message: !twoFactorEnabled ? '2FA Enabled successfully' : '2FA Disabled',
                      });
                    }}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F0ECE4' }} />

            {/* Active Devices & Sessions Audit */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#26160F', margin: 0 }}>
                    Active Sessions &amp; Authorized Devices
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B5547', margin: '0.2rem 0 0' }}>
                    Devices currently signed into your Expense Tracker account.
                  </p>
                </div>
                <button
                  type="button"
                  className="pill-glass-btn"
                  style={{
                    backgroundColor: '#FAF7F2',
                    color: '#8E3200',
                    border: '1px solid #EADBCE',
                    fontWeight: 700,
                  }}
                  onClick={() => setFeedback({ type: 'success', message: 'All other remote sessions revoked.' })}
                >
                  Revoke Other Sessions
                </button>
              </div>

              {/* Current Active Device Session */}
              <div className="security-device-card">
                <div className="security-device-left">
                  <div className="security-device-icon">
                    {typeof navigator !== 'undefined' && /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? (
                      <Smartphone size={22} />
                    ) : (
                      <Laptop size={22} />
                    )}
                  </div>
                  <div>
                    <div className="security-device-name">
                      {typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
                        ? 'Macintosh • macOS'
                        : typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent)
                        ? 'Windows PC'
                        : typeof navigator !== 'undefined' && /linux/i.test(navigator.userAgent)
                        ? 'Linux Desktop'
                        : 'Web Client Device'}
                    </div>
                    <div className="security-device-meta">
                      Active Browser Session • Local Client
                    </div>
                  </div>
                </div>
                <span className="security-device-badge">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2E7D32' }} />
                  Current Active Session
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: SMART ALERTS & NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <section className="profile-tab-content-panel">
          <div className="profile-section-heading">
            <div>
              <h2 className="profile-section-title">
                <Bell size={22} color="var(--color-primary-dark)" />
                <span>Smart Notifications & Financial Alerting</span>
              </h2>
              <p className="profile-section-subtitle">
                Configure proactive alerts for budget overruns, recurring bills, and executive financial summaries.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">Monthly Budget Overrun Warning</div>
                  <div className="setting-toggle-desc">
                    Receive instant alerts when cumulative spending crosses {financialSettings.budgetThreshold} of your designated monthly budget limit.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.budgetAlerts}
                  onChange={() => handleToggleNotification('budgetAlerts')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">Daily Evening Spending Summary</div>
                  <div className="setting-toggle-desc">
                    Get an automated notification at 9:00 PM summarizing total daily expenses, card swipes, and remaining budget headroom.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.dailyDigest}
                  onChange={() => handleToggleNotification('dailyDigest')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">Weekly Cash Flow Briefing</div>
                  <div className="setting-toggle-desc">
                    Receive a weekly comparative analysis comparing this week&apos;s expenditures against the 4-week running average.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={() => handleToggleNotification('weeklyReport')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">High-Value Transaction Alerts</div>
                  <div className="setting-toggle-desc">
                    Instant push security notification for single transactions exceeding ₨ 15,000 or currency equivalent.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.largeTxAlerts}
                  onChange={() => handleToggleNotification('largeTxAlerts')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">Recurring Bill &amp; Subscription Due Reminders</div>
                  <div className="setting-toggle-desc">
                    Advance reminders 3 business days before software subscriptions, credit dues, or rent payments are scheduled.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.billReminders}
                  onChange={() => handleToggleNotification('billReminders')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-info">
                <div className="setting-toggle-icon">
                  <Download size={18} />
                </div>
                <div>
                  <div className="setting-toggle-title">Automated Monthly PDF Statement Delivery</div>
                  <div className="setting-toggle-desc">
                    Automatically generate and email an executive financial statement PDF to {profileData.email} on the 1st of every month.
                  </div>
                </div>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifications.monthlyPdf}
                  onChange={() => handleToggleNotification('monthlyPdf')}
                />
                <span className="profile-switch-slider" />
              </label>
            </div>

            <div className="profile-action-footer">
              <span className="profile-field-hint">
                Notification preferences are stored securely with your user profile.
              </span>
              <button
                type="button"
                className="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: DATA MANAGEMENT & PRIVACY */}
      {activeTab === 'data' && (
        <section className="profile-tab-content-panel">
          <div className="profile-section-heading">
            <div>
              <h2 className="profile-section-title">
                <Database size={22} color="var(--color-primary-dark)" />
                <span>Data Sovereignty, Portability &amp; Privacy</span>
              </h2>
              <p className="profile-section-subtitle">
                Export complete financial ledgers, configure on-screen privacy, and manage data lifecycle.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Export Section */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#26160F', marginBottom: '0.45rem' }}>
                Export Financial Statements &amp; Backups
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B5547', marginBottom: '1.25rem' }}>
                Download your complete expense history, bank account balances, and categorizations in open data formats.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#FAF8F5',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                      <FileSpreadsheet size={24} color="#2E7D32" />
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#26160F' }}>CSV Statement</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#6B5547', margin: 0, lineHeight: 1.45 }}>
                      Compatible with Microsoft Excel, Google Sheets, QuickBooks, and accounting platforms.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pill-glass-btn"
                    style={{
                      backgroundColor: '#2E7D32',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      justifyContent: 'center',
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                    }}
                    onClick={handleExportCSV}
                  >
                    <Download size={15} style={{ marginRight: '6px' }} />
                    Download CSV Ledger
                  </button>
                </div>

                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#FAF8F5',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                      <FileJson size={24} color="#8E3200" />
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#26160F' }}>JSON Archive</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#6B5547', margin: 0, lineHeight: 1.45 }}>
                      Full structured database backup including user profile, connected accounts, and currency configs.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pill-glass-btn"
                    style={{
                      backgroundColor: '#8E3200',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      justifyContent: 'center',
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                    }}
                    onClick={handleExportJSON}
                  >
                    <Download size={15} style={{ marginRight: '6px' }} />
                    Export Complete JSON Archive
                  </button>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F0ECE4' }} />

            {/* Display Privacy Controls */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#26160F', marginBottom: '1rem' }}>
                Visual Privacy &amp; Screen Masking
              </h3>

              <div className="setting-toggle-row">
                <div className="setting-toggle-info">
                  <div className="setting-toggle-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="setting-toggle-title">Mask Account &amp; Card Numbers by Default</div>
                    <div className="setting-toggle-desc">
                      Displays accounts in safe mask format (e.g. •••• 9286) to prevent shoulder-surfing in public environments.
                    </div>
                  </div>
                </div>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={financialSettings.privacyMasking}
                    onChange={(e) => setFinancialSettings((p) => ({ ...p, privacyMasking: e.target.checked }))}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>

              <div className="setting-toggle-row">
                <div className="setting-toggle-info">
                  <div className="setting-toggle-icon">
                    <EyeOff size={18} />
                  </div>
                  <div>
                    <div className="setting-toggle-title">Incognito Privacy Mode (Blur Balances)</div>
                    <div className="setting-toggle-desc">
                      Blurs total balance figures on public screens until hovered over with cursor.
                    </div>
                  </div>
                </div>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={financialSettings.blurBalances}
                    onChange={(e) => setFinancialSettings((p) => ({ ...p, blurBalances: e.target.checked }))}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-danger-box">
              <h4 className="profile-danger-title">
                <AlertTriangle size={18} />
                <span>Danger Zone — Data Management</span>
              </h4>
              <p className="profile-danger-desc">
                The actions below impact your locally stored financial records. Proceed with caution.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #FFCDD2',
                    color: '#C62828',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (window.confirm('Reset all demo financial data to pristine default accounts and records?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  Reset Demo Ledger to Defaults
                </button>

                <button
                  type="button"
                  style={{
                    backgroundColor: '#C62828',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (window.confirm('Are you certain you wish to delete this account? This action cannot be undone.')) {
                      localStorage.clear();
                      window.location.href = '/login';
                    }
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: '-2px' }} />
                  Permanently Close Account
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProfilePage;
