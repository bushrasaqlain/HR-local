const connection = require('./server/connection');
const bcrypt = require('bcrypt');

const JOB_ID = 35;
const CITY_ID = 207;
const SKILL_IDS = '[11,103,44]';

(async () => {
  console.log('Seeding 500 candidates...');

  for (let i = 1; i <= 500; i++) {
    const hash = await bcrypt.hash('password123', 10);

    await new Promise((resolve) => {
      connection.query(
        'INSERT IGNORE INTO account (username, email, password, accountType, isActive) VALUES (?,?,?,?,?)',
        ['Candidate ' + i, 'candidate' + i + '@test.com', hash, 'candidate', 'Active'],
        (e, r) => {
          if (e || !r.insertId) return resolve();
          const candAccId = r.insertId;

          connection.query(
            'INSERT IGNORE INTO candidate_info (account_id, full_name, phone, city, skills, total_experience, expected_salary, profile_completed) VALUES (?,?,?,?,?,?,?,1)',
            [candAccId, 'Test Candidate ' + i, '0300000' + i, CITY_ID, SKILL_IDS, (i % 5) + 1, 60000 + i * 1000],
            (e2, r2) => {
              if (e2 || !r2.insertId) return resolve();

              connection.query(
                'INSERT INTO applications (job_id, candidate_id, status, source) VALUES (?,?,?,?)',
                [JOB_ID, r2.insertId, 'Pending', 'candidate'],
                () => resolve()
              );
            }
          );
        }
      );
    });

    console.log('Created candidate', i);
  }

  console.log('Done! 50 candidates seeded.');
  connection.end();
})();