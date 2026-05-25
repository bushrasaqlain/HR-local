import React, { Component } from "react";
import { Container, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import api from "../../lib/api";

class AppliedJobs extends Component {
    state = {
        jobs: [],
        loading: true,
        filter: "all",
        selectedJob: null,
        showJobModal: false,
        jobDetails: null,
        loadingDetails: false,
    };

    componentDidMount() {
        this.fetchAppliedJobs();
    }

    fetchAppliedJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/applicant/applied-jobs", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const jobs = res.data.data || [];

            // Process jobs to add logo URLs
            const processedJobs = jobs.map(job => ({
                ...job,
                company_logo_url: job.company_logo ? `data:image/png;base64,${job.company_logo}` : null
            }));

            console.log("Processed jobs:", processedJobs);

            this.setState({
                jobs: processedJobs,
                loading: false,
            });
        } catch (err) {
            console.error("Failed to fetch applied jobs", err);
            this.setState({ loading: false });
        }
    };

    fetchJobDetails = async (jobId, applicationStatus) => {
        this.setState({ loadingDetails: true, showJobModal: true });

        try {
            const token = localStorage.getItem("token");

            // Fetch complete job details only - no separate company API call
            const res = await api.get(`/job/getSinglejob/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Find the job from state to get company logo
            const jobFromState = this.state.jobs.find(job => job.job_id === jobId);

            this.setState({
                jobDetails: {
                    ...res.data,
                    application_status: applicationStatus,
                    company_logo: jobFromState?.company_logo_url || null,
                    company_name: jobFromState?.company_name || res.data.company_name || "Company",
                },
                loadingDetails: false
            });
        } catch (err) {
            console.error("Failed to fetch job details", err);
            this.setState({ loadingDetails: false });
        }
    };

    openJobDetails = async (job) => {
        await this.fetchJobDetails(job.job_id, job.status);
    };

    closeModal = () => {
        this.setState({ showJobModal: false, jobDetails: null });
    };

    getStatusBadge = (status) => {
        const styles = {
            Approved: { bg: "#e8f5e9", color: "#2e7d32", text: "Approved" },
            Shortlisted: { bg: "#e3f2fd", color: "#1565c0", text: "Shortlisted" },
            Pending: { bg: "#fff3e0", color: "#e65100", text: "Pending" },
            Rejected: { bg: "#ffebee", color: "#c62828", text: "Rejected" }
        };
        const s = styles[status] || styles.Pending;
        return (
            <span style={{
                background: s.bg,
                color: s.color,
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                display: "inline-block"
            }}>
                {s.text}
            </span>
        );
    };

    getFilterCount = (status) => {
        const { jobs } = this.state;
        if (status === "all") return jobs.length;
        return jobs.filter(job => job.status === status).length;
    };

    formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    formatSalary = (min, max, currency) => {
        if (!min && !max) return "Not specified";
        const formatNum = (num) => {
            if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
            return num;
        };
        if (min && max) return `${currency || "PKR"} ${formatNum(min)} - ${formatNum(max)}`;
        if (min) return `${currency || "PKR"} ${formatNum(min)}+`;
        if (max) return `Up to ${currency || "PKR"} ${formatNum(max)}`;
        return "Not specified";
    };

    renderJobDetailsModal = () => {
        const { showJobModal, jobDetails, loadingDetails } = this.state;

        if (!showJobModal) return null;

        return (
            <Modal
                isOpen={showJobModal}
                toggle={this.closeModal}
                size="lg"
                style={{ maxWidth: "800px", margin: "1.75rem auto" }}
            >
                <ModalHeader toggle={this.closeModal} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    Job Details
                </ModalHeader>
                <ModalBody style={{ padding: "24px" }}>
                    {loadingDetails ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <Spinner />
                            <p style={{ marginTop: "16px", color: "#7f8c8d" }}>Loading job details...</p>
                        </div>
                    ) : jobDetails ? (
                        <>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                marginBottom: "24px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #e0e0e0"
                            }}>
                                {jobDetails.company_logo ? (
                                    <img
                                        src={jobDetails.company_logo}
                                        alt={jobDetails.company_name}
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            objectFit: "cover",
                                            borderRadius: "12px",
                                            border: "1px solid #e0e0e0"
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: "64px",
                                        height: "64px",
                                        background: "#f0f0f0",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "24px",
                                        color: "#999"
                                    }}>
                                        🏢
                                    </div>
                                )}
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#2c3e50" }}>
                                        {jobDetails.job_title}
                                    </h3>
                                    <p style={{ margin: "4px 0 0", color: "#7f8c8d", fontSize: "14px" }}>
                                        {jobDetails.company_name}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Job Type</label>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2c3e50" }}>{jobDetails.job_type || "Full Time"}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Location Type</label>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2c3e50" }}>{jobDetails.job_location_type || "On-site"}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Salary Range</label>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2a4249" }}>
                                        {this.formatSalary(jobDetails.min_salary, jobDetails.max_salary, jobDetails.currency)}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Experience Required</label>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2c3e50" }}>
                                        {jobDetails.min_experience && jobDetails.max_experience
                                            ? `${jobDetails.min_experience} - ${jobDetails.max_experience}`
                                            : "Not specified"}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Location</label>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2c3e50" }}>
                                        {jobDetails.country || "Pakistan"}
                                        {jobDetails.city && `, ${jobDetails.city}`}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "4px" }}>Application Status</label>
                                    <div>{this.getStatusBadge(jobDetails.application_status || "Pending")}</div>
                                </div>
                            </div>

                            {jobDetails.job_description && (
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "8px" }}>Job Description</label>
                                    <div style={{
                                        fontSize: "14px",
                                        color: "#555",
                                        lineHeight: "1.6",
                                        background: "#f8f9fa",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        maxHeight: "200px",
                                        overflowY: "auto"
                                    }}>
                                        {jobDetails.job_description}
                                    </div>
                                </div>
                            )}

                            {jobDetails.skills && jobDetails.skills.length > 0 && (
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ fontSize: "12px", color: "#95a5a6", display: "block", marginBottom: "8px" }}>Required Skills</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {(Array.isArray(jobDetails.skills) ? jobDetails.skills : jobDetails.skills.split(",")).map((skill, idx) => (
                                            <span key={idx} style={{
                                                background: "#e3f2fd",
                                                color: "#1565c0",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: 500
                                            }}>
                                                {typeof skill === 'string' ? skill.trim() : skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </ModalBody>
                <ModalFooter style={{ borderTop: "1px solid #e0e0e0" }}>
                    <button
                        onClick={this.closeModal}
                        style={{
                            background: "#2c3e50",
                            color: "white",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        Close
                    </button>
                </ModalFooter>
            </Modal>
        );
    };

    render() {
        const { jobs, loading, filter } = this.state;

        const filteredJobs = filter === "all"
            ? jobs
            : jobs.filter(job => job.status === filter);

        const statusCounts = {
            all: jobs.length,
            Approved: jobs.filter(j => j.status === "Approved").length,
            Shortlisted: jobs.filter(j => j.status === "Shortlisted").length,
            Pending: jobs.filter(j => j.status === "Pending").length,
            Rejected: jobs.filter(j => j.status === "Rejected").length,
        };

        return (
            <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "24px 0 80px 0" }}>
                <Container>
                    <style>{`
                        @media (max-width: 1024px) {
                            .jobs-grid { grid-template-columns: repeat(2, 1fr) !important; }
                        }
                        @media (max-width: 600px) {
                            .jobs-grid { grid-template-columns: 1fr !important; }
                        }
                            .filter-tabs::-webkit-scrollbar { display: none; }
                    `}</style>
                    {/* Page Title */}
                    <div style={{ marginBottom: "24px" }}>
                        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600, color: "#2c3e50" }}>Applied Jobs</h2>
                        <p style={{ margin: "8px 0 0", color: "#7f8c8d", fontSize: "14px" }}>Track your job applications</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-tabs" style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "24px",
                        borderBottom: "1px solid #e0e0e0",
                        paddingBottom: "12px",
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        flexWrap: "nowrap",
                    }}>
                        {[
                            { key: "all", label: "All", count: statusCounts.all },
                            { key: "Approved", label: "Approved", count: statusCounts.Approved },
                            { key: "Shortlisted", label: "Shortlisted", count: statusCounts.Shortlisted },
                            { key: "Pending", label: "Pending", count: statusCounts.Pending },
                            { key: "Rejected", label: "Rejected", count: statusCounts.Rejected },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => this.setState({ filter: tab.key })}
                                style={{
                                    background: filter === tab.key ? "#2c3e50" : "transparent",
                                    color: filter === tab.key ? "white" : "#7f8c8d",
                                    border: "none",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Jobs List */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "12px" }}>
                            <Spinner />
                            <p style={{ marginTop: "16px", color: "#7f8c8d" }}>Loading...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "12px" }}>
                            <p style={{ color: "#7f8c8d" }}>No applications found</p>
                        </div>
                    ) : (
                        <div className="jobs-grid" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "16px",
                        }}>
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.application_id}
                                    style={{
                                        background: "white",
                                        borderRadius: "12px",
                                        padding: "20px",
                                        border: "1px solid #e0e0e0",
                                        transition: "all 0.2s",
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                        e.currentTarget.style.borderColor = "#c0c0c0";
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.borderColor = "#e0e0e0";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                    onClick={() => this.openJobDetails(job)}
                                >
                                    {/* Top: Logo + Status */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        {job.company_logo_url ? (
                                            <img
                                                src={job.company_logo_url}
                                                alt={job.company_name}
                                                style={{
                                                    width: "50px", height: "50px",
                                                    objectFit: "cover", borderRadius: "8px",
                                                    border: "1px solid #e0e0e0"
                                                }}
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: "44px", height: "44px",
                                                background: "#f0f0f0", borderRadius: "8px",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "center", fontSize: "18px", color: "#999"
                                            }}>
                                                🏢
                                            </div>
                                        )}
                                        {this.getStatusBadge(job.status)}
                                    </div>

                                    {/* Job Title */}
                                    <div>
                                        <h3 style={{
                                            margin: "0 0 4px", fontSize: "16px",
                                            fontWeight: 700, color: "#2c3e50",
                                            lineHeight: "1.3",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden"
                                        }}>
                                            {job.job_title}
                                        </h3>
                                        <p style={{
                                            margin: 0, fontSize: "14px",
                                            color: "#6b6b6b", fontWeight: 600
                                        }}>
                                            {job.company_name || "Company"}
                                        </p>
                                    </div>

                                    {/* Meta info */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {job.city_name && (
                                            <div style={{ fontSize: "13px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: 600, minWidth: "70px" }}>Location:</span>
                                                <span style={{ color: "#333" }}>{job.city_name}</span>
                                            </div>
                                        )}
                                        {job.job_type && (
                                            <div style={{ fontSize: "13px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: 600, minWidth: "70px" }}>Job Type:</span>
                                                <span style={{ color: "#333" }}>{job.job_type}</span>
                                            </div>
                                        )}
                                        {job.min_salary && (
                                            <div style={{ fontSize: "13px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: 600, minWidth: "70px" }}>Salary:</span>
                                                <span style={{ color: "#2a4249", fontWeight: 500 }}>
                                                    {this.formatSalary(job.min_salary, job.max_salary, job.currency)}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: "13px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontWeight: 600, minWidth: "70px" }}>Applied on:</span>
                                            <span style={{ color: "#333" }}>{this.formatDate(job.created_at)}</span>
                                        </div>
                                    </div>
                                    {/* Buttons */}
                                    <div style={{
                                        display: "flex", gap: "8px",
                                        marginTop: "auto", flexWrap: "wrap"
                                    }}>
                                        {job.status === "Pending" && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const confirmed = window.confirm("Cancel this application?");
                                                    if (confirmed) {
                                                        try {
                                                            const token = localStorage.getItem("token");
                                                            await api.post("/applicant/cancel-application",
                                                                { job_id: job.job_id },
                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                            );
                                                            alert("Application cancelled");
                                                            this.fetchAppliedJobs();
                                                        } catch (err) {
                                                            alert(err.response?.data?.message || "Failed to cancel");
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    flex: 1, background: "#fee2e2", color: "#dc2626",
                                                    border: "1px solid #fca5a5", borderRadius: "6px",
                                                    padding: "6px 10px", fontSize: "12px",
                                                    fontWeight: 500, cursor: "pointer",
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#fecaca"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "#fee2e2"}
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); this.openJobDetails(job); }}
                                            style={{
                                                flex: 1, background: "#2a4249", color: "white",
                                                border: "none", borderRadius: "6px",
                                                padding: "6px 10px", fontSize: "12px",
                                                fontWeight: 500, cursor: "pointer",
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#2a4249"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "#2a4249"}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Container>

                {this.renderJobDetailsModal()}
            </div>
        );
    }
}

export default AppliedJobs;