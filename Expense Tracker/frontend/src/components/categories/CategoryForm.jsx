import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { CATEGORY_TYPES } from '../../utils/constants';

export const CategoryForm = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    type: initialData.type || CATEGORY_TYPES.EXPENSE,
    color: initialData.color || '#A64B2A',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <Input
        label="Category Name"
        name="name"
        placeholder="e.g. Utilities, Salary, Groceries"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <div className="form-group">
        <label htmlFor="cat-type" className="form-label">Category Type</label>
        <select
          id="cat-type"
          name="type"
          className="form-select"
          value={formData.type}
          onChange={handleChange}
        >
          <option value={CATEGORY_TYPES.EXPENSE}>Expense</option>
          <option value={CATEGORY_TYPES.INCOME}>Income</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cat-color" className="form-label">Category Color</label>
        <input
          id="cat-color"
          type="color"
          name="color"
          className="form-input"
          style={{ height: '45px', padding: '0.2rem', cursor: 'pointer' }}
          value={formData.color}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" type="submit" isLoading={isLoading}>
          Save Category
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
