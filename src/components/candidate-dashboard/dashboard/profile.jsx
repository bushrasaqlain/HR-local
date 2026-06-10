import Head from "next/head";
import { useRouter } from "next/router";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Container } from "reactstrap";
import api from "../../lib/api";
import EditProfile from "./editprofile";
import StatsGraph from "./StatsGraph";
import JobList from "./lists";
import Payment from "../../company-dashboard/payment";
import PricingForm from "../../company-dashboard/pricingform";
import PricingPage, { PaymentModal } from "../../company-dashboard/viewpackage";
import { withRouter } from "next/router";

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightJobId: null,
      activeGraph: null, // Doc1: supports 'views' | 'shortlisted' | 'approved'
      matchingJobs: [],
      searchTerm: "",
      applyingJobId: null,
      applySuccess: null,
      selectedJob: null,
      showJobModal: false,
      passport_photo: "",
      formData: {},
      savedJobIds: [],
      dashboardStats: {
        shortlisted: 0,
        viewed: 0,
        approved: 0,
        profileCompletion: 65,
        boostStatus: null,
        showBoostModal: false,
      },
      boostStatus: null,
      showBoostModal: false,
    };
  }

  fetchCandidateInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/candidateProfile/candidate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || {};
      this.setState({
        formData: data,
        passport_photo: data.passport_photo
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.passport_photo}`
          : "",
        dashboardStats: {
          shortlisted: data.shortlisted_count || 0,
          viewed: data.profile_views || 0,
          approved: data.approved_count || 0,
          profileCompletion: data.profile_completion || 0,
          profilecompletionpercentage: data.profile_completion_percent || 0,
        },
        boostStatus: {
          isBoosted: data.is_boosted || false,
          boostExpiresAt: data.boost_expires_at || null,
        },
      });
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  };

  fetchMatchingJobs = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await api.get("/candidateProfile/matching-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.setState({ matchingJobs: res.data.data || [] });
    } catch (err) {
      console.error("Matching jobs fetch failed", err);
    }
  };

  fetchSavedJobIds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/candidateProfile/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data || [];
      this.setState({ savedJobIds: data.map((j) => j.job_id) });
    } catch (err) {
      console.error("Saved jobs fetch failed", err);
    }
  };

  handleToggleSave = async (e, jobId) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    try {
      const res = await api.post(
        "/candidateProfile/save-job",
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.saved) {
        this.setState((prev) => ({
          savedJobIds: [...prev.savedJobIds, jobId],
        }));
      } else {
        this.setState((prev) => ({
          savedJobIds: prev.savedJobIds.filter((id) => id !== jobId),
        }));
      }
    } catch (err) {
      console.error("Toggle save failed", err);
    }
  };

  handleApply = async (jobId) => {
    this.setState({ applyingJobId: jobId });
    try {
      const token = sessionStorage.getItem("token");
      await api.post(
        "/applicant/apply",
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.setState({ applySuccess: jobId });
      this.fetchMatchingJobs();
      setTimeout(() => this.setState({ applySuccess: null }), 3000);
    } catch (err) {
      console.error("Apply failed", err);
    }
    this.setState({ applyingJobId: null });
  };

  // Doc1: Cancel application with confirmation
  handleCancelApplication = async (e, jobId) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      "Are you sure you want to cancel this application?\n\n" +
        "Once cancelled, you cannot undo this action. You can reapply later if the job is still open.",
    );
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/applicant/cancel-application",
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        alert("Application cancelled successfully!");
        this.fetchMatchingJobs();
        this.fetchSavedJobIds();
      }
    } catch (err) {
      console.error("Failed to cancel application:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to cancel application";
      alert(errorMsg);
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

  componentDidMount() {
    this.router = require("next/router").default;
    const { query } = this.router;
    // Doc1: highlightJob from query param
    if (query.highlightJob) {
      this.setState({ highlightJobId: parseInt(query.highlightJob) });
    } else {
      const storedJobId = sessionStorage.getItem("highlightJobId");
      if (storedJobId) {
        this.setState({ highlightJobId: parseInt(storedJobId) });
        sessionStorage.removeItem("highlightJobId");
      }
    }
    this.fetchCandidateInfo();
    this.fetchMatchingJobs();
    this.fetchSavedJobIds();
    window.addEventListener("highlightJob", this.handleHighlightJobEvent);
    window.addEventListener("focus", this.fetchCandidateInfo);
  }

  componentWillUnmount() {
    window.removeEventListener("highlightJob", this.handleHighlightJobEvent);
    window.removeEventListener("focus", this.fetchCandidateInfo);
  }

  // Doc1: Custom event handler for job highlighting
  handleHighlightJobEvent = (event) => {
    const { jobId } = event.detail;
    if (jobId) {
      this.setState({ highlightJobId: jobId, activeGraph: null });
      setTimeout(() => {
        const section = document.getElementById("matching-jobs-section");
        if (section)
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          const highlightedJob = document.querySelector(
            `[data-job-id="${jobId}"]`,
          );
          if (highlightedJob)
            highlightedJob.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        }, 300);
      }, 300);
    }
  };

  handleEditProfile = () => {
    if (this.props.onEdit) this.props.onEdit();
  };

  handleViewJobFromAlert = (jobAlert) => {
    const jobId = jobAlert.job_id || jobAlert.id;
    if (jobId) {
      this.router.push({
        pathname: "/profile",
        query: { highlightJob: jobId, tab: "matchingJobs" },
      });
    }
  };

  renderStatCard(title, value, subtitle) {
    return (
      <Card className="h-100">
        <CardBody>
          <h6 className="text-muted">{title}</h6>
          <h2 className="fw-bold">{value}</h2>
          <p className="small text-muted mb-0">{subtitle}</p>
        </CardBody>
      </Card>
    );
  }

  render() {
    const {
      dashboardStats,
      formData,
      boostStatus,
      showBoostModal,
      highlightJobId,
      activeGraph,
      matchingJobs,
      searchTerm,
    } = this.state;

    const filteredJobs = matchingJobs.filter((job) => {
      const keyword = searchTerm.toLowerCase();
      return (
        job.job_title?.toLowerCase().includes(keyword) ||
        job.company_name?.toLowerCase().includes(keyword) ||
        job.city_name?.toLowerCase().includes(keyword)
      );
    });

    // Doc1: multi-graph config
  const graphConfig = {
  views: {
    title: "Profile Views",
    subtitle: "See how many times recruiters viewed your profile",
  },
  shortlisted: {
    title: "Shortlisted / Interview",
    subtitle: "Companies that shortlisted or scheduled interview",
    companies: [
      ...( this.state.formData.shortlisted_companies || []),
      ...( this.state.formData.interview_scheduled_companies || []),
      ...( this.state.formData.interview_conducted_companies || []),
    ],
  },
  approved: {
    title: "Offered Jobs",
    subtitle: "Companies that offered you a job",
    companies: this.state.formData.offered_companies || [],
  },
};
    // Doc2: tier badge styles
    const tierStyles = {
      strong: {
        background: "#d1fae5",
        color: "#065f46",
        border: "1px solid #6ee7b7",
      },
      good: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "1px solid #93c5fd",
      },
      weak: {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fcd34d",
      },
    };

    return (
      <Container fluid>
        <Head>
          <title>Candidate Dashboard</title>
        </Head>

        <div className="row g-3 mt-3">
          {/* ── LEFT SIDE ── */}
          <div className="col-12 col-xl-9">
            <div className="row g-3">
              {/* Stat Cards — all three clickable (Doc1) */}
              <div
                className="col-12 col-md-4"
                style={{ transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onClick={() => this.setState({ activeGraph: "shortlisted" })}
              >
                {this.renderStatCard(
                  "Shortlisted",
                  dashboardStats.shortlisted,
                  "Companies selected your profile",
                )}
              </div>

              <div
                className="col-12 col-md-4"
                style={{ transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onClick={() => this.setState({ activeGraph: "views" })}
              >
                {this.renderStatCard(
                  "Appeared in Search",
                  dashboardStats.viewed,
                  "Recruiters viewed your profile",
                )}
              </div>

              <div
                className="col-12 col-md-4"
                style={{ transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onClick={() => this.setState({ activeGraph: "approved" })}
              >
                {this.renderStatCard(
                  "Approved",
                  dashboardStats.approved,
                  "Profiles approved by recruiters",
                )}
              </div>

              {/* Boost banners — only when graph is not shown */}
              {!activeGraph && boostStatus && !boostStatus.isBoosted && (
                <div className="col-12">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      background: "#fffbeb",
                      border: "1.5px solid #f59e0b",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#92400e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#92400e",
                          }}
                        >
                          Boost Your Profile
                        </span>
                        <span
                          style={{
                            background: "#f59e0b",
                            color: "#78350f",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "1px 7px",
                            borderRadius: "20px",
                          }}
                        >
                          New
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#a16207" }}>
                        Get priority visibility among relevant candidates —
                        reach more recruiters with your profile
                      </span>
                    </div>
                    <button
                      onClick={() => this.setState({ showBoostModal: true })}
                      style={{
                        background: "#f59e0b",
                        color: "#78350f",
                        border: "none",
                        borderRadius: "8px",
                        padding: "9px 18px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Boost Now
                    </button>
                  </div>
                </div>
              )}

              {!activeGraph && boostStatus && boostStatus.isBoosted && (
                <div className="col-12">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      background: "#e2f0f0",
                      border: "1.5px solid #5f8190",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#dcfce7",
                        border: "1px solid #36565f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#36565f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#36565f",
                          marginBottom: "3px",
                        }}
                      >
                        Profile Boosted — Active
                      </div>
                      <span style={{ fontSize: "12px", color: "#5f8190" }}>
                        Your profile is now appearing higher in search results
                      </span>
                    </div>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#5f8190",
                        color: "#fff",
                        borderRadius: "20px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Live
                    </span>
                  </div>
                </div>
              )}

              {/* Modals */}
              {showBoostModal && (
                <BoostModal
                  onClose={() => this.setState({ showBoostModal: false })}
                  onSuccess={() => {
                    this.setState({ showBoostModal: false });
                    this.fetchCandidateInfo();
                  }}
                />
              )}

              {this.state.showJobModal && (
                <JobDetailModal
                  job={this.state.selectedJob}
                  onClose={() =>
                    this.setState({ showJobModal: false, selectedJob: null })
                  }
                />
              )}

              {/* ── Graph / Jobs toggle (Doc1 structure, Doc2 job card UI) ── */}
              <div className="col-12" id="matching-jobs-section">
                {activeGraph ? (
                  // ── GRAPH VIEW (Doc1) ──
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <button
                        onClick={() => this.setState({ activeGraph: null })}
                        style={{
                          background: "none",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          fontSize: "13px",
                          cursor: "pointer",
                          color: "#374151",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        ← Back to Matching Jobs
                      </button>
                    </div>
                    <Card>
                      <CardHeader className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{graphConfig[activeGraph]?.title}</strong>
                          <small className="text-muted ms-2">
                            {graphConfig[activeGraph]?.subtitle}
                          </small>
                        </div>
                        <button
                          onClick={() => this.setState({ activeGraph: null })}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            cursor: "pointer",
                            color: "#991b1b",
                            fontWeight: 700,
                            fontSize: "15px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      </CardHeader>
<CardBody>
  {activeGraph === "views" ? (
    <StatsGraph type={activeGraph} />
  ) : (
    (() => {
      const companies = graphConfig[activeGraph]?.companies || [];
      if (companies.length === 0)
        return (
          <p className="text-muted small text-center py-3">
            No data available yet.
          </p>
        );
      return (
        <div className="d-flex flex-column gap-3">
          {companies.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                background: "#fff",
              }}
            >
              {c.logo ? (
                <img
                  src={`data:image/png;base64,${c.logo}`}
                  alt={c.company_name}
                  style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 42, height: 42, borderRadius: 8,
                  background: "#f3f4f6", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>🏢</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                  {c.company_name}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{c.job_title}</div>
              </div>
              <span style={{
                background: c.status === "Offered"
                  ? "#d1fae5" : c.status === "Interview_Scheduled"
                  ? "#dbeafe" : c.status === "Interview_Conducted"
                  ? "#ede9fe" : "#f3f4f6",
                color: c.status === "Offered"
                  ? "#065f46" : c.status === "Interview_Scheduled"
                  ? "#1e40af" : c.status === "Interview_Conducted"
                  ? "#5b21b6" : "#374151",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}>
                {c.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      );
    })()
  )}
</CardBody>
                    </Card>
                  </div>
                ) : (
                  // ── JOBS VIEW (Doc2 card UI + Doc1 highlight & cancel) ──
                  <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Jobs Matching Your Profile</strong>
                        <small className="text-muted ms-2">
                          Based on your skills
                        </small>
                      </div>
                      <button
                        onClick={() => {
                          this.props.onTabChange &&
                            this.props.onTabChange("savedJobs");
                        }}
                        style={{
                          background: "#fff",
                          color: "#36565F",
                          border: "1.5px solid #36565F",
                          borderRadius: "8px",
                          padding: "5px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ❤️ Saved Jobs ({this.state.savedJobIds.length})
                      </button>
                    </CardHeader>

                    {/* Search bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        marginBottom: "16px",
                      }}
                    >
                      <span style={{ color: "#9ca3af", marginRight: "8px" }}>
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Search jobs by title, company, city..."
                        value={this.state.searchTerm}
                        onChange={(e) =>
                          this.setState({ searchTerm: e.target.value })
                        }
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          width: "100%",
                          fontSize: "13px",
                          color: "#374151",
                        }}
                      />
                      {this.state.searchTerm && (
                        <span
                          onClick={() => this.setState({ searchTerm: "" })}
                          style={{
                            cursor: "pointer",
                            color: "#9ca3af",
                            fontWeight: "bold",
                            marginLeft: "8px",
                          }}
                        >
                          ✕
                        </span>
                      )}
                    </div>

                    <CardBody>
                      {filteredJobs.length === 0 ? (
                        <p className="text-muted small">
                          No matching jobs found. Make sure your skills are
                          updated in your profile.
                        </p>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {filteredJobs.map((job) => {
                            const isSaved = this.state.savedJobIds.includes(
                              job.id,
                            );
                            const isHighlighted = highlightJobId === job.id;
                            const tierStyle = tierStyles[job.tier] || {};

                            return (
                              <div
                                key={job.id}
                                data-job-id={job.id}
                                onClick={() => this.handleJobClick(job.id)}
                                style={{
                                  border: isHighlighted
                                    ? "2px solid #36565f"
                                    : "1px solid #e5e7eb",
                                  borderRadius: "14px",
                                  padding: "16px 20px",
                                  cursor: "pointer",
                                  background: isHighlighted
                                    ? "#e8f0f2"
                                    : "#fff",
                                  transition:
                                    "box-shadow 0.2s, border-color 0.2s, background 0.3s",
                                  animation: isHighlighted
                                    ? "highlightPulse 0.5s ease-in-out"
                                    : "none",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.08)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.boxShadow = "none")
                                }
                                ref={(el) => {
                                  if (isHighlighted && el) {
                                    el.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                    setTimeout(
                                      () =>
                                        this.setState({ highlightJobId: null }),
                                      3000,
                                    );
                                  }
                                }}
                              >
                                {/* ── TOP ROW: Logo + Info + Action ── */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                  }}
                                >
                                  {/* Logo */}
                                  {job.logo ? (
                                    <img
                                      src={`data:image/png;base64,${job.logo}`}
                                      alt={job.company_name}
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        objectFit: "cover",
                                        flexShrink: 0,
                                        marginTop: 2,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: "#f3f4f6",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 20,
                                        flexShrink: 0,
                                        marginTop: 2,
                                      }}
                                    >
                                      🏢
                                    </div>
                                  )}

                                  {/* Center info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Line 1: Title + save + tier + score */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        flexWrap: "wrap",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          fontSize: 15,
                                          color: "#111827",
                                        }}
                                      >
                                        {job.job_title}
                                      </span>
                                      <button
                                        onClick={(e) =>
                                          this.handleToggleSave(e, job.id)
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          fontSize: 15,
                                          padding: 0,
                                          lineHeight: 1,
                                        }}
                                        title={
                                          isSaved
                                            ? "Remove from saved"
                                            : "Save job"
                                        }
                                      >
                                        {isSaved ? "❤️" : "🤍"}
                                      </button>
                                      {job.tier_label && (
                                        <span
                                          style={{
                                            ...tierStyle,
                                            borderRadius: "20px",
                                            padding: "2px 10px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {job.tier_label}
                                        </span>
                                      )}
                                      {job.ai_score != null && (
                                        <span
                                          style={{
                                            background: "#f3f4f6",
                                            color: "#6b7280",
                                            borderRadius: "20px",
                                            padding: "2px 9px",
                                            fontSize: "11px",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {job.ai_score}% match
                                        </span>
                                      )}
                                    </div>

                                    {/* Line 2: Company · Salary · Exp */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        flexWrap: "wrap",
                                        fontSize: 12,
                                        color: "#6b7280",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#374151",
                                        }}
                                      >
                                        {job.company_name}
                                      </span>
                                      {job.city_name && (
                                        <>
                                          <span style={{ color: "#d1d5db" }}>
                                            •
                                          </span>
                                          <span>{job.city_name}</span>
                                        </>
                                      )}
                                      {job.min_salary && (
                                        <>
                                          <span style={{ color: "#d1d5db" }}>
                                            •
                                          </span>
                                          <span
                                            style={{
                                              color: "#36565f",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {job.currency}{" "}
                                            {Number(
                                              job.min_salary,
                                            ).toLocaleString()}{" "}
                                            –{" "}
                                            {Number(
                                              job.max_salary,
                                            ).toLocaleString()}
                                          </span>
                                        </>
                                      )}
                                      {job.min_experience && (
                                        <>
                                          <span style={{ color: "#d1d5db" }}>
                                            •
                                          </span>
                                          <span>
                                            🕒 {job.min_experience} –{" "}
                                            {job.max_experience} yrs
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: Apply / Applied / Cancel (Doc1 cancel button merged in) */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ flexShrink: 0, marginTop: 2 }}
                                  >
                                    {job.already_applied ? (
                                      <div className="d-flex gap-2 align-items-center">
                                        <span
                                          style={{
                                            background: "#36565f",
                                            color: "#fff",
                                            border: "1px solid #36565f",
                                            borderRadius: "20px",
                                            padding: "6px 14px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          ✓ Applied
                                        </span>
                                        {job.application_status ===
                                          "Pending" && (
                                          <button
                                            onClick={(e) =>
                                              this.handleCancelApplication(
                                                e,
                                                job.id,
                                              )
                                            }
                                            style={{
                                              background: "#fee2e2",
                                              color: "#991b1b",
                                              border: "1px solid #fca5a5",
                                              borderRadius: "8px",
                                              padding: "6px 12px",
                                              fontSize: "11px",
                                              fontWeight: 500,
                                              cursor: "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) =>
                                              (e.currentTarget.style.background =
                                                "#fecaca")
                                            }
                                            onMouseLeave={(e) =>
                                              (e.currentTarget.style.background =
                                                "#fee2e2")
                                            }
                                          >
                                            Cancel Request
                                          </button>
                                        )}
                                      </div>
                                    ) : job.pipeline_status ? (
                                      <span
                                        style={{
                                          background: "#f0fdf4",
                                          color: "#166534",
                                          border: "1px solid #bbf7d0",
                                          borderRadius: "20px",
                                          padding: "6px 14px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {job.pipeline_status.replace(/_/g, " ")}
                                      </span>
                                    ) : !this.state.boostStatus?.isBoosted ? (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: "#a16207",
                                          background: "#fffbeb",
                                          border: "1px solid #f59e0b",
                                          borderRadius: 8,
                                          padding: "6px 10px",
                                          display: "inline-block",
                                          textAlign: "center",
                                          lineHeight: "1.4",
                                          maxWidth: 110,
                                        }}
                                      >
                                        Boost to apply
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => this.handleApply(job.id)}
                                        disabled={
                                          this.state.applyingJobId === job.id
                                        }
                                        style={{
                                          background: "#36565F",
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: 8,
                                          padding: "8px 20px",
                                          fontSize: 13,
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {this.state.applyingJobId === job.id
                                          ? "Applying..."
                                          : "Apply"}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* ── SKILLS ROW (Doc2) ── */}
                                {(job.matched?.length > 0 ||
                                  job.missing?.length > 0) && (
                                  <div
                                    style={{
                                      borderTop: "1px solid #f3f4f6",
                                      marginTop: "12px",
                                      paddingTop: "10px",
                                    }}
                                  >
                                    <div
                                      style={{ display: "flex", gap: "24px" }}
                                    >
                                      {job.matched?.length > 0 && (
                                        <div style={{ flex: 1 }}>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 600,
                                              color: "#9ca3af",
                                              textTransform: "uppercase",
                                              letterSpacing: "0.05em",
                                              marginBottom: "6px",
                                            }}
                                          >
                                            Matching
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: "5px",
                                            }}
                                          >
                                            {job.matched.map((m, i) => (
                                              <span
                                                key={i}
                                                style={{
                                                  background: "#e2f0f0",
                                                  color: "#353333",
                                                  border: "1px solid #708791",
                                                  borderRadius: "6px",
                                                  padding: "3px 9px",
                                                  fontSize: "11px",
                                                  fontWeight: 500,
                                                }}
                                              >
                                                ✓ {m}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="col-12 col-xl-3">
            <div className="row g-3">
              <div className="col-12">
                <Card>
                  <CardBody>
                    <h6>Profile Completion</h6>
                    <div className="progress mb-2">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${dashboardStats.profilecompletionpercentage}%`,
                          background: "#5F8190",
                        }}
                      >
                        {dashboardStats.profilecompletionpercentage}%
                      </div>
                    </div>
                    <p className="text-muted small">
                      Complete your profile to increase recruiter visibility
                    </p>
                    <button
                      className="btn custom-progress-bar text-white btn-sm w-100"
                      onClick={this.handleEditProfile}
                    >
                      Complete Profile
                    </button>
                  </CardBody>
                </Card>
              </div>

              <div className="col-12 mb-5">
                <Card className="text-center justify-content-center p-3">
                  <div className="d-flex justify-content-center">
                    <img
                      src={
                        formData.passport_photo &&
                        formData.passport_photo.trim() !== ""
                          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${formData.passport_photo.replace(/^\//, "")}`
                          : "/default-avatar.png"
                      }
                      alt="passport_photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-avatar.png";
                      }}
                      className="rounded-circle mb-3"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <h5 className="mb-3">{formData.full_name || "Your Name"}</h5>
                  <span
                    className="badge mb-3"
                    style={{ background: "#5F8190" }}
                  >
                    Available for Interview
                  </span>
                  <div>
                    <button
                      className="btn mb-3 custom-progress-bar text-white btn-sm w-100"
                      onClick={this.handleEditProfile}
                    >
                      Edit Profile
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }
}

