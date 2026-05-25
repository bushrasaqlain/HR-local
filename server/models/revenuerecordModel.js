const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { generateToken } = require("../utils/jwt.js");
const logAudit = require("../utils/auditLogger.js");

const parseSnapshot = (raw) => {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw || {};
  } catch {
    return {};
  }
};

const computeConsumption = (pricingModel, row, snapshot) => {
  switch (pricingModel) {
    case "job_slot": {
      const total = snapshot.slot_count || 0;
      const used  = row.used_slots || 0;
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "slots",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    case "cv_credits": {
      const total = snapshot.credit_count || 0;
      const used  = row.used_credits || 0;
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "credits",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    case "duration_bundle": {
      const total = snapshot.num_posts || 0;
      const used  = row.used_posts || 0;
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "posts",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    case "daily_budget": {
      const total = parseFloat(snapshot.daily_budget_cap || row.daily_budget_cap || 0);
      const used  = parseFloat(row.used_budget || row.spent_amount || 0);
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "PKR",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    case "per_apply": {
      const total = snapshot.max_applies || 0;
      const used  = row.used_applies || 0;
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "applies",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    case "featured_boost": {
      // time-based: days remaining
      const total = snapshot.boost_duration_days || 0;
      const used  = row.days_elapsed || 0;
      return {
        total,
        used,
        remaining: Math.max(total - used, 0),
        unit: "days",
        pct: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
    default:
      return { total: 0, used: 0, remaining: 0, unit: "-", pct: 0 };
  }
};

const getRevenueSummary = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        -- Overall revenue (all Paid payments linked to a package)
        COALESCE(SUM(pay.amount), 0)                                      AS total_revenue,

        -- This calendar month
        COALESCE(SUM(CASE
          WHEN MONTH(pay.created_at) = MONTH(CURDATE())
           AND YEAR(pay.created_at)  = YEAR(CURDATE())
          THEN pay.amount ELSE 0 END), 0)                                 AS revenue_this_month,

        -- Last calendar month
        COALESCE(SUM(CASE
          WHEN MONTH(pay.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND YEAR(pay.created_at)  = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          THEN pay.amount ELSE 0 END), 0)                                 AS revenue_last_month,

        -- Distinct paying companies
        COUNT(DISTINCT pay.account_id)                                    AS total_companies,

        -- Active subscriptions right now
        (SELECT COUNT(*) FROM company_packages
         WHERE status = 'active' AND end_date >= CURDATE())               AS active_subscriptions,

        -- Expiring within 7 days (admin attention needed)
        (SELECT COUNT(*) FROM company_packages
         WHERE status = 'active'
           AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS expiring_soon

      FROM payment pay
      WHERE pay.payment_status = 'Paid'
        AND pay.package_id IS NOT NULL
    `;

    connection.query(sql, (err, rows) => {
      if (err) return reject(err);
      const r = rows[0];
      resolve({
        total_revenue:         parseFloat(r.total_revenue),
        revenue_this_month:    parseFloat(r.revenue_this_month),
        revenue_last_month:    parseFloat(r.revenue_last_month),
        total_companies:       r.total_companies,
        active_subscriptions:  r.active_subscriptions,
        expiring_soon:         r.expiring_soon,
        // MoM growth %
        mom_growth: r.revenue_last_month > 0
          ? parseFloat(
              (((r.revenue_this_month - r.revenue_last_month) / r.revenue_last_month) * 100).toFixed(1)
            )
          : null,
      });
    });
  });
};

const getRevenueByModel = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        p.pricing_model,
        COUNT(DISTINCT pay.account_id)  AS companies,
        COUNT(pay.id)                   AS transactions,
        SUM(pay.amount)                 AS revenue
      FROM payment pay
      JOIN packages p ON p.id = pay.package_id
      WHERE pay.payment_status = 'Paid'
      GROUP BY p.pricing_model
      ORDER BY revenue DESC
    `;

    connection.query(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({
        pricing_model: r.pricing_model,
        companies:     r.companies,
        transactions:  r.transactions,
        revenue:       parseFloat(r.revenue),
      })));
    });
  });
};

const getMonthlyRevenueTrend = (months = 6) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        DATE_FORMAT(pay.created_at, '%b %Y')  AS month_label,
        DATE_FORMAT(pay.created_at, '%Y-%m')  AS month_key,
        COALESCE(SUM(pay.amount), 0)           AS revenue,
        COUNT(DISTINCT pay.account_id)         AS companies,
        COUNT(pay.id)                          AS transactions
      FROM payment pay
      WHERE pay.payment_status = 'Paid'
        AND pay.package_id IS NOT NULL
        AND pay.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `;

    connection.query(sql, [months], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({
        ...r,
        revenue: parseFloat(r.revenue),
      })));
    });
  });
};

const getCompanyPackageTable = ({
  page          = 1,
  limit         = 15,
  search        = "",
  pricing_model = "",   // filter: job_slot | cv_credits | duration_bundle | daily_budget | all
  status        = "",   // filter: active | expired | used | cancelled | all
  sort          = "paid_at",
  order         = "DESC",
} = {}) => {
  return new Promise((resolve, reject) => {
    page  = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    const allowedSort = {
      paid_at:      "pay.created_at",
      revenue:      "pay.amount",
      company_name: "ci.company_name",
      end_date:     "cp.end_date",
      pricing_model:"cp.pricing_model",
    };
    const sortCol   = allowedSort[sort] || "pay.created_at";
    const sortOrder = order === "ASC" ? "ASC" : "DESC";

    // ── build WHERE conditions ──
    const conditions = ["pay.payment_status = 'Paid'", "pay.package_id IS NOT NULL"];
    const params     = [];

    if (search) {
      conditions.push(`(
        ci.company_name   LIKE ? OR
        a.username        LIKE ? OR
        pkg.name          LIKE ? OR
        ci.phone          LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (pricing_model && pricing_model !== "all") {
      conditions.push("cp.pricing_model = ?");
      params.push(pricing_model);
    }

    if (status && status !== "all") {
      conditions.push("cp.status = ?");
      params.push(status);
    }

    const where = "WHERE " + conditions.join(" AND ");

    const sql = `
      SELECT
        -- Company
        a.id                                      AS account_id,
        COALESCE(ci.company_name, a.username)     AS company_name,
        ci.phone,
        co.name                                   AS country,
        ci_city.name                              AS city,

        -- Subscription
        cp.id                                     AS subscription_id,
        cp.pricing_model,
        cp.status                                 AS sub_status,
        cp.start_date,
        cp.end_date,
        DATEDIFF(cp.end_date, CURDATE())          AS days_remaining,
        cp.used_posts,
        cp.used_credits,
        cp.used_slots,
        cp.used_budget,
        cp.used_applies,
        cp.package_snapshot,

        -- Package meta
        pkg.name                                  AS package_name,
        pkg.slot_count,
        pkg.credit_count,
        pkg.num_posts,
        pkg.daily_budget_cap,
        pkg.boost_duration_days,

        -- Revenue
        pay.id                                    AS payment_id,
        pay.amount                                AS revenue,
        pay.payment_method,
        pay.created_at                            AS paid_at,

        -- Days since last job post (activity signal)
        (SELECT DATEDIFF(CURDATE(), MAX(jp.created_at))
         FROM job_posts jp
         WHERE jp.account_id = a.id)              AS days_since_last_job

      FROM payment pay
      JOIN company_packages cp  ON cp.payment_id  = pay.id
      JOIN account a            ON a.id            = cp.account_id
      JOIN packages pkg         ON pkg.id          = pay.package_id
      LEFT JOIN company_info ci ON ci.account_id   = a.id
      LEFT JOIN countries co    ON co.id           = ci.country_id
      LEFT JOIN cities ci_city  ON ci_city.id      = ci.city_id
      ${where}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM payment pay
      JOIN company_packages cp  ON cp.payment_id  = pay.id
      JOIN account a            ON a.id            = cp.account_id
      JOIN packages pkg         ON pkg.id          = pay.package_id
      LEFT JOIN company_info ci ON ci.account_id   = a.id
      ${where}
    `;

    connection.query(sql, [...params, limit, offset], (err, rows) => {
      if (err) return reject(err);

      connection.query(countSql, params, (err2, countRows) => {
        if (err2) return reject(err2);

        const total = countRows[0]?.total || 0;

        // ── enrich each row with consumption + health signal ──
        const data = rows.map((row) => {
          const snapshot    = parseSnapshot(row.package_snapshot);
          const consumption = computeConsumption(row.pricing_model, row, snapshot);
          const daysLeft    = row.days_remaining ?? 0;

          // health: ok | warning | critical | inactive
          let health = "ok";
          if (row.sub_status !== "active") {
            health = "inactive";
          } else if (
            daysLeft <= 3 ||
            (consumption.pct >= 90 && consumption.total > 0)
          ) {
            health = "critical";
          } else if (
            daysLeft <= 7 ||
            (consumption.pct >= 70 && consumption.total > 0) ||
            (row.days_since_last_job !== null && row.days_since_last_job > 14)
          ) {
            health = "warning";
          }

          return {
            account_id:       row.account_id,
            company_name:     row.company_name,
            phone:            row.phone,
            country:          row.country,
            city:             row.city,
            subscription_id:  row.subscription_id,
            pricing_model:    row.pricing_model,
            package_name:     row.package_name || snapshot.name || "-",
            sub_status:       row.sub_status,
            start_date:       row.start_date,
            end_date:         row.end_date,
            days_remaining:   daysLeft,
            payment_id:       row.payment_id,
            revenue:          parseFloat(row.revenue),
            payment_method:   row.payment_method,
            paid_at:          row.paid_at,
            days_since_last_job: row.days_since_last_job,
            consumption,
            health,
          };
        });

        resolve({
          data,
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        });
      });
    });
  });
};

const getDailyBudgetRevenue = ({
  page  = 1,
  limit = 15,
  search = "",
} = {}) => {
  return new Promise((resolve, reject) => {
    page  = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    const conditions = ["jp.billing_model = 'daily_budget'"];
    const params     = [];

    if (search) {
      conditions.push(`(
        COALESCE(ci.company_name, a.username) LIKE ? OR
        jp.job_title LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s);
    }

    const where = "WHERE " + conditions.join(" AND ");

    const sql = `
      SELECT
        a.id                                    AS account_id,
        COALESCE(ci.company_name, a.username)   AS company_name,
        jp.id                                   AS job_id,
        jp.job_title,
        jp.daily_budget                         AS budget_cap,
        jp.spent_amount                         AS spent_today,
        jp.cost_per_click,
        jp.approval_status,
        jp.status,
        jp.application_deadline,
        jp.created_at,

        -- total charged via daily_budget_charges
        COALESCE((
          SELECT SUM(dbc.amount)
          FROM daily_budget_charges dbc
          WHERE dbc.job_id = jp.id AND dbc.status = 'success'
        ), 0)                                   AS total_charged

      FROM job_posts jp
      JOIN account a           ON a.id = jp.account_id
      LEFT JOIN company_info ci ON ci.account_id = a.id
      ${where}
      ORDER BY jp.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM job_posts jp
      JOIN account a ON a.id = jp.account_id
      LEFT JOIN company_info ci ON ci.account_id = a.id
      ${where}
    `;

    connection.query(sql, [...params, limit, offset], (err, rows) => {
      if (err) return reject(err);

      connection.query(countSql, params, (err2, countRows) => {
        if (err2) return reject(err2);

        resolve({
          data:        rows.map(r => ({
            ...r,
            budget_cap:    parseFloat(r.budget_cap),
            spent_today:   parseFloat(r.spent_today),
            total_charged: parseFloat(r.total_charged),
            burn_pct: r.budget_cap > 0
              ? Math.round((r.spent_today / r.budget_cap) * 100)
              : 0,
          })),
          total:       countRows[0]?.total || 0,
          page,
          limit,
          total_pages: Math.ceil((countRows[0]?.total || 0) / limit),
        });
      });
    });
  });
};

const getAdminAlerts = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        a.id                                    AS account_id,
        COALESCE(ci.company_name, a.username)   AS company_name,
        ci.phone,
        cp.id                                   AS subscription_id,
        cp.pricing_model,
        cp.status                               AS sub_status,
        cp.end_date,
        DATEDIFF(cp.end_date, CURDATE())        AS days_remaining,
        cp.used_posts,
        cp.used_credits,
        cp.used_slots,
        cp.used_budget,
        cp.used_applies,
        cp.package_snapshot,
        pkg.name                                AS package_name,
        pay.amount                              AS revenue

      FROM company_packages cp
      JOIN account a             ON a.id          = cp.account_id
      JOIN payment pay           ON pay.id         = cp.payment_id
      JOIN packages pkg          ON pkg.id         = cp.package_id
      LEFT JOIN company_info ci  ON ci.account_id  = a.id

      WHERE cp.status = 'active'
        AND (
          -- expiring within 7 days
          cp.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)

          -- OR high consumption (>80%) — checked in JS since data is in snapshot JSON
          OR cp.used_credits  > 0
          OR cp.used_posts    > 0
          OR cp.used_slots    > 0
        )
      ORDER BY days_remaining ASC
      LIMIT 50
    `;

    connection.query(sql, (err, rows) => {
      if (err) return reject(err);

      const alerts = [];

      rows.forEach((row) => {
        const snapshot    = parseSnapshot(row.package_snapshot);
        const consumption = computeConsumption(row.pricing_model, row, snapshot);
        const daysLeft    = row.days_remaining ?? 999;

        // ── expiry alerts ──
        if (daysLeft <= 3) {
          alerts.push({
            account_id:      row.account_id,
            company_name:    row.company_name,
            phone:           row.phone,
            subscription_id: row.subscription_id,
            pricing_model:   row.pricing_model,
            package_name:    row.package_name || snapshot.name,
            severity:        "critical",
            type:            "expiry",
            message:         `Package expires in ${daysLeft} day(s)`,
            days_remaining:  daysLeft,
            revenue:         parseFloat(row.revenue),
          });
        } else if (daysLeft <= 7) {
          alerts.push({
            account_id:      row.account_id,
            company_name:    row.company_name,
            phone:           row.phone,
            subscription_id: row.subscription_id,
            pricing_model:   row.pricing_model,
            package_name:    row.package_name || snapshot.name,
            severity:        "warning",
            type:            "expiry",
            message:         `Package expires in ${daysLeft} day(s)`,
            days_remaining:  daysLeft,
            revenue:         parseFloat(row.revenue),
          });
        }

        // ── consumption alerts (>80%) ──
        if (consumption.pct >= 90 && consumption.total > 0) {
          alerts.push({
            account_id:      row.account_id,
            company_name:    row.company_name,
            phone:           row.phone,
            subscription_id: row.subscription_id,
            pricing_model:   row.pricing_model,
            package_name:    row.package_name || snapshot.name,
            severity:        "critical",
            type:            "consumption",
            message:         `${consumption.used}/${consumption.total} ${consumption.unit} used (${consumption.pct}%)`,
            consumption,
            revenue:         parseFloat(row.revenue),
          });
        } else if (consumption.pct >= 75 && consumption.total > 0) {
          alerts.push({
            account_id:      row.account_id,
            company_name:    row.company_name,
            phone:           row.phone,
            subscription_id: row.subscription_id,
            pricing_model:   row.pricing_model,
            package_name:    row.package_name || snapshot.name,
            severity:        "warning",
            type:            "consumption",
            message:         `${consumption.used}/${consumption.total} ${consumption.unit} used (${consumption.pct}%)`,
            consumption,
            revenue:         parseFloat(row.revenue),
          });
        }
      });

      // sort: critical first, then warning
      alerts.sort((a, b) => {
        const order = { critical: 0, warning: 1 };
        return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
      });

      resolve(alerts);
    });
  });
};

const getCompanyRevenueDetail = (accountId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        cp.id                 AS subscription_id,
        cp.pricing_model,
        cp.status             AS sub_status,
        cp.start_date,
        cp.end_date,
        DATEDIFF(cp.end_date, CURDATE()) AS days_remaining,
        cp.used_posts,
        cp.used_credits,
        cp.used_slots,
        cp.used_budget,
        cp.used_applies,
        cp.package_snapshot,
        pkg.name              AS package_name,
        pay.amount            AS revenue,
        pay.payment_method,
        pay.created_at        AS paid_at
      FROM company_packages cp
      JOIN payment pay          ON pay.id        = cp.payment_id
      JOIN packages pkg         ON pkg.id        = cp.package_id
      WHERE cp.account_id = ?
      ORDER BY cp.created_at DESC
    `;

    connection.query(sql, [accountId], (err, rows) => {
      if (err) return reject(err);

      const subscriptions = rows.map((row) => {
        const snapshot    = parseSnapshot(row.package_snapshot);
        const consumption = computeConsumption(row.pricing_model, row, snapshot);
        return {
          subscription_id: row.subscription_id,
          pricing_model:   row.pricing_model,
          package_name:    row.package_name || snapshot.name,
          sub_status:      row.sub_status,
          start_date:      row.start_date,
          end_date:        row.end_date,
          days_remaining:  row.days_remaining,
          revenue:         parseFloat(row.revenue),
          payment_method:  row.payment_method,
          paid_at:         row.paid_at,
          consumption,
        };
      });

      const total_spent = subscriptions.reduce((s, r) => s + r.revenue, 0);

      resolve({ account_id: accountId, total_spent, subscriptions });
    });
  });
};

const getRevenueByPaymentMethod = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        payment_method,
        COUNT(*)        AS transactions,
        SUM(amount)     AS revenue
      FROM payment
      WHERE payment_status = 'Paid'
        AND package_id IS NOT NULL
      GROUP BY payment_method
      ORDER BY revenue DESC
    `;
    connection.query(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })));
    });
  });
};

module.exports = {
  getRevenueSummary,
  getRevenueByModel,
  getMonthlyRevenueTrend,
  getCompanyPackageTable,
  getDailyBudgetRevenue,
  getAdminAlerts,
  getCompanyRevenueDetail,
  getRevenueByPaymentMethod,
};