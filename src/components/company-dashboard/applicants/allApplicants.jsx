import React, { Component } from "react";
import { Row, Col, Container } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../common/pagination";

import ApplicantFilters from "./applicantFilters";
import ApplicantSearch from "./applicantSearch";
import ApplicantCard from "./applicantCards";
import CandidateInfo from "./candidateinfo";
class AllApplicants extends Component {
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
      selectedSkillId: "",
      countries: [],
      districts: [],
      cities: [],
      selectedCountryId: "",
      selectedDistrictId: "",
      selectedCandidate: null,
      showCandidateInfo: false,
      selectedCityIds: [], // array for multiple cities
      searchFilters: {},

      // selectedJobId: "",
      // selectedJobTypeId: "",
      selectedspecialityId: "",
      selectedExperience: {
        min: "",
        max: "",
      },
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
    this.openCandidatePage = this.openCandidatePage.bind(this);
  }

  openCandidatePage(candidate) {
    console.log("Selected Candidate object:", candidate); // 🔍 check what keys exist

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

      this.setState({ postedJobs: jobs }, () => {
        if (jobs.length > 0) {
          // Automatically select the latest job
          const latestJobId = jobs[0].id; // assuming first job is latest, else sort by issue_date
          this.setState(
            { selectedJobId: latestJobId, showFilters: true },
            () => {
              this.fetchAllCandidates(); // fetch candidates for the latest job
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
    this.fetchSkills();
    //this.fetchJobTypes();
    this.fetchAllCandidates();
    this.fetchSpeciality();
    this.loadCountries();
    this.fetchPostedJobs();
  }
  handleSearch = (searchFilters) => {
    this.setState({ searchFilters, currentPage: 1 }, () => {
      this.fetchAllCandidates(); // call API again with updated search filters
    });
  };
  /* ================= FETCH DATA ================= */

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

      const candidates = candidatesRaw.map((c) => {
        // Parse age
        const age = c.date_of_birth
          ? new Date().getFullYear() - new Date(c.date_of_birth).getFullYear()
          : null;

        // Map skills IDs to names
        const skill_names = (c.skills || []).map((s) => s.name);
        

        // Parse availability_times string into array
        const availabilityList = c.availability_times
          ? c.availability_times.split("|").map((s) => {
              const [day, time] = s.split(" ");
              return { day, time }; // { day: 'Saturday', time: '15:21:00-19:21:00' }
            })
          : [];

        // Map otherPreferredCities IDs to names
       
  const otherPreferredCitiesNames = (c.otherPreferredCities || []).map(
    (city) => city.name
  );


        return {
          ...c,
          age,
          skill_names,
          availabilityList,
          otherPreferredCitiesNames,
          resume: c.resume || null,
          address: c.address || "",
        };
      });

      this.setState({ candidates, allApplicants: candidates }, () =>
        this.calculateCounts(candidates),
      );
    } catch (error) {
      console.error(error);
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
      selectedCountryId,
      selectedDistrictId,
      selectedExperience,
      selectedCityIds,
      searchFilters,
    } = this.state;

    const query = searchFilters.query?.toLowerCase() || "";
    const ageQuery = parseInt(query, 10); // if user typed a number

    const today = new Date();

    return allApplicants.filter((candidate) => {
      const minExp = Number(selectedExperience?.min || 0);
      const maxExp = Number(selectedExperience?.max || Infinity);

      const numericExperience = candidate.total_experience
        ? parseInt(candidate.total_experience)
        : null;

      const experienceRangeMatch =
        numericExperience !== null
          ? numericExperience >= minExp && numericExperience <= maxExp
          : true;

      // ===== STATUS =====
      const statusMatch =
        selectedTabIndex === 0
          ? true
          : candidate.candidateStatus ===
            ["Pending", "Shortlisted", "Rejected", "Approved"][
              selectedTabIndex - 1
            ];

      // ===== SKILL =====
     const skillMatch = selectedSkillId
  ? candidate.skills?.some(
      (s) => Number(s.id) === Number(selectedSkillId)
    )
  : true;
      // ===== SPECIALITY =====
     const specialityMatch = selectedspecialityId
  ? candidate.experience?.some(
      (exp) =>
        exp.speciality &&
        Number(exp.speciality.id) === Number(selectedspecialityId)
    )
  : true;

      // ===== SALARY =====
      const salaryMatch =
        selectedSalary &&
        candidate.expected_salary >= (selectedSalary.min || 0) &&
        candidate.expected_salary <= (selectedSalary.max || Infinity);

      // ===== LOCATION =====
      const cityMatch =
  selectedCityIds.length > 0
    ? selectedCityIds.some((selectedId) => {
        const mainCityId = candidate.city;
        const preferredCities = candidate.otherPreferredCities || [];

        return (
          Number(selectedId) === Number(mainCityId) ||
          preferredCities.some(
            (city) => Number(city.id) === Number(selectedId)
          )
        );
      })
    : true;

      // ===== AGE CALCULATION =====
      const dob = candidate.date_of_birth
        ? new Date(candidate.date_of_birth)
        : null;
      const age = dob
        ? today.getFullYear() -
          dob.getFullYear() -
          (today < new Date(dob.setFullYear(today.getFullYear())) ? 1 : 0)
        : null;

      // ===== SEARCH MATCH =====
      let searchMatch = true;
      if (query) {
        const nameMatch = candidate.full_name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);
        const ageMatch = Number.isInteger(ageQuery) && age === ageQuery;

        const genderMatch =
          candidate.gender &&
          candidate.gender.toString().trim().toLowerCase() === query;

        const maritalMatch = candidate.marital_status
          ?.toLowerCase()
          .includes(query);

        const statusSearchMatch = candidate.candidateStatus
          ?.toLowerCase()
          .includes(query);

        const educationMatch =
          candidate.education_degreetypes?.toLowerCase().includes(query) ||
          candidate.education_degreefields?.toLowerCase().includes(query);
        const skillMatchByName = candidate.skill_names
          ?.join(", ")
          .toLowerCase()
          .includes(query);
        const specialityMatchByName = candidate.specialities
          ?.toLowerCase()
          .includes(query);
        const experienceMatch = candidate.total_experience
          ?.toLowerCase()
          .includes(query);

        searchMatch =
          nameMatch ||
          emailMatch ||
          ageMatch ||
          genderMatch ||
          maritalMatch ||
          statusSearchMatch ||
          educationMatch ||
          skillMatchByName ||
          specialityMatchByName ||
          experienceMatch;
      }

      // ===== FINAL RETURN =====
      return (
        statusMatch &&
        skillMatch &&
        specialityMatch &&
        salaryMatch &&
        cityMatch &&
        searchMatch
      );
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
      selectedspecialityId,
    } = this.state;

    const filteredApplicants = this.filterApplicants();

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentCandidates = filteredApplicants.slice(
      indexOfFirst,
      indexOfLast,
    );

    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
    const {
      selectedSalary,
      selectedAge,
      maritalStatus,
      gender,
      selectedSkillId,
    } = this.state;

    const showSalaryColumn = selectedSalary?.min || selectedSalary?.max;

    const showAgeColumn = selectedAge?.min || selectedAge?.max;

    const showPersonalColumn = maritalStatus || gender;

    const showSpecialityColumn = selectedspecialityId;
    const showSkillColumn = selectedSkillId;
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
    return (
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
                if (selectedJobId) this.fetchAllCandidates(); // ✅ fetch after job selection
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
                  selectedExperience={this.state.selectedExperience}
                  // selectedJobTypeId={this.state.selectedJobTypeId}
                  onChange={this.handleFilterChange}
                />
              </Col>

              {/* RIGHT CONTENT */}
              <Col lg="9">
                {/* SEARCH BAR */}
                <ApplicantSearch onSearch={this.handleSearch} />

                <div className="mt-3 table-responsive">
                  {currentCandidates.length > 0 ? (
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Candidate</th>

                          {showAgeColumn && <th>Age</th>}
                          {showSalaryColumn && <th>Expected Salary</th>}
                          {showPersonalColumn && <th>Personal Info</th>}
                          {showSpecialityColumn && <th>Speciality</th>}
                          {showSkillColumn && <th>Skills</th>}

                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentCandidates.map((candidate) => (
                          <tr key={candidate.id}>
                            {/* Name + Photo */}
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
                                  {/* Candidate name as clickable div */}
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

                                  <a
                                    href={`mailto:${candidate.email}`}
                                    className="text-decoration-none text-truncate"
                                  >
                                    {candidate.email}
                                  </a>
                                </div>
                              </div>
                            </td>

                            {showAgeColumn && <td>{candidate.age || "-"}</td>}

                            {showSalaryColumn && (
                              <td>PKR {candidate.expected_salary}</td>
                            )}

                            {showSpecialityColumn && (
                              <td>{candidate.speciality_name || "-"}</td>
                            )}

                            {showSkillColumn && (
                              <td>
                                {candidate.skill_names?.join(", ") || "-"}
                              </td>
                            )}

                            {/* Buttons */}
                            <td>
                              <ApplicantCard
                                candidate={candidate}
                                onStatusChange={(candidateId, status) =>
                                  this.handleApplicationStatus(
                                    candidateId,
                                    this.state.selectedJobId,
                                    status,
                                  )
                                }
                              />
                            </td>
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
    );
  }
}

export default AllApplicants;
