
const candidateModel = require("../models/candidateModel");
const { get } = require("../routes/accountRoutes");


const addCandidateInfo = (req, res) => {
    const passportPhotoFile = req.files?.passport_photo?.[0];
    const resumeFile = req.files?.resume?.[0];


    // Optional: attach paths so model can use them
    req.passportPhotoPath = passportPhotoFile ? passportPhotoFile.path : null;
    req.resumePath = resumeFile ? resumeFile.path : null;
    candidateModel.addCandidateInfo(req, res);
}

const getAllCandidates = (req, res) => {
    candidateModel.getAllCandidates(req, res);
}
const updateStatus = (req, res) => {
    const { id, status, userId } = req.params;
    candidateModel.updateStatus(id, status, userId, res);
}


const getCandidateInfo = (req, res) => {
    candidateModel.getCandidateInfo(req, res);
}
const editCandidateInfo = (req, res) => {
    if (req.file) {
        req.passportPhotoPath = req.file.path;
    } else if (req.files?.passport_photo?.[0]) {
        req.passportPhotoPath = req.files.passport_photo[0].path;
    }

    if (req.files?.resume?.[0]) {
        req.resumePath = req.files.resume[0].path;
    }

    candidateModel.editCandidateInfo(req, res);
};

const getCandidateInfobyId = (req, res) => {
    candidateModel.getCandidateInfobyId(req, res);
}
const getCandidateLogobyId = (req, res) => {
    candidateModel.getCandidateLogobyId(req, res);
}
const getCandidateFullProfilebyId = (req, res) => {
    candidateModel.getCandidateFullProfilebyId(req, res);
}
const getCandidateInfobyAccountType = (req, res) => {
    candidateModel.getCandidateInfobyAccountType(req, res);
}
const addResume = (req, res) => {
    const resumeFile = req.file;
    if (!resumeFile) {
        return res.status(400).json({ msg: "File is missing" });
    }

    // attach path to request for the model
    req.resumePath = `/uploads/resume/${resumeFile.filename}`;
    const userId = req.user.userId;
    candidateModel.addResume(userId, req.resumePath, res);
};

// ============ BOOST CONTROLLERS ============

const getBoostPackages = (req, res) => {
    candidateModel.getBoostPackages(req, res);
};
const placeBoostOrder = (req, res) => {
    candidateModel.placeBoostOrder(req, res);
};
const getMyBoostStatus = (req, res) => {
    candidateModel.getMyBoostStatus(req, res);
};
const getBoostOrders = (req, res) => {
    candidateModel.getBoostOrders(req, res);
};
const activateBoost = (req, res) => {
    candidateModel.activateBoost(req, res);
};
const rejectBoost = (req, res) => {
    candidateModel.rejectBoost(req, res);
};
const getCandidatesForJob = (req, res) => {
    candidateModel.getCandidatesForJob(req, res);
};
const getMatchingJobsForCandidate = (req, res) => {
    candidateModel.getMatchingJobsForCandidate(req, res);
};
const getAllCandidatesForEmployer = (req, res) => {
    candidateModel.getAllCandidatesForEmployer(req, res);
};
const parseCVAndSave = (req, res) => {
    const resumeFile = req.file;
    if (!resumeFile) {
        return res.status(400).json({ error: "No CV file uploaded" });
    }
    req.cvFile = resumeFile;
    candidateModel.parseCVAndSave(req, res);
};

const toggleSaveJob = (req, res) => {
    candidateModel.toggleSaveJob(req, res);
};

const getSavedJobs = (req, res) => {
    candidateModel.getSavedJobs(req, res);
};

const saveJobPreferences = (req, res) => {
    candidateModel.saveJobPreferences(req, res);
};

const getJobPreferences = (req, res) => {
    candidateModel.getJobPreferences(req, res);
};

const getJobAlerts = (req, res) => {
    candidateModel.getJobAlerts(req, res);
};

const markJobAlertRead = (req, res) => {
    candidateModel.markJobAlertRead(req, res);
};

const markAllJobAlertsRead = (req, res) => {
    candidateModel.markAllJobAlertsRead(req, res);
};

const getProfileViewStats = (req, res) => {
    candidateModel.getProfileViewStats(req, res);
};

const trackProfileView = (req, res) => {
    candidateModel.trackProfileView(req, res);
};

module.exports = {
    getAllCandidates,
    updateStatus,

    addCandidateInfo,
    getCandidateInfo,
    editCandidateInfo,
    getCandidateInfobyId,
    getCandidateLogobyId,
    getCandidateFullProfilebyId,
    getCandidateInfobyAccountType,
    addResume,

    getBoostPackages,
    placeBoostOrder,
    getMyBoostStatus,
    getBoostOrders,
    activateBoost,
    rejectBoost,
    getCandidatesForJob,
    getMatchingJobsForCandidate,
    getAllCandidatesForEmployer,
    parseCVAndSave,
    toggleSaveJob,
    getSavedJobs,
    saveJobPreferences,
    getJobPreferences,
    getJobAlerts,
    markJobAlertRead,
    markAllJobAlertsRead,
    getProfileViewStats,
    trackProfileView,
}