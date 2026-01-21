const specialityModel = require("../models/specialityModel")
const addSpeciality = (req, res) => {
    specialityModel.addSpeciality(req, res);
};
const getAllSpeciality = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "active" } = req.query;

  specialityModel.getAllSpeciality({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};
const editSpeciality = (req, res) => {
    specialityModel.editSpeciality(req, res);
};
const updateStatus = (req, res) => {
    specialityModel.updateStatus(req, res);
}
module.exports = {
    addSpeciality,
    getAllSpeciality,
    updateStatus,
    editSpeciality,
}