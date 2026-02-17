import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import * as XLSX from "xlsx";
import MetaTags from "react-meta-tags";
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

class LicenseType extends Component {
  constructor(props) {
    super(props);
    this.state = {
      licenseTypes: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      history: [],
      currentPage: 1,
      totallicenseTypes: 0,
      isActive: "all",
    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchlicenseTypes();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchlicenseTypes();
      this.resetSearch();
    }
  }

  fetchlicenseTypes = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await axios.get(`${this.apiBaseUrl}getAllLicenseTypes`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        licenseTypes: response.data.licenseTypes || [],
        totallicenseTypes: response.data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching licenseTypes:", error);
    }
  };

  handleExcelExport = () => {
    const { licenseTypes } = this.state;

    if (!licenseTypes.length) {
      toast.info("No businesstype available to export");
      return;
    }

    // Map data for Excel
    const dataToExport = licenseTypes.map((licenseType) => ({
      "Name": licenseType.name,
      "Status": licenseType.status,
      "Created At": this.formatDate(licenseType.created_at),
      "Updated At": this.formatDate(licenseType.updated_at),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "licenseTypes");

    // Write file
    XLSX.writeFile(workbook, "license Types.xlsx");

    toast.success("licenseTypes exported successfully");
  };

  handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      toast.error("User not logged in");
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
          .map(row => ({ name: row.name?.toString().trim() }))
          .filter(row => row.name);

        if (!formattedData.length) {
          toast.error("No valid licenseTypes names found");
          return;
        }

        await api.post(`${this.apiBaseUrl}addLicenseType`, {
          type: "csv",
          data: formattedData,
          userId,
        });

        toast.success("licenseTypes imported successfully");
        this.fetchlicenseTypes(1);
      };

      reader.readAsArrayBuffer(file);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      toast.error("Failed to import Excel");
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
        params: { entity_type: "license_types", entity_id: id },
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
      toast.error("License type name cannot be empty");
      return;
    }

    try {
      let response;

      if (editId) {
        response = await api.put(`/editLicenseType/${editId}`, {
          name: inputValue,
        });
        toast.success("License type updated successfully!");
        this.setState({ showModal: false, inputValue: "", editId: null });
        this.fetchlicenseTypes(this.state.currentPage);
      } else {
        response = await api.post("/addLicenseType", { name: inputValue });
        toast.success(
          response.data?.message || "License type added successfully!"
        );
        this.setState({ showModal: false, inputValue: "" });
        this.fetchlicenseTypes(1); // refresh first page
      }
    } catch (error) {
      console.error("Error saving licenseType:", error);

      // Handle duplicate / conflict gracefully
      if (error.response?.status === 409) {
        toast.error(
          error.response.data?.message || "License type already exists"
        );
      } else {
        toast.error(
          error.response?.data?.error ||
          "An error occurred while saving license type"
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
      await api.delete(`${this.apiBaseUrl}deleteLicenseType/${deleteId}`);
      toast.success(
        isActive === "active"
          ? "Inactivated successfully"
          : "Activated successfully"
      );
      this.setState({ showDeleteConfirm: false }, this.fetchlicenseTypes);
    } catch (error) {
      console.error("Error deleting licenseType:", error);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  handleSearch = async (e) => {
  const { name, value } = e.target;
  
  // Clear other search inputs
  ["name", "created_at", "updated_at", "status"].forEach((input) => {
    if (input !== name) {
      const ele = document.getElementById(input);
      if (ele) ele.value = "";
    }
  });

  this.setState({ currentPage: 1 });

  try {
    const res = await axios.get(`${this.apiBaseUrl}getAllLicenseTypes`, {
      params: {
        name,  // Column to search in
        search: value,  // Search term
        status: this.state.isActive,
        page: 1,
        limit: this.itemsPerPage,
      },
    });
    
    this.setState({
      licenseTypes: res.data.licenseTypes || [],
      totallicenseTypes: res.data.total || 0,
    });
  } catch (error) {
    console.error("Error searching licenseTypes:", error);
    if (error.response) {
      console.error("Error details:", error.response.data);
    }
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

  render() {
    const {
      licenseTypes,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      history,
      currentPage,
      totallicenseTypes,
      deleteStatus,
      isActive,
      editId,
    } = this.state;
    const totalPages = Math.ceil(totallicenseTypes / this.itemsPerPage);

    return (
      <React.Fragment>
        <MetaTags>
          <title>LicenseType | List</title>
        </MetaTags>
        <h6 className="fw-bold mb-3">LicenseType List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="institute-header-section d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">

              {/* Left side: Status filter */}
              <div className="d-flex align-items-center gap-2">
                <span className="filter-label text-dark">Filter by Status:</span>
                <select
                  className="rounded-square form-select p-2"
                  style={{ maxWidth: "200px" }}
                  value={isActive}
                  onChange={(e) => this.setState({ isActive: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>


              {/* Right side: Buttons */}
              <div className="d-flex align-items-end gap-2 flex-wrap">

                {/* Add Institute */}
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-institute-btn"
                >
                  Add License Type
                </Button>

                {/* Import Excel */}
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

                {/* Export Button */}
                <Button
                  variant="success"
                  onClick={this.handleExcelExport} // create this function
                >
                  Export
                </Button>
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
                              License Type
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
                      {licenseTypes.map((item) => (
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
                {editId ? "Edit LicenseType" : "Add New LicenseType"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              <label style={{ marginBottom: "0.25rem" }}>Name</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                placeholder="Enter LicenseType name"
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
                this LicenseType?
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

export default LicenseType;
