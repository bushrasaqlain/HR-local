import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import MetaTags from "react-meta-tags";
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

class DegreeField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      degreeFieldData: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      degreeTypes: [],
      selectedDegreeType: "",
      history: [],
      currentPage: 1,
      totalDegreeFileds: 0,
      isImportMode: false,
      importFile: null,
      isActive: "all",
      filters: {
        name: "",
        created_at: "",
        updated_at: ""
      }

    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  fetchDegreeTypes = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldegreetype`);
      this.setState({ degreeTypes: res.data.degreetypes || [] });
    } catch (err) {
      console.error("Error fetching degree types", err);
    }
  };

  componentDidMount() {
    this.fetchDegreeFields();
    this.fetchDegreeTypes(); // 👈 IMPORTANT
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchDegreeFields();
      this.resetSearch();
    }
  }

  fetchDegreeFields = async (page = this.state.currentPage, filters = {}) => {
    try {
      const params = {
        page,
        limit: this.itemsPerPage,
      };

      // Status filter
      let status = filters.status ?? this.state.isActive;
      if (status === "all") {
        // ✅ omit status completely for "All"
      } else if (status.toLowerCase() === "active") {
        params.status = "Active"; // match your backend
      } else if (status.toLowerCase() === "inactive") {
        params.status = "Inactive"; // match your backend
      }

      // Only add status if not "all"
      if (status !== "all") params.status = params.status || status;

      // Add search filters
      if (filters.name) params.name = filters.name;
      if (filters.created_at) params.created_at = filters.created_at;
      if (filters.updated_at) params.updated_at = filters.updated_at;

      const response = await axios.get(`${this.apiBaseUrl}getallDegreeFields`, { params });

      this.setState({
        degreeFieldData: response.data.degreefields || [],
        totalDegreeFileds: response.data.total || 0,
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching degreeFieldData:", error);
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
    const { degreeFieldData } = this.state;

    if (!degreeFieldData || !degreeFieldData.length) {
      toast.info("No degreeFieldData available to export");
      return;
    }

    // Map data for Excel
    const dataToExport = degreeFieldData.map((degreeField) => ({
      "Degree": degreeField.degree_type_name,
      "Degree Field": degreeField.name,
      "Status": degreeField.status,
      "Created At": this.formatDate(degreeField.created_at),
      "Updated At": this.formatDate(degreeField.updated_at),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DegreeField");

    // Write file
    XLSX.writeFile(workbook, "Degree Field.xlsx");

    toast.success("Degree Field exported successfully");
  };

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "degreefield", entity_id: id },
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
        selectedDegreeType: item.degree_type_id, // 👈 EDIT MODE
        showModal: true,
      });
    } else {
      this.setState({
        editId: null,
        inputValue: "",
        selectedDegreeType: "",
        showModal: true,
      });
    }
  };


  toggleHistory = (item = null) => {
    if (item) this.fetchHistory(item.id);
    this.setState({ showHistoryModal: true });
  };

  handleSave = async () => {
    const { editId, inputValue, selectedDegreeType, isImportMode, importFile } = this.state;
    const userId = sessionStorage.getItem("userId");
    if (!selectedDegreeType) {
      toast.error("Please select a Degree Type");
      return;
    }

    try {
      if (isImportMode) {
        if (!importFile) {
          toast.error("Please select an Excel file");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          const degreefieldData = jsonData
            .map(row => ({ name: row.name?.toString().trim() }))
            .filter(row => row.name);

          if (!degreefieldData.length) {
            toast.error("No valid degreefield names found in Excel");
            return;
          }

          await api.post(`${this.apiBaseUrl}adddegreefield`, {
            type: "csv",
            data: degreefieldData,
            t_id: selectedDegreeType,
            userId,
          });

          toast.success("degreefield imported successfully");
          this.fetchDegreeFields(1);
          this.setState({ showModal: false, importFile: null, isImportMode: false, selectedCountry: null });
        };

        reader.readAsArrayBuffer(importFile);
      } else {
        if (editId) {
          await api.put(`${this.apiBaseUrl}editDegreeField/${editId}`, {
            name: inputValue,
            t_id: selectedDegreeType, // ✅ SEND DEGREE TYPE
          });

          this.setState((prevState) => ({
            degreeFieldData: prevState.degreeFieldData.map((item) =>
              item.id === editId
                ? {
                  ...item,
                  name: inputValue,
                  degree_type_id: selectedDegreeType,
                }
                : item
            ),
          }));
        } else {
          await api.post(`${this.apiBaseUrl}adddegreefield`, {
            name: inputValue,
            t_id: selectedDegreeType, 
             userId,
          });

          this.fetchDegreeFields(1);
        }
      }

      this.setState({
        showModal: false,
        inputValue: "",
        selectedDegreeType: "",
        editId: null,
      });
    } catch (error) {
      console.error("Error saving Degree Field:", error);
      toast.error(error.response?.data?.error || "Something went wrong");
    }
  };


  confirmDelete = (id, status) => {
    this.setState({
      deleteId: id,
      deleteStatus: status, // store actual current status of row
      showDeleteConfirm: true,
    });
  };

  handleDelete = async () => {
    const { deleteId, deleteStatus } = this.state;

    if (!deleteId) {
      toast.error("Invalid Degree Field ID");
      return;
    }

    try {
      const response = await api.delete(
        `${this.apiBaseUrl}deleteDegreeField/${deleteId}`
      );

      if (response.data?.success) {
        toast.success(
          deleteStatus === "active"
            ? "Inactivated successfully"
            : "Activated successfully"
        );

        // Refresh table
        this.setState(
          { showDeleteConfirm: false, deleteId: null, deleteStatus: null },
          this.fetchDegreeFields
        );
      } else {
        toast.error(response.data?.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error deleting Degree Field:", error);
      toast.error(
        error.response?.data?.error || "Something went wrong. Please try again."
      );
    }
  };


  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };


  handleSearch = async (e) => {
    const { name, value } = e.target;

    const res = await axios.get(`${this.apiBaseUrl}getallDegreeFields`, {
      params: {
        column: name,      // ✅ column name
        search: value,     // ✅ search value
        status: this.state.isActive,
        page: 1,
        limit: this.itemsPerPage,
      },
    });

    this.setState({
      degreeFieldData: res.data.degreefields || [],
      totalDegreeFileds: res.data.total || 0,
      currentPage: 1,
    });
  };




  resetSearch = () => {
    ["name", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };
  // Status dropdown change
  onStatusChange = (e) => {
    const value = e.target.value;
    this.setState({ isActive: value, currentPage: 1 }, () => {
      this.fetchDegreeFields(1, { status: value });
    });
  };
  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      degreeFieldData,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      history,
      currentPage,
      totalDegreeFileds,
      deleteStatus,
      isActive,
      editId,
    } = this.state;
    const totalPages = Math.ceil(totalDegreeFileds / this.itemsPerPage);

    return (
      <React.Fragment>
        <MetaTags>
          <title>Degree Field | List</title>
        </MetaTags>
        <h6 className="fw-bold mb-3">Degree Field List</h6>
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
                  Add Degree Field
                </Button>

                {/* Import Excel */}
                <Button
                  variant="secondary"
                  onClick={() => this.setState({ showModal: true, isImportMode: true, selectedCountry: null, importFile: null })}
                >
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
                              Degree Field
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
                      {degreeFieldData.map((item) => (
                        <tr key={item.id}>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            {this.formatDate(item.created_at)}
                          </td>
                          <td className="text-center">
                            {this.formatDate(item.updated_at)}
                          </td>
                          <td className="text-center">
                            {item.status}
                          </td>

                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">
                              <button onClick={() => this.toggleForm(item)} className="icon-btn">
                                <span className="la la-pencil"></span>
                              </button>

                              <button
                                onClick={() => this.confirmDelete(item.id, item.status)}
                                className="icon-btn"
                              >
                                {item.status === "active" ? (
                                  <span className="la la-times-circle text-danger"></span>
                                ) : (
                                  <span className="la la-check-circle text-success"></span>
                                )}
                              </button>

                              <button onClick={() => this.toggleHistory(item)} className="icon-btn">
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
                {editId ? "Edit Degree Field" : "Add New Degree Field"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              <label style={{ marginBottom: "0.25rem" }}>Degree Type</label>
              <select
                className="form-select mb-2"
                value={this.state.selectedDegreeType}
                onChange={(e) =>
                  this.setState({ selectedDegreeType: e.target.value })
                }
              >
                <option value="">Select Degree Type</option>
                {this.state.degreeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {this.state.isImportMode ? (
                <>
                  {/* Excel file input for import */}
                  <label className="mb-1">Select Excel File</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-control"
                    onChange={(e) => this.setState({ importFile: e.target.files[0] })}
                    disabled={
                      !this.state.selectedDegreeType
                    }
                  />
                  <small className="text-muted">
                    Excel must have a column named <strong>"Name"</strong>
                  </small>
                </>
              ) : (
                <>

                  <label style={{ marginBottom: "0.25rem" }}>Name</label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => this.setState({ inputValue: e.target.value })}
                    placeholder="Enter Degree Field"
                    className="form-control"
                  />
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={this.handleSave}
                disabled={
                  !this.state.selectedDegreeType ||
                  (!this.state.isImportMode && !this.state.inputValue) ||
                  (this.state.isImportMode && !this.state.importFile)
                }>
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
                this Currency?
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

export default DegreeField;