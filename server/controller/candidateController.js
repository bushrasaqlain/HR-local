
const candidateModel = require("../models/candidateModel");

const addCandidateInfo = (req, res) => {
    candidateModel.addCandidateInfo(req, res);
}

const getAllCandidates=(req,res)=>{
    candidateModel.getAllCandidates(req,res);
}
const updateStatus=(req,res)=>{
     const { id, status } = req.params;
    candidateModel.updateStatus(id,status,res);
}


const getCandidateInfo = (req, res) => {
    candidateModel.getCandidateInfo(req, res);
}
const editCandidateInfo = (req, res) => {
    candidateModel.editCandidateInfo(req, res);
}   
const getCandidateInfobyId = (req, res) => {
    candidateModel.getCandidateInfobyId(req, res);
}
const getCandidateLogobyId= (req, res) => {
    candidateModel.getCandidateLogobyId(req, res);
}
const getCandidateFullProfilebyId= (req, res) => {
    candidateModel.getCandidateFullProfilebyId(req, res);
}   
const getCandidateInfobyAccountType= (req, res) => {
    candidateModel.getCandidateInfobyAccountType(req, res);
}
module.exports = {
    getAllCandidates,
    updateStatus,
  
    addCandidateInfo,
    getCandidateInfo,
    editCandidateInfo,
    getCandidateInfobyId,
    getCandidateLogobyId,
    getCandidateFullProfilebyId,
    getCandidateInfobyAccountType
}