"use client";
import { motion } from "framer-motion";
import TermsText from "./TermsText";
import React, { useState } from "react";

const Index = () => {
  const [showTerms, setShowTerms] = useState(false);
  return (
    <>
      {/* 🔷 HERO */}
      <div className="terms-hero-new">
        <div className="container">
          <div className="row align-items-center">

            {/* 🔷 LEFT CONTENT */}
            <div className="col-md-6">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="terms-title">
                  Term <br /> And Conditions
                </h1>

                <p className="terms-desc">
                  Our platform ensures a secure hiring process where employers and
                  candidates connect efficiently. Please read our terms carefully
                  before using the system.
                </p>

                <button
                  className="terms-btn"
                  onClick={() => setShowTerms(!showTerms)}
                >
                  {showTerms ? "Hide" : "Read More"}
                </button>
              </motion.div>
            </div>

            {/* 🔷 RIGHT IMAGE */}
            <div className="col-md-6 text-center">
              <motion.img
                src="/images/terms1.png.png"
                alt="terms"
                className="terms-img"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              />
            </div>

          </div>
        </div>
      </div>

      {/* 🔷 CONTENT */}
      {showTerms && (
        <section className="tnc-section">
          <div className="container">
            <TermsText />
          </div>
        </section>
      )}
    </>
  );
};

export default Index;