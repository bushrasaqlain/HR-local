import React, { Component } from "react";
import axios from "axios";
import CandidateInfo from "./candidateinfo";
import Head from "next/head";

const BRAND = "#36565f";
const BRAND_LIGHT = "#e8f0f1";

const Avatar = ({ src, name, size = 40, locked = false }) => {
  if (locked) {
    return (
      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #5f8190, #36565f)", border: "2px solid #e2f0f0", fontSize: 15 }}>
        {(name || "?").charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${src.replace(/^\/+/, "")}` : "/images/user.png"}
      alt={name}
      onError={(e) => { e.target.src = "/images/user.png"; }}
      className="rounded-circle border flex-shrink-0"
      style={{ width: size, height: size, objectFit: "cover", borderColor: "#667eea" }}
    />
  );
};

const StatusBadge = ({ status }) => {
  const map = { Pending: "bg-warning text-dark", Rejected: "bg-danger text-white", Shortlisted: "bg-success text-white" };
  return <span className={`badge rounded-pill ${map[status] || "bg-secondary text-white"}`}>{status || "Pending"}</span>;
};

const TierBadge = ({ candidate }) => {
  if (!candidate?.tier || !candidate?.tier_label) return null;
  const map = {
    strong: "bg-success-subtle text-success border border-success-subtle",
    good: "bg-primary-subtle text-primary border border-primary-subtle",
    weak: "bg-warning-subtle text-warning border border-warning-subtle",
  };
  return <span className={`badge rounded-pill ${map[candidate.tier] || "bg-secondary-subtle text-secondary"}`} style={{ fontSize: 11 }}>{candidate.tier_label}</span>;
};

const CandidateMeta = ({ candidate }) => {
  const specName = candidate.experience?.[0]?.speciality?.name || (candidate.speciality_name !== "-" ? candidate.speciality_name : null);
  const skillNames = candidate.skill_names?.length > 0 ? candidate.skill_names : (candidate.skills || []).map(s => s.name || s).filter(Boolean);
  const avail = candidate.availability || candidate.availabilityList || [];
  return (
    <div className="d-flex flex-column gap-1 mt-1" style={{ fontSize: "0.72rem" }}>
      {specName && <span style={{ color: "#805ad5", fontWeight: 600 }}>{specName}</span>}
      {skillNames.length > 0 && <span className="text-secondary">{skillNames.slice(0, 2).join(", ")}</span>}
      {avail.length > 0 && <span style={{ color: "#2b6cb0" }}>{avail[0].day} {avail[0].shift || avail[0].time || ""}</span>}
    </div>
  );
};

class AllApplicants extends Component {
  state = {
    selectedJobId: "", postedJobs: [], showFilters: false,
    candidates: [], allApplicants: [], cities: [],
    currentPage: 1, itemsPerPage: 10,
    selectedStatus: "Pending", selectedCityId: "", searchFilters: {},
    selectedCandidate: null, selectedCandidateId: null,
    splitViewActive: false, mobileDetailView: false,
    counts: { all: 0, pending: 0, shortlisted: 0, rejected: 0, approved: 0 },
    windowWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
    budgetStatus: null, unlockingIds: new Set(),
    jobMessage: "",
    jobSearch: "",
  showJobDropdown: false,
  };

  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;

  componentDidMount() {
    this.fetchPostedJobs();
    this.fetchAllCandidates();
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => this.setState({ windowWidth: window.innerWidth });
  isMobile = () => this.state.windowWidth <= 768;

  openCandidatePage = (candidate) => {
    if (candidate.locked) return;
    const mobile = this.isMobile();
    this.trackCandidateProfileView(candidate.account_id || candidate.candidate_id || candidate.id, Number(this.state.selectedJobId) || null);
    this.setState({ selectedCandidate: null }, () => {
      this.setState({
        selectedCandidate: candidate,
        selectedCandidateId: candidate.candidate_id || candidate.id,
        splitViewActive: !mobile, mobileDetailView: mobile, showCandidateInfo: true,
      });
    });
  };

  trackCandidateProfileView = async (candidateAccountId, jobId) => {
    if (!candidateAccountId) return;
    try {
      const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
      await axios.post(`${this.apiBaseUrl}candidateProfile/track-profile-view/${candidateAccountId}`,
        { job_id: jobId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) { console.error("Profile view tracking failed:", err); }
  };

  closeSplitView = () => this.setState({ splitViewActive: false });
  closeDetailView = () => this.setState({ mobileDetailView: false, splitViewActive: false });

fetchPostedJobs = async () => {
  try {
    const res = await axios.get(`${this.apiBaseUrl}job/managejob/${this.userId}`);
    const activeJobs = (res.data || []).filter(j => j.status === "Active");
    this.setState({ postedJobs: activeJobs }, () => {
      if (activeJobs.length > 0) {
        this.setState({
          selectedJobId: activeJobs[0].id,
          jobSearch: activeJobs[0].job_title, // ← add this line
          showFilters: true,
        }, this.fetchAllCandidates);
      }
    });
  } catch (err) { console.error(err); }
};

  fetchAllCandidates = async () => {
    const { selectedJobId, selectedSkillId, selectedspecialityId, selectedSalary,
      selectedExperience, availability, selectedCountryId, selectedDistrictId,
      selectedCityIds = [], searchFilters } = this.state;

    if (!selectedJobId) return this.setState({ candidates: [], allApplicants: [] });

    try {
      const res = await axios.get(`${this.apiBaseUrl}applicant/applicantsData/${this.userId}`, {
        params: {
          skill_id: selectedSkillId, job_id: selectedJobId,
          speciality_id: selectedspecialityId || "",
          min_salary: selectedSalary?.min ?? "", max_salary: selectedSalary?.max ?? "",
          day: availability?.day || "", shift: availability?.shift || "",
          country_id: selectedCountryId || "", district_id: selectedDistrictId || "",
          city_id: selectedCityIds.join(","), query: searchFilters?.query || "",
          min_experience: selectedExperience?.min ?? "", max_experience: selectedExperience?.max ?? "",
        },
      });

      const budgetStatus = res.data.budget_status || null;
      const jobCityId = this.state.postedJobs.find(j => j.id === Number(this.state.selectedJobId))?.city_id;
      const cityMapObj = {};
      (this.state.cities || []).forEach(city => { cityMapObj[city.id] = city.name; });

      const candidates = (res.data.candidate || []).map(c => {
        const otherPreferredCities = (c.otherPreferredCities || []).map(city =>
          typeof city === "number" ? { id: city, name: cityMapObj[city] || "" } : { id: city.id, name: city.name || cityMapObj[city.id] || "" }
        );
        const mainCityMatch = Number(c.city) === Number(jobCityId);
        const preferredMatch = otherPreferredCities.find(city => Number(city.id) === Number(jobCityId));
        const city_name = mainCityMatch ? (c.city_name || cityMapObj[c.city] || "-")
          : preferredMatch ? (preferredMatch.name || "-")
          : (c.city_name || cityMapObj[c.city] || "-");
        return {
          ...c,
          age: c.date_of_birth ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear() : null,
          skill_names: (c.skills || []).map(s => s.name || s),
          city_name, otherPreferredCities,
          availabilityList: c.availability_times
            ? c.availability_times.split("|").map(s => { const [day, time] = s.split(" "); return { day, time }; })
            : [],
          resume: c.resume || null, address: c.address || "",
        };
      });

      const counts = { all: candidates.length, pending: 0, shortlisted: 0, rejected: 0, approved: 0 };
      candidates.forEach(a => {
        if (a.candidateStatus === "Pending") counts.pending++;
        if (a.candidateStatus === "Shortlisted") counts.shortlisted++;
        if (a.candidateStatus === "Rejected") counts.rejected++;
        if (a.candidateStatus === "Approved") counts.approved++;
      });

      this.setState({
        candidates, allApplicants: candidates, counts, budgetStatus,
        selectedStatus: "Pending", jobMessage: "",
        splitViewActive: false, mobileDetailView: false,
        selectedCandidate: null, selectedCandidateId: null,
      });
    } catch (error) {
      console.error(error);
      const apiError = error.response?.data?.error;
      this.setState({
        candidates: [], allApplicants: [],
        jobMessage: (apiError === "Job not found" || apiError === "Job is pending approval")
          ? "This job is pending approval. Candidates will appear once it is approved."
          : "Something went wrong while loading candidates.",
      });
    }
  };

  unlockCandidate = async (candidateId) => {
    this.setState(prev => { const s = new Set(prev.unlockingIds); s.add(candidateId); return { unlockingIds: s }; });
    try {
      const res = await axios.post(`${this.apiBaseUrl}applicant/unlock-candidate`, { candidateId, jobId: this.state.selectedJobId });
      const { candidate, budget_status } = res.data;
      const merge = list => list.map(c =>
        (c.candidate_id === candidateId || c.id === candidateId)
          ? { ...c, ...candidate, id: candidate.id || candidateId, locked: false, skills: Array.isArray(candidate.skills) ? candidate.skills : [] }
          : c
      );
      this.setState(prev => ({ candidates: merge(prev.candidates), allApplicants: merge(prev.allApplicants), budgetStatus: budget_status || prev.budgetStatus }));
    } catch (error) {
      const msg = error.response?.data?.error;
      alert(msg === "Daily budget exhausted"
        ? "Your daily budget is exhausted. Please increase it or wait until tomorrow."
        : "Something went wrong while unlocking. Please try again.");
    } finally {
      this.setState(prev => { const s = new Set(prev.unlockingIds); s.delete(candidateId); return { unlockingIds: s }; });
    }
  };

  handleApplicationStatus = async (candidateId, jobId, status = "Shortlisted", interview_day = null, interview_time = null) => {
    if (!jobId) return;
    try {
      await axios.post(`${this.apiBaseUrl}applicant/updatestatus`, {
        candidateId, jobId, status,
        ...(interview_day && { interview_day }),
        ...(interview_time && { interview_time }),
      });
      await this.fetchAllCandidates();
      if (this.state.selectedCandidate?.candidate_id === candidateId) {
        const updated = this.state.allApplicants.find(c => c.candidate_id === candidateId);
        if (updated) this.setState({ selectedCandidate: updated });
      }
    } catch (error) { console.error(error.response?.data); }
  };

  handlePageChange = (page) => this.setState({ currentPage: page });

  filterApplicants = () => {
    const { allApplicants, searchFilters, selectedStatus, selectedCityId } = this.state;
    const query = searchFilters?.query?.toLowerCase() || "";
    return allApplicants.filter(c => {
      const statusMatch = selectedStatus ? String(c.candidateStatus || "").trim().toLowerCase() === selectedStatus.toLowerCase() : true;
      const cityMatch = selectedCityId
        ? Number(c.city) === Number(selectedCityId) || c.otherPreferredCities?.some(city => Number(city.id) === Number(selectedCityId))
        : true;
      const searchMatch = !query || c.locked || c.full_name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query);
      return statusMatch && cityMatch && searchMatch;
    });
  };

  renderBudgetBanner() {
    const { budgetStatus } = this.state;
    if (!budgetStatus || budgetStatus.model !== "daily_budget") return null;
    const { daily_cap, spent_today, remaining_today, is_exhausted, cost_per_click } = budgetStatus;
    const pct = daily_cap > 0 ? Math.min(100, Math.round((spent_today / daily_cap) * 100)) : 0;
    return (
      <div className={`alert ${is_exhausted ? "alert-danger" : "alert-info"} mb-3`}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-semibold small">
            {is_exhausted ? "⚠️ Daily budget exhausted — unlock disabled until tomorrow" : `💰 Daily budget: PKR ${remaining_today?.toFixed(0)} remaining`}
          </span>
          <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>PKR {cost_per_click} per unlock</span>
        </div>
        <div className="progress mb-1" style={{ height: 6 }}>
          <div className={`progress-bar ${is_exhausted ? "bg-danger" : ""}`} style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>PKR {spent_today?.toFixed(2)} spent of PKR {daily_cap?.toFixed(2)}</div>
      </div>
    );
  }

  render() {
    const { currentPage, itemsPerPage, counts, splitViewActive, mobileDetailView,
      selectedCandidate, selectedCandidateId, unlockingIds, budgetStatus } = this.state;

    const filtered = this.filterApplicants();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobile = this.isMobile();
    const budgetExhausted = budgetStatus?.is_exhausted === true;
    const showSplit = splitViewActive && selectedCandidate && !mobile;
    const showMobileDetail = mobileDetailView && selectedCandidate && mobile;
    const showList = !showSplit && !showMobileDetail;

    return (
      <>
        <Head><title>All Applicants</title></Head>
        <div className="min-vh-100 p-3 p-md-4" style={{ background: "#e2f0f0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Job selector */}
           {/* Job selector */}
<div className="bg-white rounded-3 shadow p-3 p-md-4 mb-3">
  <label className="fw-semibold small mb-2 d-block">Select Job Position</label>
  <div className="position-relative">
    <input
      type="text"
      className="form-control"
      placeholder="Search or select a job..."
      value={this.state.jobSearch}
      onChange={e => this.setState({ jobSearch: e.target.value, showJobDropdown: true })}
      onFocus={() => this.setState({ showJobDropdown: true })}
      onBlur={() => setTimeout(() => this.setState({ showJobDropdown: false }), 150)}
      style={{
        borderColor: "#36565f",
        boxShadow: "none",
        outline: "none",
      }}
    />

    {this.state.showJobDropdown && (
      <div
        className="position-absolute w-100 bg-white border rounded-3 shadow-sm"
        style={{
          top: "calc(100% + 4px)",
          zIndex: 999,
          maxHeight: 220,
          overflowY: "auto",
          borderColor: "#36565f",
        }}
      >
        {/* Optional: "All" option */}
        <div
          className="px-3 py-2 small"
          style={{ cursor: "pointer", color: "#36565f" }}
          onMouseDown={() => {
            this.setState({
              selectedJobId: "",
              jobSearch: "",
              showJobDropdown: false,
              showFilters: false,
              splitViewActive: false,
              mobileDetailView: false,
              selectedCandidate: null,
              selectedCandidateId: null,
              budgetStatus: null,
            });
          }}
        >
          -- Choose a job to view candidates --
        </div>

        {this.state.postedJobs
          .filter(j =>
            j.job_title.toLowerCase().includes((this.state.jobSearch || "").toLowerCase())
          )
          .map(j => (
            <div
              key={j.id}
              className="px-3 py-2 small"
              style={{
                cursor: "pointer",
                background: this.state.selectedJobId === j.id ? "#e8f0f1" : "",
                color: "#2d3748",
                fontWeight: this.state.selectedJobId === j.id ? 600 : 400,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e8f0f1")}
              onMouseLeave={e => (e.currentTarget.style.background = this.state.selectedJobId === j.id ? "#e8f0f1" : "")}
              onMouseDown={() => {
                this.setState({
                  selectedJobId: j.id,
                  jobSearch: j.job_title,
                  showJobDropdown: false,
                  showFilters: true,
                  splitViewActive: false,
                  mobileDetailView: false,
                  selectedCandidate: null,
                  selectedCandidateId: null,
                  budgetStatus: null,
                }, () => this.fetchAllCandidates());
              }}
            >
              {j.job_title}
            </div>
          ))}

        {this.state.postedJobs.filter(j =>
          j.job_title.toLowerCase().includes((this.state.jobSearch || "").toLowerCase())
        ).length === 0 && (
          <div className="px-3 py-2 small text-muted">No jobs found</div>
        )}
      </div>
    )}
  </div>
</div>

            {this.state.jobMessage && <div className="alert alert-warning">{this.state.jobMessage}</div>}

            {this.state.showFilters && (
              <>
                {this.renderBudgetBanner()}

                {/* Stats */}
                {/* <div className="row g-2 mb-3">
                  {[
                    { label: "Total", value: counts.all, color: "text-primary" },
                    { label: "Pending", value: counts.pending, color: "text-warning" },
                    { label: "Shortlisted", value: counts.shortlisted, color: "text-success" },
                    { label: "Rejected", value: counts.rejected, color: "text-danger" },
                  ].map(({ label, value, color }) => (
                    <div className="col-6 col-md-3" key={label}>
                      <div className="bg-white rounded-3 shadow-sm p-3 text-center">
                        <div className={`fw-bold fs-4 ${color}`}>{value}</div>
                        <div className="text-muted small">{label}</div>
                      </div>
                    </div>
                  ))}
                </div> */}

                {/* Split view */}
                {showSplit && (
                  <div className="d-flex gap-3">
                    <div className="bg-white rounded-3 shadow p-3 overflow-auto" style={{ flex: "0 0 28%", maxHeight: "calc(100vh - 300px)" }}>
                      <h6 className="fw-semibold mb-3">Candidates</h6>
                      <div className="d-flex flex-column gap-2">
                        {current.map(c => {
                          const cId = c.candidate_id || c.id;
                          const isLocked = c.locked === true;
                          const isUnlocking = unlockingIds.has(cId);
                          return (
                            <div
                              key={cId}
                              className="d-flex align-items-center gap-2 p-2 rounded-2 border"
                              style={{ cursor: isLocked ? "default" : "pointer", background: cId === selectedCandidateId ? BRAND_LIGHT : "", borderColor: cId === selectedCandidateId ? BRAND : "transparent" }}
                              onClick={() => !isLocked && this.openCandidatePage(c)}
                            >
                              <Avatar src={c.passport_photo} name={c.full_name} size={36} locked={isLocked} />
                              <div className="overflow-hidden flex-grow-1">
                                <div className="fw-semibold small text-truncate" style={{ color: cId === selectedCandidateId ? BRAND : "#2d3748" }}>{c.full_name || "Candidate"}</div>
                                <CandidateMeta candidate={c} />
                                <TierBadge candidate={c} />
                              </div>
                              {isLocked && (
                                <button
                                  className="btn btn-sm rounded-pill text-white flex-shrink-0"
                                  style={{ background: budgetExhausted ? "#aaa" : "linear-gradient(135deg,#667eea,#764ba2)", fontSize: 11 }}
                                  disabled={isUnlocking || budgetExhausted}
                                  onClick={e => { e.stopPropagation(); if (!budgetExhausted) this.unlockCandidate(cId); }}
                                >
                                  {isUnlocking ? "..." : budgetExhausted ? "🔒" : "🔓 Unlock"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center gap-1 mt-3">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState(p => ({ currentPage: Math.max(1, p.currentPage - 1) }))}>‹</button>
                          <span className="btn btn-sm disabled">{currentPage}/{totalPages}</span>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState(p => ({ currentPage: Math.min(totalPages, p.currentPage + 1) }))}>›</button>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-3 shadow p-3 position-relative overflow-auto" style={{ flex: 1, maxHeight: "calc(100vh - 300px)" }}>
                      <button className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-2" style={{ width: 32, height: 32 }} onClick={this.closeSplitView}>✕</button>
                      <CandidateInfo key={selectedCandidate?.id} candidate={selectedCandidate} selectedJobId={this.state.selectedJobId} onBack={this.closeSplitView} />
                    </div>
                  </div>
                )}

                {/* Mobile detail */}
                {showMobileDetail && (
                  <div className="bg-white rounded-3 shadow p-3">
                    <button className="btn btn-sm btn-outline-secondary rounded-pill mb-3" onClick={this.closeDetailView}>← Back to List</button>
                    <CandidateInfo key={selectedCandidate?.id} candidate={selectedCandidate} selectedJobId={this.state.selectedJobId} onBack={this.closeDetailView} />
                  </div>
                )}

                {/* List view */}
                {showList && (
                  <div className="bg-white rounded-3 shadow p-3">
                    {current.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <p className="fw-semibold mb-1">No candidates found</p>
                        <p className="small">Select a job above to view matching candidates</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0">
                            <thead>
                              <tr style={{ background: BRAND }}>
                                {["Candidate", "Status", "Location", "Match", "Action"].map(h => (
                                  <th key={h} className="text-white fw-semibold small py-3 text-center">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {current.map(c => {
                                const cId = c.candidate_id || c.id;
                                const isLocked = c.locked === true;
                                const isUnlocking = unlockingIds.has(cId);
                                const isSelected = cId === selectedCandidateId;
                                return (
                                  <tr
                                    key={cId}
                                    className={`border-bottom ${isSelected ? "table-active" : ""} ${isLocked ? "bg-light" : ""}`}
                                    style={{
                                      cursor: isLocked ? "default" : "pointer",
                                      borderLeft: isSelected ? `4px solid ${BRAND}` : (!isLocked && c.is_boosted ? "3px solid #f59e0b" : ""),
                                      background: !isLocked && c.is_boosted && !isSelected ? "#fffbeb" : undefined,
                                    }}
                                    onClick={() => !isLocked && this.openCandidatePage(c)}
                                  >
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <Avatar src={c.passport_photo} name={c.full_name} size={40} locked={isLocked} />
                                        <div>
                                          <div className="fw-semibold small">{c.full_name || "Candidate"}</div>
                                          <CandidateMeta candidate={c} />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center"><StatusBadge status={c.candidateStatus} /></td>
                                    <td className="text-center">
                                      <span className="badge bg-light text-secondary border rounded-pill">📍 {c.city_name || "Not specified"}</span>
                                    </td>
                                    <td className="text-center"><TierBadge candidate={c} /></td>
                                    <td className="text-center">
                                      {isLocked ? (
                                        <button
                                          className="btn btn-sm rounded-pill text-white"
                                          style={{ background: budgetExhausted ? "#aaa" : "linear-gradient(135deg,#667eea,#764ba2)", fontSize: 12 }}
                                          disabled={isUnlocking || budgetExhausted}
                                          onClick={e => { e.stopPropagation(); if (!budgetExhausted) this.unlockCandidate(cId); }}
                                          title={budgetExhausted ? "Daily budget exhausted" : `Unlock for PKR ${budgetStatus?.cost_per_click || ""}`}
                                        >
                                          {isUnlocking ? <><i className="fas fa-spinner fa-spin me-1" />Unlocking...</>
                                            : budgetExhausted ? "🔒 Budget full"
                                            : `🔓 Unlock${budgetStatus?.cost_per_click ? ` (PKR ${budgetStatus.cost_per_click})` : ""}`}
                                        </button>
                                      ) : c.has_applied ? (
                                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle" style={{ fontSize: 11 }}>✓ Applied</span>
                                      ) : (
                                        <span className="text-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {totalPages > 1 && (
                          <nav className="d-flex justify-content-center mt-3">
                            <ul className="pagination pagination-sm mb-0">
                              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => this.setState(p => ({ currentPage: p.currentPage - 1 }))}>‹</button>
                              </li>
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => Math.abs(p - currentPage) <= 2)
                                .map(p => (
                                  <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                                    <button className="page-link" style={p === currentPage ? { background: BRAND, borderColor: BRAND } : {}} onClick={() => this.setState({ currentPage: p })}>{p}</button>
                                  </li>
                                ))}
                              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => this.setState(p => ({ currentPage: p.currentPage + 1 }))}>›</button>
                              </li>
                            </ul>
                          </nav>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}

export default AllApplicants;