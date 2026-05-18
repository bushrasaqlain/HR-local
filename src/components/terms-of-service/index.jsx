// "use client";
import React from "react";
import { Container, Row, Col } from "reactstrap";
import TermsDescriptions from "./TermsDescriptions";

const index = () => {
  return (
    <>
      <section className="about-section-three py-5">
        <Container>
          <Row className="mt-4">
            <Col>
              <TermsDescriptions />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default index;
