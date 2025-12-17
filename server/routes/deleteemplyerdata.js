// Express Router setup
const express = require('express');
const router = express.Router();
const connection = require('../connection');
router.delete('/delete_job/:userId/:jobId', (req, res) => {
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
  
      });

module.exports = router;
