import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  DashboardIcon,
  TransactionsIcon,
  CategoriesIcon,
  ProfileIcon,
} from '../assets/icons';
import { Wallet, BookOpen } from 'lucide-react';

const AVATAR_PRESET_MAP = {
  rust: 'linear-gradient(135deg, #702700 0%, #8E3200 100%)',
  ochre: 'linear-gradient(135deg, #8C3E22 0%, #D7A86E 100%)',
  emerald: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
  sapphire: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
  onyx: 'linear-gradient(135deg, #12100E 0%, #2E2722 100%)',
  amethyst: 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%)',
};

export const Sidebar = () => {
  const { user } = useAuth();

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const avatarBg =
    user?.avatarPreset && AVATAR_PRESET_MAP[user.avatarPreset]
      ? AVATAR_PRESET_MAP[user.avatarPreset]
      : 'linear-gradient(135deg, #8E3200 0%, #A64B2A 100%)';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src="/logo.png"
            alt="Logo"
            width="28"
            height="28"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
          />
          <span>xpense <span style={{ color: 'var(--color-secondary)' }}>Tracker</span></span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <DashboardIcon size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <TransactionsIcon size={19} />
          <span>Transactions</span>
        </NavLink>

        <NavLink
          to="/khata"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={19} />
          <span>Khata</span>
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Wallet size={19} />
          <span>Accounts</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <ProfileIcon size={19} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div
            className="avatar-circle"
            style={{
              overflow: 'hidden',
              background: user?.avatarUrl ? 'transparent' : avatarBg,
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                width="36"
                height="36"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              userInitial
            )}
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-cream)' }}>
              {user?.name || 'User'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#D7A86E',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email || 'Logged in'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
