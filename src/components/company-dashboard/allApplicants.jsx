"use client";

import React, { Component } from "react";
import { connect } from "react-redux";
import { Table, Button, FormGroup, Label, Input } from "reactstrap";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
class AllApplicants extends Component {
  state = {
    allApplicants: [], // single array to hold all applicants
    selectedTabIndex: 0,
    selectedJobId: "",
    selectedSkillId: "",
    selectedJobTypeId: "",
    skills: [],
    jobTypes: [],
    itemsPerPage: 6,
    currentPage: 1,
    counts: {
      all: 0,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
    },
  };

  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  userId = sessionStorage.getItem("userId");

  componentDidMount() {
    this.fetchAllData();
    this.fetchSkills();
    this.fetchJobTypes();
  }

  fetchAllData = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}applicantsData/${this.userId}/all`);
      // assuming API returns array of all applicants with a `status` field
      this.setState({ allApplicants: res.data },
        () => this.calculateCounts(res.data)
      );
    } catch (err) {
      console.error(err);
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

  fetchJobTypes = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalljobtypes`);
      this.setState({ jobTypes: res.data.jobTypes || [] });
    } catch (err) {
      console.error(err);
    }
  };

  updateStatus = async (url) => {
    await axios.put(url);
    this.fetchAllData();
  };
  calculateCounts = (applicants) => {
    const counts = {
      all: applicants.length,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
    };

    applicants.forEach((a) => {
      if (a.candidateStatus === "Pending") counts.pending++;
      if (a.candidateStatus === "Shortlisted") counts.shortlisted++;
      if (a.candidateStatus === "Rejected") counts.rejected++;
    });

    this.setState({ counts });
  };

  handleApplicationStatus = async (id, status) => {
    try {
      this.updateStatus(`${this.apiBaseUrl}updatestatus/${id}/${status}`);
      toast.sucess('Update Status Successfuly')

    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  paginate = (data, page) => {
    const { itemsPerPage } = this.state;
    return data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  };

  filterApplicants = () => {
    const { allApplicants, selectedTabIndex, selectedJobId, selectedSkillId, selectedJobTypeId } = this.state;

    return allApplicants.filter((item) => {
      // Filter by status tab
      const statusMatch =
        selectedTabIndex === 0 ? true : // All
          selectedTabIndex === 1 ? item.candidateStatus === "Pending" :
            selectedTabIndex === 2 ? item.candidateStatus === "Shortlisted" :
              selectedTabIndex === 3 ? item.candidateStatus === "Rejected" : true;

      // Filter by job
      const jobMatch = selectedJobId ? item.job_id === selectedJobId : true;

      // Filter by skill
      const skillMatch = selectedSkillId ? item.skill_ids?.includes(Number(selectedSkillId)) : true;

      // Filter by job type
      const jobTypeMatch = selectedJobTypeId ? item.job_type_id === selectedJobTypeId : true;

      return statusMatch && jobMatch && skillMatch && jobTypeMatch;
    });
  };
  render() {
    const {
      selectedTabIndex,
      selectedJobId,
      selectedSkillId,
      selectedJobTypeId,
      skills,
      jobTypes,
      allApplicants,
      counts
    } = this.state;

    const filteredApplicants = this.filterApplicants();


    return (
      <div className="ls-widget">
        {/* Filters */}
        <div className="row mb-3 g-3 align-items-end">
          <div className="col-md-3">
            <FormGroup className="mb-0">
              <Label>Status</Label>
              <Input
                type="select"
                value={selectedTabIndex}
                onChange={(e) =>
                  this.setState({ selectedTabIndex: +e.target.value })
                }
              >
                <option value={0}>All ({counts.all})</option>
                <option value={1}>Pending ({counts.pending})</option>
                <option value={2}>Shortlisted ({counts.shortlisted})</option>
                <option value={3}>Rejected ({counts.rejected})</option>
              </Input>

            </FormGroup>
          </div>

          <div className="col-md-3">
            <Label>Job</Label>
            <Input
              type="select"
              value={selectedJobId}
              onChange={(e) => this.setState({ selectedJobId: e.target.value })}
            >
              <option value="">All Jobs</option>
              {[...new Map(
                allApplicants.map(j => [j.job_id, j])
              ).values()].map(job => (
                <option key={job.job_id} value={job.job_id}>
                  {job.job_title}
                </option>
              ))}
            </Input>
          </div>

          <div className="col-md-3">
            <Label>Job Type</Label>
            <Input
              type="select"
              value={selectedJobTypeId}
              onChange={(e) =>
                this.setState({ selectedJobTypeId: e.target.value })
              }
            >
              <option value="">All Job Types</option>
              {jobTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Input>
          </div>
          <div className="col-md-3">
            <Label>Skill</Label>
            <Input
              type="select"
              value={selectedSkillId}
              onChange={(e) =>
                this.setState({ selectedSkillId: e.target.value })
              }
            >
              <option value="">All Skills</option>
              {skills.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Input>
          </div>


        </div>

        {/* TABLE */}
        <Table className="table align-middle mb-0" striped hover>
          <thead className="table-dark">
            <tr>
              <th>Candidate Name</th>
              <th>Phone</th>
              {/* <th>date_of_birth</th> */}
              <th>Gender</th>
              {/* <th>Martial status</th> */}
              <th>Total Experience</th>
              <th>License Type</th>
              <th>License Number</th>
              <th>Country</th>
              <th>District</th>
              <th>City</th>
              <th>Address</th>
              <th>Status</th>
              <th>Action</th>

            </tr>
          </thead>

          <tbody>
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map(item => (
                <tr key={item.id}>
                  <td>{item.candidate_name || '-'}</td>
                  <td>{item.phone || '-'}</td>
                  {/* <td>{item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                    : "-"}</td> */}
                  <td>{item.gender || '-'}</td>
                  {/* <td>{item.marital_status || '-'}</td> */}
                  <td>{`${item.total_experience || '-'} year`}  </td>
                  <td>{item.license_type || '-'}</td>
                  <td>{item.license_number || '-'}</td>
                  <td>{item.country_name || '-'}</td>
                  <td>{item.district_name || '-'}</td>
                  <td>{item.city_name || '-'}</td>
                  <td>{item.Complete_Address || '-'}</td>
                  <td>{item.candidateStatus || '-'}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      
                      {item.candidateStatus === "Pending" && (
                        <>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() =>
                              this.handleApplicationStatus(item.application_id, "Shortlisted")
                            }
                          >
                            <i className="la la-check"></i>
                          </Button>

                          <Button
                            color="danger"
                            size="sm"
                            onClick={() =>
                              this.handleApplicationStatus(item.application_id, "Rejected")
                            }
                          >
                            <i className="la la-times-circle"></i>
                          </Button>
                        </>
                      )}

                      {/* REJECTED → Shortlist only */}
                      {item.candidateStatus === "Rejected" && (
                        <Button
                          color="success"
                          size="sm"
                          onClick={() =>
                            this.handleApplicationStatus(item.application_id, "Shortlisted")
                          }
                        >
                          <i className="la la-check"></i>
                        </Button>
                      )}
                    </div>
                  </td>


                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={filteredApplicants.length > 0} className="text-center">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  userId: state.user.userId,
});

export default connect(mapStateToProps)(AllApplicants);
