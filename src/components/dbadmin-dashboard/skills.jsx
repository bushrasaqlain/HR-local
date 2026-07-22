import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
// import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import Helmet from "react-helmet";
import { withRouter } from "next/router";
import * as XLSX from "xlsx";
import {
  Card,
  Row,
  Col,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

class Skills extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightId: null,
      skills: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      currentPage: 1,
      totalSkills: 0,
      isActive: "all",
      successMessage: "",
      errorMessage: "",
      statusDropdownOpen: false,

    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchSkills();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchSkills();
      this.resetSearch();
    }
  }

  fetchSkills = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await axios.get(`${this.apiBaseUrl}getallskills`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        skills: response.data.skills || [],
        totalSkills: response.data.total || 0,
      }, () => {
        // ✅ highlight check
        const lastHistoryType = sessionStorage.getItem("lastHistoryType");
        const lastHistoryId = sessionStorage.getItem("lastHistoryId");

        if (lastHistoryType === "skill" && lastHistoryId) {
          this.setState({ highlightId: parseInt(lastHistoryId) });
          setTimeout(() => {
            this.setState({ highlightId: null });
            sessionStorage.removeItem("lastHistoryId");
            sessionStorage.removeItem("lastHistoryType");
          }, 3000);
        }
      });
    } catch (error) {
      console.error("Error fetching Skills:", error);
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" }); // Sep
    const year = String(date.getFullYear()).slice(-2); // 25

    return `${day}-${month}-${year}`;
  };
  handleExcelExport = () => {
    const { skills } = this.state;
    if (!skills.length) {
      this.setState({ errorMessage: "No data to export" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      skills.map((inst) => ({
        Name: inst.name,
        // Status: inst.status,
        // Created: this.formatDate(inst.created_at),
        // Updated: this.formatDate(inst.updated_at),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Skill");

    XLSX.writeFile(workbook, "Skill.xlsx");
    this.setState({ successMessage: "Skills exported successfully" });
    setTimeout(() => this.setState({ successMessage: "" }), 3000);
  };


  handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      this.setState({ errorMessage: "User not logged in" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const formattedData = jsonData
          .map(row => ({ name: row["Name"]?.toString().trim() }))
          .filter(row => row.name);

        if (!formattedData.length) {
          this.setState({ errorMessage: "No valid skill names found" });
          setTimeout(() => this.setState({ errorMessage: "" }), 3000);
          return;
        }

        await api.post(`${this.apiBaseUrl}addskill`, {
          type: "csv",
          data: formattedData,
          userId,
        });

        this.setState({ successMessage: "Skill imported successfully" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
        this.fetchSkills(1);
      };

      reader.readAsArrayBuffer(file);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to import Excel" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  toggleForm = (item = null) => {
    if (item) {
      this.setState({
        editId: item.id,
        inputValue: item.name,
        showModal: true,
      });
    } else {
      this.setState({ editId: null, inputValue: "", showModal: true });
    }
  };

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "skill", entity_id: id },
      });
      this.setState({ history: res.data || [] });
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  handleSave = async () => {
    const { editId, inputValue } = this.state;
    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}editskill/${editId}`, {
          name: inputValue,
        });
        this.setState((prevState) => ({
          skills: prevState.skills.map((item) =>
            item.id === editId ? { ...item, name: inputValue } : item
          ),
        }));
      } else {
        await api.post(`${this.apiBaseUrl}addskill`, { name: inputValue });
        this.fetchSkills(1);
      }
      this.setState({
        showModal: false,
        inputValue: "",
        editId: null,
        successMessage: editId ? "Skill updated successfully!" : "Skill added successfully!",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      console.error("Error saving Skill:", error);
      this.setState({ errorMessage: "Something went wrong" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  confirmDelete = (id, status) => {
    this.setState({
      deleteId: id,
      deleteStatus: status, // ✅ actual row status
      showDeleteConfirm: true,
    });
  };
  handleDelete = async () => {
    const { deleteId, deleteStatus } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}deleteskill/${deleteId}`);
      this.setState(
        {
          showDeleteConfirm: false,
          successMessage: deleteStatus === "Active"
            ? "Inactivated successfully"
            : "Activated successfully",
        },
        this.fetchSkills
      );
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      console.error("Error deleting Skill:", error);
      this.setState({ errorMessage: "Failed to update status" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    ["name", "created_at", "updated_at", "status"].forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });

    this.setState({ currentPage: 1 });

    try {
      const res = await axios.get(`${this.apiBaseUrl}getallskills`, {
        params: {
          name,
          search: value,
          status: this.state.isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        skills: res.data.skills || [],
        totalSkills: res.data.total || 0,
      });
    } catch (error) {
      console.error("Error searching Skills:", error);
    }
  };

  resetSearch = () => {
    ["name", "created_at", "updated_at", "status"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      skills,
      showModal,
      inputValue,
      showDeleteConfirm,
      currentPage,
      totalSkills,
      deleteStatus,
      isActive,
      editId,
      successMessage,
      errorMessage
    } = this.state;
    const totalPages = Math.ceil(totalSkills / this.itemsPerPage);

    const highlightStyle = `
    .highlight-row td {
        background-color: #fff3cd !important;
        transition: background-color 0.5s ease;
    }

    /* Teal theme - override Bootstrap default blue focus */
    .form-select:focus,
    .form-control:focus {
        border-color: #36565F !important;
        box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
    }
`;

    return (
      <React.Fragment>
        <style>{highlightStyle}</style>
        <Helmet>
          <title>Skill | List</title>
        </Helmet>
        <h6 className="fw-bold mb-3">Skills List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="institute-header-section d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
              {/* Left side: Status filter */}
              <div className="d-flex align-items-center gap-2">
                <span className="filter-label text-dark">Filter by Status:</span>

                <div style={{ position: "relative", maxWidth: "200px", width: "100%" }}>
                  <button
                    type="button"
                    className="form-select rounded-square p-2 text-start"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.setState((prev) => ({
                        statusDropdownOpen: !prev.statusDropdownOpen,
                      }))
                    }
                  >
                    {isActive === "all" ? "All" : isActive}
                  </button>

                  {this.state.statusDropdownOpen && (
                    <div
                      className="shadow-sm"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        marginTop: "2px",
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { label: "All", value: "all" },
                        { label: "Active", value: "Active" },
                        { label: "Inactive", value: "Inactive" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() =>
                            this.setState({ isActive: opt.value, statusDropdownOpen: false })
                          }
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            backgroundColor: isActive === opt.value ? "#36565F" : "#fff",
                            color: isActive === opt.value ? "#fff" : "#000",
                          }}
                          onMouseEnter={(e) => {
                            if (isActive !== opt.value)
                              e.currentTarget.style.backgroundColor = "#e8eef0";
                          }}
                          onMouseLeave={(e) => {
                            if (isActive !== opt.value)
                              e.currentTarget.style.backgroundColor = "#fff";
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Right side: Buttons */}
              <div className="d-flex align-items-center gap-2">
                <Button variant="dark" onClick={() => this.toggleForm()} className="add-institute-btn">
                  Add Skill
                </Button>

                <Button variant="secondary" onClick={() => this.fileInputRef.click()}>
                  Import Excel
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={(ref) => (this.fileInputRef = ref)}
                  style={{ display: "none" }}
                  onChange={this.handleExcelImport}
                />

                <Button variant="success" onClick={this.handleExcelExport}>
                  Export
                </Button>
              </div>


            </div>

            {successMessage && (
              <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
                <i className="bi bi-check-circle-fill text-success"></i>
                <span>{successMessage}</span>
                <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
              </div>
            )}
            {errorMessage && (
              <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
                <i className="bi bi-x-circle-fill"></i>
                <span>{errorMessage}</span>
                <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
              </div>
            )}

            <Card>
              <CardBody>
                <div className="table-responsive">
                  <Table className="table-responsive align-middle default-table manage-job-table p-2 w-100 table table-striped custom-table">
                    <thead className="align-middle">
                      <tr>

                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Skill Name
                            </small>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by name"
                              onChange={this.handleSearch}
                              style={{ maxWidth: "180px", borderColor: "#ccc" }}
                            />
                          </div>
                        </th>

                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Created
                            </small>
                            <input
                              type="date"
                              name="created_at"
                              id="created_at"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>

                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Updated
                            </small>
                            <input
                              type="date"
                              name="updated_at"
                              id="updated_at"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>
                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Status
                            </small>
                            <input
                              type="text"
                              name="status"
                              id="status"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>
                        <th
                          className="text-center text-dark fw-bold"
                          style={{
                            fontSize: "1rem",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {skills.map((item) => (
                        <tr
                          key={item.id}
                          className={this.state.highlightId === item.id ? "highlight-row" : ""}
                        >
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            {this.formatDate(item.created_at)}
                          </td>
                          <td className="text-center">
                            {this.formatDate(item.updated_at)}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${item.status === "Active" ? "badge-active-custom" : "badge-inactive-custom"}`}>
                              {item.status}
                            </span>
                          </td>

                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">

                              {/* Edit */}
                              <button
                                onClick={() => this.toggleForm(item)}
                                className="icon-btn"
                                title="Update"
                              >
                                <i className="bi bi-pencil-square" style={{ color: "#36565F" }}></i>
                              </button>

                              {/* Activate / Inactivate */}
                              <button
                                onClick={() => this.confirmDelete(item.id, item.status)}
                                className="icon-btn"
                                title={item.status === "Active" ? "Inactivate" : "Activate"}
                              >
                                {item.status === "Active" ? (
                                  <i className="bi bi-x-circle text-danger"></i>
                                ) : (
                                  <i className="bi bi-check-circle text-success"></i>
                                )}
                              </button>

                              {/* History */}
                              <button
                                className="icon-btn"
                                title="View History"
                                onClick={() => this.props.router.push(`/history/skill/${item.id}`)}
                              >
                                <i className="bi bi-clock-history text-dark"></i>
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Container>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={this.handlePageChange}
          />

          {/* Add/Edit Modal */}
          <Modal
            show={showModal}
            onHide={() => this.setState({ showModal: false })}
            centered
          >
            <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
              <Modal.Title style={{ fontSize: "1rem", marginBottom: "0" }}>
                {editId ? "Edit Skill" : "Add New Skill"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              <label style={{ marginBottom: "0.25rem" }}>Name</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                placeholder="Enter Skill name"
                className="form-control"
              />
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={this.handleSave} style={{
                backgroundColor: "#36565F",
                borderColor: "#36565F",
              }}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Confirmation */}
          <Modal show={showDeleteConfirm} onHide={this.cancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "1rem", fontWeight: 600 }}>
                Confirm {deleteStatus === "Active" ? "Inactivate" : "Activate"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="text-center py-3">
              <p style={{ marginBottom: 0 }}>
                Are you sure you want to{" "}
                <strong>
                  {deleteStatus === "Active" ? "inactivate" : "activate"}
                </strong>{" "}
                this Skill?
              </p>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={this.cancelDelete}>
                Cancel
              </Button>

              <Button
                variant={deleteStatus === "Active" ? "danger" : "success"}
                onClick={this.handleDelete}
              >
                {deleteStatus === "Active" ? "Inactivate" : "Activate"}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Skills);