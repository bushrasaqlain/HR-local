const express = require("express");
const router = express.Router();
const messageController=require('../controller/messageController')

// Endpoint to get unread count for contacts
router.get('/contacts/unread-count/:userId', messageController.unreadCount);

router.get('/contacts/:userId',messageController.getContact);

router.get('/getAllmessages/:userId/:otherUserId', messageController.getAllMessages);

router.post('/delete-conversation', messageController.deleteMessage);

router.post('/sendmessage', messageController.sendMessage);

router.post('/mark-as-read',messageController.markasRead);

router.get('/unread-senders/:userId', messageController.unreadMessage);

router.get('/unread-per-contact/:userId', messageController.getUnreadCountPerContact);

module.exports = router;