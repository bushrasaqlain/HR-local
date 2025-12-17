const packageModel = require("../models/packageModel");

const addPackage = (req, res) => {
    packageModel.addPackage(req, res);
};
// Edit existing Package
const editPackage = (req, res) => {
    packageModel.editPackage(req, res);
};
// Get all cities
const getallPackages = (req, res) => {
  const { page = 1, limit = 15, name = "", search = "", status = "active" } = req.query;

  packageModel.getAllPackages({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const deletePackage = (req, res) => {
    packageModel.deletePackage(req, res);
}

module.exports = {
    addPackage,
    editPackage,
    getallPackages,
    deletePackage,
 
};