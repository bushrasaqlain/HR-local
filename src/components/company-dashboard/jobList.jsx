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
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";
import Pagination from "../common/pagination.jsx";
import DetailModal from "../common/DetailModal.jsx";
import PostJob from './postJob.jsx';
import PricingForm from "./pricingform.jsx";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';


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
      dropdownOpen: false,
      modalOpen: false,
      selectedJob: null,
      editModalOpen: false,
      editingJobId: null,

    };
    this.tableHeaders = [
      { key: "job_title", label: "Title", placeholder: "Filter by Title", minWidth: "150px" },
      { key: "industry", label: "Industry", placeholder: "Filter by Industry", minWidth: "120px" },
      { key: "no_of_positions", label: "Positions", placeholder: "No. of Positions", minWidth: "100px" },
      { key: "application_deadline", label: "Deadline", placeholder: "Deadline", minWidth: "130px" },
      { key: "approval_status", label: "Approval Status", placeholder: "Approval Status", minWidth: "100px" },
      { key: "status", label: "Status", placeholder: "Status", minWidth: "100px" },
      { key: "action", label: "Action", minWidth: "180px" } // No filter for action
    ];

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

  toggleEditModal = (jobId) => {
    this.setState((prev) => ({
      editModalOpen: !prev.editModalOpen,
      editingJobId: jobId,
    }));
  };


  handleDeleteJob = async (jobId) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await axios.delete(
        `${apiBaseUrl}job/delete_job/${this.userId}/${jobId}`
      );

      this.setState((prev) => ({
        jobListings: prev.jobListings.filter((job) => job.id !== jobId),
      }));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  handlePay = (job) => {
    this.setState({
      selectedJob: job,
      modalPackagesOpen: true, // open packages modal
    });
  };
  handlePaymentSuccess = async () => {
    this.setState({
      modalPackagesOpen: false,
      modalPaymentOpen: false,
      selectedJob: null,
    });
    // Refresh the job list to show updated data
    await this.fetchData(this.userId);
  };


  toggle = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  handleStatusChange = async (jobId, status) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
      await axios.put(
        `${apiBaseUrl}job/updateJobPostStatus/${jobId}/${status}`
      );

      this.setState((prevState) => ({
        jobListings: prevState.jobListings.map((job) =>
          job.id === jobId ? { ...job, status } : job
        ),
        [`dropdownOpen_${jobId}`]: false, // close dropdown
      }));
    } catch (error) {
      console.error("Failed to update job status", error);
    }
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
      const jobStatus = job.status ? job.status.trim().toLowerCase() : "";


      return (
        jobTitle.includes(title.toLowerCase()) &&
        jobIndustry.includes(industry.toLowerCase()) &&
        jobPositions.includes(no_of_positions.toLowerCase()) &&
        jobDeadline.includes(application_deadline.toLowerCase()) &&
        (status === "" || jobStatus.includes(status.toLowerCase()))

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

        <Table bordered hover responsive className="job-table">
          <thead className="table-light text-center align-middle">
            <tr>
              {this.tableHeaders.map((header) => (
                <th key={header.key} style={{ minWidth: header.minWidth }}>
                  {header.label}
                  {header.key !== "action" && (
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder={header.placeholder}
                      value={filters[header.key]}
                      onChange={(e) => this.handleFilterChange(header.key, e.target.value)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>


          <tbody>
            {currentJobs.length > 0 ? (
              currentJobs.map((job, index) => (
                <tr key={job.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>
                    <span
                      className="job-title-link"
                      onClick={() => this.handleTitleClick(job)}
                    >
                      {job.job_title}
                    </span>
                  </td>
                  <td className="text-center">{job.industry}</td>
                  <td className="text-center">{job.no_of_positions}</td>
                  <td className="text-center">
                    {job.application_deadline
                      ? new Date(job.application_deadline).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "-"}
                  </td>
                  <td className="text-center">
                    <Badge color={
                      job.approval_status === "Approved"
                        ? "success"
                        : job.approval_status === "Pending Payment"
                          ? "warning"
                          : job.approval_status === "Unapproved"
                            ? "danger"
                            : job.approval_status === "Pending"
                              ? "primary"
                              : "info"
                    } pill>
                      {job.approval_status}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Badge color={
                      job.status === "Active"
                        ? "success"
                        : job.status === "InActive"
                          ? "danger"
                          : "info"
                    } pill>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Dropdown
                      isOpen={this.state[`dropdownOpen_${job.id}`] || false}
                      toggle={() =>
                        this.setState((prev) => ({
                          [`dropdownOpen_${job.id}`]: !prev[`dropdownOpen_${job.id}`],
                        }))
                      }
                    >
                      <DropdownToggle caret color="secondary" size="sm">
                        ⋮
                      </DropdownToggle>
                      <DropdownMenu>
                        {/* Edit */}
                        {job.approval_status !== "Approved" && job.approval_status !== "Pending" && (
                          <DropdownItem onClick={() => this.toggleEditModal(job.id)}>
                            <i className="la la-edit me-2" /> Edit
                          </DropdownItem>
                        )}

                        {/* Pay */}
                        {job.approval_status === "Pending Payment" && (
                          <DropdownItem onClick={() => this.handlePay(job)}>
                            <i className="la la-credit-card me-2" /> Pay
                          </DropdownItem>
                        )}

                        {/* Delete */}
                        {job.approval_status !== "Approved" && job.approval_status !== "Pending" && (
                          <DropdownItem onClick={() => this.handleDeleteJob(job.id)}>
                            <i className="la la-trash me-2" /> Delete
                          </DropdownItem>
                        )}

                        {/* Status */}
                        <DropdownItem
                          disabled={job.status === "Active"}
                          onClick={() => this.handleStatusChange(job.id, "Active")}
                        >
                          <i className="la la-check text-success me-2" /> Active
                        </DropdownItem>

                        <DropdownItem
                          disabled={job.status === "Inactive"}
                          onClick={() => this.handleStatusChange(job.id, "InActive")}
                        >
                          <i className="la la-times text-danger me-2" /> InActive
                        </DropdownItem>


                      </DropdownMenu>
                    </Dropdown>
                  </td>


                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={this.tableHeaders.length} className="text-center py-4">
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
          isOpen={this.state.editModalOpen}
          toggle={() => this.toggleEditModal()}
          size="lg"
        >
          <ModalHeader toggle={() => this.toggleEditModal()}>Edit Job</ModalHeader>
          <ModalBody>
            {this.state.editingJobId && (
              <PostJob
                jobId={this.state.editingJobId}
                onSuccess={() => {
                  this.toggleEditModal();
                  this.fetchJobData(); // Refresh table
                }}
              />
            )}
          </ModalBody>
        </Modal>

        <Modal
          isOpen={this.state.modalPackagesOpen}
          toggle={() => this.setState({ modalPackagesOpen: false })}
          size="lg"
          centered
        >
          <ModalHeader toggle={() => this.setState({ modalPackagesOpen: false })}>
            Select Package
          </ModalHeader>

          <ModalBody
            style={{
              maxHeight: "80vh", // limit height to 70% of viewport
              overflowY: "auto", // enable scrolling if content overflows
              padding: "1.5rem",
            }}
          >
            <PricingForm
              jobId={this.state.selectedJob?.id || this.state.jobId} // jobId from job list or post job page
              userId={this.userId}
              onPaymentSuccess={this.handlePaymentSuccess}
              onSelectPackage={(packageData) => {
                this.setState({
                  modalPackagesOpen: false,
                  modalPaymentOpen: true,
                  selectedPackage: packageData,
                });
              }}
            />
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
