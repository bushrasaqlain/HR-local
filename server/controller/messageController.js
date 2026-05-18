

const messageModel = require("../models/messageModel");

const getContact=(req,res)=>{
    messageModel.getContact(req,res);
}

const getAllMessages=(req,res)=>{
 
    messageModel.getAllMessages(req,res)
}

const deleteMessage=(req,res)=>{
    messageModel.deleteMessage(req,res)
}

const sendMessage=(req,res)=>{
    messageModel.sendMessage(req,res)
}

const markasRead=(req,res)=>{
    messageModel.markasRead(req,res)
}

const unreadMessage=(req,res)=>{
    messageModel.unreadMessage(req,res)
}

const unreadCount=(req,res)=>{
    messageModel.unreadCount(req,res)
}

const getUnreadCountPerContact = (req, res) => {
    messageModel.getUnreadCountPerContact(req, res);
}
module.exports={
    getContact,
    getAllMessages,
    deleteMessage,
    sendMessage,
    markasRead,
    unreadMessage,
    unreadCount,
    getUnreadCountPerContact
}