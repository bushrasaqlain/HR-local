const professionModel = require("../models/professionModel")
const addProfession = (req, res) => {
    professionModel.addProfession(req, res);
};
const getAllProfession = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  professionModel.getAllProfession({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};
const editProfession = (req, res) => {
    professionModel.editProfession(req, res);
};
const deleteProfession = (req, res) => {
    professionModel.deleteProfession(req, res);
}
module.exports = {
    addProfession,
    getAllProfession,
    deleteProfession,
    editProfession,
}