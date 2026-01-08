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
import AsyncSelect from "react-select/async";

class Packages extends Component {
    constructor(props) {
        super(props);
        this.state = {
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

            deleteId: null,
            deleteStatus: null,
            showDeleteConfirm: false,
            showHistoryModal: false,
            history: [],
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
        status = this.state.isActive
    ) => {
        try {
            const response = await axios.get(`${this.apiBaseUrl}packages/getallpackages`, {
                params: { page, limit: this.itemsPerPage, status },
            });
            this.setState({
                packages: response.data.packages || [],
                totalPackages: response.data.total || 0,
            });
        } catch (error) {
            console.error("Error fetching packages:", error);
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
                params: { entity_type: "package", entity_id: id },
            });
            console.log("console",res.data)
            this.setState({ history: res.data || [] });
        } catch (error) {
            console.error("Error fetching history:", error);
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
    handleCurrencyChange = (selectedCurrency) => {
        console.log(selectedCurrency)
        this.setState({
            selectedCurrency,
            errors: { ...this.state.errors, currency: "" },
        });
    };


    loadCurrencies = async (inputValue) => {
        try {
            const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
                params: { search: inputValue || "", page: 1, limit: 15, status: 'active' },
            });
            return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    validateForm = () => {
        const { FormData, selectedCurrency } = this.state;
        let errors = {};

        if (!FormData.duration) errors.duration = "Duration is required";
        if (!FormData.package) errors.package = "Package is required";
        if (!FormData.amount) errors.amount = "Amount is required";
        if (!selectedCurrency) errors.currency = "Currency is required";

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };


    toggleForm = (item = null) => {
        console.log(item)
        if (item) {
            this.setState({
                showModal: true,
                editId: item.id,
                FormData: {
                    duration: item.duration_value,
                    package: item.duration_unit,
                    amount: item.price,
                },
                selectedCurrency: {
                    label: item.currency,
                    value: item.currency_id,
                },
            });
        } else {
            this.setState({
                showModal: true,
                editId: null,
                FormData: { duration: "", package: "", amount: "" },
                selectedCurrency: null,
                errors: {},
            });
        }
    };


    toggleHistory = (item = null) => {
        if (item) this.fetchHistory(item.id);
        this.setState({ showHistoryModal: true });
    };

    handleSubmit = async (e) => {
        e.preventDefault();

        if (!this.validateForm()) return;

        const { editId, FormData, selectedCurrency } = this.state;

        const payload = {
            duration_value: FormData.duration,
            duration_unit: FormData.package,
            price: FormData.amount,
            currency_id: selectedCurrency.value,
        };

        try {
            if (editId) {
                await api.put(`${this.apiBaseUrl}packages/${editId}`, payload);
                toast.success("Package updated successfully");
            } else {
                await api.post(`${this.apiBaseUrl}packages/`, payload);
                toast.success("Package added successfully");
            }

            this.fetchPackages(1);

            this.setState({
                showModal: false,
                editId: null,
                FormData: { duration: "", package: "", amount: "" },
                selectedCurrency: null,
                errors: {},
            });
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
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
            await api.delete(`${this.apiBaseUrl}packages/deletepackage/${deleteId}`);
            toast.success(
                isActive === "active"
                    ? "Inactivated successfully"
                    : "Activated successfully"
            );
            this.setState({ showDeleteConfirm: false }, this.fetchPackages);
        } catch (error) {
            console.error("Error deleting packages:", error);
        }
    };

    cancelDelete = () => {
        this.setState({ showDeleteConfirm: false, deleteId: null });
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
        ["price", "duration_unit", "duration_value", "currency", "status", "created_at", "updated_at"].forEach((id) => {
            const ele = document.getElementById(id);
            if (ele) ele.value = "";
        });
    };

    handlePageChange = (page) => {
        this.setState({ currentPage: page });
    };

    render() {
        const {
            packages,
            showModal,
            inputValue,
            showDeleteConfirm,
            showHistoryModal,
            history,
            currentPage,
            totalPackages,
            deleteStatus,
            isActive,
            editId,
            successMessage,
            errors,
            selectedCurrency,
            FormData,
        } = this.state;
        const totalPages = Math.ceil(totalPackages / this.itemsPerPage);

        return (
            <React.Fragment>
                <MetaTags>
                    <title>Packages | List</title>
                </MetaTags>
                <h6 className="fw-bold mb-3">Packages List</h6>
                <div className="poppins-font">
                    <Container fluid>
                        <div className="country-header-section">
                            <p
                                className="breadcrumb-text"
                                title="History"
                                breadcrumbItem="Activity Log"
                            />

                            <div className="d-flex justify-content-end my-2">
                                <Button
                                    variant="dark"
                                    onClick={() => this.toggleForm()}
                                    className="add-country-btn"
                                >
                                    Add New Package
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
                                                            type="number"
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
                                                <tr key={item.id}>
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
                        size="lg"
                    >
                        <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
                            <Modal.Title style={{ fontSize: "1rem", marginBottom: "0" }}>
                                {editId ? "Edit Package" : "Add New Package"}
                            </Modal.Title>
                        </Modal.Header>

                        <Modal.Body style={{ paddingTop: "0.5rem" }}>
                            <form className="default-form" onSubmit={this.handleSubmit}>
                                {successMessage && (
                                    <div className="alert alert-info">{successMessage}</div>
                                )}

                                <div className="row">
                                    {/* Duration */}
                                    <div className="form-group col-lg-3 col-md-6">
                                        <label>
                                            Duration <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={FormData.duration}
                                            className={`form-control ${errors.duration ? "is-invalid" : ""}`}
                                            onChange={this.handleInputChange}
                                        />
                                        {errors.duration && (
                                            <div className="text-danger">{errors.duration}</div>
                                        )}
                                    </div>

                                    {/* Package */}
                                    <div className="form-group col-lg-3 col-md-6">
                                        <label>
                                            Package <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            name="package"
                                            value={FormData.package}
                                            onChange={this.handleInputChange}
                                            className={`form-select ${errors.package ? "is-invalid" : ""}`}
                                        >
                                            <option value="">Select</option>
                                            <option>Hours</option>
                                            <option>Days</option>
                                            <option>Weeks</option>
                                            <option>Months</option>
                                            <option>Years</option>
                                        </select>
                                        {errors.package && (
                                            <div className="text-danger">{errors.package}</div>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="form-group col-lg-3 col-md-6">
                                        <label>
                                            Amount <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={FormData.amount}
                                            className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                                            onChange={this.handleInputChange}
                                        />
                                        {errors.amount && (
                                            <div className="text-danger">{errors.amount}</div>
                                        )}
                                    </div>

                                    {/* Currency */}
                                    <div className="form-group col-lg-3 col-md-6">
                                        <label>
                                            Currency <span className="text-danger">*</span>
                                        </label>
                                        <div className="form-control p-0">
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={this.loadCurrencies}
                                                value={selectedCurrency}
                                                onChange={this.handleCurrencyChange}
                                                placeholder="Select Currency"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        {errors.currency && (
                                            <div className="text-danger">{errors.currency}</div>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <div className="form-group col-lg-12 mt-3 text-end">
                                        <Button variant="secondary" onClick={() => this.setState({ showModal: false })}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="success" className="ms-2">
                                            {editId ? "Update" : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Modal.Body>
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
                                this Country?
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
                                    <strong> 
                                        Price : {item.data.price},Duration {item.data.duration_value}
                                        {item.data.duration_unit}
                                        
                                        </strong> was{" "}
                                    
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

export default Packages;