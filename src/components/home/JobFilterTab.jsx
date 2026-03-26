"use client";

import React, { Component } from "react";
import Link from "next/link";
import axios from "axios";
import { Container, Row } from "react-bootstrap";

class JobFilterTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jobseekers: 0,
      successRate: 0,
      diversity: 0,

      jobseekersTarget: 0,
      successRateTarget: 0,
      diversityTarget: 0,

      hasAnimated: false,
    };

    this.sectionRef = React.createRef();
  }

  startCounter = (endValue, setter, duration = 2000) => {
    let start = 0;
    const increment = endValue / (duration / 16);

    const counter = setInterval(() => {
      start += increment;

      if (start >= endValue) {
        setter(endValue);
        clearInterval(counter);
      } else {
        setter(Math.floor(start));
      }
    }, 16);
  };

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
    this.fetchStats();

  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    if (!this.sectionRef.current || this.state.hasAnimated) return;

    const rect = this.sectionRef.current.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      this.setState({ hasAnimated: true });

      this.startCounter(this.state.jobseekersTarget, (val) =>
        this.setState({ jobseekers: val })
      );

      this.startCounter(this.state.successRateTarget, (val) =>
        this.setState({ successRate: val })
      );

      this.startCounter(this.state.diversityTarget, (val) =>
        this.setState({ diversity: val })
      );
    }
  };

  fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:8080/dashboard-stats");

      this.setState({
        jobseekersTarget: res.data.jobseekers,
        successRateTarget: res.data.successRate,
        diversityTarget: res.data.diversity
      }, () => {
        this.handleScroll();
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };


  render() {

    return (
      <>
        <Container fluid ref={this.sectionRef}>
          <div className="row text-center align-items-center py-5">

            <div className="col-md-4 mb-4 mb-md-0">
              <h2 className="fw-bold text-primary">
                {this.state.jobseekers.toLocaleString()}+
              </h2>
              <h5 className="fw-semibold">Registered Jobseekers</h5>
              <p className="text-muted mb-0">
                of different backgrounds and disciplines
              </p>
            </div>

            <div className="col-md-4 mb-4 mb-md-0">
              <h2 className="fw-bold text-primary">
                {this.state.successRate}%
              </h2>
              <h5 className="fw-semibold">Success Rate</h5>
              <p className="text-muted mb-0">
                From Contract to Permanent Employee
              </p>
            </div>

            <div className="col-md-4">
              <h2 className="fw-bold text-primary">
                {this.state.diversity}%
              </h2>
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
