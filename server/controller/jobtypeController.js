const jobtypeModel = require("../models/jobtypeModel");

// Add jobtype (single or CSV)
const addjobtype = (req, res) => {
    jobtypeModel.addJobType(req, res);
};
// Edit existing jobtype
const editjobtype = (req, res) => {
    jobtypeModel.editJobType(req, res);
};
// Get all cities
const getalljobtypes = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  jobtypeModel.getAllJobTypes({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const deletejobtype = (req, res) => {
    jobtypeModel.deleteJobType(req, res);
}

module.exports = {
    addjobtype,
    editjobtype,
    getalljobtypes,
    deletejobtype,
 
};