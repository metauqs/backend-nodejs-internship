import React from 'react';

export const ErrorMessage = ({
  message,
  onRetry,
  onClose,
}) => {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm btn-outline"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          >
            Retry
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
