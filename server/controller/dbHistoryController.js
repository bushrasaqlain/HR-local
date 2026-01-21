const dbHistoryModel = require("../models/dbHistoryModel");

const getdbHistory = (req, res) => {
  dbHistoryModel.getdbHistory(req, res);
};
const insertdbHistory = (req, res) => {
  dbHistoryModel.insertdbHistory(req, res);
};

module.exports = {
  getdbHistory,
  insertdbHistory,
};