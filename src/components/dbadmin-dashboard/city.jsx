import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import Head from "next/head";
import AsyncSelect from "react-select/async";

import {
  Card,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
} from "react-bootstrap";

class City extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cities: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteStatus: null,
      deleteId: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      history: [],
      currentPage: 1,
      totalCities: 0,
      isActive: "all",
      selectedDistrict: null,
      postalcode: "",
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
          status: "active",
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
        postalcode: item.postalcode || "",
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
        postalcode: "",
        selectedDistrict: null,
        showModal: true,
      });
    }
  };

  toggleHistory = async (item = null) => {
    if (!item) return;
    await this.fetchHistory(item.id);
    this.setState({ showHistoryModal: true });
  };

  handleSave = async () => {
    const { editId, inputValue, selectedDistrict, postalcode } = this.state;

    if (!selectedDistrict) {
      alert("Please select a district.");
      return;
    }

    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}editCity/${editId}`, {
          name: inputValue,
          district_id: selectedDistrict.value,
          postalcode,
        });
        this.fetchCities(); // refresh list
      } else {
        await api.post(`${this.apiBaseUrl}addcities`, {
          name: inputValue,
          district_id: selectedDistrict.value,
          postalcode,
        });
        this.fetchCities(1); // go to first page
      }

      this.setState({
        showModal: false,
        inputValue: "",
        postalcode: "",
        selectedDistrict: null,
        editId: null,
      });
    } catch (error) {
      console.error("Error saving city:", error.response?.data || error);
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
      await api.delete(`${this.apiBaseUrl}deleteCity/${deleteId}`);
      toast.success(
        isActive === "active"
          ? "Inactivated successfully"
          : "Activated successfully"
      );
      this.setState({ showDeleteConfirm: false }, this.fetchCities);
    } catch (error) {
      console.error("Error deleting city:", error);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    const { isActive } = this.state;

    // reset other search fields
    [
      "city_name",
      "district_name",
      "country_name",
      "created_at",
      "updated_at",
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

  render() {
    const {
      cities,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      currentPage,
      totalCities,
      isActive,
      history,
      editId,
      deleteStatus,
      selectedDistrict,
    } = this.state;
    const totalPages = Math.ceil(totalCities / this.itemsPerPage);

    return (
      <React.Fragment>
        <Head>
          <title>City | List</title>
        </Head>
        <h6 className="fw-bold mb-3">City List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="district-header-section">
              <p
                className="breadcrumb-text"
                title="History"
                breadcrumbItem="Activity Log"
              />

              <div className="d-flex justify-content-end my-2">
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-district-btn"
                >
                  Add New City
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
                              City
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
                              District
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
                              Country
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
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.district_name}</td>
                          <td>{item.country_name}</td>
                          <td>{this.formatDate(item.created_at)}</td>
                          <td>{this.formatDate(item.updated_at)}</td>
                          <td>{item.status}</td>
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
            />

            <label>City Name</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => this.setState({ inputValue: e.target.value })}
              placeholder="Enter city name"
              className="form-control"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={this.handleSave}
              disabled={!inputValue || !selectedDistrict}
            >
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
              this City?
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
            {(Array.isArray(history) ? history : []).map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-2 mb-2 rounded"
                style={{
                  backgroundColor: idx % 2 === 0 ? "#f8f9fa" : "#e9ecef",
                  border: "1px solid #dee2e6",
                  fontSize: "14px",
                }}
              >
                <strong>{item.data.name}</strong> was{" "}
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
                by{" "}
                <em>
                  <strong>{item.changed_by_name}</strong>
                </em>{" "}
                on {this.formatDate(item.changed_at)}
              </div>
            ))}
          </Modal.Body>
        </Modal>
      </React.Fragment>
    );
  }
}

export default City;
