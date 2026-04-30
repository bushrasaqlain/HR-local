const industryModel = require("../models/industryModel");

// Add industry (single or CSV)
const addindustry = (req, res) => {
    industryModel.addindustry(req, res);
};
// Edit existing industry
const editindustry = (req, res) => {
    industryModel.editindustry(req, res);
};
// Get all industry
const getallindustry = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "Active" } = req.query;

  industryModel.getallindustry({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const deleteindustry = (req, res) => {
    industryModel.deleteindustry(req, res);
}

module.exports = {
    addindustry,
    editindustry,
    getallindustry,
    deleteindustry,
 
};