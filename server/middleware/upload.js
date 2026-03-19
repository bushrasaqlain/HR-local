// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ---------------- Passport Photos ----------------
const passportUploadDir = path.join(__dirname, "../uploads/passportPhotos");
if (!fs.existsSync(passportUploadDir)) fs.mkdirSync(passportUploadDir, { recursive: true });

const passportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, passportUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadPassportPhoto = multer({ 
  storage: passportStorage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ---------------- Resumes ----------------
const resumeUploadDir = path.join(__dirname, "../uploads/resume");
if (!fs.existsSync(resumeUploadDir)) fs.mkdirSync(resumeUploadDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumeUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadResume = multer({ 
  storage: resumeStorage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});


// ---------------- Research Documents ----------------
const researchUploadDir = path.join(__dirname, "../uploads/research");
if (!fs.existsSync(researchUploadDir)) fs.mkdirSync(researchUploadDir, { recursive: true });

const researchStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, researchUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadResearch = multer({
  storage: researchStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ---------------- certicate documents ---------
const certificateUploadDir = path.join(__dirname, "../uploads/certificate");
if (!fs.existsSync(certificateUploadDir)) fs.mkdirSync(certificateUploadDir, { recursive: true });

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, certificateUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadCertificate = multer({
  storage: certificateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const combinedUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "passport_photo") {
        cb(null, passportUploadDir);
      } else if (file.fieldname === "resume") {
        cb(null, resumeUploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});
// ---------------- Export both ----------------
module.exports = {
  uploadPassportPhoto,
  uploadResume,
  uploadResearch,
  uploadCertificate,
  combinedUpload
};