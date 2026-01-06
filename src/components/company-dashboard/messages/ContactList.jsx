import React, { useState, useEffect } from "react";
import Image from "next/image";

const ChatboxContactList = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`http://localhost:8080/contacts/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
        console.log(data);
      } else {
        console.error("Failed to fetch contacts:", response.statusText);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const handleChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchValue(searchTerm);
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.full_name.toLowerCase().includes(searchValue)
  );

  return (
    <div className="search-box-one">
      {/* Search Box */}
      <form method="post" action="#">
        <div className="form-group  mx-3">
          <span className="icon flaticon-search-1"></span>
          <input
            type="search"
            name="search-field"
            placeholder="Search"
            value={searchValue}
            autoComplete="off"
            onChange={handleChange}
            required=""
          />
        </div>
      </form>

      {/* Contact List */}
      <ul className="contacts">
  {filteredContacts.map((contact) => (
    <li key={contact.id}>
      <a href="#">
        <div className="d-flex bd-highlight">
          <div className="img_cont">
            <img
              src={contact.Image} 
              className="rounded-circle user_img"
              alt="chatbox avatar"
              width={90}
              height={90}
            />
          </div>
          <div className="user_info">
            <span>{contact.full_name}</span>
            <p>{contact.last_message} </p>
          </div>
          <span className="info" style={{ fontSize: '13px' }}>{formatTime(contact.last_message_time)}</span>
        </div>
      </a>
    </li>
  ))}
</ul>

    </div>
  );
};
export default ChatboxContactList;
