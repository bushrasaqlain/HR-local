const candidateresearchModel = require("../models/candidateresearchModel");

// Add country (single or CSV)
const addcandidateResearch = (req, res) => {
  candidateresearchModel.addcandidateResearch(req, res);
};

// Edit existing country
const editcandidateResearch = (req, res) => {
  candidateresearchModel.editcandidateResearch(req, res);
};

// Get all countries
const getcandidateResearch = (req, res) => {
  candidateresearchModel.getcandidateResearch(req, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getcandidateResearch):", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
        details: err.sqlMessage || err.message
      });
    }

    return res.status(200).json(data);
  });
};

const deletecandidateResearch = (req, res) => {
 candidateresearchModel.deletecandidateResearch(req, res);
}

module.exports = {
  addcandidateResearch,
  editcandidateResearch,
  getcandidateResearch,
  deletecandidateResearch
};
