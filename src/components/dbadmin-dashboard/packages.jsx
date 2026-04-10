import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import api from "../lib/api.jsx";
import Helmet from "react-helmet";
import { withRouter } from "next/router";
import * as XLSX from "xlsx";
import {
  Card, Row, Col, Container, CardBody, Table, Button, Modal,
} from "react-bootstrap";
import AsyncSelect from "react-select/async";
import "bootstrap-icons/font/bootstrap-icons.css";

class Packages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightId: null,
      packages: [],
      showModal: false,
      editId: null,
      FormData: {
        name: "",
        duration_value: "",
        duration_unit: "",
        price: "",
        description: "",
        candidate_limit: "",
        // interview_slots: "",
        location_scope: "",
        package_type: "",
        is_featured: false,
      },
      selectedCurrency: null,
      errors: {},
      successMessage: "",
      errorMessage: "",
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      currentPage: 1,
      totalPackages: 0,
      isActive: "all",
    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() { this.fetchPackages(); }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchPackages();
      this.resetSearch();
    }
  }

  fetchPackages = async (
    page = this.state.currentPage,
    status = this.state.isActive,
  ) => {
    try {
      const response = await axios.get(`${this.apiBaseUrl}packages/getallpackages`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState(
        { packages: response.data.packages || [], totalPackages: response.data.total || 0 },
        () => {
          const lastHistoryType = sessionStorage.getItem("lastHistoryType");
          const lastHistoryId = sessionStorage.getItem("lastHistoryId");
          if (lastHistoryType === "package" && lastHistoryId) {
            this.setState({ highlightId: parseInt(lastHistoryId) });
            setTimeout(() => {
              this.setState({ highlightId: null });
              sessionStorage.removeItem("lastHistoryId");
              sessionStorage.removeItem("lastHistoryType");
            }, 3000);
          }
        },
      );
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  loadCurrencies = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15, status: "Active" },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  handleCurrencyChange = (selectedCurrency) => {
    this.setState({ selectedCurrency, errors: { ...this.state.errors, currency: "" } });
  };

  formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Format limit for display: null/empty = "Unlimited"
  formatLimit = (value) => {
    if (value === null || value === undefined || value === "") return "Unlimited";
    return value;
  };

  handleExcelExport = () => {
    const { packages } = this.state;
    if (!packages || !packages.length) {
      this.setState({ errorMessage: "No packages available to export" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    const dataToExport = packages.map((pkg) => ({
      "Name":             pkg.name,
      "Package Type":     pkg.package_type,
      "Duration unit":    pkg.duration_unit,
      "Duration value":   pkg.duration_value,
      "Price":            pkg.price,
      "Currency":         pkg.currency,
      "Candidate limit":  pkg.candidate_limit ?? "Unlimited",
      // "Interview slots":  pkg.interview_slots ?? "Unlimited",
      "Location Slots":   pkg.location_scope,
      "Is featured":      pkg.is_featured ? "Yes" : "No",
      "Description":      pkg.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");
    XLSX.writeFile(workbook, "Packages.xlsx");

    this.setState({ successMessage: "Packages exported successfully" });
    setTimeout(() => this.setState({ successMessage: "" }), 3000);
  };

  handleExcelImport = (e) => {
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

        const formatted = jsonData.map((row) => ({
          name:            row["Name"],
          package_type:    row["Package Type"],
          duration_unit:   row["Duration unit"],
          duration_value:  row["Duration value"],
          price:           row["Price"],
          currency:        row["Currency"],
          candidate_limit: row["Candidate limit"] === "Unlimited" ? null : row["Candidate limit"] || null,
          // interview_slots: row["Interview slots"] === "Unlimited" ? null : row["Interview slots"] || null,
          location_scope:  row[ "Location Slots"],
          is_featured:     row["Is featured"] === "Yes" ? 1 : 0,
          description:     row["Description"] || null,
        }));

        await api.post(`${this.apiBaseUrl}packages/`, { type: "csv", data: formatted });
        this.setState({ successMessage: "Packages imported successfully" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
        this.fetchPackages(1);
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to import Excel" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState((prevState) => ({
      FormData: {
        ...prevState.FormData,
        [name]: type === "checkbox" ? checked : value,
      },
      errors: { ...prevState.errors, [name]: "" },
    }));
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    ["price", "duration_unit", "duration_value", "currency", "status", "created_at", "updated_at"].forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });
    this.setState({ currentPage: 1 });
    try {
      const res = await axios.get(`${this.apiBaseUrl}packages/getallpackages`, {
        params: { name, search: value, status: this.state.isActive, page: 1, limit: this.itemsPerPage },
      });
      this.setState({ packages: res.data.packages || [], totalPackages: res.data.total || 0 });
    } catch (error) {
      console.error("Error searching packages:", error);
    }
  };

  resetSearch = () => {
    ["price", "duration_unit", "duration_value", "currency", "status", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => { this.setState({ currentPage: page }); };

  validateForm = () => {
    const { FormData, selectedCurrency } = this.state;
    let errors = {};
    if (!FormData.duration_value) errors.duration_value = "Duration value is required";
    if (!FormData.duration_unit)  errors.duration_unit  = "Duration unit is required";
    if (!FormData.price)          errors.price          = "Price is required";
    if (!selectedCurrency)        errors.currency       = "Currency is required";
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  toggleForm = (item = null) => {
    if (item) {
      this.setState({
        showModal: true,
        editId: item.id,
        FormData: {
          name:            item.name,
          duration_value:  item.duration_value,
          duration_unit:   item.duration_unit,
          price:           item.price,
          description:     item.description || "",
          candidate_limit: item.candidate_limit ?? "",
          // interview_slots: item.interview_slots ?? "",
          location_scope:  item.location_scope,
          package_type:    item.package_type || "",
          is_featured:     item.is_featured === 1,
        },
        selectedCurrency: { label: item.currency, value: item.currency_id },
        errors: {},
      });
    } else {
      this.setState({
        showModal: true,
        editId: null,
        FormData: {
          name: "", duration_value: "", duration_unit: "", price: "",
          description: "", candidate_limit: "", location_scope: "", package_type: "", is_featured: false,
        },
        selectedCurrency: null,
        errors: {},
      });
    }
  };

  handleSubmit = async () => {
    if (!this.validateForm()) return;
    const { editId, FormData, selectedCurrency } = this.state;

    const payload = {
      name:            FormData.name,
      duration_value:  FormData.duration_value,
      duration_unit:   FormData.duration_unit,
      price:           FormData.price,
      currency_id:     selectedCurrency.value,
      description:     FormData.description || null,
      // Send null for unlimited (empty string → null)
      candidate_limit: FormData.candidate_limit !== "" ? Number(FormData.candidate_limit) : null,
      // interview_slots: FormData.interview_slots !== "" ? Number(FormData.interview_slots) : null,
      location_scope:  FormData.location_scope,
      package_type:    FormData.package_type,
      is_featured:     FormData.is_featured ? 1 : 0,
    };

    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}packages/${editId}`, payload);
      } else {
        await api.post(`${this.apiBaseUrl}packages/`, payload);
      }

      this.fetchPackages();
      this.setState({
        showModal: false, editId: null,
        FormData: { name: "", duration_value: "", duration_unit: "", price: "", description: "", candidate_limit: "",  location_scope: "", package_type: "", is_featured: false },
        selectedCurrency: null, errors: {},
        successMessage: editId ? "Package updated successfully!" : "Package added successfully!",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      this.setState({ errorMessage: "Something went wrong" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  confirmDelete = (id, status) => {
    this.setState({ deleteId: id, deleteStatus: status, showDeleteConfirm: true });
  };

  handleDelete = async () => {
    const { deleteId, deleteStatus } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}packages/deletepackage/${deleteId}`);
      this.setState(
        { showDeleteConfirm: false, successMessage: deleteStatus === "Active" ? "Inactivated successfully" : "Activated successfully" },
        this.fetchPackages,
      );
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      console.error("Error deleting packages:", error);
      this.setState({ showDeleteConfirm: false, errorMessage: "Failed to update status" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  cancelDelete = () => { this.setState({ showDeleteConfirm: false, deleteId: null }); };

  render() {
    const {
      packages, showModal, showDeleteConfirm, currentPage, totalPackages,
      deleteStatus, isActive, editId, successMessage, errorMessage,
      errors, selectedCurrency, FormData,
    } = this.state;
    const totalPages = Math.ceil(totalPackages / this.itemsPerPage);

    return (
      <React.Fragment>
        <style>{`.highlight-row td { background-color: #fff3cd !important; transition: background-color 0.5s ease; }`}</style>
        <Helmet><title>Packages | List</title></Helmet>
        <h6 className="fw-bold mb-3">Packages List</h6>

        <div className="poppins-font">
          <Container fluid>
            {/* Top bar */}
            <div className="institute-header-section d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="filter-label text-dark">Filter by Status:</span>
                <select
                  className="rounded-square form-select p-2"
                  style={{ maxWidth: "200px" }}
                  value={isActive}
                  onChange={(e) => this.setState({ isActive: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="d-flex align-items-end gap-2 flex-wrap">
                <Button variant="dark" onClick={() => this.toggleForm()}>Add Package</Button>
                <Button variant="secondary" onClick={() => this.fileInputRef.click()}>Import Excel</Button>
                <input type="file" accept=".xlsx,.xls" ref={(ref) => (this.fileInputRef = ref)} style={{ display: "none" }} onChange={this.handleExcelImport} />
                <Button variant="success" onClick={this.handleExcelExport}>Export</Button>
              </div>
            </div>

            {/* Alerts */}
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
                        {/* Existing columns */}
                        {[
                          { label: "Name",           id: "name",           type: "text"},
                          { label: "Package Type",   id: "package_type",   type: "text"},
                          { label: "Price",          id: "price",          type: "number" },
                          { label: "Duration Unit",  id: "duration_unit",  type: "text"   },
                          { label: "Duration Value", id: "duration_value", type: "text"   },
                          { label: "Currency",       id: "currency",       type: "text"   },
                        ].map(({ label, id, type }) => (
                          <th key={id} className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                            <div className="d-flex flex-column align-items-center gap-1">
                              <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>{label}</small>
                              <input type={type} name={id} id={id} className="form-control rounded-4 text-center"
                                placeholder={`Search`} onChange={this.handleSearch} style={{ maxWidth: "150px", borderColor: "#ccc" }} />
                            </div>
                          </th>
                        ))}

                        {/* New columns — no search needed, just labels */}
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Candidates</small>
                        </th>
                        {/* <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Interviews</small>
                        </th> */}
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Location Slot</small>
                        </th>
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Featured</small>
                        </th>

                        {/* Date columns */}
                        {[
                          { label: "Created", id: "created_at" },
                          { label: "Updated", id: "updated_at" },
                        ].map(({ label, id }) => (
                          <th key={id} className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                            <div className="d-flex flex-column align-items-center gap-1">
                              <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>{label}</small>
                              <input type="date" name={id} id={id} className="form-control rounded-4 text-center"
                                onChange={this.handleSearch} style={{ borderColor: "#ccc" }} />
                            </div>
                          </th>
                        ))}

                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Status</small>
                            <input type="text" name="status" id="status" className="form-control rounded-4 text-center"
                              onChange={this.handleSearch} style={{ borderColor: "#ccc" }} />
                          </div>
                        </th>
                        <th className="text-center text-dark fw-bold" style={{ fontSize: "1rem", borderBottom: "1px solid #ccc" }}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {packages.map((item) => (
                        <tr key={item.id} className={this.state.highlightId === item.id ? "highlight-row" : ""}>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">{item.package_type}</td>
                          <td className="text-center">{item.price}</td>
                          <td className="text-center">{item.duration_unit}</td>
                          <td className="text-center">{item.duration_value}</td>
                          <td className="text-center">{item.currency}</td>

                          {/* New columns */}
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {this.formatLimit(item.candidate_limit)}
                            </span>
                          </td>
                          {/* <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {this.formatLimit(item.interview_slots)}
                            </span>
                          </td> */}
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {this.formatLimit(item.location_scope)}
                            </span>
                          </td>
                          <td className="text-center">
                            {item.is_featured ? (
                              <span className="badge" style={{ background: "#378ADD", color: "#fff" }}>Yes</span>
                            ) : (
                              <span className="badge bg-light text-muted border">No</span>
                            )}
                          </td>

                          <td className="text-center">{this.formatDate(item.created_at)}</td>
                          <td className="text-center">{this.formatDate(item.updated_at)}</td>
                          <td className="text-center">
                            <span className={`badge ${item.status === "Active" ? "badge-active-custom" : "badge-inactive-custom"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">
                              <button onClick={() => this.toggleForm(item)} className="icon-btn" title="Update">
                                <i className="bi bi-pencil-square text-primary"></i>
                              </button>
                              <button onClick={() => this.confirmDelete(item.id, item.status)} className="icon-btn"
                                title={item.status === "Active" ? "Inactivate" : "Activate"}>
                                {item.status === "Active"
                                  ? <i className="bi bi-x-circle text-danger"></i>
                                  : <i className="bi bi-check-circle text-success"></i>}
                              </button>
                              <button className="icon-btn" title="View History"
                                onClick={() => this.props.router.push(`/history/package/${item.id}`)}>
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

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={this.handlePageChange} />

          {/* Add / Edit Modal */}
       <Modal show={showModal} onHide={() => this.setState({ showModal: false })} centered size="lg">
  <Modal.Header closeButton style={{ background: "#f8fafc" }}>
    <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
      {editId ? "Edit Package" : "Add New Package"}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body style={{ padding: "2rem" }}>
    <Row>

      {/* ── Step 1: Pick type first ── */}
      <Col md={12}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Package Type <span className="text-danger">*</span></label>
          <select
            name="package_type"
            value={FormData.package_type}
            onChange={this.handleInputChange}
            className="form-select"
          >
            <option value="">Select type first</option>
            <option value="company">Company — for posting jobs</option>
            <option value="candidate">Candidate — for boosting profile</option>
          </select>
          <small className="text-muted">
            {FormData.package_type === "candidate"
              ? "Candidate buys this to boost their profile visibility"
              : FormData.package_type === "company"
              ? "Company buys this to post a job and view matched candidates"
              : "Select a type to continue"}
          </small>
        </div>
      </Col>

      {/* ── Rest of fields only show after type is selected ── */}
      {FormData.package_type && (
        <>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
              <input type="text" name="name" value={FormData.name}
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                onChange={this.handleInputChange} placeholder="e.g., Basic, Standard, Premium" />
              {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Duration Value <span className="text-danger">*</span></label>
              <input type="number" name="duration_value" value={FormData.duration_value}
                className={`form-control ${errors.duration_value ? "is-invalid" : ""}`}
                onChange={this.handleInputChange} placeholder="e.g., 7, 15, 30" />
              {errors.duration_value && <div className="text-danger small mt-1">{errors.duration_value}</div>}
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Duration Unit <span className="text-danger">*</span></label>
              <select name="duration_unit" value={FormData.duration_unit} onChange={this.handleInputChange}
                className={`form-select ${errors.duration_unit ? "is-invalid" : ""}`}>
                <option value="">Select Unit</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
                <option value="Weeks">Weeks</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
              {errors.duration_unit && <div className="text-danger small mt-1">{errors.duration_unit}</div>}
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Price <span className="text-danger">*</span></label>
              <input type="number" name="price" value={FormData.price}
                className={`form-control ${errors.price ? "is-invalid" : ""}`}
                onChange={this.handleInputChange} placeholder="e.g., 2000, 6000" />
              {errors.price && <div className="text-danger small mt-1">{errors.price}</div>}
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Currency <span className="text-danger">*</span></label>
              <AsyncSelect cacheOptions defaultOptions loadOptions={this.loadCurrencies}
                value={selectedCurrency} onChange={this.handleCurrencyChange}
                placeholder="Select Currency" classNamePrefix="react-select" />
              {errors.currency && <div className="text-danger small mt-1">{errors.currency}</div>}
            </div>
          </Col>

          {/* ── Company-only fields ── */}
          {FormData.package_type === "company" && (
            <>
              <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Candidate Limit</label>
                  <input type="number" name="candidate_limit" value={FormData.candidate_limit}
                    className="form-control" onChange={this.handleInputChange}
                    placeholder="Leave empty for unlimited" min="1" />
                  <small className="text-muted">How many matched candidates the company can view</small>
                </div>
              </Col>

              {/* <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Shortlist Limit</label>
                  <input type="number" name="interview_slots" value={FormData.interview_slots}
                    className="form-control" onChange={this.handleInputChange}
                    placeholder="Leave empty for unlimited" min="1" />
                  <small className="text-muted">How many candidates the company can shortlist</small>
                </div>
              </Col> */}

              <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Location Scope</label>
                  <select name="location_scope" value={FormData.location_scope}
                    onChange={this.handleInputChange} className="form-select">
                    <option value="city">Job city only</option>
                    <option value="all">All cities</option>
                  </select>
                  <small className="text-muted">Match candidates from the job's city only, or nationwide</small>
                </div>
              </Col>
            </>
          )}

          <Col md={12}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description <span className="text-muted">(Optional)</span></label>
              <textarea name="description" value={FormData.description} onChange={this.handleInputChange}
                className="form-control" rows="3"
                placeholder={"Enter one feature per line:\nHighlighted in search results\nEmail alerts to candidates"} />
              <small className="text-muted">Each line becomes a bullet point on the pricing card</small>
            </div>
          </Col>

          <Col md={12}>
            <div className="mb-3 d-flex align-items-center gap-3 p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <input type="checkbox" name="is_featured" id="is_featured" checked={FormData.is_featured}
                onChange={this.handleInputChange} className="form-check-input" style={{ width: 20, height: 20 }} />
              <div>
                <label htmlFor="is_featured" className="form-label fw-semibold mb-0" style={{ cursor: "pointer" }}>
                  Mark as "Most Popular"
                </label>
                <p className="text-muted small mb-0">This plan will be highlighted with a blue border and "Most popular" badge on the pricing page</p>
              </div>
            </div>
          </Col>
        </>
      )}

    </Row>

    <div className="d-flex justify-content-end gap-2 mt-2">
      <Button variant="secondary" onClick={() => this.setState({ showModal: false })}>Cancel</Button>
      <Button variant="success" onClick={this.handleSubmit} disabled={!FormData.package_type}>
        {editId ? "Update Package" : "Save Package"}
      </Button>
    </div>
  </Modal.Body>
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
                Are you sure you want to <strong>{deleteStatus === "Active" ? "inactivate" : "activate"}</strong> this package?
              </p>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={this.cancelDelete}>Cancel</Button>
              <Button variant={deleteStatus === "Active" ? "danger" : "success"} onClick={this.handleDelete}>
                {deleteStatus === "Active" ? "Inactivate" : "Activate"}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Packages);
