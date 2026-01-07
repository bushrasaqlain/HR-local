

const messageModel = require("../models/messageModel");

const getContact=(req,res)=>{
    messageModel.getContact(req,res);
}

const getAllMessages=(req,res)=>{
    messageModel.getAllMessages(req,res)
}
module.exports={
    getContact,

    getAllMessages
}