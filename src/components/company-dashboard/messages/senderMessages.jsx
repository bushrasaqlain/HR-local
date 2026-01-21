import React, { Component, createRef } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Form,
  Input,
} from "reactstrap";

class SenderMessages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      newMessage: "",
      userId: sessionStorage.getItem("userId"),
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.messagesEndRef = createRef();
  }

  componentDidMount() {
    this.fetchMessagesIfNeeded();
  }

  componentDidUpdate(prevProps, prevState) {
    const { receiverId } = this.props;
    const { userId } = this.state;

    // Fetch messages if receiver changes
    if (receiverId && receiverId !== prevProps.receiverId) {
      this.fetchMessages(userId, receiverId);
    }

    // Scroll to bottom when messages update
    if (prevState.messages.length !== this.state.messages.length) {
      this.scrollToBottom();
    }
  }

  fetchMessagesIfNeeded = () => {
    const { receiverId } = this.props;
    const { userId } = this.state;
    if (receiverId) {
      this.fetchMessages(userId, receiverId);
    }
  };

  fetchMessages = async (userId, otherUserId) => {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}message/getAllmessages/${userId}/${otherUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        this.setState({ messages: data });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  handleMessageSubmit = async (e) => {
    e.preventDefault();
    const { receiverId } = this.props;
    const { newMessage, userId } = this.state;
    if (!receiverId || newMessage.trim() === "") return;

    const newMessageObj = {
      senderId: userId,
      receiverId: receiverId,
      message: newMessage,
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}message/sendmessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessageObj),
      });

      if (response.ok) {
        const data = await response.json();
        this.setState((prev) => ({
          messages: [...prev.messages, data.savedMessage],
          newMessage: "",
        }));
        if (this.props.refreshContacts) {
          this.props.refreshContacts();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  scrollToBottom = () => {
    const container = this.messagesEndRef.current?.parentElement;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 5;

    if (isAtBottom) {
      this.messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
    const { receiverName } = this.props;
    const { messages, newMessage, userId } = this.state;

    return (
      <div className="chat-box-container">
        <Card className="message-card">
          <CardHeader className="msg_head">
            <div className="user_info">
              <span>Receiver: {receiverName || "Select a contact"}</span>
            </div>
          </CardHeader>

          <CardBody className="msg_card_body">
            {messages.map((msg) => {
              const isSender = String(msg.senderId) === String(userId);
              return (
                <div
                  key={msg.id}
                  className={`msg_cotainer ${isSender ? "msg_sent" : "msg_receive"}`}
                >
                  <div className="msg_text">{msg.message}</div>
                  <div className="msg_time">{this.formatTime(msg.timestamp)}</div>
                </div>
              );
            })}
            <div ref={this.messagesEndRef} />
          </CardBody>

          <CardFooter>
            <Form onSubmit={this.handleMessageSubmit}>
              <Input
                type="textarea"
                className="type_msg"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => this.setState({ newMessage: e.target.value })}
              />
              <Button type="submit" color="primary" className="mt-2">
                Send Message
              </Button>
            </Form>
          </CardFooter>
        </Card>
      </div>
    );
  }
}

export default SenderMessages;
