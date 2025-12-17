const skillsModel = require("../models/skillsModel");

// Add skill (single or CSV)
const addSkill = (req, res) => {
  skillsModel.addSkill(req, res);
};

// Edit existing skill
const editSkill = (req, res) => {
    skillsModel.editSkill(req, res);
};

// get all skills
const getAllSkills = (req, res) => {
    skillsModel.getAllSkills(req.query, (err, data) => {
        if(err) {
            console.error("controller error (get all skills:", err);
            return res.status(500).json({error: "Database error", details: err.sqlMessage || err.message});
        }

        res.status(200).json(data);
    });
}

const deleteSkill = (req, res) => {
 skillsModel.deleteSkill(req, res);
}

module.exports = {
    addSkill,
    editSkill,
    getAllSkills,
    deleteSkill
};
