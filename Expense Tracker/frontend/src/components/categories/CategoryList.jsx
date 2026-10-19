import React from 'react';
import EmptyState from '../common/EmptyState';
import Loader from '../common/Loader';
import { getCategoryIcon, EditIcon, DeleteIcon, CategoriesIcon } from '../../assets/icons';

export const CategoryList = ({
  categories = [],
  onEdit,
  onDelete,
  isLoading = false,
  onAddFirst,
}) => {
  if (isLoading) {
    return <Loader message="Loading categories..." />;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories defined"
        message="Create custom income and expense categories to organize your transactions."
        icon={<CategoriesIcon size={44} color="var(--color-primary)" />}
        actionLabel={onAddFirst ? "Add Category" : undefined}
        onAction={onAddFirst}
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
      }}
    >
      {categories.map((cat) => {
        const catId = cat._id || cat.id || cat.name;
        const isIncome = cat.type === 'income';
        const catColor = cat.color || (isIncome ? 'var(--color-income)' : 'var(--color-primary)');

        return (
          <div
            key={catId}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderLeft: `5px solid ${catColor}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-cream-light)',
                  color: catColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getCategoryIcon(cat.name, { size: 18, color: catColor })}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.name}</div>
                <span
                  className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}
                  style={{ marginTop: '0.2rem' }}
                >
                  {cat.type}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {onEdit && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onEdit(cat)}
                  style={{ padding: '0.3rem 0.5rem' }}
                  title="Edit Category"
                >
                  <EditIcon size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(catId)}
                  style={{ padding: '0.3rem 0.5rem' }}
                  title="Delete Category"
                >
                  <DeleteIcon size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryList;
