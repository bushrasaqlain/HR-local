"use client";
import React from "react";
import { Container, Row, Col } from "reactstrap";
import IntroDescriptions from "./IntroDescriptions";
const index = () => {
  return (
    <>
      {/* <Breadcrumb title="About Us" meta="About Us" /> */}

      {/* About Section */}
      <section className="about-section-three py-5">
        <Container>

          <Row className="mt-4">
            <Col>
              <IntroDescriptions />
            </Col>
          </Row>
        </Container>
      </section>
      {/* End About Section */}

      
    </>
  );
};

export default index;
