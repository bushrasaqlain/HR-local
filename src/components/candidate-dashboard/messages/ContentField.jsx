import React, { Component, createRef } from "react";
// import { toast } from "react-toastify";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Form,
  Input,
  Container,
} from "reactstrap";

class CandidateMessages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      newMessage: "",
      successMessage: "",
      errorMessage: "",
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.messagesEndRef = createRef();
    this.messagesContainerRef = createRef(); // Add container ref

    // Bind methods
    this.handleSendMessage = this.handleSendMessage.bind(this);
  }

  componentDidMount() {
    console.log("CandidateMessages mounted with props:", this.props);
    this.fetchMessages();

    // Poll for new messages every 3 seconds
    this.pollInterval = setInterval(() => {
      this.fetchMessages();
    }, 3000);
  }

  componentDidUpdate(prevProps) {
    // Fetch messages when receiver or job changes
    if (
      prevProps.receiverId !== this.props.receiverId ||
      prevProps.jobId !== this.props.jobId
    ) {
      console.log("Receiver or job changed, fetching messages:", {
        receiverId: this.props.receiverId,
        jobId: this.props.jobId,
      });
      this.fetchMessages();
    }
  }

  componentWillUnmount() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchMessages = async () => {
    const { receiverId, jobId, senderId } = this.props;

    if (!receiverId || !senderId) {
      console.log("Cannot fetch messages - missing IDs:", {
        senderId,
        receiverId,
      });
      return;
    }

    try {
      // Use the endpoint that gets messages between sender and receiver
      let url = `${this.apiBaseUrl}message/getAllmessages/${senderId}/${receiverId}`;
      if (jobId) {
        url += `?jobId=${jobId}`;
      }

      console.log("Fetching messages from:", url);

      const response = await axios.get(url);

      if (response.data) {
        console.log("Messages fetched:", response.data.length);
        this.setState({ messages: response.data }, () => {
          this.scrollToBottom();
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  handleSendMessage = async (e) => {
    e.preventDefault();

    const { receiverId, jobId, senderId } = this.props;
    const { newMessage } = this.state;

    console.log("Sending message:", {
      senderId,
      receiverId,
      jobId,
      message: newMessage,
    });

    if (!receiverId) {
      this.setState({ errorMessage: "No receiver selected" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    if (!senderId) {
      this.setState({ errorMessage: "Sender ID not found" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    if (!newMessage.trim()) {
      this.setState({ errorMessage: "Message cannot be empty" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    // Optimistically add message to UI
    const tempMessage = {
      id: Date.now(),
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      jobId: jobId ? parseInt(jobId) : null,
      message: newMessage,
      timestamp: new Date().toISOString(),
      is_read: false,
      temp: true,
    };

    this.setState(
      (prev) => ({
        messages: [...prev.messages, tempMessage],
        newMessage: "",
      }),
      () => {
        this.scrollToBottom();
      }
    );

    try {
      // Send to the message endpoint
      const response = await axios.post(
        `${this.apiBaseUrl}message/sendmessage`,
        {
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          jobId: jobId ? parseInt(jobId) : null,
          message: newMessage,
        },
      );

      console.log("Message sent successfully:", response.data);

      // Replace temp message with real one
      this.setState((prev) => ({
        messages: prev.messages.map((msg) =>
          msg.id === tempMessage.id ? response.data.savedMessage : msg,
        ),
      }));

      // Refresh contacts list if the prop exists
      if (this.props.refreshContacts) {
        this.props.refreshContacts();
      }
    } catch (error) {
      // Remove temp message on error
      this.setState((prev) => ({
        messages: prev.messages.filter((msg) => msg.id !== tempMessage.id),
      }));

      console.error(
        "Error sending message:",
        error.response?.data || error.message,
      );
      this.setState({ errorMessage: "Failed to send message" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  scrollToBottom = () => {
    setTimeout(() => {
      if (this.messagesContainerRef.current) {
        this.messagesContainerRef.current.scrollTop = this.messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to format message date (Today, Yesterday, or date)
  formatMessageDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts for date comparison
    const messageDateStr = messageDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (messageDateStr === todayStr) {
      return "Today";
    } else if (messageDateStr === yesterdayStr) {
      return "Yesterday";
    } else {
      // Return formatted date (e.g., "June 15, 2024")
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  // Group messages by date
  groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = this.formatMessageDate(message.timestamp);

      if (messageDate !== currentDate) {
        // Start a new group
        groups.push({
          date: messageDate,
          messages: [message]
        });
        currentDate = messageDate;
      } else {
        // Add to existing group
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  render() {
    const { companyName, jobId } = this.props;
    const { messages, newMessage } = this.state;
    const senderId = this.props.senderId;

    // Group messages by date
    const messageGroups = this.groupMessagesByDate(messages);

    return (
      <Container fluid className="p-0">
        {this.state.successMessage && (
          <div className="alert alert-success d-flex justify-content-between align-items-center">
            <span>{this.state.successMessage}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => this.setState({ successMessage: "" })}
            />
          </div>
        )}

        {this.state.errorMessage && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{this.state.errorMessage}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => this.setState({ errorMessage: "" })}
            />
          </div>
        )}
        <Card className="message-card" style={{ height: "500px", display: "flex", flexDirection: "column" }}>
          <CardHeader className="" style={{ background: "#5F8190", flexShrink: 0 }}>
            <div className="user_info justify-content-center">
              <span className="text-white">
                Chat with: {companyName || "Company"}
              </span>
              {messages.length > 0 && messages[0].job_title && (
                <small className="d-block text-white">
                  Job Tilte: {messages[0].job_title}
                </small>
              )}
            </div>
          </CardHeader>

          <CardBody
            className="msg_card_body"
            ref={this.messagesContainerRef}
            style={{
              flex: "1 1 auto",
              overflowY: "auto",
              padding: "10px",
              minHeight: 0
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted p-3">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="messages-container">
                {messageGroups.map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`}>
                    {/* Date separator */}
                    <div className="text-center mb-2 mt-2">
                      <span className="bg-light px-3 py-1 rounded-pill small text-muted">
                        {group.date}
                      </span>
                    </div>

                    {/* Messages in this group */}
                    {group.messages.map((msg) => {
                      const isSender = parseInt(msg.senderId) === parseInt(senderId);
                      return (
                        <div
                          key={msg.id}
                          className={`d-flex ${isSender ? "justify-content-end" : "justify-content-start"
                            } mb-1`}
                        >
                          <div
                            className={`px-2 py-1 ${isSender
                              ? "bg-secondary text-white"
                              : "bg-secondary-subtle"
                              } rounded-3`}
                            style={{
                              maxWidth: "70%",
                              wordBreak: "break-word",
                              fontSize: "0.9rem",
                            }}
                          >
                            <div>{msg.message}</div>
                            <small
                              className={`d-block text-end ${isSender ? "text-white-50" : "text-muted"
                                }`}
                              style={{ fontSize: "0.65rem", lineHeight: 1 }}
                            >
                              {this.formatTime(msg.timestamp)}
                              {msg.temp && " ✓"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={this.messagesEndRef} />
              </div>
            )}
          </CardBody>

          <CardFooter className="p-3 bg-dark-subtle" style={{ width: "100%" }}>
            <Form onSubmit={this.handleSendMessage} style={{ width: "100%" }}>
              <div className="d-flex w-100 gap-2">
                <Input
                  type="textarea"
                  className="flex-grow-1"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) =>
                    this.setState({ newMessage: e.target.value })
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      this.handleSendMessage(e);
                    }
                  }}
                  rows="1"
                />
                <Button type="submit" style={{ background: "#0f2f31da" }}>
                  Send
                </Button>
              </div>
            </Form>
          </CardFooter>
        </Card>

        {/* Add custom CSS */}
        <style jsx>{`
          .message-card {
            height: 400px;
            display: flex;
            flex-direction: column;
          }
          
          .msg_card_body {
            flex: 1 1 auto;
            overflow-y: auto;
            min-height: 0;
          }
          
          .messages-container {
            display: flex;
            flex-direction: column;
          }
          
          /* Custom scrollbar styling */
          .msg_card_body::-webkit-scrollbar {
            width: 6px;
          }
          
          .msg_card_body::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          
          .msg_card_body::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }
          
          .msg_card_body::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </Container>
    );
  }
}

export default CandidateMessages;