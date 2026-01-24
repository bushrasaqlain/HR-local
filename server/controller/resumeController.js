const resumeModel=require("../models/resumeModel")

const addResume = (req, res) => {
  resumeModel.addResume(req, res);
};

const getResume = (req, res) => {
  resumeModel.getResume(req, res);
};

module.exports={
    addResume,
    getResume
}