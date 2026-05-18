import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import axios from "axios";
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
      jobMessage: "",
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
      counts: { all: 0, pending: 0, shortlisted: 0, rejected: 0, approved: 0 },
      splitViewActive: false,
      selectedCandidateId: null,
      windowWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
      mobileDetailView: false,
      // Budget state for daily_budget jobs
      budgetStatus: null,
      // Track which candidates are being unlocked (loading state)
      unlockingIds: new Set(),
    };
    this.openCandidatePage = this.openCandidatePage.bind(this);
  }

  componentDidMount() {
    this.fetchAllCandidates();
    this.fetchPostedJobs();
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
    if (this.state.mobileDetailView && window.innerWidth > 768) {
      this.setState({ mobileDetailView: false, splitViewActive: true });
    }
    if (this.state.splitViewActive && window.innerWidth <= 768 && this.state.selectedCandidate) {
      this.setState({ splitViewActive: false, mobileDetailView: true });
    }
  };

  openCandidatePage(candidate) {
    if (candidate.locked) return; // locked candidates are not clickable
    const isMobile = this.state.windowWidth <= 768;

    this.trackCandidateProfileView(
      candidate.account_id || candidate.candidate_id || candidate.id,
      Number(this.state.selectedJobId) || null
    );

    this.setState({
      selectedCandidate: null,
    }, () => {
      this.setState({
        selectedCandidate: candidate,
        selectedCandidateId: candidate.id,
        splitViewActive: !isMobile,
        mobileDetailView: isMobile,
        showCandidateInfo: true,
      });
    });
  }

  trackCandidateProfileView = async (candidateAccountId, jobId) => {
    console.log("🔍 trackCandidateProfileView called with:", { candidateAccountId, jobId });
    if (!candidateAccountId) return;
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${this.apiBaseUrl}candidateProfile/track-profile-view/${candidateAccountId}`,
        { job_id: jobId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Profile view tracked:", candidateAccountId);
    } catch (err) {
      console.error("Profile view tracking failed:", err);
    }
  };

  closeDetailView = () => {
    this.setState({ mobileDetailView: false, splitViewActive: false });
  };

  closeSplitView = () => {
    this.setState({ splitViewActive: false });
  };

  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  userId     = sessionStorage.getItem("userId");

  fetchPostedJobs = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      const res    = await axios.get(`${this.apiBaseUrl}job/managejob/${userId}`);
      const jobs   = res.data || [];
      const activeJobs = jobs.filter((job) => job.status === "Active");
      this.setState({ postedJobs: activeJobs }, () => {
        if (activeJobs.length > 0) {
          const latestJobId = activeJobs[0].id;
          this.setState({ selectedJobId: latestJobId, showFilters: true }, () => {
            this.fetchAllCandidates();
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  handleSearch = (searchFilters) => {
    this.setState({ searchFilters, currentPage: 1 }, () => this.fetchAllCandidates());
  };

  fetchAllCandidates = async () => {
    const {
      selectedSkillId, selectedspecialityId, selectedSalary,
      selectedExperience, availability, selectedJobId,
      selectedCountryId, selectedDistrictId, selectedCityIds,
    } = this.state;

    if (!selectedJobId) {
      this.setState({ candidates: [], allApplicants: [] });
      return;
    }

    try {
      const res = await axios.get(
        `${this.apiBaseUrl}applicant/applicantsData/${this.userId}`,
        {
          params: {
            skill_id:        selectedSkillId,
            job_id:          selectedJobId,
            speciality_id:   selectedspecialityId || "",
            min_salary:      selectedSalary?.min ?? "",
            max_salary:      selectedSalary?.max ?? "",
            day:             availability?.day    || "",
            shift:           availability?.shift  || "",
            country_id:      selectedCountryId    || "",
            district_id:     selectedDistrictId   || "",
            city_id:         selectedCityIds.join(","),
            query:           this.state.searchFilters.query || "",
            min_experience:  selectedExperience?.min ?? "",
            max_experience:  selectedExperience?.max ?? "",
          },
        }
      );

      const candidatesRaw = res.data.candidate     || [];
      const budgetStatus  = res.data.budget_status || null;

      const jobCityId = this.state.postedJobs.find(
        (j) => j.id === Number(this.state.selectedJobId)
      )?.city_id;

      const cityMapObj = {};
      (this.state.cities || []).forEach((city) => { cityMapObj[city.id] = city.name; });

      // For locked candidates we skip the expensive mapping — they have no PII anyway
      const candidates = candidatesRaw.map((c) => {
        if (c.locked) return c; // pass through as-is

        const otherPreferredCities = (c.otherPreferredCities || []).map((city) => {
          if (typeof city === "number") return { id: city, name: cityMapObj[city] || "" };
          return { id: city.id, name: city.name || cityMapObj[city.id] || "" };
        });

        const mainCityMatch      = Number(c.city) === Number(jobCityId);
        const preferredCityMatch = otherPreferredCities.some(
          (city) => Number(city.id) === Number(jobCityId)
        );

        let city_name = "-";
        if (mainCityMatch)           city_name = c.city_name || cityMapObj[c.city] || "-";
        else if (preferredCityMatch) {
          const matchedCity = otherPreferredCities.find((city) => Number(city.id) === Number(jobCityId));
          city_name = matchedCity?.name || "-";
        } else {
          city_name = c.city_name || cityMapObj[c.city] || "-";
        }

        const age        = c.date_of_birth ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear() : null;
        const skill_names = (c.skills || []).map((s) => s.name || s);
        const speciality_name = c.experience?.length > 0 && c.experience[0].speciality
          ? c.experience[0].speciality.name
          : "-";
        const availabilityList = c.availability_times
          ? c.availability_times.split("|").map((s) => { const [day, time] = s.split(" "); return { day, time }; })
          : [];

        return {
          ...c,
          age, skill_names, speciality_name, city_name,
          otherPreferredCities, availabilityList,
          resume: c.resume || null,
          address: c.address || "",
        };
      });

      this.setState(
        { candidates, selectedStatus: "Pending", allApplicants: candidates, jobMessage: "", budgetStatus },
        () => this.calculateCounts(candidates)
      );
    } catch (error) {
      console.error(error);
      const apiError = error.response?.data?.error;
      if (apiError === "Job not found" || apiError === "Job is pending approval") {
        this.setState({
          candidates: [], allApplicants: [],
          jobMessage: "This job is pending approval. Candidates will appear once it is approved.",
        });
      } else {
        this.setState({ jobMessage: "Something went wrong while loading candidates." });
      }
    }
  };

  // ─── Unlock a single locked candidate ───────────────────────────
  unlockCandidate = async (candidateId) => {
    // Add to loading set
    this.setState((prev) => {
      const unlockingIds = new Set(prev.unlockingIds);
      unlockingIds.add(candidateId);
      return { unlockingIds };
    });

    try {
      const res = await axios.post(`${this.apiBaseUrl}applicant/unlock-candidate`, {
        candidateId,
        jobId: this.state.selectedJobId,
      });

      const { candidate, budget_status } = res.data;

      // Replace the locked placeholder with the full candidate data
      const merge = (list) =>
        list.map((c) =>
          (c.candidate_id === candidateId || c.id === candidateId)
            ? {
                ...c,
                ...candidate,
                id: candidate.id || candidateId,
                locked: false,
                // Re-parse skills if they came back as IDs
                skills: Array.isArray(candidate.skills) ? candidate.skills : [],
              }
            : c
        );

      this.setState((prev) => ({
        candidates:    merge(prev.candidates),
        allApplicants: merge(prev.allApplicants),
        budgetStatus:  budget_status || prev.budgetStatus,
      }), () => this.calculateCounts(this.state.allApplicants));

    } catch (error) {
      const msg = error.response?.data?.error;
      if (msg === "Daily budget exhausted") {
        alert("Your daily budget is exhausted. Please increase it or wait until tomorrow to unlock more candidates.");
      } else {
        console.error("Failed to unlock candidate", error);
        alert("Something went wrong while unlocking this candidate. Please try again.");
      }
    } finally {
      this.setState((prev) => {
        const unlockingIds = new Set(prev.unlockingIds);
        unlockingIds.delete(candidateId);
        return { unlockingIds };
      });
    }
  };

  loadCities = async (districtId) => {
    if (!districtId) { this.setState({ cities: [] }); return; }
    try {
      const res   = await axios.get(`${this.apiBaseUrl}getCitiesByDistrict/${districtId}`);
      const cities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ cities });
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };

  calculateCounts = (applicants) => {
    const counts = { all: applicants.length, pending: 0, shortlisted: 0, rejected: 0, approved: 0 };
    applicants.forEach((a) => {
      if (a.candidateStatus === "Pending")     counts.pending++;
      if (a.candidateStatus === "Shortlisted") counts.shortlisted++;
      if (a.candidateStatus === "Rejected")    counts.rejected++;
      if (a.candidateStatus === "Approved")    counts.approved++;
    });
    this.setState({ counts });
  };

  handleApplicationStatus = async (
    candidateId, jobId, status = "Shortlisted",
    interview_day = null, interview_time = null,
  ) => {
    if (!jobId) { console.error("Job ID is required to update status"); return; }
    try {
      await axios.post(`${this.apiBaseUrl}applicant/updatestatus`, {
        candidateId, jobId, status,
        ...(interview_day  && { interview_day  }),
        ...(interview_time && { interview_time }),
      });
      this.fetchAllCandidates();
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  handlePageChange   = (page)        => this.setState({ currentPage: page });
  handleFilterChange = async (key, value) => {
    await this.setState({ [key]: value, currentPage: 1 });
    this.fetchAllCandidates();
  };

  filterApplicants = () => {
    const { allApplicants, searchFilters, selectedStatus } = this.state;
    const query = searchFilters.query?.toLowerCase() || "";
    return allApplicants.filter((candidate) => {
      const statusMatch = selectedStatus
        ? String(candidate.candidateStatus || "").trim().toLowerCase() === selectedStatus.toLowerCase()
        : true;
      const cityMatch = this.state.selectedCityId
        ? Number(candidate.city) === Number(this.state.selectedCityId) ||
          candidate.otherPreferredCities?.some((city) => Number(city.id) === Number(this.state.selectedCityId))
        : true;
      let searchMatch = true;
      if (query && !candidate.locked) {
        const nameMatch  = candidate.full_name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);
        searchMatch = nameMatch || emailMatch;
      }
      return statusMatch && cityMatch && searchMatch;
    });
  };

  renderTierBadge(candidate) {
    const tier  = candidate.tier;
    const label = candidate.tier_label;
    if (!tier || !label) return null;
    const styles = {
      strong: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
      good:   { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" },
      weak:   { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
    };
    return (
      <span style={{
        ...(styles[tier] || {}),
        borderRadius: "20px", padding: "3px 10px",
        fontSize: "11px", fontWeight: 600,
        whiteSpace: "nowrap", display: "inline-block",
      }}>
        {label}
      </span>
    );
  }

  // ─── Budget banner for daily_budget jobs ────────────────────────
  renderBudgetBanner() {
    const { budgetStatus } = this.state;
    if (!budgetStatus || budgetStatus.model !== "daily_budget") return null;

    const { daily_cap, spent_today, remaining_today, is_exhausted, cost_per_click } = budgetStatus;
    const pct = daily_cap > 0 ? Math.min(100, Math.round((spent_today / daily_cap) * 100)) : 0;

    return (
      <div style={{
        background: is_exhausted ? "#fee2e2" : "#eff6ff",
        border: `1px solid ${is_exhausted ? "#fca5a5" : "#bfdbfe"}`,
        borderRadius: "12px", padding: "0.9rem 1.2rem",
        marginBottom: "1rem", fontSize: "0.85rem",
        color: is_exhausted ? "#991b1b" : "#1e40af",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 600 }}>
            {is_exhausted
              ? "⚠️ Daily budget exhausted — unlock disabled until tomorrow"
              : `💰 Daily budget: PKR ${remaining_today?.toFixed(0)} remaining`}
          </span>
          <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>
            PKR {cost_per_click} per unlock
          </span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: "99px", height: "6px" }}>
          <div style={{
            height: "6px", borderRadius: "99px",
            width: `${pct}%`,
            background: is_exhausted ? "#ef4444" : "#3b82f6",
            transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ marginTop: "0.3rem", fontSize: "0.75rem", opacity: 0.75 }}>
          PKR {spent_today?.toFixed(2)} spent of PKR {daily_cap?.toFixed(2)}
        </div>
      </div>
    );
  }

  /* =================== RENDER =================== */
  render() {
    const {
      currentPage, itemsPerPage, counts,
      splitViewActive, selectedCandidate, selectedCandidateId,
      mobileDetailView, windowWidth, unlockingIds, budgetStatus,
    } = this.state;

    const filteredApplicants  = this.filterApplicants();
    const indexOfLast         = currentPage * itemsPerPage;
    const indexOfFirst        = indexOfLast - itemsPerPage;
    const currentCandidates   = filteredApplicants.slice(indexOfFirst, indexOfLast);
    const totalPages          = Math.ceil(filteredApplicants.length / itemsPerPage);

    const isMobile    = windowWidth <= 768;
    const isTablet    = windowWidth > 768 && windowWidth <= 1024;
    const leftPanelWidth  = isMobile ? "100%" : isTablet ? "35%" : "25%";
    const rightPanelWidth = isMobile ? "100%" : isTablet ? "65%" : "75%";

    const showSplitView    = splitViewActive  && selectedCandidate && !isMobile;
    const showMobileDetail = mobileDetailView && selectedCandidate && isMobile;
    const showListView     = !showSplitView && !showMobileDetail;

    const isDailyBudgetJob = budgetStatus?.model === "daily_budget";
    const budgetExhausted  = budgetStatus?.is_exhausted === true;

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
            @media (min-width: 768px)  { .candidate-dashboard { padding: 1.5rem; } }
            @media (min-width: 1024px) { .candidate-dashboard { padding: 2rem; } }

            .job-selector-card {
              background: rgba(255,255,255,0.95);
              backdrop-filter: blur(10px);
              border-radius: 15px;
              padding: 1.2rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              margin-bottom: 1rem;
            }
            @media (min-width: 768px)  { .job-selector-card { padding: 1.5rem; border-radius: 20px; } }
            @media (min-width: 1024px) { .job-selector-card { padding: 2rem; } }

            .job-label {
              font-size: 0.9rem; font-weight: 600; color: #2d3748;
              margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;
            }
            @media (min-width: 768px)  { .job-label { font-size: 1rem;   margin-bottom: 0.8rem; } }
            @media (min-width: 1024px) { .job-label { font-size: 1.1rem; } }
            .job-label i { color: #667eea; font-size: 1.1rem; }
            @media (min-width: 768px) { .job-label i { font-size: 1.3rem; } }

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
            @media (min-width: 768px) { .styled-select { padding: 1rem 1.5rem; font-size: 1rem; border-radius: 15px; background-size: 1.2rem; } }
            .styled-select:hover, .styled-select:focus {
              border-color: #667eea;
              box-shadow: 0 5px 15px rgba(102,126,234,0.2);
              outline: none;
            }

            .stats-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 0.8rem; margin-bottom: 1.5rem;
            }
            @media (min-width: 768px) { .stats-cards { gap: 1rem; margin-bottom: 2rem; } }

            .stat-card {
              background: white; border-radius: 12px; padding: 1rem;
              text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.05);
              border: 1px solid rgba(0,0,0,0.05); transition: transform 0.3s ease;
            }
            @media (min-width: 768px) { .stat-card { padding: 1.2rem; border-radius: 15px; } }
            .stat-card:hover { transform: translateY(-5px); }
            .stat-icon { font-size: 1.5rem; margin-bottom: 0.3rem; }
            @media (min-width: 768px) { .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; } }
            .stat-label { font-size: 0.8rem; color: #718096; margin-bottom: 0.2rem; }
            @media (min-width: 768px) { .stat-label { font-size: 0.9rem; margin-bottom: 0.3rem; } }
            .stat-value { font-size: 1.2rem; font-weight: 700; color: #2d3748; }
            @media (min-width: 768px) { .stat-value { font-size: 1.5rem; } }
            .stat-value.total       { color: #667eea; }
            .stat-value.pending     { color: #fbbf24; }
            .stat-value.shortlisted { color: #10b981; }
            .stat-value.rejected    { color: #ef4444; }

            .split-view-container {
              display: flex;
              flex-direction: ${isMobile ? "column" : "row"};
              gap: 1rem;
              min-height: ${isMobile ? "auto" : "calc(100vh - 250px)"};
            }
            @media (min-width: 768px) { .split-view-container { gap: 1.5rem; } }

            .left-panel {
              flex: ${isMobile ? "1 1 auto" : `0 0 ${leftPanelWidth}`};
              background: white; border-radius: 15px; padding: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow-y: auto;
              max-height: ${isMobile ? "400px" : "calc(100vh - 250px)"};
              margin-bottom: ${isMobile ? "1rem" : "0"};
            }
            @media (min-width: 768px)  { .left-panel { padding: 1.2rem; border-radius: 18px; } }
            @media (min-width: 1024px) { .left-panel { padding: 1.5rem; border-radius: 20px; } }

            .right-panel {
              flex: ${isMobile ? "1 1 auto" : `0 0 ${rightPanelWidth}`};
              background: white; border-radius: 15px; padding: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow-y: auto;
              max-height: ${isMobile ? "auto" : "calc(100vh - 250px)"};
              position: relative;
            }
            @media (min-width: 768px)  { .right-panel { padding: 1.2rem; border-radius: 18px; } }
            @media (min-width: 1024px) { .right-panel { padding: 1.5rem; border-radius: 20px; } }

            .close-split-view {
              position: ${isMobile ? "relative" : "absolute"};
              top: ${isMobile ? "0" : "1rem"};
              right: ${isMobile ? "0" : "1rem"};
              margin-bottom: ${isMobile ? "1rem" : "0"};
              margin-left: ${isMobile ? "auto" : "0"};
              background: #fee2e2; border: none; border-radius: 50%;
              width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
              color: #991b1b; cursor: pointer; transition: all 0.3s ease; z-index: 10;
            }
            @media (min-width: 768px) { .close-split-view { width: 35px; height: 35px; } }
            .close-split-view:hover { background: #fecaca; transform: scale(1.1); }

            .mobile-detail-view {
              background: white; border-radius: 15px; padding: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative;
            }
            .back-to-list {
              display: inline-flex; align-items: center; gap: 0.5rem;
              background: #f7fafc; border: 1px solid #e2e8f0;
              border-radius: 50px; padding: 0.5rem 1rem; margin-bottom: 1rem;
              color: #2d3748; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease;
            }
            .back-to-list:hover { background: #edf2f7; border-color: #cbd5e0; }

            .compact-candidate-list  { display: flex; flex-direction: column; gap: 0.5rem; }
            .compact-candidate-item  {
              display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem;
              border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
              border: 2px solid transparent;
            }
            @media (min-width: 768px) { .compact-candidate-item { gap: 1rem; padding: 0.75rem; border-radius: 10px; } }
            .compact-candidate-item:hover   { background: #f7fafc; border-color: #e2e8f0; }
            .compact-candidate-item.selected {
              background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
              border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.3);
            }
            .compact-avatar {
              width: 35px; height: 35px; border-radius: 50%; object-fit: cover;
              border: 2px solid #667eea;
            }
            @media (min-width: 768px) { .compact-avatar { width: 40px; height: 40px; } }
            .compact-candidate-item.selected .compact-avatar { border-color: #764ba2; }
            .compact-info  { flex: 1; min-width: 0; }
            .compact-name  { font-weight: 600; color: #2d3748; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .compact-candidate-item.selected .compact-name { color: #667eea; font-weight: 700; }
            @media (min-width: 768px) { .compact-name { font-size: 0.9rem; } }
            .compact-email { font-size: 0.75rem; color: #718096; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            @media (min-width: 768px) { .compact-email { font-size: 0.8rem; } }

            .candidates-table-card {
              background: white; border-radius: 15px; padding: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow-x: auto;
            }
            @media (min-width: 768px) { .candidates-table-card { padding: 1.5rem; border-radius: 20px; } }
            .table { min-width: 500px; }

            .candidate-row {
              transition: all 0.3s ease; border: 2px solid transparent;
            }
            .candidate-row:not(.locked-row) { cursor: pointer; }
            .candidate-row:not(.locked-row):hover {
              background: #f7fafc; transform: scale(1.01);
              box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .candidate-row.selected {
              background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
              border-left: 4px solid #667eea; border-right: 4px solid #764ba2;
            }
            .locked-row { background: #fafafa; }

            .candidate-avatar {
              width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
              border: 3px solid #667eea; box-shadow: 0 5px 10px rgba(102,126,234,0.2);
              transition: all 0.3s ease;
            }
            @media (min-width: 768px) { .candidate-avatar { width: 50px; height: 50px; } }
            .candidate-row.selected .candidate-avatar { border-color: #764ba2; transform: scale(1.05); }
            .candidate-avatar:hover { transform: scale(1.1); border-color: #764ba2; }

            .candidate-name { font-weight: 600; color: #2d3748; transition: color 0.3s ease; font-size: 0.9rem; }
            .candidate-row.selected .candidate-name { color: #667eea; font-weight: 700; }
            @media (min-width: 768px) { .candidate-name { font-size: 1rem; } }
            .candidate-name:hover { color: #667eea; }

            .status-badge {
              padding: 0.4rem 0.8rem; border-radius: 50px; font-weight: 600;
              font-size: 0.75rem; display: inline-block; text-align: center;
              min-width: 80px; white-space: nowrap;
            }
            @media (min-width: 768px) { .status-badge { padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; } }
            .status-pending     { background: #fef3c7; color: #92400e; }
            .status-shortlisted { background: #d1fae5; color: #065f46; }
            .status-rejected    { background: #fee2e2; color: #991b1b; }

            .city-badge {
              background: #e2e8f0; color: #2d3748; padding: 0.4rem 0.8rem;
              border-radius: 50px; font-size: 0.75rem; display: inline-block; white-space: nowrap;
            }
            @media (min-width: 768px) { .city-badge { padding: 0.5rem 1rem; font-size: 0.85rem; } }

            .unlock-btn {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; border: none; border-radius: 20px;
              padding: 5px 14px; font-size: 12px; font-weight: 600;
              cursor: pointer; white-space: nowrap; transition: all 0.2s ease;
            }
            .unlock-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
            .unlock-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .unlock-btn.budget-exhausted {
              background: #e2e8f0; color: #718096; cursor: not-allowed;
            }

            .locked-avatar-placeholder {
              width: 40px; height: 40px; border-radius: 50%;
              background: #e2e8f0; display: flex; align-items: center; justify-content: center;
              border: 2px dashed #cbd5e0; flex-shrink: 0;
            }
            @media (min-width: 768px) { .locked-avatar-placeholder { width: 50px; height: 50px; } }

            .blurred-text {
              filter: blur(5px); user-select: none; pointer-events: none;
              color: #718096; font-size: 0.9rem; font-weight: 600;
            }

            .empty-state  { text-align: center; padding: 2rem 1rem; }
            @media (min-width: 768px) { .empty-state { padding: 4rem 2rem; } }
            .empty-icon   { font-size: 3rem; color: #cbd5e0; margin-bottom: 1rem; }
            @media (min-width: 768px) { .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; } }
            .empty-text   { font-size: 1rem; color: #718096; margin-bottom: 0.8rem; }
            @media (min-width: 768px) { .empty-text { font-size: 1.2rem; margin-bottom: 1rem; } }

            .pagination-wrapper {
              display: flex; justify-content: center; margin-top: 1.5rem;
              overflow-x: auto; padding: 0.5rem 0;
            }
            @media (min-width: 768px) { .pagination-wrapper { margin-top: 2rem; } }
            .custom-pagination { display: flex; gap: 0.3rem; list-style: none; padding: 0; margin: 0; }
            @media (min-width: 768px) { .custom-pagination { gap: 0.5rem; } }
            .page-link {
              display: flex; align-items: center; justify-content: center;
              width: 32px; height: 32px; border-radius: 50%;
              background: white; color: #2d3748; text-decoration: none;
              transition: all 0.3s ease; border: 1px solid #e2e8f0;
              font-weight: 500; font-size: 0.85rem;
            }
            @media (min-width: 768px) { .page-link { width: 40px; height: 40px; font-size: 1rem; } }
            .page-link:hover, .page-item.active .page-link {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; border-color: transparent;
              transform: scale(1.1); box-shadow: 0 5px 15px rgba(102,126,234,0.3);
            }

            @media (max-width: 768px) {
              .table td, .table th { padding: 0.6rem; }
              .d-flex.align-items-center.gap-3 { gap: 0.5rem !important; }
              .candidate-avatar { width: 35px; height: 35px; border-width: 2px; }
            }
          `}</style>

          <Row className="justify-content-center">
            <Col lg={splitViewActive ? "12" : "10"} xs="12">

              {/* Job Selection */}
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
                    console.log("📌 Job selected:", selectedJobId);
                    await this.setState({
                      selectedJobId, showFilters: !!selectedJobId,
                      splitViewActive: false, mobileDetailView: false,
                      selectedCandidate: null, selectedCandidateId: null,
                      budgetStatus: null,
                    });
                    if (selectedJobId) this.fetchAllCandidates();
                  }}
                >
                  <option value="">-- Choose a job to view candidates --</option>
                  {this.state.postedJobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.job_title}</option>
                  ))}
                </select>
              </div>

              {this.state.jobMessage && (
                <div className="alert alert-warning mt-3">{this.state.jobMessage}</div>
              )}

              {/* Budget banner (daily_budget jobs only) */}
              {this.state.showFilters && this.renderBudgetBanner()}

              {this.state.showFilters && (
                <>
                  {/* ── Split View (desktop) ── */}
                  {showSplitView && (
                    <div className="split-view-container">
                      <div className="left-panel">
                        <h5 className="mb-2 mb-md-3">Candidates List</h5>
                        <div className="compact-candidate-list">
                          {currentCandidates.map((candidate) => {
                            const cId   = candidate.candidate_id || candidate.id;
                            const isLocked    = candidate.locked === true;
                            const isUnlocking = unlockingIds.has(cId);
                            return (
                              <div
                                key={cId}
                                className={`compact-candidate-item ${cId === selectedCandidateId ? "selected" : ""}`}
                                onClick={() => !isLocked && this.openCandidatePage(candidate)}
                                style={{ cursor: isLocked ? "default" : "pointer" }}
                              >
                                {isLocked ? (
                                  <div className="locked-avatar-placeholder">
                                    <i className="fas fa-lock" style={{ color: "#a0aec0", fontSize: "14px" }}></i>
                                  </div>
                                ) : (
                                  <img
                                    src={candidate.passport_photo
                                      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidate.passport_photo.replace(/^\/+/, "")}`
                                      : "/images/user.png"}
                                    alt={candidate.full_name}
                                    className="compact-avatar"
                                    onError={(e) => { e.target.src = "/images/user.png"; }}
                                  />
                                )}
                                <div className="compact-info">
                                  {isLocked ? (
                                    <>
                                      <div className="blurred-text">██████████</div>
                                      <div style={{ marginTop: "4px" }}>{this.renderTierBadge(candidate)}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="compact-name">{candidate.full_name}</div>
                                      <div className="compact-email">{candidate.email || ""}</div>
                                      {this.renderTierBadge(candidate)}
                                    </>
                                  )}
                                </div>
                                {isLocked && (
                                  <button
                                    className={`unlock-btn${budgetExhausted ? " budget-exhausted" : ""}`}
                                    disabled={isUnlocking || budgetExhausted}
                                    onClick={(e) => { e.stopPropagation(); if (!budgetExhausted) this.unlockCandidate(cId); }}
                                  >
                                    {isUnlocking ? "..." : budgetExhausted ? "🔒" : "🔓 Unlock"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {filteredApplicants.length > itemsPerPage && (
                          <div className="pagination-wrapper mt-2">
                            <ul className="custom-pagination">
                              <li className="page-item">
                                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) this.handlePageChange(currentPage - 1); }}>
                                  <i className="fas fa-chevron-left"></i>
                                </a>
                              </li>
                              <li className="page-item">
                                <span className="page-link">{currentPage} / {totalPages}</span>
                              </li>
                              <li className="page-item">
                                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) this.handlePageChange(currentPage + 1); }}>
                                  <i className="fas fa-chevron-right"></i>
                                </a>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="right-panel">
                        <button className="close-split-view" onClick={this.closeSplitView} title="Close split view">
                          <i className="fas fa-times"></i>
                        </button>
                        <CandidateInfo
                          key={selectedCandidate?.id}
                          candidate={selectedCandidate}
                          selectedJobId={this.state.selectedJobId}
                          onBack={this.closeSplitView}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Mobile Detail View ── */}
                  {showMobileDetail && (
                    <div className="mobile-detail-view">
                      <div className="back-to-list" onClick={this.closeDetailView}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Candidates List</span>
                      </div>
                      <CandidateInfo
                        key={selectedCandidate?.id}
                        candidate={selectedCandidate}
                        selectedJobId={this.state.selectedJobId}
                        onBack={this.closeDetailView}
                      />
                    </div>
                  )}

                  {/* ── List View ── */}
                  {showListView && (
                    <div className="candidates-table-card">
                      {currentCandidates.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-rounded align-middle mb-0">
                              <thead className="text-center rounded">
                                <tr>
                                  {["Candidate", "Status", "Location", "Match", "Action"].map((h) => (
                                    <th key={h} className="text-white p-2 p-md-3 border-bottom border-1" style={{ background: "#5f8190" }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="border-2">
                                {currentCandidates.map((candidate, index) => {
                                  const cId      = candidate.candidate_id || candidate.id;
                                  const isLocked    = candidate.locked === true;
                                  const isUnlocking = unlockingIds.has(cId);
                                  const isSelected  = cId === selectedCandidateId;

                                  return (
                                    <tr
                                      key={cId}
                                      className={`candidate-row${isLocked ? " locked-row" : ""}${isSelected ? " selected" : ""}`}
                                      style={{
                                        animation: `fadeInUp 0.5s ease ${index * 0.1}s`,
                                        background: !isLocked && candidate.is_boosted && !isSelected
                                          ? "#fffbeb" : undefined,
                                        borderLeft: !isLocked && candidate.is_boosted && !isSelected
                                          ? "3px solid #f59e0b" : undefined,
                                      }}
                                      onClick={() => !isLocked && this.openCandidatePage(candidate)}
                                    >
                                      {/* Candidate column */}
                                      <td>
                                        <div className="d-flex align-items-center gap-2 gap-md-3">
                                          {isLocked ? (
                                            <div className="locked-avatar-placeholder">
                                              <i className="fas fa-lock" style={{ color: "#a0aec0", fontSize: "16px" }}></i>
                                            </div>
                                          ) : (
                                            <img
                                              src={candidate.passport_photo
                                                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${candidate.passport_photo.replace(/^\/+/, "")}`
                                                : "/images/user.png"}
                                              alt={candidate.full_name}
                                              className="candidate-avatar"
                                              onError={(e) => { e.target.src = "/images/user.png"; }}
                                            />
                                          )}
                                          <div>
                                            {isLocked ? (
                                              <div className="blurred-text">███████████</div>
                                            ) : (
                                              <>
                                                <div className="candidate-name">{candidate.full_name}</div>
                                                {!isMobile && <small className="text-muted">{candidate.email}</small>}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Status */}
                                      <td className="text-center">
                                        {isLocked ? (
                                          <span className="status-badge status-pending" style={{ opacity: 0.4 }}>—</span>
                                        ) : (
                                          <span className={`status-badge ${
                                            candidate.candidateStatus === "Pending"
                                              ? "status-pending"
                                              : candidate.candidateStatus === "Rejected"
                                              ? "status-rejected"
                                              : "status-shortlisted"
                                          }`}>
                                            {candidate.candidateStatus || "Pending"}
                                          </span>
                                        )}
                                      </td>

                                      {/* Location */}
                                      <td className="text-center">
                                        <span className="city-badge">
                                          <i className="fas fa-map-marker-alt me-1 me-md-2"></i>
                                          {candidate.city_name || "Not specified"}
                                        </span>
                                      </td>

                                      {/* Match tier */}
                                      <td className="text-center">
                                        {this.renderTierBadge(candidate)}
                                      </td>

                                      {/* Action: Unlock btn OR Applied badge OR dash */}
                                      <td className="text-center">
                                        {isLocked ? (
                                          <button
                                            className={`unlock-btn${budgetExhausted ? " budget-exhausted" : ""}`}
                                            disabled={isUnlocking || budgetExhausted}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!budgetExhausted) this.unlockCandidate(cId);
                                            }}
                                            title={budgetExhausted
                                              ? "Daily budget exhausted"
                                              : `Unlock for PKR ${budgetStatus?.cost_per_click || ""}`}
                                          >
                                            {isUnlocking
                                              ? <><i className="fas fa-spinner fa-spin me-1"></i>Unlocking...</>
                                              : budgetExhausted
                                              ? "🔒 Budget full"
                                              : `🔓 Unlock${budgetStatus?.cost_per_click ? ` (PKR ${budgetStatus.cost_per_click})` : ""}`
                                            }
                                          </button>
                                        ) : candidate.has_applied ? (
                                          <span style={{
                                            background: "#d1fae5", color: "#065f46",
                                            border: "1px solid #6ee7b7", borderRadius: "20px",
                                            padding: "4px 10px", fontSize: "11px", fontWeight: 600,
                                            whiteSpace: "nowrap",
                                          }}>
                                            ✓ Applied
                                          </span>
                                        ) : (
                                          <span style={{ color: "#cbd5e0", fontSize: "13px" }}>—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {filteredApplicants.length > itemsPerPage && (
                            <div className="pagination-wrapper">
                              <ul className="custom-pagination">
                                <li className="page-item">
                                  <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) this.handlePageChange(currentPage - 1); }}>
                                    <i className="fas fa-chevron-left"></i>
                                  </a>
                                </li>
                                {[...Array(Math.min(totalPages, isMobile ? 5 : totalPages))].map((_, i) => {
                                  let pageNum = i + 1;
                                  if (isMobile && totalPages > 5) {
                                    if      (currentPage <= 3)             pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else                                    pageNum = currentPage - 2 + i;
                                  }
                                  return (
                                    <li key={i} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                                      <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); this.handlePageChange(pageNum); }}>
                                        {pageNum}
                                      </a>
                                    </li>
                                  );
                                })}
                                <li className="page-item">
                                  <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) this.handlePageChange(currentPage + 1); }}>
                                    <i className="fas fa-chevron-right"></i>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon"><i className="fas fa-users-slash"></i></div>
                          <div className="empty-text">No candidates found for this position</div>
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