import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
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
      history: [],
      currentPage: 1,
      totalDegreeFileds: 0,
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

  componentDidMount() {
    this.fetchDegreeFields();
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
    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}editDegreeField/${editId}`, {
          name: inputValue,
        });
        this.setState((prevState) => ({
          degreeFieldData: prevState.degreeFieldData.map((item) =>
            item.id === editId ? { ...item, name: inputValue } : item
          ),
        }));
      } else {
        await api.post(`${this.apiBaseUrl}adddegreefield`, { name: inputValue });
        this.fetchDegreeFields(1);
      }
      this.setState({ showModal: false, inputValue: "", editId: null });
    } catch (error) {
      console.error("Error saving Currency:", error);
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
            <div className="Degree-header-section">
              <p
                className="breadcrumb-text"
                title="History"
                breadcrumbItem="Activity Log"
              />

              <div className="d-flex justify-content-end my-2">
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-Degree-btn"
                >
                  Add New Degree field
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
                  onChange={this.onStatusChange}
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
              <label style={{ marginBottom: "0.25rem" }}>Name</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                placeholder="Enter Degree Field"
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
