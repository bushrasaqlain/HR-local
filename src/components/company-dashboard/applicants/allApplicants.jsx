import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../common/pagination";

import ApplicantFilters from "./applicantFilters";
import ApplicantSearch from "./applicantSearch";
import ApplicantCard from "./applicantCards";

class AllApplicants extends Component {
  state = {
    candidates: [],
    allApplicants: [],
    speciality: [],
    skills: [],
    jobTypes: [],
    currentPage: 1,
    itemsPerPage: 10,
    selectedTabIndex: 0,
    selectedSkillId: "",
    countries: [],
    districts: [],
    cities: [],
    selectedCountryId: "",
    selectedDistrictId: "",
    selectedCityIds: [], // array for multiple cities

    // selectedJobId: "",
    // selectedJobTypeId: "",
    selectedspecialityId: "",
    selectedSalary: {
      min: 0,
      max: 200000,
    },
    availability: {
      day: "",
      shift: "",
    },
    counts: {
      all: 0,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      approved: 0,
    },
  };

  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  userId = sessionStorage.getItem("userId");

  componentDidMount() {
    this.fetchSkills();
    //this.fetchJobTypes();
    this.fetchAllCandidates();
    this.fetchSpeciality();
    this.loadCountries();
  }

  /* ================= FETCH DATA ================= */

  fetchAllCandidates = async () => {
    const { selectedspecialityId, selectedSalary, availability } = this.state;

    try {
      const res = await axios.get(
        `${this.apiBaseUrl}applicantsData/${this.userId}`,
        {
          params: {
            speciality_id: selectedspecialityId || "",
            min_salary: selectedSalary?.min ?? "",
            max_salary: selectedSalary?.max ?? "",
            day: availability?.day || "",
            shift: availability?.shift || "",
            country_id: this.state.selectedCountryId || "",
            district_id: this.state.selectedDistrictId || "",
            city_id: this.state.selectedCityIds.join(","),


          },
        }
      );

      const candidates = res.data.candidate || [];
      this.setState(
        { candidates, allApplicants: candidates },
        () => this.calculateCounts(candidates)
      );
    } catch (error) {
      toast.error("Failed to fetch candidates");
    }
  };
  loadCountries = async () => {
    try {
      // Set limit = 0 to fetch all countries
      const res = await axios.get(`${this.apiBaseUrl}getallCountries`, {
        params: { page: 1, limit: 1000 },
      });

      // Depending on API response structure
      const countries = Array.isArray(res.data.countries)
        ? res.data.countries
        : res.data || [];

      this.setState({ countries });
    } catch (err) {
      console.error("Failed to load countries", err);
      toast.error("Could not load countries");
    }
  };

