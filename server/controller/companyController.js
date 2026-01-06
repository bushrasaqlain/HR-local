const companyModel = require("../models/companyModel");

const getAllCompanies = (req, res) => {
  companyModel.getAllCompanies(req, res);
};
const updateCompanyinfo = (req, res) => {
  companyModel.updateCompanyinfo(req, res);
};
const getcompanybyid = (req, res) => {
  companyModel.getcompanybyid(req, res);
}
const updateCompanySatus = (req,res)=>{
    const { id, status } = req.params; // must match router param names
    companyModel.updateCompanySatus(id, status, res)
}



module.exports = {
  getAllCompanies,
  updateCompanyinfo,
  getcompanybyid,
  updateCompanySatus,
 
};