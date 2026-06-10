import React, { Component } from "react";
import axios from "axios";
import { FaCheckCircle, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import CandidateInfo from "./applicants/candidateinfo";
import Head from "next/head";
import ChatBox from "./messages/chatBox";

const BRAND = "#36565f";
const BRAND_LIGHT = "#e8f0f1";

const Avatar = ({ src, name, size = 40 }) => (
  <img
    src={src ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${src.replace(/^\/+/, "")}` : "/images/user.png"}
    alt={name}
    onError={(e) => { e.target.src = "/images/user.png"; }}
    className="rounded-circle border"
    style={{ width: size, height: size, objectFit: "cover", borderColor: BRAND }}
  />
);

const StatusBadge = ({ status }) => {
  const map = {
    Pending: "bg-warning text-dark",
    Rejected: "bg-danger text-white",
    Approved: "bg-primary text-white",
    Offered: "bg-success text-white",
  };
  return <span className={`badge rounded-pill ${map[status] || "bg-secondary text-white"}`}>{status || "Offered"}</span>;
};

const ResponseBadge = ({ response }) => {
  if (!response) return <span className="text-muted small">Waiting for response</span>;
  const map = {
    Accepted: ["bg-success-subtle text-success", "Accepted"],
    Rejected: ["bg-danger-subtle text-danger", "Rejected"],
  };
  const [cls, label] = map[response] || ["bg-secondary-subtle text-secondary", response];
  return <span className={`badge rounded-pill ${cls}`}>{label}</span>;
};
class Offered extends Component {
  state = {
    selectedJobId: "", postedJobs: [], showFilters: false,
    candidates: [], allApplicants: [], cities: [],
    currentPage: 1, itemsPerPage: 10,
    selectedStatus: "Offered", selectedCityId: "", searchFilters: {},
    selectedCandidate: null, selectedCandidateId: null,
    splitViewActive: false, mobileDetailView: false, showCandidateMessage: false,
    showConfirmRescheduleModal: false, selectedConfirmRescheduleCandidate: null,
    counts: { all: 0, pending: 0, shortlisted: 0, rejected: 0, approved: 0 },
    windowWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
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
    const mobile = this.isMobile();
    this.setState({
      selectedCandidate: candidate, selectedCandidateId: candidate.id,
      splitViewActive: !mobile, mobileDetailView: mobile, showCandidateMessage: false,
    });
  };

  closeSplitView = () => this.setState({ splitViewActive: false, mobileDetailView: false });

  openCandidateMessage = (candidate) => this.setState({
    selectedCandidate: candidate, showCandidateMessage: true,
    splitViewActive: false, mobileDetailView: false,
  });

  fetchPostedJobs = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}job/managejob/${this.userId}`);
      const activeJobs = (res.data || []).filter(j => j.status === "Active");
      this.setState({ postedJobs: activeJobs }, () => {
        if (activeJobs.length > 0) {
          this.setState({ selectedJobId: activeJobs[0].id, showFilters: true }, this.fetchAllCandidates);
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

      const candidates = (res.data.candidate || []).map(c => ({
        ...c,
        age: c.date_of_birth ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear() : null,
        skill_names: (c.skills || []).map(s => s.name || s),
        city_name: c.city_name || "-",
        availabilityList: c.availability_times
          ? c.availability_times.split("|").map(s => { const [day, time] = s.split(" "); return { day, time }; })
          : [],
        candidate_response: c.candidate_response || null,
        requested_interview_day: c.requested_interview_day || null,
        requested_interview_time: c.requested_interview_time || null,
      }));

      const counts = { all: candidates.length, pending: 0, shortlisted: 0, rejected: 0, approved: 0 };
      candidates.forEach(a => {
        if (a.candidateStatus === "Pending") counts.pending++;
        if (a.candidateStatus === "Offered") counts.shortlisted++;
        if (a.candidateStatus === "Rejected") counts.rejected++;
        if (a.candidateStatus === "Approved") counts.approved++;
      });

      this.setState({
        candidates, allApplicants: candidates, counts, selectedStatus: "Offered",
        splitViewActive: false, mobileDetailView: false,
        selectedCandidate: null, selectedCandidateId: null,
      });
    } catch (err) { console.error(err); }
  };

  handleConfirmReschedule = async (candidate) => {
    const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
    try {
      await axios.post(`${this.apiBaseUrl}applicant/updatestatus`,
        { candidateId: candidate.candidate_id, jobId: this.state.selectedJobId, company_status: "confirmed", candidate_response: "confirmed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      this.fetchAllCandidates();
    } catch (err) { console.error(err); }
  };

  filterApplicants = () => {
    const { allApplicants, searchFilters, selectedStatus, selectedCityId } = this.state;
    const query = searchFilters?.query?.toLowerCase() || "";
    return allApplicants.filter(c => {
      const statusMatch = selectedStatus ? c.candidateStatus === selectedStatus : true;
      const cityMatch = selectedCityId ? Number(c.city) === Number(selectedCityId) : true;
      const searchMatch = !query || c.full_name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query);
      return statusMatch && cityMatch && searchMatch;
    });
  };

  render() {
    const { currentPage, itemsPerPage, splitViewActive, mobileDetailView,
      selectedCandidate, selectedCandidateId, showCandidateMessage } = this.state;

    const filtered = this.filterApplicants();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const hasCandidateResponse = current.some(c => c.candidate_response);
    const mobile = this.isMobile();
    const showSplit = splitViewActive && selectedCandidate && !mobile;
    const showMobileDetail = mobileDetailView && selectedCandidate && mobile;
    const showList = !showSplit && !showMobileDetail && !showCandidateMessage;

    if (showCandidateMessage && selectedCandidate) {
      return (
        <ChatBox
          candidateId={selectedCandidate.candidate_id || selectedCandidate.account_id}
          selectedContactId={selectedCandidate.account_id}
          selectedContactName={selectedCandidate.full_name || selectedCandidate.username}
          selectedJobId={this.state.selectedJobId}
          onBack={() => this.setState({ showCandidateMessage: false, selectedCandidate: null, splitViewActive: false, mobileDetailView: false })}
        />
      );
    }

    return (
      <>
        <Head><title>Offered Candidates</title></Head>
        <div className="min-vh-100 p-3 p-md-4" style={{ background: "#e2f0f0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

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

            {this.state.showFilters && (
              <>
                {showSplit && (
                  <div className="d-flex gap-3">
                    <div className="bg-white rounded-3 shadow p-3 overflow-auto" style={{ flex: "0 0 28%", maxHeight: "calc(100vh - 260px)" }}>
                      <h6 className="fw-semibold mb-3">Candidates</h6>
                      <div className="d-flex flex-column gap-2">
                        {current.map(c => (
                          <div
                            key={c.id}
                            className="d-flex align-items-center gap-2 p-2 rounded-2 border"
                            style={{ cursor: "pointer", background: c.id === selectedCandidateId ? BRAND_LIGHT : "", borderColor: c.id === selectedCandidateId ? BRAND : "transparent" }}
                            onClick={() => this.openCandidatePage(c)}
                          >
                            <Avatar src={c.passport_photo} name={c.full_name} size={36} />
                            <div className="overflow-hidden">
                              <div className="fw-semibold small text-truncate" style={{ color: c.id === selectedCandidateId ? BRAND : "#2d3748" }}>{c.full_name}</div>
                              {c.candidate_response && <ResponseBadge response={c.candidate_response} />}
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center gap-1 mt-3">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState(p => ({ currentPage: Math.max(1, p.currentPage - 1) }))}>‹</button>
                          <span className="btn btn-sm disabled">{currentPage}/{totalPages}</span>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState(p => ({ currentPage: Math.min(totalPages, p.currentPage + 1) }))}>›</button>
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded-3 shadow p-3 position-relative overflow-auto" style={{ flex: 1, maxHeight: "calc(100vh - 260px)" }}>
                      <button className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-2" style={{ width: 32, height: 32 }} onClick={this.closeSplitView}>✕</button>
                      <CandidateInfo candidate={selectedCandidate} selectedJobId={this.state.selectedJobId} onBack={this.closeSplitView} />
                    </div>
                  </div>
                )}

                {showMobileDetail && (
                  <div className="bg-white rounded-3 shadow p-3">
                    <button className="btn btn-sm btn-outline-secondary rounded-pill mb-3" onClick={this.closeSplitView}>← Back to List</button>
                    <CandidateInfo candidate={selectedCandidate} selectedJobId={this.state.selectedJobId} onBack={this.closeSplitView} />
                  </div>
                )}

                {showList && (
                  <div className="bg-white rounded-3 shadow p-3">
                    {current.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <p className="fw-semibold mb-1">No offered candidates found</p>
                        <p className="small">Select a job above to view matching candidates</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0">
                            <thead>
                              <tr style={{ background: BRAND }}>
                                <th className="text-white fw-semibold small py-3">Candidate</th>
                                <th className="text-white fw-semibold small py-3 text-center">Status</th>
                                {hasCandidateResponse && <>
                                  <th className="text-white fw-semibold small py-3 text-center">Response</th>
                                  <th className="text-white fw-semibold small py-3 text-center">Action</th>
                                </>}
                              </tr>
                            </thead>
                            <tbody>
                              {current.map(c => (
                                <tr
                                  key={c.id}
                                  className="border-bottom"
                                  style={{ cursor: "pointer", borderLeft: c.id === selectedCandidateId ? `4px solid ${BRAND}` : "" }}
                                  onClick={() => this.openCandidatePage(c)}
                                >
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <Avatar src={c.passport_photo} name={c.full_name} />
                                      <div>
                                        <div className="fw-semibold small">{c.full_name}</div>
                                        {!mobile && <div className="text-muted" style={{ fontSize: 12 }}>{c.email}</div>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center"><StatusBadge status={c.candidateStatus} /></td>
                                  {hasCandidateResponse && <>
                                    <td className="text-center">
                                      <div>
                                        <ResponseBadge response={c.candidate_response} />
                                        {!mobile && c.candidate_response === "Reschedule Requested" && (
                                          <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                                            <FaCalendarAlt size={9} className="me-1" />
                                            {c.requested_interview_day ? new Date(c.requested_interview_day).toLocaleDateString() : ""} {c.requested_interview_time || ""}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                   <td className="text-center">
  <div className="d-flex gap-1 justify-content-center">
    {c.candidate_response === "Accepted" && (
      <button
        className="btn btn-sm rounded-circle text-white"
        style={{ background: BRAND, width: 34, height: 34 }}
        onClick={e => { e.stopPropagation(); this.openCandidateMessage(c); }}
      >
        <FaEnvelope size={14} />
      </button>
    )}
  </div>
</td>
                                  </>}
                                </tr>
                              ))}
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

        {this.state.showConfirmRescheduleModal && (
          <div className="modal fade show d-block" style={{ background: "#e2f0f0" }} onClick={() => this.setState({ showConfirmRescheduleModal: false })}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header text-white" style={{ background: BRAND }}>
                  <h6 className="modal-title mb-0">Confirm Reschedule</h6>
                  <button className="btn-close btn-close-white" onClick={() => this.setState({ showConfirmRescheduleModal: false })} />
                </div>
                <div className="modal-body small">
                  <p>Confirm reschedule request from <strong>{this.state.selectedConfirmRescheduleCandidate?.full_name}</strong>?</p>
                  <div className="bg-light rounded p-3">
                    <div><strong>Date:</strong> {this.state.selectedConfirmRescheduleCandidate?.requested_interview_day ? new Date(this.state.selectedConfirmRescheduleCandidate.requested_interview_day).toLocaleDateString() : "N/A"}</div>
                    <div className="mt-1"><strong>Time:</strong> {this.state.selectedConfirmRescheduleCandidate?.requested_interview_time || "N/A"}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-sm btn-secondary" onClick={() => this.setState({ showConfirmRescheduleModal: false, selectedConfirmRescheduleCandidate: null })}>Cancel</button>
                  <button className="btn btn-sm btn-success" onClick={() => { this.handleConfirmReschedule(this.state.selectedConfirmRescheduleCandidate); this.setState({ showConfirmRescheduleModal: false }); }}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default Offered;