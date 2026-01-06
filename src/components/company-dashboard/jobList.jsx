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
  Pagination,
  PaginationItem,
  PaginationLink,
  Container,
} from "reactstrap";

class JobListings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jobListings: [],
      loading: true,
      error: null,
      jobsPerPage: 5,
      currentPage: 1,
      filters: {
        title: "",
        createdExpired: "",
        status: "",
      },
    };
    this.userId = sessionStorage.getItem("userId");
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
        `${apiBaseUrl}company-info/managejob/${userId}`
      );
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

  handleFilterChange = (field, value) => {
    this.setState((prev) => ({
      filters: { ...prev.filters, [field]: value },
    }));
  };

  handleEditJob = (jobId) => {
    const { router, userId } = this.props;
    router.push({
      pathname: `/employers-dashboard/post-jobs/${userId}`,
      query: { jobId },
    });
  };

  handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await axios.delete(
        `http://localhost:8080/delete_job/${this.userId}/${jobId}`
      );
      this.setState((prev) => ({
        jobListings: prev.jobListings.filter((job) => job.id !== jobId),
      }));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  paginate = (page) => {
    this.setState({ currentPage: page });
  };

  filterJobs = (jobs) => {
    const { title, createdExpired, status } = this.state.filters;

    return jobs.filter((job) => {
      return (
        job.job_title.toLowerCase().includes(title.toLowerCase()) &&
        job.created_and_expired_date
          .toLowerCase()
          .includes(createdExpired.toLowerCase()) &&
        (status === "" || job.status.toLowerCase() === status.toLowerCase())
      );
    });
  };

  render() {
    const { jobListings, loading, currentPage, jobsPerPage, filters } =
      this.state;

    if (loading) return <p className="text-center">Loading...</p>;

    const indexOfLast = currentPage * jobsPerPage;
    const indexOfFirst = indexOfLast - jobsPerPage;
    const currentJobs = this.filterJobs(jobListings.slice(indexOfFirst, indexOfLast));
    const totalPages = Math.ceil(jobListings.length / jobsPerPage);

    return (
      <Container className="mt-4">
        <h4 className="mb-3">My Job Listings</h4>

        <Table bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>
                 <Input
                  type="text"
                  className="mt-2"
                  value={filters.title}
                  onChange={(e) => this.handleFilterChange("title", e.target.value)}
                />
                Title
               
              </th>
              <th>
                 <Input
                  type="text"
                  className="mt-2"
                  value={filters.title}
                  onChange={(e) => this.handleFilterChange("title", e.target.value)}
                />
                Applications</th>
              <th>
                <Input
                  type="text"
                  className="mt-2"
                  value={filters.createdExpired}
                  onChange={(e) =>
                    this.handleFilterChange("createdExpired", e.target.value)
                  }
                />
                Created & Expired
                
              </th>
              <th>
                 <Input
                  type="text"
                  className="mt-2"
                  value={filters.status}
                  onChange={(e) => this.handleFilterChange("status", e.target.value)}
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
                    <Link href={`/job-single-v1/${job.id}/${this.props.userId}`}>
                      {job.job_title}
                    </Link>
                  </td>
                  <td>3+ Applied</td>
                  <td>{job.created_and_expired_date}</td>
                  <td>
                    <Badge color={job.status === "Active" ? "success" : "danger"}>
                      {job.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      color="primary"
                      className="me-2"
                      onClick={() => this.handleEditJob(job.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={() => this.handleDeleteJob(job.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <strong>No record found</strong>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <Pagination className="justify-content-center">
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i} active={currentPage === i + 1}>
              <PaginationLink onClick={() => this.paginate(i + 1)}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
        </Pagination>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.user?.userId,
});

export default connect(mapStateToProps)(withRouter(JobListings));
