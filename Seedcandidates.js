const connection = require('./server/connection');
const bcrypt = require('bcrypt');

const CANDIDATE_COUNT = 6000;
const BATCH_LOG_EVERY = 100;

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve([result]);
    });
  });
};

const GENDERS = ['male', 'female'];
const MARITAL = ['single', 'married'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHIFTS = ['morning', 'evening', 'night'];
const SHIFT_TIMINGS = {
  morning: { startTime: '09:00', endTime: '17:00' },
  evening: { startTime: '15:00', endTime: '23:00' },
  night: { startTime: '21:00', endTime: '06:00' },
};

const seed = async () => {
  console.log('🌱 Seeding started...');

  // ── 0. Resolve real lookup IDs (city-first, same pattern as company seed) ──
  const cityRow = (await query(`SELECT id, district_id FROM cities LIMIT 1`))[0][0];
  if (!cityRow) throw new Error('No rows in cities — populate it first');
  const cityId = cityRow.id;
  const districtId = cityRow.district_id;

  const districtRow = (await query(`SELECT country_id FROM districts WHERE id = ?`, [districtId]))[0][0];
  if (!districtRow) throw new Error(`No district found for id ${districtId}`);
  const countryId = districtRow.country_id;

  const skillRows = (await query(`SELECT id FROM skills WHERE status = 'Active' LIMIT 20`))[0];
  if (!skillRows.length) throw new Error('No rows in skills — populate it first');

  const instituteRow = (await query(`SELECT id FROM institute WHERE status = 'Active' LIMIT 1`))[0][0];
  if (!instituteRow) throw new Error('No rows in institute — populate it first');
  const instituteId = instituteRow.id;

  const degreeFieldRow = (await query(`SELECT id FROM degreefields WHERE status = 'Active' LIMIT 1`))[0][0];
  if (!degreeFieldRow) throw new Error('No rows in degreefields — populate it first');
  const degreeFieldId = degreeFieldRow.id;

  // speciality is nullable on candidate_experience — use it if present, else null
  const specialityRow = (await query(`SELECT id FROM speciality WHERE status = 'Active' LIMIT 1`))[0][0];
  const specialityId = specialityRow ? specialityRow.id : null;

  console.log('✅ Resolved lookup IDs:', {
    cityId, districtId, countryId, instituteId, degreeFieldId, specialityId,
    skillPoolSize: skillRows.length,
  });

  const pickSkills = () => {
    const shuffled = [...skillRows].sort(() => 0.5 - Math.random());
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 skills
    return JSON.stringify(shuffled.slice(0, count).map((s) => s.id));
  };

  let created = 0;
  let failed = 0;

  for (let i = 1; i <= CANDIDATE_COUNT; i++) {
    try {
      const hash = await bcrypt.hash('password123', 10);
      const candEmail = `candidate_full_${Date.now()}_${i}@test.com`;

      // 1. account
      const [candAccount] = await query(
        `INSERT INTO account (username, email, password, accountType, isActive) 
         VALUES (?, ?, ?, 'candidate', 'Active')`,
        [`Candidate ${i}`, candEmail, hash]
      );
      const candAccId = candAccount.insertId;

      // 2. candidate_info — full record
      const gender = GENDERS[i % 2];
      const marital = MARITAL[i % 2];
      const isFresher = i % 4 === 0 ? 1 : 0;
      const skillsJson = pickSkills();

      const [candInfo] = await query(
        `INSERT INTO candidate_info
          (account_id, full_name, phone, date_of_birth, gender, marital_status,
           registration_type, is_fresher, address, country, district, city,
           skills, current_salary, expected_salary, profile_completed)
         VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          candAccId,
          `Test Candidate ${i}`,
          `03${String(100000000 + i).slice(0, 9)}`,
          `199${i % 10}-0${(i % 9) + 1}-15`,
          gender,
          marital,
          isFresher,
          `${i} Test Street, City ${i % 50}`,
          countryId,
          districtId,
          cityId,
          skillsJson,
          40000 + (i % 50) * 1000,
          50000 + (i % 50) * 1200,
        ]
      );
      const candidateId = candInfo.insertId;

      // 3. candidate_education — one row, only if not a fresher
      if (!isFresher) {
        await query(
          `INSERT INTO candidate_education
            (candidate_id, degree_id, institute_id, start_date, end_date, is_ongoing)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [candidateId, degreeFieldId, instituteId, `201${i % 9}-09-01`, `201${(i % 9) + 1}-06-30`]
        );
      }

      // 4. candidate_experience — one row, only if not a fresher
      if (!isFresher) {
        await query(
          `INSERT INTO candidate_experience
            (candidate_id, speciality_id, company_name, designation, start_date, end_date, is_ongoing)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            candidateId,
            specialityId,
            `Previous Company ${i % 100}`,
            'Software Engineer',
            `202${i % 4}-01-01`,
            i % 3 === 0 ? null : `202${(i % 4) + 1}-01-01`,
            i % 3 === 0 ? 1 : 0,
          ]
        );
      }

      // 5. candidate_availability — 2 rows (2 days, one shift each)
      const day1 = DAYS[i % 7];
      const day2 = DAYS[(i + 3) % 7];
      const shift = SHIFTS[i % 3];
      const timing = SHIFT_TIMINGS[shift];

      await query(
        `INSERT INTO candidate_availability (candidate_id, day, shift, startTime, endTime) VALUES ?`,
        [[
          [candidateId, day1, shift, timing.startTime, timing.endTime],
          [candidateId, day2, shift, timing.startTime, timing.endTime],
        ]]
      );

      // 6. candidate_certificates — one row (title only, no file)
      await query(
        `INSERT INTO candidate_certificates (candidate_id, title)
         VALUES (?, ?)`,
        [candidateId, `Certificate ${i % 20}`]
      );

      created++;
    } catch (err) {
      failed++;
      console.error(`❌ Candidate ${i} failed:`, err.message);
    }

    if (i % BATCH_LOG_EVERY === 0) {
      console.log(`Progress: ${i}/${CANDIDATE_COUNT} (created: ${created}, failed: ${failed})`);
    }
  }

  console.log(`\n🎉 Done. Created ${created} full candidates, ${failed} failures.`);
  connection.end();
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});