import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import axios from "axios";

class DashboardHome extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pipeline: { applied: 0, shortlisted: 0, interview: 0, offered: 0, hired: 0 },
            recentActivity: [],
            upcomingInterviews: [],
            currentOpenings: [],
            selectedMonth: new Date().getMonth(),
            selectedYear: new Date().getFullYear(),
            acqMonth: new Date().getMonth(),
            acqYear: new Date().getFullYear(),
        };
        this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        this.userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
    }

    componentDidMount() {
        this.fetchDashboardData();
    }

    fetchDashboardData = async () => {
        const { selectedMonth, selectedYear } = this.state;
        try {
            const res = await axios.get(`${this.apiBaseUrl}applicant/dashboard/${this.userId}`, {
                params: { month: selectedMonth + 1, year: selectedYear }
            });
            const d = res.data;
            this.setState({
                pipeline: d.pipeline || this.state.pipeline,
                recentActivity: d.recentActivity || [],
                upcomingInterviews: d.upcomingInterviews || [],
                currentOpenings: d.currentOpenings || [],
            });
        } catch (err) {
            console.error("Dashboard fetch error", err);
        }
    };

    handleViewAllInterviews = () => {
        console.log("View All Interviews clicked");
        console.log("onTabChange prop:", this.props.onTabChange);

        if (this.props.onTabChange) {
            this.props.onTabChange("interview", null);
        } else {
            console.log("onTabChange not available, using window event");
            window.dispatchEvent(new CustomEvent("switchToInterviewTab", { detail: { tab: "interview" } }));
        }
    };

    handleMonthChange = (e) => {
        const [year, month] = e.target.value.split("-");
        this.setState({ selectedMonth: parseInt(month) - 1, selectedYear: parseInt(year) }, () => {
            this.fetchDashboardData();
        });
    };

    getStatusBadge = (status) => {
        const map = {
            Active: { bg: "#E1F5EE", color: "#0F6E56" },
            Pending: { bg: "#FAEEDA", color: "#854F0B" },
            Scheduled: { bg: "#E6F1FB", color: "#185FA5" },
            Shortlisted: { bg: "#EEEDFE", color: "#534AB7" },
            "Closing soon": { bg: "#FAEEDA", color: "#854F0B" },
        };
        const style = map[status] || { bg: "#F1EFE8", color: "#5F5E5A" };
        return (
            <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 50,
                background: style.bg, color: style.color, whiteSpace: "nowrap"
            }}>
                {status}
            </span>
        );
    };

    render() {
        const { pipeline, recentActivity, upcomingInterviews, currentOpenings, selectedMonth, selectedYear } = this.state;

        const total = Math.max(pipeline.applied, 1);
        const monthValue = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

        const pipelineSteps = [
            { label: "Applied", num: pipeline.applied, color: "#534AB7", bg: "#EEEDFE" },
            { label: "Shortlisted", num: pipeline.shortlisted, color: "#185FA5", bg: "#E6F1FB" },
            { label: "Interview", num: pipeline.interview, color: "#0F6E56", bg: "#E1F5EE" },
            { label: "Offered", num: pipeline.offered, color: "#854F0B", bg: "#FAEEDA" },
            { label: "Hired", num: pipeline.hired, color: "#3B6D11", bg: "#EAF3DE" },
        ];

        const activityIcons = ["#1D9E75", "#185FA5", "#854F0B", "#534AB7", "#E24B4A"];

        const cardStyle = {
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: "1.1rem 1.25rem",
            height: "100%",
        };

        const sectionHead = {
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: "1rem",
        };

        return (
            <div style={{ padding: "1.25rem" }}>

                {/* Row 1: Hiring Pipeline + Recent Activity */}
                <Row className="g-3 mb-3 mt-1">

                    {/* Hiring Pipeline */}
                    <Col lg={6}>
                        <div style={cardStyle}>
                            <div style={sectionHead}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Hiring Pipeline</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="month"
                                        value={monthValue}
                                        onChange={this.handleMonthChange}
                                        style={{
                                            fontSize: 11, border: "0.5px solid rgba(0,0,0,0.15)",
                                            borderRadius: 20, padding: "3px 10px", color: "#fff",
                                            background: "#36565f", cursor: "pointer", outline: "none",
                                            fontWeight: 500,
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150, paddingBottom: 4 }}>
                                {pipelineSteps.map((s, i) => {
                                    const pipelineMax = Math.max(pipeline.applied, 1);
                                    const barH = Math.max(20, Math.round((s.num / pipelineMax) * 120));
                                    return (
                                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.num}</div>
                                            <div style={{
                                                width: "100%", height: barH,
                                                background: s.bg,
                                                borderRadius: "8px 8px 0 0",
                                                transition: "height 0.4s ease",
                                            }} />
                                            <div style={{ fontSize: 10, color: "#999", textAlign: "center", marginTop: 2 }}>{s.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>

                    <Col lg={6}>
                        <div style={{ ...cardStyle, height: "100%" }}>
                            <div style={sectionHead}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>Hiring Progress</span>
                                <input
                                    type="month"
                                    value={monthValue}
                                    onChange={this.handleMonthChange}
                                    style={{
                                        fontSize: 11, border: "0.5px solid rgba(0,0,0,0.15)",
                                        borderRadius: 6, padding: "2px 8px", color: "#555",
                                        background: "#f8f9fa", cursor: "pointer", outline: "none"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                                {pipelineSteps.map((s, i) => {
                                    {/* ← acquisitionSteps → pipelineSteps */ }
                                    const pct = total > 0 ? Math.round((s.num / total) * 100) : 0;
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 80, fontSize: 11, color: "#555", flexShrink: 0 }}>{s.label}</div>
                                            <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 8, overflow: "hidden" }}>
                                                <div style={{
                                                    width: `${pct}%`, height: "100%",
                                                    background: s.color, borderRadius: 4,
                                                    transition: "width 0.4s ease"
                                                }} />
                                            </div>
                                            <div style={{ width: 32, fontSize: 11, color: "#888", textAlign: "right" }}>{pct}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Row 2: Upcoming Interviews + Current Openings */}
                <Row className="g-3">

                    {/* Upcoming Interviews */}
                    <Col lg={6}>
                        <div style={cardStyle}>
                            <div style={sectionHead}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Upcoming Interviews</span>
                                <button
                                    onClick={this.handleViewAllInterviews}
                                    style={{
                                        fontSize: 11,
                                        color: "#0F6E56",
                                        cursor: "pointer",
                                        background: "none",
                                        border: "none",
                                        padding: "5px 10px"
                                    }}
                                >
                                    View all →
                                </button>
                            </div>
                            {upcomingInterviews.length === 0 ? (
                                <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "2rem 0" }}>No upcoming interviews</p>
                            ) : (
                                upcomingInterviews.slice(0, 3).map((item, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 14px", background: "#fff",
                                        borderRadius: 10, marginBottom: 8,
                                        border: "0.5px solid rgba(0,0,0,0.1)",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                                    }}>
                                        {/* Calendar icon box */}
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: "#EEEDFE", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, fontSize: 18
                                        }}>
                                            📅
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#1a1a1a" }}>
                                                {item.name}
                                            </p>
                                            <p style={{ fontSize: 11, color: "#888", margin: "0 0 4px" }}>
                                                {item.role}
                                            </p>
                                            <p style={{ fontSize: 11, color: "#555", margin: 0 }}>
                                                🕐 {item.time}
                                            </p>
                                        </div>

                                        {/* Badge */}
                                        {this.getStatusBadge(item.status || "Scheduled")}
                                    </div>
                                ))
                            )}
                        </div>
                    </Col>

                    {/* Current Openings */}
                    <Col lg={6}>
                        <div style={cardStyle}>
                            <div style={sectionHead}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>
                                    Job Openings
                                    <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 6, fontSize: 12 }}>
                                        ({currentOpenings.length})
                                    </span>
                                </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {currentOpenings.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "2rem 0" }}>No active openings</p>
                                ) : (
                                    currentOpenings.slice(0, 4).map((job, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "9px 12px", background: "#f8f9fa",
                                            borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.06)"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                                    {this.getStatusBadge(job.status || "Active")}
                                                    <span style={{ fontSize: 10, color: "#aaa" }}>{job.applicants} applicants</span>
                                                </div>
                                                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{job.title}</p>
                                                <p style={{ fontSize: 10, color: "#aaa", margin: "2px 0 0" }}>
                                                    {job.type} · {job.city}
                                                </p>
                                            </div>
                                            <button
                                                style={{
                                                    fontSize: 11,
                                                    padding: "5px 12px",
                                                    border: "1px solid #36565f",
                                                    borderRadius: 6,
                                                    background: "#36565f",
                                                    color: "#ffffff",
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                    flexShrink: 0,
                                                    transition: "all 0.3s ease",
                                                    fontWeight: 500
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = "#2a4a52";
                                                    e.target.style.borderColor = "#2a4a52";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = "#36565f";
                                                    e.target.style.borderColor = "#36565f";
                                                }}
                                                onClick={() => this.props.onTabChange && this.props.onTabChange("allApplicants", null)}
                                            >
                                                View applicants
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

            </div>
        );
    }
}

export default DashboardHome;