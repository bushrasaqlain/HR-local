"use client";
import React from "react";
import { Container, Row, Col } from "reactstrap";

import Partner from "./Partner";
import Funfact from "./Funfact";
import IntroDescriptions from "./IntroDescriptions";
import CallToAction2 from "./CallToAction2";
import Testimonial2 from "./Testimonial2";
import Block1 from "./Block1";
import Breadcrumb from "../common/Breadcrumb";

const index = () => {
  return (
    <>
      {/* <Breadcrumb title="About Us" meta="About Us" /> */}

      {/* About Section */}
      <section className="about-section-three py-5">
        <Container>
        

          {/* Fun Fact Section */}
          <Row className="fun-fact-section mt-4">
            <Funfact />
          </Row>

          <Row className="mt-4">
            <Col>
              <IntroDescriptions />
            </Col>
          </Row>
        </Container>
      </section>
      {/* End About Section */}

      {/* Call To Action */}
      <CallToAction2 />
      {/* End CallToAction2 */}

      {/* Testimonial Section */}
      <section className="testimonial-section-two py-5">
        <Container fluid>
          <Row>
            <Col xs={12} md={6} className="testimonial-left">
              <img
                src="/images/resource/testimonial-left.png"
                alt="testimonial"
                className="img-fluid"
              />
            </Col>
            <Col xs={12} md={6} className="testimonial-right">
              <img
                src="/images/resource/testimonial-right.png"
                alt="testimonial"
                className="img-fluid"
              />
            </Col>
          </Row>

          <Row className="text-center mt-4">
            <Col>
              <h2>Testimonials From Our Customers</h2>
              <p>Lorem ipsum dolor sit amet elit, sed do eiusmod tempor</p>
            </Col>
          </Row>

          <Row className="carousel-outer mt-3" data-aos="fade-up">
            <Col>
              <Testimonial2 />
            </Col>
          </Row>
        </Container>
      </section>
      {/* End Testimonial Section */}

      {/* Work Section */}
      <section className="work-section style-two py-5">
        <Container>
          <Row className="text-center mb-4">
            <Col>
              <h2>How It Works?</h2>
              <p>Job for anyone, anywhere</p>
            </Col>
          </Row>

          <Row data-aos="fade-up">
            <Block1 />
          </Row>
        </Container>
      </section>
      {/* End Work Section */}

      {/* Clients Section */}
      <section className="clients-section py-5">
        <Container>
          <Row className="justify-content-center" data-aos="fade">
            <Col>
              <ul className="sponsors-carousel list-unstyled d-flex flex-wrap justify-content-center">
                <Partner />
              </ul>
            </Col>
          </Row>
        </Container>
      </section>
      {/* End Clients Section */}
    </>
  );
};

export default index;
