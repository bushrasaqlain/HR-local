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

module.exports = {
  sendContactMessage,
  getAllMessages,
  updateMessageStatus,
};
