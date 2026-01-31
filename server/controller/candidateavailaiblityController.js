// controllers/candidateAvailabilityController.js
const candidateAvailabilityModel = require("../models/candidateAvailabilityModel");

const addavailability = (req, res) => {
  candidateAvailabilityModel.addavailability(req, res);
};

module.exports = {
  addavailability,
};