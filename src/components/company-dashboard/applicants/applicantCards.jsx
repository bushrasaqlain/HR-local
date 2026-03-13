import React from "react";
import { Button } from "reactstrap";

class ApplicantCard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      interviewDay: "",
      interviewTime: "",
    };
  }
  render() {
    const { candidate, onStatusChange } = this.props;
    const { showModal, interviewDay, interviewTime } = this.state;
    let actionButton = null;

    if (candidate.candidateStatus === "Pending") {
      actionButton = (
        <Button
          size="sm"
          color="info"
          onClick={() => this.setState({ showModal: true })}
        >
          Shortlist
        </Button>
      );
    } else if (candidate.candidateStatus === "Shortlisted") {
      actionButton = (
        <>
          <Button
            size="sm"
            color="success"
            onClick={() => onStatusChange(candidate.candidate_id, "Approved")}
          >
            Approve
          </Button>

          <Button
            size="sm"
            color="danger"
            onClick={() => onStatusChange(candidate.candidate_id, "Rejected")}
          >
            Reject
          </Button>
        </>
      );
    } else if (candidate.candidateStatus === "Approved") {
      actionButton = <span className="badge bg-success">Approved</span>;
    } else if (candidate.candidateStatus === "Rejected") {
      actionButton = <span className="badge bg-danger">Rejected</span>;
    }

    return (
      <div className="d-flex gap-2 flex-wrap">
        {actionButton}

        {/* ===== MODAL ===== */}
        {showModal && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
          >
            <div className="bg-white rounded-4 p-4" style={{ width: "360px" }}>
              <h5 className="mb-3">Shortlist & Schedule Interview</h5>

              <label className="form-label">Interview Date</label>
              <input
                type="date"
                className="form-control mb-3"
                min={new Date().toISOString().split("T")[0]} // aaj se pehle ki date select na ho
                value={interviewDay}
                onChange={(e) => this.setState({ interviewDay: e.target.value })}
              />

              <label className="form-label">Interview Time</label>
              <input
                type="time"
                className="form-control mb-4"
                value={interviewTime}
                onChange={(e) => this.setState({ interviewTime: e.target.value })}
              />

              <div className="d-flex gap-2">
                <Button
                  color="success"
                  className="w-100"
                  onClick={() => {
                    if (!interviewDay || !interviewTime) {
                      alert("Please select both date and time");
                      return;
                    }
                    // ← teen cheezein ek sath bhejo
                    onStatusChange(
                      candidate.candidate_id,
                      "Shortlisted",
                      interviewDay,
                      interviewTime
                    );
                    this.setState({ showModal: false, interviewDay: "", interviewTime: "" });
                  }}
                >
                  Confirm
                </Button>

                <Button
                  color="secondary"
                  className="w-100"
                  onClick={() => this.setState({ showModal: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ApplicantCard;
