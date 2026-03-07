"use client";
import React, { Component } from "react";
import { Card, Row, Col, Button } from "reactstrap";

class CompanyInfo extends Component {
  render() {
    const { company, onBack } = this.props;

    if (!company) return <p>Loading...</p>;
    const formatShortDate = (date) => {
      if (!date) return "-";

      const d = new Date(date);

      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleString("en-US", { month: "short" });
      const year = String(d.getFullYear()).slice(-2);

      return `${day}-${month}-${year}`;
    };

    const formatTime = (time) => {
      if (!time) return "-";
      const t = new Date(`1970-01-01T${time}`);
      return t.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formatDayOfWeek = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    };

    return (
      <div className="container py-5">
        <Button color="secondary" className="mb-4" onClick={onBack}>
          ← Back
        </Button>

        {/* ================= HEADER ================= */}
        <Card className="shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center flex-wrap">
            {company.logo ? (
              <img
                src={`data:image/png;base64,${company.logo}`}
                alt={company.company_name}
                className="rounded me-3"
                style={{ width: 100, height: 100, objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded bg-light text-center d-flex align-items-center justify-content-center me-3"
                style={{ width: 100, height: 100 }}
              >
                No Logo
              </div>
            )}
            <div>
              <h4 className="mb-0">{company.company_name}</h4>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm rounded-4 p-4 mb-4">
          <p className="text-muted mb-1">
            <strong>Business Type:</strong> {company.business_type_name || "-"}
          </p>
          <p className="text-muted mb-1">
            <strong>Established:</strong>{" "}
            {formatShortDate(company.established_date)}
          </p>
        </Card>

        {/* ================= BODY ================= */}
        <Row className="g-4">
          <Col lg={12}>
            <Card className="shadow-sm rounded-4 p-4 mb-4">
              <h5 className="mb-3">Contact Information</h5>
              <p>
                {" "}
                <strong>Email: </strong>
                {company.email || "-"}
              </p>
              <p>
                <strong>Phone: </strong>
                {company.phone || "-"}
              </p>
              <p>
                <strong>Website: </strong> {company.company_website || "-"}
              </p>
              <p>
                <strong>NTN: </strong> {company.NTN || "-"}
              </p>
            </Card>

            <Card className="shadow-sm rounded-4 p-4 mb-4">
              <h5 className="mb-3">Location</h5>
              <p>
                <strong>Address: </strong> {company.company_address || "-"}
              </p>
              <p>
                <strong>City: </strong>
                {company.city?.name || "-"}
              </p>
              <p>
                <strong>District: </strong>
                {company.district?.name || "-"}
              </p>
              <p>
                <strong>Country: </strong>
                {company.country?.name || "-"}
              </p>
            </Card>

            <Card className="shadow-sm rounded-4 p-4 mb-4">
              <h5 className="mb-3">Job & Interview Info</h5>
              <p>
                <strong>Job Title: </strong>
                {company.job_title || "-"}
              </p>
              <p>
                <strong>Interview Date: </strong>
                {company.interview_day ? (
                  <>
                    {formatShortDate(company.interview_day)} (
                    <small className="text-muted">
                      {formatDayOfWeek(company.interview_day)}
                    </small>
                    )
                  </>
                ) : (
                  "-"
                )}
              </p>

              <p>
                <strong>Interview Time: </strong>{" "}
                {formatTime(company.interview_time)}
              </p>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default CompanyInfo;
