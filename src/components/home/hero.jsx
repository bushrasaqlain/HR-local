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
            src="/images/background/45.jpg"
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
            className="position-absolute w-100 h-100"
            style={{ objectFit: "cover", top: 0, left: 0 }}
            ref={(video) => {
              if (video) video.playbackRate = 0.6;
            }}
          >
            <source src="/videos/HUNAR.mp4" type="video/mp4" />
          </video> */}
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
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(3px)",
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
                CONNECT WITH TALENT BUILT TO DELIVER
              </motion.h1>

              {/* 🔷 Animated Text */}
              <motion.p
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-4 text-white"
              >
                Sick of drowning in resumes just to find a few people worth talking to? 
                <span className="fw-bold fs-5 me-2">Hunar</span>
                 skips the noise and puts vetted, ready-to-go candidates right in front of you — so you can get straight to interviewing people who actually fit.
              </motion.p>

              {/* 🔷 Animated Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Link href="/register">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-lg rounded-pill ms-2 semi -bold custom-btn d-inline-block text-center text-black"
                    style={{
                      backgroundColor: "#fff",
                      border: "2px solid #fff",
                      textDecoration: "none",
                    }}
                  >
                    Register
                  </motion.a>
                </Link>
              </motion.div>

              {/* Button Style */}
              <style jsx>{`
                .custom-btn {
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
