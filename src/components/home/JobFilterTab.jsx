"use client"

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import axios from "axios";

const JobFilterTab = () => {
  const [selectedJobType, setSelectedJobType] = useState(null); // industry/tab
  const [selectedJobMode, setSelectedJobMode] = useState("");   // Freelancer | Full time | Part-time

  const [jobListings, setJobListings] = useState([]);
  const [jobPostsResults, setJobPostsResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState([]);

  const [tabs, setTabs] = useState([
    { id: 1, name: "All", isActive: true },
    { id: 2, name: "Pathologist", isActive: false },
    { id: 3, name: "Histotechnologist", isActive: false },
    { id: 4, name: "Cytotechnologist", isActive: false },
    { id: 5, name: "Medical Laboratory Technician", isActive: false },
    { id: 6, name: "Pathology Assistant", isActive: false },
    { id: 7, name: "Clinical Pathologist", isActive: false },
    { id: 8, name: "Health", isActive: false },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/alljobposts');
        
        setJobPostsResults(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error('Error fetching job listings:', error);
      }
    };
    //fetchData();
  }, []);

  // apply filters whenever tab or dropdown changes
  useEffect(() => {
    let data = jobPostsResults;

    if (selectedJobType && selectedJobType !== 1) {
      data = data.filter((job) => job.industry_id === selectedJobType);
    }

    if (selectedJobMode) {
      data = data.filter((job) => job.job_type === selectedJobMode);
    }

    setFilteredData(data);
    setCurrentPage(1);
  }, [selectedJobType, selectedJobMode, jobPostsResults]);

  // Pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * 5;
    const indexOfFirstItem = indexOfLastItem - 5;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    setJobListings(currentItems);
  }, [currentPage, filteredData]);

  const tabHandler = (id) => {
    setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.id === id })));
    setSelectedJobType(id === 1 ? null : id);
  };

  const handleJobModeChange = (e) => {
    setSelectedJobMode(e.target.value);
  };
  const timeAgo = (dateString) => {
    const date = new Date(dateString); // UTC date
    const now = new Date();

    // Difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'just now'; // future dates

    const seconds = Math.floor(diffMs / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  };


  return (
    <>
      <ul className="tab-buttons" style={{ display: "flex" }}>
        <li className="tab-btn" style={{ marginRight: "12px" }}>
          <select
            value={selectedJobMode}
            onChange={handleJobModeChange}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0"
            }}
          >
            <option value="">All Types</option>
            <option value="freelancer">Freelancer</option>
            <option value="Full time">Full time</option>
            <option value="Part-time">Part-time</option>
          </select>
        </li>

        {tabs.map((tab) => (
          <li
            key={tab.id}
            onClick={() => tabHandler(tab.id)}
            className={`${tab.isActive ? "active-btn" : ""} tab-btn`}
          >
            {tab.name}
          </li>
        ))}
      </ul>

      <div className="tab active-tab" data-aos="fade-up">
        <div className="row">
          {jobListings.map((item) => (
            <div className="job-block col-lg-6 col-md-12 col-sm-12" key={item.id}>
              <div className="inner-box">
                <div className="content">
                  <span className="company-logo">
                    <img
                      width={50}
                      height={50}
                      src={`data:image/${item.logoType};base64,${item.Image}`}
                      alt="item brand"
                    />
                  </span>
                  <h4><Link href={`/job-single-v1/${item.id}`}>{item.job_title}</Link></h4>

                  <ul className="job-info">
                    <li><span className="icon flaticon-briefcase"></span>{item.industry}</li>
                    <li><span className="icon flaticon-map-locator"></span>{item.city}</li>
                    <li>
                      <span className="icon flaticon-clock-3"></span>
                      {timeAgo(item.current_date_time)}
                    </li>
                    <li><span className="icon flaticon-money"></span>{item.salary}</li>
                  </ul>

                  {Array.isArray(item.job_type) ? (
                    <ul className="job-other-info">
                      {item.job_type.map((val, i) => (
                        <li key={i} className={`${val.styleClass}`}>{val.type}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.job_type}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </>
  );
};

export default JobFilterTab;
