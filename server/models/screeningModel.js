const express = require("express");
const router = express.Router();
const connection = require("../connection");
const logAudit = require("../utils/auditLogger.js");

// ─────────────────────────────────────────────────────────────────
// CREATE TABLES
// ─────────────────────────────────────────────────────────────────
const createScreeningQuestionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_screening_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      question_text VARCHAR(500) NOT NULL,
      question_type ENUM('text','yes_no','multiple_choice') DEFAULT 'text',
      options JSON NULL,
      is_required BOOLEAN DEFAULT true,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_posts(id)
    );
  `;
  connection.query(sql, (err) => {
    if (err) return console.error("job_screening_questions table error:", err.message);
    console.log("✅ job_screening_questions table ready");
  });
};

const createApplicationAnswersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS application_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      application_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_text VARCHAR(1000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (question_id) REFERENCES job_screening_questions(id)
    );
  `;
  connection.query(sql, (err) => {
    if (err) return console.error("application_answers table error:", err.message);
    console.log("✅ application_answers table ready");
  });
};

// ─────────────────────────────────────────────────────────────────
// addScreeningQuestions (employer — bulk add/replace for a job)
// ─────────────────────────────────────────────────────────────────
const addScreeningQuestions = (req, res) => {
  const { jobId } = req.params;
  const { userId, questions } = req.body; // questions: [{question_text, question_type, options, is_required}]

  if (!jobId || !Array.isArray(questions)) {
    return res.status(400).json({ error: "jobId and questions[] are required" });
  }

  // verify ownership
  connection.query(
    `SELECT account_id, job_title FROM job_posts WHERE id = ?`,
    [jobId],
    (err, jobRows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!jobRows.length) return res.status(404).json({ error: "Job not found" });
      if (userId && jobRows[0].account_id !== Number(userId)) {
        return res.status(403).json({ error: "Not authorized for this job" });
      }

      const jobTitle = jobRows[0].job_title;

      // replace existing questions for this job
      connection.query(
        `DELETE FROM job_screening_questions WHERE job_id = ?`,
        [jobId],
        (delErr) => {
          if (delErr) return res.status(500).json({ error: "Database error" });

          if (!questions.length) {
            // company chose to remove all screening questions — job goes back to quick-apply
            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: jobRows[0].account_id,
              action: "SCREENING_QUESTIONS_CLEARED",
              data: { event: `Screening questions removed for job: ${jobTitle}`, job_id: jobId },
              changedBy: userId || jobRows[0].account_id,
            });
            return res.json({ success: true, message: "Screening questions cleared", count: 0 });
          }

          const values = questions.map((q, i) => [
            jobId,
            q.question_text,
            q.question_type || "text",
            q.options ? JSON.stringify(q.options) : null,
            q.is_required !== undefined ? !!q.is_required : true,
            i,
          ]);

          connection.query(
            `INSERT INTO job_screening_questions
             (job_id, question_text, question_type, options, is_required, display_order)
             VALUES ?`,
            [values],
            (insErr, result) => {
              if (insErr) return res.status(500).json({ error: "Database error" });

              logAudit({
                tableName: "history",
                entityType: "employer",
                entityId: jobRows[0].account_id,
                action: "SCREENING_QUESTIONS_ADDED",
                data: {
                  event: `Screening questions added for job: ${jobTitle}`,
                  job_id: jobId,
                  count: questions.length,
                },
                changedBy: userId || jobRows[0].account_id,
              });

              return res.status(201).json({
                success: true,
                message: "Screening questions saved",
                count: result.affectedRows,
              });
            }
          );
        }
      );
    }
  );
};

// ─────────────────────────────────────────────────────────────────
// getScreeningQuestions (candidate checks before apply modal)
// ─────────────────────────────────────────────────────────────────
const getScreeningQuestions = (req, res) => {
  const { jobId } = req.params;

  connection.query(
    `SELECT id, question_text, question_type, options, is_required
     FROM job_screening_questions
     WHERE job_id = ?
     ORDER BY display_order ASC, id ASC`,
    [jobId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const questions = rows.map((q) => ({
        ...q,
        options: (() => {
          try {
            return q.options
              ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options)
              : null;
          } catch {
            return null;
          }
        })(),
      }));

      return res.json({
        job_id: Number(jobId),
        has_screening: questions.length > 0,
        questions,
      });
    }
  );
};

// ─────────────────────────────────────────────────────────────────
// deleteScreeningQuestion (employer — remove one question)
// ─────────────────────────────────────────────────────────────────
const deleteScreeningQuestion = (req, res) => {
  const { questionId } = req.params;

  connection.query(
    `DELETE FROM job_screening_questions WHERE id = ?`,
    [questionId],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Question not found" });
      return res.json({ success: true, message: "Question deleted" });
    }
  );
};

// ─────────────────────────────────────────────────────────────────
// getApplicationAnswers (employer — view a candidate's answers)
// ─────────────────────────────────────────────────────────────────
const getApplicationAnswers = (req, res) => {
  const { applicationId } = req.params;

  connection.query(
    `SELECT aa.id, aa.answer_text, q.question_text, q.question_type, q.is_required
     FROM application_answers aa
     JOIN job_screening_questions q ON q.id = aa.question_id
     WHERE aa.application_id = ?
     ORDER BY q.display_order ASC, q.id ASC`,
    [applicationId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ application_id: Number(applicationId), answers: rows });
    }
  );
};

module.exports = {
  createScreeningQuestionsTable,
  createApplicationAnswersTable,
  addScreeningQuestions,
  getScreeningQuestions,
  deleteScreeningQuestion,
  getApplicationAnswers,
};