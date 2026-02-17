const resumeModel = require("../models/resumeModel");

/**
 * Add resume
 */
const addResume = (req, res) => {
  resumeModel.addResume(req, res);
};

/**
 * Update resume
 */
const updateResume = (req, res) => {
  resumeModel.updateResume(req, res);
};

/**
 * Get resume
 */
const getResume = (req, res) => {
  resumeModel.getResume(req, res);
};

module.exports = {
  addResume,
  updateResume,
  getResume,
};
