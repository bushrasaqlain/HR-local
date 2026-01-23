const candidateExperienceModel = require("../models/candidateexperienceModel");

// Add country (single or CSV)
const addcandidateExperience = (req, res) => {
  candidateExperienceModel.addcandidateExperience(req, res);
};

// Edit existing country
const editcandidateeducation = (req, res) => {
  candidateExperienceModel.updatecandidateExperience(req, res);
};

// Get all countries
const getcandidateExperience = (req, res) => {
  candidateExperienceModel.getcandidateExperience(req, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getcandidateExperience):", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
        details: err.sqlMessage || err.message
      });
    }

    return res.status(200).json(data);
  });
};

const deletecandidateExperience = (req, res) => {
 candidateExperienceModel.deletecandidateExperience(req, res);
}

module.exports = {
  addcandidateExperience,
  editcandidateeducation,
  getcandidateExperience,
  deletecandidateExperience
};
