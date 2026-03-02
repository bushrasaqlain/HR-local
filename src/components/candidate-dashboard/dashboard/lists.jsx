"use client";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Input, Table } from "reactstrap";
import axios from "axios";

class JobList extends Component {
  state = {
    selected: this.props.selectedType || "",
    shortlistedList: [],
    approvedList: [],
    loading: true,
  };

  componentDidMount() {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}candidateProfile/candidate`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data || {};
        this.setState({
          shortlistedList: data.shortlisted_companies || [],
          approvedList: data.approved_companies || [],
          loading: false,
        });
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
        this.setState({ loading: false });
      });
  }

  handleChange = (e) => {
    this.setState({ selected: e.target.value });
  };

  renderTable = (list) => {
    if (!list.length) return <p className="text-muted p-5 mt-3 mb-0">No companies found</p>;

    return (
      <Table striped responsive className="mt-3">
        <thead>
          <tr>
            <th>#</th>
            <th>Company Name</th>
            <th>Job Title</th>
            <th>Logo</th>
          </tr>
        </thead>
        <tbody>
          {list.map((company, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{company.company_name || company.name}</td>
              <td>{company.job_title || "-"}</td>
              <td>
                {company.logo ? (
                  <img
                    src={`data:image/png;base64,${Buffer.from(company.logo.data).toString(
                      "base64"
                    )}`}
                    alt={company.company_name}
                    width="50"
                  />
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  render() {
    const { selected, shortlistedList, approvedList, loading } = this.state;

    const lists = {
      shortlisted: shortlistedList,
      approved: approvedList,
      appeared: [], // optional for appeared-in-search
    };

    if (loading) return <div>Loading companies...</div>;

    return (
      <Card className="mt-5">
        <CardHeader>Select Category</CardHeader>
        <CardBody>
          <Input type="select" value={selected} onChange={this.handleChange}>
            <option value="">Select</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
          </Input>

          {selected && this.renderTable(lists[selected])}

          {!selected && (
            <p className="text-muted mt-3 mb-0">
              Please select an option to see the list
            </p>
          )}
        </CardBody>
      </Card>
    );
  }
}

export default JobList;
