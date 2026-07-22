import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
// import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import Head from "next/head";
import AsyncSelect from "react-select/async";
import { withRouter } from "next/router";
import * as XLSX from "xlsx";
import {
  Card,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const tealSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#36565F" : "#ccc",
    boxShadow: state.isFocused ? "0 0 0 1px #36565F" : "none",
    "&:hover": { borderColor: "#36565F" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#36565F"
      : state.isFocused
        ? "#e8eef0"
        : "#fff",
    color: state.isSelected ? "#fff" : "#000",
    cursor: "pointer",
  }),
};

class City extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightId: null,
      cities: [],
      showModal: false,
      inputValue: "",
      editId: null,
      updateStatus: null,
      updateId: null,
      showUpdateStatus: false,
      currentPage: 1,
      totalCities: 0,
      isActive: "all",
      selectedDistrict: null,
      isImportMode: false,
      importFile: null,
      successMessage: "",
      errorMessage: "",
      statusDropdownOpen: false,

    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchCities();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchCities();
      this.resetSearch();
    }
  }

  // Load districts for AsyncSelect
  loadDistricts = async (inputValue) => {
    try {
      const res = await api.get(`${this.apiBaseUrl}getAllDistricts`, {
        params: {
          search: inputValue || "",
          page: 1,
          limit: 20,
          status: "Active",
        },
      });

      return (res.data.districts || []).map((item) => ({
        value: item.id,
        label: item.name,
      }));
    } catch (err) {
      console.error("Error loading districts", err);
      return [];
    }
  };

  fetchCities = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await api.get(`${this.apiBaseUrl}getAllCities`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        cities: response.data.cities || [],
        totalCities: response.data.total || 0,
      }, () => {
        // ✅ highlight check
        const lastHistoryType = sessionStorage.getItem("lastHistoryType");
        const lastHistoryId = sessionStorage.getItem("lastHistoryId");

        if (lastHistoryType === "city" && lastHistoryId) {
          this.setState({ highlightId: parseInt(lastHistoryId) });
          setTimeout(() => {
            this.setState({ highlightId: null });
            sessionStorage.removeItem("lastHistoryId");
            sessionStorage.removeItem("lastHistoryType");
          }, 3000);
        }
      });
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    const { isActive } = this.state;

    // reset other search fields
    [
      "city_name",
      // "country_name",
      "district_name",
      "country",
      "created_at",
      "updated_at",
      "status",
    ].forEach((id) => {
      if (id !== name) {
        const ele = document.getElementById(id);
        if (ele) ele.value = "";
      }
    });

    try {
      const res = await api.get(`${this.apiBaseUrl}getAllCities`, {
        params: {
          name,
          search: value,
          status: isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        cities: res.data.cities || [],
        totalCities: res.data.total || 0,
        currentPage: 1,
      });
    } catch (error) {
      console.error("Error searching cities:", error);
    }
  };

  resetSearch = () => {
    [
      "city_name",
      "district_name",
      "country_name",
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

  handleExcelExport = () => {
    const { cities } = this.state;

    if (!cities || !cities.length) {
      this.setState({ errorMessage: "No cities available to export" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    // Map data for Excel
    const dataToExport = cities.map((cities) => ({
      "City Name": cities.name,
      // "District Name": cities.district_name,
      // "Country Name": cities.country_name,
      // "Status": cities.status,
      // "Created At": this.formatDate(cities.created_at),
      // "Updated At": this.formatDate(cities.updated_at),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cities");

    // Write file
    XLSX.writeFile(workbook, "Cities.xlsx");

    this.setState({ successMessage: "Cities exported successfully" });
    setTimeout(() => this.setState({ successMessage: "" }), 3000);
  };

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "city", entity_id: id },
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
        selectedDistrict: {
          value: item.district_id,
          label: item.district_name,
        },
        showModal: true,
      });
    } else {
      this.setState({
        editId: null,
        inputValue: "",
        selectedDistrict: null,
        showModal: true,
      });
    }
  };

  handleSave = async () => {
    const { editId, inputValue, selectedDistrict, isImportMode, importFile } = this.state;
    const userId = sessionStorage.getItem("userId");

    if (!selectedDistrict) {


      this.setState({ errorMessage: "Please select a district." });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    try {
      if (isImportMode) {
        if (!importFile) {
          this.setState({ errorMessage: "Please select an Excel file." });
          setTimeout(() => this.setState({ errorMessage: "" }), 3000);
          return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          const citiesData = jsonData
            .map(row => ({ name: row["City Name"]?.toString().trim() }))
            .filter(row => row.name);
          if (!citiesData.length) {
            this.setState({ errorMessage: "No valid city names found in Excel" });
            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
            return;
          }

          await api.post(`${this.apiBaseUrl}addCities`, {
            type: "csv",
            data: citiesData,
            district_id: selectedDistrict.value,
            userId,

          });

          this.setState({
            showModal: false,
            importFile: null,
            isImportMode: false,
            selectedDistrict: null,
            successMessage: "Cities imported successfully",
          });
          setTimeout(() => this.setState({ successMessage: "" }), 3000);
          this.fetchCities(1);
        };

        reader.readAsArrayBuffer(importFile);
      } else {
        // NORMAL ADD/EDIT CITY
        if (editId) {
          await api.put(`${this.apiBaseUrl}editCity/${editId}`, {
            name: inputValue,
            district_id: selectedDistrict.value,
          });
        } else {
          await api.post(`${this.apiBaseUrl}addcities`, {
            name: inputValue,
            district_id: selectedDistrict.value,
          });
        }

        this.fetchCities(1);
        this.setState({
          showModal: false,
          inputValue: "",
          selectedDistrict: null,
          editId: null,
          successMessage: editId ? "City updated successfully!" : "City added successfully!",
        });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
      }
    } catch (error) {
      console.error("Error saving city:", error.response?.data || error);
    }
  };

  confirmStatus = (id, status) => {
    this.setState({
      updateId: id,
      updateStatus: status, // ✅ actual row status
      showUpdateStatus: true,
    });
  };

  handleStatus = async () => {
    const { updateId, updateStatus, cities } = this.state;

    try {
      await api.put(`${this.apiBaseUrl}updateCityStatus/${updateId}`, {
        // Pass the new status to backend
        status: updateStatus === "Active" ? "Inactive" : "Active",
      });

      // Update frontend state immediately
      this.setState({
        cities: cities.map((city) =>
          city.id === updateId
            ? { ...city, status: updateStatus === "Active" ? "Inactive" : "Active" }
            : city
        ),
        showUpdateStatus: false,
        updateId: null,
        updateStatus: null,
      });

      this.setState({
        successMessage: updateStatus === "Active"
          ? "City inactivated successfully"
          : "City activated successfully",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      console.error("Error updating city status:", error);
      this.setState({ errorMessage: "Failed to update status" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  cancelStatus = () => {
    this.setState({ showUpdateStatus: false, updateId: null });
  };

  render() {
    const {
      cities,
      showModal,
      inputValue,
      showUpdateStatus,
      currentPage,
      totalCities,
      isActive,
      history,
      editId,
      updateStatus,
      selectedDistrict,
      successMessage,
      errorMessage
    } = this.state;
    const totalPages = Math.ceil(totalCities / this.itemsPerPage);

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
        <Head>
          <title>City | List</title>
        </Head>
        <h6 className="fw-bold mb-3">City List</h6>
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
              <div className="d-flex align-items-end gap-2 flex-wrap">

                {/* Add Institute */}
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-institute-btn"
                >
                  Add City
                </Button>

                {/* Import Excel */}
                <Button
                  variant="secondary"
                  onClick={() =>
                    this.setState({
                      showModal: true,
                      isImportMode: true,
                      selectedDistrict: null,
                      importFile: null,
                      inputValue: "",
                    })
                  }
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
                              City
                            </small>
                            <input
                              type="text"
                              name="city_name"
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
                              District
                            </small>
                            <input
                              type="text"
                              name="district"
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
                              Country
                            </small>
                            <input
                              type="text"
                              name="country"
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
                      {cities.map((item) => (
                        <tr
                          key={item.id}
                          className={this.state.highlightId === item.id ? "highlight-row" : ""}
                        >
                          <td>{item.name}</td>
                          <td>{item.district_name}</td>
                          <td>{item.country_name}</td>
                          <td>{this.formatDate(item.created_at)}</td>
                          <td>{this.formatDate(item.updated_at)}</td>
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
                                onClick={() => this.confirmStatus(item.id, item.status)}
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
                                onClick={() => this.props.router.push(`/history/city/${item.id}`)}
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
        </div>
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
              {editId ? "Edit City" : "Add New City"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ paddingTop: "0.5rem" }}>
            <label style={{ marginBottom: "0.25rem" }}>District</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={this.loadDistricts}
              value={selectedDistrict}
              onChange={(selectedDistrict) =>
                this.setState({ selectedDistrict })
              }
              placeholder="Select District"
              className="mb-2"
              styles={tealSelectStyles}
            />

            {this.state.isImportMode ? (
              <>
                <label style={{ marginTop: "0.5rem" }}>Select Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="form-control mb-2"
                  onChange={(e) => this.setState({ importFile: e.target.files[0] })}
                  disabled={!selectedDistrict}
                />
                <small className="text-muted">
                  Excel must have a column named <strong>"City Name"</strong>
                </small>
              </>
            ) : (
              <>
                <label>City Name</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => this.setState({ inputValue: e.target.value })}
                  placeholder="Enter city name"
                  className="form-control"
                />
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="primary"
              onClick={this.handleSave}
              style={{
                backgroundColor: "#36565F",
                borderColor: "#36565F",
              }}
              disabled={
                !selectedDistrict || // district must be selected in both modes
                (this.state.isImportMode ? !this.state.importFile : !this.state.inputValue)
              }
            >
              Save
            </Button>
          </Modal.Footer>

        </Modal>

        {/* Status Confirmation */}
        <Modal show={showUpdateStatus} onHide={this.cancelStatus} centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "1rem", fontWeight: 600 }}>
              Confirm {updateStatus === "Active" ? "Inactivate" : "Activate"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="text-center py-3">
            <p style={{ marginBottom: 0 }}>
              Are you sure you want to{" "}
              <strong>
                {updateStatus === "Active" ? "Inactivate" : "Activate"}
              </strong>{" "}
              this City?
            </p>
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={this.cancelStatus}>
              Cancel
            </Button>

            <Button
              variant={updateStatus === "Active" ? "danger" : "success"}
              onClick={this.handleStatus}
            >
              {updateStatus === "Active" ? "Inactivate" : "Activate"}
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default withRouter(City);
