import React, { Component } from "react";
import { Spinner, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import api from "../../lib/api";

/* ─────────────────────────────────────────────
   Design tokens — extends the app's existing
   teal identity rather than inventing a new one
───────────────────────────────────────────── */
const INK = "#1f3238";       // deep heading ink
const TEAL = "#2a4249";      // brand teal (existing)
const TEAL_SOFT = "#eef4f5"; // wash
const BORDER = "#e6e9ea";
const TEXT_MUTE = "#6b7280";
const BG = "#f6f8f9";
const WHITE = "#ffffff";

const GREEN = "#15803d";
const GREEN_BG = "#ecfdf3";
const AMBER = "#b45309";
const AMBER_BG = "#fef7e8";
const RED = "#c0392b";
const RED_BG = "#fdedec";
const PURPLE = "#6d28d9";
const PURPLE_BG = "#f3eefd";
const SLATE_BG = "#f1f3f4";
const SLATE = "#6b7280";

const FONT = "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ─────────────────────────────────────────────
   Status → pipeline mapping
   The application ENUM is a genuine sequence,
   so a stage rail is earned here, not decorative.
───────────────────────────────────────────── */
const STAGES = [
  { key: "applied", label: "Applied", match: ["Applied", "Pending"] },
  { key: "shortlisted", label: "Shortlisted", match: ["Shortlisted", "Considered", "Saved"] },
  { key: "interview", label: "Interview", match: ["Interview_Scheduled", "Interview_Conducted"] },
  { key: "offered", label: "Offered", match: ["Offered"] },
  { key: "hired", label: "Hired", match: ["Selected", "Joined"] },
];

const TERMINAL_NEGATIVE = {
  Rejected: { label: "Not Selected", color: RED, bg: RED_BG },
  "Refused to Join": { label: "Declined Offer", color: SLATE, bg: SLATE_BG },
  Cancelled: { label: "Cancelled", color: SLATE, bg: SLATE_BG },
};

const getPipelineIndex = (status) => {
  const idx = STAGES.findIndex((s) => s.match.includes(status));
  return idx === -1 ? 0 : idx;
};

const getStatusMeta = (status) => {
  if (TERMINAL_NEGATIVE[status]) return { terminal: true, ...TERMINAL_NEGATIVE[status] };
  if (["Offered"].includes(status)) return { terminal: false, label: "Offered", color: PURPLE, bg: PURPLE_BG, accent: PURPLE };
  if (["Selected", "Joined"].includes(status)) return { terminal: false, label: status === "Joined" ? "Joined" : "Selected", color: GREEN, bg: GREEN_BG, accent: GREEN };
  if (["Interview_Scheduled", "Interview_Conducted"].includes(status)) return { terminal: false, label: "Interview", color: AMBER, bg: AMBER_BG, accent: AMBER };
  if (["Shortlisted", "Considered", "Saved"].includes(status)) return { terminal: false, label: "Shortlisted", color: TEAL, bg: TEAL_SOFT, accent: TEAL };
  return { terminal: false, label: "Applied", color: SLATE, bg: SLATE_BG, accent: SLATE };
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "In Progress" },
  { key: "Offered", label: "Offered" },
  { key: "hired", label: "Hired" },
  { key: "closed", label: "Closed" },
];

const matchesFilter = (job, filter) => {
  if (filter === "all") return true;
  if (filter === "active") {
    return ["Applied", "Pending", "Shortlisted", "Considered", "Saved", "Interview_Scheduled", "Interview_Conducted"].includes(job.status);
  }
  if (filter === "Offered") return job.status === "Offered";
  if (filter === "hired") return ["Selected", "Joined"].includes(job.status);
  if (filter === "closed") return Object.keys(TERMINAL_NEGATIVE).includes(job.status);
  return job.status === filter;
};

const getSourceBadge = (job) => {
  const isCompanyInitiated = job.source === "employer";

  if (isCompanyInitiated) {
    return { label: "Invited by Company", icon: "🏢", color: "#6d28d9", bg: "#f3eefd" };
  }
  return { label: "Applied by You", icon: "📤", color: "#2a4249", bg: "#eef4f5" };
};

