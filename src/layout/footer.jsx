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
    <footer className="main-footer">

      <div className="footer-top">
        <Container className="py-5">

          <Row className="align-items-center">

            
            <Col md="6" className="footer-left">
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
            </Col>

            
            <Col md="6" className="footer-right text-md-end mt-4 mt-md-0">

              
              <div className="social-icons mb-3">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaTwitter /></a>
                <a href="#"><FaLinkedinIn /></a>
              </div>

              
              <ul className="footer-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/faq">FAQ's</a></li>
                <li><a href="/terms">Terms</a></li>
              </ul>

            </Col>

          </Row>

        </Container>
      </div>

      {/* 🔷 BOTTOM */}
      <div className="footer-bottom2 text-center fw-bold">
        © {new Date().getFullYear()} Superio. All Rights Reserved.
      </div>

    </footer>
  );
};

export default Footer;