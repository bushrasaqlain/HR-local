import React, { Component } from "react";
import { Container, Card, CardBody, CardHeader } from "reactstrap";
import api from "../../lib/api";
import Head from "next/head";

class SavedJobsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            savedJobs: [],
            loading: true,
            selectedJob: null,
            showJobModal: false,
        };
    }

    componentDidMount() {
        this.fetchSavedJobs();
    }

    fetchSavedJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/candidateProfile/saved-jobs", {
                headers: { Authorization: `Bearer ${token}` },
            });
            this.setState({ savedJobs: res.data.data || [], loading: false });
        } catch (err) {
            console.error("Failed to fetch saved jobs", err);
            this.setState({ loading: false });
        }
    };

    handleUnsave = async (e, jobId) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/candidateProfile/save-job",
                { job_id: jobId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            this.setState(prev => ({
                savedJobs: prev.savedJobs.filter(j => j.job_id !== jobId),
            }));
        } catch (err) {
            console.error("Unsave failed", err);
        }
    };

    handleJobClick = async (jobId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`/job/getSinglejob/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            this.setState({ selectedJob: res.data, showJobModal: true });
        } catch (err) {
            console.error("Job details fetch failed", err);
        }
    };

    render() {
        const { savedJobs, loading, selectedJob, showJobModal } = this.state;

        return (
            <Container fluid>
                <Head><title>Saved Jobs</title></Head>

                <div className="row mt-3">
                    <div className="col-12" style={{paddingTop: "10px"}}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <button
                                    onClick={() => this.props.onBack && this.props.onBack()}
                                    style={{
                                        background: "#fff", color: "#36565F",
                                        border: "1.5px solid #36565F",
                                        borderRadius: "8px", padding: "5px 14px",
                                        fontSize: "12px", fontWeight: 600,
                                        cursor: "pointer", margin: "12px",
                                    }}
                                >
                                    ← Back to Dashboard
                                </button>
                                <div>
                                    <strong>Saved Jobs</strong>
                                    <small className="text-muted ms-2">
                                        {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
                                    </small>
                                </div>
                            </CardHeader>
                            <CardBody>
                                {loading ? (
                                    <p className="text-muted small">Loading...</p>
                                ) : savedJobs.length === 0 ? (
                                    <div style={{
                                        textAlign: "center", padding: "48px 24px",
                                        color: "#6b7280",
                                    }}>
                                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤍</div>
                                        <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
                                            No saved jobs yet
                                        </div>
                                        <div style={{ fontSize: "13px" }}>
                                            Go to your dashboard and click ❤️ on any job to save it here.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {savedJobs.map(job => (
                                            <div
                                                key={job.job_id}
                                                onClick={() => this.handleJobClick(job.job_id)}
                                                style={{
                                                    display: "flex", alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "14px 16px",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    transition: "border-color 0.15s",
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = "#36565F"}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    {job.logo ? (
                                                        <img
                                                            src={`data:image/png;base64,${job.logo}`}
                                                            alt={job.company_name}
                                                            style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: 44, height: 44, borderRadius: 8,
                                                            background: "#f3f4f6", display: "flex",
                                                            alignItems: "center", justifyContent: "center",
                                                            fontSize: 20, color: "#9ca3af",
                                                        }}>🏢</div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                                                            {job.job_title}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: "2px" }}>
                                                            {job.company_name} • {job.city_name}
                                                        </div>
                                                        {job.min_salary && (
                                                            <div style={{ fontSize: 12, color: "#059669", marginTop: "2px" }}>
                                                                {job.currency} {job.min_salary} – {job.max_salary}
                                                            </div>
                                                        )}
                                                        {/* Badges */}
                                                        <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                                                            {job.job_type && (
                                                                <span style={{
                                                                    fontSize: 11, background: "#f3f4f6",
                                                                    color: "#374151", borderRadius: 20,
                                                                    padding: "2px 10px", fontWeight: 500,
                                                                }}>
                                                                    {job.job_type}
                                                                </span>
                                                            )}
                                                            {job.min_experience && (
                                                                <span style={{
                                                                    fontSize: 11, background: "#dbeafe",
                                                                    color: "#1e40af", borderRadius: 20,
                                                                    padding: "2px 10px", fontWeight: 500,
                                                                }}>
                                                                    {job.min_experience} – {job.max_experience} 
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => this.handleUnsave(e, job.job_id)}
                                                    style={{
                                                        background: "#fff0f0", border: "1px solid #fecaca",
                                                        borderRadius: "8px", padding: "6px 14px",
                                                        fontSize: "12px", fontWeight: 600,
                                                        color: "#dc2626", cursor: "pointer",
                                                        flexShrink: 0, marginLeft: "12px",
                                                    }}
                                                    title="Remove from saved"
                                                >
                                                    ❤️ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {showJobModal && selectedJob && (
                    <div
                        onClick={() => this.setState({ showJobModal: false, selectedJob: null })}
                        style={{
                            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 9999, padding: "16px",
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: "#fff", borderRadius: "14px",
                                padding: "24px", width: "100%", maxWidth: "560px",
                                maxHeight: "85vh", overflowY: "auto", position: "relative",
                            }}
                        >
                            <button
                                onClick={() => this.setState({ showJobModal: false, selectedJob: null })}
                                style={{
                                    position: "absolute", top: "16px", right: "16px",
                                    background: "#fee2e2", border: "none", borderRadius: "50%",
                                    width: "32px", height: "32px", cursor: "pointer",
                                    color: "#991b1b", fontWeight: 700, fontSize: "16px",
                                }}
                            >×</button>

                            <h5 style={{ marginBottom: "4px", paddingRight: "40px" }}>
                                {selectedJob.job_title}
                            </h5>
                            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                                {selectedJob.speciality} • {selectedJob.city} • {selectedJob.country}
                            </p>

                            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                                {selectedJob.min_salary && (
                                    <span style={{
                                        background: "#d1fae5", color: "#065f46",
                                        borderRadius: "20px", padding: "4px 12px",
                                        fontSize: "12px", fontWeight: 600,
                                    }}>
                                        💰 {selectedJob.currency} {selectedJob.min_salary} – {selectedJob.max_salary}
                                    </span>
                                )}
                                {selectedJob.min_experience && (
                                    <span style={{
                                        background: "#dbeafe", color: "#1e40af",
                                        borderRadius: "20px", padding: "4px 12px",
                                        fontSize: "12px", fontWeight: 600,
                                    }}>
                                        🕒 {selectedJob.min_experience} – {selectedJob.max_experience}
                                    </span>
                                )}
                            </div>

                            {selectedJob.job_description && (
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                                        Job Description
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6", margin: 0 }}>
                                        {selectedJob.job_description}
                                    </p>
                                </div>
                            )}

                            {selectedJob.application_deadline && (
                                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                    Deadline:{" "}
                                    <span style={{ fontWeight: 600, color: "#374151" }}>
                                        {new Date(selectedJob.application_deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Container>
        );
    }
}

export default SavedJobsPage;