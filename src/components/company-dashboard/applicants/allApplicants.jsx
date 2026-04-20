import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import axios from "axios";
// import { toast } from "react-toastify";
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
      splitViewActive: false,
      selectedCandidateId: null,
      // Add window width to state for responsive handling
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
      // Track if we're in mobile detail view
      mobileDetailView: false,
    };
    this.openCandidatePage = this.openCandidatePage.bind(this);
  }

  // Add resize listener
  componentDidMount() {
    this.fetchAllCandidates();
    this.fetchPostedJobs();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
    // If screen becomes larger and we're in mobile detail view, switch to split view
    if (this.state.mobileDetailView && window.innerWidth > 768) {
      this.setState({ mobileDetailView: false, splitViewActive: true });
    }
    // If screen becomes smaller and we're in split view, switch to mobile detail view if a candidate is selected
    if (this.state.splitViewActive && window.innerWidth <= 768 && this.state.selectedCandidate) {
      this.setState({ splitViewActive: false, mobileDetailView: true });
    }
  }

  openCandidatePage(candidate) {
    console.log("Selected Candidate object:", candidate);

    const isMobile = this.state.windowWidth <= 768;

    this.setState({
      selectedCandidate: candidate,
      selectedCandidateId: candidate.id,
      // On mobile, hide list and show only details
      splitViewActive: !isMobile, // Only use split view on non-mobile
      mobileDetailView: isMobile, // On mobile, use detail view
      showCandidateInfo: true,
    });
  }

  closeDetailView = () => {
    this.setState({
      mobileDetailView: false,
      splitViewActive: false,
      // Keep selectedCandidateId to maintain highlighting
      // Don't clear selectedCandidate yet to keep highlight
    });
  }

  closeSplitView = () => {
    this.setState({
      splitViewActive: false,
      // Keep selectedCandidateId to maintain highlighting
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
      console.error("Failed to load posted jobs");
    }
  };

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
      console.error("Failed to fetch candidates");
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
      console.error("Could not load cities");
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
      console.error("Job ID is required to update status");
      return;
    }

    try {
      await axios.post(`${this.apiBaseUrl}updatestatus`, {
        candidateId,
        jobId,
        status,
      });
      console.log(`Candidate ${status.toLowerCase()} successfully`);
      this.fetchAllCandidates();
    } catch (error) {
      console.error(error.response?.data);
      console.error("Failed to update status");
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
    const {
      currentPage,
      itemsPerPage,
      counts,
      splitViewActive,
      selectedCandidate,
      selectedCandidateId,
      mobileDetailView,
      windowWidth
    } = this.state;

    const filteredApplicants = this.filterApplicants();

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentCandidates = filteredApplicants.slice(
      indexOfFirst,
      indexOfLast,
    );

    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);

    // Responsive breakpoints
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth > 768 && windowWidth <= 1024;

    // Determine split view layout based on screen size
    const leftPanelWidth = isMobile ? '100%' : (isTablet ? '35%' : '25%');
    const rightPanelWidth = isMobile ? '100%' : (isTablet ? '65%' : '75%');

    // Determine what to show
    const showSplitView = splitViewActive && selectedCandidate && !isMobile;
    const showMobileDetail = mobileDetailView && selectedCandidate && isMobile;
    const showListView = !showSplitView && !showMobileDetail;

    return (
      <>
        <Head>
          <title>All Applicants</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <Container fluid className="candidate-dashboard px-2 px-sm-3 px-md-4">
          <style jsx>{`
            .candidate-dashboard {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 1rem;
            }
            
            @media (min-width: 768px) {
              .candidate-dashboard {
                padding: 1.5rem;
              }
            }
            
            @media (min-width: 1024px) {
              .candidate-dashboard {
                padding: 2rem;
              }
            }
            
            .job-selector-card {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 15px;
              padding: 1.2rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              margin-bottom: 1rem;
            }
            
            @media (min-width: 768px) {
              .job-selector-card {
                padding: 1.5rem;
                border-radius: 20px;
              }
            }
            
            @media (min-width: 1024px) {
              .job-selector-card {
                padding: 2rem;
              }
            }
            
            .job-label {
              font-size: 0.9rem;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            @media (min-width: 768px) {
              .job-label {
                font-size: 1rem;
                margin-bottom: 0.8rem;
              }
            }
            
            @media (min-width: 1024px) {
              .job-label {
                font-size: 1.1rem;
              }
            }
            
            .job-label i {
              color: #667eea;
              font-size: 1.1rem;
            }
            
            @media (min-width: 768px) {
              .job-label i {
                font-size: 1.3rem;
              }
            }
            
            .styled-select {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 0.8rem 1rem;
              font-size: 0.9rem;
              color: #2d3748;
              cursor: pointer;
              transition: all 0.3s ease;
              appearance: none;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: right 1rem center;
              background-size: 1rem;
            }
            
            @media (min-width: 768px) {
              .styled-select {
                padding: 1rem 1.5rem;
                font-size: 1rem;
                border-radius: 15px;
                background-size: 1.2rem;
              }
            }
            
            .styled-select:hover, .styled-select:focus {
              border-color: #667eea;
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
              outline: none;
            }
            
            .stats-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 0.8rem;
              margin-bottom: 1.5rem;
            }
            
            @media (min-width: 768px) {
              .stats-cards {
                gap: 1rem;
                margin-bottom: 2rem;
              }
            }
            
            .stat-card {
              background: white;
              border-radius: 12px;
              padding: 1rem;
              text-align: center;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
              border: 1px solid rgba(0, 0, 0, 0.05);
              transition: transform 0.3s ease;
            }
            
            @media (min-width: 768px) {
              .stat-card {
                padding: 1.2rem;
                border-radius: 15px;
              }
            }
            
            .stat-card:hover {
              transform: translateY(-5px);
            }
            
            .stat-icon {
              font-size: 1.5rem;
              margin-bottom: 0.3rem;
            }
            
            @media (min-width: 768px) {
              .stat-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
              }
            }
            
            .stat-label {
              font-size: 0.8rem;
              color: #718096;
              margin-bottom: 0.2rem;
            }
            
            @media (min-width: 768px) {
              .stat-label {
                font-size: 0.9rem;
                margin-bottom: 0.3rem;
              }
            }
            
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #2d3748;
            }
            
            @media (min-width: 768px) {
              .stat-value {
                font-size: 1.5rem;
              }
            }
            
            .stat-value.total { color: #667eea; }
            .stat-value.pending { color: #fbbf24; }
            .stat-value.shortlisted { color: #10b981; }
            .stat-value.rejected { color: #ef4444; }
            
            .search-wrapper {
              background: white;
              border-radius: 40px;
              padding: 0.2rem;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
              margin-bottom: 1.5rem;
              display: flex;
              align-items: center;
            }
            
            @media (min-width: 768px) {
              .search-wrapper {
                border-radius: 50px;
                padding: 0.3rem;
                margin-bottom: 2rem;
              }
            }
            
            .search-input {
              flex: 1;
              border: none;
              padding: 0.8rem 1rem;
              font-size: 0.9rem;
              background: transparent;
              border-radius: 40px;
            }
            
            @media (min-width: 768px) {
              .search-input {
                padding: 1rem 1.5rem;
                font-size: 1rem;
                border-radius: 50px;
              }
            }
            
            .search-input:focus {
              outline: none;
            }
            
            .search-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 0.6rem 1.5rem;
              border-radius: 40px;
              font-weight: 600;
              font-size: 0.9rem;
              cursor: pointer;
              transition: all 0.3s ease;
              margin: 0.2rem;
              white-space: nowrap;
            }
            
            @media (min-width: 768px) {
              .search-button {
                padding: 0.8rem 2rem;
                border-radius: 50px;
                font-size: 1rem;
                margin: 0.3rem;
              }
            }
            
            .search-button:hover {
              transform: scale(1.02);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            /* Split view container - Responsive */
            .split-view-container {
              display: flex;
              flex-direction: ${isMobile ? 'column' : 'row'};
              gap: 1rem;
              min-height: ${isMobile ? 'auto' : 'calc(100vh - 250px)'};
            }
            
            @media (min-width: 768px) {
              .split-view-container {
                gap: 1.5rem;
              }
            }
            
            /* Left panel - Responsive */
            .left-panel {
              flex: ${isMobile ? '1 1 auto' : `0 0 ${leftPanelWidth}`};
              background: white;
              border-radius: 15px;
              padding: 1rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow-y: auto;
              max-height: ${isMobile ? '400px' : 'calc(100vh - 250px)'};
              margin-bottom: ${isMobile ? '1rem' : '0'};
            }
            
            @media (min-width: 768px) {
              .left-panel {
                padding: 1.2rem;
                border-radius: 18px;
              }
            }
            
            @media (min-width: 1024px) {
              .left-panel {
                padding: 1.5rem;
                border-radius: 20px;
              }
            }
            
            /* Right panel - Responsive */
            .right-panel {
              flex: ${isMobile ? '1 1 auto' : `0 0 ${rightPanelWidth}`};
              background: white;
              border-radius: 15px;
              padding: 1rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow-y: auto;
              max-height: ${isMobile ? 'auto' : 'calc(100vh - 250px)'};
              position: relative;
            }
            
            @media (min-width: 768px) {
              .right-panel {
                padding: 1.2rem;
                border-radius: 18px;
              }
            }
            
            @media (min-width: 1024px) {
              .right-panel {
                padding: 1.5rem;
                border-radius: 20px;
              }
            }
            
            /* Close button for split view */
            .close-split-view {
              position: ${isMobile ? 'relative' : 'absolute'};
              top: ${isMobile ? '0' : '1rem'};
              right: ${isMobile ? '0' : '1rem'};
              margin-bottom: ${isMobile ? '1rem' : '0'};
              margin-left: ${isMobile ? 'auto' : '0'};
              background: #fee2e2;
              border: none;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #991b1b;
              cursor: pointer;
              transition: all 0.3s ease;
              z-index: 10;
            }
            
            @media (min-width: 768px) {
              .close-split-view {
                width: 35px;
                height: 35px;
              }
            }
            
            .close-split-view:hover {
              background: #fecaca;
              transform: scale(1.1);
            }
            
            /* Mobile detail view */
            .mobile-detail-view {
              background: white;
              border-radius: 15px;
              padding: 1rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              position: relative;
            }
            
            .back-to-list {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 50px;
              padding: 0.5rem 1rem;
              margin-bottom: 1rem;
              color: #2d3748;
              font-size: 0.9rem;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            
            .back-to-list:hover {
              background: #edf2f7;
              border-color: #cbd5e0;
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
              gap: 0.8rem;
              padding: 0.6rem;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 2px solid transparent;
            }
            
            @media (min-width: 768px) {
              .compact-candidate-item {
                gap: 1rem;
                padding: 0.75rem;
                border-radius: 10px;
              }
            }
            
            .compact-candidate-item:hover {
              background: #f7fafc;
              border-color: #e2e8f0;
            }
            
            .compact-candidate-item.selected {
              background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
              border-color: #667eea;
              box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
            }
            
            .compact-avatar {
              width: 35px;
              height: 35px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #667eea;
            }
            
            .compact-candidate-item.selected .compact-avatar {
              border-color: #764ba2;
              box-shadow: 0 0 0 2px rgba(118, 75, 162, 0.3);
            }
            
            @media (min-width: 768px) {
              .compact-avatar {
                width: 40px;
                height: 40px;
              }
            }
            
            .compact-info {
              flex: 1;
              min-width: 0; /* Prevent overflow */
            }
            
            .compact-name {
              font-weight: 600;
              color: #2d3748;
              font-size: 0.85rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .compact-candidate-item.selected .compact-name {
              color: #667eea;
              font-weight: 700;
            }
            
            @media (min-width: 768px) {
              .compact-name {
                font-size: 0.9rem;
              }
            }
            
            .compact-email {
              font-size: 0.75rem;
              color: #718096;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            @media (min-width: 768px) {
              .compact-email {
                font-size: 0.8rem;
              }
            }
            
            .compact-status {
              font-size: 0.65rem;
              padding: 0.2rem 0.4rem;
              border-radius: 50px;
              display: inline-block;
              white-space: nowrap;
            }
            
            @media (min-width: 768px) {
              .compact-status {
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
              }
            }
            
            /* Table responsive */
            .candidates-table-card {
              background: white;
              border-radius: 15px;
              padding: 1rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow-x: auto;
            }
            
            @media (min-width: 768px) {
              .candidates-table-card {
                padding: 1.5rem;
                border-radius: 20px;
              }
            }
            
            .table {
              min-width: 500px; /* Ensure table doesn't get too compressed */
            }
            
            .table-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            .table-header th {
              padding: 1rem 0.8rem;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.8rem;
              letter-spacing: 0.5px;
              white-space: nowrap;
            }
            
            @media (min-width: 768px) {
              .table-header th {
                padding: 1.2rem 1rem;
                font-size: 0.9rem;
                letter-spacing: 1px;
              }
            }
            
            .candidate-row {
              transition: all 0.3s ease;
              cursor: pointer;
              border: 2px solid transparent;
            }
            
            .candidate-row:hover {
              background: #f7fafc;
              transform: scale(1.01);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .candidate-row.selected {
              background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
              border-left: 4px solid #667eea;
              border-right: 4px solid #764ba2;
            }
            
            .candidate-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #667eea;
              box-shadow: 0 5px 10px rgba(102, 126, 234, 0.2);
              transition: all 0.3s ease;
            }
            
            .candidate-row.selected .candidate-avatar {
              border-color: #764ba2;
              transform: scale(1.05);
            }
            
            @media (min-width: 768px) {
              .candidate-avatar {
                width: 50px;
                height: 50px;
              }
            }
            
            .candidate-avatar:hover {
              transform: scale(1.1);
              border-color: #764ba2;
            }
            
            .candidate-name {
              font-weight: 600;
              color: #2d3748;
              transition: color 0.3s ease;
              font-size: 0.9rem;
            }
            
            .candidate-row.selected .candidate-name {
              color: #667eea;
              font-weight: 700;
            }
            
            @media (min-width: 768px) {
              .candidate-name {
                font-size: 1rem;
              }
            }
            
            .candidate-name:hover {
              color: #667eea;
            }
            
            .status-badge {
              padding: 0.4rem 0.8rem;
              border-radius: 50px;
              font-weight: 600;
              font-size: 0.75rem;
              display: inline-block;
              text-align: center;
              min-width: 80px;
              white-space: nowrap;
            }
            
            @media (min-width: 768px) {
              .status-badge {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
                min-width: 100px;
              }
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
              padding: 0.4rem 0.8rem;
              border-radius: 50px;
              font-size: 0.75rem;
              display: inline-block;
              white-space: nowrap;
            }
            
            @media (min-width: 768px) {
              .city-badge {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
              }
            }
            
            .empty-state {
              text-align: center;
              padding: 2rem 1rem;
            }
            
            @media (min-width: 768px) {
              .empty-state {
                padding: 4rem 2rem;
              }
            }
            
            .empty-icon {
              font-size: 3rem;
              color: #cbd5e0;
              margin-bottom: 1rem;
            }
            
            @media (min-width: 768px) {
              .empty-icon {
                font-size: 5rem;
                margin-bottom: 1.5rem;
              }
            }
            
            .empty-text {
              font-size: 1rem;
              color: #718096;
              margin-bottom: 0.8rem;
            }
            
            @media (min-width: 768px) {
              .empty-text {
                font-size: 1.2rem;
                margin-bottom: 1rem;
              }
            }
            
            .pagination-wrapper {
              display: flex;
              justify-content: center;
              margin-top: 1.5rem;
              overflow-x: auto;
              padding: 0.5rem 0;
            }
            
            @media (min-width: 768px) {
              .pagination-wrapper {
                margin-top: 2rem;
              }
            }
            
            .custom-pagination {
              display: flex;
              gap: 0.3rem;
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            @media (min-width: 768px) {
              .custom-pagination {
                gap: 0.5rem;
              }
            }
            
            .page-item {
              display: inline-block;
            }
            
            .page-link {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: white;
              color: #2d3748;
              text-decoration: none;
              transition: all 0.3s ease;
              border: 1px solid #e2e8f0;
              font-weight: 500;
              font-size: 0.85rem;
            }
            
            @media (min-width: 768px) {
              .page-link {
                width: 40px;
                height: 40px;
                font-size: 1rem;
              }
            }
            
            .page-link:hover, .page-item.active .page-link {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-color: transparent;
              transform: scale(1.1);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }
            
            /* Mobile specific styles */
            @media (max-width: 768px) {
              .table td, .table th {
                padding: 0.6rem;
              }
              
              .d-flex.align-items-center.gap-3 {
                gap: 0.5rem !important;
              }
              
              .candidate-avatar {
                width: 35px;
                height: 35px;
                border-width: 2px;
              }
            }
          `}</style>

          <Row className="justify-content-center">
            <Col lg={splitViewActive ? "12" : "10"} xs="12">
              {/* Job Selection Card */}
              <div className="job-selector-card">
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
                      splitViewActive: false,
                      mobileDetailView: false,
                      selectedCandidate: null,
                      selectedCandidateId: null,
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
                  {/* Split View - Desktop/Tablet */}
                  {showSplitView && (
                    <div className="split-view-container">
                      {/* Left Panel - Candidate List */}
                      <div className="left-panel">
                        <h5 className="mb-2 mb-md-3">Candidates List</h5>
                        <div className="compact-candidate-list">
                          {currentCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`compact-candidate-item ${candidate.id === selectedCandidateId ? 'selected' : ''
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
                                <div className="compact-email">{candidate.email || ''}</div>
                                {candidate.has_applied && (
                                  <span style={{
                                    background: "#d1fae5", color: "#065f46",
                                    fontSize: "10px", fontWeight: 600,
                                    padding: "1px 6px", borderRadius: "10px",
                                    display: "inline-block", marginTop: "2px",
                                  }}>
                                    ✓ Applied
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination in split view */}
                        {filteredApplicants.length > itemsPerPage && (
                          <div className="pagination-wrapper mt-2 mt-md-3">
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

                      {/* Right Panel - Candidate Details */}
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
                  )}

                  {/* Mobile Detail View */}
                  {showMobileDetail && (
                    <div className="mobile-detail-view">
                      <div className="back-to-list" onClick={this.closeDetailView}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Candidates List</span>
                      </div>
                      <CandidateInfo
                        candidate={selectedCandidate}
                        selectedJobId={this.state.selectedJobId}
                        onBack={this.closeDetailView}
                      />
                    </div>
                  )}

                  {/* List View - Shown when not in split view or mobile detail view */}
                  {showListView && (
                    <div className="candidates-table-card">
                      {currentCandidates.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-rounded align-middle mb-0">
                              <thead className="text-center rounded">
                                <tr>
                                  <th className="text-white p-2 p-md-3 border-bottom border-1"
                                    style={{ background: "#5f8190" }}>Candidate
                                  </th>
                                  <th className="text-white p-2 p-md-3 border-bottom border-1"
                                    style={{ background: "#5f8190" }}>Status
                                  </th>
                                  <th className="text-white p-2 p-md-3 border-bottom border-1"
                                    style={{ background: "#5f8190" }}>Location
                                  </th>
                                  <th className="text-white p-2 p-md-3 border-bottom border-1"
                                    style={{ background: "#5f8190" }}>Boost
                                  </th>
                                  <th className="text-white p-2 p-md-3 border-bottom border-1"
                                    style={{ background: "#5f8190" }}>Applied
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="border-2">
                                {currentCandidates.map((candidate, index) => (
                                  <tr
                                    key={candidate.id}
                                    className={`candidate-row ${candidate.id === selectedCandidateId ? 'selected' : ''}`}
                                    style={{
                                      animation: `fadeInUp 0.5s ease ${index * 0.1}s`,
                                      background: candidate.is_boosted && candidate.candidate_id !== selectedCandidateId
                                        ? "#fffbeb"
                                        : undefined,
                                      borderLeft: candidate.is_boosted && candidate.candidate_id !== selectedCandidateId
                                        ? "3px solid #f59e0b"
                                        : undefined,
                                    }}
                                    onClick={() => this.openCandidatePage(candidate)}
                                  >
                                    <td>
                                      <div className="d-flex align-items-center gap-2 gap-md-3">
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
                                          <div className="candidate-name">
                                            {candidate.full_name}
                                          </div>
                                          {!isMobile && (
                                            <small className="text-muted">{candidate.email}</small>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <span className={`status-badge ${candidate.candidateStatus === "Pending" ? "status-pending" :
                                        candidate.candidateStatus === "Rejected" ? "status-rejected" :
                                          "status-shortlisted"
                                        }`}>
                                        {candidate.candidateStatus || "Pending"}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="city-badge">
                                        <i className="fas fa-map-marker-alt me-1 me-md-2"></i>
                                        {candidate.city_name || "Not specified"}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      {candidate.is_boosted ? (
                                        <span style={{
                                          background: "#fef3c7",
                                          color: "#92400e",
                                          border: "1px solid #fcd34d",
                                          borderRadius: "20px",
                                          padding: "4px 10px",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          whiteSpace: "nowrap",
                                        }}>
                                          Featured
                                        </span>
                                      ) : (
                                        <span style={{ color: "#cbd5e0", fontSize: "13px" }}>—</span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      {candidate.has_applied ? (
                                        <span style={{
                                          background: "#d1fae5",
                                          color: "#065f46",
                                          border: "1px solid #6ee7b7",
                                          borderRadius: "20px",
                                          padding: "4px 10px",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          whiteSpace: "nowrap",
                                        }}>
                                          ✓ Applied
                                        </span>
                                      ) : (
                                        <span style={{ color: "#cbd5e0", fontSize: "13px" }}>—</span>
                                      )}
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
                                {[...Array(Math.min(totalPages, isMobile ? 5 : totalPages))].map((_, i) => {
                                  // Show limited page numbers on mobile
                                  let pageNum = i + 1;
                                  if (isMobile && totalPages > 5) {
                                    if (currentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = currentPage - 2 + i;
                                    }
                                  }

                                  return (
                                    <li key={i} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                      <a
                                        className="page-link"
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          this.handlePageChange(pageNum);
                                        }}
                                      >
                                        {pageNum}
                                      </a>
                                    </li>
                                  );
                                })}
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
                          <p className="text-muted small mb-0">
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