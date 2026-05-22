const nodemailer = require("nodemailer");
const crypto = require("crypto");
const connection = require("../connection");

const transporter = nodemailer.createTransport({
  service: "gmail", // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = (accountId, email) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  connection.query(
    `INSERT INTO email_verification_tokens (account_id, token, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), used = FALSE`,
    [accountId, token, expiresAt],
    (err) => {
      if (err) return console.error("Token insert error:", err);

      const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

      transporter.sendMail({
        from: `"JobPortal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your email address",
        html: `
          <p>Thanks for signing up!</p>
          <p>Click the link below to verify your email. This link expires in 24 hours.</p>
          <a href="${verifyUrl}" style="padding:10px 20px;background:#36565f;color:#fff;border-radius:6px;text-decoration:none;">
            Verify Email
          </a>
          <p>If you didn't sign up, ignore this email.</p>
        `,
      });
    }
  );
};

module.exports = sendVerificationEmail;