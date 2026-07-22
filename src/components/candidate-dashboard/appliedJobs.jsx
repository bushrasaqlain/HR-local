import Head from "next/head";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Container, Spinner } from "reactstrap";
import api from "../lib/api"; // ← adjust this path to wherever lib/api actually is relative to this file

class AppliedJobs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      submitting: false,
      job: null,
      questions: [],
      answers: {},
      resumeUrl: "",
      resumeFileName: "",
      newResumeFile: null,
      uploadingResume: false,
      error: "",
      missingRequired: [],
    };
  }

  componentDidMount() {
    if (this.props.jobId) this.loadData(this.props.jobId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.jobId && this.props.jobId !== prevProps.jobId) {
      this.setState({ loading: true, job: null, error: "" }, () => this.loadData(this.props.jobId));
    }
  }

  getToken = () => sessionStorage.getItem("token") || localStorage.getItem("token");

loadData = async (jobId) => {
  const token = this.getToken();
  try {
    const [jobRes, questionsRes, profileRes] = await Promise.all([
      api.get(`/job/getSinglejob/${jobId}`, { headers: { Authorization: `Bearer ${token}` } }),
      api.get(`/jobs/${jobId}/screening-questions`, { headers: { Authorization: `Bearer ${token}` } }),
      api.get(`/candidateProfile/candidate`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const resumePath = profileRes.data?.resume || "";

    this.setState({
      job: jobRes.data,
      questions: questionsRes.data.questions || [],
      resumePath,
      resumeFileName: resumePath ? resumePath.split("/").pop() : "",
      loading: false,
    });
  } catch (err) {
    console.error("Failed to load apply page data", err);
    this.setState({ error: "Failed to load job/application data.", loading: false });
  }
};

handleViewResume = async () => {
  const token = this.getToken();
  try {
    // ⚠️ Confirm this mount prefix too — e.g. "/resume/getresume"
    const res = await api.get("/resume/getresume", {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(res.data);
    window.open(blobUrl, "_blank");
  } catch (err) {
    console.error("Failed to load resume", err);
    this.setState({ error: "Could not load resume." });
  }
};

  handleAnswerChange = (questionId, value) => {
    this.setState((prev) => ({
      answers: { ...prev.answers, [questionId]: value },
      missingRequired: prev.missingRequired.filter((id) => id !== questionId),
    }));
  };

  handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) this.setState({ newResumeFile: file });
  };

handleResumeUpload = async () => {
  const { newResumeFile } = this.state;
  if (!newResumeFile) return;
  const token = this.getToken();
  const formData = new FormData();
  formData.append("resume", newResumeFile); // matches uploadResume.single("resume")

  this.setState({ uploadingResume: true });
  try {
    // ⚠️ Confirm the mount prefix for this router — e.g. if mounted as
    // app.use("/resume", resumeRoutes), the full path is "/resume/addresume"
    const res = await api.post("/resume/addresume", formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });

    const newResumePath = res.data.resume || "";

    this.setState({
      resumePath: newResumePath || this.state.resumePath,
      resumeFileName: newResumePath ? newResumePath.split("/").pop() : this.state.resumeFileName,
      newResumeFile: null,
      uploadingResume: false,
    });
  } catch (err) {
    console.error("Resume upload failed", err);
    this.setState({ uploadingResume: false, error: "Resume upload failed. Please try again." });
  }
};

  handleSubmit = async () => {
    const { questions, answers } = this.state;
    const { jobId } = this.props;

    const requiredIds = questions.filter((q) => q.is_required).map((q) => q.id);
    const missing = requiredIds.filter((id) => !answers[id] || !answers[id].toString().trim());

    if (missing.length > 0) {
      this.setState({ missingRequired: missing, error: "Please answer all required screening questions." });
      return;
    }

    const answersPayload = Object.entries(answers).map(([question_id, answer_text]) => ({
      question_id: Number(question_id),
      answer_text,
    }));

    this.setState({ submitting: true, error: "" });
    try {
      await api.post(
        "/applicant/apply",
        { job_id: Number(jobId), answers: answersPayload },
        { headers: { Authorization: `Bearer ${this.getToken()}` } },
      );
      this.props.onSubmitted && this.props.onSubmitted();
    } catch (err) {
      console.error("Apply failed", err);
      const msg = err.response?.data?.error || "Failed to submit application.";
      this.setState({ submitting: false, error: msg });
    }
  };

  renderQuestionInput(q) {
    const { answers, missingRequired } = this.state;
    const value = answers[q.id] || "";
    const isMissing = missingRequired.includes(q.id);

    if (q.question_type === "yes_no") {
      return (
        <div className="d-flex gap-3">
          {["Yes", "No"].map((opt) => (
            <div key={opt} className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={`q-${q.id}`}
                id={`q-${q.id}-${opt}`}
                checked={value === opt}
                onChange={() => this.handleAnswerChange(q.id, opt)}
              />
              <label className="form-check-label" htmlFor={`q-${q.id}-${opt}`}>{opt}</label>
            </div>
          ))}
        </div>
      );
    }

    if (q.question_type === "multiple_choice" && Array.isArray(q.options)) {
      return (
        <select
          className={`form-select ${isMissing ? "is-invalid" : ""}`}
          value={value}
          onChange={(e) => this.handleAnswerChange(q.id, e.target.value)}
        >
          <option value="">Select an answer...</option>
          {q.options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <textarea
        className={`form-control ${isMissing ? "is-invalid" : ""}`}
        rows={2}
        value={value}
        onChange={(e) => this.handleAnswerChange(q.id, e.target.value)}
      />
    );
  }

render() {
  const {
    loading, job, questions, resumePath, resumeFileName,
    newResumeFile, uploadingResume, submitting, error,
  } = this.state;

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner color="secondary" />
      </Container>
    );
  }

  return (
    <Container className="py-3 py-md-4 mb-4 mt-3 px-3" style={{ maxWidth: 720 }}>
      <Head><title>Apply — {job?.job_title || "Job"}</title></Head>

      <button
        className="btn btn-sm btn-outline-secondary mb-3 d-flex align-items-center gap-1"
        onClick={this.props.onClose}
        style={{ border: "1px solid #d1d5db" }}
      >
        ← Back
      </button>

      <Card className="mb-3">
        <CardHeader>
          <strong className="d-block text-break">{job?.job_title}</strong>
          <div className="small text-muted text-break">{job?.company_name}</div>
        </CardHeader>
      </Card>

      <Card className="mb-3">
        <CardHeader><strong>Your Resume</strong></CardHeader>
        <CardBody>
          {resumePath ? (
            <p className="mb-2 text-break">
              Current resume:{" "}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={this.handleViewResume}
              >
                {resumeFileName || "View resume"}
              </button>
            </p>
          ) : (
            <p className="text-muted mb-2">No resume on file yet.</p>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="form-control mb-2"
            onChange={this.handleResumeFileChange}
          />
          {newResumeFile && (
            <button
              className="btn btn-sm text-white w-100 w-sm-auto"
              style={{ background: "#36565f" }}
              onClick={this.handleResumeUpload}
              disabled={uploadingResume}
            >
              {uploadingResume ? "Uploading..." : "Save New Resume"}
            </button>
          )}
        </CardBody>
      </Card>

      {questions.length > 0 && (
        <Card className="mb-3">
          <CardHeader><strong>Screening Questions</strong></CardHeader>
          <CardBody>
            {questions.map((q) => (
              <div key={q.id} className="mb-3">
                <label className="form-label">
                  {q.question_text} {q.is_required && <span className="text-danger">*</span>}
                </label>
                {this.renderQuestionInput(q)}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex flex-column flex-sm-row justify-content-sm-end gap-2">
        <button
          className="btn btn-outline-secondary order-2 order-sm-1"
          onClick={this.props.onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          className="btn text-white order-1 order-sm-2"
          style={{ background: "#36565f" }}
          onClick={this.handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </Container>
  );
}
}

export default AppliedJobs;