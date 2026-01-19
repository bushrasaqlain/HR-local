const instituteModel = require("../models/instituteModel");

const getAllInstitute = (req, res) => {
  const {
    page = 1,
    limit = 15,
    name = "name",
    search = "",
    status = "Active",
  } = req.query;

  instituteModel.getAllInstitute(
    { page, limit, name, search, status },
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
};

const addInstitute = (req, res) => {
  const { name, type, data,userId } = req.body;

  instituteModel.addInstitute(
    { name, type, data, userId },
    (err, result) => {
      if (err) {
        return res.status(err.status || 500).json({ error: err.message });
      }
      res.status(201).json(result);
    }
  );
};

const editInstitute = (req, res) => {
    instituteModel.editInstitute(req, res);
};

const updateStatus= (req, res) => {
    instituteModel.updateStatus(req, res);
}

module.exports = {
    addInstitute,
    editInstitute,
    getAllInstitute,
    updateStatus,
    
};