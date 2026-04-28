const paymentModel = require("../models/paymentModel");

const addPayment = (req, res) => {
  paymentModel.addPayment(req, res);
};

const addRegistrationPayment = (req, res) => {
  paymentModel.addRegistrationPayment(req, res);
}
const getSavedCards = (req, res) => {
  paymentModel.getSavedCards(req, res);
}
module.exports={
    addPayment,
    addRegistrationPayment,
    getSavedCards
}