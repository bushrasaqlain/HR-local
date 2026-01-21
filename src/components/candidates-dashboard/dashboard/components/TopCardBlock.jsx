import Link from 'next/link';
import React, { useState, useEffect } from 'react';


const TopCardBlock = ({cardContent}) => {
  
  // const cardContent = [
  //   {
  //     id: 1,
  //     icon: "flaticon-briefcase",
  //     countNumber: "22",
  //     metaName: "Applied Jobs",
  //     uiClass: "ui-blue",
  //   },
  //   {
  //     id: 2,
  //     icon: "la-file-invoice",
  //     countNumber: "9382",
  //     metaName: "Job Alerts",
  //     uiClass: "ui-red",
  //   },
  //   {
  //     id: 3,
  //     icon: "la-comment-o",
  //     countNumber: "74",
  //     metaName: "Messages",
  //     uiClass: "ui-yellow",
  //   },
  //   {
  //     id: 4,
  //     icon: "la-bookmark-o",
  //     countNumber: "32",
  //     metaName: "Shortlist",
  //     uiClass: "ui-green",
  //   },
  // ];
 
  //   const [cardContent, setCardContent] = useState([]);
  
  //   useEffect(() => {
  //     // Clear the existing card content before fetching new data
  //     setCardContent(prevState => []);

  //     // Define functions to fetch data from each API endpoint
  //     const fetchAppliedJobsCount = async () => {
  //         try {
  //             const response = await axios.get(`http://localhost:8080/applications/jobCount/${userId}`);
  //             setCardContent(prevState => [...prevState, {  id: 1, countNumber: response.data.count, metaName: "Applied Jobs", icon: "flaticon-briefcase", uiClass: "ui-blue" }]);
  //         } catch (error) {
  //             console.error('Error fetching applied jobs count:', error);
  //         }
  //     };

  //     const fetchJobAlertsCount = async () => {
  //         try {
  //             const response = await axios.get(`http://localhost:8080/applications/alertCount/${userId}`);
  //             setCardContent(prevState => [...prevState, { id: 2, countNumber: response.data.count, metaName: "Job Alerts",  icon: "la-file-invoice", uiClass: "ui-red" }]);
  //         } catch (error) {
  //             console.error('Error fetching job alerts count:', error);
  //         }
  //     };

  //     const fetchSavedJobsCount = async () => {
  //         try {
  //             const response = await axios.get(`http://localhost:8080/savedjobscount/${userId}`);
  //             setCardContent(prevState => [...prevState, { id: 3, countNumber: response.data.count, metaName: "Saved Jobs",  icon: "la-bookmark-o", uiClass: "ui-green" }]);
  //         } catch (error) {
  //             console.error('Error fetching job alerts count:', error);
  //         }
  //     };

  //     const fetchMessagesCount = async () => {
  //         try {
  //             const response = await axios.get(`http://localhost:8080/contacts/unread-count/${userId}`);
  //             setCardContent(prevState => [...prevState, { id: 4, countNumber: response.data.unreadCount, metaName: "New Messages",  icon: "la-comment-o", uiClass: "ui-yellow" }]);
  //         } catch (error) {
  //             console.error('Error fetching job alerts count:', error);
  //         }
  //     };

  //     // Call the fetchData function
  //     fetchAppliedJobsCount();
  //     fetchJobAlertsCount();
  //     fetchSavedJobsCount();
  //     fetchMessagesCount();
      
  // }, [userId]);
  
  return (
    <>
      {cardContent.map((item) => (
        <div
          className="ui-block col-xl-3 col-lg-6 col-md-6 col-sm-12"
          key={item.id}
        ><Link href={item.link}>
          <div className={`ui-item ${item.uiClass}`}>
            
              <div className="left">
                <i className={`icon la ${item.icon}`}></i>
              </div>
              <div className="right">
                <h4>{item.countNumber}</h4>
                <p>{item.metaName}</p>
              </div>
           
          </div> </Link>
        </div>
      ))}
    </>
  );
};

export default TopCardBlock;
