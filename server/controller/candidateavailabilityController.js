const candidateAvailabilityModel = require("../models/candidateAvailabilityModel");

// Add availability
const addavailability = (req, res) => {
  candidateAvailabilityModel.addavailability(req, res);
};

// Get availability
const getAvailability = (req, res) => {
  candidateAvailabilityModel.getAvailability(req, res);
};

// Update availability
const updateAvailability = (req, res) => {
  candidateAvailabilityModel.updateAvailability(req, res);
};

module.exports = {
  addavailability,
  getAvailability,
  updateAvailability,
};
