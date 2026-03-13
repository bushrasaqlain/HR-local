import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCheckCircle, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
// import Pagination from "../../common/pagination";

// import ApplicantFilters from "./applicantFilters";
// import ApplicantSearch from "./applicantSearch";
// import ApplicantCard from "./applicantCards";
import CandidateInfo from "./applicants/candidateinfo";
import Head from "next/head";
import { Messages } from "openai/resources/chat/completions.js";
import ChatBox from "./messages/chatBox";
class ShortlistedCandidates extends Component {
  constructor(props) {
    super(props); // ✅ MUST call super first
    this.state = {
      selectedJobId: "", // new state
      postedJobs: [], // to populate dropdown
      showFilters: false, // controls when filters/list show
      candidates: [],
      allApplicants: [],
      speciality: [],
      skills: [],
      jobTypes: [],
      currentPage: 1,
      itemsPerPage: 10,
      selectedTabIndex: 0,
      cities: [],
      selectedCandidate: null,
      showCandidateInfo: false,
      selectedCityIds: [],
      searchFilters: {},
      selectedStatus: "",
      selectedCityId: "",
      showConfirmRescheduleModal: false,
      selectedConfirmRescheduleCandidate: null,
      counts: {
        all: 0,
        pending: 0,
        shortlisted: 0,
        rejected: 0,
        approved: 0,
      },
    };
    this.openCandidatePage = this.openCandidatePage.bind(this);
    this.openCandidateMessage = this.openCandidateMessage.bind(this);
  }

  openCandidatePage(candidate) {
    console.log("Selected Candidate object:", candidate);

    this.setState({
      selectedCandidate: candidate,
      showCandidateInfo: true,
    });
  }
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  userId = sessionStorage.getItem("userId");
  fetchPostedJobs = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      const res = await axios.get(`${this.apiBaseUrl}job/managejob/${userId}`);
      const jobs = res.data || [];

      const activeJobs = jobs.filter((job) => job.status === "Active");

      this.setState({ postedJobs: activeJobs }, () => {
        if (activeJobs.length > 0) {
          const latestJobId = activeJobs[0].id;
          this.setState(
            { selectedJobId: latestJobId, showFilters: true },
            () => {
              this.fetchAllCandidates();
            },
          );
        }
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posted jobs");
    }
  };
  componentDidMount() {
    this.fetchAllCandidates();
    this.fetchPostedJobs();
  }
  handleSearch = (searchFilters) => {
    this.setState({ searchFilters, currentPage: 1 }, () => {
      this.fetchAllCandidates();
    });
  };

