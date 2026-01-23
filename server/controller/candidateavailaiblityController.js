const candidateAvailabilityModel = require("../models/candidateAvailabilityModel");

const addAvailaibility = (req, res) => {
    candidateAvailabilityModel.addAvailaibility(req, res);
}

module.exports = {
    addAvailaibility
}