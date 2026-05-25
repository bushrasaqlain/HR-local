const revenurecordModel = require("../models/revenuerecordModel");


// ═══════════════════════════════════════════════════════════════════
//  ADMIN REVENUE CONTROLLER
// ═══════════════════════════════════════════════════════════════════


const revenueSummary = async (req, res) => {
  try {
    const data = await adminRevenueModel.getRevenueSummary(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const revenueByModel = async (req, res) => {
  try {
    const data = await adminRevenueModel.getRevenueByModel(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const revenueByPaymentMethod = async (req, res) => {
  try {
    const data = await adminRevenueModel.getRevenueByPaymentMethod(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const revenueTrend = async (req, res) => {
  try {
    const data = await adminRevenueModel.getMonthlyRevenueTrend(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const companyPackageTable = async (req, res) => {
  try {
    const data = await adminRevenueModel.getCompanyPackageTable(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const dailyBudgetRevenue = async (req, res) => {
  try {
    const data = await adminRevenueModel.getDailyBudgetRevenue(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const adminAlerts = async (req, res) => {
  try {
    const data = await adminRevenueModel.getAdminAlerts(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const companyRevenueDetail = async (req, res) => {
  try {
    const data = await adminRevenueModel.getCompanyRevenueDetail(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
  }
};

const revenueOverview = async (req, res) => {
  try {
    const data = await adminRevenueModel.getRevenueOverview(req);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.error, details: err.details });
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
};