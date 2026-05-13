const applicantModel=require("../models/applicantModel")

const getAllApplicants=(req,res)=>{
    applicantModel.getAllApplicants(req,res);
}

const updateApplcantStatus=(req,res)=>{
    applicantModel.updateApplcantStatus(req,res);
}
const applyJob = (req, res) => {
  applicantModel.applyJob(req, res);
};
const getAppliedJobs = (req, res) => {
  applicantModel.getAppliedJobs(req, res);
};
const unlockCandidate=(req,res)=>{
    applicantModel.unlockCandidate(req,res);
}
module.exports={
  unlockCandidate,
    getAllApplicants,
    updateApplcantStatus,
    applyJob,
    getAppliedJobs,
}