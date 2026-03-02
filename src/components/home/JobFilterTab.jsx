"use client";

import React, { Component } from "react";
import Link from "next/link";
import axios from "axios";
import { Container, Row } from "react-bootstrap";

class JobFilterTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
     
    };
  }

  componentDidMount() {
    // Uncomment when needed
    // this.fetchData();
  }

  fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:8080/alljobposts");

      this.setState({
        jobPostsResults: response.data,
        filteredData: response.data,
      });
    } catch (error) {
      console.error("Error fetching job listings:", error);
    }
  };



  render() {

    return (
      <>
      <Container fluid>
 <div className="row text-center align-items-center">
          <div className="col-md-4 mb-4 mb-md-0">
            <h2 className="fw-bold text-primary">60,000+</h2>
            <h5 className="fw-semibold">Registered Jobseekers</h5>
            <p className="text-muted mb-0">
              of different backgrounds and disciplines
            </p>
          </div>

          <div className="col-md-4 mb-4 mb-md-0">
            <h2 className="fw-bold text-primary">85%</h2>
            <h5 className="fw-semibold">Success Rate</h5>
            <p className="text-muted mb-0">
              From Contract to Permanent Employee
            </p>
          </div>

          <div className="col-md-4">
            <h2 className="fw-bold text-primary">90%</h2>
            <h5 className="fw-semibold">Diverse Candidates</h5>
            <p className="text-muted mb-0">
              with diverse backgrounds and international experiences
            </p>
          </div>
        </div>
      </Container>
       
      </>
    );
  }
}

export default JobFilterTab;
