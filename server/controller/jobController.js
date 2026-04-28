
const jobModel = require("../models/jobModel");

const getJobbyRegAdmin = (req, res) => {
  jobModel.getJobbyRegAdmin(req, res);
}
const updateJobPostStatus = (req, res) => {
  jobModel.updateJobPostStatus(req, res);
}

const getAllJobs = (req, res) => {
  jobModel.getAllJobs(req, res);
}
const deleteJob = (req, res) => {
  jobModel.deleteJob(req, res)
}
const getSingleJob = (req, res) => {
  jobModel.getSingleJob(req, res);
}

const postJob = (req, res) => {
  jobModel.postJob(req, res);
}
const updatePostJob = (req, res) => {
  jobModel.updatePostJob(req, res)
}

const subcribePackage = (req, res) => {
  jobModel.subcribePackage(req, res);
}
const getUserPackages = (req, res) => {
  jobModel.getUserPackages(req, res);
}
const getTransactionHistory = (req, res) => {
  jobModel.getTransactionHistory(req, res);
}
const getJobTitle=(req,res)=>{
  jobModel
  .getJobTitle(req,res);
}
const getTopCompanies = (req, res) => {
  jobModel.getTopCompanies(req, res)
}

const popularCategories=(req,res)=>{
  jobModel.popularCategory(req,res)
}


const getTotalJobPosts = async (req, res) => {
  try {
    const accountId = req.params.userId;
    const { type, value } = req.query;

    const result = await jobModel.getTotalJobPosts(
      accountId,
      type,
      parseInt(value)
    );

    const labels = result.map(i => i.label);
    const data = result.map(i => i.total);

    res.status(200).json({ labels, data });
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: "SERVER_ERROR" ,});
  }
};
const subcribePackageInternal = async (accountId, packageId) => {
  try {
    const result = await jobModel.subcribePackageInternal(accountId, packageId); 
    return result;
  } catch (err) {
    console.error(err);
    throw new Error("Subscription failed");
  }
};

module.exports = {
  getJobbyRegAdmin,
  updateJobPostStatus,
  getAllJobs,
  getSingleJob,
  deleteJob,
  postJob,
  subcribePackage,
  updatePostJob,
  getJobTitle,
  getTopCompanies,
  popularCategories,
  getTotalJobPosts,
  getUserPackages,
  getTransactionHistory,
  subcribePackageInternal
}