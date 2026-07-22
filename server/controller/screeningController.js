
const screeningModel = require("../models/screeningModel");

const addScreeningQuestions = (req, res) => {
    screeningModel.addScreeningQuestions(req, res);
}

const getScreeningQuestions = (req, res) => {
    screeningModel.getScreeningQuestions(req, res);
}

const deleteScreeningQuestion = (req, res) => {
    screeningModel.deleteScreeningQuestion(req, res);
}

const getApplicationAnswers = (req, res) => {
    screeningModel.getApplicationAnswers(req, res);
}

module.exports = {
    addScreeningQuestions,
    getScreeningQuestions,
    deleteScreeningQuestion,
    getApplicationAnswers
}