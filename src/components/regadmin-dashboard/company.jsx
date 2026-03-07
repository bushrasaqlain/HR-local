"use client";
import React, { Component } from "react";
import api from "../lib/api";
import Pagination from "../common/pagination";
import { toast } from "react-toastify";
import {
  Card,
  CardBody,
  Table,
  Input,
  Button,
  FormGroup,
  Label,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import DetailModal from "../common/DetailModal";
import HistoryModal from "../common/HistoryModal";
import Head from "next/head";
class CompanyData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      companyData: [],
      editingRow: null,
      currentPage: 1,
      pageSize: 20,
      totalRecords: 0, // ✅ ADD THIS
      statusFilter: "All",
      searchTerms: {
        id: "",
        company_name: "",
        username: "",
        email: "",
        password: "",
      },
      selectedCompany: null,
      historyModalOpen: false,
      historyData: [],
       successMessage: "",
    };
    this.tableHeaders = [
      // { key: "id", label: "Id" },
      { key: "company_name", label: "Company Name" },
      { key: "email", label: "Email" },
      { key: "password", label: "Password" },
      { key: "isActive", label: "Status" },
      { key: "action", label: "Action" },
    ];

    this.apibasurl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchCompanyData();
  }

  fetchCompanyData = () => {
    const { currentPage, pageSize, statusFilter, searchTerms } = this.state;

    const apiUrl = `${this.apibasurl}company-info/getallcompanies`;
    const token = localStorage.getItem("token");

    // Determine which column has a search value
    let searchColumn = "";
    let searchValue = "";
    for (const key in searchTerms) {
      if (searchTerms[key]) {
        searchColumn = key; // send this to backend
        searchValue = searchTerms[key];
        break; // only first non-empty column
      }
    }

    api
      .get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: pageSize,
          status: statusFilter !== "All" ? statusFilter : "",
          search: searchValue,
          name: searchColumn,
        },
      })
      .then((res) => {
        this.setState({
          companyData: res.data.employers,
          totalRecords: res.data.total,
        });
      });
  };

