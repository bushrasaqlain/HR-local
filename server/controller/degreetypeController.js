const degreeTypeModel = require("../models/degreetypeModel");

// Add Degree Type
const addDegreeType = (req, res) => {
  degreeTypeModel.addDegreeType(req, res);
};
// Edit Degree Type
const editDegreeType = (req, res) => { 
    degreeTypeModel.editDegreeType(req, res);
};
// Get All Degree Types
const getAllDegreeTypes = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  degreeTypeModel.getAllDegreeTypes({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};

// Delete Degree Type
const deleteDegreeType = (req, res) => {
  degreeTypeModel.deleteDegreeType(req, res);
};  
module.exports = {
  addDegreeType,
  editDegreeType,
  getAllDegreeTypes,
  deleteDegreeType
};