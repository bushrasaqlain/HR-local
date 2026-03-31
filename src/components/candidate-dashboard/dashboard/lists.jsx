"use client";
import React, { Component } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Input,
  Table,
} from "reactstrap";
import axios from "axios";
import { FaCheckCircle, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import CompanyInfo from "./companyinfo";
import CandidateChatBox from "../messages/chatbox";
import Head from "next/head";

class JobList extends Component {
  state = {
    selected: this.props.selectedType || "",
    shortlistedList: [],
    approvedList: [],
    loading: true,
    showCompanyInfo: false,
    selectedCompany: null,
    companyLoading: false,
    selectedCompanyId: null, // Add this
    newDate: "",
    newTime: "",
    rescheduleCompanyId: null,
    showRescheduleModal: false, // Add this
    selectedRescheduleCompany: null, // Add this
    showConfirmModal: false, // Add this
    selectedConfirmCompany: null, // Add this
    showSuccessMessage: false,
    successMessage: "",
  };
  showTemporaryMessage = (message) => {
    this.setState({ showSuccessMessage: true, successMessage: message });
    setTimeout(() => {
      this.setState({ showSuccessMessage: false, successMessage: "" });
    }, 3000); // Message disappears after 3 seconds
  };
  componentDidMount() {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}candidateProfile/candidate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((res) => {
        const data = res.data || {};
        this.setState({
          shortlistedList: data.shortlisted_companies || [],
          approvedList: data.approved_companies || [],
          loading: false,
        });
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
        this.setState({ loading: false });
      });
  }
  handleCompanyClick = async (company) => {
    const token = sessionStorage.getItem("token");

    this.setState({ companyLoading: true });

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}company-info/getcompanybyid/${company.company_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // 🔥 Merge interview + job data into company response
      const mergedData = {
        ...res.data,
        accountId: company.accountId,
        interview_day: company.interview_day,
        interview_time: company.interview_time,
        job_title: company.job_title,
        application_id: company.application_id,
      };

      this.setState({
        selectedCompany: mergedData,
        showCompanyInfo: true,
        companyLoading: false,
      });
    } catch (error) {
      console.error("Error fetching company details:", error);
      this.setState({ companyLoading: false });
    }
  };
  handleChange = (e) => {
    this.setState({ selected: e.target.value });
  };
  handleConfirmFromModal = async () => {
    const { selectedConfirmCompany } = this.state;

    if (!selectedConfirmCompany) return;

    const token = sessionStorage.getItem("token");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}updatestatus`,
        {
          candidateId: selectedConfirmCompany.candidate_id,
          jobId: selectedConfirmCompany.job_id,
          candidate_response: "Accepted",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Show temporary success message
      this.showTemporaryMessage("Interview confirmed successfully!");

      // Close modal and reset
      this.setState({
        showConfirmModal: false,
        selectedConfirmCompany: null,
      });

      this.refreshList();
    } catch (error) {
      console.error(error);
      this.showTemporaryMessage("Error confirming interview");
    }
  };

  // Add this method to refresh the list after actions
  refreshList = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}candidateProfile/candidate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = res.data || {};
      this.setState({
        shortlistedList: data.shortlisted_companies || [],
        approvedList: data.approved_companies || [],
      });
    } catch (err) {
      console.error("Error refreshing companies:", err);
    }
  };
  handleRescheduleFromModal = async () => {
    const { newDate, newTime, selectedRescheduleCompany } = this.state;

    if (!newDate || !newTime || !selectedRescheduleCompany) return;

    // Prevent selecting past date/time
    const now = new Date();
    const selected = new Date(`${newDate}T${newTime}`);
    if (selected < now) {
      alert("Cannot select a past date/time!");
      return;
    }

    const token = sessionStorage.getItem("token");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}updatestatus`,
        {
          candidateId: selectedRescheduleCompany.candidate_id,
          jobId: selectedRescheduleCompany.job_id,
          candidate_response: "Reschedule Requested",
          requested_interview_day: newDate,
          requested_interview_time: newTime,
          candidate_response_message: "Requested new schedule",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Reschedule request sent successfully!");

      // Close modal and reset
      this.setState({
        showRescheduleModal: false,
        newDate: "",
        newTime: "",
        selectedRescheduleCompany: null,
        rescheduleCompanyId: null,
      });
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      alert("Error requesting reschedule");
    }
  };
  renderTable = (list) => {
    if (!list.length)
      return <p className="text-muted p-5 mt-3 mb-0">No companies found</p>;
    const hasConfirmedStatus = list.some(
      (company) => company.company_status === "confirmed",
    );

    return (
      <>
        <Table
          striped
          responsive
          className="mt-3 text-center border border-2"
          bordered
        >
          <thead className="text-center">
            <tr>
              <th>#</th>
              <th>Company Name</th>
              <th>Job Title</th>
              {/* Add conditional Company Status column */}
              {/* {hasConfirmedStatus && <th>Company Status</th>} */}
              {this.state.selected === "shortlisted" && (
                <>
                  <th>Interview Date</th>
                  <th>Interview Time</th>
                  <th>Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {list.map((company, index) => {
              const formattedDate = company.interview_day
                ? (() => {
                    const d = new Date(company.interview_day);
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = d.toLocaleString("en-US", { month: "short" });
                    const year = String(d.getFullYear()).slice(-2);
                    return `${day}-${month}-${year}`;
                  })()
                : "-";

              const formattedDay = company.interview_day
                ? new Date(company.interview_day).toLocaleDateString("en-US", {
                    weekday: "long",
                  })
                : "";

              const formattedTime = company.interview_time
                ? new Date(
                    `1970-01-01T${company.interview_time}`,
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "-";

              // Check if already accepted by candidate
              const isAccepted = company.candidate_response === "Accepted";
              // Check if company confirmed
              const isCompanyConfirmed = company.company_status === "confirmed";
              // Determine if actions should be shown
              const showActions = !isAccepted && !isCompanyConfirmed;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>

                  <td
                    className="text-primary fw-semibold"
                    style={{ cursor: "pointer" }}
                    onClick={() => this.handleCompanyClick(company)}
                  >
                    {company.company_name || company.name}
                  </td>

                  <td>{company.job_title || "-"}</td>

                  {/* Conditional Company Status cell */}
                  {/* {hasConfirmedStatus && (
                  <td>
                    {isCompanyConfirmed ? (
                      <span className="badge bg-success px-3 py-2">
                        <FaCheckCircle className="me-1" size={12} /> Confirmed
                      </span>
                    ) : (
                      <span className="badge bg-secondary px-3 py-2">
                        Pending
                      </span>
                    )}
                  </td>
                )} */}

                  {this.state.selected === "shortlisted" && (
                    <>
                      <td>
                        {formattedDate !== "-" ? (
                          <>
                            {formattedDate}(
                            <small className="text-muted">{formattedDay}</small>
                            )
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>{formattedTime}</td>

                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          {showActions ? (
                            /* Show both buttons when actions are available */
                            <>
                              {/* Confirm button */}
                              <FaCheckCircle
                                size={22}
                                className=" action-icon"
                                style={{ cursor: "pointer", color: "#407186" }}
                                title="Confirm Interview"
                                onClick={() =>
                                  this.setState({
                                    showConfirmModal: true,
                                    selectedConfirmCompany: company,
                                  })
                                }
                              />

                              {/* Calendar/Reschedule button */}
                              <FaCalendarAlt
                                size={22}
                                className=" action-icon"
                                style={{ color: "#36565f", cursor: "pointer" }}
                                title="Request Reschedule"
                                onClick={() =>
                                  this.setState({
                                    showRescheduleModal: true,
                                    selectedRescheduleCompany: company,
                                    rescheduleCompanyId: company.company_id,
                                  })
                                }
                              />
                            </>
                          ) : /* Show appropriate badge when no actions */
                          isCompanyConfirmed ? (
                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                              <FaCheckCircle className="me-1" /> Company
                              Confirmed
                            </span>
                          ) : isAccepted ? (
                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                              <FaCheckCircle className="me-1" /> You Confirmed
                            </span>
                          ) : null}

                          {/* Chat button - Always visible even after confirmation */}
                          <FaEnvelope
                            size={22}
                            className="text-info action-icon"
                            style={{ cursor: "pointer" }}
                            title="Chat with Company"
                            onClick={() =>
                              this.openChatWithCompany(
                                company.company_id,
                                company.company_name || company.name,
                                company.job_id,
                                company.accountId,
                              )
                            }
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Reschedule Modal - This is OUTSIDE the table but INSIDE the fragment */}
        {this.state.showRescheduleModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1050,
            }}
            onClick={() => this.setState({ showRescheduleModal: false })}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "400px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ background: "#36565f", color: "white" }}
                >
                  <h5 className="modal-title">Request Reschedule</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() =>
                      this.setState({ showRescheduleModal: false })
                    }
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-3">
                    Select new date and time for interview with{" "}
                    <strong>
                      {this.state.selectedRescheduleCompany?.company_name}
                    </strong>
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold">New Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={this.state.newDate}
                      onChange={(e) =>
                        this.setState({ newDate: e.target.value })
                      }
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">New Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={this.state.newTime}
                      onChange={(e) =>
                        this.setState({ newTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      this.setState({
                        showRescheduleModal: false,
                        newDate: "",
                        newTime: "",
                        selectedRescheduleCompany: null,
                      })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    style={{ background: "#36565f", color: "white" }}
                    onClick={() => this.handleRescheduleFromModal()}
                    disabled={!this.state.newDate || !this.state.newTime}
                  >
                    Request Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Confirm Interview Modal */}
        {/* Confirm Interview Modal */}
        {this.state.showConfirmModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1050,
            }}
            onClick={() => {
              // Only close if not in success state
              if (!this.state.showConfirmSuccess) {
                this.setState({
                  showConfirmModal: false,
                  selectedConfirmCompany: null,
                });
              }
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "450px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ background: "#36565f", color: "white" }}
                >
                  <h5 className="modal-title">
                    <FaCheckCircle className="me-2" />
                    {this.state.showConfirmSuccess
                      ? "Confirmed!"
                      : "Confirm Interview"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() =>
                      this.setState({
                        showConfirmModal: false,
                        showConfirmSuccess: false,
                        selectedConfirmCompany: null,
                      })
                    }
                  ></button>
                </div>
                <div className="modal-body">
                  {this.state.showConfirmSuccess ? (
                    /* Success Message - Only shows after confirmation */
                    <div className="text-center py-5">
                      <FaCheckCircle size={64} className="text-success mb-4" />
                      <h4 className="text-success fw-bold mb-3">
                        Interview Confirmed!
                      </h4>
                      <p className="text-muted mb-4">
                        Your interview with{" "}
                        <strong>
                          {this.state.selectedConfirmCompany?.company_name}
                        </strong>{" "}
                        has been successfully confirmed.
                      </p>
                      <div className="bg-light p-3 rounded text-start mb-4">
                        <p className="mb-2">
                          <strong>Job Title:</strong>{" "}
                          {this.state.selectedConfirmCompany?.job_title}
                        </p>
                        <p className="mb-2">
                          <strong>Date:</strong>{" "}
                          {this.state.selectedConfirmCompany?.interview_day
                            ? new Date(
                                this.state.selectedConfirmCompany.interview_day,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not scheduled"}
                        </p>
                        <p className="mb-0">
                          <strong>Time:</strong>{" "}
                          {this.state.selectedConfirmCompany?.interview_time
                            ? new Date(
                                `1970-01-01T${this.state.selectedConfirmCompany.interview_time}`,
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "Not scheduled"}
                        </p>
                      </div>
                      <button
                        className="btn btn-primary px-4 py-2"
                        onClick={() =>
                          this.setState({
                            showConfirmModal: false,
                            showConfirmSuccess: false,
                            selectedConfirmCompany: null,
                          })
                        }
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    /* Confirmation Screen - Shows confirm/cancel buttons */
                    <>
                      <p className="mb-3 fs-7">
                        Are you sure you want to confirm the interview with{" "}
                        <strong className="m-1" style={{ color: "#36565f" }}>
                          {this.state.selectedConfirmCompany?.company_name}
                        </strong>
                        ?
                      </p>

                      <div className="bg-light p-3 rounded mb-4">
                        <p className="mb-2">
                          <strong>Job Title:</strong>{" "}
                          {this.state.selectedConfirmCompany?.job_title}
                        </p>
                        <p className="mb-2">
                          <strong>Interview Date:</strong>{" "}
                          {this.state.selectedConfirmCompany?.interview_day
                            ? new Date(
                                this.state.selectedConfirmCompany.interview_day,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not scheduled"}
                        </p>
                        <p className="mb-0">
                          <strong>Interview Time:</strong>{" "}
                          {this.state.selectedConfirmCompany?.interview_time
                            ? new Date(
                                `1970-01-01T${this.state.selectedConfirmCompany.interview_time}`,
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "Not scheduled"}
                        </p>
                      </div>

                      <p
                        className="mb-4 bg-opacity-10 p-2 rounded"
                        style={{ color: "#36565f" }}
                      >
                        <small>
                          <FaCheckCircle className="me-1" size={12} />
                          This action cannot be undone.
                        </small>
                      </p>

                      {/* Confirm/Cancel Buttons */}
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-outline-secondary px-4"
                          onClick={() =>
                            this.setState({
                              showConfirmModal: false,
                              selectedConfirmCompany: null,
                            })
                          }
                        >
                          Cancel
                        </button>
                        <button
                          className="btn px-4"
                          style={{ background: "#36565f", color: "white" }}
                          onClick={() => this.handleConfirmFromModal()}
                        >
                          <FaCheckCircle className="me-2" /> Confirm Interview
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  openChatWithCompany = (companyId, companyName, jobId, accountId) => {
    console.log("Opening chat with company:", {
      companyId,
      companyName,
      jobId,
      accountId,
    });

    this.setState({
      showChat: true,
      selectedCompany: accountId, // Use account_id for messaging
      selectedCompanyId: companyId, // Keep company_id for reference if needed
      selectedCompanyName: companyName,
      selectedJobId: jobId,
      showCompanyMessage: true,
    });
  };
  render() {
    const { selected, shortlistedList, approvedList, loading } = this.state;

    const lists = {
      shortlisted: shortlistedList,
      approved: approvedList,
      appeared: [], // optional for appeared-in-search
    };

    if (loading) return <div>Loading companies...</div>;
    if (this.state.showCompanyInfo && this.state.selectedCompany) {
      return (
        <CompanyInfo
          company={this.state.selectedCompany}
          onBack={() =>
            this.setState({
              showCompanyInfo: false,
              selectedCompany: null,
            })
          }
        />
      );
    }
    if (this.state.showChat && this.state.selectedCompany) {
      console.log("Company account ID for chat:", this.state.selectedCompany);
      console.log("Company name:", this.state.selectedCompanyName);
      console.log("Job ID:", this.state.selectedJobId);

      return (
        <CandidateChatBox
          companyId={this.state.selectedCompany} // This should be the account_id
          companyName={this.state.selectedCompanyName}
          jobId={this.state.selectedJobId}
          onBack={() =>
            this.setState({
              showChat: false,
              selectedCompany: null,
              selectedCompanyId: null,
              selectedCompanyName: null,
              selectedJobId: null,
            })
          }
        />
      );
    }
    return (
      <Container fluid>
        <Head>
          <title>Job List</title>
        </Head>
        {this.state.showSuccessMessage && (
          <div
            style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "10px 20px",
              borderRadius: "4px",
              marginTop: "10px",
              marginBottom: "10px",
              border: "1px solid #c3e6cb",
              textAlign: "center",
            }}
          >
            {this.state.successMessage}
          </div>
        )}
        <Card className="mt-5">
          <CardHeader>Select Category</CardHeader>
          <CardBody>
            <Input type="select" value={selected} onChange={this.handleChange}>
              <option value="">Select</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="approved">Approved</option>
            </Input>

            {selected && this.renderTable(lists[selected])}

            {!selected && (
              <p className="text-muted mt-3 mb-0">
                Please select an option to see the list
              </p>
            )}
          </CardBody>
        </Card>
      </Container>
    );
  }
}

export default JobList;