updateCompanyStatus = (id, status) => {
  const apiUrl = `${this.apibasurl}company-info/updatestatus/${id}/${status}`;

  api.put(apiUrl).then((res) => {
    if (res.status === 200) {
      this.setState((prevState) => ({
        companyData: prevState.companyData.map((item) =>
          item.id === id ? { ...item, isActive: status } : item
        ),
        editingRow: null,
        successMessage: "Company status updated successfully!", // show message
      }));

      // Optionally hide the message after 3 seconds
      setTimeout(() => {
        this.setState({ successMessage: "" });
      }, 3000);
    }
  });
};

  getHistory = (id) => {
    const accountType = "employer";
    const apiUrl = `${this.apibasurl}gethistory/${id}/${accountType}`;
    const token = localStorage.getItem("token");

    api
      .get(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const filteredHistory = (res.data.history || []).map((item) => {
          if (item.data) {
            const { logo, ...restData } = item.data; // ❌ remove logo
            return { ...item, data: restData };
          }
          return item;
        });

        this.setState({
          historyData: filteredHistory,
          historyModalOpen: true,
        });
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        toast.error("Failed to fetch history.");
      });
  };

  handleSearchChange = (key, value) => {
    this.setState(
      (prevState) => ({
        searchTerms: {
          ...prevState.searchTerms,
          [key]: value,
        },
        currentPage: 1,
      }),
      this.fetchCompanyData,
    );
  };

  handleStatusFilterChange = (e) => {
    this.setState(
      { statusFilter: e.target.value, currentPage: 1 },
      this.fetchCompanyData,
    );
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page }, this.fetchCompanyData);
  };

  toggleEditingRow = (id) => {
    this.setState((prevState) => ({
      editingRow: prevState.editingRow === id ? null : id,
    }));
  };

  toggleModal = (modalData) => {
    this.setState((prevState) => ({
      modalOpen: !prevState.modalOpen,
      modalData: modalData || null,
    }));
  };

  render() {
    const {
      companyData,
      editingRow,
      currentPage,
      pageSize,
      statusFilter,
      searchTerms,
      totalRecords,
    } = this.state;

    const totalPages = Math.ceil(totalRecords / pageSize);

    const paginatedData = companyData;

    return (
      <>
      <Head>
        <title>Company | List</title>
      </Head>
      {this.state.successMessage && (
  <div className="text-center">

    {/* Message text */}
    <span className="align-center text-success bg-light h-30 p-2 border-success">{this.state.successMessage}</span>
  </div>
)}
        {/* Status Filter */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h6 className="fw-bold mb-3">Company List</h6>
          </Col>
          <Col className="text-end">
            <FormGroup className="d-inline-block mb-0">
              <Label for="statusFilter" className="me-2">
                Status:
              </Label>
              <Input
                type="select"
                id="statusFilter"
                value={statusFilter}
                onChange={this.handleStatusFilterChange}
                style={{ display: "inline-block", width: "auto" }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="InActive">Inactive</option>
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <Card>
          <CardBody>
            <div className="table-responsive">
              <Table
                className="align-middle p-2 table table-striped"
                style={{ tableLayout: "auto", width: "100%" }}
              >
                <thead className="table-light text-center align-middle">
                  <tr>
                    {this.tableHeaders.map((header) => (
                      <th
                        key={header.key}
                        style={{ minWidth: "140px", verticalAlign: "middle" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{header.label}</span>

                          {header.key !== "action" && (
                            <Input
                              type="text"
                              placeholder={`Search ${header.label}`}
                              value={searchTerms[header.key] || ""}
                              onChange={(e) =>
                                this.handleSearchChange(
                                  header.key,
                                  e.target.value,
                                )
                              }
                              className="mb-2"
                              style={{
                                width: "100%", // keep 100% of column
                                fontSize: "0.85rem",
                                height: "30px",
                                padding: "4px 6px",
                                borderRadius: "6px",
                                border: "1px solid #ced4da",
                                boxSizing: "border-box", // important
                              }}
                            />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <tr key={item.id}>
                        {this.tableHeaders.map((header) => {
                          if (header.key === "action") {
                            return (
                              <td key={header.key} className="text-center">
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {/* Buttons row */}
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <td className="text-center">
                                      {/* Buttons row */}
                                      <div
                                        style={{ display: "flex", gap: "6px" }}
                                      >
                                        <Button
                                          color="primary"
                                          onClick={() =>
                                            this.setState({
                                              editingRow:
                                                editingRow === item.id
                                                  ? null
                                                  : item.id,
                                            })
                                          }
                                        >
                                          <i className="la la-edit" />
                                        </Button>

                                        <Button
                                          color="outline-danger"
                                          onClick={() =>
                                            this.toggleModal({
                                              title: "Company Details",
                                              details: item,
                                              fields: [
                                                "company_name",
                                                "business_entity_type",
                                                "NTN",
                                                "size_of_company",
                                                "established_date",
                                                "phone",
                                                "company_website",
                                                "country_name",
                                                "city_name",
                                                "district_name",
                                                "company_address",
                                                "created_at",
                                                "updated_at",
                                              ],
                                            })
                                          }
                                        >
                                          <i className="la la-eye" />
                                        </Button>

                                        <Button
                                          color="outline-info"
                                          onClick={() =>
                                            this.getHistory(item.account_id)
                                          }
                                        >
                                          <i className="la la-history" />
                                        </Button>
                                      </div>

                                      {/* Dropdown appears BELOW edit button */}
                                      {editingRow === item.id && (
                                        <Input
                                          type="select"
                                          style={{ width: "120px" }}
                                          value={item.isActive} // ✅ USE STRING DIRECTLY
                                          onChange={(e) =>
                                            this.updateCompanyStatus(
                                              item.id,
                                              e.target.value,
                                            )
                                          }
                                        >
                                          <option value="Active">Active</option>
                                          <option value="InActive">
                                            InActive
                                          </option>
                                        </Input>
                                      )}
                                    </td>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={header.key} className="text-center">
                              {item[header.key] !== null &&
                              item[header.key] !== undefined &&
                              item[header.key] !== ""
                                ? item[header.key]
                                : "-"}
                            </td>
                          );

                          // return <td key={header.key}>{item[header.key]}</td>;
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={this.tableHeaders.length}
                        className="text-center align-middle py-4"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
        <DetailModal
          isOpen={this.state.modalOpen}
          toggle={() => this.toggleModal()}
          title={this.state.modalData?.title}
          details={this.state.modalData?.details}
          fields={this.state.modalData?.fields}
        />
        <HistoryModal
          isOpen={this.state.historyModalOpen}
          toggle={() => this.setState({ historyModalOpen: false })}
          historyData={this.state.historyData}
        />

        {/* Pagination */}
        {totalPages >= 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={this.handlePageChange}
          />
        )}
      </>
    );
  }
}

export default CompanyData;
