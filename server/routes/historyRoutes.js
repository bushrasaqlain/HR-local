const express = require("express");
const router = express.Router();
const connection = require("../connection");

const historyController=require("../controller/historyController")

router.get('/gethistory/:id/:entity_type', historyController.getHistory);

router.post("/addhistory", historyController.addhistory)

module.exports = router;