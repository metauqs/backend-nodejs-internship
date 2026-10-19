import React from 'react';
import Button from '../common/Button';
import { PlusIcon, UploadIcon } from '../../assets/icons';

export const TransactionActions = ({
  onAddClick,
  onExportClick,
  totalCount,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Transactions</h2>
        {totalCount !== undefined && (
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            Showing records ({totalCount} total)
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {onExportClick && (
          <Button variant="outline" size="md" onClick={onExportClick}>
            <UploadIcon size={16} />
            <span>Export</span>
          </Button>
        )}
        {onAddClick && (
          <Button variant="primary" size="md" onClick={onAddClick}>
            <PlusIcon size={16} />
            <span>Add Transaction</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default TransactionActions;
