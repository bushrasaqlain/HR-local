import Link from "next/link";
import React from 'react';
import { Container, Row, Col, Nav, NavItem } from 'reactstrap';

const DashboardFooter = () => {
  return (
    <footer className="footer text-white py-3 mt-3 fixed-bottom dashboard-footer"
      style={{ background: "#192b31" }}>
      <Container>
        <Row className="align-items-center">
          <Col md="6" className="text-center text-md-start mb-2 mb-md-0">
            <span>© {new Date().getFullYear()} HR. All Rights Reserved.</span>
          </Col>

          <Col md="6" className="text-center text-md-end">
            <Nav className="justify-content-center justify-content-md-end">
              <NavItem>
                <Link href="/privacy-policy" className="text-white nav-link">
                  Privacy Policy
                </Link>
              </NavItem>
              <NavItem>
                <Link href="/terms-of-service" className="text-white nav-link">
                  Terms of Service
                </Link>
              </NavItem>
              <NavItem>
                <Link href="/contact-us" className="text-white nav-link">
                  Contact
                </Link>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default DashboardFooter;