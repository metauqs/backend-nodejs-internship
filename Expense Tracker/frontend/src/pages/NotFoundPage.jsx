import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: '4.5rem',
          color: 'var(--color-primary-dark)',
          marginBottom: '0.5rem',
        }}
      >
        404
      </h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ maxWidth: '420px', marginBottom: '1.75rem' }}>
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>

      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
