import React, { useState, useEffect, useRef } from "react";
import { useLayoutEffect } from "react";

const SenderMessages = ({ receiverId, receiverName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const userId = sessionStorage.getItem("userId");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (receiverId) fetchMessages(userId, receiverId);
  }, [receiverId, userId]);


  const fetchMessages = async (userId, otherUserId) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}message/getAllmessages/${userId}/${otherUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!receiverId) return;

    if (newMessage.trim() === "") return;

    const newMessageObj = {
      senderId: userId,
      receiverId: receiverId,
      message: newMessage,
    };

    try {
      const response = await fetch(`${apiBaseUrl}message/sendmessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessageObj),
      });

      if (response.ok) {
        const data = await response.json();

        setMessages((prev) => [...prev, data.savedMessage]);
        setNewMessage("");
      }

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  useLayoutEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 5;

    if (isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);




  return (
    <div className="chat-box-container">
      <div className="card message-card">
        <div className="card-header msg_head">
          <div className="user_info">
            <span>Receiver: {receiverName || "Select a contact"}</span>
          </div>
        </div>

        <div className="card-body msg_card_body">
          {messages.map((msg) => {
            const isSender = String(msg.senderId) === String(userId);

            return (
              <div
                key={msg.id}
                className={`msg_cotainer ${isSender ? "msg_sent" : "msg_receive"}`}
              >
                <div className="msg_text">
                  {msg.message}
                </div>

                <div className="msg_time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="card-footer">
          <form onSubmit={handleMessageSubmit}>
            <textarea
              className="form-control type_msg"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            ></textarea>
            <button type="submit" className="btn btn-primary mt-2">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SenderMessages;
