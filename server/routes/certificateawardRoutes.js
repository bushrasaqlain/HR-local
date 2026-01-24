
const express = require("express");
const router = express.Router();
const certificateAwardsController = require("../controller/certificateawardController");


router.get("/certificateAwards/:user_id", certificateAwardsController.getCertificateAwardsByUserId);

router.get("/certificateAwards-get/:id", certificateAwardsController.getCertificateAwardById);

router.post("/certificateAwards", certificateAwardsController.addCertificateAward);

router.put("/certificateAwards/:id", certificateAwardsController.updateCertificateAward);

router.delete("/certificateAwards/delete/:id", certificateAwardsController.deleteCertificateAward);

module.exports = router;

