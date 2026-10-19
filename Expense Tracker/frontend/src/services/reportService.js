import api from './api';

export const reportService = {
  /**
   * Fetch aggregated monthly report
   * @param {number|string} year
   * @param {number|string} month
   */
  async getMonthlyReport(year, month) {
    const response = await api.get('/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Trigger monthly summary email dispatch
   * @param {number|string} month
   * @param {number|string} year
   */
  async sendMonthlySummaryEmail(month, year) {
    const response = await api.post('/reports/email-summary', { month, year });
    return response.data;
  },
};

export default reportService;
