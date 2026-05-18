// "use client";
import React, { Component } from "react";
import api from "../lib/api";
import Head from "next/head";
import {
    Card,
    CardBody,
    Table,
    Input,
    Row,
    Col,
    FormGroup,
    Label,
} from "reactstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

class ContactMessages extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            statusFilter: "All",
            searchTerms: {
                name: "",
                email: "",
                user_type: "",
                subject: "",
                status: "",
            },
            selectedMessage: null,
            showDetailModal: false,
            successMessage: "",
            errorMessage: "",
            currentPage: 1,
            pageSize: 20,
        };

        this.tableHeaders = [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "user_type", label: "Role" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Date" },
            { key: "action", label: "Action" },
        ];

        this.apibaseurl = process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    componentDidMount() {
        this.fetchMessages();
    }

    fetchMessages = () => {
        const token = sessionStorage.getItem("token");
        api
            .get(`${this.apibaseurl}contact/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                if (res.data.success) {
                    this.setState({ messages: res.data.data });
                }
            })
            .catch((err) => {
                console.error("Fetch messages error:", err);
                this.setState({ errorMessage: "Failed to load messages." });
                setTimeout(() => this.setState({ errorMessage: "" }), 3000);
            });
    };

    updateStatus = (id, status) => {
        const token = sessionStorage.getItem("token");
        api
            .patch(
                `${this.apibaseurl}contact/messages/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
                if (res.data.success) {
                    this.setState((prevState) => ({
                        messages: prevState.messages.map((msg) =>
                            msg.id === id ? { ...msg, status } : msg
                        ),
                        successMessage: `Message marked as "${status}" successfully!`,
                    }));
                    setTimeout(() => this.setState({ successMessage: "" }), 3000);
                }
            })
            .catch(() => {
                this.setState({ errorMessage: "Failed to update status." });
                setTimeout(() => this.setState({ errorMessage: "" }), 3000);
            });
    };

    handleSearchChange = (key, value) => {
        this.setState((prevState) => ({
            searchTerms: { ...prevState.searchTerms, [key]: value },
        }));
    };

    getFilteredMessages = () => {
        const { messages, statusFilter, searchTerms } = this.state;
        return messages.filter((msg) => {
            const matchStatus = statusFilter === "All" || msg.status === statusFilter;
            const matchSearch = Object.keys(searchTerms).every((key) => {
                if (!searchTerms[key]) return true;
                const val = msg[key]?.toString().toLowerCase() || "";
                return val.includes(searchTerms[key].toLowerCase());
            });
            return matchStatus && matchSearch;
        });
    };

    getStatusBadge = (status) => {
        const styles = {
            unread: { background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" },
            read: { background: "#d1ecf1", color: "#0c5460", border: "1px solid #bee5eb" },
            replied: { background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" },
        };
        const style = styles[status] || {};
        return (
            <span style={{
                ...style,
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "capitalize",
            }}>
                {status}
            </span>
        );
    };

    formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-PK", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    render() {
        const {
            statusFilter,
            searchTerms,
            selectedMessage,
            showDetailModal,
            successMessage,
            errorMessage,
        } = this.state;

        const filteredMessages = this.getFilteredMessages();

        return (
            <>
                <Head>
                    <title>Contact Messages</title>
                </Head>

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

                {/* Header + Status Filter */}
                <Row className="mb-4 align-items-center">
                    <Col>
                        <h6 className="fw-bold mb-3">Contact Messages</h6>
                    </Col>
                    <Col className="text-end">
                        <FormGroup className="d-inline-block mb-0">
                            <Label className="me-2">Status:</Label>
                            <Input
                                type="select"
                                value={statusFilter}
                                onChange={(e) => this.setState({ statusFilter: e.target.value })}
                                style={{ display: "inline-block", width: "auto" }}
                            >
                                <option value="All">All</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>

                {/* Table */}
                <Card>
                    <CardBody>
                        <div className="table-responsive">
                            <Table className="table table-striped custom-table text-center align-middle">
                                <thead className="table-light text-center align-middle">
                                    <tr>
                                        {this.tableHeaders.map((header) => (
                                            <th key={header.key}>
                                                <div style={{ minWidth: "120px", verticalAlign: "middle" }}>
                                                    <span>{header.label}</span>
                                                    {header.key !== "action" && header.key !== "created_at" && (
                                                        <Input
                                                            type="text"
                                                            placeholder={`Search ${header.label}`}
                                                            value={searchTerms[header.key] || ""}
                                                            onChange={(e) =>
                                                                this.handleSearchChange(header.key, e.target.value)
                                                            }
                                                            className="mb-2"
                                                            style={{
                                                                width: "100%",
                                                                fontSize: "0.85rem",
                                                                height: "30px",
                                                                padding: "4px 6px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #ced4da",
                                                                boxSizing: "border-box",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMessages.length > 0 ? (
                                        filteredMessages.map((msg) => (
                                            <tr key={msg.id} style={{ fontWeight: msg.status === "unread" ? "600" : "normal" }}>
                                                {this.tableHeaders.map((header) => {
                                                    if (header.key === "action") {
                                                        return (
                                                            <td key={header.key} className="text-center">
                                                                <div className="d-flex justify-content-center align-items-center gap-3">

                                                                    {/* View */}
                                                                    <button
                                                                        className="icon-btn"
                                                                        title="View Message"
                                                                        onClick={() => this.setState({
                                                                            selectedMessage: msg,
                                                                            showDetailModal: true,
                                                                        }, () => {
                                                                            if (msg.status === "unread") {
                                                                                this.updateStatus(msg.id, "read");
                                                                            }
                                                                        })}
                                                                    >
                                                                        <i className="bi bi-eye text-primary"></i>
                                                                    </button>

                                                                    {/* Mark Replied */}
                                                                    {msg.status !== "replied" && (
                                                                        <button
                                                                            className="icon-btn"
                                                                            title="Mark as Replied"
                                                                            onClick={() => this.updateStatus(msg.id, "replied")}
                                                                        >
                                                                            <i className="bi bi-reply text-success"></i>
                                                                        </button>
                                                                    )}

                                                                    {/* Reply Email */}
                                                                    <a
                                                                        href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                                                                        className="icon-btn"
                                                                        title="Reply via Email"
                                                                        onClick={() => {
                                                                            if (msg.status !== "replied") {
                                                                                this.updateStatus(msg.id, "replied");
                                                                            }
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-envelope text-warning"></i>
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    if (header.key === "status") {
                                                        return (
                                                            <td key={header.key} className="text-center">
                                                                {this.getStatusBadge(msg.status)}
                                                            </td>
                                                        );
                                                    }

                                                    if (header.key === "created_at") {
                                                        return (
                                                            <td key={header.key} style={{ fontSize: "0.82rem" }}>
                                                                {this.formatDate(msg.created_at)}
                                                            </td>
                                                        );
                                                    }

                                                    if (header.key === "email") {
                                                        return (
                                                            <td key={header.key}>
                                                                <a href={`mailto:${msg.email}`} style={{ color: "#264752" }}>
                                                                    {msg.email || "-"}
                                                                </a>
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td key={header.key} style={{ textTransform: header.key === "user_type" ? "capitalize" : "none" }}>
                                                            {msg[header.key] || "-"}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={this.tableHeaders.length} className="text-center py-4">
                                                No messages found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>

                {/* Detail Modal */}
                {showDetailModal && selectedMessage && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <div style={{
                            background: "#fff", borderRadius: "12px", padding: "32px",
                            minWidth: "500px", maxWidth: "620px", width: "90%",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.2)", position: "relative"
                        }}>
                            <button
                                onClick={() => this.setState({ showDetailModal: false, selectedMessage: null })}
                                style={{
                                    position: "absolute", top: "16px", right: "16px",
                                    background: "none", border: "none", fontSize: "1.3rem",
                                    cursor: "pointer", color: "#888"
                                }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                            <h5 className="fw-bold mb-4" style={{ color: "#264752" }}>
                                <i className="bi bi-envelope-open me-2"></i>
                                Message Details
                            </h5>

                            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                                {[
                                    { label: "From", value: selectedMessage.name },
                                    { label: "Email", value: <a href={`mailto:${selectedMessage.email}`} style={{ color: "#264752" }}>{selectedMessage.email}</a> },
                                    { label: "Role", value: selectedMessage.user_type },
                                    { label: "Subject", value: selectedMessage.subject },
                                    { label: "Date", value: this.formatDate(selectedMessage.created_at) },
                                    { label: "Status", value: this.getStatusBadge(selectedMessage.status) },
                                ].map((row, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                                        <td style={{ padding: "10px 12px", color: "#888", width: "100px", fontWeight: 500 }}>{row.label}</td>
                                        <td style={{ padding: "10px 12px", color: "#333" }}>{row.value || "-"}</td>
                                    </tr>
                                ))}
                            </table>

                            <div style={{ marginTop: "16px" }}>
                                <p style={{ color: "#888", marginBottom: "8px", fontWeight: 500 }}>Message</p>
                                <div style={{
                                    background: "#f4f8f9", borderLeft: "4px solid #264752",
                                    padding: "16px", borderRadius: "6px", color: "#333",
                                    lineHeight: "1.7", whiteSpace: "pre-wrap"
                                }}>
                                    {selectedMessage.message}
                                </div>
                            </div>

                            <div className="d-flex gap-2 mt-4 justify-content-end">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="btn btn-sm"
                                    style={{ backgroundColor: "#264752", color: "#fff", borderRadius: "8px" }}
                                    onClick={() => this.updateStatus(selectedMessage.id, "replied")}
                                >
                                    <i className="bi bi-reply me-1"></i> Reply via Email
                                </a>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => this.setState({ showDetailModal: false, selectedMessage: null })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }
}

export default ContactMessages;
