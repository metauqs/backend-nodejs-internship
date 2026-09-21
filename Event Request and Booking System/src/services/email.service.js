const { transporter, configured } = require("../config/mail");
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Sends a booking decision (ACCEPTED / REJECTED) email to the attendee.
 *
 * @param {object} opts
 * @param {string}  opts.to          - Recipient email address
 * @param {string}  opts.userName    - Attendee's display name
 * @param {string}  opts.eventTitle  - Event title
 * @param {string}  opts.status      - "ACCEPTED" | "REJECTED"
 * @param {Date}   [opts.eventDate]  - Event date (optional)
 * @param {string} [opts.eventLocation] - Event location (optional)
 */
async function sendBookingDecisionEmail({
  to,
  userName,
  eventTitle,
  status,
  eventDate,
  eventLocation
}) {
  if (!configured || !transporter) {
    console.warn("SMTP is not configured. Booking decision email skipped.");
    return { sent: false, skipped: true };
  }

  const isAccepted = status === "ACCEPTED";

  const subject = isAccepted
    ? `Your booking for "${eventTitle}" is confirmed!`
    : `Booking update for "${eventTitle}"`;

  // ── colour palette ────────────────────────────────────────────────────────
  const accentColor = isAccepted ? "#16a34a" : "#dc2626"; // green / red
  const bannerBg = isAccepted ? "#dcfce7" : "#fee2e2";
  const bannerBorder = isAccepted ? "#86efac" : "#fca5a5";
  const badgeBg = isAccepted ? "#16a34a" : "#dc2626";
  const emoji = isAccepted ? "🎉" : "😞";
  const headline = isAccepted ? "Booking Confirmed!" : "Booking Not Approved";
  const bodyText = isAccepted
    ? `Great news! Your booking request for <strong>${eventTitle}</strong> has been <strong style="color:${accentColor}">accepted</strong>. We look forward to seeing you there!`
    : `We're sorry to let you know that your booking request for <strong>${eventTitle}</strong> has been <strong style="color:${accentColor}">rejected</strong>. Please feel free to browse other available events.`;

  const formattedDate = formatDate(eventDate);

  // ── event-details rows (only rendered when data is present) ───────────────
  const detailRows = [
    formattedDate && `<tr>
      <td style="padding:6px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">📅 Date</td>
      <td style="padding:6px 0;font-size:14px;color:#111827;">${formattedDate}</td>
    </tr>`,
    eventLocation && `<tr>
      <td style="padding:6px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">📍 Location</td>
      <td style="padding:6px 0;font-size:14px;color:#111827;">${eventLocation}</td>
    </tr>`
  ].filter(Boolean).join("");

  const detailsBlock = detailRows ? `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:20px;background:#f9fafb;border-radius:8px;padding:16px;">
      <tbody>${detailRows}</tbody>
    </table>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#a5b4fc;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Event Booking System</p>
              <h1 style="margin:8px 0 0;font-size:26px;color:#ffffff;font-weight:700;">${emoji} ${headline}</h1>
            </td>
          </tr>

          <!-- Status banner -->
          <tr>
            <td style="padding:0 32px;">
              <div style="margin-top:24px;padding:14px 20px;background:${bannerBg};border:1px solid ${bannerBorder};border-radius:8px;text-align:center;">
                <span style="display:inline-block;background:${badgeBg};color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 14px;border-radius:999px;">${status}</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi <strong>${userName}</strong>,</p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">${bodyText}</p>
              ${detailsBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px;border-top:1px solid #e5e7eb;margin-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                This is an automated notification — please do not reply to this email.<br/>
                &copy; ${new Date().getFullYear()} Event Booking System. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Event Booking System" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });

  return { sent: true };
}

module.exports = { sendBookingDecisionEmail };