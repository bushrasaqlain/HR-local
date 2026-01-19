const paymentModel = require("../models/paymentModel");

const addPayment = (req, res) => {
  paymentModel.addPayment(req, res);
};

module.exports={
    addPayment
}