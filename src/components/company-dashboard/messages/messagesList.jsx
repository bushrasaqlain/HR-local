import React, { Component } from "react";
import {
  Input,
  Form,
  FormGroup,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
} from "reactstrap";

class MessagesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contacts: [],
      searchValue: "",
      userId: sessionStorage.getItem("userId"),
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchContacts();
  }

  fetchContacts = async () => {
    const { userId } = this.state;
    try {
      const response = await fetch(`${this.apiBaseUrl}message/contacts/${userId}`);
      if (response.ok) {
        const data = await response.json();
        this.setState({ contacts: data });
        console.log(data);
      } else {
        console.error("Failed to fetch contacts:", response.statusText);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  handleChange = (e) => {
    this.setState({ searchValue: e.target.value.toLowerCase() });
  };

  formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  render() {
    const { contacts, searchValue } = this.state;
    const { onSelectContact } = this.props;

    const filteredContacts = contacts.filter((contact) =>
      contact.full_name.toLowerCase().includes(searchValue)
    );

    return (
      <div className="search-box-one">
        {/* Search Box */}
        <Form>
          <FormGroup className="mx-3">
            <Input
              type="search"
              placeholder="Search"
              value={searchValue}
              onChange={this.handleChange}
              autoComplete="off"
            />
          </FormGroup>
        </Form>

        {/* Contact List */}
        <ListGroup className="contacts list-unstyled p-0 m-0">
          {filteredContacts.map((contact) => (
            <ListGroupItem
              key={contact.id}
              tag="button"
              action
              onClick={() => onSelectContact(contact.id, contact.full_name)}
              className="d-flex justify-content-between align-items-center contact-item p-2 mb-1"
            >
              <div className="d-flex align-items-center">
                {/* Placeholder avatar */}
                <div className="avatar me-2">
                  {contact.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <span className="fw-bold">{contact.full_name}</span>
                  <p className="mb-0 text-truncate last-message">{contact.last_message}</p>
                </div>
              </div>
              <div className="message-time text-muted small">
                {this.formatTime(contact.last_message_time)}
              </div>
            </ListGroupItem>
          ))}
        </ListGroup>

      </div>
    );
  }
}

export default MessagesList;
