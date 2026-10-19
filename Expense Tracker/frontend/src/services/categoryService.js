import api from './api';

export const categoryService = {
  /**
   * Fetch categories, optionally filtered by type ('income' | 'expense')
   * @param {string} type
   */
  async getCategories(type) {
    const params = type ? { type } : {};
    const response = await api.get('/categories', { params });
    return response.data;
  },

  /**
   * Create a new category
   * @param {Object} categoryData - { name, type, color, icon }
   */
  async createCategory(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  /**
   * Update category
   * @param {string} id
   * @param {Object} categoryData
   */
  async updateCategory(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  /**
   * Delete category
   * @param {string} id
   */
  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
