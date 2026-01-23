const candidateeducationModel = require("../models/candidateeducationModel");

// Add country (single or CSV)
const addcandidateeducation = (req, res) => {
  candidateeducationModel.addcandidateeducation(req, res);
};

// Edit existing country
const editcandidateeducation = (req, res) => {
  candidateeducationModel.editcandidateeducation(req, res);
};

// Get all countries
const getallcandidateeducation = (req, res) => {
  candidateeducationModel.getallcandidateeducation(req, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getallcandidateeducation):", err);
      return res.status(500).json({
        error: "Database error",
        details: err.sqlMessage || err.message
      });
    }

    return res.status(200).json(data);
  });
};

const deletecandidateeducation = (req, res) => {
 candidateeducationModel.deletecandidateeducation(req, res);
}

module.exports = {
  addcandidateeducation,
  editcandidateeducation,
  getallcandidateeducation,
  deletecandidateeducation
};
