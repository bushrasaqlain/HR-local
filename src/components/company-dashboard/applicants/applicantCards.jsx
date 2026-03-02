import React from "react";
import { Button } from "reactstrap";

class ApplicantCard extends React.Component {
  render() {
    const { candidate, onStatusChange } = this.props;
    let actionButton = null;

    if (candidate.candidateStatus === "Pending") {
      actionButton = (
        <Button
          size="sm"
          color="info"
          onClick={() => onStatusChange(candidate.candidate_id, "Shortlisted")}
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

    return <div className="d-flex gap-2 flex-wrap">{actionButton}</div>;
  }
}

export default ApplicantCard;
