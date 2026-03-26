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
const getcompanyviaids = (req, res) => {
  companyModel.getcompanyviaids(req, res);
}
const updateCompanySatus = (req, res) => {
  const { id, status, userId } = req.params; // must match router param names
  companyModel.updateCompanySatus(id, status, userId, res)
}
const getCount = (req, res) => {
  companyModel.getCount(req, res)
}

const getTopCompanies = (req, res) => {
  companyModel.getTopCompanies(req, res);
};

const getAllCompaniesList = (req, res) => {
  companyModel.getAllCompaniesList(req, res);
};



module.exports = {
  getAllCompanies,
  updateCompanyinfo,
  getcompanybyid,
  getcompanyviaids,
  updateCompanySatus,
  getCount,
  getTopCompanies,
  getAllCompaniesList
};