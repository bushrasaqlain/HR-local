"use client";
import { Container, Row, Col } from "reactstrap";
import Image from "next/image";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="main-footer position-relative">

      {/* 🔷 TOP SECTION */}
      <div className="footer-top">
        <Container className="py-5">
          <Row>

            {/* 🔷 LEFT (LOGO + INFO) */}
            <Col xl="3" lg="3" md="6" className="mb-4">
              <div className="footer-column">
                <div className="logo mb-3">
                  <Image
                    width={140}
                    height={45}
                    src="/images/logo-2.svg"
                    alt="brand"
                  />
                </div>

                <p className="footer-desc">
                  Connecting employers with top talent and helping candidates find the right jobs.
                </p>

                <p><FaPhone /> 0314-8744587</p>
                <p><FaMapMarkerAlt /> Westridge 1, Rawalpindi</p>
                <p><FaEnvelope /> support@superio.com</p>
              </div>
            </Col>

            {/* 🔷 QUICK LINKS */}
            <Col xl="3" lg="3" md="6" className="mb-4">
              <div className="footer-column">
                <h5>Quick Links</h5>
                <ul className="footer-links">
                  <li><a href="/">Home</a></li>
                  <li><a href="/?page=about">About</a></li>
                  <li><a href="/?page=faq">FAQ's</a></li>
                  <li><a href="/?page=terms">Terms</a></li>
                </ul>
              </div>
            </Col>

            {/* 🔷 EMPLOYERS */}
            <Col xl="3" lg="3" md="6" className="mb-4">
              <div className="footer-column">
                <h5>For Employers</h5>
                <ul className="footer-links">
                  <li><a href="/?page=login">Post Job</a></li>
                  <li><a href="#">Browse Candidates</a></li>
                  <li><a href="#">Packages</a></li>
                  <li><a href="#">Dashboard</a></li>
                </ul>
              </div>
            </Col>

            {/* 🔷 CANDIDATES */}
            <Col xl="3" lg="3" md="6" className="mb-4">
              <div className="footer-column">
                <h5>For Candidates</h5>
                <ul className="footer-links">
                  <li><a href="#">Browse Jobs</a></li>
                  <li><a href="#">Upload CV</a></li>
                  <li><a href="#">Saved Jobs</a></li>
                  <li><a href="#">Profile</a></li>
                </ul>
              </div>
            </Col>

          </Row>

          {/* 🔷 SOCIAL ICONS */}
          <Row className="mt-4">
            <Col className="text-center">
              <div className="social-icons">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaTwitter /></a>
                <a href="#"><FaLinkedinIn /></a>
              </div>
            </Col>
          </Row>

        </Container>
      </div>

      {/* 🔷 BOTTOM */}
      <div className="footer-bottom text-center">
        © {new Date().getFullYear()} Superio. All Rights Reserved.
      </div>

    </footer>
  );
};

export default Footer;