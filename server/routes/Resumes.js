const express = require("express");
const router = express.Router();
const multer = require("multer");
const connection = require("../connection");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");


const fs = require("fs");
const PdfPrinter = require("pdfmake");
const crypto = require("crypto");
const { default: axios } = require("axios");
const authMiddleware = require("../middleware/auth");

// const PizZip = require("pizzip");
// const Docxtemplater = require("docxtemplater");
// const libre = require("libreoffice-convert");
// const FormData = require('form-data');
// const path = require("path");


// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Create the resume table in the database
const createEducationTable =()=>{
const resume = `
CREATE TABLE IF NOT EXISTS resume (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  file_name LONGTEXT,
  profile_hash VARCHAR(64),
  file LONGBLOB NOT NULL,
  created_by VARCHAR(20) NOT NULL,
  created_on DATETIME NOT NULL
);
  `;

// Execute the queries to create the tables
connection.query(resume, function (err, results, fields) {
  if (err) {
    console.error("Error creating Resumes table:", err.message);
  } else {
    console.log("Resumes table created successfully");
  }
});
}

// Handle file upload
// router.post('/', upload.single('file'), (req, res) => {
//   const { fileName, userId } = req.body;

//   if (!req.file) {
//     return res.status(400).send("File data is missing.");
//   }

//   const fileBuffer = req.file.buffer;

//   // 🔹 Compute hash of the file content
//   const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

//   // 🔹 Check if this exact file already exists for this user
//   connection.query(
//     "SELECT id FROM resume WHERE created_by = ? AND profile_hash = ? ORDER BY created_on DESC LIMIT 1",
//     [userId, fileHash],
//     (err, results) => {
//       if (err) {
//         console.error("DB error:", err);
//         return res.status(500).send({ msg: "SERVER_ERROR" });
//       }

//       if (results.length > 0) {
//         // ✅ File already exists → don’t insert again
//         return res.status(200).send({ msg: "File already uploaded previously", id: results[0].id });
//       }

//       // ❌ New file → insert into DB
//       const query = `
//         INSERT INTO resume (file_name, file, profile_hash, created_by, created_on) 
//         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
//       `;
//       connection.query(query, [fileName, fileBuffer, fileHash, userId], (err, result) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).send({ msg: "SERVER_ERROR" });
//         }

//         const insertedId = result.insertId;
//         res.status(200).send({ id: insertedId, msg: "File uploaded successfully" });
//       });
//     }
//   );
// });

// Extract text from PDF/DOCX
async function extractText(fileBuffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text;
  } else if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } else {
    return "";
  }
}

