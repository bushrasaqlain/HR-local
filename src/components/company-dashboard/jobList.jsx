import React, { Component } from "react";
import Link from "next/link";
import axios from "axios";
import { withRouter } from "next/router";
import { connect } from "react-redux";

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
  }

  componentDidMount() {
    const { userId } = this.props;
    if (userId) {
      this.fetchData(userId);
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
    const { userId } = this.props;

    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await axios.delete(
        `http://localhost:8080/delete_job/${userId}/${jobId}`
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
        (status === "" ||
          job.status.toLowerCase() === status.toLowerCase())
      );
    });
  };

  render() {
    const { jobListings, loading, currentPage, jobsPerPage, filters } =
      this.state;
    const { userId } = this.props;

    const indexOfLast = currentPage * jobsPerPage;
    const indexOfFirst = indexOfLast - jobsPerPage;
    const currentJobs = this.filterJobs(
      jobListings.slice(indexOfFirst, indexOfLast)
    );

    const totalPages = Math.ceil(jobListings.length / jobsPerPage);

    if (loading) return <p className="text-center">Loading...</p>;

    return (
      <div className="container mt-4">
        <h4 className="mb-3">My Job Listings</h4>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>
                  Title
                  <input
                    className="form-control mt-2"
                    value={filters.title}
                    onChange={(e) =>
                      this.handleFilterChange("title", e.target.value)
                    }
                  />
                </th>
                <th>Applications</th>
                <th>
                  Created & Expired
                  <input
                    className="form-control mt-2"
                    value={filters.createdExpired}
                    onChange={(e) =>
                      this.handleFilterChange("createdExpired", e.target.value)
                    }
                  />
                </th>
                <th>
                  Status
                  <input
                    className="form-control mt-2"
                    value={filters.status}
                    onChange={(e) =>
                      this.handleFilterChange("status", e.target.value)
                    }
                  />
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
                      <span
                        className={`badge ${job.status === "Active" ? "bg-success" : "bg-danger"
                          }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => this.handleEditJob(job.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => this.handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
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

          </table>
        </div>

        {/* Pagination */}
        <nav>
          <ul className="pagination justify-content-center">
            {[...Array(totalPages)].map((_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? "active" : ""
                  }`}
              >
                <button
                  className="page-link"
                  onClick={() => this.paginate(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.user?.userId,
});

export default connect(mapStateToProps)(withRouter(JobListings));
