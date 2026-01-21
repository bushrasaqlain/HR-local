const BankModel = require("../models/bankModel");

const getAllBank = (req, res) => {
  const {
    page = 1,
    limit = 15,
    name = "name",
    search = "",
    status = "active",
  } = req.query;

  BankModel.getAllBank(
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

const addBank = (req, res) => {
  const { name, type, data,userId } = req.body;

  BankModel.addBank(
    { name, type, data, userId },
    (err, result) => {
      if (err) {
        return res.status(err.status || 500).json({ error: err.message });
      }
      res.status(201).json(result);
    }
  );
};

const editBank = (req, res) => {
    BankModel.editBank(req, res);
};

const updateStatus = (req, res) => {
    BankModel.updateStatus(req, res);
}

module.exports = {
    addBank,
    editBank,
    getAllBank,
    updateStatus,
    
};