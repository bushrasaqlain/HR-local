import React, { Component } from "react";
import Link from "next/link";
import axios from "axios";
import { withRouter } from "next/router";
import { connect } from "react-redux";
import Head from "next/head.js";
import ScreeningQuestionsForm from "./ScreeningQuestionsForm.jsx";
import {
  Table,
  Input,
  Button,
  Badge,
  Container,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Row, Col, Spinner
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
      jobsPerPage: 10,
      currentPage: 1,
      filters: {
        job_title: "",
        industry: "",
        no_of_positions: "",
        application_deadline: "",
        status: "",
        billing_model: "",
        approval_status: "",
      },
      // Modal state
      dropdownOpen: false,
      modalOpen: false,
      selectedJob: null,
      editModalOpen: false,
      editingJobId: null,
      statusFilterOpen: false,
      quickStatusFilter: "",
      sortConfig: { key: null, direction: 'asc' },
    };

    this.tableHeaders = [
      { key: "job_title", label: "Job Title", placeholder: "Filter by Title", minWidth: "200px" },
      { key: "billing_model", label: "Package", placeholder: "Filter by Package", minWidth: "150px" },
      { key: "no_of_positions", label: "Positions", placeholder: "No. of Positions", minWidth: "100px" },
      { key: "application_deadline", label: "Deadline", placeholder: "Filter Deadline", minWidth: "130px" },
      { key: "approval_status", label: "Approval", placeholder: "Filter Approval", minWidth: "120px" },
      { key: "status", label: "Status", placeholder: "Filter Status", minWidth: "100px" },
      { key: "action", label: "Actions", minWidth: "100px" }
    ];

    this.userId = sessionStorage.getItem("userId");

    this.modalFields = [
      "job_title",
      "country",
      "district",
      "city",
        "education", 
      "billing_model",
      "package_amount",
      "packageprice",
      "packagecurrency",
      "job_description",
       "experience_range", 
      "salary_range", 
      "skills",
      "time_range",
      "created_at",
      "updated_at",
    ];
  }
  billingModelLabels = {
    cv_credits: "CV Credits",
    job_slot: "Job Slots",
    daily_budget: "Daily Budget",
    basic: "Basic",
    premium: "Premium",
    // add more as needed
  };
  componentDidMount() {
    if (this.userId) {
      this.checkAndDeactivateExpiredJobs();
      this.fetchData(this.userId);
    }
    this.expiryCheckInterval = setInterval(() => {
      this.checkAndDeactivateExpiredJobs();
    }, 60 * 60 * 1000);

    if (this.props.filterStatus) {
      this.setState({ quickStatusFilter: this.props.filterStatus });
    }
  }

  componentWillUnmount() {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }
  }

  checkAndDeactivateExpiredJobs = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      await axios.get(`${apiBaseUrl}job/check-expired-jobs`);
      // Refresh the job list after checking
      await this.fetchData(this.userId);
    } catch (error) {
      console.error("Failed to check expired jobs:", error);
    }
  };

  componentDidUpdate(prevProps) {
    if (this.props.filterStatus !== prevProps.filterStatus) {
      this.setState({ quickStatusFilter: this.props.filterStatus || "" });
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

  handleSort = (key) => {
    const { sortConfig, jobListings, filters } = this.state;

    // Get filtered jobs first
    const filteredJobs = this.filterJobs(jobListings);

    let direction = 'asc';

    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedData = [...filteredJobs].sort((a, b) => {
      const aVal = a[key]?.toString().toLowerCase() || '';
      const bVal = b[key]?.toString().toLowerCase() || '';

      if (direction === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    this.setState({
      jobListings: sortedData, // Update jobListings with sorted data
      sortConfig: { key, direction }
    });
  };
openScreeningView = (job) => {
  this.setState({ screeningJob: job });
};

closeScreeningView = () => {
  this.setState({ screeningJob: null });
};
  getSortIcon = (key) => {
    const { sortConfig } = this.state;
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  toggleModal = () => {
    this.setState((prev) => ({ modalOpen: !prev.modalOpen }));
  };

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

  toggleStatusFilter = () => {
    this.setState((prev) => ({
      statusFilterOpen: !prev.statusFilterOpen,
    }));
  };

  isEditRestricted = (job) => {
    return job.approval_status === 'Approved' && job.status === 'Active';
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
      modalPackagesOpen: true,
    });
  };

  handlePaymentSuccess = async () => {
    this.setState({
      modalPackagesOpen: false,
      modalPaymentOpen: false,
      selectedJob: null,
    });
    await this.fetchData(this.userId);
  };

  toggle = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  handleStatusChange = async (jobId, status) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const userId = sessionStorage.getItem("userId");

    try {
      await axios.put(
        `${apiBaseUrl}job/updateJobPostStatus/${jobId}/${status}/${userId}`
      );

      this.setState((prevState) => ({
        jobListings: prevState.jobListings.map((job) =>
          job.id === jobId ? { ...job, status } : job
        ),
        [`dropdownOpen_${jobId}`]: false,
      }));
    } catch (error) {
      console.error("Failed to update job status", error);
    }
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  filterJobs = (jobs) => {
    const { job_title, no_of_positions, application_deadline, status, billing_model, approval_status } = this.state.filters;
    const { quickStatusFilter } = this.state;

    return jobs.filter((job) => {
      const isExpired = job.application_deadline &&
        new Date(job.application_deadline) < new Date();
      if (isExpired && job.status === 'Active') job.status = 'Inactive';

      const jobTitle = (job.job_title || "").toLowerCase();
      const jobPositions = (job.no_of_positions || "").toString().toLowerCase();
      const jobDeadline = job.application_deadline
        ? new Date(job.application_deadline).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        }).toLowerCase()
        : "";
      const jobStatus = (job.status || "").trim().toLowerCase();
      const jobBilling = (this.billingModelLabels[job.billing_model] || job.billing_model || "").toLowerCase();
      const jobApproval = (job.approval_status || "").toLowerCase();

      return (
        jobTitle.includes(job_title.toLowerCase()) &&
        jobPositions.includes(no_of_positions.toLowerCase()) &&
        jobDeadline.includes(application_deadline.toLowerCase()) &&
        (status === "" || jobStatus === status.toLowerCase()) &&
        (billing_model === "" || jobBilling.includes(billing_model.toLowerCase())) &&
        (approval_status === "" || jobApproval.includes(approval_status.toLowerCase())) &&
        (quickStatusFilter === "" || jobStatus === quickStatusFilter.toLowerCase())
      );
    });
  };

  getApprovalBadge = (status) => {
    const config = {
      "Approved": { color: "#065f46", bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", },
      "Pending Payment": { color: "#92400e", bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", },
      "Unapproved": { color: "#991b1b", bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", },
      "Pending": { color: "#1e40af", bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", },
    };

    const defaultConfig = { color: "#1e293b", bg: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", icon: "📋" };
    const cfg = config[status] || defaultConfig;

    return (
      <span style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "4px 12px",
        borderRadius: "30px",
        fontSize: "0.75rem",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <span>{cfg.icon}</span> {status}
      </span>
    );
  };

  getStatusBadge = (status, applicationDeadline) => {
    const isExpired = applicationDeadline && new Date(applicationDeadline) < new Date();

    if (isExpired && status === 'Active') {
      status = 'Expired';
    }

    const config = {
      "Active": {
        color: "#065f46",
        bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        icon: "✅"
      },
      "Inactive": {
        color: "#991b1b",
        bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
        icon: "❌"
      },
      "Expired": {
        color: "#92400e",
        bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        icon: "⏰"
      }
    };

    const defaultConfig = { color: "#1e293b", bg: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", icon: "📋" };
    const cfg = config[status] || defaultConfig;

    return (
      <span style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "4px 12px",
        borderRadius: "30px",
        fontSize: "0.75rem",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <span>{cfg.icon}</span> {status}
      </span>
    );
  };

  renderDeadlineWarning = (deadline) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilExpiry = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      return (
        <span style={{
          display: 'inline-block',
          marginLeft: '8px',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: '#fef3c7',
          color: '#92400e'
        }}>
          Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
        </span>
      );
    }

    if (daysUntilExpiry <= 0) {
      return (
        <span style={{
          display: 'inline-block',
          marginLeft: '8px',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b'
        }}>
          Expired
        </span>
      );
    }

    return null;
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
      statusFilterOpen,
      quickStatusFilter
    } = this.state;

    const filteredJobs = this.filterJobs(jobListings);
    const indexOfLast = currentPage * jobsPerPage;
    const indexOfFirst = indexOfLast - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
if (this.state.screeningJob) {
  return (
    <ScreeningQuestionsForm
      jobId={this.state.screeningJob.id}
      jobTitle={this.state.screeningJob.job_title}
      onBack={this.closeScreeningView}
      onSaved={() => {
        this.closeScreeningView();
        this.fetchData(this.userId);
      }}
    />
  );
}
    if (loading) {
      return (
        <Container fluid className="px-4 py-5">
          <div className="text-center my-5 py-5">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Spinner style={{ color: '#36565F', width: '3rem', height: '3rem' }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem'
              }}>
                📋
              </div>
            </div>
            <p className="mt-3" style={{ color: '#36565F', fontWeight: '500' }}>Loading job listings...</p>
          </div>
        </Container>
      );
    }

    return (
      <>
        <Head>
          <title>Job Listings | Dashboard</title>
        </Head>

        <Container fluid className="px-4 py-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
          <div className="job-listings">
            {/* Header Section */}
            <Row className="mb-4 align-items-center">
              <Col>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                  <div>
                    <h4 className="fw-bold" style={{ color: '#1e293b', marginBottom: '4px' }}>Job Management</h4>
                    <p style={{ color: '#64748b', marginBottom: 0 }}>
                      <span style={{ fontWeight: '600', color: '#36565F' }}>{filteredJobs.length}</span> jobs found
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs="auto">
                <div className="d-flex gap-3">
                  <div style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>

                    <Dropdown isOpen={statusFilterOpen} toggle={this.toggleStatusFilter}>
                      <DropdownToggle caret color="link" style={{ color: '#1e293b', textDecoration: 'none', padding: 0 }}>
                        Status: {quickStatusFilter === "" ? "All" : quickStatusFilter}
                      </DropdownToggle>
                      <DropdownMenu>
                        <DropdownItem onClick={() => this.setState({ quickStatusFilter: "" })}>
                          All
                        </DropdownItem>
                        <DropdownItem onClick={() => this.setState({ quickStatusFilter: "Active" })}>
                          Active
                        </DropdownItem>
                        <DropdownItem onClick={() => this.setState({ quickStatusFilter: "InActive" })}>
                          InActive
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>

                </div>
              </Col>
            </Row>

            {/* Stats Cards */}
            <Row className="mb-4">
              {[
                {
                  label: 'Total Jobs',
                  value: jobListings.length,
                  change: `+${jobListings.filter(j => j.status === 'Active').length} active`
                },
                {
                  label: 'Active Jobs',
                  value: jobListings.filter(j => j.status === 'Active').length,
                  change: 'Live now'
                },
                {
                  label: 'Pending Approval',
                  value: jobListings.filter(j => j.approval_status === 'Pending').length,
                  change: 'Awaiting'
                },
                // { 
                //   label: 'Pending Payment', 
                //   value: jobListings.filter(j => j.approval_status === 'Pending Payment').length, 
                //   change: 'Action needed' 
                // }
              ].map((stat, idx) => (
                <Col md={4} key={idx}>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.02)',
                    transition: 'all 0.3s',
                    cursor: 'default'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(54, 86, 95, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '500' }}>{stat.change}</span>
                    </div>
                    <h5 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</h5>
                    <p style={{ color: '#64748b', marginBottom: 0, fontSize: '0.85rem' }}>{stat.label}</p>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Main Table Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.02)'
            }}>
              {/* Table Toolbar */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #eef2f6',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="text"
                      placeholder="Search jobs..."
                      style={{
                        paddingLeft: '36px',
                        borderRadius: '30px',
                        border: '1px solid #e2e8f0',
                        width: '280px',
                        background: '#f8fafc'
                      }}
                      onChange={(e) => this.handleFilterChange('job_title', e.target.value)}
                    />
                    {/* <span style={{ position: 'absolute', left: '12px', top: '8px', color: '#94a3b8' }}>🔍</span> */}
                  </div>
                </div>

              </div>

              {/* Table */}
              <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Table className="table align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    top: 0,
                    zIndex: 10
                  }}>
                    <tr>
                      {this.tableHeaders.map((header) => (
                        <th
                          key={header.key}
                          onClick={() => header.key !== 'action' && this.handleSort(header.key)}
                          style={{
                            padding: '16px 20px',
                            color: '#1e293b',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            cursor: header.key !== 'action' ? 'pointer' : 'default',
                            borderBottom: '2px solid #e2e8f0',
                            minWidth: header.minWidth,
                            textAlign: 'center' // Add this to center all headers
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center' // Change from 'space-between' to 'center'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1rem' }}>{header.icon}</span>
                              {header.label}
                            </span>
                            {header.key !== 'action' && (
                              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                {this.getSortIcon(header.key)}
                              </span>
                            )}
                          </div>
                          {header.placeholder && (
                            <Input
                              type="text"
                              className="mt-2"
                              placeholder={header.placeholder}
                              value={filters[header.key] || ''}
                              onChange={(e) => this.handleFilterChange(header.key, e.target.value)}
                              style={{
                                borderRadius: '30px',
                                border: '1px solid #e2e8f0',
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                background: '#fff',
                                marginTop: '8px',
                                textAlign: 'center' // Center input text
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentJobs.length > 0 ? (
                      currentJobs.map((job, index) => (
                        <tr
                          key={job.id}
                          style={{
                            background: '#ffffff',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            opacity: 0,
                            animation: `fadeIn 0.3s ease forwards ${index * 0.05}s`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.01)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(54, 86, 95, 0.15)';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.zIndex = '5';
                            e.currentTarget.style.position = 'relative';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        >
                          <td style={{ padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div>
                                <span
                                  className="job-title-link"
                                  onClick={() => this.handleTitleClick(job)}
                                  style={{
                                    color: '#1e293b',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textDecoration: 'none'
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = '#36565F'}
                                  onMouseLeave={(e) => e.target.style.color = '#1e293b'}
                                >
                                  {job.job_title}
                                </span>
                                {this.renderDeadlineWarning(job.application_deadline)}
                              </div>
                            </div>
                          </td>
                          <td className="text-center" style={{ padding: '18px 20px', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {this.billingModelLabels[job.billing_model] || job.billing_model}
                            </div>
                          </td>
                          <td className="text-center" style={{ padding: '18px 20px' }}>
                            <span style={{
                              background: '#f1f5f9',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontWeight: '600',
                              color: '#36565F'
                            }}>
                              {job.no_of_positions}
                            </span>
                          </td>
                          <td style={{ padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#475569' }}>
                                {job.application_deadline
                                  ? new Date(job.application_deadline).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                  : "-"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '18px 20px' }}>
                            {this.getApprovalBadge(job.approval_status)}
                          </td>
                          <td style={{ padding: '18px 20px' }}>
                            {this.getStatusBadge(job.status, job.application_deadline)}
                          </td>

                          <td className="text-center" style={{ padding: '18px 20px' }}>
                            <Dropdown
                              isOpen={this.state[`dropdownOpen_${job.id}`] || false}
                              toggle={() =>
                                this.setState((prev) => ({
                                  [`dropdownOpen_${job.id}`]: !prev[`dropdownOpen_${job.id}`],
                                }))
                              }
                            >
                              <DropdownToggle
                                caret
                                color="link"
                                size="sm"
                                style={{
                                  background: '#f1f5f9',
                                  border: 'none',
                                  borderRadius: '30px',
                                  padding: '8px 16px',
                                  color: '#475569',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  textDecoration: 'none'
                                }}
                              >
                                Actions
                              </DropdownToggle>
                              <DropdownMenu>
                                <DropdownItem onClick={() => this.toggleEditModal(job.id)}>
                                  <i className="la la-edit me-2" style={{ color: '#36565F' }} /> Edit
                                </DropdownItem>
{job.status === "Active" && (
<DropdownItem onClick={() => this.openScreeningView(job)}>
   <i className="la la-question-circle me-2" style={{ color: '#36565F' }} />
   {job.has_screening ? "Edit Screening Questions" : "Add Screening Questions"}
 </DropdownItem>
)}
                                {job.approval_status === "Pending Payment" && (
                                  <DropdownItem onClick={() => this.handlePay(job)}>
                                    <i className="la la-credit-card me-2" style={{ color: '#10b981' }} /> Pay
                                  </DropdownItem>
                                )}

                                {(job.approval_status === "UnApproved" || job.approval_status === "Pending") && (
                                  <DropdownItem onClick={() => this.handleDeleteJob(job.id)}>
                                    <i className="la la-trash me-2" style={{ color: '#ef4444' }} /> Delete
                                  </DropdownItem>
                                )}

                                <DropdownItem divider />

                                {(job.status === "Inactive" || (job.status === "Expired")) && (
                                  <DropdownItem
                                    onClick={() => this.handleStatusChange(job.id, "Active")}
                                  >
                                    <i className="la la-check-circle me-2" style={{ color: '#10b981' }} /> Activate
                                  </DropdownItem>
                                )}

                                {job.status === "Active" && (
                                  <DropdownItem
                                    onClick={() => this.handleStatusChange(job.id, "Inactive")}
                                  >
                                    <i className="la la-times-circle me-2" style={{ color: '#ef4444' }} /> Deactivate
                                  </DropdownItem>
                                )}
                              </DropdownMenu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={this.tableHeaders.length} style={{ padding: '60px 20px' }}>
                          <div style={{ textAlign: 'center' }}>

                            <h5 style={{ color: '#1e293b', marginBottom: '8px' }}>No jobs found</h5>

                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Table Footer */}
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid #eef2f6',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Showing <span style={{ fontWeight: '600', color: '#36565F' }}>{indexOfFirst + 1}</span> to{' '}
                  <span style={{ fontWeight: '600', color: '#36565F' }}>{Math.min(indexOfLast, filteredJobs.length)}</span> of{' '}
                  <span style={{ fontWeight: '600', color: '#36565F' }}>{filteredJobs.length}</span> entries
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={this.handlePageChange}
                />
              </div>
            </div>
          </div>

          {/* Modals */}
         {selectedJob && (
  <DetailModal
    isOpen={modalOpen}
    toggle={this.toggleModal}
    title={selectedJob.job_title}
    details={selectedJob}
    fields={this.modalFields}
customRenderers={{
education: (d) => {
  const degree = d.degree;
  const fields = Array.isArray(d.degree_fields) ? d.degree_fields.join(", ") : d.degree_fields;
  if (!degree && !fields) return "-";
  if (degree && fields) return `${degree} in ${fields}`;
  return degree || fields;
},
  billing_model: (d) => this.billingModelLabels[d.billing_model] || d.billing_model || "-",
  experience_range: (d) => {
  const min = d.min_experience;
  const max = d.max_experience;
  if (!min && !max) return "-";

  // Extract just the numeric part in case value already has "Years" text
  const clean = (v) => String(v).replace(/[^\d.]/g, "").trim();
  const unit = (n) => `${n} ${Number(n) === 1 ? "year" : "years"}`;

  const minNum = clean(min);
  const maxNum = clean(max);

  if (minNum && maxNum) return `${unit(minNum)} - ${unit(maxNum)}`;
  return minNum ? `${unit(minNum)}+` : `Up to ${unit(maxNum)}`;
},
  salary_range: (d) => {
    const min = d.min_salary;
    const max = d.max_salary;
    const cur = d.packagecurrency || "Rs.";
    if (!min && !max) return "-";
    if (min && max) return `${cur} ${Number(min).toLocaleString('en-IN')} - ${Number(max).toLocaleString('en-IN')}`;
    return min
      ? `${cur} ${Number(min).toLocaleString('en-IN')}+`
      : `Up to ${cur} ${Number(max).toLocaleString('en-IN')}`;
  },
  time_range: (d) => {
  const from = d.time_from;
  const to = d.time_to;
  if (!from && !to) return "-";

  // formatTime handles both "HH:mm:ss"/"HH:mm" raw values and already-formatted "8:00 AM" strings
  const formatTime = (val) => {
    if (!val) return null;
    // already formatted like "8:00 AM"
    if (/AM|PM/i.test(val)) return val;
    // raw "HH:mm" or "HH:mm:ss"
    const match = String(val).match(/^(\d{2}):(\d{2})/);
    if (!match) return val;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const fromFormatted = formatTime(from);
  const toFormatted = formatTime(to);

  if (fromFormatted && toFormatted) return `${fromFormatted} - ${toFormatted}`;
  return fromFormatted || toFormatted;
},
}}
  />
)}

          <Modal
            isOpen={this.state.editModalOpen}
            toggle={() => this.toggleEditModal()}
            size="lg"
            centered
          >
            <ModalHeader toggle={() => this.toggleEditModal()}>
              <span style={{ color: '#36565F' }}>✏️ Edit Job</span>
              {this.state.editingJobId && (() => {
                const job = this.state.jobListings.find(j => j.id === this.state.editingJobId);
                if (this.isEditRestricted(job)) {
                  return (
                    <div style={{
                      fontSize: '12px',
                      color: '#f59e0b',
                      marginTop: '8px',
                      fontWeight: 'normal'
                    }}>
                      ⚠️ Live jobs can edit: Description, Industry, Salary, Positions & Deadline only
                    </div>
                  );
                }
                return null;
              })()}
            </ModalHeader>
            <ModalBody>
              {this.state.editingJobId && (
                <PostJob
                  jobId={this.state.editingJobId}
                  isEditRestricted={this.isEditRestricted(
                    this.state.jobListings.find(j => j.id === this.state.editingJobId)
                  )}
                  onSuccess={() => {
                    this.toggleEditModal();
                    this.fetchData(this.userId);
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
            <ModalHeader className="custom-progress-bar" toggle={() => this.setState({ modalPackagesOpen: false })}>
              <span style={{ color: '#36565F' }}>💰 Select Package</span>
            </ModalHeader>
            <ModalBody
              style={{
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "1.5rem",
              }}
            >
              <PricingForm
                jobId={this.state.selectedJob?.id || this.state.jobId}
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

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .table-responsive::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .table-responsive::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          .table-responsive::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #36565F 0%, #1e3a4a 100%);
            border-radius: 10px;
          }
          
          .table-responsive::-webkit-scrollbar-thumb:hover {
            background: #1e3a4a;
          }
          
          .job-title-link {
            transition: color 0.2s ease;
          }
        `}</style>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.user?.userId,
});

export default connect(mapStateToProps)(withRouter(JobListings));