// ── JobDetailModal (identical in both files) ──
class JobDetailModal extends React.Component {
  handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  render() {
    const { job, onClose } = this.props;
    if (!job) return null;
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "24px",
            width: "100%",
            maxWidth: "560px",
            maxHeight: "85vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "#fee2e2",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "#991b1b",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            ×
          </button>
          <h5 style={{ marginBottom: "4px", paddingRight: "40px" }}>
            {job.job_title}
          </h5>
          <p
            style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}
          >
            {job.speciality} • {job.city} • {job.country}
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {job.min_salary && (
              <span
                style={{
                  background: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                💰 {job.currency} {job.min_salary} - {job.max_salary}
              </span>
            )}
            {job.min_experience && (
              <span
                style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                🕒 {job.min_experience} - {job.max_experience} yrs exp
              </span>
            )}
            {job.job_type && (
              <span
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {job.job_type}
              </span>
            )}
          </div>
          {job.skills && job.skills.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Required Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(Array.isArray(job.skills)
                  ? job.skills
                  : job.skills.split(",")
                ).map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "6px",
                      padding: "3px 10px",
                      fontSize: "12px",
                    }}
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {job.job_description && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Job Description
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {job.job_description}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {job.degree && (
              <div>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Degree:{" "}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>
                  {job.degree}
                </span>
              </div>
            )}
            {job.application_deadline && (
              <div>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Deadline:{" "}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>
                  {new Date(job.application_deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// ── BoostModal (identical in both files — using Doc1 version which is slightly cleaner) ──
class BoostModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      packages: [],
      selected: null,
      loading: false,
      showPayment: false,
      selectedPkg: null,
    };
  }

  componentDidMount() {
    const token = localStorage.getItem("token");
    api
      .get("/candidateProfile/boost/packages", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => this.setState({ packages: res.data.data || [] }));
  }

  handlePaymentSuccess = async () => {
    const { selected } = this.state;
    const token = localStorage.getItem("token");
    try {
      const res = await api.post(
        "/candidateProfile/boost/order",
        { package_id: selected },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        alert("Boost order placed! Waiting for admin approval.");
        this.props.onSuccess();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
  };

  render() {
    const { packages, selected, showPayment, selectedPkg } = this.state;

    if (showPayment && selectedPkg) {
      const userId =
        sessionStorage.getItem("userId") || localStorage.getItem("userId");
      return (
        <PaymentModal
          pkg={selectedPkg}
          userId={userId}
          onClose={() =>
            this.setState({ showPayment: false, selectedPkg: null })
          }
          onSubmit={async () => {
            this.setState({ showPayment: false, selectedPkg: null });
            await this.handlePaymentSuccess();
          }}
        />
      );
    }

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "#36454F",
            borderRadius: "16px",
            padding: "32px 24px",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h5
              style={{
                color: "#fff",
                margin: "0 0 6px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              Choose a Boost Plan
            </h5>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "13px",
                margin: 0,
              }}
            >
              Select a plan — pay — admin will activate your boost
            </p>
          </div>

          {packages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "rgba(255,255,255,0.6)",
                fontSize: "13px",
              }}
            >
              No boost packages available at the moment.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, 1fr)`,
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              {packages.map((pkg) => {
                const isSelected = selected === pkg.id;
                const isPopular = pkg.is_featured === 1;
                const duration =
                  pkg.pricing_model === "featured_boost"
                    ? `${pkg.boost_duration_days || 7} days`
                    : `${pkg.duration_days || 30} days`;
                const features = pkg.description
                  ? pkg.description.split("\n").filter(Boolean)
                  : [];

                return (
                  <div
                    key={pkg.id}
                    onClick={() =>
                      this.setState({ selected: pkg.id, selectedPkg: pkg })
                    }
                    style={{
                      background: "#fff",
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: isSelected
                        ? "2.5px solid #F59E0B"
                        : isPopular
                          ? "2px solid #5B9BD5"
                          : "2px solid transparent",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      transform: isSelected ? "translateY(-6px)" : "none",
                      position: "relative",
                    }}
                  >
                    {isPopular && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: "12px",
                          background: "#5B9BD5",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 10px",
                          borderRadius: "0 0 8px 8px",
                        }}
                      >
                        Most popular
                      </div>
                    )}
                    <div style={{ textAlign: "center", paddingTop: "14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: "#F59E0B",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "3px 14px",
                          borderRadius: "0 0 8px 8px",
                        }}
                      >
                        Profile Spotlight
                      </span>
                    </div>
                    <div style={{ padding: "12px 18px 20px" }}>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1f2937",
                          margin: "0 0 3px",
                        }}
                      >
                        {pkg.name}
                      </p>
                      {pkg.boost_type && (
                        <div style={{ marginBottom: "8px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#eff6ff",
                              color: "#1e40af",
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: "20px",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {pkg.boost_type === "profile_top" &&
                              "⬆ Top of Search Results"}
                            {pkg.boost_type === "highlighted_profile" &&
                              "✦ Highlighted Profile"}
                            {pkg.boost_type === "recruiter_spotlight" &&
                              "🎯 Recruiter Spotlight"}
                          </span>
                        </div>
                      )}
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          margin: "0 0 14px",
                        }}
                      >
                        {duration} · one-time payment
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "3px",
                          marginBottom: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1f2937",
                          }}
                        >
                          {pkg.currency}
                        </span>
                        <span
                          style={{
                            fontSize: "32px",
                            fontWeight: 700,
                            color: "#1f2937",
                            lineHeight: 1,
                          }}
                        >
                          {Number(pkg.price).toFixed(0)}
                        </span>
                      </div>
                      {features.length > 0 && (
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: "0 0 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "7px",
                          }}
                        >
                          {features.map((f, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: "12px",
                                color: "#374151",
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                              }}
                            >
                              <span
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  background: "#d1fae5",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                >
                                  <path
                                    d="M2 5l2 2 4-4"
                                    stroke="#065f46"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isSelected && (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#92400e",
                            background: "#fef3c7",
                            borderRadius: "6px",
                            padding: "4px",
                            marginBottom: "8px",
                          }}
                        >
                          ✓ Selected
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          this.setState({
                            selected: pkg.id,
                            selectedPkg: pkg,
                            showPayment: true,
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "9px",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: isPopular ? "#F59E0B" : "#36454F",
                          color: isPopular ? "#78350f" : "#fff",
                        }}
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              onClick={this.props.onClose}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid #fff",
                borderRadius: "8px",
                padding: "8px 24px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Profile);
