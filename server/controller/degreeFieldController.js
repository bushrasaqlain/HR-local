const degreeFieldModel = require("../models/degreeFieldModel");


const addDegreeField = (req, res) => {
    const degreeFieldData = req.body;
    degreeFieldModel.addDegreeField(degreeFieldData, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: "Degree Field added successfully" });
    });
}

const editDegreeField = (req, res) => {
    const { id } = req.params;
    const degreeFieldData = req.body;
    degreeFieldModel.editDegreeField(id, degreeFieldData, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: "Degree Field updated successfully" });
    });
}
const getAllDegreeFields = (req, res) => {
  const {
    page = 1,
    limit = 15,
    name = "name",
    search = "",
    status = "active",
  } = req.query;
    degreeFieldModel.getAllDegreeFields ({ page, limit, name, search, status },
    (err, data) => {
      if (err) {
        return res.status(500).json({
          error: "Database error",
          details: err.sqlMessage || err.message,
        });
      }
      res.status(200).json(data);
    }
  );
}
const deleteDegreeField = (req, res) => {
    const { id } = req.params;
    degreeFieldModel.deleteDegreeField(id, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({ success: true, message: "Degree Field deleted successfully" });
    });
}
module.exports = {
    addDegreeField,
    editDegreeField,
    getAllDegreeFields,
    deleteDegreeField
};  