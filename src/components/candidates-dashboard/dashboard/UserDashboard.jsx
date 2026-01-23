"use client"

// import React from 'react';
import React, { useState, useEffect } from "react"; // Import React once
import { useRouter } from "next/navigation";
import BreadCrumb from "../../BreadCrumb";
import TopCardBlock from "./components/TopCardBlock";
import ProfileChart from "./components/ProfileChart";
import Notification from "./components/Notification";
import CopyrightFooter from "../../CopyrightFooter";
import JobApplied from "./components/JobApplied";
import MenuToggler from "../../MenuToggler";
import JobTrackingChart from "./components/jobTrackingChart";
import axios from 'axios';
import { useSelector } from "react-redux";

const Index = () => { 
  const router = useRouter();
  
  const [cardContent, setCardContent] = useState([]);
  const [data, setData] = useState([]);

  const { userId } = useSelector((state) => state.user);
 
  useEffect(() => {
    if(!userId) return;
    // Clear the existing data before fetching new data
    setData(prevState => []);
    setCardContent(prevState => []);

    // Define functions to fetch data from each API endpoint
    const fetchAppliedJobsCount = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/applications/jobCount/${userId}`);
            setData(prevState => [...prevState, { id: 1, name: "Applied Jobs", value: response.data.count, color: "#16a34a"}]);
            setCardContent(prevState => [...prevState, { id: 1, countNumber: response.data.count, metaName: "Applied Jobs", icon: "flaticon-briefcase", uiClass: "ui-blue" , link: "/candidates-dashboard/applied-jobs/"}]);
        } catch (error) {
            console.error('Error fetching applied jobs count:', error);
        }
    };

    const fetchJobAlertsCount = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/applications/alertCount/${userId}`);
        setData(prevState => [...prevState, { id: 2, name: "New Jobs", value: response.data.count, color: "#dc2626" }]);
        setCardContent(prevState => [...prevState, { id: 2, countNumber: response.data.count, metaName: "Job Alerts",  icon: "la-file-invoice", uiClass: "ui-red", link: "/candidates-dashboard/job-alerts/" }]);
      } catch (error) {
        console.error('Error fetching job alerts count:', error);
      }
    };

      const fetchSavedJobsCount = async () => {
          try {
              const response = await axios.get(`http://localhost:8080/savedjobscount/${userId}`);
              setData(prevState => [...prevState, {id: 3, name: "Saved Jobs", value: response.data.count, color: "#eab308"}]);
              setCardContent(prevState => [...prevState, { id: 3, countNumber: response.data.count, metaName: "Saved Jobs",  icon: "la-bookmark-o", uiClass: "ui-green" , link: "/candidates-dashboard/short-listed-jobs/"}]);
          } catch (error) {
              console.error('Error fetching job alerts count:', error);
          }
      };

      const fetchMessagesCount = async () => {
          try {
            const response = await axios.get(`http://localhost:8080/contacts/unread-count/${userId}`);
            setData(prevState => [...prevState, {id: 4, name: "Open Jobs", value: response.data.unreadCount, color: "#2563eb"}])
            setCardContent(prevState => [...prevState, { id: 4, countNumber: response.data.unreadCount, metaName: "New Messages",  icon: "la-comment-o", uiClass: "ui-yellow", link: "/candidates-dashboard/messages/" }]);
          } catch (error) {
              console.error('Error fetching job alerts count:', error);
          }
      };

      // Call the fetchData function
      fetchAppliedJobsCount();
      fetchJobAlertsCount();
      fetchSavedJobsCount();
      fetchMessagesCount();
     
  }, [userId]);

  return (
      <section className="user-dashboard">
        <div className="dashboard-outer">
          <BreadCrumb />
          {/* breadCrumb */}

          {/* <MenuToggler /> */}
          {/* Collapsible sidebar button */}

          <div className="row">
            <TopCardBlock cardContent={cardContent} />
          </div>
          {/* End .row top card block */}

          <div className="row">
            <div className="col-xl-7 col-lg-12">
              {/* <!-- Graph widget --> */}
              <div className="graph-widget ls-widget">
                <JobTrackingChart data={data} />
                {/* <ProfileChart /> */}
              </div>
              {/* End profile chart */}
            </div>
            {/* End .col */}

            <div className="col-xl-5 col-lg-12">
              {/* <!-- Notification Widget --> */}
              <div className="notification-widget ls-widget">
                <div className="widget-title">
                  <h4>Notifications</h4>
                </div>
                <div className="widget-content">
                  {/* <Notification /> */}
                  <Notification />  
                </div>
              </div>
            </div>
            {/* End .col */}

            <div className="col-lg-12">
              {/* <!-- applicants Widget --> */}
              <div className="applicants-widget ls-widget">
                <div className="widget-title">
                  <h4>Jobs Applied Recently</h4>
                </div>
                <div className="widget-content">
                  <div className="row">
                    {/* <!-- Candidate block three --> */}

                    <JobApplied />
                  </div>
                </div>
              </div>
            </div>
            {/* End .col */}
          </div>
          {/* End .row profile and notificatins */}
        </div>
        {/* End dashboard-outer */}
      </section>
  );
};

export default Index;
