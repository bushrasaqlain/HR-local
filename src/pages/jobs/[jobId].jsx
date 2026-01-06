import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
// import ApplyJobModalContent from "../../components/job-single-pages/shared-components/ApplyJobModalContent";

const JobSingleDynamicV1 = () => {
  const router = useRouter();
  const { jobId: routerJobId, userId: routerUserId } = router.query;

  // Extract single values if arrays
  const jobId = Array.isArray(routerJobId) ? routerJobId[0] : routerJobId;
  const userId = Array.isArray(routerUserId) ? routerUserId[0] : routerUserId;

  const [jobDetails, setJobDetails] = useState(null);
  const [industry, setIndustry] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountType, setAccountType] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  // Fetch account type
  useEffect(() => {
    if (!userId) return;

    const fetchAccountType = async () => {
      try {
        const res = await fetch(`http://localhost:8080/getAccountType/${userId}`);
        const data = await res.json();
        setAccountType(data.accountType);
      } catch (err) {
        console.error("Error fetching account type:", err);
      }
    };

    fetchAccountType();
  }, [userId]);

  // Fetch job details
  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8080/singlejob/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch job details");
        const data = await res.json();

        setJobDetails(data.jobDetails);
        setIndustry(data.jobDetails[0]?.industry);

        // Check if user has applied
        if (userId) {
          const appRes = await fetch(`http://localhost:8080/user-applications/${userId}`);
          const appliedJobs = await appRes.json();
          setHasApplied(appliedJobs.includes(Number(jobId)));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchJobDetails();
  }, [jobId, userId]);

  // Fetch saved jobs
  useEffect(() => {
    if (!userId || !jobId) return;

    const checkSavedJob = async () => {
      try {
        const res = await fetch(`http://localhost:8080/checkingsavedjobs/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch saved jobs");
        const savedJobs = await res.json();
        setIsSaved(savedJobs.some((job) => Number(job.job_id) === Number(jobId)));
      } catch (err) {
        console.error(err);
      }
    };

    checkSavedJob();
  }, [userId, jobId]);

  // Save/unsave job
  const handleSaveJob = async () => {
    try {
      const res = await fetch("http://localhost:8080/savedjobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, account_id: userId }),
      });
      if (res.ok) setIsSaved(!isSaved);
      else console.error("Error saving/unsaving job");
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch related jobs
  useEffect(() => {
    if (!industry || !jobId) return;

    const fetchRelatedJobs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/jobsByIndustry/${industry}/${jobId}`);
        const data = await res.json();
        setRelatedJobs(data.relatedJobs || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRelatedJobs();
  }, [industry, jobId]);

  // Apply button click
  const handleApplyClick = () => {
    if (userId) setIsModalOpen(true);
  };

  // Pagination
  const jobsPerPage = 2;
  const totalPages = Math.ceil(relatedJobs.length / jobsPerPage);
  const paginatedJobs = relatedJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  return (
    <section className="job-detail-section">
      {jobDetails?.length > 0 && (
        <div className="upper-box">
          <div className="auto-container">
            {jobDetails.map((job, idx) => (
              <div className="job-block-seven" key={idx}>
                <div className="inner-box">
                  <div className="content">
                    <span className="company-logo">
                      {job.Image && (
                        <img
                          src={`data:image/${job.logoType};base64,${job.Image}`}
                          alt="Company Logo"
                          className="rounded-circle"
                        />
                      )}
                    </span>
                    <h4>{job.job_title}</h4>
                    <ul className="job-info">
                      <li>
                        <span className="icon flaticon-briefcase"></span>
                        {job.industry}
                      </li>
                      <li>
                        <span className="icon flaticon-map-locator"></span>
                        {job.city}
                      </li>
                      <li>
                        <span className="icon flaticon-clock-3"></span>{" "}
                        {formatDate(job.application_deadline)}
                      </li>
                      <li>
                        <span className="icon flaticon-money"></span> {job.salary}
                      </li>
                    </ul>
                    <ul className="job-other-info">
                      {Array.isArray(job.job_type)
                        ? job.job_type.map((val, i) => (
                            <li key={i} className={val.styleClass}>
                              {val.type}
                            </li>
                          ))
                        : job.job_type}
                    </ul>
                  </div>

                  {accountType === "candidate" && (
                    <div className="btn-box">
                      <a
                        href="#"
                        className={`theme-btn btn-style-one ${
                          hasApplied || job.status === "Inactive" ? "disabled" : ""
                        }`}
                        style={{
                          backgroundColor:
                            hasApplied || job.status === "Inactive" ? "gray" : "",
                          cursor:
                            hasApplied || job.status === "Inactive" ? "not-allowed" : "pointer",
                          opacity: hasApplied || job.status === "Inactive" ? 0.7 : 1,
                        }}
                        onClick={(e) => {
                          if (hasApplied || job.status === "Inactive") e.preventDefault();
                          else handleApplyClick();
                        }}
                      >
                        {hasApplied
                          ? "Already Applied"
                          : job.status === "Inactive"
                          ? "Job Inactive"
                          : "Apply For Job"}
                      </a>
                      <button
                        className="bookmark-btn"
                        style={{ background: isSaved ? "gray" : "" }}
                        onClick={handleSaveJob}
                      >
                        <i
                          className="flaticon-bookmark"
                          style={{ color: isSaved ? "yellow" : "" }}
                        ></i>
                      </button>
                    </div>
                  )}

                  {/* {isModalOpen && (
                    <div className="modal fade show" style={{ display: "block" }}>
                      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="apply-modal-content modal-content">
                          <div className="text-center">
                            <h3 className="title">Apply for this job</h3>
                            <button
                              type="button"
                              className="closed-modal"
                              onClick={() => setIsModalOpen(false)}
                            >
                              &times;
                            </button>
                          </div>
                          <ApplyJobModalContent userId={userId} id={jobId} />
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <div className="related-jobs">
          <div className="title-box">
            <h3>Related Jobs</h3>
          </div>
          {paginatedJobs.map((relatedJob) => (
            <div className="job-block" key={relatedJob.id}>
              <div className="inner-box">
                <div className="content">
                  <span className="company-logo">
                    <Image
                      width={50}
                      height={50}
                      src={`data:image/${relatedJob.logoType};base64,${relatedJob.Image}`}
                      alt="Company Logo"
                      className="rounded-circle"
                    />
                  </span>
                  <h4>
                    <a href={`/job-single-v1/${relatedJob.id}/${userId}`}>
                      {relatedJob.job_title}
                    </a>
                  </h4>
                  <ul className="job-info">
                    <li>
                      <span className="icon flaticon-briefcase"></span>
                      {relatedJob.industry}
                    </li>
                    <li>
                      <span className="icon flaticon-map-locator"></span>
                      {relatedJob.city}
                    </li>
                    <li>
                      <span className="icon flaticon-clock-3"></span>{" "}
                      {formatDate(relatedJob.application_deadline)}
                    </li>
                    <li>
                      <span className="icon flaticon-money"></span> {relatedJob.salary}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <nav className="ls-pagination mb-5">
            <ul>
              <li className={currentPage === 1 ? "disabled prev" : "prev"}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fa fa-arrow-left"></i>
                </button>
              </li>
              {[...Array(totalPages).keys()].map((page) => (
                <li key={page}>
                  <button
                    className={currentPage === page + 1 ? "current-page" : ""}
                    onClick={() => setCurrentPage(page + 1)}
                  >
                    {page + 1}
                  </button>
                </li>
              ))}
              <li className={currentPage === totalPages ? "disabled next" : "next"}>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="fa fa-arrow-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </section>
  );
};

export default dynamic(() => Promise.resolve(JobSingleDynamicV1), { ssr: false });
