import MessagesList from "./messagesList";
import SenderMessages from "./senderMessages";
import { useState } from "react";

const ChatBox = () => {
  const userId = sessionStorage.getItem("userId");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContactName, setSelectedContactName] = useState("");

  return (
    <div className="row">
      <div className="contacts_column col-xl-4 col-lg-5 col-md-12 col-sm-12 chat" id="chat_contacts">
        <div className="card contacts_card">
          <div className="card-header">
            <div className="card-body contacts_body">
              <MessagesList
                onSelectContact={(contactId, contactName) => {
                  setSelectedContactId(contactId);
                  setSelectedContactName(contactName);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-8 col-lg-7 col-md-12 col-sm-12 chat">
        <SenderMessages
          userId={userId}
          receiverId={selectedContactId}
          receiverName={selectedContactName}
        />
      </div>
    </div>
  );
};

export default ChatBox;
