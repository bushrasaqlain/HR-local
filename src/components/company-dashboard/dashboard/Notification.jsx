import React, { Component } from "react";
import { ListGroup, ListGroupItem } from "reactstrap";

class Notification extends Component {
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

  formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  render() {
    const { contacts, searchValue } = this.state;

    const filteredContacts = contacts.filter((contact) =>
      contact.full_name.toLowerCase().includes(searchValue)
    );

    return (
      <div className="search-box-one">
        {/* Contact List */}
        <ListGroup className="contacts list-unstyled p-0 m-0">
          {filteredContacts.map((contact) => (
            <ListGroupItem
              key={contact.id}
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

export default Notification;
