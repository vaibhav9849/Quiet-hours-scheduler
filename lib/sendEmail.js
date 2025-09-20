import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const USE_SENDGRID = Boolean(process.env.SENDGRID_API_KEY);

if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

let smtpTransporter = null;
function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  if (!process.env.SMTP_HOST) return null;
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return smtpTransporter;
}

export default async function sendEmail(to, subject, text, html) {
  if (USE_SENDGRID) {
    const msg = { to, from: process.env.SMTP_USER || 'no-reply@example.com', subject, text, html };
    const res = await sgMail.send(msg);
    return res;
  }
  const transporter = getSmtpTransporter();
  if (!transporter) throw new Error('No email provider configured (set SENDGRID_API_KEY or SMTP_... vars)');
  const info = await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, text, html });
  return info;
}
