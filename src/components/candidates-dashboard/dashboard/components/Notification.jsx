import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Notification = () => {
  const {userId} = useSelector((state) => state.user);
  const [newMessages, setNewMessages] = useState([]);
  const [newJobs, setNewJobs] = useState([]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/unread-senders/${userId}`);
        setNewMessages(response.data);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    }

    const fetchNewJobs = async () => {
      try {
        const response = await axios.get("http://localhost:8080/NewJobs");
        setNewJobs(response.data);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    }

    fetchUnreadMessages();
    fetchNewJobs();
  }, [userId])

  return (
    <ul className="notification-list">
      {newMessages.map((message, index) => (
        <li key={index} className={index % 2 === 0 ? "success": ""}>
          <span className="icon flaticon-briefcase"></span>
          <strong>New message</strong> recieved from 
          <span className="colored"> {message.full_name}</span>
        </li>
      ))}
      {newJobs.map((job, index) => (
        <li key={index} className={index % 2 === 0 ? "success": ""}>
          <span className="icon flaticon-briefcase"></span>
          <strong>A New Job Opening</strong> for a 
          <span className="colored"> {job.job_title}</span>
        </li>
      ))}
      
    </ul>
  );
};

export default Notification;
