
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const resumeController=require("../controller/resumeController")
// const pdfParse = require("pdf-parse");
// const mammoth = require("mammoth");


// const fs = require("fs");
// const PdfPrinter = require("pdfmake");
// const crypto = require("crypto");
// const { default: axios } = require("axios");


// Configure multer to handle file uploads
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post("/addresume", upload.single("resume"),authMiddleware,resumeController.addResume )

module.exports = router;
  