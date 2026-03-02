import { Container, Row, Col } from "reactstrap";
import Image from "next/image";
import FooterApps from "../components/footer/FooterApps";
import FooterContent3 from "../components/footer/FooterContent3";
import footerContent from "../components/footer/footerContent";

const Footer = () => {
  return (
   <footer className="position-relative">
  {/* Widgets Section with slightly lighter black */}
  <div style={{ backgroundColor: "#1a1a1a" }}>
    <Container className="py-5">
      <Row className="widgets-section" data-aos="fade-up">
        {/* Left Column */}
        <Col xl="3" lg="3" md="12" className="mb-4 mb-lg-0">
          <div className="footer-column about-widget">
            <div className="logo mb-3">
              <a href="#">
                <Image
                  width={154}
                  height={50}
                  src="/images/logo-2.svg"
                  alt="brand"
                />
              </a>
            </div>
            <p className="phone-num text-white">
              <span>Call us </span>
              <span>0314-8744587</span>
            </p>
            <p className="address text-white">
              309 valley road, Westridge 1
              <br />
              3051, Pakistan
              <br />
              <a href="mailto:support@superio.com" className="email text-white">
                support@superio.com
              </a>
            </p>
          </div>
        </Col>
        {/* Add other footer content columns here */}
      </Row>
    </Container>
  </div>

  {/* Copyright Section - solid black */}
  <div className="text-white text-center p-4" style={{ backgroundColor: "#2e2e2e" }}>
    © {new Date().getFullYear()} Superio. All Rights Reserved.
  </div>
</footer>
  );
};

export default Footer;
