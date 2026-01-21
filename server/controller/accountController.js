
const accountModel = require("../models/accountModel");


const getAccountDetail = async (req, res) => {
  try {
    const data = await accountModel.getAccountDetail(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const getAccountType = (req, res) => {
  accountModel.getAccountType(req, res);
}

const register = (req, res) => {
    accountModel.register(req, res);    
};
const login = (req, res) => {
    accountModel.login(req, res);    
};

const changePassword = (req, res) => {
    accountModel.changePassword(req, res);
}

module.exports = {
    getAccountDetail,
    getAccountType,
    register,
    login,
    changePassword
};

