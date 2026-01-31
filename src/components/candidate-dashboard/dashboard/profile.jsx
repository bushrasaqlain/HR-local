import Head from "next/head";
import { useRouter } from "next/router";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Container } from "reactstrap";
import api from "../../lib/api";
import EditProfile from "./editprofile";

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      passport_photo: "",
      formData: {},
      dashboardStats: {
        shortlisted: 0,
        viewed: 0,
        onHold: 0,
        profileCompletion: 65,
      },
    };
  }

  fetchCandidateInfo = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get("/candidateProfile/candidate", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      console.log("data", data )
      this.setState({
        formData: data,
        passport_photo: data.passport_photo
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.passport_photo}`
          : "",
        dashboardStats: {
          shortlisted: data.shortlisted_count || 0,
          viewed: data.profile_views || 0,
          onHold: data.on_hold || 0,
          profileCompletion: data.profile_completion || 0,
        },
      });
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  };

  componentDidMount() {
     this.router = require("next/router").default;
    this.fetchCandidateInfo();
  }
handleEditProfile = () => {
  if (this.props.onEdit) this.props.onEdit(); // triggers tab change
};

  renderStatCard(title, value, subtitle) {
    return (
      <Card className="h-100">
        <CardBody>
          <h6 className="text-muted">{title}</h6>
          <h2 className="fw-bold">{value}</h2>
          <p className="small text-muted mb-0">{subtitle}</p>
        </CardBody>
      </Card>
    );
  }

  render() {
    const { dashboardStats, formData, passport_photo } = this.state;

    return (
      <Container fluid>
        <Head>
          <title>Candidate Dashboard</title>
        </Head>

        <div className="row g-3">
          {/* LEFT SIDE */}
          <div className="col-12 col-xl-9">
            <div className="row g-3">
              <div className="col-12 col-md-4 shadow-sm">
                {this.renderStatCard(
                  "Shortlisted",
                  dashboardStats.shortlisted,
                  "Companies selected your profile"
                )}
              </div>

              <div className="col-12 col-md-4">
                {this.renderStatCard(
                  "Appeared in Search",
                  dashboardStats.viewed,
                  "Recruiters viewed your profile"
                )}
              </div>

              <div className="col-12 col-md-4">
                {this.renderStatCard(
                  "On Hold",
                  dashboardStats.onHold,
                  "Profiles currently paused"
                )}
              </div>

           

              {/* Matching Jobs (Read Only) */}
              <div className="col-12">
                <Card>
                  <CardHeader>Jobs Matching Your Profile</CardHeader>
                  <CardBody>
                    <p className="text-muted small">
                      Based on your skills and experience
                    </p>

                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">
                        
                      </li>
                      <li>
                        
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
      <div className="col-12 col-xl-3">
  <div className="row g-3">

    {/* Profile Completion (TOP) */}
    <div className="col-12">
      <Card>
        <CardBody>
          <h6>Profile Completion</h6>

          <div className="progress mb-2">
            <div
              className="progress-bar bg-success"
              style={{
                width: `${dashboardStats.profileCompletion}%`,
              }}
            >
              {dashboardStats.profileCompletion}%
            </div>
          </div>

          <p className="text-muted small">
            Complete your profile to increase recruiter visibility
          </p>

          <a
            href="/dashboard/editprofile"
            className="btn btn-primary btn-sm w-100"
          >
            Complete Profile
          </a>
        </CardBody>
      </Card>
    </div>

    {/* Profile Snapshot (BELOW) */}
    <div className="col-12">
      <Card className="text-center justify-content-center p-3">
      <div className="d-flex justify-content-center">
  <img
    src={
      formData.passport_photo && formData.passport_photo.trim() !== ""
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${formData.passport_photo.replace(/^\//, "")}`
        : "/default-avatar.png"
    }
    alt="passport_photo"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/default-avatar.png";
    }}
    className="rounded-circle mb-3"
    style={{
      width: "120px",
      height: "120px",
      objectFit: "cover",
    }}
  />
</div>

        <h5>{formData.full_name || "Your Name"}</h5>
        <p className="text-muted small">
          {formData.total_experience || 0} experience
        </p>

        <span className="badge bg-success mb-3">
          Available for Interview
        </span>

        <div>
     <button
  className="btn btn-outline-primary btn-sm w-100"
  onClick={this.handleEditProfile}
>
  Edit Profile
</button>

      </div>
      </Card>
    </div>

  </div>
</div>

        </div>
      </Container>
    );
  }
}

export default Profile;
