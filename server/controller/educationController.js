const EducationModel = require("../models/educationModel");

const getEducationByUserId = (req, res) => {
  const { user_id } = req.params;

  EducationModel.getEducationByUserId({ user_id }, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({
        error: "Error fetching data",
        details: err.message,
      });
    }

    res.status(200).json(results);
  });
};

const getEducationById = (req, res) => {
  const { id } = req.params;

  EducationModel.getEducationById({ id }, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({
        error: "Error fetching data",
        details: err.message,
      });
    }

    res.status(200).json(results);
  });
};

const addEducation = (req, res) => {
  const { user_id, degreeTitle, fieldOfStudy, instituteName, startDate, endDate, educationDescription } = req.body;

  EducationModel.addEducation(
    { user_id, degreeTitle, instituteName, startDate, endDate, educationDescription },
    (err, result) => {
      if (err) {
        console.error("Error adding education record:", err.message);
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).json(result);
    }
  );
};

const updateEducation = (req, res) => {
  const { id } = req.params;
  const { degreeTitle, fieldOfStudy, instituteName, startDate, endDate, educationDescription } = req.body;

  EducationModel.updateEducation(
    { id, degreeTitle, instituteName, startDate, endDate, educationDescription },
    (err, result) => {
      if (err) {
        console.error("Error updating education record:", err.message);
        
        if (err.status === 404) {
          return res.status(404).send({ msg: err.message });
        }
        
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).json(result);
    }
  );
};

const deleteEducation = (req, res) => {
  const { id } = req.params;

  EducationModel.deleteEducation({ id }, (err, result) => {
    if (err) {
      console.error("Error deleting education record:", err.message);
      return res.status(500).send({ msg: "SERVER_ERROR" });
    }

    res.status(200).send(result);
  });
};

module.exports = {
  getEducationByUserId,
  getEducationById,
  addEducation,
  updateEducation,
  deleteEducation,
};