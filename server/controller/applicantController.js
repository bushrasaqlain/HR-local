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
const getApplicationStats=(req,res)=>{
  applicantModel.getApplicationStats(req,res);
}
const cancelApplication=(req,res)=>{
  applicantModel.cancelApplication(req,res);
}

const getDashboardData=(req,res)=>{
  applicantModel.getDashboardData(req,res);
}


module.exports={
  unlockCandidate,
    getAllApplicants,
    updateApplcantStatus,
    applyJob,
    getAppliedJobs,
    getApplicationStats,
    cancelApplication,
    getDashboardData,
}