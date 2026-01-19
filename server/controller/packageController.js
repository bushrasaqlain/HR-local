const packageModel = require("../models/packageModel");

const addPackage = (req, res) => {
  packageModel.addPackage(req, res);
};
// Edit existing Package
const editPackage = (req, res) => {
  packageModel.editPackage(req, res);
};
const deletePackage = (req, res) => {
    packageModel.deletePackage(req, res);
}
// Get all cities
const getallPackages = (req, res) => {
  const { page = 1, limit = 15, name = "", search = "", status = "active" } = req.query;

  packageModel.getAllPackages({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};

const getPackagebyCompany = (req, res) => {
let { page, limit, name, search, status } = req.query;

status = status && status.trim() ? status.toLowerCase() : "all";


  packageModel.getPackagebyCompany({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });

    res.status(200).json(data);
  });
};


const getCompanyPackgestatus=(req,res)=>{
  packageModel.getCompanyPackgestatus(req,res);
}
const getPackageDetail=(req,res)=>{
  packageModel.getPackageDetail(req,res);
}

module.exports = {
  addPackage,
  editPackage,
  getallPackages,
  deletePackage,
  getPackagebyCompany,
  getCompanyPackgestatus,
  getPackageDetail,
};