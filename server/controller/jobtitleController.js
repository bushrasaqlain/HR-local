const jobtitleModel = require("../models/jobtitleModel");

// Add jobtype (single or CSV)
const addJobTitle = (req, res) => {
    jobtitleModel.addJobTitle(req, res);
};
// Edit existing jobtype
const editJobTitles = (req, res) => {
    jobtitleModel.editJobTitles(req, res);
};
// Get all cities
const getAllJobTitles = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "Active" } = req.query;

  jobtitleModel.getAllJobTitles({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const deleteJobTitles = (req, res) => {
    jobtitleModel.deleteJobTitles(req, res);
}

module.exports = {
    addJobTitle,
    editJobTitles,
    getAllJobTitles,
    deleteJobTitles,
 
};