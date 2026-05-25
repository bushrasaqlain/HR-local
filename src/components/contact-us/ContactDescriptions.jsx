// "use client";
import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import {
    FaEnvelope,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaHeadset,
    FaUserTie,
    FaTools,
    FaPaperPlane,
} from "react-icons/fa";
import { motion } from "framer-motion";

const TEAL = "#264752";

const ContactDescriptions = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        userType: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const accountType = sessionStorage.getItem("accountType") || "";
        const displayName = sessionStorage.getItem("displayName") || "";
        const userEmail = sessionStorage.getItem("userEmail") || "";

        setFormData((prev) => ({
            ...prev,
            userType: accountType,
            name: displayName,
            email: userEmail,
        }));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = sessionStorage.getItem("token");
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            const res = await fetch(`${apiBaseUrl}contact/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                setSubmitted(true);
                setFormData((prev) => ({ ...prev, subject: "", message: "" }));
            } else {
                setError(data.error || "Something went wrong. Please try again.");
            }
        } catch (err) {
            setError("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Label for display
    const userTypeLabel = {
        candidate: "Candidate",
        employer: "Employer",
        db_admin: "DB Admin",
        reg_admin: "Reg Admin",
    }[formData.userType] || formData.userType;

    return (
        <>
            {/* HERO SECTION */}
            <div className="contact-hero d-flex align-items-center justify-content-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-white"
                >
                    <h1 className="fw-bold text-white">Contact Us</h1>
                    <p className="hero-tagline">We're Here to Help You</p>
                </motion.div>
            </div>

            <Container className="mt-5 mb-5" style={{ paddingBottom: "80px" }}>

                {/* TOP CENTER HEADING */}
                <motion.div
                    className="text-center mb-5"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <p className="fw-semibold mb-2"
                        style={{ letterSpacing: "2px", textTransform: "uppercase", color: TEAL, fontSize: "0.85rem" }}>
                        Contact Us
                    </p>
                    <h2 className="fw-bold mb-3" style={{ fontSize: "2.2rem", lineHeight: "1.3", color: TEAL }}>
                        Questions? We'd Love to Hear From You.
                    </h2>
                    <p className="text-muted mx-auto" style={{ maxWidth: "520px" }}>
                        Drop us a line below and a real person will get back to you.
                    </p>
                </motion.div>

                {/* TWO COLUMN */}
                <Row className="align-items-start g-5">

                    {/* LEFT SIDE */}
                    <Col md="5">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <h5 className="fw-bold mb-2">Expert guidance with a personal touch</h5>
                            <p className="text-muted mb-4">
                                Have a question, concern, or need support? Our team is ready to assist
                                employers, candidates, and administrators. This form goes straight to our
                                support team — it's the fastest way to reach us.
                            </p>

                            <div className="d-flex align-items-center mb-3 gap-3">
                                <FaEnvelope style={{ color: TEAL, fontSize: "1.1rem" }} />
                                <div>
                                    <p className="mb-0 fw-semibold" style={{ color: TEAL }}>support@jobportal.com</p>
                                    <p className="mb-0 text-muted small">We reply within 24 hours</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center mb-3 gap-3">
                                <FaPhoneAlt style={{ color: TEAL, fontSize: "1.1rem" }} />
                                <div>
                                    <p className="mb-0 fw-semibold">+92 300 0000000</p>
                                    <p className="mb-0 text-muted small">Mon - Sat, 9am to 5pm</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center mb-4 gap-3">
                                <FaMapMarkerAlt style={{ color: TEAL, fontSize: "1.1rem" }} />
                                <div>
                                    <p className="mb-0 fw-semibold">Rawalpindi, Punjab</p>
                                    <p className="mb-0 text-muted small">Pakistan</p>
                                </div>
                            </div>
                        </motion.div>
                    </Col>

                    {/* RIGHT SIDE - Form */}
                    <Col md="7">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            style={{
                                background: "#fff",
                                border: "1px solid #e8e8e8",
                                borderRadius: "12px",
                                padding: "40px",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                            }}
                        >
                            {submitted ? (
                                <motion.div
                                    className="text-center py-5"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div style={{ fontSize: "3rem" }}>✅</div>
                                    <h4 className="fw-bold mt-3">Message Sent!</h4>
                                    <p className="text-muted">Thank you! We'll get back to you within 24 hours.</p>
                                    <button
                                        className="btn btn-outline-secondary mt-2"
                                        onClick={() => setSubmitted(false)}
                                    >
                                        Send Another Message
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit}>

                                    {/* Name */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            placeholder="Your full name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            style={{ borderRadius: "8px", padding: "10px 14px" }}
                                        />
                                    </div>

                                    {/* Email + Subject */}
                                    <Row>
                                        <Col md="6" className="mb-3">
                                            <label className="form-label fw-semibold">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                style={{ borderRadius: "8px", padding: "10px 14px" }}
                                            />
                                        </Col>
                                        <Col md="6" className="mb-3">
                                            <label className="form-label fw-semibold">Subject</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                className="form-control"
                                                placeholder="How can we help?"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                style={{ borderRadius: "8px", padding: "10px 14px" }}
                                            />
                                        </Col>
                                    </Row>

                                    {/* Auto-detected Role - READ ONLY */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">I'm a</label>
                                        <div
                                            className="form-control d-flex align-items-center"
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 14px",
                                                backgroundColor: "#f8f9fa",
                                                color: TEAL,
                                                fontWeight: "600",
                                                cursor: "not-allowed",
                                            }}
                                        >
                                            {userTypeLabel || "—"}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">Message</label>
                                        <textarea
                                            name="message"
                                            className="form-control"
                                            rows="5"
                                            placeholder="How can we help?"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            style={{ borderRadius: "8px", padding: "10px 14px", resize: "none" }}
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="alert alert-danger py-2 mb-3">{error}</div>
                                    )}

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        className="btn w-100 py-3 fw-semibold"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={loading}
                                        style={{
                                            backgroundColor: TEAL,
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <FaPaperPlane className="me-2" />
                                                Send Message
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            )}
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default ContactDescriptions;
