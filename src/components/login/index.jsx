"use client";

import { Container, Row, Col, Card, CardBody } from "reactstrap";
import FormContent from "../form/login-form";

const Index = () => {
  return (
    <div className="login-section position-relative">
      
      {/* Background Image */}
      <div
        className="image-layer position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: "url(/images/background/bg-1.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />

      <Container className="min-vh-100 d-flex align-items-center justify-content-center">
        <Row className="w-100 justify-content-center">
          <Col lg="6" md="8" sm="10"> {/* Increased width */}
            <Card
              className="shadow border-0"
              style={{
                borderRadius: "16px",  // More rounded corners
                minHeight: "500px",     // Increased height
              }}
            >
              <CardBody className="p-5"> {/* More padding */}
                <div className="login-form default-form">
                  <FormContent />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Index;
