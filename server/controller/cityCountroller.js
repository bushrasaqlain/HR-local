const cityModel = require("../models/cityModel");

// Add city (single or CSV)
const addCity = (req, res) => {
    cityModel.addCity(req, res);
};
// Edit existing city
const editCity = (req, res) => {
    cityModel.editCity(req, res);
};
// Get all cities
const getAllCities = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  cityModel.getAllCities({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};


const updateStatus = (req, res) => {
    cityModel.updateStatus(req, res);
}
const getCitiesByDistrict = (req, res) => {
    const { district_id } = req.params; 
    cityModel.getCitiesByDistrict(district_id, req.query, (err, data) => {
      if (err) {
        console.error("❌ Controller Error (getCitiesByDistrict):", err);
        return res.status(500).json({ error: "Database error", details: err.sqlMessage || err.message });
      }
        res.status(200).json(data);
    });
}
module.exports = {
    addCity,
    editCity,
    getAllCities,
    updateStatus,
    getCitiesByDistrict
};