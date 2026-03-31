const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");


const createMessagesTable = () => {
  const messagesTableQuery = `
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  senderId INT,
  receiverId INT,
  jobId INT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (senderId) REFERENCES account(id),
  FOREIGN KEY (receiverId) REFERENCES account(id),
  FOREIGN KEY (jobId) REFERENCES job_posts(id)
);
`;

  connection.query(messagesTableQuery, function (err, results, fields) {
    if (err) {
      console.error("Error creating Messages table:", err.message);
    } else {
      console.log("Messages table created successfully");
    }
  });
}

// Update getAllMessages to optionally filter by jobId
const getAllMessages = (req, res) => {
  const userId = req.params.userId;
  const otherUserId = req.params.otherUserId;
  const jobId = req.query.jobId; // Optional jobId filter

  try {
    let query = `
      SELECT 
        m.*, 
        jp.job_title 
      FROM messages m
      LEFT JOIN job_posts jp ON m.jobId = jp.id
      WHERE (
        (m.senderId = ? AND m.receiverId = ? AND m.deleted_by_sender = 0)
        OR 
        (m.senderId = ? AND m.receiverId = ? AND m.deleted_by_receiver = 0)
      )
    `;

    let params = [
      userId, otherUserId, // messages sent by userId, not deleted by sender
      otherUserId, userId  // messages received by userId, not deleted by receiver
    ];

    // Add jobId filter if provided
    if (jobId) {
      query += ` AND (m.jobId = ? OR m.jobId IS NULL)`;
      params.push(jobId);
    }

    query += ` ORDER BY timestamp ASC`;

    connection.query(query, params, (error, results) => {
      if (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ error: 'An error occurred while fetching messages.' });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'An error occurred while fetching messages.' });
  }
};

// Update getContact to show last message per contact (optionally per job)
const getContact = (req, res) => {
  const { userId } = req.params;
  const { jobId } = req.query; // Optional job filter

  let query = `
    SELECT
      a.id,
      a.username AS full_name,
      m.message AS last_message,
      m.timestamp AS last_message_time,
      m.jobId
    FROM messages m
    INNER JOIN (
      SELECT
        CASE 
          WHEN senderId = ? THEN receiverId
          ELSE senderId
        END AS contact_id,
        MAX(timestamp) AS last_time
      FROM messages
      WHERE
        (senderId = ? OR receiverId = ?)
        AND (
          (senderId = ? AND deleted_by_sender = 0)
          OR
          (receiverId = ? AND deleted_by_receiver = 0)
        )
  `;

  let params = [
    userId,
    userId,
    userId,
    userId,
    userId
  ];

  // Add job filter to subquery if provided
  if (jobId) {
    query += ` AND jobId = ?`;
    params.push(jobId);
  }

  query += `
      GROUP BY contact_id
    ) lm
      ON (
        ((m.senderId = ? AND m.receiverId = lm.contact_id)
        OR (m.receiverId = ? AND m.senderId = lm.contact_id))
        AND m.timestamp = lm.last_time
      )
    JOIN account a ON a.id = lm.contact_id
    ORDER BY m.timestamp DESC
  `;

  params.push(userId, userId);

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
};

const deleteMessage = (req, res) => {
  const { userId, otherUserId } = req.body;

  if (!userId || !otherUserId) {
    return res.status(400).json({ error: 'Both userId and otherUserId are required.' });
  }

  const query = `
    UPDATE messages
    SET 
      deleted_by_sender = CASE WHEN senderId = ? AND receiverId = ? THEN TRUE ELSE deleted_by_sender END,
      deleted_by_receiver = CASE WHEN receiverId = ? AND senderId = ? THEN TRUE ELSE deleted_by_receiver END
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
  `;

  const params = [
    userId, otherUserId,
    userId, otherUserId,
    userId, otherUserId,
    otherUserId, userId
  ];

  connection.query(query, params, (error, result) => {
    if (error) {
      console.error('Error soft deleting conversation:', error);
      return res.status(500).json({ error: 'An error occurred while deleting the conversation.' });
    }

    res.status(200).json({ success: true, message: 'Conversation deleted for user.' });
  });
}

