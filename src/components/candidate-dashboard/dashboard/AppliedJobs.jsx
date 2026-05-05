import React, { Component } from "react";
import { Card, CardBody, CardHeader, Container } from "reactstrap";
import api from "../../lib/api";

class AppliedJobs extends Component {
    state = {
        jobs: [],
        loading: true,
    };

    componentDidMount() {
        this.fetchAppliedJobs();
    }

    fetchAppliedJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/applicant/applied-jobs", { headers: { Authorization: `Bearer ${token}` } });

            this.setState({
                jobs: res.data.data || [],
                loading: false,
            });
        } catch (err) {
            console.error("Failed to fetch applied jobs", err);
            this.setState({ loading: false });
        }
    };

    getStatusStyle = (status) => {
        switch (status) {
            case "Approved":
                return { background: "#d1fae5", color: "#065f46" };
            case "Rejected":
                return { background: "#fee2e2", color: "#991b1b" };
            default:
                return { background: "#fef3c7", color: "#92400e" };
        }
    };

    render() {
        const { jobs, loading } = this.state;

        return (
            <Container fluid>
                <div className="mt-3">
                    <Card>
                        <CardHeader>
                            <strong>My Applied Jobs</strong>
                        </CardHeader>

                        <CardBody>
                            {loading ? (
                                <p>Loading...</p>
                            ) : jobs.length === 0 ? (
                                <p className="text-muted">You have not applied to any jobs yet.</p>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {jobs.map((job) => (
                                        <div
                                            key={job.application_id}
                                            className="d-flex justify-content-between align-items-center p-3"
                                            style={{
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                            }}
                                        >
                                            {/* LEFT SIDE */}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 15 }}>
                                                    {job.job_title}
                                                </div>

                                                <div style={{ fontSize: 13, color: "#6b7280" }}>
                                                    {job.company_name} • {job.city_name}
                                                </div>

                                                {job.min_salary && (
                                                    <div style={{ fontSize: 12, color: "#059669" }}>
                                                        {job.currency} {job.min_salary} - {job.max_salary}
                                                    </div>
                                                )}

                                                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    Applied on:{" "}
                                                    {new Date(job.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* RIGHT SIDE */}
                                            <div>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        ...this.getStatusStyle(job.status),
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </Container>
        );
    }
}

export default AppliedJobs;