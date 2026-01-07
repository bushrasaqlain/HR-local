

const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createMessagesTable = () => {
const messagesTableQuery = `
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  senderId INT,
  receiverId INT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (senderId) REFERENCES account(id),
  FOREIGN KEY (receiverId) REFERENCES account(id)
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


const getContact=(req,res)=>{
     const { userId } = req.params;

  const query = `
    SELECT 
      a.id,
      a.username AS full_name,
      m.message AS last_message,
      m.timestamp AS last_message_time,
      m.is_read,
      m.senderId
    FROM account a
    JOIN (
      SELECT t1.*
      FROM messages t1
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
        ((t1.senderId = ? AND t1.receiverId = t2.contactId) OR 
         (t1.senderId = t2.contactId AND t1.receiverId = ?)) 
        AND t1.timestamp = t2.max_timestamp
      )
      WHERE 
        -- Respect soft delete by checking who sent the last message
        (
          (t1.senderId = ? AND t1.deleted_by_sender = 0) OR 
          (t1.receiverId = ? AND t1.deleted_by_receiver = 0)
        )
    ) m 
    ON a.id = CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END
    WHERE a.id != ?
    ORDER BY m.timestamp DESC;
  `;

  const params = [
    userId, userId, userId,     // For contactId logic
    userId, userId,             // For join with latest messages
    userId, userId,             // For deleted_by_sender/receiver filter
    userId, userId              // For final join and where
  ];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: 'An error occurred while fetching contacts.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No contacts found for the user.' });
    }

    // Convert image blobs to base64
    results.forEach(result => {
      if (result.Image) {
        const imageBase64 = Buffer.from(result.Image, 'binary').toString('base64');
        result.Image = `data:image/jpeg;base64,${imageBase64}`;
      }
    });

    res.status(200).json(results);
  });
}



const getAllMessages=(req,res)=>{
     const userId = req.params.userId;
  const otherUserId = req.params.otherUserId;

  try {
    const query = `
      SELECT * FROM messages 
      WHERE (
        senderId = ? AND receiverId = ? AND deleted_by_sender = 0
      ) 
      OR (
        senderId = ? AND receiverId = ? AND deleted_by_receiver = 0
      )
      ORDER BY timestamp ASC
    `;

    const params = [
      userId, otherUserId, // messages sent by userId, not deleted by sender
      otherUserId, userId  // messages received by userId, not deleted by receiver
    ];

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
}
module.exports={
    createMessagesTable,
    getContact,
    getAllMessages
}