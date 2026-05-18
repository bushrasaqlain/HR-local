const cron = require("node-cron");
const connection = require("./connection");
const {
  getAlertSettings,
  createNotification,
  getNotifications,
} = require("./models/alertSettingsModel");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (used, total) =>
  total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;

const wasRecentlyNotified = (existingNotifications, type, packageName) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return existingNotifications.some(
    (n) =>
      n.notification_type === type &&
      n.package_name === packageName &&
      new Date(n.created_at) > cutoff
  );
};

// ─── Fetch all employer accounts ─────────────────────────────────────────────

const getAllEmployerAccounts = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT a.id as account_id
      FROM account a
      WHERE a.role = 'employer'
        AND a.status = 'active'
    `;
    connection.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ─── Fetch packages for a specific account (FIXED) ───────────────────────────

const fetchPackagesForAccount = (accountId) => {
  return new Promise((resolve, reject) => {
    const subsQuery = `
      SELECT 
        cp.id as subscription_id,
        cp.start_date,
        cp.end_date,
        cp.pricing_model,
        cp.status,
        cp.used_posts,
        cp.used_credits,
        cp.used_slots,
        cp.used_budget,
        cp.package_snapshot
      FROM company_packages cp
      WHERE cp.account_id = ?
        AND cp.status = 'active'
      ORDER BY cp.id DESC
    `;

    const dailyJobsQuery = `
      SELECT 
        id, job_title, status, billing_model,
        daily_budget  AS daily_budget_cap,
        spent_amount  AS total_spend,
        application_deadline
      FROM job_posts
      WHERE account_id = ?
        AND billing_model = 'daily_budget'
        AND status = 'active'
      ORDER BY created_at DESC
    `;

    connection.query(subsQuery, [accountId], (err, subsResult) => {
      if (err) return reject(err);

      connection.query(dailyJobsQuery, [accountId], (err2, dailyJobs) => {
        if (err2) return reject(err2);

        const packages = subsResult.map((p) => {
          let pkg = {};
          try {
            pkg =
              typeof p.package_snapshot === "string"
                ? JSON.parse(p.package_snapshot)
                : p.package_snapshot || {};
          } catch {}

          let total = 0;
          if (p.pricing_model === "featured_boost") {
            total = pkg.boost_duration_days || 0;
          } else if (p.pricing_model === "job_slot") {
            total = pkg.slot_count || 0;
          } else if (p.pricing_model === "cv_credits") {
            total = pkg.credit_count || 0;
          } else if (p.pricing_model === "duration_bundle") {
            total = pkg.num_posts || 0;
          } else {
            total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
          }

          const used = p.used_posts || p.used_credits || p.used_slots || 0;

          return {
            id: p.subscription_id,
            name: pkg.name || "Package",
            type: p.pricing_model,
            total,
            used,
            remaining: Math.max(total - used, 0),
            status: p.status,
            startDate: p.start_date || null,
            expiresRaw: p.end_date || null,
            isDailyBudget: false,
            dailyBudgetCap: 0,
            totalSpend: Number(p.used_budget) || 0,
          };
        });

        const dailyPackages = dailyJobs.map((job) => ({
          id: `job_${job.id}`,
          name: job.job_title,
          type: "daily_budget",
          total: 0,
          used: 0,
          remaining: 0,
          status: job.status,
          startDate: null,
          expiresRaw: job.application_deadline || null,
          isDailyBudget: true,
          dailyBudgetCap: Number(job.daily_budget_cap) || 0,
          totalSpend: Number(job.total_spend) || 0,
        }));

        resolve([...packages, ...dailyPackages]);
      });
    });
  });
};

// ─── Core alert checking logic ────────────────────────────────────────────────

const checkAndCreateAlerts = async (accountId) => {
  try {
    console.log(`🔍 Checking account: ${accountId}`);

    const [settings, packages, existingNotifs] = await Promise.all([
      getAlertSettings(accountId),
      fetchPackagesForAccount(accountId),
      getNotifications(accountId, 100),
    ]);

    console.log(`📦 Packages found: ${packages.length}`);
    console.log(`⚙️  Settings:`, JSON.stringify(settings));

    if (!packages.length) {
      console.log(`⚠️  No active packages for account ${accountId}, skipping.`);
      return;
    }

    const alertsToCreate = [];
    const now = new Date();

    // ── 1. Low Credits Alert ──────────────────────────────────────────────
    if (settings.lowCredits?.enabled) {
      const threshold = settings.lowCredits.threshold || 20;

      packages
        .filter((p) => !p.isDailyBudget && p.total > 0 && p.status === "active")
        .forEach((pkg) => {
          const usagePct = pct(pkg.used, pkg.total);
          const remainingPct = 100 - usagePct;

          if (remainingPct <= threshold && pkg.remaining > 0) {
            if (!wasRecentlyNotified(existingNotifs, "low_credits", pkg.name)) {
              alertsToCreate.push({
                accountId,
                type: "low_credits",
                title: "⚡ Low Credits Alert",
                message: `${pkg.name} has only ${pkg.remaining} ${
                  pkg.type === "cv_credits" ? "credits" : "units"
                } remaining (${remainingPct}% left). Consider purchasing more.`,
                packageName: pkg.name,
                severity: remainingPct <= 10 ? "critical" : "warning",
              });
            }
          }
        });
    }

    // ── 2. Package Expiry Alert ───────────────────────────────────────────
    if (settings.packageExpiry?.enabled) {
      const daysBefore = settings.packageExpiry.daysBefore || 7;

      packages
        .filter((p) => p.expiresRaw && p.status === "active")
        .forEach((pkg) => {
          const daysLeft = Math.ceil(
            (new Date(pkg.expiresRaw) - now) / (1000 * 60 * 60 * 24)
          );

          if (daysLeft > 0 && daysLeft <= daysBefore) {
            if (!wasRecentlyNotified(existingNotifs, "expiry", pkg.name)) {
              alertsToCreate.push({
                accountId,
                type: "expiry",
                title: "⏰ Package Expiring Soon",
                message: `${pkg.name} will expire in ${daysLeft} day${
                  daysLeft !== 1 ? "s" : ""
                } on ${new Date(pkg.expiresRaw).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}. Renew now to avoid interruption.`,
                packageName: pkg.name,
                severity: daysLeft <= 2 ? "critical" : "warning",
              });
            }
          }

          if (daysLeft <= 0) {
            if (!wasRecentlyNotified(existingNotifs, "expired", pkg.name)) {
              alertsToCreate.push({
                accountId,
                type: "expired",
                title: "🚫 Package Expired",
                message: `${pkg.name} has expired. Your job postings using this package may be paused.`,
                packageName: pkg.name,
                severity: "critical",
              });
            }
          }
        });
    }

    // ── 3. Budget Threshold Alert ─────────────────────────────────────────
    if (settings.budgetThreshold?.enabled) {
      const threshold = settings.budgetThreshold.threshold || 80;

      packages
        .filter((p) => p.isDailyBudget && p.dailyBudgetCap > 0)
        .forEach((pkg) => {
          const spendPct = pct(pkg.totalSpend, pkg.dailyBudgetCap);

          if (spendPct >= threshold) {
            if (!wasRecentlyNotified(existingNotifs, "budget_threshold", pkg.name)) {
              alertsToCreate.push({
                accountId,
                type: "budget_threshold",
                title: "💰 Budget Threshold Reached",
                message: `${pkg.name} has used ${spendPct}% of its daily budget (PKR ${pkg.totalSpend.toLocaleString(
                  "en-PK"
                )} of PKR ${pkg.dailyBudgetCap.toLocaleString("en-PK")}).`,
                packageName: pkg.name,
                severity: spendPct >= 95 ? "critical" : "warning",
              });
            }
          }
        });
    }

    // ── 4. Unusual Spending Alert (skipped until daily_spend_today tracked) ─
    // Requires a daily_spend_today column in job_posts — skipping for now

    // ── 5. Payment Method Missing ─────────────────────────────────────────
    const hasPendingPackages = packages.some((p) => p.status === "pending_payment");
    if (hasPendingPackages) {
      if (!wasRecentlyNotified(existingNotifs, "payment_missing", "Payment Method")) {
        alertsToCreate.push({
          accountId,
          type: "payment_missing",
          title: "💳 Payment Method Required",
          message:
            "You have job postings waiting to go live. Add a payment method in your wallet to activate them.",
          packageName: "Payment Method",
          severity: "critical",
        });
      }
    }

    // ── Insert all new alerts ─────────────────────────────────────────────
    if (alertsToCreate.length > 0) {
      await Promise.all(
        alertsToCreate.map((alert) =>
          createNotification(
            alert.accountId,
            alert.type,
            alert.title,
            alert.message,
            alert.packageName,
            alert.severity
          ).catch((err) =>
            console.error(`❌ createNotification failed:`, err.message)
          )
        )
      );
      console.log(`✅ Created ${alertsToCreate.length} alert(s) for account ${accountId}`);
    } else {
      console.log(`ℹ️  No new alerts needed for account ${accountId}`);
    }
  } catch (err) {
    console.error(`❌ Alert check failed for account ${accountId}:`, err.message);
  }
};

// ─── Cron Schedules ───────────────────────────────────────────────────────────

const startAlertCron = () => {
  // Main check — every hour
  cron.schedule("0 * * * *", async () => {
    console.log("🔔 Running hourly alert check...", new Date().toISOString());
    try {
      const accounts = await getAllEmployerAccounts();
      console.log(`   Checking ${accounts.length} employer account(s)...`);
      const batchSize = 10;
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        await Promise.all(batch.map((a) => checkAndCreateAlerts(a.account_id)));
      }
      console.log("✅ Hourly alert check complete");
    } catch (err) {
      console.error("❌ Cron job failed:", err.message);
    }
  });

  // Daily digest — every day at 9:00 AM PKT (4:00 UTC)
  cron.schedule("0 4 * * *", async () => {
    console.log("📊 Running daily digest check...", new Date().toISOString());
    try {
      const accounts = await getAllEmployerAccounts();

      for (const account of accounts) {
        const packages = await fetchPackagesForAccount(account.account_id);
        if (!packages.length) continue;

        const existingNotifs = await getNotifications(account.account_id, 10);
        if (wasRecentlyNotified(existingNotifs, "daily_digest", "Summary")) continue;

        const activePackages = packages.filter((p) => p.status === "active");
        const totalSpend = packages.reduce((s, p) => s + Number(p.totalSpend || 0), 0);
        const expiringSoon = packages.filter((p) => {
          if (!p.expiresRaw) return false;
          const days = Math.ceil(
            (new Date(p.expiresRaw) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return days > 0 && days <= 7;
        });

        await createNotification(
          account.account_id,
          "daily_digest",
          "📋 Daily Wallet Summary",
          `You have ${activePackages.length} active package(s). Total spend: PKR ${totalSpend.toLocaleString("en-PK")}.${
            expiringSoon.length
              ? ` ⚠️ ${expiringSoon.length} package(s) expiring within 7 days.`
              : ""
          }`,
          "Summary",
          "info"
        );
      }
      console.log("✅ Daily digest complete");
    } catch (err) {
      console.error("❌ Daily digest failed:", err.message);
    }
  });

  console.log("✅ Alert cron jobs started (hourly + 9AM digest)");
};

module.exports = { startAlertCron, checkAndCreateAlerts };