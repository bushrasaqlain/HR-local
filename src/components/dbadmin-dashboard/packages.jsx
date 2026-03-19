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

      // 🔽 REQUIRED FOR FORM
      FormData: {
        duration: "",
        package: "",
        amount: "",
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

  componentDidMount() {
    this.fetchPackages();
  }

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
      const response = await axios.get(
        `${this.apiBaseUrl}packages/getallpackages`,
        {
          params: { page, limit: this.itemsPerPage, status },
        },
      );

      console.log("API response:", response.data);
      console.log("Packages:", response.data.packages);
      console.log("First package:", response.data.packages?.[0]);
      this.setState(
        {
          packages: response.data.packages || [],
          totalPackages: response.data.total || 0,
        },
        () => {
          // ✅ highlight check
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
        params: {
          search: inputValue || "",
          page: 1,
          limit: 15,
          status: "Active",
        },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  handleCurrencyChange = (selectedCurrency) => {
    console.log(selectedCurrency);
    this.setState({
      selectedCurrency,
      errors: { ...this.state.errors, currency: "" },
    });
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
    const { packages } = this.state;

    if (!packages || !packages.length) {
      this.setState({ errorMessage: "No packages available to export" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    const dataToExport = packages.map((pkg) => ({
      "Duration unit": pkg.duration_unit,
      "Duration value": pkg.duration_value,
      Price: pkg.price,
      Currency: pkg.currency,
      // "Status": pkg.status,
      // "Created At": this.formatDate(pkg.created_at),
      // "Updated At": this.formatDate(pkg.updated_at),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");

    // Write file
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
          duration_unit: row["Duration unit"],
          duration_value: row["Duration value"],
          price: row["Price"],
          currency: row["Currency"],
        }));

        await api.post(`${this.apiBaseUrl}packages/`, {
          type: "csv",
          data: formatted,
        });

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
    const { name, value } = e.target;

    this.setState((prevState) => ({
      FormData: {
        ...prevState.FormData,
        [name]: value,
      },
      errors: {
        ...prevState.errors,
        [name]: "",
      },
    }));
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    [
      "price",
      "duration_unit",
      "duration_value",
      "currency",
      "status",
      "created_at",
      "updated_at",
    ].forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });

    this.setState({ currentPage: 1 });

    try {
      const res = await axios.get(`${this.apiBaseUrl}packages/getallpackages`, {
        params: {
          name,
          search: value,
          status: this.state.isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        packages: res.data.packages || [],
        totalPackages: res.data.total || 0,
      });
    } catch (error) {
      console.error("Error searching packages:", error);
    }
  };

  resetSearch = () => {
    [
      "price",
      "duration_unit",
      "duration_value",
      "currency",
      "status",
      "created_at",
      "updated_at",
    ].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "package", entity_id: id },
      });
      console.log("console", res.data);
      this.setState({ history: res.data || [] });
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  validateForm = () => {
    const { FormData, selectedCurrency } = this.state;
    let errors = {};

    if (!FormData.duration_value)
      errors.duration_value = "Duration value is required";
    if (!FormData.duration_unit)
      errors.duration_unit = "Duration unit is required";
    if (!FormData.price) errors.price = "Price is required";
    if (!selectedCurrency) errors.currency = "Currency is required";

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  toggleForm = (item = null) => {
    console.log(item);
    // ✅ Fix — keys must match form input name attributes
    if (item) {
      this.setState({
        showModal: true,
        editId: item.id,
        FormData: {
          duration_value: item.duration_value,
          duration_unit: item.duration_unit,
          price: item.price,
          description: item.description || "",
        },
        selectedCurrency: {
          label: item.currency,
          value: item.currency_id,
        },
        errors: {},
      });
    } else {
      this.setState({
        showModal: true,
        editId: null,
        FormData: {
          duration_value: "",
          duration_unit: "",
          price: "",
          description: "",
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
      duration_value: FormData.duration_value,
      duration_unit: FormData.duration_unit,
      price: FormData.price,
      currency_id: selectedCurrency.value,
      description: FormData.description,
    };

    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}packages/${editId}`, payload);
      } else {
        await api.post(`${this.apiBaseUrl}packages/`, payload);
      }

      this.fetchPackages();

      this.setState({
        showModal: false,
        editId: null,
        FormData: {
          duration_value: "",
          duration_unit: "",
          price: "",
          description: "",
        },
        selectedCurrency: null,
        errors: {},
        // ✅ set success message
        successMessage: editId
          ? "Package updated successfully!"
          : "Package added successfully!",
      });

      // ✅ auto-clear after 3 seconds
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      this.setState({ errorMessage: "Something went wrong" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  confirmDelete = (id, status) => {
    this.setState({
      deleteId: id,
      deleteStatus: status,
      showDeleteConfirm: true,
    });
  };
  handleDelete = async () => {
    const { deleteId, deleteStatus } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}packages/deletepackage/${deleteId}`);

      this.setState(
        {
          showDeleteConfirm: false,
          successMessage:
            deleteStatus === "Active"
              ? "Inactivated successfully"
              : "Activated successfully",
        },
        this.fetchPackages,
      );

      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      console.error("Error deleting packages:", error);
      this.setState({
        showDeleteConfirm: false,
        errorMessage: "Failed to update status",
      });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  render() {
    const {
      packages,
      showModal,
      inputValue,
      showDeleteConfirm,
      currentPage,
      totalPackages,
      deleteStatus,
      isActive,
      editId,
      successMessage,
      errorMessage,
      errors,
      selectedCurrency,
      FormData,
    } = this.state;
    const totalPages = Math.ceil(totalPackages / this.itemsPerPage);

    const highlightStyle = `
        .highlight-row td {
            background-color: #fff3cd !important;
            transition: background-color 0.5s ease;
        }
    `;

    return (
      <React.Fragment>
        <style>{highlightStyle}</style>
        <Helmet>
          <title>Packages | List</title>
        </Helmet>
        <h6 className="fw-bold mb-3">Packages List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="institute-header-section d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
              {/* Left side: Status filter */}
              <div className="d-flex align-items-center gap-2">
                <span className="filter-label text-dark">
                  Filter by Status:
                </span>
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

              {/* Right side: Buttons */}
              <div className="d-flex align-items-end gap-2 flex-wrap">
                {/* Add Institute */}
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-institute-btn"
                >
                  Add Package
                </Button>

                {/* Import Excel */}
                <Button
                  variant="secondary"
                  onClick={() => this.fileInputRef.click()}
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

            {/* Success Message */}
            {successMessage && (
              <div
                className="alert alert-success alert-dismissible d-flex align-items-center gap-2"
                role="alert"
                style={{ borderRadius: "8px" }}
              >
                <i className="bi bi-check-circle-fill text-success"></i>
                <span>{successMessage}</span>
                <button
                  type="button"
                  className="btn-close ms-auto"
                  onClick={() => this.setState({ successMessage: "" })}
                />
              </div>
            )}
            {errorMessage && (
              <div
                className="alert alert-danger alert-dismissible d-flex align-items-center gap-2"
                role="alert"
                style={{ borderRadius: "8px" }}
              >
                <i className="bi bi-x-circle-fill"></i>
                <span>{errorMessage}</span>
                <button
                  type="button"
                  className="btn-close ms-auto"
                  onClick={() => this.setState({ errorMessage: "" })}
                />
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
                              Price
                            </small>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by Price"
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
                              Duration Unit
                            </small>
                            <input
                              type="text"
                              name="duration_unit"
                              id="duration_unit"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by duration_unit"
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
                              Duration Value
                            </small>
                            <input
                              type="text"
                              name="duration_value"
                              id="duration_value"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by duration_value"
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
                              Currency
                            </small>
                            <input
                              type="text"
                              name="currency"
                              id="currency"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by Currency"
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
                      {packages.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            this.state.highlightId === item.id
                              ? "highlight-row"
                              : ""
                          }
                        >
                          <td className="text-center">{item.price}</td>
                          <td className="text-center">{item.duration_unit}</td>
                          <td className="text-center">{item.duration_value}</td>
                          <td className="text-center">{item.currency}</td>
                          <td className="text-center">
                            {this.formatDate(item.created_at)}
                          </td>
                          <td className="text-center">
                            {this.formatDate(item.updated_at)}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${item.status === "Active" ? "badge-active-custom" : "badge-inactive-custom"}`}
                            >
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
                                <i className="bi bi-pencil-square text-primary"></i>
                              </button>

                              {/* Activate / Inactivate */}
                              <button
                                onClick={() =>
                                  this.confirmDelete(item.id, item.status)
                                }
                                className="icon-btn"
                                title={
                                  item.status === "Active"
                                    ? "Inactivate"
                                    : "Activate"
                                }
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
                                onClick={() =>
                                  this.props.router.push(
                                    `/history/package/${item.id}`,
                                  )
                                }
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
          {/* Add/Edit Modal */}
          <Modal
            show={showModal}
            onHide={() => this.setState({ showModal: false })}
            centered
            size="lg"
          >
            <Modal.Header closeButton style={{ background: "#f8fafc" }}>
              <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                {editId ? "Edit Package" : "Add New Package"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: "2rem" }}>
              <form onSubmit={this.handleSubmit}>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Duration Value <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="duration_value"
                        value={FormData.duration_value}
                        className={`form-control ${errors.duration_value ? "is-invalid" : ""}`}
                        onChange={this.handleInputChange}
                        placeholder="e.g., 7, 15, 30"
                      />
                      {errors.duration_value && (
                        <div className="text-danger small mt-1">
                          {errors.duration_value}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Duration Unit <span className="text-danger">*</span>
                      </label>
                      <select
                        name="duration_unit"
                        value={FormData.duration_unit}
                        onChange={this.handleInputChange}
                        className={`form-select ${errors.duration_unit ? "is-invalid" : ""}`}
                      >
                        <option value="">Select Unit</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                      {errors.duration_unit && (
                        <div className="text-danger small mt-1">
                          {errors.duration_unit}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={FormData.price}
                        className={`form-control ${errors.price ? "is-invalid" : ""}`}
                        onChange={this.handleInputChange}
                        placeholder="e.g., 399, 699, 1499"
                      />
                      {errors.price && (
                        <div className="text-danger small mt-1">
                          {errors.price}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Currency <span className="text-danger">*</span>
                      </label>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={this.loadCurrencies}
                        value={selectedCurrency}
                        onChange={this.handleCurrencyChange}
                        placeholder="Select Currency"
                        classNamePrefix="react-select"
                      />
                      {errors.currency && (
                        <div className="text-danger small mt-1">
                          {errors.currency}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col md={12}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Description (Optional)
                      </label>
                      <textarea
                        name="description"
                        value={FormData.description}
                        onChange={this.handleInputChange}
                        className="form-control"
                        rows="3"
                        placeholder="Enter package description..."
                      />
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => this.setState({ showModal: false })}
                  >
                    Cancel
                  </Button>
                  <Button variant="success" onClick={this.handleSubmit}>
                    {editId ? "Update Package" : "Save Package"}
                  </Button>
                </div>
              </form>
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
                Are you sure you want to{" "}
                <strong>
                  {deleteStatus === "Active" ? "inactivate" : "activate"}
                </strong>{" "}
                this Country?
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

export default withRouter(Packages);
