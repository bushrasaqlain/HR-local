"use client";
import React, { Component } from "react";
import { Container, Row, Col } from "reactstrap";
class IntroDescriptions extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }
  render() {
    return (
      
      <Container fluid>
 <div className="text-box mt-4 p-4 row text-center align-items-center"
 style={{ textAlign: "justify" }}>
  <h4 className="fw-bold text-center">About Us</h4>
      
      <div className="col-md-4 mb-4 mb-md-0">
        <h2 className="fw-bold text-dark">Vision</h2>
        <p className="text-muted text-gray">
          Putting qualified talent to work.
        </p>
      </div>
        <div className="col-md-4 mb-4 mb-md-0">
        <h2 className="fw-bold text-dark">Vision</h2>
        <p className="text-muted text-gray">
          Putting qualified talent to work.
        </p>
      </div>
        <div className="col-md-4 mb-4 mb-md-0">
        <h2 className="fw-bold text-dark">Vision</h2>
        <p className="text-muted text-gray">
          Putting qualified talent to work.
        </p>
      </div>
    </div>
      </Container>
      
    )
  }
}


export default IntroDescriptions;
