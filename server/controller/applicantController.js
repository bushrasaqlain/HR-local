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



module.exports={
    getAllApplicants,
    updateApplcantStatus,
    applyJob,
}