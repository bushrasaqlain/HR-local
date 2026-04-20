"use client";
import React, { Component } from "react";
import axios from "axios";
import { Container } from "reactstrap";
import { Helmet } from "react-helmet";
import Payment from "./payment.jsx";   // ← apna path adjust karo

const CHECK_COLORS = {
    Hours: { bg: "#E6F1FB", stroke: "#185FA5", badge: "#E6F1FB", badgeText: "#0C447C" },
    Days: { bg: "#EEEDFE", stroke: "#534AB7", badge: "#EEEDFE", badgeText: "#3C3489" },
    Months: { bg: "#E1F5EE", stroke: "#0F6E56", badge: "#E1F5EE", badgeText: "#085041" },
    Years: { bg: "#FAEEDA", stroke: "#854F0B", badge: "#FAEEDA", badgeText: "#633806" },
};
const DEFAULT_COLOR = {
    bg: "#F1EFE8", stroke: "#5F5E5A", badge: "#F1EFE8", badgeText: "#2C2C2A",
};

const CheckIcon = ({ color }) => (
    <span style={{
        width: 18, height: 18, borderRadius: "50%", background: color.bg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
    }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
            stroke={color.stroke} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,5 4,7 8,3" />
        </svg>
    </span>
);

class CompanyPricingPage extends Component {
    constructor(props) {
        super(props);
        this.APIBASEURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        this.state = {
            packages: [],
            loading: true,
            errorMessage: "",
            successMessage: "",
            // Payment modal
            showPayment: false,
            selectedPackage: null,
        };
    }

    componentDidMount() {
       
        setTimeout(() => {
            const accountType = sessionStorage.getItem("accountType");
            // const has_package = sessionStorage.getItem("has_package");

            console.log("accountType:", accountType);
            // console.log("has_package:", has_package);

            if (!accountType) {
                window.location.href = "/";
                return;
            }

            // if (has_package === "true") {
            //     window.location.href = "/dashboard-header";
            //     return;
            // }

            this.loadPackages();
        }, 100); 
    }

    loadPackages = async () => {
        try {
            const res = await axios.get(
                `${this.APIBASEURL}packages/getallpackages`,
                { params: { status: "Active", package_type: "registration" } }
            );
            this.setState({ packages: res.data.packages || [], loading: false });
        } catch {
            this.setState({
                loading: false,
                errorMessage: "Failed to load packages. Please refresh.",
            });
        }
    };

    // ✅ Package card click → payment modal open
    handleSelectPackage = (pkg) => {
        this.setState({ selectedPackage: pkg, showPayment: true });
    };

    // ✅ Payment.jsx se success callback
    handlePaymentSuccess = () => {
        // has_package session update
        // sessionStorage.setItem("has_package", "true");

        this.setState({
            showPayment: false,
            selectedPackage: null,
            successMessage: "Payment successful! Redirecting to dashboard...",
        });

        setTimeout(() => {
            window.location.href = "/dashboard-header";
        }, 1500);
    };

    parseFeatures = (description) => {
        if (!description) return [];
        return description.split("\n").map((l) => l.trim()).filter(Boolean);
    };

    isFeatured = (pkg) => pkg.is_featured === 1;

    render() {
        const {
            packages, loading,
            errorMessage, successMessage,
            showPayment, selectedPackage,
        } = this.state;

        return (
            <>
                <Helmet><title>Choose a Package</title></Helmet>

                <Container className="pb-5" style={{ marginTop: "80px" }}>

                    {/* Header */}
                    <div style={{ textAlign: "center", padding: "3rem 0 2.5rem" }}>
                        <h2 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
                            Activate Your Employer Account
                        </h2>
                        <p style={{ fontSize: 15, color: "#888", margin: 0 }}>
                            Choose a package to start posting jobs and finding candidates
                        </p>
                    </div>

                    {/* Alerts */}
                    {errorMessage && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center">
                            <span>{errorMessage}</span>
                            <button
                                className="btn-close"
                                onClick={() => this.setState({ errorMessage: "" })}
                            />
                        </div>
                    )}
                    {successMessage && (
                        <div className="alert alert-success">{successMessage}</div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <p style={{ textAlign: "center", color: "#888" }}>
                            Loading packages...
                        </p>
                    )}

                    {/* Package Cards */}
                    {!loading && packages.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                        }}>
                            {packages.map((pkg) => {
                                const features = this.parseFeatures(pkg.description);
                                const color = CHECK_COLORS[pkg.duration_unit] || DEFAULT_COLOR;
                                const featured = this.isFeatured(pkg);

                                return (
                                    <div
                                        key={pkg.id}
                                        style={{
                                            background: "#fff",
                                            border: featured
                                                ? "2px solid #378ADD"
                                                : "1px solid rgba(0,0,0,0.1)",
                                            borderRadius: 12,
                                            padding: "1.5rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            transition: "box-shadow 0.2s",
                                        }}
                                        onMouseEnter={(e) =>
                                        (e.currentTarget.style.boxShadow =
                                            "0 4px 20px rgba(0,0,0,0.08)")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.boxShadow = "none")
                                        }
                                    >
                                        {/* Badge */}
                                        <span style={{
                                            display: "inline-block", fontSize: 11, fontWeight: 500,
                                            padding: "3px 10px", borderRadius: 20, marginBottom: 12,
                                            background: featured ? "#378ADD" : color.badge,
                                            color: featured ? "#E6F1FB" : color.badgeText,
                                            width: "fit-content",
                                        }}>
                                            {featured ? "Most popular" : `${pkg.duration_unit || "One-time"} plan`}
                                        </span>

                                        {/* Duration */}
                                        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                                            {pkg.duration_value
                                                ? `${pkg.duration_value} ${pkg.duration_unit}`
                                                : pkg.name || "Registration"}
                                        </p>
                                        <p style={{ fontSize: 12, color: "#888", marginBottom: "1.25rem" }}>
                                            Full access to employer dashboard
                                        </p>

                                        {/* Price */}
                                        <div style={{
                                            display: "flex", alignItems: "baseline",
                                            gap: 4, marginBottom: 4,
                                        }}>
                                            <span style={{ fontSize: 14, color: "#888" }}>
                                                {pkg.currency}
                                            </span>
                                            <span style={{
                                                fontSize: 32, fontWeight: 500,
                                                lineHeight: 1, color: "#111",
                                            }}>
                                                {Number(pkg.price).toLocaleString()}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#888", marginBottom: "1.25rem" }}>
                                            one-time payment
                                        </p>

                                        <hr style={{
                                            border: "none",
                                            borderTop: "1px solid rgba(0,0,0,0.08)",
                                            margin: "0 0 1.25rem",
                                        }} />

                                        {/* Features */}
                                        {features.length > 0 ? (
                                            <ul style={{
                                                listStyle: "none", padding: 0, display: "flex",
                                                flexDirection: "column", gap: 10, flex: 1,
                                                marginBottom: "1.5rem",
                                            }}>
                                                {features.map((f, i) => (
                                                    <li key={i} style={{
                                                        display: "flex", alignItems: "flex-start",
                                                        gap: 8, fontSize: 13, color: "#555", lineHeight: 1.4,
                                                    }}>
                                                        <CheckIcon color={color} />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{ flex: 1 }} />
                                        )}

                                        {/* Button */}
                                        <button
                                            onClick={() => this.handleSelectPackage(pkg)}
                                            style={{
                                                width: "100%", padding: "0.65rem 1rem",
                                                borderRadius: 8, fontSize: 14, fontWeight: 500,
                                                cursor: "pointer",
                                                border: featured ? "none" : "1px solid rgba(0,0,0,0.15)",
                                                background: featured ? "#378ADD" : "transparent",
                                                color: featured ? "#fff" : "#111",
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                        >
                                            Select Plan
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && packages.length === 0 && (
                        <p style={{ textAlign: "center", color: "#888" }}>
                            No packages available. Please contact support.
                        </p>
                    )}

                </Container>

                {/* ✅ Payment Modal - isRegistration=true flag */}
                {selectedPackage && (
                    <Payment
                        isOpen={showPayment}
                        toggle={() => this.setState({ showPayment: false, selectedPackage: null })}
                        packageId={selectedPackage?.id}
                        jobId={null}
                        amount={selectedPackage?.price}
                        currency={selectedPackage?.currency}
                        isRegistration={true}
                        onPaymentSuccess={this.handlePaymentSuccess}
                    />
                )}
            </>
        );
    }
}

export default CompanyPricingPage;