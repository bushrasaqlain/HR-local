const connection = require('./server/connection');
const bcrypt = require('bcrypt');

const COMPANY_COUNT = 10; // ← change this to however many companies you want

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve([result]);
    });
  });
};

const seed = async () => {
  console.log('🌱 Seeding started...');

  // ── 0. Resolve real lookup IDs (once — reused for every company) ──
  const businessTypes = (await query(`SELECT id FROM business_entity_type LIMIT 1`))[0];
  if (!businessTypes.length) throw new Error('No rows in business_entity_type — populate it first');
  const businessTypeId = businessTypes[0].id;

  const cityRow = (await query(`SELECT id, district_id FROM cities LIMIT 1`))[0][0];
  if (!cityRow) throw new Error('No rows in cities — populate it first');
  const cityId = cityRow.id;
  const districtId = cityRow.district_id;

  const districtRow = (await query(`SELECT country_id FROM districts WHERE id = ?`, [districtId]))[0][0];
  if (!districtRow) throw new Error(`No district found for id ${districtId}`);
  const countryId = districtRow.country_id;

  console.log('✅ Resolved lookup IDs:', { businessTypeId, countryId, districtId, cityId });

  const SKILL_IDS = '[11,103,44]';

  // ── LOOP: create COMPANY_COUNT employers, each with a job + 50 candidates ──
  for (let c = 1; c <= COMPANY_COUNT; c++) {
    console.log(`\n=== Company ${c}/${COMPANY_COUNT} ===`);

    // 1. Employer account (unique email every time)
    const empEmail = `employer${Date.now()}_${c}@test.com`;
    const empHash = await bcrypt.hash('password123', 10);

    const [empAccount] = await query(
      `INSERT INTO account (username, email, password, accountType, isActive) 
       VALUES (?, ?, ?, 'employer', 'Active')`,
      [`Test Employer ${c}`, empEmail, empHash]
    );
    const employerId = empAccount.insertId;
    console.log('✅ Employer created:', employerId, empEmail);

    // 2. company_info — full record, varied name/phone/NTN per company
    await query(
      `INSERT INTO company_info
        (account_id, company_name, Business_entity_type_id, phone, country_id, district_id, city_id,
         company_address, company_website, NTN, size_of_company, established_date, profile_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        employerId,
        `Test Company ${c} Ltd`,
        businessTypeId,
        `0300-${String(1000000 + c).slice(-7)}`,
        countryId,
        districtId,
        cityId,
        `${c} Test Street, Rawalpindi`,
        `https://testcompany${c}.com`,
        `${1000000000000 + c}`,
        100 + c,
        '2015',
      ]
    );
    console.log('✅ Company info created');

    // 3. Job post
    const [jobResult] = await query(
      `INSERT INTO job_posts 
       (account_id, job_title, job_description, skill_ids, min_experience, max_experience, 
        min_salary, max_salary, approval_status, status, application_deadline, billing_model,
        city_id)
       VALUES (?, 'Software Engineer', 'Test job description', ?, 1, 5,
               50000, 100000, 'Approved', 'Active', DATE_ADD(NOW(), INTERVAL 30 DAY), 
               'duration_bundle', ?)`,
      [employerId, SKILL_IDS, JSON.stringify([cityId])]
    );
    const jobId = jobResult.insertId;
    console.log('✅ Job created:', jobId);

    // 4. 50 candidates + applications for this company's job
    for (let i = 1; i <= 50; i++) {
      const candHash = await bcrypt.hash('password123', 10);
      const candEmail = `candidate${Date.now()}_${c}_${i}@test.com`;

      const [candAccount] = await query(
        `INSERT INTO account (username, email, password, accountType, isActive) 
         VALUES (?, ?, ?, 'candidate', 'Active')`,
        [`Candidate ${c}-${i}`, candEmail, candHash]
      );
      const candId = candAccount.insertId;

      const [candInfo] = await query(
        `INSERT INTO candidate_info 
         (account_id, full_name, phone, gender, marital_status, is_fresher,
          address, country, district, city, skills, current_salary, expected_salary,
          profile_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          candId,
          `Test Candidate ${c}-${i}`,
          `030000${String(c).padStart(2, '0')}${String(i).padStart(2, '0')}`,
          i % 2 === 0 ? 'male' : 'female',
          'single',
          0,
          '123 Test Street',
          countryId,
          districtId,
          cityId,
          SKILL_IDS,
          50000 + i * 500,
          60000 + i * 1000,
        ]
      );

      await query(
        `INSERT INTO applications (job_id, candidate_id, status, source)
         VALUES (?, ?, 'Pending', 'candidate')`,
        [jobId, candInfo.insertId]
      );
    }
    console.log(`✅ 50 candidates + applications created for company ${c}`);
  }

  console.log(`\n🎉 Seeding done! Created ${COMPANY_COUNT} companies.`);
  connection.end();
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});