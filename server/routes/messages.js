// Server-side code
const express = require("express");
const router = express.Router();
const connection = require("../connection");




// Endpoint to delete the messages
router.post('/delete-conversation', (req, res) => {
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
    userId, otherUserId,     // Set deleted_by_sender = 1 when userId is sender
    userId, otherUserId,     // Set deleted_by_receiver = 1 when userId is receiver
    userId, otherUserId,     // WHERE condition (both directions)
    otherUserId, userId
  ];

  connection.query(query, params, (error, result) => {
    if (error) {
      console.error('Error soft deleting conversation:', error);
      return res.status(500).json({ error: 'An error occurred while deleting the conversation.' });
    }

    res.status(200).json({ success: true, message: 'Conversation deleted for user.' });
  });
});


// Endpoint to post a message
router.post('/message', async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ error: 'Sender ID, receiver ID, and message are required.' });
  }

  try {
    const insertQuery = 'INSERT INTO messages (senderId, receiverId, message, timestamp, is_read) VALUES (?, ?, ?, NOW(), FALSE)';
    
    connection.query(insertQuery, [senderId, receiverId, message], (error, results) => {
      if (error) {
        console.error('Error saving message:', error);
        return res.status(500).json({ error: 'An error occurred while saving the message.' });
      }

      const messageId = results.insertId;

      // Fetch the newly inserted message (including timestamp and is_read)
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
});



// Endpoint to change the read status of message
router.post('/mark-as-read', (req, res) => {
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
});


//contact list APIs


// Endpoint to get unread count for contacts
router.get('/contacts/unread-count/:userId', (req, res) => {
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
});

router.get('/unread-senders/:userId', (req, res) => {
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
});





module.exports = router;
