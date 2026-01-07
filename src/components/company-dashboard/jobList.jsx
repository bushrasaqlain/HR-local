import React, { Component } from "react";
import Link from "next/link";
import axios from "axios";
import { withRouter } from "next/router";
import { connect } from "react-redux";
import {
  Table,
  Input,
  Button,
  Badge,
  Container,
} from "reactstrap";
import Pagination from "../common/pagination.jsx";
import DetailModal from "../common/DetailModal.jsx";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import PostJob from './postJob.jsx';

class JobListings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jobListings: [],
      loading: true,
      error: null,
      jobsPerPage: 50,
      currentPage: 1,
      filters: {
        title: "",
        industry: "",
        no_of_positions: "",
        application_deadline: "",
        status: "",
      },
      // Modal state
      modalOpen: false,
      selectedJob: null,
      modalEditOpen: false,
      editSelectedJob: null,

    };

    this.userId = sessionStorage.getItem("userId");

    // Fields to show in modal
    this.modalFields = [
      "job_title",
      "username",
      "country",
      "district",
      "city",
      "packageprice",
      "packagecurrency",
      "job_description",
      "max_experience",
      "min_experience",
      "max_salary",
      "min_salary",
      "skills",
      "time_from",
      "time_to",
      "created_at",
      "updated_at",
    ];
  }

  componentDidMount() {
    if (this.userId) {
      this.fetchData(this.userId);
    }
  }

  fetchData = async (userId) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await axios.get(
        `${apiBaseUrl}job/managejob/${userId}`
      );
      console.log(response.data)
      this.setState({
        jobListings: response.data,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error: "Error fetching job listings",
        loading: false,
      });
    }
  };

  // Toggle modal
  toggleModal = () => {
    this.setState((prev) => ({ modalOpen: !prev.modalOpen }));
  };

  // Open modal when clicking job title
  handleTitleClick = (job) => {
    this.setState({ selectedJob: job, modalOpen: true });
  };

  handleFilterChange = (field, value) => {
    this.setState((prev) => ({
      filters: { ...prev.filters, [field]: value },
    }));
  };
  handleEditJob = (job) => {
    this.setState({
      editSelectedJob: job,
      modalEditOpen: true
    });
  };

  handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    // try {
    //   await axios.delete(
    //     `${this.apiBaseUrl}job/delete_job/${this.userId}/${jobId}`
    //   );
    //   this.setState((prev) => ({
    //     jobListings: prev.jobListings.filter((job) => job.id !== jobId),
    //   }));
    // } catch (error) {
    //   console.error("Delete failed", error);
    // }
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  filterJobs = (jobs) => {
    const { title, industry, no_of_positions, application_deadline, status } =
      this.state.filters;

    return jobs.filter((job) => {
      const jobTitle = job.job_title ? job.job_title.toLowerCase() : "";
      const jobIndustry = job.industry ? job.industry.toLowerCase() : "";
      const jobPositions = job.no_of_positions
        ? job.no_of_positions.toString().toLowerCase()
        : "";
      const jobDeadline = job.application_deadline
        ? new Date(job.application_deadline)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .toLowerCase()
        : "";
      const jobStatus = job.status ? job.status.toLowerCase() : "";

      return (
        jobTitle.includes(title.toLowerCase()) &&
        jobIndustry.includes(industry.toLowerCase()) &&
        jobPositions.includes(no_of_positions.toLowerCase()) &&
        jobDeadline.includes(application_deadline.toLowerCase()) &&
        (status === "" || jobStatus === status.toLowerCase())
      );
    });
  };

  render() {
    const {
      jobListings,
      loading,
      currentPage,
      jobsPerPage,
      filters,
      modalOpen,
      selectedJob,
    } = this.state;

    const filteredJobs = this.filterJobs(jobListings);
    const indexOfLast = currentPage * jobsPerPage;
    const indexOfFirst = indexOfLast - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    return (
      <Container className="mt-4">
        <h4 className="mb-3">Job Lists</h4>

        <Table bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.title}
                  onChange={(e) =>
                    this.handleFilterChange("title", e.target.value)
                  }
                />
                Title
              </th>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.industry}
                  onChange={(e) =>
                    this.handleFilterChange("industry", e.target.value)
                  }
                />
                Industry
              </th>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.no_of_positions}
                  onChange={(e) =>
                    this.handleFilterChange("no_of_positions", e.target.value)
                  }
                />
                No. of Positions
              </th>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.application_deadline}
                  onChange={(e) =>
                    this.handleFilterChange(
                      "application_deadline",
                      e.target.value
                    )
                  }
                />
                Application Deadline
              </th>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.status}
                  onChange={(e) =>
                    this.handleFilterChange("status", e.target.value)
                  }
                />
                Status
              </th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {currentJobs.length > 0 ? (
              currentJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <span
                      style={{
                        color: "blue",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => this.handleTitleClick(job)}
                    >
                      {job.job_title}
                    </span>
                  </td>

                  <td>{job.industry}</td>
                  <td>{job.no_of_positions}</td>
                  <td>
                    {job.application_deadline
                      ? new Date(job.application_deadline).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                      : "-"}
                  </td>

                  <td>
                    <Badge
                      color={job.status === "Active" ? "success" : "danger"}
                    >
                      {job.status}
                    </Badge>
                  </td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => this.handleEditJob(job)}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      color="outline-danger"
                      onClick={() => this.handleDeleteJob(job.id)}
                    >
                      Delete
                    </Button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <strong>No record found</strong>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={this.handlePageChange}
        />

        {/* Detail Modal */}
        {selectedJob && (
          <DetailModal
            isOpen={modalOpen}
            toggle={this.toggleModal}
            title={selectedJob.job_title}
            details={selectedJob}
            fields={this.modalFields}
          />
        )}

        <Modal
          isOpen={this.state.modalEditOpen}
          toggle={() => this.setState({ modalEditOpen: !this.state.modalEditOpen })}
          size="lg"
        >
          <ModalHeader toggle={() => this.setState({ modalEditOpen: false })}>
            Edit Job
          </ModalHeader>
          <ModalBody>
            {this.state.editSelectedJob && (
              <PostJob jobId={this.state.editSelectedJob.id} />
            )}
          </ModalBody>
        </Modal>

      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.user?.userId,
});

export default connect(mapStateToProps)(withRouter(JobListings));
