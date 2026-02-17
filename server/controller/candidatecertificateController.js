const candidatecertificateModel = require("../models/candidatecertificateModel");

// Add country (single or CSV)
const addcandidateCertificate = (req, res) => {
  candidatecertificateModel.addcandidateCertificate(req, res);
};

// Edit existing country
const editcandidateCertificate = (req, res) => {
  candidatecertificateModel.editcandidateCertificate(req, res);
};

// Get all countries
const getcandidateCertificate = (req, res) => {
  candidatecertificateModel.getcandidateCertificate(req, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getcandidateCertificate):", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
        details: err.sqlMessage || err.message
      });
    }

    return res.status(200).json(data);
  });
};

const deletecandidateCertificate = (req, res) => {
 candidatecertificateModel.deletecandidateCertificate(req, res);
}

module.exports = {
  addcandidateCertificate,
  editcandidateCertificate,
  getcandidateCertificate,
  deletecandidateCertificate
};
