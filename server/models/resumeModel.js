const connection = require("../connection");
const path = require("path");
const mammoth = require("mammoth");
const fs = require("fs");
const pdfjsLib = require("pdfjs-dist");

// Disable worker for Node.js
// pdfjsLib.GlobalWorkerOptions.workerSrc = false;

// ── CV EXTRACTION ALGORITHM ──
const extractFromCV = (rawText) => {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);

  const extractName = () => {
    for (const line of lines.slice(0, 10)) {
      if (
        line.length > 3 &&
        line.length < 50 &&
        /^[A-Za-z\s]+$/.test(line) &&
        line.split(" ").length >= 2 &&
        line.split(" ").length <= 4 &&
        !/resume|cv|curriculum|vitae|profile|summary/i.test(line)
      ) {
        return line.trim();
      }
    }
    return null;
  };

  const extractEmail = () => {
    const match = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : null;
  };

  const extractPhone = () => {
    const patterns = [
      /(\+92[-\s]?\d{3}[-\s]?\d{7})/,
      /(03\d{2}[-\s]?\d{7})/,
      /(0\d{2,3}[-\s]?\d{7})/,
      /(\+\d{1,3}[-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4})/,
      /(\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4})/,
    ];
    for (const p of patterns) {
      const m = rawText.match(p);
      if (m) return m[0].trim();
    }
    return null;
  };

  const extractAddress = () => {
    const patterns = [
      /address[:\s]+([^\n]+)/i,
      /location[:\s]+([^\n]+)/i,
      /(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|blvd)[^\n]*)/i,
    ];
    for (const p of patterns) {
      const m = rawText.match(p);
      if (m) return m[1].trim();
    }
    for (const line of lines) {
      if (/\b(karachi|lahore|islamabad|london|new york|dubai|pakistan|UK|USA)\b/i.test(line)) {
        return line.trim();
      }
    }
    return null;
  };

  const extractExperience = () => {
    const patterns = [
      /(\d+\+?\s*years?\s*of\s*(?:experience|exp))/i,
      /(?:experience|exp)[:\s]+(\d+\+?\s*years?)/i,
      /(\d+\+?\s*years?\s*experience)/i,
    ];
    for (const p of patterns) {
      const m = rawText.match(p);
      if (m) return m[1].trim();
    }
    const dateRanges = [...rawText.matchAll(/(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi)];
    if (dateRanges.length > 0) {
      let totalMonths = 0;
      const currentYear = new Date().getFullYear();
      for (const range of dateRanges) {
        const start = parseInt(range[1]);
        const end = /present|current/i.test(range[2]) ? currentYear : parseInt(range[2]);
        if (start && end && end >= start) totalMonths += (end - start) * 12;
      }
      if (totalMonths > 0) {
        const years = Math.floor(totalMonths / 12);
        return years > 0 ? `${years} years` : "Less than 1 year";
      }
    }
    return null;
  };

  const extractGender = () => {
    if (/\b(female|woman|she\/her)\b/i.test(rawText)) return "female";
    if (/\b(male|man|he\/him)\b/i.test(rawText)) return "male";
    const m = rawText.match(/gender[:\s]+(male|female)/i);
    if (m) return m[1].toLowerCase();
    return null;
  };

  const extractDOB = () => {
    const patterns = [
      /(?:dob|date of birth|born)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:dob|date of birth|born)[:\s]+(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
      /(?:dob|date of birth)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    ];
    for (const p of patterns) {
      const m = rawText.match(p);
      if (m) {
        try {
          const d = new Date(m[1]);
          if (!isNaN(d)) return d.toISOString().slice(0, 10);
        } catch (_) {}
        return m[1].trim();
      }
    }
    return null;
  };

  const extractIsFresher = () => {
    if (/\b(fresher|fresh graduate|no experience|entry.?level|recent graduate)\b/i.test(rawText)) {
      return true;
    }
    const hasExperience = /\b(experience|worked at|employment|company|employer)\b/i.test(rawText);
    return !hasExperience;
  };

  const extractSkills = () => {
    const skillKeywords = [
      "javascript", "python", "react", "node", "sql", "mysql", "php", "java",
      "css", "html", "express", "mongodb", "typescript", "git", "docker", "aws",
      "laravel", "vue", "angular", "flutter", "kotlin", "swift", "c++", "c#",
      "django", "flask", "redis", "postgresql", "graphql", "rest", "api", "linux",
      "nginx", "firebase", "figma", "photoshop", "leadership", "communication",
      "teamwork", "management", "problem solving", "analytical", "organizational",
      "multitasking", "time management", "nursing", "patient care", "clinical",
      "surgery", "pharmacy", "diagnosis", "medical coding", "healthcare",
      "physiotherapy", "dental", "radiology",
    ];

    const found = skillKeywords.filter(skill =>
      new RegExp(`\\b${skill}\\b`, "i").test(rawText)
    );

    const skillsSectionMatch = rawText.match(
      /(?:skills|expertise|competencies)[:\s\n]+([^]+?)(?:\n\n|\n[A-Z]|education|experience|$)/i
    );
    if (skillsSectionMatch) {
      const sectionSkills = skillsSectionMatch[1]
        .split(/[\n,•·\-\|]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 40 && /^[A-Za-z\s\+#\.]+$/.test(s));
      return [...new Set([...found, ...sectionSkills])].slice(0, 20);
    }

    return found;
  };

  return {
    full_name:        extractName(),
    email:            extractEmail(),
    phone:            extractPhone(),
    address:          extractAddress(),
    total_experience: extractExperience(),
    gender:           extractGender(),
    date_of_birth:    extractDOB(),
    is_fresher:       extractIsFresher(),
    skills:           extractSkills(),
  };
};

// ── UPLOAD CV ──
const uploadCV = async (req, res) => {
  const accountId = req.user?.userId;
  if (!accountId) return res.status(401).json({ error: "Unauthorized" });
  if (!req.file)  return res.status(400).json({ error: "No file uploaded" });

  const resumePath = `/uploads/resume/${req.file.filename}`;

  let extracted = {
    full_name: null, phone: null, email: null,
    total_experience: null, address: null, gender: null,
    date_of_birth: null, skills: [], is_fresher: false,
  };

  try {
    const buffer = req.file.buffer ?? fs.readFileSync(req.file.path);
    const isPDF  = req.file.mimetype === "application/pdf";
    const isDOCX = req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDOC  = req.file.mimetype === "application/msword";

    let rawText = "";

    if (isDOCX || isDOC) {
      const result = req.file.buffer
        ? await mammoth.extractRawText({ buffer: req.file.buffer })
        : await mammoth.extractRawText({ path: req.file.path });
      rawText = result.value || "";
      console.log("=== DOCX text length:", rawText.length);

    } else if (isPDF) {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          fullText += strings.join(" ") + "\n";
        }

        rawText = fullText.trim();
        console.log("=== PDF text length:", rawText.length);
        console.log("=== PDF preview:", rawText.substring(0, 300));
      } catch (e) {
        console.warn("pdfjs failed:", e.message);
      }
    }

    // Image-based PDF — save file, ask candidate to fill manually
    if (!rawText || rawText.trim().length < 30) {
      console.warn("=== Could not extract text — image-based PDF");
      connection.query(
        `INSERT INTO candidate_info (account_id, resume, profile_completed)
         VALUES (?, ?, 0)
         ON DUPLICATE KEY UPDATE resume = VALUES(resume)`,
        [accountId, resumePath],
        (err) => {
          if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ error: "Failed to save" });
          }
          return res.json({
            success: true,
            message: "CV saved. We could not read text from this PDF — please complete your profile manually from the dashboard.",
            extracted,
          });
        }
      );
      return;
    }

    // Run extraction algorithm
    extracted = extractFromCV(rawText);
    console.log("=== Extracted:", extracted);

  } catch (err) {
    console.error("uploadCV error:", err.message);
  }

  // Match skill names to IDs in DB
  let skillIds = [];
  if (extracted.skills?.length > 0) {
    await new Promise((resolve) => {
      const placeholders = extracted.skills.map(() => "?").join(",");
      connection.query(
        `SELECT id FROM skills WHERE LOWER(name) IN (${placeholders})`,
        extracted.skills.map((s) => s.toLowerCase()),
        (err, rows) => {
          if (!err) skillIds = rows.map((r) => r.id);
          resolve();
        }
      );
    });
  }

  const skillsJson = skillIds.length ? JSON.stringify(skillIds) : null;

  const sql = `
    INSERT INTO candidate_info (
      account_id, full_name, phone, date_of_birth, gender,
      address, total_experience, skills, resume,
      profile_completed, is_fresher
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    ON DUPLICATE KEY UPDATE
      full_name        = COALESCE(?, full_name),
      phone            = COALESCE(?, phone),
      date_of_birth    = COALESCE(?, date_of_birth),
      gender           = COALESCE(?, gender),
      address          = COALESCE(?, address),
      total_experience = COALESCE(?, total_experience),
      skills           = COALESCE(?, skills),
      resume           = VALUES(resume),
      is_fresher       = VALUES(is_fresher),
      profile_completed = profile_completed
  `;

  const params = [
    accountId, extracted.full_name, extracted.phone, extracted.date_of_birth,
    extracted.gender, extracted.address, extracted.total_experience,
    skillsJson, resumePath, extracted.is_fresher ? 1 : 0,
    extracted.full_name, extracted.phone, extracted.date_of_birth,
    extracted.gender, extracted.address, extracted.total_experience, skillsJson,
  ];

  connection.query(sql, params, (err) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Failed to save profile" });
    }

    return res.json({
      success: true,
      message: "CV uploaded and parsed successfully",
      extracted,
    });
  });
};