const sendMessage = (req, res) => {
  const { senderId, receiverId, message, jobId } = req.body; // Added jobId

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ error: 'Sender ID, receiver ID, and message are required.' });
  }

  try {
    // Modified query to include jobId
    const insertQuery = 'INSERT INTO messages (senderId, receiverId, jobId, message, timestamp, is_read) VALUES (?, ?, ?, ?, NOW(), FALSE)';

    connection.query(insertQuery, [senderId, receiverId, jobId || null, message], (error, results) => {
      if (error) {
        console.error('Error saving message:', error);
        return res.status(500).json({ error: 'An error occurred while saving the message.' });
      }

      const messageId = results.insertId;

      const selectQuery = 'SELECT * FROM messages WHERE id = ?';
      connection.query(selectQuery, [messageId], (selectError, selectResults) => {
        if (selectError) {
          console.error('Error retrieving saved message:', selectError);
          return res.status(500).json({ error: 'An error occurred while retrieving the message.' });
        }

        const savedMessage = selectResults[0];
        res.status(200).json({ success: true, message: 'Message sent successfully.', savedMessage });
      });
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'An error occurred while sending the message.' });
  }
};

const markasRead = (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Missing senderId or receiverId' });
  }

  const query = `
    UPDATE messages 
    SET is_read = TRUE 
    WHERE senderId = ? AND receiverId = ? AND is_read = FALSE
  `;

  connection.query(query, [senderId, receiverId], (error, result) => {
    if (error) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({
      message: 'Messages marked as read',
      affectedRows: result.affectedRows,
    });
  });
}


const unreadMessage = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT DISTINCT a.id AS senderId, a.username
    FROM messages m
    JOIN account a ON m.senderId = a.id
    WHERE m.receiverId = ?
      AND m.is_read = 0
      AND m.deleted_by_receiver = 0
  `;

  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching unread senders:', error);
      return res.status(500).json({ error: 'An error occurred while fetching unread senders.' });
    }

    res.status(200).json(results);
  });
}
// New function to get conversation for a specific job
const getJobMessages = (req, res) => {
  const { candidateId, jobId } = req.params;
  const userId = req.query.userId; // The logged-in user (company/recruiter)

  if (!candidateId || !jobId || !userId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const query = `
    SELECT * FROM messages 
    WHERE (
      (senderId = ? AND receiverId = ? AND deleted_by_sender = 0)
      OR 
      (senderId = ? AND receiverId = ? AND deleted_by_receiver = 0)
    )
    AND jobId = ?
    ORDER BY timestamp ASC
  `;

  connection.query(
    query,
    [userId, candidateId, candidateId, userId, jobId],
    (error, results) => {
      if (error) {
        console.error('Error fetching job messages:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(results);
    }
  );
};

const unreadCount = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT COUNT(*) AS unreadCount
    FROM (
      SELECT m.is_read
      FROM messages m
      JOIN (
        SELECT 
          CASE 
            WHEN senderId = ? THEN receiverId 
            ELSE senderId 
          END AS contactId,
          MAX(timestamp) AS max_timestamp
        FROM messages
        WHERE (senderId = ? OR receiverId = ?)
        GROUP BY contactId
      ) t2
      ON (
        ((m.senderId = ? AND m.receiverId = t2.contactId) OR 
         (m.senderId = t2.contactId AND m.receiverId = ?)) 
        AND m.timestamp = t2.max_timestamp
      )
      WHERE 
        -- Respect soft delete
        (
          (m.senderId = ? AND m.deleted_by_sender = 0) OR 
          (m.receiverId = ? AND m.deleted_by_receiver = 0)
        )
        AND m.is_read = 0
        AND m.receiverId = ?
    ) subquery;
  `;

  const params = [
    userId, userId, userId, // contactId logic
    userId, userId,         // join with latest messages
    userId, userId,          // soft delete filter
    userId                   // final receiverId filter
  ];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching unread contact count:', error);
      return res.status(500).json({ error: 'An error occurred while fetching unread contact count.' });
    }

    res.status(200).json({ unreadCount: results[0].unreadCount });
  });
}

module.exports = {
  createMessagesTable,
  getContact,
  getAllMessages,
  deleteMessage,
  sendMessage,
  markasRead,
  unreadMessage,
  unreadCount,
  getJobMessages
}