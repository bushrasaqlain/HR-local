const contactModel = require("../models/contactModel");

const sendContactMessage = (req, res) => {
  contactModel.sendContactMessage(req, res);
};

const getAllMessages = (req, res) => {
  contactModel.getAllMessages(req, res);
};

const updateMessageStatus = (req, res) => {
  contactModel.updateMessageStatus(req, res);
};

const replyToMessage = (req, res) => {
  contactModel.replyToMessage(req, res);
};

module.exports = {
  sendContactMessage,
  getAllMessages,
  updateMessageStatus,
  replyToMessage,
};
