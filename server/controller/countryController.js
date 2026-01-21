const countryModel = require("../models/countryModel");

// Add country (single or CSV)
const addCountry = (req, res) => {
  countryModel.addCountry(req, res);
};

// Edit existing country
const editCountry = (req, res) => {
  countryModel.editCountry(req, res);
};

// Get all countries
const getAllCountries = (req, res) => {
  countryModel.getAllCountries(req.query, (err, data) => {
    if (err) {
      console.error("❌ Controller Error (getAllCountries):", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage || err.message });
    }

    res.status(200).json(data);
  });
};

const updateStatus = (req, res) => {
  countryModel.updateStatus(req, res);
}

module.exports = {
  addCountry,
  editCountry,
  getAllCountries,
  updateStatus
};
