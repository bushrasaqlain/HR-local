import React, { useState, useEffect } from "react";
import Image from "next/image";

const ChatboxContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const userId = sessionStorage.getItem("userId");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}message/contacts/${userId}`);
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
               
                <div className="user_info">
                  <span>{contact.full_name}</span>
                  <p>Message: {contact.last_message} </p>
                </div>
                <div>
                <span className="info" style={{ fontSize: '13px' }}>Date: {formatTime(contact.last_message_time)}</span>
              </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

    </div>
  );
};
export default ChatboxContactList;
