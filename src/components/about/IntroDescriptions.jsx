"use client";
import React from "react";
import { Container, Row, Col } from "reactstrap";
import {
  FaBullseye,
  FaRocket,
  FaCogs,
  FaUserPlus,
  FaCheckCircle,
  FaBriefcase,
  FaUsers,
} from "react-icons/fa";
import { motion } from "framer-motion";

const IntroDescriptions = () => {
  return (
    <>
      {/* 🔷 HERO SECTION */}
      <div className="about-hero d-flex align-items-center justify-content-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white"
        >
          <h1 className="fw-bold text-white">About Us</h1>
          <p className="hero-tagline">Connecting Talent with Opportunities</p>
        </motion.div>
      </div>

      <Container className="mt-5">

        {/* 🔷 About Description */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Row className="mb-5">
            <Col md="10" className="mx-auto text-center">
              <p className="text-muted">
                Our platform is a complete job portal system designed to connect 
                employers and candidates efficiently. It ensures a secure and 
                reliable hiring process through admin approvals and structured workflows.
              </p>
            </Col>
          </Row>
        </motion.div>

        {/* 🔷 Vision, Mission, System */}
        <Row className="text-center">

          {[ 
            { icon: <FaBullseye />, title: "Vision", text: "To connect qualified talent with the right opportunities." },
            { icon: <FaRocket />, title: "Mission", text: "To simplify hiring through a secure and efficient system." },
            { icon: <FaCogs />, title: "Our System", text: "Provides a structured platform for job posting and approvals." }
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
                <p>{item.text}</p>
              </motion.div>
            </Col>
          ))}

        </Row>

        {/* 🔷 HOW IT WORKS */}
        <Row className="mt-5 text-center">
          <Col md="12">
            <h3 className="fw-bold mb-4">How It Works</h3>
          </Col>

          {[ 
            { icon: <FaUserPlus />, title: "Register", text: "Users create accounts" },
            { icon: <FaCheckCircle />, title: "Approval", text: "Admin verifies users" },
            { icon: <FaBriefcase />, title: "Post Job", text: "Employers post jobs" },
            { icon: <FaUsers />, title: "Hiring", text: "Interview & selection" }
          ].map((step, index) => (
            <Col md="3" key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="step-icon">{step.icon}</div>
                <h6>{step.title}</h6>
                <p className="text-muted">{step.text}</p>
              </motion.div>
            </Col>
          ))}
        </Row>

      </Container>
    </>
  );
};

export default IntroDescriptions;