// Detect years like 2018, 2018-2020, 2018 – Present
function extractYears(text) {
  const regex = /((19|20)\d{2})(\s*[-–]\s*((19|20)\d{2}|Present))?/g;
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

// Split text into sections
function splitSections(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const sections = [];
  let buffer = [];

  lines.forEach(line => {
    // consider empty line or all caps as section separator
    if (line === "" || line === line.toUpperCase()) {
      if (buffer.length > 0) {
        sections.push(buffer.join(" "));
        buffer = [];
      }
    } else {
      buffer.push(line);
    }
  });

  if (buffer.length > 0) sections.push(buffer.join(" "));

  return sections;
}

function parseResumeAdvanced(text) {
  const sections = splitSections(text);

  const educationKeywords = ["MBBS","MD","BSc","MSc","FCPS","PhD"];
  const expKeywords = ["intern","resident","consultant","doctor","nurse","manager","engineer"];
  const skillKeywords = ["JavaScript","Node","React","Surgery","Patient Care","Research","Excel"];

  const education = [];
  const experience = [];
  const skills = [];

  sections.forEach(section => {
    // Check education
    if (educationKeywords.some(k => section.toUpperCase().includes(k.toUpperCase()))) {
      const years = extractYears(section);
      education.push({
        degree: educationKeywords.find(k => section.toUpperCase().includes(k.toUpperCase())),
        institution: section.replace(new RegExp(educationKeywords.join("|"), "gi"), "").trim(),
        start: years[0] || null,
        end: years[1] || null
      });
    }

    // Check experience
    if (expKeywords.some(k => section.toLowerCase().includes(k.toLowerCase()))) {
      const years = extractYears(section);
      experience.push({
        title: expKeywords.find(k => section.toLowerCase().includes(k.toLowerCase())),
        company: section.replace(new RegExp(expKeywords.join("|"), "gi"), "").trim(),
        start: years[0] || null,
        end: years[1] || null
      });
    }

    // Check skills
    skillKeywords.forEach(skill => {
      if (section.toLowerCase().includes(skill.toLowerCase()) && !skills.includes(skill)) {
        skills.push(skill);
      }
    });
  });

  return { education, experience, skills };
}

router.post("/", upload.single("file"), async (req, res) => {
  const { fileName, userId } = req.body;

  if (!req.file) return res.status(400).send("File data is missing.");

  const fileBuffer = req.file.buffer;
  const mimetype = req.file.mimetype;
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Check duplicate
  connection.query(
    "SELECT id FROM resume WHERE created_by = ? AND profile_hash = ? ORDER BY created_on DESC LIMIT 1",
    [userId, fileHash],
    async (err, results) => {
      if (err) return res.status(500).send({ msg: "SERVER_ERROR" });

      if (results.length > 0) {
        return res.status(200).send({
          msg: "File already uploaded previously",
          id: results[0].id
        });
      }

      // Parse resume
      let parsedData = { education: [], experience: [], skills: [] };
      try {
        const text = await extractText(fileBuffer, mimetype);
        parsedData = parseResumeAdvanced(text);
      } catch (err) {
        console.error("Error parsing resume:", err);
      }

      // Insert file only
      const query = `
        INSERT INTO resume (file_name, file, profile_hash, created_by, created_on) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      connection.query(query, [fileName, fileBuffer, fileHash, userId], (err, result) => {
        if (err) return res.status(500).send({ msg: "SERVER_ERROR" });

        res.status(200).send({
          id: result.insertId,
          msg: "File uploaded successfully",
          ...parsedData
        });
      });
    }
  );
});


// POST endpoint to upload a resume
// router.post("/", upload.array("attachments[]"), async (req, res) => {
//     try {
//       const files = req.files;

//       if (!files || files.length === 0) {
//         return res.status(400).json({ error: "No files uploaded" });
//       }

//       const insertPromises = files.map(async (file) => {
//         const insertQuery =
//           "INSERT INTO resume (filename, content) VALUES (?, ?)";
//         return new Promise((resolve, reject) => {
//           connection.query(
//             insertQuery,
//             [file.originalname, file.buffer],
//             (err, results) => {
//               if (err) {
//                 console.error("Error inserting resume into database:", err);
//                 reject(err);
//               } else {
//              
//                 resolve(results);
//               }
//             }
//           );
//         });
//       });

//       await Promise.all(insertPromises);

//       res.status(200).json({ message: "Resumes uploaded successfully!" });
//     } catch (error) {
//       console.error("Error uploading resume:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });


// download https://www.libreoffice.org/download/download/ to convert docx to pdf
// router.post("/generate-cv-pdf/:userid", async (req, res) => {
//   const userId = req.params.userid;
//   try {
//     // Run all API calls in parallel
//     const candidateRes = await axios.get(`http://localhost:8080/candidateProfile/candidate/full_profile/${userId}`);

//     const candidate = candidateRes.data;
//     // 1. Load template
//     const templatePath = "server/templates/cv-template.docx";
//     const content = fs.readFileSync(templatePath, "binary");
//     const zip = new PizZip(content);

//     // 2. Render with candidate data
//     const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
//     doc.render(candidate);

//     // 3. Generate DOCX buffer
//     const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });

//     // 4. Convert DOCX → PDF
//     libre.convert(docxBuffer, ".pdf", undefined, async (err, pdfBuffer) => {
//       if (err) {
//         console.error("Error converting to PDF:", err);
//         return res.status(500).send("PDF conversion error");
//       }

//       const fileName = `${candidate.full_name}_CV.pdf`;

//       // ✅ Send PDF back to frontend immediately
//       res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//       res.setHeader("Content-Type", "application/pdf");
//       res.send(pdfBuffer);

//       // ✅ Upload to DB in background (non-blocking)
//       setImmediate(async () => {
//         try {
//           const formData = new FormData();
//           formData.append("file", pdfBuffer, fileName);
//           formData.append("fileName", fileName);
//           formData.append("userId", userId);

//           await axios.post("http://localhost:8080/resume", formData, {
//             headers: formData.getHeaders(),
//           });

//         } catch (uploadErr) {
//           console.error("❌ Error saving CV to DB (background):", uploadErr);
//         }
//       });
//     });
//   } catch (error) {
//     console.error("Error generating CV:", error);
//     res.status(500).send("Error generating CV");
//   }
// });

///////////////////////////////////////
// HELPER FUNCTIONS TO GENERATE CV
function getProfileHash(candidate) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(candidate))
    .digest("hex");
}

function generateAndSaveCV(candidate, profileHash, userId, res) {
  // Utility function for section headings
  function sectionHeader(title) {
    return [
      { text: title, style: "sectionHeader" },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 520,
            y2: 0,
            lineWidth: 1,
            lineColor: "#e3e6e9", // lighter HR
          },
        ],
        margin: [0, 0, 0, 8],
      },
    ];
  }

  // Format skills into multiple columns with bullets
  function skillsTable(skills) {
    const rows = [];
    for (let i = 0; i < skills.length; i += 3) {
      rows.push([
        { text: skills[i] ? "• " + skills[i] : "", style: "skillsText" },
        { text: skills[i + 1] ? "• " + skills[i + 1] : "", style: "skillsText" },
        { text: skills[i + 2] ? "• " + skills[i + 2] : "", style: "skillsText" },
      ]);
    }
    return {
      table: {
        widths: ["*", "*", "*"],
        body: rows,
      },
      layout: {
        defaultBorder: false,
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 0,
        paddingBottom: () => 0, // ✅ removes extra vertical space
      },
      margin: [0, 0, 0, 0],
    };
  }



  let links = [];
  try {
    if (Array.isArray(candidate.Links)) {
      links = candidate.Links;
    } else if (typeof candidate.Links === "string") {
      links = JSON.parse(candidate.Links); // convert string → array
    }
  } catch (err) {
    console.error("Error parsing candidate.Links:", err);
  }

  // Build PDF
  const docDefinition = {
    pageMargins: [50, 72, 50, 72],
    content: [
      // NAME
      { text: candidate.username?.toUpperCase(), style: "name" },

      // Contact Info
      {
        text: `${candidate.City}  |  ${candidate.phone}  |  ${candidate.email}  |  ${links?.join(" | ") || ""}`,
        style: "contact",
      },

      // Summary
      sectionHeader("PROFESSIONAL SUMMARY"),
      { text: candidate.Description || "", style: "body", margin: [0, 0, 0, 6] },

      // Experience
      ...(candidate.experiences?.length
        ? [
          {
            unbreakable: true, // ✅ heading + first experience together
            stack: [
              ...sectionHeader("EXPERIENCE"),
              ...candidate.experiences.map((exp) => ({
                unbreakable: true, // ✅ each experience entry stays together
                stack: [
                  {
                    columns: [
                      {
                        text: `${exp.designation} – ${exp.company_name}`,
                        style: "titleText",
                        fontSize: 11,
                        bold: true,
                        color: "#322f2f",
                      },
                      {
                        text: `${exp.start_date} - ${exp.end_date || "Present"}`,
                        style: "date",
                        alignment: "right",
                      },
                    ],
                  },
                  { text: exp.description || "", style: "body", margin: [0, 0, 0, 6] },
                ],
                margin: [0, 0, 0, 4],
              })),
            ],
            margin: [0, 0, 0, 8],
          },
        ]
        : []),

      // Education
      ...(candidate.education?.length
        ? [
          {
            unbreakable: true, // ✅ heading + first education together
            stack: [
              ...sectionHeader("EDUCATION"),
              ...candidate.education.map((edu) => ({
                unbreakable: true, // ✅ each education entry stays together
                stack: [
                  {
                    columns: [
                      {
                        text: `${edu.degree_title} - ${edu.field_of_study || ""}`,
                        style: "titleText",
                        fontSize: 11,
                        bold: true,
                        color: "#322f2f",
                      },
                      {
                        text: `${edu.start_date} - ${edu.end_date || "Present"}`,
                        style: "date",
                        alignment: "right",
                      },
                    ],
                  },
                  { text: `${edu.institute_name}`, italics: true, style: "body", margin: [0, 0, 0, 3] },
                  { text: edu.education_description || "", style: "body", margin: [0, 0, 0, 6] },
                ],
                margin: [0, 0, 0, 4],
              })),
            ],
            margin: [0, 0, 0, 8],
          },
        ]
        : []),


      // Skills
      ...(candidate.skills?.length
        ? [
          {
            unbreakable: true, // ✅ heading + skills always together
            stack: [
              ...sectionHeader("SKILLS AND ABILITIES"),
              skillsTable(candidate.skills),
            ],
            margin: [0, 0, 0, 8],
          },
        ]
        : []),


      // Projects
      ...(candidate.projects?.length
        ? [
          {
            unbreakable: true, // ✅ keep heading + first project together
            stack: [
              ...sectionHeader("PROJECTS"),
              ...candidate.projects.map((proj) => ({
                unbreakable: true, // ✅ keep each project together
                stack: [
                  { text: proj.project_title, fontSize: 11, bold: true, color: "#322f2f" },
                  { text: `${proj.role} – ${proj.project_link || ""}`, italics: true, style: "body" },
                  { text: proj.project_description || "", style: "body", margin: [0, 0, 0, 3] },
                  {
                    text: `Tech Stack: ${(proj.skills_used || []).join(", ")}`,
                    italics: true,
                    style: "body",
                    margin: [0, 0, 0, 6],
                  },
                ],
                margin: [0, 0, 0, 4],
              })),
            ],
            margin: [0, 0, 0, 8],
          },
        ]
        : []),



      // Awards
      ...(candidate.awards?.length
        ? [
          {
            unbreakable: true, // ✅ heading + first award together
            stack: [
              ...sectionHeader("CERTIFICATIONS & AWARDS"),
              ...candidate.awards.map((award) => ({
                unbreakable: true, // ✅ each award stays together
                stack: [
                  {
                    columns: [
                      {
                        text: `${award.title} – ${award.institute_name}`,
                        fontSize: 11,
                        bold: true,
                        color: "#322f2f",
                      },
                      {
                        text: award.passing_year,
                        style: "date",
                        alignment: "right",
                      },
                    ],
                  },
                  { text: award.description || "", style: "body", margin: [0, 0, 0, 6] },
                ],
                margin: [0, 0, 0, 4],
              })),
            ],
            margin: [0, 0, 0, 8],
          },
        ]
        : []),

    ],

    defaultStyle: {
      font: "Roboto",        // or Open Sans / Roboto
      fontSize: 11,
      color: "#444444",
      lineHeight: 1.3,      // ✅ makes text evenly spaced everywhere
    },

    styles: {
      name: {
        fontSize: 26,
        bold: true,
        alignment: "center",
        color: "#135572",
        margin: [0, 0, 0, 5],
      },
      contact: {
        fontSize: 10,
        alignment: "center",
        margin: [0, 0, 0, 15],
        color: "#444444",
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: "#135572",
        alignment: "center",
        margin: [0, 12, 0, 4],
      },
      body: {
        fontSize: 11,
        color: "#444444",
      },
      bodyBold: {
        fontSize: 11,
        bold: true,
        color: "#444444",
      },
      titleText: {
        fontSize: 11,
        bold: true,
        color: "#322f2f",
      },
      date: {
        fontSize: 10,
        italics: true,
        color: "#444444",
      },
      skillsText: {
        fontSize: 11,
        color: "#444444",
      },

    },

    // ✅ Page break handling for projects & awards
    pageBreakBefore: function (
      currentNode,
      followingNodesOnPage,
      nodesOnNextPage,
      previousNodesOnPage
    ) {
      if (
        currentNode.style === "projectBlock" ||
        currentNode.style === "awardBlock"
      ) {
        if (followingNodesOnPage.length < 2) {
          return true; // move whole block to next page
        }
      }
      return false;
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  let chunks = [];
  pdfDoc.on("data", (chunk) => chunks.push(chunk));
  pdfDoc.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks);
    const fileName = `${candidate.full_name}_CV.pdf`;

    // Send to user
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(pdfBuffer);

    // Save to DB
    connection.query(
      "INSERT INTO resume (file_name, profile_hash, file, created_by, created_on) VALUES (?, ?, ?, ?, NOW())",
      [fileName, profileHash, pdfBuffer, userId],
      (err) => {
        if (err) console.error("Error saving CV:", err);
      
      }
    );
  });
  pdfDoc.end();
}


