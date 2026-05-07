const creditModel = require("../models/creditModel");
 
const getEmployerCreditBalance = (req, res) => {
  creditModel.getEmployerCreditBalance(req, res);
};
 
const unlockCandidateProfile = (req, res) => {
  creditModel.unlockCandidateProfile(req, res);
};
 
const getUnlockedCandidateData = (req, res) => {
  creditModel.getUnlockedCandidateData(req, res);
};
 
const getUnlockedCandidatesList = (req, res) => {
  creditModel.getUnlockedCandidatesList(req, res);
};
 
module.exports = {
  getEmployerCreditBalance,
  unlockCandidateProfile,
  getUnlockedCandidateData,
  getUnlockedCandidatesList,
};