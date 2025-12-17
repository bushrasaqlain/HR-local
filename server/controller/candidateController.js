
const candidateModel = require("../models/candidateModel");

const addAvailaibility = (req, res) => {
    candidateModel.addAvailaibility(req, res);
}
const addCandidateInfo = (req, res) => {
    candidateModel.addCandidateInfo(req, res);
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
    addAvailaibility,
    addCandidateInfo,
    getCandidateInfo,
    editCandidateInfo,
    getCandidateInfobyId,
    getCandidateLogobyId,
    getCandidateFullProfilebyId,
    getCandidateInfobyAccountType
}