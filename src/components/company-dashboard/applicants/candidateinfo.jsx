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
        screeningAnswers: [],
    loadingAnswers: false,
      };
    }

    componentDidMount() {
      if (!this.state.candidateData && this.props.id) {
        this.fetchCandidate();
      }  else {
    this.setState({ loading: false }, this.fetchScreeningAnswers);
  }
    }
fetchScreeningAnswers = async () => {
  const appId = this.state.candidateData?.application_id;
  if (!appId) return;
  this.setState({ loadingAnswers: true });
  try {
    const token = localStorage.getItem("token");
    const res = await api.get(`applications/${appId}/answers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    this.setState({ screeningAnswers: res.data.answers || [], loadingAnswers: false });
  } catch (err) {
    console.error("Failed to fetch screening answers:", err);
    this.setState({ loadingAnswers: false });
  }
};
    fetchCandidate = async () => {
      const { id } = this.props;
      if (!id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/candidate/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.setState({ candidateData: res.data, loading: false }, this.fetchScreeningAnswers);
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
      console.log("candidateData:", candidateData);

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
<div className="card shadow-sm rounded-4 p-4 mb-4">
                      <h5 className="mb-3">Contact Details</h5>
    
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
                {/* ================= BODY ================= */}
                <div className="d-flex flex-column gap-4">

   {/* Availability */}
                <div className="card shadow-sm rounded-4 p-4">
                  <h5 className="mb-3">Availability</h5>
                  {candidateData.availability?.length ? (
                    <div className="d-flex flex-column gap-2">
                      {candidateData.availability.map((av, idx) => {
                        const formatTime = (time) => {
                          if (!time) return "24/7"; // ✅ Handle null for 24/7
                          const [hour, min] = time.split(":");
                          const h = parseInt(hour, 10);
                          const ampm = h >= 12 ? "PM" : "AM";
                          const hour12 = h % 12 === 0 ? 12 : h % 12;
                          return `${hour12}:${min} ${ampm}`;
                        };

                        const isFullDay = !av.startTime && !av.endTime;

                        return (
                          <div key={idx} className="d-flex gap-3">
                            <div className="fw-bold" style={{ minWidth: "120px" }}>
                              {av.day}
                            </div>
                            <div>
                              {isFullDay ? (
                                <span className="badge bg-success">✅ 24/7 Available</span>
                              ) : (
                                <>
                                  {formatTime(av.startTime)} – {formatTime(av.endTime)} ({av.shift})
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>-</p>
                  )}
                </div>


  {/* Documents */}
  <div className="card shadow-sm rounded-4 p-4">
    <h5 className="mb-3">Documents</h5>

    <div className="mb-3">
      <strong>Resume</strong>
      <div className="mt-2">
        {candidateData.resume ? (
          
           <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${candidateData.resume.replace(/^\/+/, "")}`}
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

    <div className="mb-3">
      <strong>Certificates</strong>
      <div className="mt-2">
        {candidateData.certificates?.length ? (
          candidateData.certificates.map((cert, idx) => {
            if (!cert?.document_path) return null;
            const fileName = cert.document_path.split("\\").pop();
            return (
              <div key={idx} className="mb-2">
                
                 <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}uploads/certificate/${fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm"
                >
                  {cert.document_name || `Certificate ${idx + 1}`}
                </a>
              </div>
            );
          })
        ) : (
          <div className="text-muted">N/A</div>
        )}
      </div>
    </div>
  </div>

  {/* License & Status */}
  <div className="card shadow-sm rounded-4 p-4">
    <h6 className="fw-bold">License Type</h6>
    <p>{candidateData.license_type || "-"}</p>
    <h6 className="fw-bold">License No.</h6>
    <p>{candidateData.license_number || "-"}</p>
    
  </div>
{/* Screening Answers */}
{candidateData.application_id && (
  <div className="card shadow-sm rounded-4 p-4">
    <h5 className="mb-3">Screening Answers</h5>
    {this.state.loadingAnswers ? (
      <div className="text-muted small">Loading…</div>
    ) : !this.state.screeningAnswers.length ? (
      <div className="text-muted small">No screening answers submitted.</div>
    ) : (
      this.state.screeningAnswers.map((a, i) => (
        <div key={i} className="mb-3 pb-3 border-bottom">
          <div className="fw-semibold small mb-1">{a.question_text}</div>
          <div className="text-secondary small">{a.answer_text || "—"}</div>
        </div>
      ))
    )}
  </div>
)}
</div>

              </>
            )}
          </div>
        </Container> 
      );
    }
  }

  export default CandidateInfo;
