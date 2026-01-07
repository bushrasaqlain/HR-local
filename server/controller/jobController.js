
const jobModel = require("../models/jobModel");

const getAllJobs=(req,res)=>{
  jobModel.getAllJobs(req,res);
}
const deleteJob=(req,res)=>{
  jobModel.deleteJob(req,res)
}
const getSingleJob=(req,res)=>{
    jobModel.getSingleJob(req,res);
}

const postJob=(req,res)=>{
  jobModel.postJob(req,res);
}
const subcribePackage=(req,res)=>{
  jobModel.subcribePackage(req,res);
}

const getJobPostCount=(req,res)=>{
  jobModel.getJobPostCount(req,res);
}


module.exports={
  
    getAllJobs,
    getSingleJob,
    deleteJob,
    postJob,
    subcribePackage,
    getJobPostCount
}