  loadDistricts = async (countryId) => {
    if (!countryId) {
      this.setState({ districts: [], cities: [] });
      return;
    }

    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldistricts`, {
        params: { country_id: countryId }, // pass country filter if API supports it
      });

      const districts = Array.isArray(res.data)
        ? res.data
        : res.data.districts || res.data.results || [];

      this.setState({ districts, cities: [] }); // reset cities too
    } catch (err) {
      console.error("Failed to load districts", err);
      toast.error("Could not load districts");
    }
  };

  loadCities = async (districtId) => {
    if (!districtId) {
      this.setState({ cities: [] });
      return;
    }

    try {
      const res = await axios.get(`${this.apiBaseUrl}getCitiesByDistrict/${districtId}`);

      const cities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ cities });
    } catch (error) {
      console.error("Failed to load cities", error);
      toast.error("Could not load cities");
    }
  };


  fetchSkills = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallskills`);
      this.setState({ skills: res.data.skills || [] });
    } catch (err) {
      console.error(err);
    }
  };

  // fetchJobTypes = async () => {
  //   try {
  //     const res = await axios.get(`${this.apiBaseUrl}getalljobtypes`);
  //     this.setState({ jobTypes: res.data.jobtypes || [] });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  fetchSpeciality = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallspeciality`);
      this.setState({ speciality: res.data.speciality || [] });
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= COUNTS ================= */

  calculateCounts = (applicants) => {
    const counts = {
      all: applicants.length,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      approved: 0
    };

    applicants.forEach((a) => {
      if (a.candidateStatus === "Pending") counts.pending++;
      if (a.candidateStatus === "Shortlisted") counts.shortlisted++;
      if (a.candidateStatus === "Rejected") counts.rejected++;
      if (a.candidateStatus === "Approved") counts.approved++;
    });

    this.setState({ counts });
  };

  /* ================= ACTIONS ================= */

  handleApplicationStatus = async (id, status) => {
    try {
      await axios.put(`${this.apiBaseUrl}updatestatus/${id}/${status}`);
      toast.success("Status updated successfully");
      this.fetchAllCandidates();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };
  handleFilterChange = async (key, value) => {
    let stateUpdate = { [key]: value, currentPage: 1 };

    if (key === "selectedCountryId") {
      stateUpdate.selectedDistrictId = "";
      stateUpdate.selectedCityIds = [];
    }
    if (key === "selectedDistrictId") {
      stateUpdate.selectedCityIds = [];
    }

    await this.setState(stateUpdate);

    // load dependent lists
    if (key === "selectedCountryId") {
      await this.loadDistricts(value); // value is string
    }
    if (key === "selectedDistrictId") {
      await this.loadCities(value); // value is string
    }

    this.fetchAllCandidates();
  };


  filterApplicants = () => {
    const {
      allApplicants,
      selectedTabIndex,
      selectedSkillId,
      selectedspecialityId,
      selectedSalary,
    } = this.state;

    return allApplicants.filter((item) => {

      const statusMatch =
        selectedTabIndex === 0
          ? true
          : selectedTabIndex === 1
            ? item.candidateStatus === "Pending"
            : selectedTabIndex === 2
              ? item.candidateStatus === "Shortlisted"
              : selectedTabIndex === 3
                ? item.candidateStatus === "Rejected"
                : selectedTabIndex === 4
                  ? item.candidateStatus === "Approved"
                  : true;

      const skillMatch = selectedSkillId
        ? item.skill_ids?.includes(Number(selectedSkillId))
        : true;

      const specialityMatch = selectedspecialityId
        ? Number(item.speciality_id) === Number(selectedspecialityId)
        : true;

      const salaryMatch = selectedSalary
        ? item.expected_salary >= (selectedSalary.min || 0) &&
        item.expected_salary <= (selectedSalary.max || Infinity)
        : true;
      const cityMatch =
        this.state.selectedCityIds.length > 0
          ? this.state.selectedCityIds.includes(String(item.city_id))
          : true;


      return statusMatch && skillMatch && specialityMatch && salaryMatch && cityMatch;
    });
  };


  /* ================= RENDER ================= */

  render() {
    const {
      currentPage,
      itemsPerPage,
      counts,
      skills,
      // jobTypes,
      speciality,
      selectedspecialityId
    } = this.state;

    const filteredApplicants = this.filterApplicants();

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentCandidates = filteredApplicants.slice(
      indexOfFirst,
      indexOfLast
    );

    const totalPages = Math.ceil(
      filteredApplicants.length / itemsPerPage
    );

    return (
      <Row className="g-4">
        {/* LEFT SIDEBAR FILTERS */}
        <Col lg="3">
          <ApplicantFilters
            counts={counts}
            skills={skills}
            // jobTypes={jobTypes}
            speciality={speciality}
            selectedspecialityId={selectedspecialityId}
            countries={this.state.countries || []}
            districts={this.state.districts || []}
            cities={this.state.cities || []}
            selectedCountryId={this.state.selectedCountryId}
            selectedDistrictId={this.state.selectedDistrictId}
            selectedCityIds={this.state.selectedCityIds}
            selectedTabIndex={this.state.selectedTabIndex}
            selectedSkillId={this.state.selectedSkillId}
            selectedSalary={this.state.selectedSalary}
            // selectedJobTypeId={this.state.selectedJobTypeId}
            onChange={this.handleFilterChange}
          />
        </Col>

        {/* RIGHT CONTENT */}
        <Col lg="9">
          {/* SEARCH BAR */}
          <ApplicantSearch />

          {/* APPLICANTS LIST */}
          <Row className="mt-3">
            {currentCandidates.length > 0 ? (
              currentCandidates.map((candidate) => (
                <Col md="6" key={candidate.id} className="mb-4">
                  <ApplicantCard
                    candidate={candidate}
                    onStatusChange={this.handleApplicationStatus}
                  />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-center">No candidates found</p>
              </Col>
            )}
          </Row>

          {/* PAGINATION */}
          {filteredApplicants.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={this.handlePageChange}
            />
          )}
        </Col>
      </Row>
    );
  }
}

export default AllApplicants;
