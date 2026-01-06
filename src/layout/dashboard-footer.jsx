import React from 'react';
import { Container, Row, Col, Nav, NavItem, NavLink } from 'reactstrap';

const DashboardFooter = () => {
  return (
    <footer className="footer bg-dark text-white mt-auto py-3">
      <Container>
        <Row className="align-items-center">
          {/* Left Side */}
          <Col md="6" className="text-center text-md-start mb-2 mb-md-0">
            <span>© {new Date().getFullYear()} HR. All Rights Reserved.</span>
          </Col>

          {/* Right Side */}
          <Col md="6" className="text-center text-md-end">
            <Nav className="justify-content-center justify-content-md-end">
              <NavItem>
                <NavLink href="#" className="text-white">
                  Privacy Policy
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/terms" className="text-white">
                  Terms of Service
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/contact" className="text-white">
                  Contact
                </NavLink>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default DashboardFooter;
