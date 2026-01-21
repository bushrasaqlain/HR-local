const historyModel=require("../models/historyModel")

const getHistory=(req,res)=>{
    historyModel.getHistory(req,res)
}

const addhistory=(req,res)=>{
    historyModel.addhistory(req,res)
}
module.exports={
    getHistory,
    addhistory
}