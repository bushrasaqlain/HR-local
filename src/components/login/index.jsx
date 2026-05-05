"use client";

import { Container, Row, Col } from "reactstrap";
import FormContent from "../form/login-form";

const Index = () => {
  return (
    <div className="login-section">
      <Container className="d-flex align-items-center justify-content-center h-100">
        <Row className="w-100 justify-content-center">
          <Col md="4">
            <div className="login-card">
              <FormContent />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Index;