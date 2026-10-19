import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className={`auth-split-wrapper ${isRegister ? 'is-register-page' : ''}`}>
      {/* ====================================================================
          Left Section: Logo and Name of Project (Centered)
          ==================================================================== */}
      <section className="auth-brand-pane">
        {/* Ambient Decorative Background Glows */}
        <div className="auth-brand-glow-orb auth-orb-1" />
        <div className="auth-brand-glow-orb auth-orb-2" />

        <div className="auth-brand-center-block">
          <Link to="/" className="auth-brand-hero-link" title="Expense Tracker">
            <div className="auth-brand-hero-logo-wrap">
              <img
                src="/logo.png"
                alt="Expense Tracker Logo"
                className="auth-brand-hero-logo-img"
                width="64"
                height="64"
                style={{ width: '64px', height: '64px', objectFit: 'contain' }}
              />
            </div>
            <h1 className="auth-brand-hero-title">
              xpense <span>Tracker</span>
            </h1>
            <p className="auth-brand-hero-tagline">
              Personal Expense Tracker 
            </p>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          Right Section: Clean Form Pane (Login / Register Table)
          ==================================================================== */}
      <section className="auth-form-pane">
        <div className={`auth-form-inner ${isRegister ? 'register-inner' : ''}`}>
          {/* Mobile Brand Bar (Visible on mobile viewports) */}
          <div className="auth-mobile-header">
            <Link to="/" className="auth-mobile-logo-link">
              <div className="auth-mobile-logo-wrap">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="auth-mobile-logo-img"
                  width="28"
                  height="28"
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                />
              </div>
              <span className="auth-mobile-title">
                xpense <span>Tracker</span>
              </span>
            </Link>
          </div>

          {/* Auth Card Container */}
          <div className={`auth-form-card ${isRegister ? 'register-card' : ''}`}>
            <div key={location.pathname} className="page-transition-wrapper">
              {children || <Outlet />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
