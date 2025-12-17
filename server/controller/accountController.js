
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
const getUserName = (req, res) => {
  accountModel.getUserName(req, res);
}
const register = (req, res) => {
    accountModel.register(req, res);    
};
const login = (req, res) => {
    accountModel.login(req, res);    
};
const adminLogin = (req, res) => {
    accountModel.adminLogin(req, res);    
}
const updateAccountStatus = (req, res) => {
    accountModel.updateAccountStatus(req, res);
}
const getDetailByName = (req, res) => {
    accountModel.getDetailByName(req, res);
};

const getDetailByEmail = async (req, res) => {
  try {
    const data = await accountModel.getDetailByEmail(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.error,
      details: err.details,
    });
  }
};

const changePassword = (req, res) => {
    accountModel.changePassword(req, res);
}

module.exports = {
    getAccountDetail,
    getAccountType,
    getUserName,
    register,
    login,
    adminLogin,
    updateAccountStatus,
    getDetailByName,
    getDetailByEmail,
    changePassword
};

