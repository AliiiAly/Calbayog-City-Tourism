const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP email configuration is missing.");
  }

  const info = await transporter.sendMail({
    from: `"Calbayog City Tourism" <${process.env.TOURISM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log("📧 Email sent:", info.messageId);

  return info;
};

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log("✅ Gmail SMTP connection is ready.");

    return true;
  } catch (error) {
    console.error("❌ Gmail SMTP connection failed:");
    console.error(error.message);

    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConnection,
};