import React, { Component } from "react";
import api from "../../../lib/api";
import { Card, CardBody, Table, Input, Row, Col, FormGroup, Label } from "reactstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import HistoryModal from "../common/HistoryModal";

class BoostRequests extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            statusFilter: "All",
            searchTerms: {
                candidate_name: "",
                candidate_email: "",
                package_name: "",
                status: "",
            },
            selectedOrder: null,
            showDetailModal: false,
            historyModalOpen: false,
            historyData: [],
            successMessage: "",
            errorMessage: "",
            statusDropdownOpen: false,
        };

        this.tableHeaders = [
            { key: "candidate_name", label: "Candidate" },
            { key: "candidate_email", label: "Email" },
            { key: "package_name", label: "Package" },
            { key: "price", label: "Price" },
            { key: "boost_duration_days", label: "Duration" },
            { key: "start_date", label: "Start" },
            { key: "end_date", label: "End" },
            { key: "status", label: "Status" },
            { key: "action", label: "Action" },
        ];

        this.apibaseurl = process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    componentDidMount() {
        this.fetchOrders();
    }

    fetchOrders = async () => {
        this.setState({ loading: true });
        try {
            const res = await api.get("/candidateProfile/boost/orders");
            this.setState({ orders: res.data.data || [] });
        } catch {
            this.setState({ errorMessage: "Failed to load boost orders." });
            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
        } finally {
            this.setState({ loading: false });
        }
    };

    // getHistory = (accountId) => {
    //     const token = localStorage.getItem("token");
    //     api
    //         .get(`${this.apibaseurl}gethistory/${accountId}/candidate`, {
    //             headers: { Authorization: `Bearer ${token}` },
    //         })
    //         .then((res) => {
    //             // keep only BOOST actions
    //             const boostHistory = (res.data.history || [])
    //                 .filter((item) => item.action?.startsWith("BOOST"))
    //                 .map((item) => {
    //                     if (item.data) {
    //                         const { logo, ...restData } = item.data;
    //                         return { ...item, data: restData };
    //                     }
    //                     return item;
    //                 });

    //             this.setState({ historyData: boostHistory, historyModalOpen: true });
    //         })
    //         .catch(() => {
    //             this.setState({ errorMessage: "Failed to fetch history." });
    //             setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    //         });
    // };
    getHistory = (id) => {
        const accountType = "candidate";
        const apiUrl = `${this.apibaseurl}gethistory/${id}/${accountType}`;
        const token = localStorage.getItem("token");

        api
            .get(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                const filteredHistory = (res.data.history || []).map((item) => {
                    if (item.data) {
                        const { logo, ...restData } = item.data; // ❌ remove logo
                        return { ...item, data: restData };
                    }
                    return item;
                });

                this.setState({
                    historyData: filteredHistory,
                    historyModalOpen: true,
                });
            })
            .catch((err) => {
                console.error("Error fetching history:", err);
                this.setState({ errorMessage: "Failed to fetch history." });
                setTimeout(() => this.setState({ errorMessage: "" }), 3000);
            });
    };

    handleSearchChange = (key, value) => {
        this.setState((prev) => ({
            searchTerms: { ...prev.searchTerms, [key]: value },
        }));
    };

    getFilteredOrders = () => {
        const { orders, statusFilter, searchTerms } = this.state;
        return orders.filter((o) => {
            const matchStatus = statusFilter === "All" || o.status === statusFilter;
            const matchSearch = Object.keys(searchTerms).every((key) => {
                if (!searchTerms[key]) return true;
                return (o[key]?.toString().toLowerCase() || "").includes(searchTerms[key].toLowerCase());
            });
            return matchStatus && matchSearch;
        });
    };

    formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-PK", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    getStatusBadge = (status) => {
        const map = {
            active: { bg: "#d4edda", color: "#155724", border: "#c3e6cb" },
            expired: { bg: "#e2e3e5", color: "#383d41", border: "#d6d8db" },
        };
        const s = map[status] || map.expired;
        return (
            <span style={{
                background: s.bg, color: s.color,
                border: `1px solid ${s.border}`,
                padding: "3px 10px", borderRadius: "12px",
                fontSize: "0.78rem", fontWeight: 600, textTransform: "capitalize",
            }}>
                {status}
            </span>
        );
    };

    render() {
        const {
            statusFilter, searchTerms,
            selectedOrder, showDetailModal,
            historyModalOpen, historyData,
            successMessage, errorMessage, loading,
        } = this.state;

        const filtered = this.getFilteredOrders();

        return (
            <>
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

                <Row className="mb-4 align-items-center">
                    <Col>
                        <h6 className="fw-bold mb-0">Boosted Profiles</h6>
                    </Col>
                    <Col className="text-end">
                        <FormGroup className="d-inline-block mb-0">
                            <Label className="me-2 mb-0">Status:</Label>
                            <div style={{ position: "relative", display: "inline-block", minWidth: "150px", textAlign: "left" }}>
                                <button
                                    type="button"
                                    className="custom-dropdown-btn"
                                    style={{
                                        display: "inline-block",
                                        width: "100%",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        borderColor: "#36565f",
                                        color: "#36565f",
                                        boxShadow: "none",
                                        outline: "none",
                                        background: "#fff",
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2336565f' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 8px center",
                                        paddingRight: "28px",
                                        paddingLeft: "12px",
                                        paddingTop: "6px",
                                        paddingBottom: "6px",
                                        border: "1px solid #36565f",
                                        borderRadius: "6px",
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                    }}
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            statusDropdownOpen: !prev.statusDropdownOpen,
                                        }))
                                    }
                                >
                                    {statusFilter === "All" ? "All" : statusFilter === "active" ? "Active" : "Expired"}
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
                                            textAlign: "left",
                                        }}
                                    >
                                        {[
                                            { label: "All", value: "All" },
                                            { label: "Active", value: "active" },
                                            { label: "Expired", value: "expired" },
                                        ].map((opt) => (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    this.setState({ statusFilter: opt.value, statusDropdownOpen: false });
                                                }}
                                                style={{
                                                    padding: "8px 12px",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    backgroundColor: statusFilter === opt.value ? "#36565F" : "#fff",
                                                    color: statusFilter === opt.value ? "#fff" : "#000",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (statusFilter !== opt.value)
                                                        e.currentTarget.style.backgroundColor = "#e8eef0";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (statusFilter !== opt.value)
                                                        e.currentTarget.style.backgroundColor = "#fff";
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FormGroup>
                    </Col>
                </Row>

                <Card>
                    <CardBody>
                        {loading ? (
                            <div className="d-flex align-items-center justify-content-center py-5 gap-2">
                                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                <span className="text-muted">Loading orders...</span>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table table-striped text-center align-middle">
                                    <thead className="table-light text-center align-middle">
                                        <tr>
                                            {this.tableHeaders.map((h) => (
                                                <th key={h.key}>
                                                    <div style={{ minWidth: "110px" }}>
                                                        <span>{h.label}</span>
                                                        {h.key !== "action" && (
                                                            <Input
                                                                type="text"
                                                                placeholder="Search"
                                                                value={searchTerms[h.key] || ""}
                                                                onChange={(e) => this.handleSearchChange(h.key, e.target.value)}
                                                                style={{
                                                                    width: "100%", fontSize: "0.85rem",
                                                                    height: "30px", padding: "4px 6px",
                                                                    borderRadius: "6px", border: "1px solid #ced4da",
                                                                    marginTop: "4px",
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length > 0 ? filtered.map((o) => (
                                            <tr key={o.id}>
                                                <td className="fw-semibold">{o.candidate_name || "—"}</td>
                                                <td>
                                                    <a href={`mailto:${o.candidate_email}`} style={{ color: "#264752" }}>
                                                        {o.candidate_email || "—"}
                                                    </a>
                                                </td>
                                                <td>{o.package_name || "—"}</td>
                                                <td>{o.currency} {o.price}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark border">
                                                        {o.boost_duration_days} days
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: "0.85rem" }}>{this.formatDate(o.start_date)}</td>
                                                <td style={{ fontSize: "0.85rem" }}>{this.formatDate(o.end_date)}</td>
                                                <td>{this.getStatusBadge(o.status)}</td>
                                                <td>
                                                    <div className="d-flex justify-content-center align-items-center gap-3">
                                                        {/* View detail */}
                                                        <button
                                                            className="icon-btn"
                                                            title="View Details"
                                                            onClick={() => this.setState({ selectedOrder: o, showDetailModal: true })}
                                                        >
                                                            <i className="bi bi-eye" style={{ color: "#36565F" }}></i>
                                                        </button>

                                                        <button
                                                            className="icon-btn"
                                                            title="View History"
                                                            onClick={() => this.getHistory(o.account_id)}
                                                        >
                                                            <i className="bi bi-clock-history text-dark"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={this.tableHeaders.length} className="text-center py-4 text-muted">
                                                    No orders found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Detail Modal */}
                {showDetailModal && selectedOrder && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "16px", overflowY: "auto", boxSizing: "border-box",
                    }}>
                        <div style={{
                            background: "#fff", borderRadius: "12px", padding: "24px",
                            width: "100%", maxWidth: "560px", position: "relative",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                            maxHeight: "90vh", overflowY: "auto", margin: "auto",
                        }}>
                            <button
                                onClick={() => this.setState({ showDetailModal: false, selectedOrder: null })}
                                style={{
                                    position: "absolute", top: "16px", right: "16px",
                                    background: "none", border: "none", fontSize: "1.3rem",
                                    cursor: "pointer", color: "#888",
                                }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                            <h5 className="fw-bold mb-4" style={{ color: "#264752" }}>
                                <i className="bi bi-rocket-takeoff me-2"></i>
                                Boost Order Details
                            </h5>

                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                {[
                                    { label: "Candidate", value: selectedOrder.candidate_name },
                                    { label: "Email", value: <a href={`mailto:${selectedOrder.candidate_email}`} style={{ color: "#264752" }}>{selectedOrder.candidate_email}</a> },
                                    { label: "Package", value: selectedOrder.package_name },
                                    { label: "Price", value: `${selectedOrder.currency} ${selectedOrder.price}` },
                                    { label: "Duration", value: `${selectedOrder.boost_duration_days} days` },
                                    { label: "Start Date", value: this.formatDate(selectedOrder.start_date) },
                                    { label: "End Date", value: this.formatDate(selectedOrder.end_date) },
                                    { label: "Ordered At", value: this.formatDate(selectedOrder.created_at) },
                                    { label: "Status", value: this.getStatusBadge(selectedOrder.status) },
                                ].map((row, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                                        <td style={{ padding: "10px 12px", color: "#888", width: "110px", fontWeight: 500, fontSize: "0.88rem" }}>{row.label}</td>
                                        <td style={{ padding: "10px 12px", color: "#333", fontSize: "0.9rem" }}>{row.value || "—"}</td>
                                    </tr>
                                ))}
                            </table>

                            <div className="d-flex justify-content-end mt-3">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => this.setState({ showDetailModal: false, selectedOrder: null })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal — reusing your existing component */}
                <HistoryModal
                    isOpen={historyModalOpen}
                    toggle={() => this.setState({ historyModalOpen: false })}
                    historyData={historyData}
                />
            </>
        );
    }
}

export default BoostRequests;