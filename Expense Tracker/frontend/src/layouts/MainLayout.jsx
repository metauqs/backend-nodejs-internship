import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

export const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-layout">
      <Header />
      <main className="dashboard-container">
        <div key={location.pathname} className="page-transition-wrapper">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
