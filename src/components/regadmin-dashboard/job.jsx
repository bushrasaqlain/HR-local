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
import DetailModal from "../common/DetailModal";
import HistoryModal from "../common/HistoryModal";
import Head from "next/head";
class Job extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
                <Table className="table table-striped table-bordered text-center align-middle">
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
                                <td key={header.key} className="text-center">
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    {/* Buttons row */}
                                    <div
                                      style={{ display: "flex", gap: "6px" }}
                                    >
                                      {item.status !== "Pending Payment" && (
                                        <Button
                                          color="primary"
                                          size="sm"
                                          onClick={() => {
                                            this.setState((prevState) => ({
                                              editingRow:
                                                prevState.editingRow ===
                                                item.jobpost_id
                                                  ? null
                                                  : item.jobpost_id,
                                              editingStatus: {
                                                ...prevState.editingStatus,
                                                [item.jobpost_id]:
                                                  prevState.editingStatus[
                                                    item.jobpost_id
                                                  ] ||
                                                  item.isActive ||
                                                  "UnApproved",
                                              },
                                            }));
                                          }}
                                        >
                                          <i className="la la-edit" />
                                        </Button>
                                      )}

                                      <Button
                                        color="outline-danger"
                                        size="sm"
                                        onClick={() =>
                                          this.toggleModal({
                                            title: "job Detail",
                                            details: item,
                                            fields: [
                                              "job_title",
                                              "job_description",
                                              "job_type",
                                              "min_salary",
                                              "max_salary",
                                              "currency",
                                              "min_experience",
                                              "max_experience",
                                              "profession",
                                              "degree",
                                              "no_of_positions",
                                              "industry",
                                              "application_deadline",
                                              "country",
                                              "district",
                                              "city",
                                            ],
                                          })
                                        }
                                      >
                                        <i className="la la-eye" />
                                      </Button>

                                      <Button
                                        color="outline-info"
                                        size="sm"
                                        onClick={() =>
                                          this.getHistory(item.jobpost_id)
                                        }
                                      >
                                        <i className="la la-history" />
                                      </Button>
                                    </div>

                                    {/* Dropdown appears BELOW edit button */}
                                    {editingRow === item.jobpost_id && (
                                      <Input
                                        type="select"
                                        style={{ width: "120px" }}
                                        value={editingStatus[item.jobpost_id]} // ✅ now defined
                                        onChange={(e) => {
                                          const selectedStatus = e.target.value;
                                          this.setState((prevState) => ({
                                            editingStatus: {
                                              ...prevState.editingStatus,
                                              [item.jobpost_id]: selectedStatus,
                                            },
                                          }));
                                          this.updateCompanyStatus(
                                            item.jobpost_id,
                                            selectedStatus,
                                          );
                                        }}
                                      >
                                        <option value="Approved">
                                          Approved
                                        </option>
                                        <option value="UnApproved">
                                          UnApproved
                                        </option>
                                      </Input>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={header.key}>
                                {item[header.key] || "-"}
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
