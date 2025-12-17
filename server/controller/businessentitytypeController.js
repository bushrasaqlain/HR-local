const businessentitytypeModel = require("../models/businessentitytypeModel");

// Add businessentitytype (single or CSV)
const addbusinessentitytype = (req, res) => {
    businessentitytypeModel.addBusinessEntityType(req, res);
};
// Edit existing businessentitytype
const editbusinessentitytype = (req, res) => {
    businessentitytypeModel.editbusinessentitytype(req, res);
};
// Get all cities
const getAllbusinessentitytype = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  businessentitytypeModel.getAllbusinessentitytype({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const deletebusinessentitytype = (req, res) => {
    businessentitytypeModel.deletebusinessentitytype(req, res);
}

module.exports = {
    addbusinessentitytype,
    editbusinessentitytype,
    getAllbusinessentitytype,
    deletebusinessentitytype,

};