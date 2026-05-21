// "use client";
import React, { useState } from "react";
import { Container, Row, Col } from "reactstrap";
import {
  FaFileContract,
  FaUserCheck,
  FaBriefcase,
  FaBoxOpen,
  FaBan,
  FaExclamationTriangle,
  FaGavel,
  FaSyncAlt,
  FaHandshake,
} from "react-icons/fa";
import { motion } from "framer-motion";

const sections = [
  {
    icon: <FaUserCheck />,
    title: "User Registration & Accounts",
    content: [
      "Register with accurate and truthful information.",
      "All accounts require admin approval before access is granted.",
      "Keep your login credentials confidential.",
    ],
  },
  {
    icon: <FaBriefcase />,
    title: "Job Postings",
    content: [
      "Purchase an approved package before posting a job.",
      "Each job is reviewed and activated by the admin.",
      "Postings must be accurate and lawful — violations will be removed.",
    ],
  },
  {
    icon: <FaBoxOpen />,
    title: "Packages & Payments",
    content: [
      "A package is required for each job posting.",
      "Payments are non-refundable once a job is activated.",
      "Package pricing and features may change at any time.",
    ],
  },
  {
    icon: <FaHandshake />,
    title: "Candidate Profile & Applications",
    content: [
      "Provide truthful info in your profile — false details may lead to suspension.",
      "Boost your profile to increase visibility to employers.",
      "Boosted candidates can apply directly to matching jobs.",
    ],
  },
  {
    icon: <FaBan />,
    title: "Prohibited Activities",
    content: [
      "No fake, misleading, or discriminatory job listings.",
      "No multiple accounts or impersonation.",
      "Abusive content or platform manipulation leads to termination.",
    ],
  },
  {
    icon: <FaExclamationTriangle />,
    title: "Limitation of Liability",
    content: [
      "We facilitate connections but are not responsible for hiring decisions.",
      "We do not guarantee employment or successful recruitment.",
    ],
  },
  {
    icon: <FaSyncAlt />,
    title: "Changes to Terms",
    content: [
      "Terms may be updated at any time without prior notice.",
      "Continued use of the platform means you accept the updated terms.",
    ],
  },
];

const TermsDescriptions = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [bottomHovered, setBottomHovered] = useState(false);

  return (
    <>
      {/* HERO SECTION */}
      <div className="service-hero d-flex align-items-center justify-content-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white"
        >
          <h1 className="fw-bold text-white">Terms of Service</h1>
          <p className="hero-tagline">Please Read Before Using Our Platform</p>
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
                By using our HR Job Portal, you agree to these Terms of Service.
                They apply to all Candidates, Employers, and Administrators.
              </p>
            </Col>
          </Row>
        </motion.div>

        {/* Highlights */}
        <Row className="text-center mb-5">
          {[
            { icon: <FaFileContract />, title: "Clear Terms", text: "Transparent rules for all users." },
            { icon: <FaUserCheck />, title: "Fair Use", text: "A safe space for employers and candidates." },
            { icon: <FaGavel />, title: "Enforcement", text: "Violations are handled seriously." },
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
            <h3 className="fw-bold mb-4 text-center">Full Terms</h3>
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

        {/* Agreement Note */}
        <Row className="mb-5">
          <Col md="6" className="mx-auto text-center">
            {(() => {
              const [bottomHovered, setBottomHovered] = useState(false);
              return (
                <motion.div
                  className="about-card p-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  onMouseEnter={() => setBottomHovered(true)}
                  onMouseLeave={() => setBottomHovered(false)}
                >
                  <FaFileContract size={28} className="mb-3"
                    style={{ color: bottomHovered ? "#fff" : "var(--theme-color, #132f49)", transition: "color 0.3s ease" }} />
                  <h5 style={{ color: bottomHovered ? "#fff" : "", transition: "color 0.3s ease" }}>
                    Using Our Platform = Agreeing to These Terms
                  </h5>
                  <p style={{ color: bottomHovered ? "#fff" : "#6c757d", transition: "color 0.3s ease" }} className="mb-0">
                    Questions? Contact us at{" "}
                    <a href="mailto:legal@jobportal.com" style={{ color: bottomHovered ? "#fff" : "" }}>legal@jobportal.com</a>
                  </p>
                </motion.div>
              );
            })()}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default TermsDescriptions;
