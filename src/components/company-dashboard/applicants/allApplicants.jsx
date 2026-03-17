import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../common/pagination";

import ApplicantFilters from "./applicantFilters";
import ApplicantSearch from "./applicantSearch";
import ApplicantCard from "./applicantCards";
import CandidateInfo from "./candidateinfo";
import Head from "next/head";

class AllApplicants extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedJobId: "",
      postedJobs: [],
      showFilters: false,
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
      counts: {
        all: 0,
        pending: 0,
        shortlisted: 0,
        rejected: 0,
        approved: 0,
      },
      // New state for split view
      splitViewActive: false,
      selectedCandidateId: null,
    };
    this.openCandidatePage = this.openCandidatePage.bind(this);
  }

  openCandidatePage(candidate) {
    console.log("Selected Candidate object:", candidate);

    this.setState({
      selectedCandidate: candidate,
      selectedCandidateId: candidate.id,
      splitViewActive: true, // Activate split view
      showCandidateInfo: true,
    });
  }

  // Add method to close split view
  closeSplitView = () => {
    this.setState({
      splitViewActive: false,
      selectedCandidate: null,
      selectedCandidateId: null,
      showCandidateInfo: false,
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
      const res = await axios.get(`${this.apiBaseUrl}applicantsData/${this.userId}`, {
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
      });

      const candidatesRaw = res.data.candidate || [];
      const jobCityId = this.state.postedJobs.find(
        (j) => j.id === Number(this.state.selectedJobId)
      )?.city_id;

      const cityMapObj = {};
      (this.state.cities || []).forEach((city) => {
        cityMapObj[city.id] = city.name;
      });

      const candidates = candidatesRaw.map((c) => {
        const otherPreferredCities = (c.otherPreferredCities || []).map((city) => {
          if (typeof city === "number") return { id: city, name: cityMapObj[city] || "" };
          return { id: city.id, name: city.name || cityMapObj[city.id] || "" };
        });

        const mainCityMatch = Number(c.city) === Number(jobCityId);
        const preferredCityMatch = otherPreferredCities.some(
          (city) => Number(city.id) === Number(jobCityId)
        );

        let city_name = "-";
        if (mainCityMatch) {
          city_name = c.city_name || cityMapObj[c.city] || "-";
        } else if (preferredCityMatch) {
          const matchedCity = otherPreferredCities.find(
            (city) => Number(city.id) === Number(jobCityId)
          );
          city_name = matchedCity?.name || "-";
        } else {
          city_name = c.city_name || cityMapObj[c.city] || "-";
        }

        const age = c.date_of_birth
          ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear()
          : null;

        const skill_names = (c.skills || []).map((s) => s.name || s);

        const speciality_name =
          c.experience?.length > 0 && c.experience[0].speciality
            ? c.experience[0].speciality.name
            : "-";

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
        };
      });

      this.setState({ candidates, selectedStatus: "Pending", allApplicants: candidates }, () =>
        this.calculateCounts(candidates)
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch candidates");
    }
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

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleFilterChange = async (key, value) => {
    let stateUpdate = { [key]: value, currentPage: 1 };
    await this.setState(stateUpdate);
    this.fetchAllCandidates();
  };

  filterApplicants = () => {
    const { allApplicants, searchFilters, selectedStatus } = this.state;
    const query = searchFilters.query?.toLowerCase() || "";

    return allApplicants.filter((candidate) => {
      const statusMatch = selectedStatus
        ? String(candidate.candidateStatus || "")
            .trim()
            .toLowerCase() === selectedStatus.toLowerCase()
        : true;
      const cityMatch = this.state.selectedCityId
        ? Number(candidate.city) === Number(this.state.selectedCityId) ||
          candidate.otherPreferredCities?.some(
            (city) => Number(city.id) === Number(this.state.selectedCityId),
          )
        : true;

      let searchMatch = true;
      if (query) {
        const nameMatch = candidate.full_name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);
        searchMatch = nameMatch || emailMatch;
      }

      return statusMatch && cityMatch;
    });
  };

  /* ================= RENDER ================= */

  render() {
    const { currentPage, itemsPerPage, counts, splitViewActive, selectedCandidate } = this.state;

    const filteredApplicants = this.filterApplicants();

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentCandidates = filteredApplicants.slice(
      indexOfFirst,
      indexOfLast,
    );

    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);

    return (
      <>
        <Head>
          <title>All Applicants</title>
        </Head>
        <Container fluid className="candidate-dashboard">
          <style jsx>{`
            .candidate-dashboard {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 2rem;
            }
            
            .job-selector-card {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 2rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              margin-bottom: 2rem;
            }
            
            .job-label {
              font-size: 1.1rem;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 0.8rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .job-label i {
              color: #667eea;
              font-size: 1.3rem;
            }
            
            .styled-select {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 15px;
              padding: 1rem 1.5rem;
              font-size: 1rem;
              color: #2d3748;
              cursor: pointer;
              transition: all 0.3s ease;
              appearance: none;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: right 1.5rem center;
              background-size: 1.2rem;
            }
            
            .styled-select:hover, .styled-select:focus {
              border-color: #667eea;
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
              outline: none;
            }
            
            .stats-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 1rem;
              margin-bottom: 2rem;
            }
            
            .stat-card {
              background: white;
              border-radius: 15px;
              padding: 1.2rem;
              text-align: center;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
              border: 1px solid rgba(0, 0, 0, 0.05);
              transition: transform 0.3s ease;
            }
            
            .stat-card:hover {
              transform: translateY(-5px);
            }
            
            .stat-icon {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
            
            .stat-label {
              font-size: 0.9rem;
              color: #718096;
              margin-bottom: 0.3rem;
            }
            
            .stat-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: #2d3748;
            }
            
            .stat-value.total { color: #667eea; }
            .stat-value.pending { color: #fbbf24; }
            .stat-value.shortlisted { color: #10b981; }
            .stat-value.rejected { color: #ef4444; }
            
            .search-wrapper {
              background: white;
              border-radius: 50px;
              padding: 0.3rem;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
              margin-bottom: 2rem;
              display: flex;
              align-items: center;
            }
            
            .search-input {
              flex: 1;
              border: none;
              padding: 1rem 1.5rem;
              font-size: 1rem;
              background: transparent;
              border-radius: 50px;
            }
            
            .search-input:focus {
              outline: none;
            }
            
            .search-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 0.8rem 2rem;
              border-radius: 50px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              margin: 0.3rem;
            }
            
            .search-button:hover {
              transform: scale(1.02);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            /* Split view container */
            .split-view-container {
              display: flex;
              gap: 1.5rem;
              min-height: calc(100vh - 250px);
            }
            
            /* Left panel - 25% */
            .left-panel {
              flex: 0 0 25%;
              background: white;
              border-radius: 20px;
              padding: 1.5rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow-y: auto;
              max-height: calc(100vh - 250px);
            }
            
            /* Right panel - 75% */
            .right-panel {
              flex: 0 0 75%;
              background: white;
              border-radius: 20px;
              padding: 1.5rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow-y: auto;
              max-height: calc(100vh - 250px);
              position: relative;
            }
            
            /* Close button for split view */
            .close-split-view {
              position: absolute;
              top: 1rem;
              right: 1rem;
              background: #fee2e2;
              border: none;
              border-radius: 50%;
              width: 35px;
              height: 35px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #991b1b;
              cursor: pointer;
              transition: all 0.3s ease;
              z-index: 10;
            }
            
            .close-split-view:hover {
              background: #fecaca;
              transform: scale(1.1);
            }
            
            /* Compact candidate list in split view */
            .compact-candidate-list {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }
            
            .compact-candidate-item {
              display: flex;
              align-items: center;
              gap: 1rem;
              padding: 0.75rem;
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid transparent;
            }
            
            .compact-candidate-item:hover {
              background: #f7fafc;
              border-color: #e2e8f0;
            }
            
            .compact-candidate-item.selected {
              background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
              border-color: #667eea;
            }
            
            .compact-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #667eea;
            }
            
            .compact-info {
              flex: 1;
            }
            
            .compact-name {
              font-weight: 600;
              color: #2d3748;
              font-size: 0.9rem;
            }
            
            .compact-email {
              font-size: 0.8rem;
              color: #718096;
            }
            
            .compact-status {
              font-size: 0.7rem;
              padding: 0.2rem 0.5rem;
              border-radius: 50px;
              display: inline-block;
            }
            
            .candidates-table-card {
              background: white;
              border-radius: 20px;
              padding: 1.5rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            
            .table-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            .table-header th {
              padding: 1.2rem 1rem;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.9rem;
              letter-spacing: 1px;
            }
            
            .candidate-row {
              transition: all 0.3s ease;
              cursor: pointer;
            }
            
            .candidate-row:hover {
              background: #f7fafc;
              transform: scale(1.01);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .candidate-avatar {
              width: 50px;
              height: 50px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #667eea;
              box-shadow: 0 5px 10px rgba(102, 126, 234, 0.2);
              transition: all 0.3s ease;
            }
            
            .candidate-avatar:hover {
              transform: scale(1.1);
              border-color: #764ba2;
            }
            
            .candidate-name {
              font-weight: 600;
              color: #2d3748;
              transition: color 0.3s ease;
            }
            
            .candidate-name:hover {
              color: #667eea;
            }
            
            .status-badge {
              padding: 0.5rem 1rem;
              border-radius: 50px;
              font-weight: 600;
              font-size: 0.85rem;
              display: inline-block;
              text-align: center;
              min-width: 100px;
            }
            
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            
            .status-shortlisted {
              background: #d1fae5;
              color: #065f46;
            }
            
            .status-rejected {
              background: #fee2e2;
              color: #991b1b;
            }
            
            .city-badge {
              background: #e2e8f0;
              color: #2d3748;
              padding: 0.5rem 1rem;
              border-radius: 50px;
              font-size: 0.85rem;
              display: inline-block;
            }
            
            .empty-state {
              text-align: center;
              padding: 4rem 2rem;
            }
            
            .empty-icon {
              font-size: 5rem;
              color: #cbd5e0;
              margin-bottom: 1.5rem;
            }
            
            .empty-text {
              font-size: 1.2rem;
              color: #718096;
              margin-bottom: 1rem;
            }
            
            .pagination-wrapper {
              display: flex;
              justify-content: center;
              margin-top: 2rem;
            }
            
            .custom-pagination {
              display: flex;
              gap: 0.5rem;
              list-style: none;
              padding: 0;
            }
            
            .page-item {
              display: inline-block;
            }
            
            .page-link {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: white;
              color: #2d3748;
              text-decoration: none;
              transition: all 0.3s ease;
              border: 1px solid #e2e8f0;
              font-weight: 500;
            }
            
            .page-link:hover, .page-item.active .page-link {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-color: transparent;
              transform: scale(1.1);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }
          `}</style>

          <Row className="justify-content-center">
            <Col lg={splitViewActive ? "12" : "10"}>
              {/* Job Selection Card */}
              <div className="job-selector-card animate__animated animate__fadeInDown">
                <div className="job-label">
                  <i className="fas fa-briefcase"></i>
                  <span>Select Job Position</span>
                </div>
                <select
                  className="styled-select w-100"
                  value={this.state.selectedJobId}
                  onChange={async (e) => {
                    const selectedJobId = e.target.value;
                    await this.setState({
                      selectedJobId,
                      showFilters: !!selectedJobId,
                      splitViewActive: false, // Close split view when changing job
                      selectedCandidate: null,
                    });
                    if (selectedJobId) this.fetchAllCandidates();
                  }}
                >
                  <option value="">-- Choose a job to view candidates --</option>
                  {this.state.postedJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title}
                    </option>
                  ))}
                </select>
              </div>

              {this.state.showFilters && (
                <>
                  {/* Conditional rendering: Split view or Full view */}
                  {splitViewActive && selectedCandidate ? (
                    <div className="split-view-container">
                      {/* Left Panel - 25% - Candidate List */}
                      <div className="left-panel">
                        <h5 className="mb-3">Candidates List</h5>
                        <div className="compact-candidate-list">
                          {currentCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`compact-candidate-item ${
                                candidate.id === this.state.selectedCandidateId ? 'selected' : ''
                              }`}
                              onClick={() => this.openCandidatePage(candidate)}
                            >
                              <img
                                src={
                                  candidate.passport_photo
                                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidate.passport_photo.replace(/^\/+/, "")}`
                                    : "/images/user.png"
                                }
                                alt={candidate.full_name}
                                className="compact-avatar"
                                onError={(e) => {
                                  e.target.src = "/images/user.png";
                                }}
                              />
                              <div className="compact-info">
                                <div className="compact-name">{candidate.full_name}</div>
                                <div className="compact-email">{candidate.email || "No email"}</div>
                                <span className={`compact-status ${
                                  candidate.candidateStatus === "Pending" ? "status-pending" :
                                  candidate.candidateStatus === "Rejected" ? "status-rejected" :
                                  "status-shortlisted"
                                }`}>
                                  {candidate.candidateStatus || "Pending"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Pagination in split view */}
                        {filteredApplicants.length > itemsPerPage && (
                          <div className="pagination-wrapper mt-3">
                            <ul className="custom-pagination">
                              <li className="page-item">
                                <a 
                                  className="page-link" 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) this.handlePageChange(currentPage - 1);
                                  }}
                                >
                                  <i className="fas fa-chevron-left"></i>
                                </a>
                              </li>
                              <li className="page-item">
                                <span className="page-link">
                                  {currentPage} / {totalPages}
                                </span>
                              </li>
                              <li className="page-item">
                                <a 
                                  className="page-link" 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < totalPages) this.handlePageChange(currentPage + 1);
                                  }}
                                >
                                  <i className="fas fa-chevron-right"></i>
                                </a>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Right Panel - 75% - Candidate Details */}
                      <div className="right-panel">
                        <button 
                          className="close-split-view"
                          onClick={this.closeSplitView}
                          title="Close split view"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <CandidateInfo
                          candidate={selectedCandidate}
                          selectedJobId={this.state.selectedJobId}
                          onBack={this.closeSplitView}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Full view - Table only */
                    <div className="candidates-table-card animate__animated animate__fadeInUp">
                      {currentCandidates.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-rounded align-middle">
                              <thead className="text-center rounded">
                                <tr>
                                  <th className="text-white p-3 border-bottom border-1"
                                      style={{ background: "#5f8190"}}>Candidate
                                  </th>
                                  <th className="text-white p-3 border-bottom border-1"
                                      style={{ background: "#5f8190"}}>Status
                                  </th>
                                  <th className="text-white p-3 border-bottom border-1"
                                      style={{ background: "#5f8190"}}>Location
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="border-2">
                                {currentCandidates.map((candidate, index) => (
                                  <tr 
                                    key={candidate.id} 
                                    className="candidate-row"
                                    style={{ animation: `fadeInUp 0.5s ease ${index * 0.1}s` }}
                                  >
                                    <td>
                                      <div className="d-flex align-items-center gap-3">
                                        <img
                                          src={
                                            candidate.passport_photo
                                              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidate.passport_photo.replace(/^\/+/, "")}`
                                              : "/images/user.png"
                                          }
                                          alt={candidate.full_name}
                                          className="candidate-avatar"
                                          onError={(e) => {
                                            e.target.src = "/images/user.png";
                                          }}
                                        />
                                        <div>
                                          <div
                                            onClick={() => this.openCandidatePage(candidate)}
                                            className="candidate-name"
                                            style={{ cursor: "pointer" }}
                                          >
                                            {candidate.full_name}
                                          </div>
                                          <small className="text-muted">
                                            {candidate.email || "No email provided"}
                                          </small>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <span className={`status-badge ${
                                        candidate.candidateStatus === "Pending" ? "status-pending" :
                                        candidate.candidateStatus === "Rejected" ? "status-rejected" :
                                        "status-shortlisted"
                                      }`}>
                                        {candidate.candidateStatus || "Pending"}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="city-badge">
                                        <i className="fas fa-map-marker-alt me-2"></i>
                                        {candidate.city_name || "Not specified"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          {filteredApplicants.length > itemsPerPage && (
                            <div className="pagination-wrapper">
                              <ul className="custom-pagination">
                                <li className="page-item">
                                  <a 
                                    className="page-link" 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (currentPage > 1) this.handlePageChange(currentPage - 1);
                                    }}
                                  >
                                    <i className="fas fa-chevron-left"></i>
                                  </a>
                                </li>
                                {[...Array(totalPages)].map((_, i) => (
                                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                    <a 
                                      className="page-link" 
                                      href="#" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        this.handlePageChange(i + 1);
                                      }}
                                    >
                                      {i + 1}
                                    </a>
                                  </li>
                                ))}
                                <li className="page-item">
                                  <a 
                                    className="page-link" 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (currentPage < totalPages) this.handlePageChange(currentPage + 1);
                                    }}
                                  >
                                    <i className="fas fa-chevron-right"></i>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">
                            <i className="fas fa-users-slash"></i>
                          </div>
                          <div className="empty-text">
                            No candidates found for this position
                          </div>
                          <p className="text-muted">
                            Try adjusting your search or check back later for new applications
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default AllApplicants;