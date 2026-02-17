import React, { Component } from "react";
import { Row, Col, Button } from "reactstrap";
import Link from "next/link";
import Image from "next/image";

class Applicants extends Component {
  constructor(props) {
    super(props);
    this.state = {
      candidates: [
        {
          id: 1,
          avatar: "/images/resource/candidate-1.png",
          name: "Darlene Robertson",
          designation: "UI Designer",
          location: "London, UK",
          hourlyRate: "99",
          tags: ["App", "Design", "Digital"],
        },
        {
          id: 2,
          avatar: "/images/resource/candidate-2.png",
          name: "Wade Warren",
          designation: "Developer",
          location: "London, UK",
          hourlyRate: "94",
          tags: ["App", "Design", "Digital"],
        },
      ],
    };
  }

  render() {
    const { candidates } = this.state;

    return (
      <Row>
        {candidates.map((candidate) => (
          <Col lg="6" md="12" sm="12" key={candidate.id} className="mb-4">
            <div className="candidate-block-three inner-box p-3 border rounded">
              <div className="d-flex">
                <div className="me-3">
                  <Image
                    width={90}
                    height={90}
                    src={candidate.avatar}
                    alt={candidate.name}
                  />
                </div>
                <div className="flex-grow-1">
                  <h4 className="name mb-2">
                    <Link href={`/candidates-single-v1/${candidate.id}`}>
                      {candidate.name}
                    </Link>
                  </h4>
                  <ul className="list-unstyled mb-2">
                    <li className="designation">{candidate.designation}</li>
                    <li>
                      <span className="icon flaticon-map-locator"></span>{" "}
                      {candidate.location}
                    </li>
                    <li>
                      <span className="icon flaticon-money"></span> $
                      {candidate.hourlyRate} / hour
                    </li>
                  </ul>
                  <ul className="list-unstyled d-flex flex-wrap mb-0">
                    {candidate.tags.map((tag, i) => (
                      <li
                        key={i}
                        className="badge bg-primary me-1 mb-1"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* <div className="option-box mt-3">
                <Button color="info" className="me-2">
                  <span className="la la-eye me-1"></span> View
                </Button>
                <Button color="success" className="me-2">
                  <span className="la la-check me-1"></span> Approve
                </Button>
                <Button color="danger" className="me-2">
                  <span className="la la-times-circle me-1"></span> Reject
                </Button>
                <Button color="secondary">
                  <span className="la la-trash me-1"></span> Delete
                </Button>
              </div> */}
            </div>
          </Col>
        ))}
      </Row>
    );
  }
}

export default Applicants;
