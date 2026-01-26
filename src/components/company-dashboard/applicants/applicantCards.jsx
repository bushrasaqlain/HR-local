import React from "react";
import { Button } from "reactstrap";
import Link from "next/link";
import Image from "next/image";
import userimage from "../../../../public/images/user.png";

class ApplicantCard extends React.Component {
  render() {
    const { candidate, onStatusChange } = this.props;

    return (
      <div className="p-3 border rounded bg-white h-100">
        <div className="d-flex">
          <Image
            width={70}
            height={70}
            className="rounded"
            src={candidate.passport_photo
              ? `/uploads/passportPhotos/${candidate.passport_photo}`
              : userimage}
            alt=""
          />

          <div className="ms-3 flex-grow-1">
            <h5 className="mb-1">
              <Link href={`/candidates-single-v1/${candidate.id}`}>
                {candidate.full_name}
              </Link>
            </h5>
            <small>{candidate.email}</small><br />
            <small>{candidate.city_name}, {candidate.country_name}</small>

            <div className="mt-2">
              <span className="badge bg-light text-dark me-1">
                {candidate.total_experience} yrs
              </span>
              <span className="badge bg-light text-dark">
                PKR {candidate.expected_salary}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
            <Button size="sm" color="info"
            onClick={() => onStatusChange(candidate.application_id, "Shortlisted")}
          >
            Shortlist
          </Button>

          {/* <Button size="sm" color="success"
            onClick={() => onStatusChange(candidate.application_id, "Shortlisted")}
          >
            Approve
          </Button>

          <Button size="sm" color="danger"
            onClick={() => onStatusChange(candidate.application_id, "Rejected")}
          >
            Reject
          </Button> */}
           <Button size="sm" color="success"
            onClick={() => onStatusChange(candidate.application_id, "Shortlisted")}
          >
            Message
          </Button>
        </div>
      </div>
    );
  }
}

export default ApplicantCard;
