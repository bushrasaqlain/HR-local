import Head from "next/head";
import { useRouter } from "next/router";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Container } from "reactstrap";
import api from "../../lib/api";
import EditProfile from "./editprofile";
import JobList from "./lists";
class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      passport_photo: "",
      formData: {},
      dashboardStats: {
        shortlisted: 0,
        viewed: 0,
        approved: 0,
        profileCompletion: 65,
        boostStatus: null,
        showBoostModal: false,
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
      console.log("data", data);
      this.setState({
        formData: data,
        passport_photo: data.passport_photo
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.passport_photo}`
          : "",
        dashboardStats: {
          shortlisted: data.shortlisted_count || 0,
          viewed: data.profile_views || 0,
          approved: data.approved_count || 0, // <-- changed from onHold
          profileCompletion: data.profile_completion || 0,
          profilecompletionpercentage: data.profile_completion_percent || 0,
        },
        boostStatus: {
          isBoosted: data.is_boosted || false,
          boostExpiresAt: data.boost_expires_at || null,
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
    if (this.props.onEdit) this.props.onEdit();
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
    const { dashboardStats, formData, passport_photo, boostStatus, showBoostModal } = this.state;

    return (
      <Container fluid>
        <Head>
          <title>Candidate Dashboard</title>
        </Head>

        <div className="row g-3 mt-3">
          {/* LEFT SIDE */}
          <div className="col-12 col-xl-9">
            <div className="row g-3">
              <div
                className="col-12 col-md-4"
                style={{
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >

                {this.renderStatCard(
                  "Shortlisted",
                  dashboardStats.shortlisted,
                  "Companies selected your profile",
                )}
              </div>

              <div
                className="col-12 col-md-4"
                style={{
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {this.renderStatCard(
                  "Appeared in Search",
                  dashboardStats.viewed,
                  "Recruiters viewed your profile",
                )}
              </div>

              <div
                className="col-12 col-md-4"
                style={{
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {this.renderStatCard(
                  "Approved",
                  dashboardStats.approved,
                  "Profiles approved by recruiters",
                )}

              </div>

              {boostStatus && !boostStatus.isBoosted && (
                <div className="col-12">
                  <div style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 18px", borderRadius: "10px",
                    background: "#fffbeb", border: "1.5px solid #f59e0b",
                  }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "#fef3c7", border: "1px solid #f59e0b",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
                          Boost Your Profile
                        </span>
                        <span style={{
                          background: "#f59e0b", color: "#78350f",
                          fontSize: "10px", fontWeight: 600,
                          padding: "1px 7px", borderRadius: "20px",
                        }}>New</span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#a16207" }}>
                        Get priority visibility among relevant candidates — reach more recruiters with your profile
                      </span>
                    </div>
                    <button
                      onClick={() => this.setState({ showBoostModal: true })}
                      style={{
                        background: "#f59e0b", color: "#78350f",
                        border: "none", borderRadius: "8px",
                        padding: "9px 18px", fontSize: "13px",
                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      Boost Now
                    </button>
                  </div>
                </div>
              )}

              {/* Boost Active Banner */}
              {boostStatus && boostStatus.isBoosted && (
                <div className="col-12">
                  <div style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 18px", borderRadius: "10px",
                    background: "#f0fdf4", border: "1.5px solid #22c55e",
                  }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "#dcfce7", border: "1px solid #22c55e",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#14532d", marginBottom: "3px" }}>
                        Profile Boosted — Active
                      </div>
                      <span style={{ fontSize: "12px", color: "#166534" }}>
                        Your profile is now appearing higher in search results
                      </span>
                    </div>
                    <span style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "#22c55e", color: "#14532d",
                      borderRadius: "20px", padding: "5px 12px",
                      fontSize: "12px", fontWeight: 600,
                    }}>
                      Live
                    </span>
                  </div>
                </div>
              )}

              {showBoostModal && (
                <BoostModal
                  onClose={() => this.setState({ showBoostModal: false })}
                  onSuccess={() => {
                    this.setState({ showBoostModal: false });
                    this.fetchCandidateInfo();
                  }}
                />
              )}

              {/* Matching Jobs (Read Only) */}
              <div className="col-12">
                <Card>
                  <CardHeader>Jobs Matching Your Profile</CardHeader>
                  <CardBody>
                    <p className="text-muted small">
                      Based on your skills and experience
                    </p>

                    <ul className="list-unstyled mb-0">
                      <li className="mb-2"></li>
                      <li></li>
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
                        className="progress-bar"
                        style={{
                          width: `${dashboardStats.profilecompletionpercentage}%`, background: "#5F8190"
                        }}
                      >
                        {dashboardStats.profilecompletionpercentage}%
                      </div>
                    </div>

                    <p className="text-muted small">
                      Complete your profile to increase recruiter visibility
                    </p>

                    <button
                      className="btn custom-progress-bar text-white btn-sm w-100"

                      onClick={this.handleEditProfile}
                    >
                      Complete Profile
                    </button>
                  </CardBody>
                </Card>
              </div>

              {/* Profile Snapshot (BELOW) */}
              <div className="col-12 mb-5">
                <Card className="text-center justify-content-center p-3">
                  <div className="d-flex justify-content-center">
                    <img
                      src={
                        formData.passport_photo &&
                          formData.passport_photo.trim() !== ""
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

                  <h5 className="mb-3">{formData.full_name || "Your Name"}</h5>


                  <span className="badge mb-3"
                    style={{ background: "#5F8190" }}>
                    Available for Interview
                  </span>

                  <div>
                    <button
                      className="btn mb-3 custom-progress-bar text-white btn-sm w-100"
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


class BoostModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { packages: [], selected: null, loading: false };
  }

  componentDidMount() {
    const token = localStorage.getItem("token");
    api.get("/candidateProfile/boost/packages", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => this.setState({ packages: res.data.data || [] }));
  }

  handleOrder = async () => {
    const { selected } = this.state;
    if (!selected) return;
    this.setState({ loading: true });
    const token = localStorage.getItem("token");
    try {
      const res = await api.post("/candidateProfile/boost/order",
        { package_id: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Your boost order has been placed! It will be approved by the admin.");
        this.props.onSuccess();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
    this.setState({ loading: false });
  };

  render() {
    const { packages, selected, loading } = this.state;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
      }}>
        <div style={{
          background: "#fff", borderRadius: "14px",
          padding: "24px", width: "100%", maxWidth: "420px",
        }}>
          <h5 style={{ marginBottom: "6px" }}>Choose a Boost Plan</h5>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
            The admin will review and approve — then your profile will be featured
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {packages.map(pkg => (
              <div key={pkg.id} onClick={() => this.setState({ selected: pkg.id })}
                style={{
                  flex: 1, border: selected === pkg.id ? "1.5px solid #f59e0b" : "1.5px solid #e5e7eb",
                  background: selected === pkg.id ? "#fffbeb" : "#fff",
                  borderRadius: "10px", padding: "14px", cursor: "pointer", textAlign: "center",
                  transition: "all .2s",
                }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{pkg.name}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#92400e" }}>
                  Rs. {pkg.price}
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>{pkg.duration_days} days</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={this.props.onClose}
              style={{
                flex: 1, background: "transparent", color: "#6b7280",
                border: "1px solid #e5e7eb", borderRadius: "8px",
                padding: "10px", fontSize: "13px", cursor: "pointer",
              }}>
              Cancel
            </button>
            <button onClick={this.handleOrder}
              disabled={!selected || loading}
              style={{
                flex: 1, background: selected ? "#f59e0b" : "#e5e7eb",
                color: selected ? "#78350f" : "#9ca3af",
                border: "none", borderRadius: "8px",
                padding: "10px", fontSize: "13px",
                fontWeight: 600, cursor: selected ? "pointer" : "not-allowed",
              }}>
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;
