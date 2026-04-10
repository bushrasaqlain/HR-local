const paymentModel = require("../models/paymentModel");

const addPayment = (req, res) => {
  paymentModel.addPayment(req, res);
};

const addRegistrationPayment = (req, res) => {
  paymentModel.addRegistrationPayment(req, res);
}

module.exports={
    addPayment,
    addRegistrationPayment,
}