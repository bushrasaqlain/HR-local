import React, { Component } from "react";
import { Button } from "reactstrap";
import { toast } from "react-toastify";
import api from "../../lib/api";

class ResumeStep extends Component {
  constructor(props) {
    super(props);
    this.resumeInputRef = React.createRef();
    this.state = {
      resume: "", // backend path or File object
      loading: false,
    };
  }

  componentDidMount() {
    this.fetchResume();
  }

  fetchResume = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.get("/candidateProfile/candidate", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resumePath = res.data?.resume || "";
      this.setState({ resume: resumePath });
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    }
  };

  handleResumeClick = () => {
    this.resumeInputRef.current?.click();
  };

  handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    if (file.size > MAX_SIZE) {
      toast.error("Resume must be less than 10 MB");
      e.target.value = "";
      return;
    }

    this.setState({ resume: file });
  };

handleSaveResume = async () => {
  const { resume } = this.state;
  const token = localStorage.getItem("token");

  if (!resume) {
    toast.error("Please select a resume to upload");
    return;
  }

  const formData = new FormData();
  if (resume instanceof File) {
    formData.append("resume", resume);
  } else {
    toast.info("No changes to save");
    return;
  }

  this.setState({ loading: true });

  try {
    // Fetch account_id from candidateProfile
    const accountRes = await api.get("/candidateProfile/candidate", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const accountId = accountRes.data?.account_id;
    if (!accountId) throw new Error("Account ID missing");

    // ✅ Use the correct route
   await api.put(`/resume/updateresume/${accountId}`, formData, {
  headers: { Authorization: `Bearer ${token}` },
});


    toast.success("Resume updated successfully");

    // Reset file input
    this.resumeInputRef.current.value = "";
  } catch (err) {
    console.error("Resume upload failed:", err);
    toast.error("Resume upload failed");
  } finally {
    this.setState({ loading: false });
  }
};


  render() {
    const { resume, loading } = this.state;

    const resumeUrl =
      resume instanceof File
        ? URL.createObjectURL(resume)
        : resume
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${resume.replace(/^\//, "")}`
        : null;

    return (
      <>
        <h5>Resume</h5>
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Uploaded Resume</th>
              <th style={{ width: "150px" }} className="text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {resumeUrl ? (
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                    {resume instanceof File ? "Preview Resume" : "View Resume"}
                  </a>
                ) : (
                  <span className="text-muted">No resume uploaded</span>
                )}
              </td>
              <td className="text-center">
                <Button
                  color="outline"
                  className="custom-progress-bar text-white"
                  size="sm"
                  onClick={this.handleResumeClick}
                  disabled={loading}
                >
                  {resume instanceof File ? "Change" : "Upload"}
                </Button>

                <input
                  type="file"
                  ref={this.resumeInputRef}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx"
                  onChange={this.handleResumeChange}
                />

                {resume instanceof File && (
                  <Button
                    color="primary"
                    size="sm"
                    className="ms-2"
                    onClick={this.handleSaveResume}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }
}

export default ResumeStep;
