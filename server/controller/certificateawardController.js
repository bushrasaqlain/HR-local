const CertificateAwardsModel = require("../models/certificateawardModel");

// Get all certificate awards by user_id
const getCertificateAwardsByUserId = (req, res) => {
  const { user_id } = req.params;

  CertificateAwardsModel.getCertificateAwardsByUserId({ user_id }, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({
        error: "Error fetching data",
        details: err.message,
      });
    }

    res.status(200).json(results);
  });
};

// Get certificate award by id
const getCertificateAwardById = (req, res) => {
  const { id } = req.params;

  CertificateAwardsModel.getCertificateAwardById({ id }, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({
        error: "Error fetching data",
        details: err.message,
      });
    }

    res.status(200).json(results);
  });
};

// Add new certificate award
const addCertificateAward = (req, res) => {
  const { user_id, title, instituteName, passingYear, description } = req.body;

  CertificateAwardsModel.addCertificateAward(
    { user_id, title, instituteName, passingYear, description },
    (err, result) => {
      if (err) {
        console.error("Error adding certificateAwards record:", err.message);
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).send(result);
    }
  );
};

// Update certificate award by id
const updateCertificateAward = (req, res) => {
  const { id } = req.params;
  const { title, instituteName, passingYear, description } = req.body;

  CertificateAwardsModel.updateCertificateAward(
    { id, title, instituteName, passingYear, description },
    (err, result) => {
      if (err) {
        console.error("Error updating certificateAwards record:", err.message);
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).send(result);
    }
  );
};

// Delete certificate award by id
const deleteCertificateAward = (req, res) => {
  const { id } = req.params;

  CertificateAwardsModel.deleteCertificateAward({ id }, (err, result) => {
    if (err) {
      console.error("Error deleting certificateAwards record:", err.message);
      return res.status(500).send({ msg: "SERVER_ERROR" });
    }

    res.status(200).send(result);
  });
};

module.exports = {
  getCertificateAwardsByUserId,
  getCertificateAwardById,
  addCertificateAward,
  updateCertificateAward,
  deleteCertificateAward,
};