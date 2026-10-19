import api from './api';

export const accountService = {
  /**
   * Fetch all user accounts
   */
  async getAccounts() {
    const response = await api.get('/accounts');
    return response.data;
  },

  /**
   * Create a new account
   * @param {Object} accountData - { name, type, balance, accountNumber, institution }
   */
  async createAccount(accountData) {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  /**
   * Update an existing account
   * @param {string} id
   * @param {Object} accountData
   */
  async updateAccount(id, accountData) {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  /**
   * Delete an account
   * @param {string} id
   */
  async deleteAccount(id) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  /**
   * Deposit money into account
   * @param {string} id
   * @param {number} amount
   */
  async deposit(id, amount) {
    const response = await api.post(`/accounts/${id}/deposit`, { amount });
    return response.data;
  },

  /**
   * Withdraw money from account
   * @param {string} id
   * @param {number} amount
   */
  async withdraw(id, amount) {
    const response = await api.post(`/accounts/${id}/withdraw`, { amount });
    return response.data;
  },

  /**
   * Transfer money between accounts
   * @param {string} fromAccountId
   * @param {string} toAccountId
   * @param {number} amount
   */
  async transfer(fromAccountId, toAccountId, amount) {
    const response = await api.post('/accounts/transfer', {
      fromAccountId,
      toAccountId,
      amount,
    });
    return response.data;
  },

  /**
   * Reconcile account balance against its recorded transactions
   * @param {string} id
   */
  async reconcileAccount(id) {
    const response = await api.post(`/accounts/${id}/reconcile`);
    return response.data;
  },

  /**
   * Reconcile all accounts for the current user
   */
  async reconcileAll() {
    const response = await api.post('/accounts/reconcile-all');
    return response.data;
  },
};

export default accountService;
