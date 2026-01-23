const resumeModel=require("../models/resumeModel")

const addResume = (req, res) => {
  resumeModel.addResume(req, res);
};

module.exports={
    addResume
}