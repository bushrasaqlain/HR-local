import React, { Component } from "react";
import { Row, Col, Card, CardBody, CardHeader } from "reactstrap";
import MessagesList from "./messagesList";
import SenderMessages from "./senderMessages";

class ChatBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedContactId: null,
      selectedContactName: "",
      userId: sessionStorage.getItem("userId"),
    };

    // Add a ref to access MessagesList methods
    this.messagesListRef = React.createRef();
  }

  handleSelectContact = (contactId, contactName) => {
    this.setState({
      selectedContactId: contactId,
      selectedContactName: contactName,
    });
  };

  render() {
    const { userId, selectedContactId, selectedContactName } = this.state;

    return (
      <Row>
        {/* Contacts Column */}
        <Col xl="4" lg="5" md="12" sm="12" className="chat">
          <Card className="contacts_card">
            <CardHeader>Contacts</CardHeader>
            <CardBody className="contacts_body">
              <MessagesList
                ref={this.messagesListRef} // attach ref here
                onSelectContact={this.handleSelectContact}
              />
            </CardBody>
          </Card>
        </Col>

        {/* Messages Column */}
        <Col xl="8" lg="7" md="12" sm="12" className="chat">
          <SenderMessages
            userId={userId}
            receiverId={selectedContactId}
            receiverName={selectedContactName}
            refreshContacts={() => this.messagesListRef.current.fetchContacts()} // now works
          />
        </Col>
      </Row>
    );
  }
}

export default ChatBox;
