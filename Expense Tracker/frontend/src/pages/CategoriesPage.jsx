import React, { useState, useEffect, useCallback } from 'react';
import CategoryList from '../components/categories/CategoryList';
import CategoryForm from '../components/categories/CategoryForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import categoryService from '../services/categoryService';
import ErrorMessage from '../components/common/ErrorMessage';
import { PlusIcon } from '../assets/icons';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories();
      const data = res.data || res.categories || res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Category fetch error:', err);
      // Fallback default starter categories if backend not connected
      setCategories([
        { id: '1', name: 'Salary', type: 'income', color: '#2E7D32' },
        { id: '2', name: 'Freelance', type: 'income', color: '#388E3C' },
        { id: '3', name: 'Groceries & Dining', type: 'expense', color: '#A64B2A' },
        { id: '4', name: 'Housing & Utilities', type: 'expense', color: '#8E3200' },
        { id: '5', name: 'Transportation', type: 'expense', color: '#D7A86E' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setSubmitting(true);
      if (editingCategory) {
        const catId = editingCategory._id || editingCategory.id;
        await categoryService.updateCategory(catId, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (catId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(catId);
        fetchCategories();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div>
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
          <h1>Categories</h1>
          <p>Organize your transactions into customizable income and expense buckets.</p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
        >
          <PlusIcon size={16} />
          <span>Add Category</span>
        </Button>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <CategoryList
        categories={categories}
        isLoading={loading}
        onEdit={(cat) => {
          setEditingCategory(cat);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        onAddFirst={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <CategoryForm
          initialData={editingCategory || {}}
          onSubmit={handleCreateOrUpdate}
          isLoading={submitting}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default CategoriesPage;
