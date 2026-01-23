import dynamic from "next/dynamic";
import jobs from "../../../../../data/job-featured";
import FooterDefault from "../../../../footer/common-footer";
import DefaulHeader from "../../../../header/DefaulHeader";

import MobileMenu from "../../../../header/MobileMenu";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Seo from "../../../../common/Seo";

import RelatedJobs from "../../../../job-single-pages/related-jobs/RelatedJobs";

import JobOverView from "../../../../job-single-pages/job-overview/JobOverView";
import JobSkills from "../../../../job-single-pages/shared-components/JobSkills";
import CompnayInfo from "../../../../job-single-pages/shared-components/CompanyInfo";
import MapJobFinder from "../../../../job-listing-pages/components/MapJobFinder";
import SocialTwo from "../../../../job-single-pages/social/SocialTwo";
import JobDetailsDescriptions from "../../../../job-single-pages/shared-components/JobDetailsDescriptions";
import ApplyJobModalContent from "../../../../job-single-pages/shared-components/ApplyJobModalContent";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";



// const router = useRouter();
// const { userId } = router.query;


const JobSingleDynamicV1 = () => {
  const {userId} = useSelector((state) => state.user);
  const router = useRouter();
  const {id} = router.query;

  const [jobDetails, setJobDetails] = useState(null);
  const [industry, setIndustry] = useState(null);
  // setJobDetails(data.jobDetails);
  // const industry = data.jobDetails[0]?.industry;
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // const response = await fetch(`http://localhost:8080/singlejob/${userId}/${id}`);
        const response = await fetch(`http://localhost:8080/singlejob/${id}`);
        if (response.ok) {
          const responseData = await response.json();
          setJobDetails(responseData.jobDetails);
          const industryFromDetails = responseData.jobDetails[0]?.industry;
          setIndustry(industryFromDetails);
        } else {
          console.error("Failed to fetch job details");
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      }
    };
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Invalid Date";
    }

    const date = new Date(dateString);
    if (isNaN(date)) {
      return "Invalid Date";
    }

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      // Remove timeZoneName from options
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
  };
  const [relatedJobs, setRelatedJobs] = useState([]);

  useEffect(() => {
    if (industry && jobDetails) {
      const fetchRelatedJobs = async () => {
        try {
          const response = await fetch(
            `http://localhost:8080/jobsByIndustry/${industry}/${id}`
          );
          
          const responseData = await response.json();
          
          setRelatedJobs(responseData.relatedJobs);
        } catch (error) {
          console.error("Error fetching related jobs:", error);
        }
      };

      fetchRelatedJobs();
    }
     
  }, [industry, jobDetails]);


  const [isModalOpen, setIsModalOpen] = useState(true);
  const handleApplyClick = () => {
   
    console.log("clickeddddddddddddddddd")
    setIsModalOpen(true);
  };
  // <a
  //   href="#"
  //   className="theme-btn btn-style-six call-modal"
  //   data-bs-toggle="modal"
  //   data-bs-target="#loginPopupModal"
  // >
  //   Login /Register
  // </a>;
          
  return (
    <>
      <Seo pageTitle="Job Single Dyanmic V1" />

      {/* <!-- Header Span --> */}
      <span className="header-span"></span>

      {/* <DefaulHeader /> */}
      {/* <!--End Main Header --> */}

      <MobileMenu />
      {/* End MobileMenu */}

      {/* <!-- Job Detail Section --> */}
      <section className="job-detail-section">
        {jobDetails &&
          Array.isArray(jobDetails) &&
          jobDetails.map((job, index) => (
            <div className="upper-box">
              <div className="auto-container">
                <div className="job-block-seven">
                  <div className="inner-box" key={index}>
                    <div className="content">
                      <span className="company-logo">
                        {job.logo && (
                          <img
                            src={`data:image/${job.logoType};base64,${job.logo}`}
                            alt="Company Logo"
                          />
                        )}
                      </span>
                      <h4>{job.job_title}</h4>

                      <ul className="job-info">
                        <li>
                          <span className="icon flaticon-briefcase"></span>
                          {job.industry}
                        </li>
                        {/* compnay info */}
                        <li>
                          <span className="icon flaticon-map-locator"></span>
                          {job.city}
                        </li>
                        {/* location info */}
                        <li>
                          <span className="icon flaticon-clock-3"></span>{" "}
                          {formatDate(job.application_deadline)}
                        </li>
                        {/* time info */}
                        <li>
                          <span className="icon flaticon-money"></span>{" "}
                          {job.salary}
                        </li>
                        {/* salary info */}
                      </ul>
                      {/* End .job-info */}

                      <ul className="job-other-info">
                        {
                          Array.isArray(job.job_type) ? (
                            job.job_type.map((val, i) => (
                              <li key={i} className={`${val.styleClass}`}>
                                {val.type}
                              </li>
                            ))
                          ) : (
                            <li>{job.job_type}</li>
                          ) // Render the non-array value differently
                        }
                      </ul>
                      {/* End .job-other-info */}
                    </div>
                    {/* End .content */}

                    <div className="btn-box">
                      {/* <a
                        href="#"
                        className="theme-btn btn-style-one"
                        data-bs-toggle="modal"
                        data-bs-target="#applyJobModal"
                        // onClick={handleApplyClick}
                      >
                        Apply For Job
                      </a> */}
                      <a
                        href="#"
                        className="theme-btn btn-style-one"
                        data-bs-toggle="modal"
                        data-bs-target="#applyJobModal"
                        onClick={handleApplyClick}
                        
                      >
                        Apply For Job
                      </a>

                      <button className="bookmark-btn">
                        <i className="flaticon-bookmark"></i>
                      </button>
                    </div>
                    {/* End apply for job btn */}

                    {/* <!-- Modal --> */}
                    {isModalOpen && (
                      <div
                        className="modal fade"
                        id="applyJobModal"
                        tabIndex="-1"
                        aria-hidden="true"
                      >
                        {/* <div className="modal fade show" tabIndex="-1"> */}
                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                          <div className="apply-modal-content modal-content">
                            <div className="text-center">
                              <h3 className="title">Apply for this job</h3>
                              <button
                                type="button"
                                className="closed-modal"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => setIsModalOpen(false)} // Close the modal when clicked
                              ></button>
                            </div>
                            {/* End modal-header */}

                            <ApplyJobModalContent />
                            {/* End PrivateMessageBox */}
                          </div>
                          {/* End .send-private-message-wrapper */}
                        </div>
                      </div>
                    )}
                    {/* End .modal */}
                  </div>
                </div>
                {/* <!-- Job Block --> */}
              </div>
            </div>
          ))}

        {/* <!-- Upper Box --> */}

        <div className="job-detail-outer">
          <div className="auto-container">
            <div className="row">
              <div className="content-column col-lg-8 col-md-12 col-sm-12">
                <JobDetailsDescriptions jobDetails={jobDetails} />

                {/* End jobdetails content */}

                {/* <div className="other-options">
                  <div className="social-share">
                    <h5>Share this job</h5>
                    <SocialTwo />
                  </div>
                </div> */}
                {/* <!-- Other Options --> */}

                <div className="related-jobs">
                  <div className="title-box">
                    <h3>Related Jobs</h3>
                    <div className="text">
                      {/* 2020 jobs live - 293 added today. */}
                    </div>
                  </div>
                  {/* End title box */}

                  {/* <RelatedJobs industry={industry} /> */}
                  {/* {Array.isArray(relatedJobs) && */}
                  {relatedJobs.map((relatedItem) => (
                    <div key={relatedItem.id}>
                      <div className="job-block" key={relatedItem.id}>
                        <div className="inner-box">
                          <div className="content">
                            <span className="company-logo">
                              <Image
                                width={50}
                                height={49}
                                src={`data:image/${relatedItem.logoType};base64,${relatedItem.logo}`}
                                alt="item brand"
                              />
                            </span>
                            <h4>
                              <Link href={`/job-single-v1/${relatedItem.id}`}>
                                {relatedItem.job_title}
                              </Link>
                            </h4>

                            <ul className="job-info">
                              <li>
                                <span className="icon flaticon-briefcase"></span>
                                {relatedItem.industry}
                              </li>
                              <li>
                                <span className="icon flaticon-map-locator"></span>
                                {relatedItem.city}
                              </li>
                              <li>
                                <span className="icon flaticon-clock-3"></span>{" "}
                                {formatDate(relatedItem.application_deadline)}
                              </li>
                              <li>
                                <span className="icon flaticon-money"></span>{" "}
                                {relatedItem.salary}
                              </li>
                            </ul>

                            <ul className="job-other-info">
                              {Array.isArray(relatedItem.job_type) ? (
                                relatedItem.job_type.map((val, i) => (
                                  <li key={i} className={`${val.styleClass}`}>
                                    {val.type}
                                  </li>
                                ))
                              ) : (
                                <li>{relatedItem.job_type}</li>
                              )}
                            </ul>

                            <button className="bookmark-btn">
                              <span className="flaticon-bookmark"></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* <!-- Related Jobs --> */}
              </div>
              {/* End .content-column */}

              <div className="sidebar-column col-lg-4 col-md-12 col-sm-12">
                <aside className="sidebar">
                  <div className="sidebar-widget">
                    {/* <!-- Job Overview --> */}
                    <h4 className="widget-title">Job Overview</h4>
                    <JobOverView jobDetails={jobDetails} />

                    {/* <!-- Map Widget --> */}
                    {/* <h4 className="widget-title mt-5">Job Location</h4>
                    <div className="widget-content">
                      <div className="map-outer">
                        <div style={{ height: "300px", width: "100%" }}>
                          <MapJobFinder />
                        </div>
                      </div>
                    </div> */}
                    {/* <!--  Map Widget --> */}
                    <br />
                    <h4 className="widget-title">Job Skills</h4>
                    <div className="widget-content">
                      <JobSkills jobDetails={jobDetails} />
                      {/* <ul className="job-skills">
      {skills.map((skill, i) => (
        <li key={i}>
          <a href="#">{skill}</a>
        </li>
      ))}
    </ul> */}
                    </div>
                    {/* <!-- Job Skills --> */}
                  </div>
                  {/* End .sidebar-widget */}

                  {/* <div className="sidebar-widget company-widget">
                    <div className="widget-content">
                      <div className="company-title">
                        <div className="company-logo">
                          {/* <img src={company.logo} alt="resource" /> */}
                  {/* </div>
                        <h5 className="company-name">{company.company}</h5>
                        <a href="#" className="profile-link">
                          View company profile
                        </a>
                      </div> */}
                  {/* End company title */}

                  {/* <CompnayInfo /> */}

                  {/* <div className="btn-box">
                        <a
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="theme-btn btn-style-three"
                        >
                          {company?.link}
                        </a>
                      </div> */}
                  {/* End btn-box */}
                  {/* </div>
                  </div> */}
                  {/* End .company-widget */}
                </aside>
                {/* End .sidebar */}
              </div>
              {/* End .sidebar-column */}
            </div>
          </div>
        </div>

        {/* <!-- job-detail-outer--> */}
      </section>
      {/* <!-- End Job Detail Section --> */}

      <FooterDefault footerStyle="alternate5" />
      {/* <!-- End Main Footer --> */}
    </>
  );
};

export default dynamic(() => Promise.resolve(JobSingleDynamicV1), {
  ssr: false,
});
