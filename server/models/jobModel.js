const express = require("express");
const router = express.Router();
const connection = require("../connection");
const logAudit = require("../utils/auditLogger.js");
const getAllJobs = (req, res) => {
  const userId = req.params.userId;

  const jobPostsQuery = `
  SELECT 
    jp.id,
    jp.account_id,
    a.username,
    jp.job_title,
    jp.job_description,
    jp.skill_ids,
    GROUP_CONCAT(s.name) AS skills,  
    jp.time_from,
    jp.time_to,
    jt.name AS job_type,
    jp.min_salary,
    jp.max_salary,
    ccy.code AS currency,
    jp.min_experience,
    jp.max_experience,
    prof.name AS profession,
    deg.name AS degree,
    jp.no_of_positions,
    jp.industry,
    pkg.price AS packageprice,
    pkg.currency AS packagecurrency,
    co.name AS country,
    d.name AS district,
    ci.name AS city,
    jp.application_deadline,
    jp.created_at,
    jp.updated_at,
    jp.status
  FROM job_posts jp
  LEFT JOIN account a ON jp.account_id = a.id
  LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
  LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
  LEFT JOIN packages pkg ON jp.package_id = pkg.id
  LEFT JOIN professions prof ON jp.profession_id = prof.id
  LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
  LEFT JOIN countries co ON jp.country_id = co.id
  LEFT JOIN districts d ON jp.district_id = d.id
  LEFT JOIN cities ci ON jp.city_id = ci.id
  LEFT JOIN skills s ON FIND_IN_SET(s.id, jp.skill_ids)
  WHERE jp.account_id = ?
  GROUP BY jp.id
`;


  connection.query(jobPostsQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching job posts:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const transformedResults = results.map(job => ({
      ...job,
      skill_ids: Array.isArray(job.skill_ids)
        ? job.skill_ids
        : job.skill_ids && typeof job.skill_ids === 'string'
          ? job.skill_ids.split(',').map(id => parseInt(id))
          : [],
      skills: job.skills ? job.skills.split(',') : [], // array of skill names
    }));


    res.status(200).json(transformedResults);
  });
};

const getSingleJob=(req,res)=>{
      const jobId = req.params.jobIdFromUrl; 
  const singlejobquery = `
  SELECT
  jp.job_title,
  a.email,
  a.username,
  jp.application_deadline,
  jp.job_description,
  jp.industry

  FROM job_posts jp
  LEFT JOIN account a ON jp.account_id = a.id
  WHERE jp.id = ?;
  `;

  console.log("Executing query..");
  // Execute the query with the jobId value as an argument
  connection.query(singlejobquery, [jobId], (err, results) => {
    if (err) {
      console.error("Error fetching job post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // console.log("Fetched results:", results);
    // Convert logo buffer to base64

    res.json({ results });
  });
}

const deleteJob=(req,res)=>{
   const userId = req.params.userId;
  const jobId = req.params.jobId;
  const deleteSavedJobsQuery = 'DELETE FROM saved_jobs WHERE job_id = ?';
  const deleteApplicationsQuery = 'DELETE FROM applications WHERE job_id = ?';
  const deleteJobQuery = 'DELETE FROM job_posts WHERE id = ? AND account_id = ?';
  
  // Delete saved jobs first
  connection.query(deleteSavedJobsQuery, [jobId], (err, savedJobsResult) => {
    if (err) {
      console.error('Error deleting saved jobs:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  
    // Delete applications next
    connection.query(deleteApplicationsQuery, [jobId], (err, applicationResult) => {
      if (err) {
        console.error('Error deleting applications:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      // Finally, delete the job post
      connection.query(deleteJobQuery, [jobId, userId], (err, jobResult) => {
        if (err) {
          console.error('Error deleting job:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        if (jobResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Job not found' });
        }
  
        return res.status(200).json({ message: 'Job deleted successfully' });
      });
    });
  });
}

const postJob=(req,res)=>{

const userId = req.params.userId;

    const {
      job_title,
      job_description,
      skill_ids,
      time_from,
      time_to,
      job_type_id,
      min_salary,
      max_salary,
      min_experience,
      max_experience,
      profession_id,
      degree_id,
      application_deadline,
      no_of_positions,
      industry,
      currency_id,
      country_id,
      city_id,
      district_id,
      package_id,
      bankName,
      cardType,
      cardholder,
      cardNumber,
      expiry,
      cvv
    } = req.body;
  
    const sql = `
      INSERT INTO job_posts (
        account_id, job_title, job_description, skill_ids, time_from, time_to,
          job_type_id, min_salary, max_salary, currency_id,
          min_experience, max_experience, profession_id, degree_id,
          application_deadline, no_of_positions, industry, package_id, country_id, district_id, city_id
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userId,
      job_title,
      job_description,
      JSON.stringify(skill_ids),  // store as JSON ["Ship Engineers","Commercial Pilots"]
      time_from,
      time_to,
      job_type_id,
      min_salary,
      max_salary,
      currency_id,
      min_experience,
      max_experience,
      profession_id,
      degree_id,
      application_deadline,
      no_of_positions,
      industry,
      package_id,
      country_id,
      district_id,
      city_id
    ];
  
    connection.query(sql, params, (error, result) => {
      if (error) {
        console.error("ERROR adding job post:", error);
        return res.status(500).json({ error: "database error " });
      } else {
        logAudit({
          tableName: "history",
          entityType: "job",
          entityId: result.insertId,
          action: "ADDED",
          data: {
            userId: userId,
            job_title,
            job_description,
            skill_ids,
            time_from,
            time_to,
            job_type_id,
            min_salary,
            max_salary,
            currency_id,
            min_experience,
            max_experience,
            profession_id,
            degree_id,
            application_deadline,
            no_of_positions,
            industry,
            package_id,
            country_id,
            district_id,
            city_id
          },
          changedBy: userId,
        });
  
        const cardSql = `
          INSERT INTO card (
            account_id, bankName, cardType, cardholder, cardNumber, expiry, cvv
          )
          VALUES(?, ?, ?,?, ?, ?, ?)
        `;
        const cartParams = [
          userId,
          bankName,
          cardType,
          cardholder,
          cardNumber,
          expiry,
          cvv
        ];
  
        connection.query(cardSql, cartParams, (err, results) => {
          if (error) {
            console.error("ERROR adding cart data:", error);
            return res.status(500).json({ error: "database error " });
          } else {
            logAudit({
              tableName: "history",
              entityType: "cart",
              entityId: results.insertId,
              action: "ADDED",
              data: {
                userId: userId,
                bankName,
                cardType,
                cardholder,
                cardNumber,
                expiry,
                cvv
              },
              changedBy: userId,
            });
          }
        })
  
        return res.status(201).json({ message: "job post created successfully", job_id: result.insertId });
      }
    })
  
}



module.exports={
    
    getAllJobs,
    getSingleJob,
    deleteJob,
    postJob
}