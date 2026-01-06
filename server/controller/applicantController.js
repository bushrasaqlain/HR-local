const applicantModel=require("../models/applicantModel")

const getAllApplicants=(req,res)=>{
    applicantModel.getAllApplicants(req,res);
}

const updateShortListedbyId=(req,res)=>{
    applicantModel.updateShortListedbyId(req,res);
}

const updateApproveApplicant=(req,res)=>{
    applicantModel.updateApproveApplicant(req,res);
}

const updateRejectedApplicants=(req,res)=>{
    applicantModel.updateRejectedApplicants(req,res);
}
module.exports={
    getAllApplicants,
    updateShortListedbyId,
    updateApproveApplicant,
    updateRejectedApplicants
}