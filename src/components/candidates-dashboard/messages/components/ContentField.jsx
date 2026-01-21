import React, { useState, useEffect } from "react";
import ChatHamburger from "../../../employers-dashboard/messages/components/ChatHamburger";

const ChatBoxContentField = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [senderId, setSenderId] = useState(null); // Initialize senderId as null

  const receiverId = 1; // Assuming receiverId is constant for now

  useEffect(() => {
    setSenderId(userId); 
    fetchReceiverName(receiverId);
    fetchMessages(userId, receiverId);
  }, [userId, receiverId]);
  
  
  const fetchReceiverName = async (receiverId) => {
    try {
      const response = await fetch(`http://localhost:8080/receiver-name/${receiverId}`, {
        method: 'GET',
      });
  
      if (response.ok) {
        const responseData = await response.json();
        setReceiverName(responseData.receiverName);
      } else {
        console.error('Failed to fetch receiver name:', response.statusText);
        setReceiverName('Receiver Name'); // Set a default name or handle the error as per your requirement
      }
    } catch (error) {
      console.error('Network error:', error);
      setReceiverName('Receiver Name'); // Set a default name or handle the error as per your requirement
    }
  };
  
  
  const fetchMessages = async (userId, otherUserId) => {
    try {
      const response = await fetch(`http://localhost:8080/messages/${userId}/${otherUserId}`, {
        method: 'GET', 
      });
  
      if (response.ok) {
        const responseData = await response.json();
        setMessages(responseData);
      } else {
        console.error('Failed to fetch messages:', response.statusText);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };
  
  

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() !== "") {
      const today = new Date();
      const newMessageObj = {
        senderId: senderId,
        receiverId: 1,
        text: newMessage,
      };
      try {
        const response = await fetch('http://localhost:8080/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessageObj),
        });
  
        if (response.ok) {
          const responseData = await response.json();
          const savedMessage = responseData.savedMessage;
          setMessages([...messages, savedMessage]); // Update messages state with the new message
          setNewMessage(""); // Clear the input field after sending the message
        } else {
          console.error('Failed to send message:', response.statusText);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    }
  };
  

  const handleDeleteConversation = () => {
    setMessages([]);
  };

  
  let lastDisplayedLabel = null;

  const getMessageDate = (timestamp) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
  
    const messageDate = new Date(timestamp);
  
    // Check if messageDate is today
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }
    // Check if messageDate is yesterday
    else if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return messageDate.toDateString();
    }
  };
  
const getFormattedTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

  return (
    <div className="chat-box-container">
      <style>{`
        .message-date {
          padding: 5px;
          margin: 10px 0;
        }
      `}</style>
      <div className="card message-card" >
        <div className="card-header msg_head">
          <div className="d-flex bd-highlight">
            <div className="user_info">
            <span>{receiverName}</span>
              {/* <p>Active</p> */}
            </div>
          </div>
          <div className="btn-box">
            <button className="dlt-chat" onClick={handleDeleteConversation}>
              Delete Conversation
            </button>
            <ChatHamburger />
          </div>
        </div>
        <div className="card-body msg_card_body">
{messages.map((msg, index) => {
  // Get the message date
  const messageDate = getMessageDate(msg.timestamp);

  // Check if the current message date matches the last displayed label
  const displayLabel = lastDisplayedLabel !== messageDate;

  // Update the last displayed label
  lastDisplayedLabel = messageDate;

  return (
    <React.Fragment key={msg.id}>
      {/* Display the date label if it's different from the last displayed label */}
      {displayLabel && (
        <div className="message-date d-flex justify-content-center align-items-center">
          <div className="bg-primary rounded text-white text-bold px-3 py-1">
            {messageDate}
          </div>
        </div>
      )}
      {/* Display the message */}
      <div className={`d-flex justify-content-${msg.senderId === senderId ? 'end' : 'start'} mb-2`} key={msg.id}>
        <div className={`msg_cotainer ${msg.senderId === senderId ? 'msg_sent' : 'msg_receive'}`} style={{ backgroundColor: msg.senderId === senderId ? 'lightblue' : 'lightgrey', paddingTop:'5px',paddingBottom:'5px' }}>{msg.message}</div>
        <div className="msg_time" style={{ fontSize: '12px' }}>
          {getFormattedTime(msg.timestamp)}
        </div>
      </div>
    </React.Fragment>
  );
})}


        </div>
        <div className="card-footer">
          <div className="form-group mb-0">
            <form onSubmit={handleMessageSubmit}>
              <textarea
                className="form-control type_msg"
                placeholder="Type a message..."
                required
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              ></textarea>
              <button
                type="submit"
                className="theme-btn btn-style-one submit-btn"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBoxContentField;
