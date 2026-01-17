

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
    messageModel.sendMesage(req,res)
}

const markasRead=(rq,res)=>{
    messageModel.markasRead(req,res)
}

const unreadMessage=(req,res)=>{
    messageModel.unreadMessage(req,res)
}

const unreadCount=(res,req)=>{
    messageModel.unreadCount(req,res)
}
module.exports={
    getContact,
    getAllMessages,
    deleteMessage,
    sendMessage,
    markasRead,
    unreadMessage,
    unreadCount
}