/* ─────────────────────────────────────────────
   Pipeline rail — the signature element
───────────────────────────────────────────── */
const PipelineRail = ({ status, accent }) => {
  const meta = getStatusMeta(status);
  if (meta.terminal) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: meta.bg, borderRadius: 8, padding: "8px 12px",
        fontSize: 12.5, fontWeight: 700, color: meta.color,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
        {meta.label} — application closed
      </div>
    );
  }

  const current = getPipelineIndex(status);
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "2px 2px" }}>
      {STAGES.map((s, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const dotColor = done || isCurrent ? accent : "#d7dcdd";
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
              <div
                title={s.label}
                style={{
                  width: isCurrent ? 12 : 8,
                  height: isCurrent ? 12 : 8,
                  borderRadius: "50%",
                  background: dotColor,
                  boxShadow: isCurrent ? `0 0 0 4px ${accent}22` : "none",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              />
              <span
                className="pipeline-stage-label"
                style={{
                  fontSize: 9.5,
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? accent : "#9aa4a6",
                  marginTop: 5,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: i < current ? accent : "#e6e9ea",
                  margin: "0 4px 15px",
                  borderRadius: 2,
                  transition: "background 0.2s",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

class AppliedJobs extends Component {
  state = {
    jobs: [],
    loading: true,
    filter: "all",
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobs = res.data.data || [];
      const processedJobs = jobs.map((job) => ({
        ...job,
        company_logo_url: job.company_logo ? `data:image/png;base64,${job.company_logo}` : null,
      }));
      this.setState({ jobs: processedJobs, loading: false });
    } catch (err) {
      console.error("Failed to fetch applied jobs", err);
      this.setState({ loading: false });
    }
  };

  fetchJobDetails = async (jobId, applicationStatus) => {
    this.setState({ loadingDetails: true, showJobModal: true });
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/job/getSinglejob/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobFromState = this.state.jobs.find((job) => job.job_id === jobId);
      this.setState({
        jobDetails: {
          ...res.data,
          application_status: applicationStatus,
          company_logo: jobFromState?.company_logo_url || null,
          company_name: jobFromState?.company_name || res.data.company_name || "Company",
        },
        loadingDetails: false,
      });
    } catch (err) {
      console.error("Failed to fetch job details", err);
      this.setState({ loadingDetails: false });
    }
  };

  openJobDetails = async (job) => {
    await this.fetchJobDetails(job.job_id, job.status);
  };

  closeModal = () => this.setState({ showJobModal: false, jobDetails: null });

  formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  formatSalary = (min, max, currency) => {
    if (!min && !max) return "Not specified";
    const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n);
    if (min && max) return `${currency || "PKR"} ${fmt(min)} – ${fmt(max)}`;
    if (min) return `${currency || "PKR"} ${fmt(min)}+`;
    return `Up to ${currency || "PKR"} ${fmt(max)}`;
  };

  cancelApplication = async (job, e) => {
    e.stopPropagation();
    if (!window.confirm("Cancel this application?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/applicant/cancel-application",
        { job_id: job.job_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.fetchAppliedJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    }
  };

  renderJobDetailsModal() {
    const { showJobModal, jobDetails, loadingDetails } = this.state;
    if (!showJobModal) return null;

    return (
      <Modal isOpen={showJobModal} toggle={this.closeModal} size="lg" style={{ maxWidth: 760, margin: "1.75rem auto" }}>
        <ModalBody style={{ padding: 0, fontFamily: FONT }}>
          {loadingDetails ? (
            <div style={{ textAlign: "center", padding: 70 }}>
              <Spinner style={{ color: TEAL }} />
              <p style={{ marginTop: 16, color: TEXT_MUTE }}>Loading job details…</p>
            </div>
          ) : jobDetails ? (
            <>
              {/* Gradient hero banner */}
              <div style={{ position: "relative", background: `linear-gradient(135deg, ${TEAL} 0%, #16262b 100%)`, height: 80, borderRadius: "6px 6px 0 0" }}>
                <button
                  onClick={this.closeModal}
                  style={{ position: "absolute", top: 14, right: 16, background: "rgba(255,255,255,0.18)", border: "none", color: WHITE, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, lineHeight: "30px" }}
                >
                  ✕
                </button>
                {(() => {
                  const m = getStatusMeta(jobDetails.application_status);
                  return (
                    <span style={{
                      position: "absolute", top: 16, left: 20,
                      background: "rgba(255,255,255,0.95)", color: m.color,
                      padding: "5px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: 800,
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
                      {m.label}
                    </span>
                  );
                })()}
              </div>

              {/* Floating logo + title */}
              <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-end", gap: 16, padding: "0 26px", marginTop: 20 }}>
                {jobDetails.company_logo ? (
                  <img src={jobDetails.company_logo} alt={jobDetails.company_name} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 16, border: `4px solid ${WHITE}`, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", background: WHITE, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 76, height: 76, background: TEAL_SOFT, borderRadius: 16, border: `4px solid ${WHITE}`, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🏢</div>
                )}
                <div style={{ paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{jobDetails.job_title}</h3>
                  <p style={{ margin: "3px 0 0", color: TEXT_MUTE, fontSize: 13.5, fontWeight: 600 }}>{jobDetails.company_name}</p>
                </div>
              </div>

              <div style={{ padding: "22px 26px 26px" }}>
                {/* Info cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                  {[
                    ["💼", "Job type", jobDetails.job_type || "Full Time"],
                    ["🏠", "Location type", jobDetails.job_location_type || "On-site"],
                    ["💰", "Salary range", this.formatSalary(jobDetails.min_salary, jobDetails.max_salary, jobDetails.currency)],
                    ["🎯", "Experience", jobDetails.min_experience && jobDetails.max_experience ? `${jobDetails.min_experience} – ${jobDetails.max_experience}` : "Not specified"],
                    ["📍", "Location", `${jobDetails.country || "Pakistan"}${jobDetails.city ? `, ${jobDetails.city}` : ""}`],
                  ].map(([icon, label, val]) => (
                    <div key={label} style={{ background: BG, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, color: "#9aa4a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {jobDetails.job_description && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, color: "#9aa4a6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Description</div>
                    <div style={{ fontSize: 13.5, color: "#444", lineHeight: 1.7, background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`, padding: "14px 16px", borderRadius: "0 10px 10px 0", maxHeight: 200, overflowY: "auto" }}>
                      {jobDetails.job_description}
                    </div>
                  </div>
                )}

                {jobDetails.skills && jobDetails.skills.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#9aa4a6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Required skills</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(Array.isArray(jobDetails.skills) ? jobDetails.skills : jobDetails.skills.split(",")).map((skill, i) => (
                        <span key={i} style={{ background: TEAL_SOFT, color: TEAL, border: `1px solid ${TEAL}33`, padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {typeof skill === "string" ? skill.trim() : skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </ModalBody>
        <ModalFooter style={{ borderTop: `1px solid ${BORDER}`, padding: "14px 26px" }}>
          <button onClick={this.closeModal} style={{ background: TEAL, color: WHITE, border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700, fontFamily: FONT }}>
            Close
          </button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    const { jobs, loading, filter } = this.state;
    const filteredJobs = jobs.filter((j) => matchesFilter(j, filter));

    const countFor = (key) => jobs.filter((j) => matchesFilter(j, key)).length;

    return (
      <div style={{ background: BG, minHeight: "100vh", padding: "28px 0 90px", fontFamily: FONT }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        <style>{`
          @media (max-width: 480px) {
            .job-activity-container {
              padding: 0 12px !important;
            }
            .job-activity-grid {
              grid-template-columns: 1fr !important;
              gap: 14px !important;
            }
          }
          @media (max-width: 400px) {
            .job-activity-container {
              padding: 0 8px !important;
            }
          }

          @media (max-width: 480px) {
            .pipeline-stage-label {
              font-size: 8px !important;
            }
          }
        `}</style>

        <div className="job-activity-container" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: 26 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-0.3px" }}>Job Activity</h1>
            <p style={{ margin: "6px 0 0", color: TEXT_MUTE, fontSize: 14 }}>
              See where each job stands, from application to offer
            </p>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => this.setState({ filter: f.key })}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: active ? TEAL : WHITE,
                    color: active ? WHITE : TEXT_MUTE,
                    border: `1.5px solid ${active ? TEAL : BORDER}`,
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: FONT,
                  }}
                >
                  {f.label}
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.22)" : SLATE_BG,
                      color: active ? WHITE : "#8a9294",
                      fontSize: 11,
                      fontWeight: 800,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                    }}
                  >
                    {countFor(f.key)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 70, background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}` }}>
              <Spinner style={{ color: TEAL }} />
              <p style={{ marginTop: 16, color: TEXT_MUTE }}>Loading…</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 70, background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>📭</div>
              <p style={{ color: TEXT_MUTE, fontSize: 14, fontWeight: 600, margin: 0 }}>No applications in this view</p>
              <p style={{ color: "#9aa4a6", fontSize: 12.5, marginTop: 4 }}>Try a different filter, or go apply to more jobs.</p>
            </div>
          ) : (
            <div className="job-activity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
              {filteredJobs.map((job) => {
                const meta = getStatusMeta(job.status);
                return (
                  <div
                    key={job.application_id}
                    onClick={() => this.openJobDetails(job)}
                    style={{
                      background: WHITE,
                      borderRadius: 14,
                      border: `1px solid ${BORDER}`,
                      borderLeft: `4px solid ${meta.terminal ? meta.color : meta.accent}`,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s, transform 0.15s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(31,50,56,0.08)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ padding: "18px 18px 14px" }}>
                      {/* Top row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
                          {job.company_logo_url ? (
                            <img src={job.company_logo_url} alt={job.company_name} style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 10, border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 46, height: 46, background: TEAL_SOFT, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏢</div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: INK, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {job.job_title}
                            </h3>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: TEXT_MUTE, fontWeight: 600 }}>{job.company_name || "Company"}</p>
                            {(() => {
                              const sourceBadge = getSourceBadge(job);
                              return (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 10.5, fontWeight: 700, color: sourceBadge.color,
                                  background: sourceBadge.bg, padding: "2px 8px", borderRadius: 10,
                                  marginTop: 5,
                                }}>
                                  {sourceBadge.icon} {sourceBadge.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <span style={{ background: meta.bg, color: meta.color, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8 }}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Pipeline rail — signature element */}
                      <div style={{ marginBottom: 14 }}>
                        <PipelineRail status={job.status} accent={meta.terminal ? meta.color : meta.accent} />
                      </div>

                      {/* Meta chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {job.city_name && (
                          <span style={{ fontSize: 11.5, color: "#4b5563", background: BG, padding: "4px 9px", borderRadius: 7, fontWeight: 600 }}>
                            📍 {job.city_name}
                          </span>
                        )}
                        {job.job_type && (
                          <span style={{ fontSize: 11.5, color: "#4b5563", background: BG, padding: "4px 9px", borderRadius: 7, fontWeight: 600 }}>
                            💼 {job.job_type}
                          </span>
                        )}
                        {job.min_salary && (
                          <span style={{ fontSize: 11.5, color: TEAL, background: TEAL_SOFT, padding: "4px 9px", borderRadius: 7, fontWeight: 700 }}>
                            {this.formatSalary(job.min_salary, job.max_salary, job.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: "auto", padding: "12px 18px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fbfcfc" }}>
                      <span style={{ fontSize: 11.5, color: "#9aa4a6", fontWeight: 600 }}>Applied {this.formatDate(job.created_at)}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {job.status === "Applied" && (
                          <button
                            onClick={(e) => this.cancelApplication(job, e)}
                            style={{ background: RED_BG, color: RED, border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); this.openJobDetails(job); }}
                          style={{ background: TEAL, color: WHITE, border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {this.renderJobDetailsModal()}
      </div>
    );
  }
}

export default AppliedJobs;
