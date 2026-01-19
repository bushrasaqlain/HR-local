const currencyModel = require("../models/currencyModel")
const addCurrency = (req, res) => {
    currencyModel.addCurrency(req, res);
};
const getAllCurrency = (req, res) => {
  const { page = 1, limit = 15, name = "code", search = "", status = "active" } = req.query;

  currencyModel.getAllCurrency({ page, limit, name, search, status }, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    res.status(200).json(data);
  });
};
const editCurrency = (req, res) => {
    currencyModel.editCurrency(req, res);
};
const deleteCurrency = (req, res) => {
    currencyModel.deleteCurrency(req, res);
}

const getAllCurrenciesinPayment=(req,res)=>{
    currencyModel.getAllCurrenciesinPayment(req,res)
}
module.exports = {
    addCurrency,
    getAllCurrency,
    deleteCurrency,
    editCurrency,
    getAllCurrenciesinPayment
}