import React, { Component } from "react";
import { Row, Col, Card, CardBody, CardHeader, Container } from "reactstrap";
import MessagesList from "./messagesList";
import SenderMessages from "./senderMessages";
import Head from "next/head";

class ChatBox extends Component {
  constructor(props) {
    super(props);

    console.log("ChatBox received props:", props);

    this.state = {
      selectedContactId: props.selectedContactId || null,
      selectedContactName: props.selectedContactName || "",
      candidateId: props.candidateId || sessionStorage.getItem("candidateId"), // From applications table
      selectedjobId: props.selectedJobId || sessionStorage.getItem("jobId"),
      senderId: sessionStorage.getItem("userId"), // Current logged-in user (company)
    };

    console.log("ChatBox state:", this.state);
    this.messagesListRef = React.createRef();
  }

  handleSelectContact = (contactId, contactName) => {
    this.setState({
      selectedContactId: contactId,
      selectedContactName: contactName,
    });
  };

  render() {
    const {
      candidateId,
      selectedjobId,
      selectedContactName,
      selectedContactId,
      senderId,
    } = this.state;
    const { onBack } = this.props;

    return (
      <Container fluid>
        <Head>
          <title>Messages</title>
        </Head>
        <button
          className="btn btn-outline-secondary custom-progress text-white mb-4 mt-4"
          onClick={onBack}
        >
          ← Back
        </button>

        <Row>
          <Col lg="12" className="chat">
            <SenderMessages
              senderId={senderId} // Current user (company) - THIS IS THE SENDER
              receiverId={selectedContactId} // Candidate's account_id - THIS IS THE RECEIVER
              candidateId={candidateId} // For status updates if needed
              jobId={selectedjobId}
              receiverName={selectedContactName}
              refreshContacts={() =>
                this.messagesListRef.current?.fetchContacts()
              }
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ChatBox;
