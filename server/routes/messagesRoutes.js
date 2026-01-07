const express = require("express");
const router = express.Router();
const messageController=require('../controller/messageController')

router.get('/contacts/:userId',messageController.getContact);

router.get('/getAllmessages',messageController.getAllMessages)
module.exports = router;