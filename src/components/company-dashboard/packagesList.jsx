"use client";
import React, { Component } from "react";
import { Table, Spinner, Input, Row, Col } from "reactstrap";
import Pagination from "../common/pagination.jsx";

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

  render() {
    const { filteredData, loading, currentPage, totalPages, filters } = this.state;
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
      return (
        <div className="text-center my-4">
          <Spinner />
        </div>
      );
    }

    return (
      <div className="packages-list">
        <Row className="mb-3">
          <Col xs={12}>
            <h4 className="fw-bold">Packages List</h4>
          </Col>
        </Row>

        <div className="table-responsive shadow-sm rounded">
          <Table className="table align-middle mb-0" striped hover>
            <thead className="table-dark">
              <tr>

                <th>
                  Job Title
                  <Input
                    type="text"
                    className="mt-2"
                    placeholder="Filter"
                    value={filters.job_title}
                    onChange={(e) => this.handleFilterChange("job_title", e.target.value)}
                  />
                </th>
                <th>
                  Package Price
                  <Input
                    type="text"
                    className="mt-2"
                    placeholder="Filter"
                    value={filters.package_price}
                    onChange={(e) => this.handleFilterChange("package_price", e.target.value)}
                  />
                </th>
                <th>
                  Package Duration
                  <Input
                    type="text"
                    className="mt-2"
                    placeholder="Filter"
                    value={filters.duration}
                    onChange={(e) => this.handleFilterChange("duration", e.target.value)}
                  />
                </th>

                <th>
                  Status
                  <Input
                    type="text"
                    className="mt-2"
                    placeholder="Filter"
                    value={filters.payment_status}
                    onChange={(e) => this.handleFilterChange("payment_status", e.target.value)}
                  />
                </th>
                <th>
                  Posted Job Date
                  <Input
                    type="text"
                    className="mt-2"
                    placeholder="Filter"
                    value={filters.job_date}
                    onChange={(e) => this.handleFilterChange("job_date", e.target.value)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.job_id || item.cart_id}>
                    <td>{item.job_title}</td>
                    <td>
                      {item.package_price} {item.package_currency}
                    </td>
                    <td>
                      {item.duration_value} {item.duration_unit}
                    </td>
                    <td>
                      <span
                        className={`badge ${item.payment_status === "Paid"
                          ? "bg-success"
                          : "bg-warning text-dark"
                          }`}
                      >
                        {item.payment_status}
                      </span>
                    </td>
                    <td>
                      {item.job_date
                        ? new Date(item.job_date).toLocaleDateString("en-GB")
                        : ""}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    No packages found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="mt-3 d-flex justify-content-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={this.handlePageChange}
          />
        </div>
      </div>
    );
  }
}

export default PackagesList;
