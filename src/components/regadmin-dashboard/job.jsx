"use client";
import React, { Component } from "react";
import api from "../lib/api";
import Pagination from "../common/pagination";
import { toast } from "react-toastify";

import {
  Table,
  Input,
  Button,
  FormGroup,
  Label,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Container,
} from "reactstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import DetailModal from "../common/DetailModal";
import HistoryModal from "../common/HistoryModal";
import Head from "next/head";
class Job extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showConfirmModal: false,
      confirmId: null,
      confirmStatus: null,
      jobData: [],
      editingRow: null,
      currentPage: 1,
      pageSize: 20,
      totalRecords: 0, // ✅ ADD THIS
      statusFilter: "all",
      searchTerms: {
        id: "",
        username: "",
        package_type: "",
        price: "",
        status: "",
      },
      selectedJob: null,
      historyModalOpen: false,
      historyData: [],
      editingStatus: {},
    };
    this.tableHeaders = [
      // { key: "id", label: "Id" },
      { key: "username", label: "Company Name" },
      { key: "job_title", label: "Job Title" },
      { key: "packageprice", label: "Packages Price" },
      { key: "duration_value", label: "Duration" },
      { key: "approval_status", label: "Approval Status" },
      { key: "status", label: "Status" },
      { key: "action", label: "Action" },
    ];

    this.apibasurl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchJobData();
  }

  fetchJobData = () => {
    const { currentPage, pageSize, statusFilter, searchTerms } = this.state;
    const token = localStorage.getItem("token");

    // find first search column & value
    let searchColumn = "";
    let searchValue = "";
    for (const key in searchTerms) {
      if (searchTerms[key]) {
        searchColumn = key;
        searchValue = searchTerms[key];
        break;
      }
    }

    // base params (ALL data)
    const params = {
      page: currentPage,
      limit: pageSize,
      search: searchValue,
      name: searchColumn,
    };

    // apply status filter ONLY if not "all"
    if (statusFilter !== "all") {
      params.status = statusFilter; // Approved / UnApproved / Pending (if exists)
    }

    api
      .get(`${this.apibasurl}job/getJobbyRegAdmin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })
      .then((res) => {
        this.setState({
          jobData: res.data.data || [],
          totalRecords: res.data.totalRecords || 0,
        });
      })

      .catch((err) => {
        console.error("Error fetching job data:", err);
        toast.error("Failed to fetch job data");
      });
  };

  updateCompanyStatus = (id, status) => {
    const userId = sessionStorage.getItem("userId");
    const apiUrl = `${this.apibasurl}job/updateJobPostStatus/${id}/${status}/${userId}`;

    api
      .put(apiUrl)
      .then((res) => {
        // Check if the response indicates success
        if (res.status === 200 || res.data.success) {
          toast.success("Job Posted status updated successfully!");
          this.fetchJobData(); // Refetch updated data
        } else {
          toast.error(res.data.message || "Failed to update jobpost status.");
        }
      })
      .catch((err) => {
        console.error("Error updating posted job status:", err);
        // Show error to the user
        toast.error(
          err.response?.data?.error ||
          "Something went wrong while updating status.",
        );
      });
  };

  getHistory = (id) => {
    const accountType = "job";
    const apiUrl = `${this.apibasurl}gethistory/${id}/${accountType}`;
    const token = localStorage.getItem("token");

    api
      .get(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        this.setState({
          historyData: res.data.history || [],
          historyModalOpen: true,
        });
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        toast.error("Failed to fetch history.");
      });
  };

  handleSearchChange = (key, value) => {
    this.setState(
      (prevState) => ({
        searchTerms: {
          ...prevState.searchTerms,
          [key]: value,
        },
        currentPage: 1,
      }),
      this.fetchJobData,
    );
  };

  handleStatusFilterChange = (e) => {
    this.setState(
      { statusFilter: e.target.value, currentPage: 1 },
      this.fetchJobData,
    );
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page }, this.fetchJobData);
  };

  toggleEditingRow = (id) => {
    this.setState((prevState) => ({
      editingRow: prevState.editingRow === id ? null : id,
    }));
  };

  toggleModal = (modalData) => {
    this.setState((prevState) => ({
      modalOpen: !prevState.modalOpen,
      modalData: modalData || null,
    }));
  };

  confirmStatus = (id, status) => {
    this.setState({ showConfirmModal: true, confirmId: id, confirmStatus: status });
  };

  handleConfirmStatus = () => {
    const { confirmId, confirmStatus } = this.state;
    const newStatus = confirmStatus === "Approved" ? "UnApproved" : "Approved";
    this.updateCompanyStatus(confirmId, newStatus);
    this.setState({ showConfirmModal: false, confirmId: null, confirmStatus: null });
  };

  render() {
    const {
      jobData,
      editingRow,
      editingStatus,
      currentPage,
      pageSize,
      statusFilter,
      searchTerms,
      totalRecords,
    } = this.state;

    const totalPages = Math.ceil(totalRecords / pageSize);

    const paginatedData = jobData;

    return (
      <>
        <Head>
          <title>Posted Jobs</title>
        </Head>
        <Container fluid>
          {/* Status Filter */}
          <Row className="mb-4 align-items-center">
            <Col>
              <h4>Posted Job List</h4>
            </Col>
            <Col className="text-end">
              <FormGroup className="d-inline-block mb-0">
                <Label for="statusFilter" className="me-2">
                  Status:
                </Label>
                <Input
                  type="select"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={this.handleStatusFilterChange}
                  style={{ display: "inline-block", width: "auto" }}
                >
                  <option value="all">All</option>
                  <option value="Approved">Approved</option>
                  <option value="UnApproved">UnApproved</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Card>
            <CardBody>
              <div className="table-responsive">
                <div style={{ overflowX: "auto" }}>
                  <Table className="table table-striped custom-table text-center align-middle">
                    <thead className="table-light">
                      <tr>
                        {this.tableHeaders.map((header) => (
                          <th
                            key={header.key}
                            style={{ minWidth: "140px", verticalAlign: "middle" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>{header.label}</span>
                              {header.key !== "action" && (
                                <Input
                                  type="text"
                                  placeholder={`Search ${header.label}`}
                                  value={searchTerms[header.key] || ""}
                                  onChange={(e) =>
                                    this.handleSearchChange(
                                      header.key,
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    maxWidth: "140px", // keeps input aligned
                                    fontSize: "0.85rem",
                                    height: "30px",
                                    padding: "4px 6px",
                                    borderRadius: "6px",
                                    border: "1px solid #ced4da",
                                  }}
                                />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedData.length > 0 ? (
                        paginatedData.map((item) => (
                          <tr key={item.id}>
                            {this.tableHeaders.map((header) => {
                              if (header.key === "packageprice") {
                                const price = item.packageprice
                                  ? Number(item.packageprice)
                                  : 0;
                                return (
                                  <td key={header.key}>
                                    {item.packagecurrency || "-"}{" "}
                                    {price.toLocaleString()}
                                  </td>
                                );
                              }
                              if (header.key === "duration_value") {
                                return (
                                  <td key={header.key}>
                                    {item.duration_value || "-"}{" "}
                                    {item.duration_unit}
                                  </td>
                                );
                              }
                              if (header.key === "action") {
                                return (
                                  <td key={header.key} className="status text-center">
                                    <div className="d-flex justify-content-center align-items-center gap-3">

                                      {/* View Details */}
                                      <button
                                        onClick={() => this.toggleModal({
                                          title: "Job Detail",
                                          details: item,
                                          fields: [
                                            "job_title", "job_description", "job_type",
                                            "min_salary", "max_salary", "currency",
                                            "min_experience", "max_experience", "profession",
                                            "degree", "no_of_positions", "industry",
                                            "application_deadline", "country", "district", "city",
                                          ],
                                        })}
                                        className="icon-btn"
                                        title="View Details"
                                      >
                                        <i className="bi bi-eye text-primary"></i>
                                      </button>

                                      {/* Approve / UnApprove — Pending Payment pe nahi dikhana */}
                                      {item.approval_status !== "Pending Payment" && (
                                        <button
                                          onClick={() => this.confirmStatus(item.jobpost_id, item.approval_status)}
                                          className="icon-btn"
                                          title={item.approval_status === "Approved" ? "UnApprove" : "Approve"}
                                        >
                                          {item.approval_status === "Approved" ? (
                                            <i className="bi bi-x-circle text-danger"></i>
                                          ) : (
                                            <i className="bi bi-check-circle text-success"></i>
                                          )}
                                        </button>
                                      )}

                                      {/* History */}
                                      <button
                                        onClick={() => this.getHistory(item.jobpost_id)}
                                        className="icon-btn"
                                        title="View History"
                                      >
                                        <i className="bi bi-clock-history text-dark"></i>
                                      </button>

                                    </div>
                                  </td>
                                );
                              }

                              if (header.key === "approval_status") {
                                let badgeClass = "badge-secondary";

                                if (item.approval_status === "Approved") {
                                  badgeClass = "badge-approved";
                                } else if (item.approval_status === "UnApproved") {
                                  badgeClass = "badge-unapproved";
                                } else {
                                  badgeClass = "badge-pending";
                                }

                                return (
                                  <td key={header.key} className="text-center">
                                    <span className={`badge ${badgeClass}`}>
                                      {item.approval_status}
                                    </span>
                                  </td>
                                );
                              }
                              if (header.key === "status") {
                                return (
                                  <td key={header.key} className="text-center">
                                    <span
                                      className={`badge ${item.status === "Active"
                                        ? "badge-active-custom"
                                        : "badge-inactive-custom"
                                        }`}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td key={header.key} className="text-center">
                                  {item[header.key] !== null &&
                                    item[header.key] !== undefined &&
                                    item[header.key] !== ""
                                    ? item[header.key]
                                    : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={this.tableHeaders.length}>
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </CardBody>
          </Card>

          <DetailModal
            isOpen={this.state.modalOpen}
            toggle={() => this.toggleModal()}
            title={this.state.modalData?.title}
            details={this.state.modalData?.details}
            fields={this.state.modalData?.fields}
          />
          <HistoryModal
            isOpen={this.state.historyModalOpen}
            toggle={() => this.setState({ historyModalOpen: false })}
            historyData={this.state.historyData}
          />

          {this.state.showConfirmModal && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                background: "#fff", borderRadius: "10px", padding: "24px",
                minWidth: "300px", textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}>
                <h6 style={{ fontWeight: 600, marginBottom: "12px" }}>
                  Confirm {this.state.confirmStatus === "Approved" ? "UnApprove" : "Approve"}
                </h6>
                <p style={{ marginBottom: "20px" }}>
                  Are you sure you want to{" "}
                  <strong>
                    {this.state.confirmStatus === "Approved" ? "unapprove" : "approve"}
                  </strong>{" "}
                  this Job?
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => this.setState({ showConfirmModal: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn btn-sm ${this.state.confirmStatus === "Approved" ? "btn-danger" : "btn-success"}`}
                    onClick={this.handleConfirmStatus}
                  >
                    {this.state.confirmStatus === "Approved" ? "UnApprove" : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages >= 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={this.handlePageChange}
            />
          )}
        </Container>
      </>

    );
  }
}

export default Job;
