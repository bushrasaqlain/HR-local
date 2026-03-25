"use client";
import React from "react";
import { motion } from "framer-motion";
import FaqChild from "./FaqChild";

const Index = () => {
  return (
    <>
      {/* 🔷 HERO SECTION */}
      <div className="faq-hero d-flex align-items-center justify-content-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-white fw-bold">FAQs</h1>
          <p className="faq-tagline">Find answers to common questions</p>
        </motion.div>
      </div>

      {/* 🔷 FAQ SECTION */}
      <section className="faqs-section">
        <div className="container">

          {/* 🔷 Account */}
          <h3 className="faq-heading">Account & Registration</h3>
          <FaqChild category="account" />

          {/* 🔷 Employer */}
          <h3 className="faq-heading mt-5">Employer</h3>
          <FaqChild category="employer" />

          {/* 🔷 Candidate */}
          <h3 className="faq-heading mt-5">Candidate</h3>
          <FaqChild category="candidate" />

          {/* 🔷 Admin */}
          <h3 className="faq-heading mt-5">Admin & System</h3>
          <FaqChild category="admin" />

          {/* 🔷 Payment */}
          <h3 className="faq-heading mt-5">Payments</h3>
          <FaqChild category="payment" />

        </div>
      </section>
    </>
  );
};

export default Index;