// ── ADD RESUME (step 4 manual flow) ──
const addResume = (req, res) => {
  const userId = req.user?.userId;
  if (!req.file) return res.status(400).json({ msg: "File data is missing" });

  const resumePath = `/uploads/resume/${req.file.filename}`;

  connection.query(
    `UPDATE candidate_info SET resume = ? WHERE account_id = ?`,
    [resumePath, userId],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ msg: "SERVER_ERROR" }); }

      if (result.affectedRows === 0) {
        connection.query(
          `INSERT INTO candidate_info (account_id, resume, profile_completed) VALUES (?, ?, 0)`,
          [userId, resumePath],
          (err2) => {
            if (err2) return res.status(500).json({ msg: "SERVER_ERROR" });
            return res.status(200).json({ msg: "Resume uploaded successfully", resume: resumePath });
          }
        );
        return;
      }
      return res.status(200).json({ msg: "Resume uploaded successfully", resume: resumePath });
    }
  );
};

// ── UPDATE RESUME (admin / profile edit) ──
const updateResume = (req, res) => {
  const userId = req.params.id;
  const file = req.file;
  if (!file) return res.status(400).json({ msg: "No file uploaded" });

  const resumePath = `/uploads/resume/${file.filename}`;
  connection.query(
    `UPDATE candidate_info SET resume = ? WHERE account_id = ?`,
    [resumePath, userId],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ msg: "SERVER_ERROR" }); }
      return res.status(200).json({ msg: "Resume updated successfully", resume: resumePath });
    }
  );
};

// ── GET RESUME ──
const getResume = (req, res) => {
  const userId = req.user?.userId;

  connection.query(
    `SELECT resume FROM candidate_info WHERE account_id = ?`,
    [userId],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ msg: "SERVER_ERROR" }); }
      if (!result.length || !result[0].resume) return res.status(404).json({ msg: "RESUME_NOT_FOUND" });

      const resumePath = path.join(__dirname, "..", result[0].resume);
      if (!fs.existsSync(resumePath)) return res.status(404).json({ msg: "FILE_NOT_FOUND_ON_DISK" });

      const ext = path.extname(result[0].resume).toLowerCase();
      const contentType =
        ext === ".pdf" ? "application/pdf"
        : ext === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename=resume${ext}`);
      res.sendFile(resumePath);
    }
  );
};

module.exports = { uploadCV, addResume, updateResume, getResume };