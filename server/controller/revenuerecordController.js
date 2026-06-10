const revenuerecordModel = require("../models/revenuerecordModel");


// ═══════════════════════════════════════════════════════════════════
//  ADMIN REVENUE CONTROLLER
// ═══════════════════════════════════════════════════════════════════


const revenueSummary = async (req, res) => {
  try {
    const data = await revenuerecordModel.getRevenueSummary(); // no argument
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const revenueByModel = async (req, res) => {
  try {
    const data = await revenuerecordModel.getRevenueByModel(); // no argument
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const revenueByPaymentMethod = async (req, res) => {
  try {
    const data = await revenuerecordModel.getRevenueByPaymentMethod(); // no argument
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const revenueTrend = async (req, res) => {
  try {
    const data = await revenuerecordModel.getMonthlyRevenueTrend(); // no argument
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const companyPackageTable = async (req, res) => {
  try {
    const data = await revenuerecordModel.getCompanyPackageTable(req.query); // ← req.query
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const dailyBudgetRevenue = async (req, res) => {
  try {
    const data = await revenuerecordModel.getDailyBudgetRevenue(req.query); // ← req.query
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminAlerts = async (req, res) => {
  try {
    const data = await revenuerecordModel.getAdminAlerts(); // no argument
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const companyRevenueDetail = async (req, res) => {
  try {
    const data = await revenuerecordModel.getCompanyRevenueDetail(req.params.accountId); // ← params
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const revenueOverview = async (req, res) => {
  try {
    const [summary, trend, byModel, byMethod, alerts] = await Promise.all([
      revenuerecordModel.getRevenueSummary(),
      revenuerecordModel.getMonthlyRevenueTrend(6),
      revenuerecordModel.getRevenueByModel(),
      revenuerecordModel.getRevenueByPaymentMethod(),
      revenuerecordModel.getAdminAlerts(),
    ]);

    res.status(200).json({
      data: {
        summary,
        trend,
        by_model:           byModel,
        by_payment_method:  byMethod,
        alerts: { items: alerts },
      },
    });
  } catch (err) {
    console.error("revenueOverview error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};
const dailySpendByJob = async (req, res) => {
  try {
    const data = await revenuerecordModel.getDailySpendByJob(req.params.jobId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const dailySpendByAccount = async (req, res) => {
  try {
    const { days } = req.query;
    const data = await revenuerecordModel.getDailySpendByAccount(req.params.accountId, days);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const issueRefund = async (req, res) => {
  try {
    const { account_id, payment_id, job_id, amount, description } = req.body;
    if (!account_id || !amount) return res.status(400).json({ error: "account_id and amount required" });
    const id = await revenuerecordModel.logRefund({ account_id, payment_id, job_id, amount, description });
    res.status(200).json({ success: true, billing_event_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const issueAdjustment = async (req, res) => {
  try {
    const { account_id, amount, description } = req.body;
    if (!account_id || amount === undefined) return res.status(400).json({ error: "account_id and amount required" });
    const id = await revenuerecordModel.logAdjustment({ account_id, amount, description });
    res.status(200).json({ success: true, billing_event_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const refundHistory = async (req, res) => {
  try {
    const data = await revenuerecordModel.getRefundHistory(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  revenueSummary,
  revenueByModel,
  revenueByPaymentMethod,
  revenueTrend,
  companyPackageTable,
  dailyBudgetRevenue,
  adminAlerts,
  companyRevenueDetail,
  revenueOverview,
  dailySpendByJob,
  dailySpendByAccount,
  issueRefund,
  issueAdjustment,
  refundHistory
};