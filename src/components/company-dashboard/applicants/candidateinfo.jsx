  import React, { Component } from "react";
  import api from "../../lib/api";
  import ApplicantCard from "./applicantCards";
  import { Container } from "reactstrap";
  import {
    FaMapMarkerAlt,
    FaFileAlt,
    FaCalendarAlt,
    FaCity,
    FaStar,
  } from "react-icons/fa";
  import Head from "next/head";

  class CandidateInfo extends Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: true,
        candidateData: props.candidate || null,
        interviewDay: "",
        interviewTime: "",
      };
    }

    componentDidMount() {
      if (!this.state.candidateData && this.props.id) {
        this.fetchCandidate();
      } else {
        this.setState({ loading: false });
      }
    }

    fetchCandidate = async () => {
      const { id } = this.props;
      if (!id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/candidate/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.setState({ candidateData: res.data, loading: false });
      } catch (err) {
        console.error("Failed to fetch candidate:", err);
        this.setState({ loading: false });
      }
    };
    handleStatusChange = async (e) => {
      const newStatus = e.target.value;
      const { candidateData } = this.state;

      try {
        const token = localStorage.getItem("token");
        await api.post(
          `applicant/updatestatus`,
          { candidateId: candidateData.id, status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        this.setState({
          candidateData: { ...candidateData, candidateStatus: newStatus },
        });

        alert(`Candidate status updated to "${newStatus}"`);
      } catch (err) {
        console.error("Failed to update status", err);
        alert("Failed to update status");
      }
    };
    handleInterviewDayChange = (e) => {
      this.setState({ interviewDay: e.target.value });
    };

    handleInterviewTimeChange = (e) => {
      this.setState({ interviewTime: e.target.value });
    };
    handleScheduleInterview = async () => {
      const { candidateData, interviewDay, interviewTime } = this.state;
      const { selectedJobId } = this.props; // ← get jobId from props

      if (!interviewDay || !interviewTime) {
        return alert("Please select both date and time for the interview.");
      }

      try {
        const token = localStorage.getItem("token");

        await api.post(
          `applicant/updatestatus`,
          {
            candidateId: candidateData.id || candidateData.candidate_id, // ✅ candidate ID
            jobId: candidateData.job_id || selectedJobId, // ✅ job ID
            status: candidateData.candidateStatus || "Pending",
            interview_day: interviewDay,
            interview_time: interviewTime,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        alert(`Interview scheduled on ${interviewDay} at ${interviewTime}`);

        // Update local state
        this.setState({
          candidateData: {
            ...candidateData,
            interview_day: interviewDay,
            interview_time: interviewTime,
          },
        });
      } catch (err) {
        console.error("Failed to schedule interview", err);
        alert("Failed to schedule interview");
      }
    };
    handleSaveNote = async () => {
      const { candidateData, noteMessage } = this.state;

      // Normalize IDs
      const candidateId = candidateData?.id || candidateData?.candidate_id;
      const jobId = this.props.selectedJobId || candidateData?.job_id;
      const status = candidateData?.candidateStatus || "Pending";

      if (!candidateId || !jobId || !status) {
        return alert("Candidate ID or Job ID is missing");
      }

      try {
        const token = localStorage.getItem("token");
        await api.post(
          "applicant/updatestatus", // or your endpoint for notes
          {
            candidateId,
            jobId,
            status,
            message: noteMessage,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        alert("Note saved successfully");

        // Optionally clear textarea
        this.setState({ noteMessage: "" });
      } catch (err) {
        console.error(err);
        alert("Failed to save note");
      }
    };
    render() {
      const { loading, candidateData } = this.state;
      const { onBack } = this.props;

      return (
        <Container fluid>
          <Head>
            <title>Candidae Info</title>
          </Head>
          <div className="container py-5">
            {/* <button className="btn btn-outline-secondary mb-4" onClick={onBack}>
              ← Back 
            </button> */}

            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="mt-3">Loading candidate profile...</p>
              </div>
            )}

            {!loading && !candidateData && (
              <div className="alert alert-warning text-center">
                No candidate found.
              </div>
            )}

            {!loading && candidateData && (
              <>
                {/* ================= HEADER ================= */}
               <div className="card shadow-sm rounded-4 p-3 p-md-4 mb-4">
  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3 w-100">
      <img
        src={
          candidateData.passport_photo
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidateData.passport_photo.replace(/^\/+/, "")}`
            : "/images/user.png"
        }
        alt="Profile"
        className="rounded-circle"
        style={{ 
          width: "70px", 
          height: "70px", 
          objectFit: "cover",
          minWidth: "70px" // Prevents image from shrinking
        }}
      />
      <div className="flex-grow-1" style={{ minWidth: 0 /* Prevents text overflow */ }}>
        <h4 className="mb-1 fs-5 fs-md-4">{candidateData.full_name}</h4>
        <div className="text-muted small">
          {candidateData.date_of_birth
            ? `${new Date().getFullYear() - new Date(candidateData.date_of_birth).getFullYear()} years old`
            : "-"}
        </div>
        <div className="text-muted small">
          <i className="fas fa-phone me-1"></i>
          {candidateData.phone || "Not specified"}
        </div>
        <div className="text-muted small">
          <i className="fas fa-envelope me-1"></i>
          <a href={`mailto:${candidateData.email}`} className="text-muted text-decoration-none">
            {candidateData.email || "not specified"}
          </a>
        </div>
        <div className="text-muted small">
          <i className="fas fa-map-marker-alt me-1"></i>
          {candidateData.address || "Location not specified"}
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="d-flex flex-wrap gap-2 w-100 w-md-auto mt-2 mt-md-0">
<ApplicantCard
  candidate={candidateData}
  onStatusChange={(candidateId, status, interviewDay, interviewTime) => {
    const { selectedJobId } = this.props;
    api
      .post(`applicant/updatestatus`, {
        candidateId,
        jobId: selectedJobId,
        status,
        ...(interviewDay && { interview_day: interviewDay }),    // ✅ snake_case
        ...(interviewTime && { interview_time: interviewTime }), // ✅ snake_case
      })
      .then(() => {
        this.setState({
          candidateData: {
            ...candidateData,
            candidateStatus: status,
            interview_day: interviewDay,   // ✅ also update local state
            interview_time: interviewTime,
          },
        });
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to update status");
      });
  }}
/>
    </div>
  </div>
</div>

                {/* ================= BODY ================= */}
                <div className="row g-4">
                  {/* LEFT SIDE - PROFILE DETAILS */}
                  <div className="col-lg-8">
                    {/* Education */}
                    <div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h5 className="mb-3">Education</h5>
                      {candidateData.education?.length ? (
                        <div className="d-flex flex-column gap-3">
                          {candidateData.education.map((ed, idx) => {
                            const startYear = ed.start_date
                              ? new Date(ed.start_date).getFullYear()
                              : "";
                            const endYear = ed.end_date
                              ? new Date(ed.end_date).getFullYear()
                              : "Present";

                            return (
                              <div key={idx} className="d-flex flex-column gap-1">
                                <div className="fw-bold">
                                  {ed.degreetype?.name || "N/A"} in{" "}
                                  {ed.degreefield?.name || "N/A"}
                                </div>
                                <div className="text-muted">
                                  {ed.institute?.name || "Institute Name"} in{" "}
                                  {startYear} – {endYear}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p>No education details provided.</p>
                      )}
                    </div>

                    {/* Experience */}
                    {/* ========== Experience ========== */}
                    {/* ========== Work Experience ========== */}
                    <div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h5 className="mb-3">Work Experience</h5>

                      {candidateData.experience?.length ? (
                        <div className="d-flex flex-column gap-4">
                          {candidateData.experience.map((exp, idx) => {
                            const start = exp.start_date
                              ? new Date(exp.start_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "";

                            const end = exp.end_date
                              ? new Date(exp.end_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "Present";

                            return (
                              <div key={idx} className="d-flex flex-column">
                                {/* Company */}
                                <div className="fw-bold fs-6">
                                  {exp.company_name || "-"}
                                </div>

                                {/* Duration */}
                                <div className="text-muted small  ">
                                  {start} – {end}
                                </div>

                                {/* Role */}
                                <div className="mt-2 ms-3">
                                  • {exp.designation || "-"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p>No experience details provided.</p>
                      )}
                    </div>

                    {/* Skills & Specialities */}
                    <div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h5 className="mb-3">Skills</h5>
                      {candidateData.skills?.length ? (
                        <div className="d-flex flex-wrap gap-2">
                          {candidateData.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge bg-light text-dark border"
                            >
                              {skill.name || "-"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>-</p>
                      )}

                      <h5 className="mt-3">Specialities</h5>
                      {candidateData.experience?.length ? (
                        <div className="d-flex flex-wrap gap-2">
                          {candidateData.experience.map((exp, idx) => (
                            <span
                              key={idx}
                              className="badge bg-light text-dark border"
                            >
                              {exp.speciality?.name || "N/A"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h5 className="mb-3">Availability</h5>
                      {candidateData.availability?.length ? (
                        <div className="d-flex flex-column gap-2">
                          {candidateData.availability.map((av, idx) => {
                            const formatTime = (time) => {
                              const [hour, min, sec] = time.split(":");
                              const h = parseInt(hour, 10);
                              const ampm = h >= 12 ? "PM" : "AM";
                              const hour12 = h % 12 === 0 ? 12 : h % 12;
                              return `${hour12}:${min} ${ampm}`;
                            };

                            return (
                              <div key={idx} className="d-flex gap-3">
                                <div
                                  className="fw-bold"
                                  style={{ minWidth: "120px" }}
                                >
                                  {av.day}
                                </div>
                                <div>
                                  {formatTime(av.startTime)} -{" "}
                                  {formatTime(av.endTime)} ({av.shift})
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    {/* Resume */}
                    {/* Documents Section */}
                    <div className="card shadow-sm rounded-4 p-4">
                      <h5 className="mb-3">Documents</h5>
                      {/* <hr className="mt-2 mb-4" /> */}

                      {/* Resume */}
                      <div className="mb-3">
                        <strong>Resume</strong>
                        <div className="mt-2">
                          {candidateData.resume ? (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${candidateData.resume.replace(/^\/+/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Resume
                            </a>
                          ) : (
                            <div className="text-muted">N/A</div>
                          )}
                        </div>
                      </div>

                      <hr />

                      {/* Certificates */}
                      <div className="mb-3">
                        <strong>Certificates</strong>
                        <div className="mt-2">
                          {candidateData.certificates?.length ? (
                            candidateData.certificates.map((cert, idx) => {
                              if (!cert?.document_path) return null;

                              // Extract file name from full path
                              const fileName = cert.document_path
                                .split("\\")
                                .pop();

                              return (
                                <div key={idx} className="mb-2">
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL}uploads/certificate/${fileName}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-secondary btn-sm"
                                  >
                                    {cert.document_name ||
                                      `Certificate ${idx + 1}`}
                                  </a>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-muted">N/A</div>
                          )}
                        </div>
                      </div>

                      <hr />

                      {/* Research */}
                      <div>
                        <strong>Research</strong>
                        <div className="mt-2">
                          {candidateData.research?.length ? (
                            candidateData.research.map((res, idx) => {
                              if (!res.document_path && !res.research_link)
                                return null;

                              const fileName = res.document_path
                                ? res.document_path.split("\\").pop()
                                : null;
                              const url =
                                res.research_link ||
                                (fileName
                                  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}uploads/research/${fileName}`
                                  : null);
                              const isLink = !!res.research_link;

                              return (
                                <div key={idx} className="mb-2">
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`btn btn-outline-${isLink ? "success" : "secondary"} btn-sm`}
                                    >
                                      {res.research_title ||
                                        `Research ${idx + 1}`}
                                    </a>
                                  ) : (
                                    <span className="text-muted">
                                      {res.research_title ||
                                        `Research ${idx + 1}`}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-muted">N/A</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE - RECRUITER PANEL */}
                  <div className="col-lg-4">
                    <div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h6 className="fw-bold">License Type</h6>
                      <p>{candidateData.license_type || "-"}</p>
                      <h6 className="fw-bold">License No.</h6>
                      <p>{candidateData.license_number || "-"}</p>
                      <h6 className="fw-bold">Candidate Status</h6>
                      <p
                        className="mt-2"
                        style={{
                          color:
                            candidateData.candidateStatus === "Pending"
                              ? "black"
                              : candidateData.candidateStatus === "Rejected"
                                ? "red"
                                : "green",
                          fontWeight: "bold",
                        }}
                      >
                        {candidateData.candidateStatus || "-"}
                      </p>
                    </div>

                    <div className="card shadow-sm rounded-4 p-4">
                      <h6 className="fw-bold">Internal Notes</h6>
                      <textarea
                        className="form-control mb-2"
                        rows="3"
                        placeholder="Add notes..."
                        value={
                          this.state.noteMessage ||
                          this.props.candidate.message ||
                          ""
                        }
                        onChange={(e) =>
                          this.setState({ noteMessage: e.target.value })
                        }
                      />
                      <button
                        className="btn btn-primary w-100"
                        onClick={this.handleSaveNote}
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Container>
      );
    }
  }

  export default CandidateInfo;
