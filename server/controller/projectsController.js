const ProjectsModel = require("../models/projectsModel");


const getProjectsByUserId = (req, res) => {
  const { user_id } = req.params;

  ProjectsModel.getProjectsByUserId({ user_id }, (err, results) => {
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


const getProjectById = (req, res) => {
  const { id } = req.params;

  ProjectsModel.getProjectById({ id }, (err, results) => {
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


const addProject = (req, res) => {
  const { user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink } = req.body;

  ProjectsModel.addProject(
    { user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink },
    (err, result) => {
      if (err) {
        console.error("Error adding projects record:", err.message);
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).send(result);
    }
  );
};


const updateProject = (req, res) => {
  const { id } = req.params;
  const { ProjectTitle, role, projectDescription, skillsUsed, projectLink } = req.body;

  ProjectsModel.updateProject(
    { id, ProjectTitle, role, projectDescription, skillsUsed, projectLink },
    (err, result) => {
      if (err) {
        console.error("Error updating project record:", err.message);
        return res.status(500).send({ msg: "SERVER_ERROR" });
      }

      res.status(200).send(result);
    }
  );
};


const deleteProject = (req, res) => {
  const { id } = req.params;

  ProjectsModel.deleteProject({ id }, (err, result) => {
    if (err) {
      console.error("Error deleting projects record:", err.message);
      return res.status(500).send({ msg: "SERVER_ERROR" });
    }

    res.status(200).send(result);
  });
};

module.exports = {
  getProjectsByUserId,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
};

