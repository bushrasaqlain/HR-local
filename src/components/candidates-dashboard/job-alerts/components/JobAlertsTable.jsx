"use client"
import Link from "next/link.js";
import jobs from "../../../../../data/job-featured.js";
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import api from "../../../../../lib/api.js";

const JobAlertsTable = () => {
const [selectedFilter, setSelectedFilter] = useState("This Month"); // Default filter
const [filteredJobs, setFilteredJobs] = useState([]); // For displaying filtered results
const [jobPosts, setJobPosts] = useState([]);
const router = useRouter();

  useEffect(()=>{
    const fetchData = async () => {
      try {
        const response = await api.get(`http://localhost:8080/availablejobs/`);

        const fetchedJobPostsResults = response.data;
        setJobPosts(fetchedJobPostsResults);
      } catch (error) {
        console.error("Error fetching job listings:", error);
        // Handle error state or logging
      }
    };
    fetchData();
  }, [])
    

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
        const filtered = jobPosts?.jobDetails?.filter((job) => {
        const appliedDate = new Date(job.current_date_time);
        
        if (selectedFilter === "Last Year") {
          return appliedDate >= startDate && appliedDate <= endDate;
        } else {
          return appliedDate >= startDate;
        }
      });
  
      setFilteredJobs(filtered);
    };
  
    filterJobs();
  }, [selectedFilter, jobPosts]);

  return (
    <div className="tabs-box">
      <div className="widget-title">
        <h4>Available Jobs</h4>

        <div className="chosen-outer">
          {/* <!--Tabs Box--> */}
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
      {/* End filter top bar */}

      {/* Start table widget content */}
      <div className="widget-content">
        <div className="table-outer">
          <div className="table-outer">
            <table className="default-table manage-job-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Criteria</th>
                  <th>Created</th>
                  <th>Deadline</th>
                  <th>Specialism</th>
                  <th>Career</th>
                  <th>Salary</th>
                  <th>Experience</th>
                  <th>Gender</th>
                  <th>Qualification</th>
                  <th>Address</th>
                  {/* <th>Action</th> */}
                </tr>
              </thead>
              <tbody>
              {Array.isArray(filteredJobs) && filteredJobs.length > 0 ? (
                filteredJobs.map((item) =>(
                      <tr key={item.id}>
                        {/* logo */}
                        <td>
                          <div className="job-block">
                            <div className="inner-box">
                              <div className="content">
                                <span className="company-logo">
                                  {/* <img src={item.logo} alt="logo" /> */}
                                  <img
                                alt="logo"
                                src={`data:image/png;base64,${item.Image}`}
                                width="50"
                                height="50"
                              />
                                </span>

                                <h4>
                                  {/* {item.job_title} */}
                                  <Link
                                    // href={`/job-single-v1/${item.id}/${userId}`}
                                    href={`/job-single-v1/${item.id}/`}
                                  >
                                    {item.job_title}
                                  </Link>
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
                        <td>
                          {item.industry}, {item.job_type}
                        </td>
                        <td>
                          {new Date(item.current_date_time).toLocaleString()}
                        </td>
                        <td>
                          {new Date(item.application_deadline).toLocaleString()}
                        </td>
                        <td>{item.specialisms}</td>
                        <td>{item.career}</td>
                        <td>{item.salary}</td>
                        <td>{item.experience}</td>
                        <td>{item.gender}</td>
                        <td>{item.qualification}</td>
                        <td>{item.address}</td>
                        {/* <td>
                          <div className="option-box">
                            <ul className="option-list">
                              <li>
                                <Link href={`/job-single-v1/${item.id}/${userId}`}>
                                  <button data-text="View Application">
                                    <span className="la la-eye"></span>
                                  </button>
                                </Link>
                              </li>
                              <li>
                                <button data-text="Delete Application">
                                  <span className="la la-trash"></span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "red" }}>
                        No Job Found.
                      </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* End table widget content */}
    </div>
  );
};

export default JobAlertsTable;
