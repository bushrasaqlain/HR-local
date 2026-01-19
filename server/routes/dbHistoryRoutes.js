const express = require("express");
const router = express.Router();
const connection = require("../connection");
const dbController=require("../controller/dbHistoryController")

router.get('/dbadminhistory', dbController.getdbHistory );


router.post("/dbadminhistory", dbController.insertdbHistory)

module.exports = router;