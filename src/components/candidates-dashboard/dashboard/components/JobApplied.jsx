import { useState, useEffect } from "react";
import api from "../../../../../lib/api";
import { useSelector } from "react-redux";

const JobApplied = () => {
  const userId = useSelector((state) => state.user);
  const [jobApplications, setJobApplications] = useState([]);
  useEffect(() => {
    if(!userId) return;
    
    const fetchJobApplications = async () => {
      try {
        const response = await api.get(
          `http://localhost:8080/applications/`
         );
        setJobApplications(response.data.jobDetails);
        
        // Use the image as-is since it's already a base64 string
        setJobApplications(prevState =>
          prevState.map(item => ({
            ...item, Image: `data:image/png;base64,${item.Image}`
          }))
        );

      } catch (error) {
        console.error("Error fetching job applications:", error);
      }
    };
    //******************************************* */
    fetchJobApplications();
  }, []);

  return (
    <>
      {jobApplications.slice(0, 6).map((item) => (
        <div className="job-block col-lg-6 col-md-12 col-sm-12" key={item.id}>
          <div className="inner-box">
            <div className="content">
              <span className="company-logo">
                <img src={item.Image} alt="item brand" />
              </span>
              <h4>
                <a href={`/job-single-v1/${item.job_id}/`}>
                  {item.job_title}
                </a>              
              </h4>

              <ul className="job-info">
                <li>
                  <span className="icon flaticon-briefcase"></span>
                  {item.company_name}
                </li>
                {/* compnay info */}
                <li>
                  <span className="icon flaticon-map-locator"></span>
                  {item.city}
                </li>
                {/* location info */}
                <li>
                  <span className="icon flaticon-clock-3"></span>
                    { new Date(item.current_date_time).toISOString().split('T')[0] }
                </li>
                {/* time info */}
                <li>
                  <span className="icon flaticon-money"></span> {item.salary}
                </li>
                {/* salary info */}
              </ul>
              {/* End .job-info */}

              <ul className="job-other-info">
                <li className={`${item.job_type == "Urgent" ? "required": "time"}`}>
                  {item.job_type}
                </li>
                <li className="privacy">
                  {item.industry}
                </li>
                <li className="time">
                  {item.specialisms}
                </li>
              </ul>
              {/* End .job-other-info */}
            </div>
          </div>
        </div>
        // End job-block
      ))}
    </>
  );
};

export default JobApplied;