  fetchAllCandidates = async () => {
    const {
      selectedSkillId,
      selectedspecialityId,
      selectedSalary,
      selectedExperience,
      availability,
      selectedJobId,
      selectedCountryId,
      selectedDistrictId,
      selectedCityIds,
    } = this.state;

    if (!selectedJobId) {
      this.setState({ candidates: [], allApplicants: [] });
      return;
    }

    try {
      const res = await axios.get(
        `${this.apiBaseUrl}applicantsData/${this.userId}`,
        {
          params: {
            skill_id: selectedSkillId,
            job_id: selectedJobId,
            speciality_id: selectedspecialityId || "",
            min_salary: selectedSalary?.min ?? "",
            max_salary: selectedSalary?.max ?? "",
            day: availability?.day || "",
            shift: availability?.shift || "",
            country_id: selectedCountryId || "",
            district_id: selectedDistrictId || "",
            city_id: selectedCityIds.join(","),
            query: this.state.searchFilters.query || "",
            min_experience: selectedExperience?.min ?? "",
            max_experience: selectedExperience?.max ?? "",
          },
        },
      );

      const candidatesRaw = res.data.candidate || [];
      console.log("API DATA:", candidatesRaw);
      const jobCityId = this.state.postedJobs.find(
        (j) => j.id === Number(this.state.selectedJobId),
      )?.city_id;

      // Build city map from state
      const cityMapObj = {};
      (this.state.cities || []).forEach((city) => {
        cityMapObj[city.id] = city.name;
      });

      const candidates = candidatesRaw.map((c) => {
        // Normalize otherPreferredCities
        const otherPreferredCities = (c.otherPreferredCities || []).map(
          (city) => {
            if (typeof city === "number")
              return { id: city, name: cityMapObj[city] || "" };
            return {
              id: city.id,
              name: city.name || cityMapObj[city.id] || "",
            };
          },
        );

        // Determine city_name based on job city match
        const mainCityMatch = Number(c.city) === Number(jobCityId);
        const preferredCityMatch = otherPreferredCities.some(
          (city) => Number(city.id) === Number(jobCityId),
        );

        let city_name = "-";
        if (mainCityMatch) {
          city_name = c.city_name || cityMapObj[c.city] || "-";
        } else if (preferredCityMatch) {
          const matchedCity = otherPreferredCities.find(
            (city) => Number(city.id) === Number(jobCityId),
          );
          city_name = matchedCity?.name || "-";
        } else {
          // fallback to main city name if no job match
          city_name = c.city_name || cityMapObj[c.city] || "-";
        }

        // Calculate age
        const age = c.date_of_birth
          ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear()
          : null;

        // Skills names
        const skill_names = (c.skills || []).map((s) => s.name || s);

        // Speciality (first experience)
        const speciality_name =
          c.experience?.length > 0 && c.experience[0].speciality
            ? c.experience[0].speciality.name
            : "-";

        // Availability list
        const availabilityList = c.availability_times
          ? c.availability_times.split("|").map((s) => {
              const [day, time] = s.split(" ");
              return { day, time };
            })
          : [];

        return {
          ...c,
          age,
          skill_names,
          speciality_name,
          city_name,
          otherPreferredCities,
          availabilityList,
          resume: c.resume || null,
          address: c.address || "",
          // 👇 ADD THESE
          candidate_response: c.candidate_response || null,
          requested_interview_day: c.requested_interview_day || null,
          requested_interview_time: c.requested_interview_time || null,
        };
      });

      this.setState(
        {
          candidates,
          allApplicants: candidates,
          selectedStatus: "Shortlisted",
        },
        () => this.calculateCounts(candidates),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch candidates");
    }
  };
  filterApplicants = () => {
    const { allApplicants, selectedStatus, searchFilters, selectedCityId } =
      this.state;
    const query = searchFilters.query?.toLowerCase() || "";

    return allApplicants.filter((candidate) => {
      // STATUS FILTER
      const statusMatch = selectedStatus
        ? String(candidate.candidateStatus || "")
            .trim()
            .toLowerCase() === selectedStatus.toLowerCase()
        : true;

      // CITY FILTER
      const cityMatch = selectedCityId
        ? Number(candidate.city) === Number(selectedCityId) ||
          candidate.otherPreferredCities?.some(
            (city) => Number(city.id) === Number(selectedCityId),
          )
        : true;

      // SEARCH FILTER
      let searchMatch = true;
      if (query) {
        const nameMatch = candidate.full_name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);
        searchMatch = nameMatch || emailMatch;
      }
      console.log(this.filterApplicants().map((c) => c.candidateStatus));

      return statusMatch && cityMatch && searchMatch;
    });
  };
  loadCities = async (districtId) => {
    if (!districtId) {
      this.setState({ cities: [] });
      return;
    }

    try {
      const res = await axios.get(
        `${this.apiBaseUrl}getCitiesByDistrict/${districtId}`,
      );

      const cities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ cities });
    } catch (error) {
      console.error("Failed to load cities", error);
      toast.error("Could not load cities");
    }
  };

  calculateCounts = (applicants) => {
    const counts = {
      all: applicants.length,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      approved: 0,
    };

    applicants.forEach((a) => {
      if (a.candidateStatus === "Pending") counts.pending++;
      if (a.candidateStatus === "Shortlisted") counts.shortlisted++;
      if (a.candidateStatus === "Rejected") counts.rejected++;
      if (a.candidateStatus === "Approved") counts.approved++;
    });

    this.setState({ counts });
  };

  handleApplicationStatus = async (
    candidateId,
    jobId,
    status = "Shortlisted",
  ) => {
    if (!jobId) {
      toast.error("Job ID is required to update status");
      return;
    }

    try {
      await axios.post(`${this.apiBaseUrl}updatestatus`, {
        candidateId,
        jobId,
        status,
      });
      toast.success(`Candidate ${status.toLowerCase()} successfully`);
      this.fetchAllCandidates();
    } catch (error) {
      console.error(error.response?.data);
      toast.error("Failed to update status");
    }
  };
  openCandidateMessage(candidate) {
    console.log("Selected candidate object:", candidate);
    this.setState({
      selectedCandidate: candidate,
      showCandidateMessage: true,
    });
  }
  // handleMessageCandidate = async (
  //   candidateId,
  //   jobId,
  //   message = "",
  // ) => {
  //   if (!jobId) {
  //     setTimeout(() => {
  //       "Job Ib Required"
  //     }, 1000);
  //     return;
  //   }
  //   try {
  //     await axios.post(`${this.apiBaseUrl}messagecandidate`, {
  //       candidateId,
  //   jobId,
  //   message,
  //     });
  //       setTimeout(() => {
  //       "Job Ib Required"
  //     }, 1000);
  //     this.fetchAllCandidates();
  //   } catch (error) {
  //     consol.error(error.response?.data);
  //     setTimeout(() => {
  //       "error"
  //     }, 1000);
  //   }
  // };
  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };
  handleFilterChange = async (key, value) => {
    let stateUpdate = { [key]: value, currentPage: 1 };

    await this.setState(stateUpdate);

    this.fetchAllCandidates();
  };
  handleConfirmReschedule = async (candidate) => {
    console.log("Confirming reschedule for candidate:", candidate);

    // Use the job ID from state instead of candidate object
    const jobId = this.state.selectedJobId;
    const token = sessionStorage.getItem("token");

    if (!jobId) {
      toast.error("Job ID is missing. Please select a job first.");
      return;
    }

    try {
      this.setState({ loading: true });

      await axios.post(
        `${this.apiBaseUrl}updatestatus`,
        {
          candidateId: candidate.candidate_id,
          jobId: jobId, // Use jobId from state
          company_status: "confirmed",
          candidate_response: "confirmed",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Reschedule request confirmed successfully!");
      this.fetchAllCandidates();
    } catch (error) {
      console.error("Error confirming reschedule:", error);
      toast.error("Failed to confirm reschedule");
    } finally {
      this.setState({ loading: false });
    }
  };
  filterApplicants = () => {
    const { allApplicants, searchFilters } = this.state;

    const query = searchFilters.query?.toLowerCase() || "";

    return allApplicants.filter((candidate) => {
      // ===== STATUS =====
      const statusMatch = this.state.selectedStatus
        ? candidate.candidateStatus === this.state.selectedStatus
        : true;
      const cityMatch = this.state.selectedCityId
        ? Number(candidate.city) === Number(this.state.selectedCityId) ||
          candidate.otherPreferredCities?.some(
            (city) => Number(city.id) === Number(this.state.selectedCityId),
          )
        : true;

      // ===== SEARCH MATCH =====
      let searchMatch = true;
      if (query) {
        const nameMatch = candidate.full_name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);

        searchMatch = nameMatch || emailMatch;
      }

      // ===== FINAL RETURN =====
      return statusMatch && cityMatch;
    });
  };
  /* ================= RENDER ================= */

  render() {
    const { currentPage, itemsPerPage, counts } = this.state;

    const filteredApplicants = this.filterApplicants();

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentCandidates = filteredApplicants.slice(
      indexOfFirst,
      indexOfLast,
    );
    const hasCandidateResponse = currentCandidates.some(
      (c) => c.candidate_response,
    );
    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);

    // 👇 ADD THIS RIGHT HERE
    if (this.state.showCandidateInfo && this.state.selectedCandidate) {
      return (
        <CandidateInfo
          candidate={this.state.selectedCandidate}
          selectedJobId={this.state.selectedJobId} // ✅ pass jobId here
          onBack={() =>
            this.setState({
              showCandidateInfo: false,
              selectedCandidate: null,
            })
          }
        />
      );
    }
    if (this.state.showCandidateMessage && this.state.selectedCandidate) {
      const candidateData = this.state.selectedCandidate;
      const candidateId =
        candidateData.candidate_id || candidateData.account_id;
      const accountId = candidateData.account_id; // This is the receiver's user ID
      const jobId = this.state.selectedJobId;

      console.log("Opening chat with candidate:", {
        candidateId, // ID from applications table
        accountId, // User account ID (receiver)
        jobId,
        candidateName: candidateData.full_name || candidateData.username,
      });

      return (
        <ChatBox
          candidateId={candidateId}
          selectedContactId={accountId} // This becomes receiverId
          selectedContactName={
            candidateData.full_name || candidateData.username
          }
          selectedJobId={jobId}
          onBack={() =>
            this.setState({
              showCandidateMessage: false,
              selectedCandidate: null,
            })
          }
        />
      );
    }
    return (
      <>
        <Head>
          <title>All Applicants</title>
        </Head>
        <Container fluid>
          <Row className="g-4 mt-2">
            <Col lg="12" className="mb-3">
              <label>Select Posted Job</label>
              <select
                className="form-control"
                value={this.state.selectedJobId}
                onChange={async (e) => {
                  const selectedJobId = e.target.value;
                  await this.setState({
                    selectedJobId,
                    showFilters: !!selectedJobId,
                  });
                  if (selectedJobId) this.fetchAllCandidates();
                }}
              >
                <option value="">-- Select Job --</option>
                {this.state.postedJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_title}
                  </option>
                ))}
              </select>
            </Col>
            {this.state.showFilters && (
              <>
                <Col lg="12" className="mb-3">
                  <div className="mt-3 table-responsive">
                    {currentCandidates.length > 0 ? (
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Candidate</th>
                            <th>Status</th>
                            {/* Conditionally show Candidate Response header */}
                            {currentCandidates.some(
                              (c) => c.candidate_response,
                            ) && <th>Candidate Response</th>}
                            {/* Conditionally show Action header */}
                            {currentCandidates.some(
                              (c) => c.candidate_response,
                            ) && <th>Action</th>}
                          </tr>
                        </thead>

                        <tbody>
                          {currentCandidates.map((candidate) => (
                            <tr key={candidate.id}>
                              <td
                                style={{ minWidth: "200px", maxWidth: "250px" }}
                              >
                                <div className="d-flex align-items-center flex-nowrap">
                                  <img
                                    src={
                                      candidate.passport_photo
                                        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidate.passport_photo.replace(/^\/+/, "")}`
                                        : "/images/user.png"
                                    }
                                    alt="Candidate"
                                    width="45"
                                    height="45"
                                    className="rounded-circle me-3"
                                  />
                                  <div
                                    className="text-truncate"
                                    style={{ maxWidth: "150px" }}
                                  >
                                    <div
                                      onClick={() =>
                                        this.openCandidatePage(candidate)
                                      }
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                      }}
                                      className="text-truncate"
                                    >
                                      {candidate.full_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="mt-2"
                                style={{
                                  color:
                                    candidate.candidateStatus === "Pending"
                                      ? "black"
                                      : candidate.candidateStatus === "Rejected"
                                        ? "red"
                                        : "green",
                                  fontWeight: "bold",
                                }}
                              >
                                {candidate.candidateStatus || "-"}
                              </td>

                              {hasCandidateResponse && (
                                <td>
                                  {candidate.candidate_response ===
                                    "Confirmed" && (
                                    <span
                                      style={{
                                        color: "green",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      <FaCheckCircle
                                        className="me-1"
                                        size={14}
                                      />{" "}
                                      Confirmed
                                    </span>
                                  )}

                                  {candidate.candidate_response ===
                                    "Accepted" && (
                                    <span
                                      style={{
                                        color: "green",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Accepted
                                    </span>
                                  )}

                                  {candidate.candidate_response ===
                                    "Reschedule Requested" && (
                                    <div
                                      style={{
                                        color: "orange",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {candidate.candidate_response}
                                      <br />
                                      <small>
                                        {candidate.requested_interview_day
                                          ? new Date(
                                              candidate.requested_interview_day,
                                            ).toLocaleDateString()
                                          : ""}{" "}
                                        {candidate.requested_interview_time ||
                                          ""}
                                      </small>
                                    </div>
                                  )}

                                  {candidate.candidate_response &&
                                    candidate.candidate_response !==
                                      "Confirmed" &&
                                    candidate.candidate_response !==
                                      "Accepted" &&
                                    candidate.candidate_response !==
                                      "Reschedule Requested" && (
                                      <span>
                                        {candidate.candidate_response}
                                      </span>
                                    )}

                                  {!candidate.candidate_response && "-"}
                                </td>
                              )}

                              {/* Conditionally show Action cell */}
                              {hasCandidateResponse && (
                                <td>
                                  {/* Show for Reschedule Requested */}
                                  {/* Show for Reschedule Requested */}
                                  {/* Show for Reschedule Requested */}
                                  {candidate.candidate_response ===
                                    "Reschedule Requested" && (
                                    <>
                                      <button
                                        className="btn btn-sm btn-success rounded-5"
                                        onClick={() =>
                                          this.setState({
                                            showConfirmRescheduleModal: true,
                                            selectedConfirmRescheduleCandidate:
                                              candidate,
                                          })
                                        }
                                        title="Confirm Reschedule"
                                      >
                                        Confirm
                                      </button>
                                    </>
                                  )}
                                  {/* Show for Accepted/Confirmed */}
                                  {candidate.candidate_response ===
                                    "Accepted" && (
                                    <>
                                      <button
                                        className="btn btn-sm custom-progress-bar rounded-5"
                                        onClick={() =>
                                          this.openCandidateMessage(candidate)
                                        }
                                        title="Message Candidate"
                                      >
                                        💬
                                      </button>
                                    </>
                                  )}

                                  {/* Show for Confirmed (if different from Accepted) */}
                                  {candidate.candidate_response ===
                                    "Confirmed" && (
                                    <>
                                      <span className="badge bg-success me-2 p-2">
                                        <FaCheckCircle className="me-1" />{" "}
                                        Confirmed
                                      </span>
                                      <button
                                        className="btn btn-sm custom-progress-bar rounded-5"
                                        onClick={() =>
                                          this.openCandidateMessage(candidate)
                                        }
                                        title="Message Candidate"
                                      >
                                        💬
                                      </button>
                                    </>
                                  )}

                                  {/* Show for other responses if needed */}
                                  {candidate.candidate_response &&
                                    candidate.candidate_response !==
                                      "Reschedule Requested" &&
                                    candidate.candidate_response !==
                                      "Accepted" &&
                                    candidate.candidate_response !==
                                      "Confirmed" && (
                                      <span className="badge bg-secondary p-2">
                                        {candidate.candidate_response}
                                      </span>
                                    )}
                                  {/* Company Confirmed - only message */}
                                  {candidate.company_status === "confirmed" && (
                                    <>
                                      <button
                                        className="ms-2 btn btn-sm custom-progress-bar rounded-5"
                                        onClick={() =>
                                          this.openCandidateMessage(candidate)
                                        }
                                        title="Message Candidate"
                                      >
                                        💬
                                      </button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center">No candidates found</div>
                    )}
                  </div>

                  {/* PAGINATION */}
                  {filteredApplicants.length > itemsPerPage && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={this.handlePageChange}
                    />
                  )}
                </Col>
              </>
            )}
          </Row>
        </Container>
        {/* Confirm Reschedule Modal */}
        {this.state.showConfirmRescheduleModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1050,
            }}
            onClick={() => this.setState({ showConfirmRescheduleModal: false })}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "450px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ background: "#36565F", color: "white" }}
                >
                  <h5 className="modal-title">Confirm Reschedule</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() =>
                      this.setState({ showConfirmRescheduleModal: false })
                    }
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to confirm the reschedule request from{" "}
                    <strong>
                      {this.state.selectedConfirmRescheduleCandidate?.full_name}
                    </strong>
                    ?
                  </p>

                  <div className="bg-light p-3 rounded">
                    <p className="mb-2">
                      <strong>Requested Date:</strong>{" "}
                      {this.state.selectedConfirmRescheduleCandidate
                        ?.requested_interview_day
                        ? new Date(
                            this.state.selectedConfirmRescheduleCandidate
                              .requested_interview_day,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p className="mb-0">
                      <strong>Requested Time:</strong>{" "}
                      {this.state.selectedConfirmRescheduleCandidate
                        ?.requested_interview_time || "N/A"}
                    </p>
                  </div>

                  <p className="mt-3 text-warning">
                    <small>This will update the interview schedule.</small>
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      this.setState({
                        showConfirmRescheduleModal: false,
                        selectedConfirmRescheduleCandidate: null,
                      })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      this.handleConfirmReschedule(
                        this.state.selectedConfirmRescheduleCandidate,
                      );
                      this.setState({ showConfirmRescheduleModal: false });
                    }}
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default ShortlistedCandidates;
