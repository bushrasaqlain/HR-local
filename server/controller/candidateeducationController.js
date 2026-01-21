const countryModel = require("../models/countryModel");

// Add country (single or CSV)
const addcandidateeducation = (req, res) => {
  countryModel.addcandidateeducation(req, res);
};

// Edit existing country
const editcandidateeducation = (req, res) => {
  countryModel.editcandidateeducation(req, res);
};

// Get all countries
const getallcandidateeducation = (req, res) => {
  countryModel.getallcandidateeducation(req.query, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getallcandidateeducation):", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage || err.message });
    }

    res.status(200).json(data);
  });
};

const deletecandidateeducation = (req, res) => {
 countryModel.deletecandidateeducation(req, res);
}

module.exports = {
  addcandidateeducation,
  editcandidateeducation,
  getallcandidateeducation,
  deletecandidateeducation
};
