import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import CandidateMessages from "./ContentField";
import Head from "next/head";

class CandidateChatBox extends Component {
  constructor(props) {
    super(props);

    console.log("CandidateChatBox received props:", props);

    this.state = {
      companyId: props.companyId || sessionStorage.getItem("companyId"),
      companyName: props.companyName || "",
      jobId: props.jobId || sessionStorage.getItem("jobId"),
      candidateId: sessionStorage.getItem("candidateId"),
      senderId: sessionStorage.getItem("userId"),
    };

    console.log("CandidateChatBox state:", this.state);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.companyId !== this.props.companyId ||
      prevProps.jobId !== this.props.jobId
    ) {
      this.setState({
        companyId: this.props.companyId,
        companyName: this.props.companyName || "",
        jobId: this.props.jobId,
      });
    }
  }

  render() {
    const { companyId, companyName, jobId, candidateId, senderId } = this.state;
    const { onBack } = this.props;

    return (
      <Container fluid>
        <Head>
          <title>Messages</title>
        </Head>
        <button className="btn btn-outline-secondary custom-progress text-white mb-4 mt-4" onClick={onBack}>
          ← Back
        </button>

        <Row>
          <Col lg="12" className="chat">
            <CandidateMessages
              senderId={senderId}              // Current user (candidate) - THIS IS THE SENDER
              receiverId={companyId}            // Company's account_id - THIS IS THE RECEIVER
              candidateId={candidateId}         // Candidate ID
              jobId={jobId}
              companyName={companyName}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default CandidateChatBox;