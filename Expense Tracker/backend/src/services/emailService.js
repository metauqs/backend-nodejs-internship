const { transporter, configured } = require('../config/email');
const ApiError = require('../utils/apiError');
async function sendEmail({ to, subject, html, text }) {
    if (!configured || !transporter)
        throw new ApiError(503, 'Email is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to Backend/.env');
    return transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text
    });
}
module.exports = {
    sendEmail
};
