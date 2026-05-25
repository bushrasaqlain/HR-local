"use client";
import React, { Component } from "react";
import api from "../lib/api";
import Pagination from "../common/pagination";
// import { toast } from "react-toastify";
import Head from "next/head";
import {
  Card,
  CardBody,
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
} from "reactstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import DetailModal from "../common/DetailModal";
import HistoryModal from "../common/HistoryModal";
import { withRouter } from "next/router";
class CandidateData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showConfirmModal: false,
      confirmId: null,
      confirmStatus: null,
      candidateData: [],
      editingRow: null,
      currentPage: 1,
      pageSize: 20,
      totalRecords: 0, // ✅ ADD THIS
      statusFilter: "All",
      searchTerms: {
        id: "",
        username: "",
        email: "",
        password: "",
        gender: "",
        marital_status: "",
        status: "",
      },
      selectedCandidate: null,
      historyModalOpen: false,
      historyData: [],
      successMessage: "",
      errorMessage: "",
    };
    this.tableHeaders = [
      // { key: "candidate_id", label: "Id" },
      { key: "full_name", label: "User Name" },
      { key: "email", label: "Email" },
      { key: "password", label: "Password" },
      { key: "gender", label: "Gender" },
      { key: "marital_status", label: "Marital Status" },
      { key: "isActive", label: "Status" },
      { key: "action", label: "Action" },
    ];

    this.apibasurl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchCandidateData();
  }

  fetchCandidateData = () => {
    const { currentPage, pageSize, statusFilter, searchTerms } = this.state;

    const apiUrl = `${this.apibasurl}candidateProfile/getallcandidates`;
    const token = localStorage.getItem("token");

    // Determine which column has a search value
    let searchColumn = "";
    let searchValue = "";
    for (const key in searchTerms) {
      if (searchTerms[key]) {
        searchColumn = key; // send this to backend
        searchValue = searchTerms[key];
        break; // only first non-empty column
      }
    }

    api
      .get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: pageSize,
          status: statusFilter !== "All" ? statusFilter : "",
          search: searchValue,
          name: searchColumn,
        },
      })
      .then((res) => {
        this.setState({
          candidateData: res.data.candidate,
          totalRecords: res.data.total,
        });
      });
  };

  updateCandidateStatus = (id, status) => {
    const userId = sessionStorage.getItem("userId");
    console.log("userId from session:", userId);
    const apiUrl = `${this.apibasurl}candidateProfile/updateStatus/${id}/${status}/${userId}`;

    api.put(apiUrl).then((res) => {
      if (res.status === 200) {
        this.setState((prevState) => ({
          candidateData: prevState.candidateData.map((item) =>
            item.id === id ? { ...item, isActive: status } : item,
          ),
          editingRow: null,
          successMessage: "Candidate status updated successfully!",
        }));
        setTimeout(() => {
          this.setState({ successMessage: "" });
        }, 3000);
      }
    });
  };

  getHistory = (id) => {
    const accountType = "candidate";
    const apiUrl = `${this.apibasurl}gethistory/${id}/${accountType}`;
    const token = localStorage.getItem("token");

    api
      .get(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const filteredHistory = (res.data.history || []).map((item) => {
          if (item.data) {
            const { logo, ...restData } = item.data;
            return { ...item, data: restData };
          }
          return item;
        });

        this.setState({
          historyData: filteredHistory,
          historyModalOpen: true,
        });
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        this.setState({ errorMessage: "Failed to fetch history." });
        setTimeout(() => this.setState({ errorMessage: "" }), 3000);
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
      this.fetchCandidateData,
    );
  };

  handleStatusFilterChange = (e) => {
    this.setState(
      { statusFilter: e.target.value, currentPage: 1 },
      this.fetchCandidateData,
    );
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page }, this.fetchCandidateData);
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
    const newStatus = confirmStatus === "Active" ? "Inactive" : "Active";
    this.updateCandidateStatus(confirmId, newStatus);
    this.setState({ showConfirmModal: false, confirmId: null, confirmStatus: null });
  };

  render() {
    const {
      candidateData,
      editingRow,
      currentPage,
      pageSize,
      statusFilter,
      searchTerms,
      totalRecords,
    } = this.state;

    const totalPages = Math.ceil(totalRecords / pageSize);

    const paginatedData = candidateData;

    return (
      <>
        <Head>
          <title>Candidate | List</title>
        </Head>
        {this.state.successMessage && (
          <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>{this.state.successMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
          </div>
        )}
        {this.state.errorMessage && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-x-circle-fill"></i>
            <span>{this.state.errorMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
          </div>
        )}
        {/* Status Filter */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h6 className="fw-bold mb-3">Candidate List</h6>
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
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <Card>
          <CardBody>
            <div className="table-responsive">
              <Table className="table table-striped custom-table text-center align-middle">
                <thead className="table-light text-center align-middle">
                  <tr>
                    {this.tableHeaders.map((header) => (
                      <th key={header.key}>
                        <div
                          style={{ minWidth: "140px", verticalAlign: "middle" }}
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
                              className="mb-2"
                              style={{
                                width: "100%", // keep 100% of column
                                fontSize: "0.85rem",
                                height: "30px",
                                padding: "4px 6px",
                                borderRadius: "6px",
                                border: "1px solid #ced4da",
                                boxSizing: "border-box", // important
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
                          if (header.key === "action") {
                            return (
                              <td key={header.key} className="status text-center">
                                <div className="d-flex justify-content-center align-items-center gap-3">

                                  {/* View Details */}
                                  <button
                                    onClick={() => this.toggleModal({
                                      title: "Candidate Details",
                                      details: item,
                                      fields: [
                                        "total_experience", "license_type", "license_number",
                                        "phone", "country_name", "city_name", "district_name",
                                        "address", "created_at", "updated_at",
                                      ],
                                    })}
                                    className="icon-btn"
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye text-primary"></i>
                                  </button>

                                  {/* Activate / Inactivate */}
                                  <button
                                    onClick={() => this.confirmStatus(item.id, item.isActive)}
                                    className="icon-btn"
                                    title={item.isActive === "Active" ? "Inactivate" : "Activate"}
                                  >
                                    {item.isActive === "Active" ? (
                                      <i className="bi bi-x-circle text-danger"></i>
                                    ) : (
                                      <i className="bi bi-check-circle text-success"></i>
                                    )}
                                  </button>

                                  {/* History */}
                                  <button
                                    onClick={() => this.props.onViewHistory(item.account_id)}
                                    className="icon-btn"
                                    title="View History"
                                  >
                                    <i className="bi bi-clock-history text-dark"></i>
                                  </button>

                                </div>
                              </td>
                            );
                          }

                          if (header.key === "isActive") {
                            return (
                              <td key={header.key} className="text-center">
                                <span
                                  className={`badge ${item.isActive === "Active"
                                    ? "badge-active-custom"
                                    : "badge-inactive-custom"
                                    }`}
                                >
                                  {item.isActive}
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

                          // return <td key={header.key}>{item[header.key]}</td>;
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={this.tableHeaders.length}
                        className="text-center align-middle py-4"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
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

        {/* Confirm Status Modal */}
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
                Confirm {this.state.confirmStatus === "Active" ? "Inactivate" : "Activate"}
              </h6>
              <p style={{ marginBottom: "20px" }}>
                Are you sure you want to{" "}
                <strong>
                  {this.state.confirmStatus === "Active" ? "inactivate" : "activate"}
                </strong>{" "}
                this Candidate?
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => this.setState({ showConfirmModal: false })}
                >
                  Cancel
                </button>
                <button
                  className={`btn btn-sm ${this.state.confirmStatus === "Active" ? "btn-danger" : "btn-success"}`}
                  onClick={this.handleConfirmStatus}
                >
                  {this.state.confirmStatus === "Active" ? "Inactivate" : "Activate"}
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
      </>
    );
  }
}

export default withRouter(CandidateData);
