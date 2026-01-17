import React, { Component } from "react";
import Head from "next/head";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import * as XLSX from "xlsx";
// import MetaTags from "react-meta-tags";
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

class Speciality extends Component {
  constructor(props) {
    super(props);
    this.state = {
      speciality: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      history: [],
      currentPage: 1,
      totalspeciality: 0,
      isActive: "all",
    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchspeciality();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchspeciality();
      this.resetSearch();
    }
  }

  fetchspeciality = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await axios.get(`${this.apiBaseUrl}getAllspeciality`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        speciality: response.data.speciality || [],
        totalspeciality: response.data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching speciality:", error);
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

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "speciality", entity_id: id },
      });
      this.setState({ history: res.data || [] });
    } catch (error) {
      console.error("Error fetching history:", error);
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

  toggleHistory = (item = null) => {
    if (item) this.fetchHistory(item.id);
    this.setState({ showHistoryModal: true });
  };

  handleSave = async () => {
    const { editId, inputValue } = this.state;

    if (!inputValue.trim()) {
      toast.error("Speciality name cannot be empty");
      return;
    }

    try {
      let response;

      if (editId) {
        response = await api.put(`/editspeciality/${editId}`, {
          name: inputValue,
        });
        toast.success("Speciality updated successfully!");
        this.setState({ showModal: false, inputValue: "", editId: null });
        this.fetchspeciality(this.state.currentPage);
      } else {
        response = await api.post("/addspeciality", { name: inputValue });
        toast.success(
          response.data?.message || "Speciality added successfully!"
        );
        this.setState({ showModal: false, inputValue: "" });
        this.fetchspeciality(1); // refresh first page
      }
    } catch (error) {
      console.error("Error saving speciality:", error);

      // Handle duplicate / conflict gracefully
      if (error.response?.status === 409) {
        toast.error(
          error.response.data?.message || "Speciality already exists"
        );
      } else {
        toast.error(
          error.response?.data?.error ||
            "An error occurred while saving Speciality"
        );
      }
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
    const { deleteId, isActive } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}deletespeciality/${deleteId}`);
      toast.success(
        isActive === "active"
          ? "Inactivated successfully"
          : "Activated successfully"
      );
      this.setState({ showDeleteConfirm: false }, this.fetchspeciality);
    } catch (error) {
      console.error("Error deleting speciality:", error);
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
      const res = await axios.get(`${this.apiBaseUrl}getAllspeciality`, {
        params: {
          name,
          search: value,
          status: this.state.isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        speciality: res.data.speciality || [],
        totalspeciality: res.data.total || 0,
      });
    } catch (error) {
      console.error("Error searching speciality:", error);
    }
  };

  resetSearch = () => {
    ["name", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleExport = () => {
    const { speciality } = this.state;
    if (!speciality.length) {
      toast.info("No data to export");
      return;
    }

    // 🔹 Convert to worksheet
    const wsData = speciality.map((item) => ({
      Name: item.name,
      Created: this.formatDate(item.created_at),
      Updated: this.formatDate(item.updated_at),
      Status: item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);

    // 🔹 Create a new workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Speciality");

    // 🔹 Export to file
    XLSX.writeFile(wb, "Speciality_List.xlsx");
  };

  handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target.result;

      let names = [];

      // 🔹 Check file type
      if (file.name.endsWith(".csv")) {
        // CSV parsing
        const text = data;
        names = text
          .split("\n")
          .map((row) => row.trim())
          .filter((row) => row); // remove empty lines
      } else {
        // XLSX parsing
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // array of arrays
        names = json.map((row) => row[0]).filter((n) => n); // first column
      }

      if (!names.length) {
        toast.error("No valid names found in file");
        return;
      }

      try {
        const res = await api.post("/addspeciality", { name: names });
        toast.success(res.data.message + ` (${res.data.inserted} inserted)`);
        this.fetchspeciality(1); // refresh table
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.error || "Import failed");
      }
    };

    // 🔹 Read as text for CSV, binary for XLSX
    if (file.name.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsBinaryString(file);

    // reset input
    event.target.value = null;
  };

  render() {
    const {
      speciality,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      history,
      currentPage,
      totalspeciality,
      deleteStatus,
      isActive,
      editId,
    } = this.state;
    const totalPages = Math.ceil(totalspeciality / this.itemsPerPage);

    return (
      <React.Fragment>
        <Head>
          <title>Speciality | List</title>
        </Head>
        <h6 className="fw-bold mb-3">Speciality List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="d-flex justify-content-end gap-1 my-3">
              <Button variant="outline-secondary" onClick={this.handleExport}>
                Export
              </Button>

              <Button
                variant="outline-primary"
                onClick={() => this.fileInput.click()}
              >
                Import
              </Button>

              {/* hidden file input */}
              <input
                type="file"
                accept=".csv,.xlsx"
                ref={(ref) => (this.fileInput = ref)}
                style={{ display: "none" }}
                onChange={this.handleImport}
              />
            </div>
            <div className="speciality-header-section">
              <p
                className="breadcrumb-text"
                title="History"
                breadcrumbItem="Activity Log"
              />

              <div className="d-flex justify-content-end gap-1 my-2">
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-speciality-btn"
                >
                  Add Speciality
                </Button>
              </div>

              <div className="w-100 m-2">
                <p className="filter-label text-dark">Filter by Status</p>
                <select
                  className="rounded-square form-select p-2"
                  style={{
                    maxWidth: "250px",
                    // fontFamily: "Helvetica Neue, Arial, sans-serif",
                    color: "#666565ff",
                    border: "1px solid #ccc",
                  }}
                  value={isActive}
                  onChange={(e) => this.setState({ isActive: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

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
                              Speciality
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
                      {speciality.map((item) => (
                        <tr key={item.id}>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            {this.formatDate(item.created_at)}
                          </td>
                          <td className="text-center">
                            {this.formatDate(item.updated_at)}
                          </td>
                          <td className="text-center">{item.status}</td>

                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">
                              <button
                                onClick={() => this.toggleForm(item)}
                                className="icon-btn"
                              >
                                <span className="la la-pencil"></span>
                              </button>

                              <button
                                onClick={() =>
                                  this.confirmDelete(item.id, item.status)
                                }
                                className="icon-btn"
                              >
                                {item.status === "active" ? (
                                  <span className="la la-times-circle text-danger"></span>
                                ) : (
                                  <span className="la la-check-circle text-success"></span>
                                )}
                              </button>

                              <button
                                onClick={() => this.toggleHistory(item)}
                                className="icon-btn"
                              >
                                <span className="la la-history"></span>
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
                {editId ? "Edit Speciality" : "Add New Speciality"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              <label style={{ marginBottom: "0.25rem" }}>Name</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                placeholder="Enter Speciality name"
                className="form-control"
              />
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={this.handleSave}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Confirmation */}
          <Modal show={showDeleteConfirm} onHide={this.cancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "1rem", fontWeight: 600 }}>
                Confirm {deleteStatus === "active" ? "Inactivate" : "Activate"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="text-center py-3">
              <p style={{ marginBottom: 0 }}>
                Are you sure you want to{" "}
                <strong>
                  {deleteStatus === "active" ? "inactivate" : "activate"}
                </strong>{" "}
                this Speciality?
              </p>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={this.cancelDelete}>
                Cancel
              </Button>

              <Button
                variant={deleteStatus === "active" ? "danger" : "success"}
                onClick={this.handleDelete}
              >
                {deleteStatus === "active" ? "Inactivate" : "Activate"}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* History Modal */}
          <Modal
            show={showHistoryModal}
            onHide={() => this.setState({ showHistoryModal: false })}
            centered
            scrollable
          >
            <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
              <Modal.Title style={{ fontSize: "1rem", marginBottom: 0 }}>
                History
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2 mb-2 rounded"
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#f8f9fa" : "#e9ecef",
                    border: "1px solid #dee2e6",
                    fontSize: "14px",
                  }}
                >
                  <strong> {item.data.name} </strong> was{" "}
                  <span
                    style={{
                      color:
                        item.action === "ADDED"
                          ? "green"
                          : item.action === "UPDATED"
                          ? "purple"
                          : item.action === "ACTIVE"
                          ? "teal"
                          : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {item.action}
                  </span>{" "}
                  by <em>{item.changed_by_name}</em> on{" "}
                  {this.formatDate(item.changed_at)}
                </div>
              ))}
            </Modal.Body>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default Speciality;
