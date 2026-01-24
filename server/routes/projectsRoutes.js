
const express = require("express");
const router = express.Router();
const projectsController = require("../controller/projectsController");

router.get("/projects/:user_id", projectsController.getProjectsByUserId);

router.get("/project-get/:id", projectsController.getProjectById);

router.post("/projects", projectsController.addProject);

router.put("/projects/:id", projectsController.updateProject);

router.delete("/projects/delete/:id", projectsController.deleteProject);

module.exports = router;

