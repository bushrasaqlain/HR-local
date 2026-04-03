"use client";
import React, { Component } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

class Hero extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: "",
    };
  }

  render() {
    return (
      <section className="position-relative w-100" style={{ height: "100vh" }}>

        {/* Background Image */}
        <div className="position-absolute w-100 h-100">
          <Image
            src="/images/background/new1.jpg.jpg"
            alt="Hero Background"
            layout="fill"
            objectFit="cover"
            quality={100}
          />

          {/* <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-video"
            ref={(video) => {
              if (video) video.playbackRate = 0.6;
            }}
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video> */}


          {/* Overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
          ></div>
        </div>

        {/* Hero Content */}
        <div
          className="container position-relative h-100 d-flex align-items-center"
          style={{ zIndex: 2 }}
        >
          <div className="row">
            <div className="col-lg-6 col-md-8 col-sm-12">

              {/* 🔷 Animated Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="fw-bold text-white mb-3"
              >
                FIND TOP TALENT READY TO MAKE AN IMPACT
              </motion.h1>

              {/* 🔷 Animated Text */}
              <motion.p
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-4 text-white"
              >
                Are you struggling with lengthy hiring processes and unqualified
                candidates? Superio connects you directly with high-quality,
                motivated, job-ready talent prepared to contribute from day one.
              </motion.p>

              {/* 🔷 Animated Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Link href="/?page=login">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-lg rounded-pill ms-2 custom-btn d-inline-block text-center"
                    style={{backgroundColor: "#1e2a2e", border: "#1e2a2e"}}
                  >
                    Register
                  </motion.a>
                </Link>
              </motion.div>

              {/* Button Style */}
              <style jsx>{`
                .custom-btn {
                  border: 2px solid #000;
                  background-color: #000;
                  color: #fff;
                  padding: 10px 30px;
                  font-size: 16px;
                  transition: all 0.3s ease;
                }
              `}</style>

            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default Hero;