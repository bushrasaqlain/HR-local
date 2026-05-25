// "use client";
import React, { useState } from "react";
import { Container, Row, Col } from "reactstrap";
import {
  FaShieldAlt,
  FaUserLock,
  FaDatabase,
  FaCookieBite,
  FaShareAlt,
  FaEnvelopeOpenText,
  FaLock,
} from "react-icons/fa";
import { motion } from "framer-motion";

const sections = [
  {
    icon: <FaDatabase />,
    title: "Information We Collect",
    content: [
      "Name, email, phone number, and location on registration.",
      "Resume, qualifications, and work experience for candidates.",
      "Company name, job descriptions, and contact info for employers.",
      "Usage data like pages visited and actions taken.",
    ],
  },
  {
    icon: <FaUserLock />,
    title: "How We Use Your Information",
    content: [
      "To manage your account and verify your identity.",
      "To match candidates with relevant job postings.",
      "To enable messaging between employers and candidates.",
      "To process payments and send important notifications.",
    ],
  },
  {
    icon: <FaShareAlt />,
    title: "Sharing of Information",
    content: [
      "We never sell your personal data to third parties.",
      "Candidate profiles are shared with employers only after approval.",
      "Job posting details are visible to candidates once published.",
    ],
  },
  {
    icon: <FaCookieBite />,
    title: "Cookies & Tracking",
    content: [
      "Cookies keep your session active and secure.",
      "Analytics cookies help us improve the platform experience.",
      "You can manage cookie settings in your browser anytime.",
    ],
  },
  {
    icon: <FaLock />,
    title: "Data Security",
    content: [
      "All data is encrypted and transmitted over HTTPS.",
      "Sensitive information is accessible only to authorized staff.",
      "We regularly update our security practices.",
    ],
  },
];

const PrivacyDescriptions = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [bottomHovered, setBottomHovered] = useState(false);

  return (
    <>
      {/* HERO SECTION */}
      <div className="privacy-hero d-flex align-items-center justify-content-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white"
        >
          <h1 className="fw-bold text-white">Privacy Policy</h1>
          <p className="hero-tagline">Your Privacy Is Our Priority</p>
        </motion.div>
      </div>

      <Container className="mt-5" style={{ paddingBottom: "80px" }}>
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Row className="mb-5">
            <Col md="8" className="mx-auto text-center">
              <p className="text-muted">
                This policy explains how our HR Job Portal collects, uses, and
                protects your data. By using our platform, you agree to these practices.
              </p>
            </Col>
          </Row>
        </motion.div>

        {/* Key Highlights */}
        <Row className="text-center mb-5">
          {[
            { icon: <FaShieldAlt />, title: "Data Protected", text: "Encrypted and secured at all times." },
            { icon: <FaUserLock />, title: "Your Control", text: "Access, edit, or delete your data anytime." },
            { icon: <FaEnvelopeOpenText />, title: "Transparent", text: "We clearly explain what we collect and why." },
          ].map((item, index) => (
            <Col md="4" className="mb-4" key={index}>
              <motion.div
                className="about-card p-4 h-100"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="icon mb-3">{item.icon}</div>
                <h4>{item.title}</h4>
                <p className="mb-0">{item.text}</p>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Accordion Sections */}
        <Row className="mb-5">
          <Col md="10" className="mx-auto">
            <h3 className="fw-bold mb-4 text-center">Policy Details</h3>
            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="mb-3"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className="about-card p-3"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? null : index)
                  }
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="icon"
                        style={{
                          fontSize: "1.2rem",
                          color: hoveredIndex === index ? "#fff" : "",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {section.icon}
                      </span>
                      <h5
                        className="mb-0"
                        style={{
                          color: hoveredIndex === index ? "#fff" : "",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {section.title}
                      </h5>
                    </div>
                    <span
                      style={{
                        color: hoveredIndex === index ? "#fff" : "",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {activeIndex === index ? "▲" : "▼"}
                    </span>
                  </div>

                  {activeIndex === index && (
                    <motion.ul
                      className="mt-3 ps-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        color: hoveredIndex === index ? "#fff" : "#6c757d",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {section.content.map((point, i) => (
                        <li key={i} className="mb-1">
                          {point}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              </motion.div>
            ))}
          </Col>
        </Row>

        {/* Contact Note */}
        <Row className="mb-5">
          <Col md="6" className="mx-auto text-center">
            <motion.div
              className="about-card p-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              onMouseEnter={() => setBottomHovered(true)}
              onMouseLeave={() => setBottomHovered(false)}
            >
              <FaEnvelopeOpenText size={28} className="mb-3"
                style={{ color: bottomHovered ? "#fff" : "var(--theme-color, #132f49)", transition: "color 0.3s ease" }} />
              <h5 style={{ color: bottomHovered ? "#fff" : "", transition: "color 0.3s ease" }}>
                Have Questions?
              </h5>
              <p style={{ color: bottomHovered ? "#fff" : "#6c757d", transition: "color 0.3s ease" }} className="mb-0">
                Contact us at{" "}
                <a href="mailto:privacy@jobportal.com"
                  style={{ color: bottomHovered ? "#fff" : "" }}>privacy@jobportal.com</a>
              </p>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PrivacyDescriptions;
