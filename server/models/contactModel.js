const nodemailer = require("nodemailer");
const connection = require("../connection");

const createContactTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      user_type VARCHAR(50),
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  connection.query(sql, (err) => {
    if (err) return console.error("contact_messages table error:", err.message);
    console.log("contact_messages table ready");
  });
};

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const getRegAdminEmails = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT email FROM account WHERE accountType = 'reg_admin' AND isActive = 'Active'`;
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results.map((r) => r.email));
    });
  });
};

const saveMessageToDB = (name, email, userType, subject, message) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO contact_messages (name, email, user_type, subject, message) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [name, email, userType, subject, message], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, userType, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    // 1. Save to DB first
    await saveMessageToDB(name, email, userType, subject, message);

    // 2. Get reg_admin emails
    const adminEmails = await getRegAdminEmails();

    if (!adminEmails.length) {
      return res.status(200).json({ success: true, message: "Message saved. No admin email configured." });
    }

    // 3. HTML email for admin
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #264752; padding: 24px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">New Contact Message</h2>
          <p style="color: #cce0e5; margin: 6px 0 0;">HR Job Portal — Support Request</p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; width: 120px;">From</td>
              <td style="padding: 10px 0; font-weight: bold; color: #264752;">${name}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #888;">Email</td>
              <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #264752;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888;">Role</td>
              <td style="padding: 10px 0; text-transform: capitalize;">${userType || "—"}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #888;">Subject</td>
              <td style="padding: 10px 0;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <p style="color: #888; margin-bottom: 8px;">Message</p>
            <div style="background: #f4f8f9; border-left: 4px solid #264752; padding: 16px; border-radius: 6px; color: #333; line-height: 1.6;">
              ${message.replace(/\n/g, "<br/>")}
            </div>
          </div>
          <div style="margin-top: 28px; text-align: center;">
            <a href="mailto:${email}?subject=Re: ${subject}"
               style="background-color: #264752; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Reply to ${name}
            </a>
          </div>
        </div>
        <div style="background: #f4f4f4; padding: 14px; text-align: center; font-size: 12px; color: #aaa;">
          HR Job Portal — Sent via Contact Us form.
        </div>
      </div>
    `;

    // 4. Send to all reg_admins
    await transporter.sendMail({
      from: `"HR Job Portal" <${process.env.MAIL_USER}>`,
      to: adminEmails.join(", "),
      replyTo: email,
      subject: `[Contact Form] ${subject} — from ${name} (${userType})`,
      html: htmlContent,
    });

    // 5. Confirmation email to user
    await transporter.sendMail({
      from: `"HR Job Portal Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `We received your message — ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 28px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h3 style="color: #264752;">Hi ${name},</h3>
          <p style="color: #555;">Thank you for contacting us. We've received your message and will get back to you within <strong>24 hours</strong>.</p>
          <div style="background: #f4f8f9; border-left: 4px solid #264752; padding: 14px; border-radius: 6px; margin: 20px 0; color: #333;">
            <strong>Your message:</strong><br/><br/>
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color: #888; font-size: 13px;">If you did not send this message, please ignore this email.</p>
          <p style="color: #264752; font-weight: bold;">— HR Job Portal Support Team</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "Message sent successfully." });

  } catch (error) {
    console.error("Contact send error:", error);
    return res.status(500).json({ success: false, error: "Failed to send message." });
  }
};

// ✅ Get all messages — for reg_admin dashboard
const getAllMessages = (req, res) => {
  const sql = `SELECT * FROM contact_messages ORDER BY created_at DESC`;
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "DB error" });
    res.status(200).json({ success: true, data: results });
  });
};

// ✅ Update message status — read / replied
const updateMessageStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = `UPDATE contact_messages SET status = ? WHERE id = ?`;
  connection.query(sql, [status, id], (err) => {
    if (err) return res.status(500).json({ success: false, error: "DB error" });
    res.status(200).json({ success: true, message: "Status updated." });
  });
};

const replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;
    const adminId = req.user.userId; 

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, error: "Reply message is required." });
    }

    // ✅ Step 1: DB se RegAdmin ka email fetch karein
    const getAdminEmail = () =>
      new Promise((resolve, reject) => {
        connection.query(
          `SELECT email FROM account WHERE id = ?`,
          [adminId],
          (err, results) => {
            if (err) return reject(err);
            if (!results.length) return reject(new Error("Admin not found"));
            resolve(results[0].email);
          }
        );
      });

    const getMsg = () =>
      new Promise((resolve, reject) => {
        connection.query(
          `SELECT * FROM contact_messages WHERE id = ?`,
          [id],
          (err, results) => {
            if (err) return reject(err);
            if (!results.length) return reject(new Error("Message not found"));
            resolve(results[0]);
          }
        );
      });

    const [adminEmail, original] = await Promise.all([getAdminEmail(), getMsg()]);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #264752; padding: 24px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">Reply from HR Job Portal</h2>
          <p style="color: #cce0e5; margin: 6px 0 0;">Support Response</p>
        </div>
        <div style="padding: 28px;">
          <p style="color: #333;">Hi <strong>${original.name}</strong>,</p>
          <p style="color: #555;">Thank you for contacting us. Here is our response:</p>

          <div style="background: #f4f8f9; border-left: 4px solid #264752; padding: 16px; border-radius: 6px; color: #333; line-height: 1.6; margin: 20px 0;">
            ${replyMessage.replace(/\n/g, "<br/>")}
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />

          <p style="color: #aaa; font-size: 12px; margin-bottom: 4px;">Your original message:</p>
          <div style="background: #fafafa; border-left: 3px solid #ccc; padding: 12px; border-radius: 6px; color: #888; font-size: 13px; line-height: 1.5;">
            <strong>Subject:</strong> ${original.subject}<br/><br/>
            ${original.message.replace(/\n/g, "<br/>")}
          </div>
        </div>
        <div style="background: #f4f4f4; padding: 14px; text-align: center; font-size: 12px; color: #aaa;">
          HR Job Portal Support — ${adminEmail}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"HR Job Portal Support" <${process.env.MAIL_USER}>`,
      to: original.email,
      replyTo: adminEmail,   
      subject: `Re: ${original.subject}`,
      html: htmlContent,
    });

    await new Promise((resolve, reject) => {
      connection.query(
        `UPDATE contact_messages SET status = 'replied' WHERE id = ?`,
        [id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return res.status(200).json({ success: true, message: "Reply sent successfully." });

  } catch (error) {
    console.error("Reply error:", error);
    return res.status(500).json({ success: false, error: "Failed to send reply." });
  }
};

module.exports = {
  createContactTable,
  sendContactMessage,
  getAllMessages,
  updateMessageStatus,
  replyToMessage,
};
