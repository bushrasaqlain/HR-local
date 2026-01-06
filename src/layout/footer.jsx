import { Container, Row, Col } from "reactstrap";
import Image from "next/image";
import CopyrightFooter from "../components/footer/CopyrightFooter";
import FooterApps from "../components/footer/FooterApps";
import FooterContent3 from "../components/footer/FooterContent3";

const Footer = () => {
  return (
    <footer
      className="bg-light position-relative"
      style={{
        backgroundImage: "url(/images/background/3.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container className="py-5">
        {/* Widgets Section */}
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
              <p className="phone-num">
                <span>Call us </span>
                <a href="tel:1234567890">123 456 7890</a>
              </p>
              <p className="address">
                329 Queensberry Street, North Melbourne VIC
                <br />
                3051, Australia.
                <br />
                <a href="mailto:support@superio.com" className="email">
                  support@superio.com
                </a>
              </p>
            </div>
          </Col>

          {/* Right Column */}
          <Col xl="9" lg="9" md="12">
            <Row>
              {/* Footer content widgets */}
              <FooterContent3 />

              {/* Mobile Apps */}
              <Col lg="3" md="6" sm="12" className="mt-4 mt-md-0">
                <div className="footer-widget">
                  <h5 className="widget-title mb-3">Mobile Apps</h5>
                  <FooterApps />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      {/* Copyright Section */}
      <div className="bg-dark text-white py-3 mt-4">
        <Container>
          <CopyrightFooter />
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
