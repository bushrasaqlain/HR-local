"use client";
import React, { Component } from "react";
import { Table, Spinner, Input, Row, Col, Container, Badge } from "reactstrap";
import Pagination from "../common/pagination.jsx";
import Head from "next/head.js";

class PackagesList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      packageData: [],
      filteredData: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      filters: {
        job_id: "",
        job_title: "",
        package_price: "",
        duration: "",
        expiry_date: "",
        payment_status: "",
      },
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = sessionStorage.getItem("userId");
  }

  componentDidMount() {
    this.fetchPackageData();
  }

  fetchPackageData = async () => {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}packages/getPackageDetail/${this.userId}`
      );
      const data = await response.json();

      this.setState({
        packageData: data,
        filteredData: data,
        loading: false,
        totalPages: Math.ceil(data.length / 10),
      });

    } catch (error) {
      console.error("Error fetching package data:", error);
      this.setState({ loading: false });
    }
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleFilterChange = (field, value) => {
    this.setState(
      (prev) => ({
        filters: { ...prev.filters, [field]: value },
      }),
      this.applyFilters
    );
  };

  applyFilters = () => {
    const { packageData, filters } = this.state;
    const filteredData = packageData.filter((item) => {
      return (
        (item.job_id?.toString().includes(filters.job_id) ?? true) &&
        (item.job_title?.toLowerCase().includes(filters.job_title.toLowerCase()) ?? true) &&
        (item.package_price?.toString().includes(filters.package_price) ?? true) &&
        (`${item.duration_value} ${item.duration_unit}`
          .toLowerCase()
          .includes(filters.duration.toLowerCase()) ?? true) &&
        (item.expiry_date
          ? new Date(item.expiry_date)
            .toLocaleDateString("en-GB")
            .includes(filters.expiry_date)
          : false || filters.expiry_date === "") &&
        (item.payment_status?.toLowerCase().includes(filters.payment_status.toLowerCase()) ?? true)
      );
    });

    this.setState({
      filteredData,
      totalPages: Math.ceil(filteredData.length / 10),
      currentPage: 1,
    });
  };

  getStatusBadge = (status) => {
    const statusConfig = {
      "Paid": { color: "#10b981", bg: "#d1fae5", label: "Paid" },
      "Pending": { color: "#f59e0b", bg: "#fef3c7", label: "Pending" },
      "Failed": { color: "#ef4444", bg: "#fee2e2", label: "Failed" },
      "Refunded": { color: "#6b7280", bg: "#f3f4f6", label: "Refunded" },
    };

    const config = statusConfig[status] || { color: "#6b7280", bg: "#f3f4f6", label: status };

    return (
      <span
        style={{
          backgroundColor: config.bg,
          color: config.color,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: "600",
          textTransform: "capitalize",
          display: "inline-block",
        }}
      >
        {config.label}
      </span>
    );
  };

  formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
getCurrencySymbol = (currencyCode) => {
  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'Fr',
    'CNY': '¥',
    'PKR': '₨',
    'AED': 'د.إ',
    'SAR': '﷼',
  };
  
  return currencySymbols[currencyCode] || currencyCode;
};

formatCurrency = (amount, currency) => {
  const symbol = this.getCurrencySymbol(currency || 'USD');
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};
  render() {
    const { filteredData, loading, currentPage, totalPages, filters } = this.state;
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
      return (
        <div className="text-center my-5 py-5">
          <Spinner style={{ color: '#36565F' }} />
          <p className="mt-2 text-muted">Loading packages...</p>
        </div>
      );
    }

    return (
      <Container fluid className="px-4 bg-light">
        <Head>
          <title>Packages | Dashboard</title>
        </Head>
        
        <div className="packages-list">
          {/* Header Section */}
          <Row className="mb-4 align-items-center">
            <Col>
              <h4 className="fw-bold" style={{ color: '#36565F' }}>Packages List</h4>
              <p className="text-muted mb-0">
                Showing {paginatedData.length} of {filteredData.length} packages
              </p>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Input
                  type="select"
                  className="form-select-sm"
                  style={{ width: '250px', height:"40px", borderRadius: '8px' }}
                >
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                  <option>All time</option>
                </Input>
              </div>
            </Col>
          </Row>

          {/* Table Card */}
          <div className="table-responsive" style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Table className="table align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead className="text-center" style={{ background: '#bec1c4' }}>
                <tr>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Job Title
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Filter by title..."
                      value={filters.job_title}
                      onChange={(e) => this.handleFilterChange("job_title", e.target.value)}
                      style={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Package Price
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Filter price..."
                      value={filters.package_price}
                      onChange={(e) => this.handleFilterChange("package_price", e.target.value)}
                      style={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Duration
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Filter duration..."
                      value={filters.duration}
                      onChange={(e) => this.handleFilterChange("duration", e.target.value)}
                      style={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                    <Input
                      type="select"
                      className="mt-2"
                      value={filters.payment_status}
                      onChange={(e) => this.handleFilterChange("payment_status", e.target.value)}
                      style={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="">All</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </Input>
                  </th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Posted Date
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Filter date..."
                      value={filters.job_date}
                      onChange={(e) => this.handleFilterChange("job_date", e.target.value)}
                      style={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr 
                      key={item.job_id || item.cart_id}
                      style={{
                        background: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      }}
                    >
                      <td style={{ padding: '16px', fontWeight: '500', color: '#36565F' }}>
                        <div className="d-flex align-items-center gap-2">
                        
                         
                          {item.job_title}
                        </div>
                      </td>
                      <td className="text-end" style={{ padding: '16px' }}>
                        <span style={{ fontWeight: '600', color: '#2c373a' }}>
                          {this.formatCurrency(item.package_price, item.package_currency)}
                        </span>
                      </td>
                      <td className="text-center" style={{ padding: '16px', color: '#475569' }}>
                        {item.duration_value} {item.duration_unit}
                      </td>
                      <td className="text-center" style={{ padding: '16px',color: '#475569'  }}>
                        {this.getStatusBadge(item.payment_status)}
                      </td>
                      <td className="text-center" style={{ padding: '16px', color: '#64748b' }}>
                        {item.job_date
                          ? new Date(item.job_date).toLocaleDateString("en-GB", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div style={{ color: '#94a3b8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <h6 style={{ color: '#1e293b', marginBottom: '4px' }}>No packages found</h6>
                        <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                          Try adjusting your filters or check back later
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Footer with Pagination */}
          <div className="mt-4 d-flex justify-content-between align-items-center">
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={this.handlePageChange}
            />
          </div>
        </div>

        <style jsx>{`
          .packages-list {
            padding: 20px 0;
          }
          
          /* Custom scrollbar */
          .table-responsive::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .table-responsive::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .table-responsive::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          
          .table-responsive::-webkit-scrollbar-thumb:hover {
            background: #36565F;
          }
        `}</style>
      </Container>
    );
  }
}

export default PackagesList;