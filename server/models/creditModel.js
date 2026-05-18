const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

// ─── Create candidate_unlocks table ─────────────────────────────────────────
const createCandidateUnlocksTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS candidate_unlocks (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      employer_account_id INT NOT NULL,
      candidate_id        INT NOT NULL,
      job_id              INT NOT NULL,
      unlock_scope        ENUM('basic','contact','full') NOT NULL DEFAULT 'full',
      cost_charged        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      company_package_id  INT NULL,
      unlocked_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_unlock (employer_account_id, candidate_id, job_id, unlock_scope),
      FOREIGN KEY (employer_account_id) REFERENCES account(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES job_posts(id) ON DELETE CASCADE
    )
  `;
  connection.query(sql, (err) => {
    if (err) return console.error("candidate_unlocks table error:", err.message);
    console.log("✅ candidate_unlocks table ready");
  });
};

// ─── Get employer's active cv_credits balance ────────────────────────────────
const getEmployerCreditBalance = (req, res) => {
    const accountId = req.user.userId;

    connection.query(
        `SELECT 
      cp.id AS company_package_id,
      cp.used_credits,
      cp.end_date,
      cp.package_snapshot,
      p.unlock_scope,
      p.credit_count,
      p.name AS package_name
    FROM company_packages cp
    JOIN packages p ON p.id = cp.package_id
    WHERE cp.account_id = ?
      AND cp.pricing_model = 'cv_credits'
      AND cp.status = 'active'
      AND cp.end_date >= CURDATE()
    ORDER BY cp.id ASC
    LIMIT 1`,
        [accountId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length) return res.json({ success: true, credit: null });

            const row = rows[0];
            const snapshot = typeof row.package_snapshot === "string"
                ? JSON.parse(row.package_snapshot)
                : (row.package_snapshot || {});

            const total = row.credit_count || snapshot.credit_count || 0;
            const used = row.used_credits || 0;

            res.json({
                success: true,
                credit: {
                    company_package_id: row.company_package_id,
                    unlock_scope: row.unlock_scope || snapshot.unlock_scope || "full",
                    total_credits: total,
                    used_credits: used,
                    remaining_credits: total - used,
                    package_name: row.package_name,
                    expires_at: row.end_date,
                },
            });
        }
    );
};

// ─── Unlock a candidate profile ──────────────────────────────────────────────
const unlockCandidateProfile = (req, res) => {
    const accountId = req.user.userId;
    const { candidate_id } = req.body;

    if (!candidate_id) {
        return res.status(400).json({ error: "candidate_id is required" });
    }

    // Step 1: Already unlocked?
    connection.query(
        `SELECT unlock_scope FROM candidate_unlocks
     WHERE employer_account_id = ? AND candidate_id = ?`,
        [accountId, candidate_id],
        (err, existing) => {
            if (err) return res.status(500).json({ error: err.message });

            if (existing.length > 0) {
                return res.json({
                    success: true,
                    already_unlocked: true,
                    unlock_scope: existing[0].unlock_scope,
                    message: "This profile is already unlocked.",
                });
            }

            // Step 2: Find active cv_credits package
            connection.query(
                `SELECT 
          cp.id AS company_package_id,
          cp.used_credits,
          cp.package_snapshot,
          p.unlock_scope,
          p.credit_count
        FROM company_packages cp
        JOIN packages p ON p.id = cp.package_id
        WHERE cp.account_id = ?
          AND cp.pricing_model = 'cv_credits'
          AND cp.status = 'active'
          AND cp.end_date >= CURDATE()
        ORDER BY cp.id ASC
        LIMIT 1`,
                [accountId],
                (err2, pkgRows) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    if (!pkgRows.length) {
                        return res.status(403).json({
                            error: "no_credits",
                            message: "You do not have an active CV Credits package. Please purchase one to unlock profiles.",
                        });
                    }

                    const pkg = pkgRows[0];
                    const snapshot = typeof pkg.package_snapshot === "string"
                        ? JSON.parse(pkg.package_snapshot)
                        : (pkg.package_snapshot || {});

                    const total = pkg.credit_count || snapshot.credit_count || 0;
                    const used = pkg.used_credits || 0;
                    const scope = pkg.unlock_scope || snapshot.unlock_scope || "full";

                    if (used >= total) {
                        return res.status(403).json({
                            error: "no_credits",
                            message: "You have used all your credits. Please purchase a new pack to continue.",
                        });
                    }

                    // Step 3: Transaction — deduct credit + save unlock record
                    connection.beginTransaction((txErr) => {
                        if (txErr) {
                            return res.status(500).json({ error: "Failed to start transaction." });
                        }

                        connection.query(
                            `UPDATE company_packages SET used_credits = used_credits + 1 WHERE id = ?`,
                            [pkg.company_package_id],
                            (err3) => {
                                if (err3) {
                                    return connection.rollback(() =>
                                        res.status(500).json({ error: "Failed to deduct credit. Please try again." })
                                    );
                                }

                                connection.query(
                                    `INSERT INTO candidate_unlocks
                   (employer_account_id, candidate_id, unlock_scope, company_package_id)
                   VALUES (?, ?, ?, ?)`,
                                    [accountId, candidate_id, scope, pkg.company_package_id],
                                    (err4) => {
                                        if (err4) {
                                            return connection.rollback(() =>
                                                res.status(500).json({ error: "Failed to save unlock record. Please try again." })
                                            );
                                        }

                                        connection.commit((commitErr) => {
                                            if (commitErr) {
                                                return connection.rollback(() =>
                                                    res.status(500).json({ error: "Transaction commit failed. Please try again." })
                                                );
                                            }

                                            logAudit({
                                                tableName: "history",
                                                entityType: "employer",
                                                entityId: accountId,
                                                action: "UPDATED",
                                                data: {
                                                    event: "Candidate profile unlocked",
                                                    candidate_id,
                                                    scope,
                                                },
                                                changedBy: accountId,
                                            });

                                            res.json({
                                                success: true,
                                                message: "Profile unlocked successfully.",
                                                unlock_scope: scope,
                                                credits_remaining: total - used - 1,
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    });
                }
            );
        }
    );
};

// ─── Get unlocked candidate data (scope enforced) ────────────────────────────
const getUnlockedCandidateData = (req, res) => {
    const accountId = req.user.userId;
    const { candidate_id } = req.params;

    connection.query(
        `SELECT unlock_scope FROM candidate_unlocks
     WHERE employer_account_id = ? AND candidate_id = ?`,
        [accountId, candidate_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!rows.length) {
                return res.status(403).json({
                    error: "Profile not unlocked",
                    message: "You have not unlocked this profile. Please use a credit to unlock it first.",
                });
            }

            const scope = rows[0].unlock_scope;

            // Fields returned depend on unlock scope
            let fields = `
        ci.id AS candidate_id,
        ci.full_name,
        ci.total_experience,
        ci.gender,
        city.name AS city_name
      `;

            if (scope === "contact" || scope === "full") {
                fields += `, a.email, ci.phone`;
            }
            if (scope === "full") {
                fields += `,
          ci.resume,
          ci.skills,
          ci.expected_salary,
          ci.current_salary,
          ci.address,
          ci.Links,
          ctry.name AS country_name
        `;
            }

            connection.query(
                `SELECT ${fields}
         FROM candidate_info ci
         JOIN account a ON a.id = ci.account_id
         LEFT JOIN cities city ON city.id = ci.city
         LEFT JOIN countries ctry ON ctry.id = ci.country
         WHERE ci.id = ?`,
                [candidate_id],
                (err2, data) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    if (!data.length) {
                        return res.status(404).json({ error: "Candidate not found." });
                    }

                    res.json({ success: true, scope, data: data[0] });
                }
            );
        }
    );
};

// ─── Get list of all unlocked candidates for an employer ─────────────────────
const getUnlockedCandidatesList = (req, res) => {
    const accountId = req.user.userId;

    connection.query(
        `SELECT 
      cu.candidate_id,
      cu.unlock_scope,
      cu.unlocked_at,
      ci.full_name,
      ci.total_experience,
      ci.gender,
      city.name AS city_name
    FROM candidate_unlocks cu
    JOIN candidate_info ci ON ci.id = cu.candidate_id
    LEFT JOIN cities city ON city.id = ci.city
    WHERE cu.employer_account_id = ?
    ORDER BY cu.unlocked_at DESC`,
        [accountId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, data: rows });
        }
    );
};

module.exports = {
    createCandidateUnlocksTable,
    getEmployerCreditBalance,
    unlockCandidateProfile,
    getUnlockedCandidateData,
    getUnlockedCandidatesList,
};