const dashboardModel = require("../models/dashboardModel");

const getDashboardStats = async (req, res) => {
    try {
        const data = await dashboardModel.getDashboardStats();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch dashboard stats",
            details: err.message
        });
    }
};

module.exports = {
    getDashboardStats
};