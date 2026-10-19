import React from 'react';
import { TRANSACTION_TYPES, SORT_OPTIONS } from '../../utils/constants';
import { SearchIcon, FilterIcon } from '../../assets/icons';

export const TransactionFilters = ({
  filters = {},
  onFilterChange,
  categories = [],
}) => {
  const handleInputChange = (field, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [field]: value });
    }
  };

  const handleReset = () => {
    if (onFilterChange) {
      onFilterChange({
        search: '',
        type: '',
        category: '',
        startDate: '',
        endDate: '',
        sort: '-date',
      });
    }
  };

  return (
    <div className="transaction-filters-card">
      <div className="transaction-filters-grid">
        {/* Search */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="filter-search" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <SearchIcon size={14} />
            <span>Search</span>
          </label>
          <input
            id="filter-search"
            type="text"
            className="form-input filter-control"
            placeholder="Search by title..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="filter-type">Type</label>
          <select
            id="filter-type"
            className="form-select filter-control"
            value={filters.type || ''}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value={TRANSACTION_TYPES.INCOME}>Income</option>
            <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            className="form-select filter-control"
            value={filters.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => {
              const name = typeof c === 'string' ? c : c.name;
              return (
                <option key={name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="filter-sort">Sort By</label>
          <select
            id="filter-sort"
            className="form-select filter-control"
            value={filters.sort || '-date'}
            onChange={(e) => handleInputChange('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Action */}
        <div className="filter-reset-wrapper">
          <button
            type="button"
            className="filter-reset-btn"
            onClick={handleReset}
          >
            <FilterIcon size={15} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
