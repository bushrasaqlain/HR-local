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
      candidateId: props.selectedContactId, // From applications table
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
      <Container fluid style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
        <Head>
          <title>Messages</title>
        </Head>
        {/* <button
          className="btn btn-outline-secondary custom-progress text-white mb-4 mt-4"
          onClick={onBack}
        >
          ← Back
        </button> */}

        <Row style={{ flex: 1, margin: 0, minHeight: 0 }}>
          <Col lg="12" className="chat" style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            <SenderMessages
              senderId={senderId}
              receiverId={selectedContactId}
              candidateId={candidateId}
              jobId={selectedjobId}
              receiverName={selectedContactName}
              onBack={onBack}  
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