// build a basic pdf cv generation
// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: "server/fonts/Roboto-Regular.ttf",
    bold: "server/fonts/Roboto-Bold.ttf",
    italics: "server/fonts/Roboto-Italic.ttf",
    bolditalics: "server/fonts/Roboto-BoldItalic.ttf",
  },
};

const printer = new PdfPrinter(fonts);



router.post("/generate-cv/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    // 1. Fetch candidate data
    const candidateRes = await axios.get(
      `http://localhost:8080/candidateProfile/candidate/full_profile/${userId}`
    );
    const candidate = candidateRes.data;

    // 2. Compute hash of candidate profile
    const profileHash = getProfileHash(candidate);

    // 3. Check if a CV already exists with the same hash
    connection.query(
      "SELECT file, file_name FROM resume WHERE created_by = ? AND profile_hash = ? ORDER BY created_on DESC LIMIT 1",
      [userId, profileHash],
      (err, results) => {
        if (err) {
          console.error("DB error:", err);
          return res.status(500).send("DB error");
        }

        if (results.length > 0) {
          // CV already exists and is up-to-date
          return res.status(200).send({ msg: "Make changes in the Data to generate new CV", id: results[0].id });
        }

        // ❌ No CV or profile changed → regenerate and save
        generateAndSaveCV(candidate, profileHash, userId, res);
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF CV");
  }
});




module.exports = router;
