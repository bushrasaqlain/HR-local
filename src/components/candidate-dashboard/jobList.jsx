"use client"
import Link from "next/link.js";
import { useState, useEffect } from "react";
import axios from "axios";
import api from "../../../lib/api";

const JobListings = () => {
  const [jobApplications, setJobApplications] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]); // For displaying filtered results
  const [selectedFilter, setSelectedFilter] = useState("This Month"); // Default filter

  useEffect(() => {
     const userId = sessionStorage.getItem("userId");
     const token = localStorage.getItem("token");
     
        
    const fetchJobApplications = async () => {
      try {
         const res = await api.get(`/candidateProfile//user-applications/${userId}`, {
             headers: { Authorization: `Bearer ${token}` },
           });
        
        setJobApplications(response.data.jobDetails);
      } catch (error) {
        console.error("Error fetching job applications:", error);
      }
    };
    //******************************************* */
    fetchJobApplications();
  }, [])


  // Function to filter jobs based on selected date range
  useEffect(() => {
    const filterJobs = () => {
      const now = new Date();
      let startDate = null;
      let endDate = null; // Define an end date for Last Year

      switch (selectedFilter) {
        case "Today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "This Week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay())); // Start of the week
          break;
        case "This Month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
          break;
        case "This Year":
          startDate = new Date(now.getFullYear(), 0, 1); // Start of this year
          break;
        case "Last Year":
          startDate = new Date(now.getFullYear() - 1, 0, 1); // Start of last year
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59); // End of last year
          break;
        default:
          startDate = null;
          endDate = null;
      }

      // Apply filtering logic
      const filtered = jobApplications.filter((job) => {
        const appliedDate = new Date(job.created_at);

        if (selectedFilter === "Last Year") {
          return appliedDate >= startDate && appliedDate <= endDate;
        } else {
          return appliedDate >= startDate;
        }
      });

      setFilteredJobs(filtered);
    };

    filterJobs();
  }, [selectedFilter, jobApplications]);

  return (
    <div className="tabs-box">
      <div className="widget-title">
        <h4>My Applied Jobs</h4>

        <div className="chosen-outer">
          {/* Dropdown for filters */}
          <select
            className="chosen-single form-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* Start table widget content */}
      <div className="widget-content">
        <div className="table-outer">
          <table className="default-table manage-job-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Criteria</th>
                <th>Date Applied</th>
                <th>Date Created</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((item) => (
                  <tr key={item.job_id}>
                    <td>
                      <div className="job-block">
                        <div className="inner-box">
                          <div className="content">
                            <span className="company-logo">
                              <img
                                alt="logo"
                                src={`data:image/png;base64,${item.Image}`}
                                width="50"
                                height="50"
                              />
                            </span>
                            <h4>
                              {/* <a href={`/job-single-v1/${item.job_id}/${userId}`}> */}
                              <a href={`/job-single-v1/${item.job_id}/`}>
                                {item.job_title}
                              </a>
                            </h4>
                            <ul className="job-info">
                              <li>
                                <span className="icon flaticon-map-locator"></span>
                                {item.city}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{item.industry}, {item.job_type}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{new Date(item.current_date_time).toLocaleString()}</td>
                    <td>{new Date(item.application_deadline).toLocaleString()}</td>
                    <td>{item.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "red" }}>
                    No Applied Job Found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default JobListings;