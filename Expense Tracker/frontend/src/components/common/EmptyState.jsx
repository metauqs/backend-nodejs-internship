import React from 'react';
import Button from './Button';
import { EmptyFolderIcon } from '../../assets/icons';

export const EmptyState = ({
  title = 'No data available',
  message = 'There are no items to display at this time.',
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div
        className="empty-state-icon"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          marginBottom: '0.75rem',
        }}
      >
        {icon || <EmptyFolderIcon size={44} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p style={{ maxWidth: '400px', margin: '0 auto 1.25rem' }}>{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
