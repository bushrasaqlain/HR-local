"use client";
import React from "react";
import { motion } from "framer-motion";

const TermsText = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using our job portal, you agree to comply with these terms and conditions. This platform connects employers and candidates, and all users must follow the defined rules and policies.",
    },
    {
      title: "2. User Registration",
      content:
        "Users must register as either an Employer or Candidate. All information provided must be accurate and complete. The Registration Admin reserves the right to approve or reject any account.",
    },
    {
      title: "3. Employer Responsibilities",
      content:
        "Employers are responsible for posting accurate job information. Any misleading or fraudulent job postings are strictly prohibited and may result in account suspension.",
    },
    {
      title: "4. Candidate Responsibilities",
      content:
        "Candidates must provide truthful personal and professional details. Any misuse of the platform or submission of false information may lead to account termination.",
    },
    {
      title: "5. Job Approval Process",
      content:
        "All job postings must be approved by the admin before being published. The admin has the authority to reject or remove any job that violates platform policies.",
    },
    {
      title: "6. Payments & Packages",
      content:
        "Employers may need to purchase packages to post jobs. All payments are non-refundable unless stated otherwise. Payment issues should be reported to support.",
    },
    {
      title: "7. Account Suspension",
      content:
        "We reserve the right to suspend or terminate accounts that violate terms, engage in fraudulent activity, or misuse the platform.",
    },
    {
      title: "8. Privacy Policy",
      content:
        "User data is securely stored and only used for platform functionality. We do not share personal information without consent.",
    },
    {
      title: "9. Modifications",
      content:
        "We may update these terms at any time. Continued use of the platform means you accept the updated terms.",
    },
  ];

  return (
    <>
      {sections.map((item, index) => (
        <motion.div
          key={index}
          className="terms-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <h4>{item.title}</h4>
          <p>{item.content}</p>
        </motion.div>
      ))}
    </>
  );
};

export default TermsText;