import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import { LogoutIcon } from '../assets/icons';
import { Bell, Camera, Check } from 'lucide-react';

const AVATAR_PRESET_MAP = {
  rust: 'linear-gradient(135deg, #702700 0%, #8E3200 100%)',
  ochre: 'linear-gradient(135deg, #8C3E22 0%, #D7A86E 100%)',
  emerald: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
  sapphire: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
  onyx: 'linear-gradient(135deg, #12100E 0%, #2E2722 100%)',
  amethyst: 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%)',
};

export const Header = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [photoToast, setPhotoToast] = useState('');
  const fileInputRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'T';

  const avatarBg =
    user?.avatarPreset && AVATAR_PRESET_MAP[user.avatarPreset]
      ? AVATAR_PRESET_MAP[user.avatarPreset]
      : 'linear-gradient(135deg, #8E3200 0%, #A64B2A 100%)';

  // Handle direct photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setPhotoToast('Image size should be less than 3MB');
      setTimeout(() => setPhotoToast(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (typeof result === 'string') {
        updateUser({ avatarUrl: result });
        try {
          await authService.updateProfile({ avatarUrl: result });
        } catch {
          // Local fallback handled by updateUser
        }
        setPhotoToast('Profile photo updated successfully!');
        setTimeout(() => setPhotoToast(''), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <header className="top-navbar">
      {/* Left: Project Logo using User-Provided Wallet Icon */}
      <NavLink to="/dashboard" className="nav-brand">
        <img
          src="/logo.png"
          alt="Expense Tracker"
          width="36"
          height="36"
          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
        />
        <span>xpense <span style={{ color: 'var(--color-primary)' }}>Tracker</span></span>
      </NavLink>

      {/* Center: Floating Capsule Navigation */}
      <nav className="nav-capsule">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `capsule-link ${isActive ? 'active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => `capsule-link ${isActive ? 'active' : ''}`}
        >
          Transactions
        </NavLink>
        <NavLink
          to="/khata"
          className={({ isActive }) => `capsule-link ${isActive ? 'active' : ''}`}
        >
          Khata
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) => `capsule-link ${isActive ? 'active' : ''}`}
        >
          Accounts
        </NavLink>
      </nav>

      {/* Right: Notifications & Profile with Direct Photo Update */}
      <div className="nav-actions">
        {/* Toast confirmation for photo updates */}
        {photoToast && (
          <div className="header-photo-toast">
            <Check size={14} />
            <span>{photoToast}</span>
          </div>
        )}

        <button
          type="button"
          className="icon-circle-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* Profile Avatar Pill linking directly to /profile */}
        <div className="header-avatar-wrapper">
          <NavLink
            to="/profile"
            className={({ isActive }) => `header-avatar-btn ${isActive ? 'active' : ''}`}
            title={user?.name ? `${user.name} (View Profile & Settings)` : 'My Profile & Settings'}
            aria-label="My Profile & Settings"
          >
            <div
              className="header-avatar-inner"
              style={{
                background: user?.avatarUrl ? 'transparent' : avatarBg,
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'User Profile'}
                  width="38"
                  height="38"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                userInitial
              )}
            </div>

            {/* Direct Camera Upload Badge on the Avatar */}
            <span
              className="header-avatar-cam-badge"
              title="Upload new profile photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              role="button"
              tabIndex={0}
              aria-label="Change profile photo"
            >
              <Camera size={10} strokeWidth={2.5} />
            </span>
          </NavLink>

          {/* Hidden File Input for Native Image Picker */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="icon-circle-btn"
          aria-label="Logout"
          title="Logout"
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </header>
  );
};

export default Header;
