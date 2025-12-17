const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const packageController = require("../controller/packageController");


router.get("/getallpackages", packageController.getallPackages);


router.post("/", authMiddleware, checkRole("db_admin"),packageController.addPackage);

router.put("/:id", authMiddleware, checkRole("db_admin"),packageController.editPackage);

router.delete("/deletepackage/:id", authMiddleware, checkRole("db_admin"),packageController.deletePackage);



module.exports = router;
