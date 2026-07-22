const connection = require('./server/connection');
const bcrypt = require('bcrypt');

const CITY_ID  = 207;
const SKILL_IDS = '[11,103,44]';

const seed = async () => {
  console.log('🌱 Seeding started...');

  // 1. Create employer account
  const empHash = await bcrypt.hash('password123', 10);
  const [empAccount] = await query(
    `INSERT INTO account (username, email, password, accountType, isActive) 
     VALUES ('Test Employer', 'employer@test.com', ?, 'employer', 'Active')`,
    [empHash]
  );
  const employerId = empAccount.insertId;
  console.log('✅ Employer created:', employerId);

  // 2. Create company info
  await query(
    `INSERT INTO company_info (account_id, company_name, profile_completed) 
     VALUES (?, 'Test Company Ltd', 1)`,
    [employerId]
  );

  // 3. Create a job post
  const [jobResult] = await query(
    `INSERT INTO job_posts 
     (account_id, job_title, job_description, skill_ids, min_experience, max_experience, 
      min_salary, max_salary, approval_status, status, application_deadline, billing_model,
      city_id)
     VALUES (?, 'Software Engineer', 'Test job description', ?, 1, 5,
             50000, 100000, 'Approved', 'Active', DATE_ADD(NOW(), INTERVAL 30 DAY), 
             'duration_bundle', ?)`,
    [employerId, SKILL_IDS, JSON.stringify([CITY_ID])]
  );
  const jobId = jobResult.insertId;
  console.log('✅ Job created:', jobId);

  // 4. Create 50 candidate accounts + profiles
  for (let i = 1; i <= 50; i++) {
    const hash = await bcrypt.hash('password123', 10);
    const [candAccount] = await query(
      `INSERT INTO account (username, email, password, accountType, isActive) 
       VALUES (?, ?, ?, 'candidate', 'Active')`,
      [`Candidate ${i}`, `candidate${i}@test.com`, hash]
    );
    const candId = candAccount.insertId;

    const [candInfo] = await query(
      `INSERT INTO candidate_info 
       (account_id, full_name, phone, city, skills, total_experience, expected_salary, profile_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [candId, `Test Candidate ${i}`, `030000000${String(i).padStart(2,'0')}`, 
       CITY_ID, SKILL_IDS, (i % 5) + 1, 60000 + i * 1000]
    );

    // 5. Create application for each candidate
    await query(
      `INSERT INTO applications (job_id, candidate_id, status, source)
       VALUES (?, ?, 'Pending', 'candidate')`,
      [jobId, candInfo.insertId]
    );
  }
  console.log('✅ 50 candidates + applications created');

  console.log('🎉 Seeding done!');
  console.log(`👉 USER_ID = ${employerId}`);
  console.log(`👉 JOB_ID  = ${jobId}`);
  connection.end();
};

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve([result]);
    });
  });
};

seed().catch(console.error);