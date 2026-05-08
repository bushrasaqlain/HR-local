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

// Prevent duplicate alerts — checks if same type + package was notified in last 24hrs
const wasRecentlyNotified = (existingNotifications, type, packageName) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  return existingNotifications.some(
    (n) =>
      n.notification_type === type &&
      n.package_name === packageName &&
      new Date(n.created_at) > cutoff
  );
};

// ─── Fetch all employer accounts with alert settings ─────────────────────────

const getAllEmployerAccounts = () => {
  return new Promise((resolve, reject) => {
    // Get all employer accounts that have alert settings configured
    // Falls back to all employer accounts so even default settings are checked
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

// ─── Fetch packages for a specific user ──────────────────────────────────────

const getUserPackages = (accountId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        us.subscription_id,
        us.status,
        us.end_date,
        us.is_daily_budget,
        us.used_posts,
        us.used_credits,
        us.used_slots,
        us.package
      FROM user_subscriptions us
      WHERE us.account_id = ?
        AND us.status IN ('active', 'pending_payment')
    `;
    connection.query(query, [accountId], (err, results) => {
      if (err) return reject(err);

      const packages = results.map((p) => {
        let pkg = {};
        try {
          pkg = typeof p.package === "string" ? JSON.parse(p.package) : p.package || {};
        } catch {}

        let total = 0;
        if (pkg.pricing_model === "featured_boost") {
          total = pkg.boost_duration_days || 0;
        } else if (pkg.pricing_model === "job_slot") {
          total = pkg.slot_count || 0;
        } else if (pkg.pricing_model === "cv_credits") {
          total = pkg.credit_count || 0;
        } else {
          total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
        }

        const used = p.used_posts || p.used_credits || p.used_slots || 0;

        return {
          id: p.subscription_id,
          name: pkg.name || "Package",
          type: pkg.pricing_model || "bundle",
          total,
          used,
          remaining: Math.max(total - used, 0),
          price: pkg.price || 0,
          status: p.status,
          expiresRaw: p.end_date || null,
          isDailyBudget: p.is_daily_budget || false,
          dailyBudgetCap: pkg.daily_budget_cap || 0,
          totalSpend: pkg.total_spend || 0,
          billingModel: pkg.billing_model || null,
        };
      });

      resolve(packages);
    });
  });
};

// ─── Core alert checking logic ────────────────────────────────────────────────

const checkAndCreateAlerts = async (accountId) => {
  try {
    const [settings, packages, existingNotifs] = await Promise.all([
      getAlertSettings(accountId),
      getUserPackages(accountId),
      getNotifications(accountId, 100), // last 100 to check duplicates
    ]);

    if (!packages.length) return;

    const alertsToCreate = [];
    const now = new Date();

    // ── 1. Low Credits Alert ────────────────────────────────────────────────
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

    // ── 2. Package Expiry Alert ─────────────────────────────────────────────
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

          // Package already expired — notify once
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

    // ── 3. Budget Threshold Alert (daily budget packages) ──────────────────
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

    // ── 4. Unusual Spending Alert ───────────────────────────────────────────
    if (settings.unusualSpending?.enabled) {
      const sensitivity = settings.unusualSpending.sensitivity || "medium";

      // Spike multiplier based on sensitivity setting
      const spikeMultiplier = { low: 3, medium: 2, high: 1.5 }[sensitivity] || 2;

      packages
        .filter((p) => p.isDailyBudget && p.totalSpend > 0)
        .forEach((pkg) => {
          // Simple heuristic: if today's spend > spikeMultiplier * (totalSpend / daysActive)
          // This is a basic version — you can make this more sophisticated later
          const createdDaysAgo = pkg.expiresRaw
            ? Math.max(
                1,
                Math.ceil(
                  (now - new Date(pkg.expiresRaw)) / (1000 * 60 * 60 * 24) * -1
                )
              )
            : 1;

          const avgDailySpend = pkg.totalSpend / createdDaysAgo;
          const todaySpend = pkg.dailySpendToday || 0;

          if (todaySpend > avgDailySpend * spikeMultiplier && todaySpend > 100) {
            if (!wasRecentlyNotified(existingNotifs, "unusual_spending", pkg.name)) {
              alertsToCreate.push({
                accountId,
                type: "unusual_spending",
                title: "📊 Unusual Spend Detected",
                message: `${pkg.name} is spending ${spikeMultiplier}x faster than your daily average. Today: PKR ${todaySpend.toLocaleString(
                  "en-PK"
                )} vs avg PKR ${Math.round(avgDailySpend).toLocaleString("en-PK")}.`,
                packageName: pkg.name,
                severity: "warning",
              });
            }
          }
        });
    }

    // ── 5. Payment Method Missing (always check) ────────────────────────────
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

    // ── Insert all new alerts ───────────────────────────────────────────────
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
          )
        )
      );

      console.log(
        `✅ Created ${alertsToCreate.length} alert(s) for account ${accountId}`
      );
    }
  } catch (err) {
    console.error(`❌ Alert check failed for account ${accountId}:`, err.message);
  }
};

// ─── Cron Schedules ───────────────────────────────────────────────────────────

const startAlertCron = () => {
  // Main check — every hour at :00
  cron.schedule("0 * * * *", async () => {
    console.log("🔔 Running hourly alert check...", new Date().toISOString());

    try {
      const accounts = await getAllEmployerAccounts();
      console.log(`   Checking ${accounts.length} employer account(s)...`);

      // Process in batches of 10 to avoid overwhelming DB
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

  // Critical-only check — every 15 minutes (payment missing, zero budget)
  cron.schedule("*/15 * * * *", async () => {
    try {
      const accounts = await getAllEmployerAccounts();

      for (const account of accounts) {
        const packages = await getUserPackages(account.account_id);
        const existingNotifs = await getNotifications(account.account_id, 50);

        // Only check payment_missing on the fast cycle
        const hasPending = packages.some((p) => p.status === "pending_payment");
        if (hasPending) {
          if (
            !wasRecentlyNotified(
              existingNotifs,
              "payment_missing",
              "Payment Method"
            )
          ) {
            await createNotification(
              account.account_id,
              "payment_missing",
              "💳 Payment Method Required",
              "You have job postings waiting to go live. Add a payment method to activate them.",
              "Payment Method",
              "critical"
            );
          }
        }
      }
    } catch (err) {
      console.error("❌ Fast-cycle cron failed:", err.message);
    }
  });

  // Daily digest — every day at 9:00 AM PKT (4:00 UTC)
  cron.schedule("0 4 * * *", async () => {
    console.log("📊 Running daily digest check...", new Date().toISOString());

    try {
      const accounts = await getAllEmployerAccounts();

      for (const account of accounts) {
        const packages = await getUserPackages(account.account_id);
        if (!packages.length) continue;

        const existingNotifs = await getNotifications(account.account_id, 10);
        if (wasRecentlyNotified(existingNotifs, "daily_digest", "Summary")) continue;

        const activePackages = packages.filter((p) => p.status === "active");
        const totalSpend = packages.reduce((s, p) => s + Number(p.price || 0), 0);
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
          `You have ${activePackages.length} active package(s). Total spend: PKR ${totalSpend.toLocaleString(
            "en-PK"
          )}.${
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

  console.log("✅ Alert cron jobs started (hourly + 15min critical + 9AM digest)");
};

module.exports = { startAlertCron, checkAndCreateAlerts };
