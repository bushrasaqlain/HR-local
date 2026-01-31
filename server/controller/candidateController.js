
const candidateModel = require("../models/candidateModel");


const addCandidateInfo = (req, res) => {
    const passportPhotoFile = req.files?.passport_photo?.[0];
const resumeFile = req.files?.resume?.[0];


// Optional: attach paths so model can use them
req.passportPhotoPath = passportPhotoFile ? passportPhotoFile.path : null;
req.resumePath = resumeFile ? resumeFile.path : null;
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
    const passportPhotoFile = req.files?.passport_photo?.[0];
const resumeFile = req.files?.resume?.[0];


req.passportPhotoPath = passportPhotoFile ? passportPhotoFile.path : null;
req.resumePath = resumeFile ? resumeFile.path : null;
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
const addResume = (req, res) => {
  const resumeFile = req.file;
  if (!resumeFile) {
    return res.status(400).json({ msg: "File is missing" });
  }

  // attach path to request for the model
  req.resumePath = `/uploads/resume/${resumeFile.filename}`;
  const userId = req.user.userId;
  candidateModel.addResume(userId, req.resumePath, res);
};
module.exports = {
    getAllCandidates,
    updateStatus,
  
    addCandidateInfo,
    getCandidateInfo,
    editCandidateInfo,
    getCandidateInfobyId,
    getCandidateLogobyId,
    getCandidateFullProfilebyId,
    getCandidateInfobyAccountType,
    addResume
}