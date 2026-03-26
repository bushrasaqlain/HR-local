const connection = require("../connection");

const getDashboardStats = () => {
    return new Promise((resolve, reject) => {
        const queries = {
            jobseekers: `
        SELECT COUNT(*) AS total 
        FROM account 
        WHERE accountType='candidate' AND isActive='Active'
      `,

            success: `
        SELECT 
        IFNULL(ROUND(
          (COUNT(CASE WHEN company_status='confirmed' THEN 1 END) * 100.0 / COUNT(*)), 0
        ),0) AS successRate
        FROM applications
      `,

            diversity: `
        SELECT 
        ROUND(
        (
        (COUNT(DISTINCT gender) / 3) +
        (COUNT(DISTINCT city) / 50) +
        (AVG(JSON_LENGTH(skills)) / 10)
        ) * 100 / 3
        , 0) AS diversity
        FROM candidate_info
      `
        };

        Promise.all([
            new Promise((res, rej) => {
                connection.query(queries.jobseekers, (err, r) => err ? rej(err) : res(r[0].total));
            }),
            new Promise((res, rej) => {
                connection.query(queries.success, (err, r) => err ? rej(err) : res(r[0].successRate));
            }),
            new Promise((res, rej) => {
                connection.query(queries.diversity, (err, r) => err ? rej(err) : res(r[0].diversity));
            })
        ])
            .then(([jobseekers, successRate, diversity]) => {
                resolve({ jobseekers, successRate, diversity });
            })
            .catch(reject);
    });
};

module.exports = {
    getDashboardStats
};