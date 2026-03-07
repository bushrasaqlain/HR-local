"use client";
import React, { Component } from "react";
import { Card, CardBody, CardHeader, Input, Table } from "reactstrap";
import axios from "axios";
import { FaCheckCircle, FaCalendarAlt } from "react-icons/fa";
import CompanyInfo from "./companyinfo";
import Head from "next/head";

class JobList extends Component {
  state = {
    selected: this.props.selectedType || "",
    shortlistedList: [],
    approvedList: [],
    loading: true,
    showCompanyInfo: false,
    selectedCompany: null,
    companyLoading: false,
     newDate: "",
  newTime: "",
  rescheduleCompanyId: null, 
  };

  componentDidMount() {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}candidateProfile/candidate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
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
  handleCompanyClick = async (company) => {
    const token = sessionStorage.getItem("token");

    this.setState({ companyLoading: true });

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}company-info/getcompanybyid/${company.company_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // 🔥 Merge interview + job data into company response
      const mergedData = {
        ...res.data,
        interview_day: company.interview_day,
        interview_time: company.interview_time,
        job_title: company.job_title,
        application_id: company.application_id,
      };

      this.setState({
        selectedCompany: mergedData,
        showCompanyInfo: true,
        companyLoading: false,
      });
    } catch (error) {
      console.error("Error fetching company details:", error);
      this.setState({ companyLoading: false });
    }
  };
  handleChange = (e) => {
    this.setState({ selected: e.target.value });
  };
handleConfirm = async (company) => {
  const token = sessionStorage.getItem("token");

  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}updatestatus`,
      {
        candidateId: company.candidate_id,   // must exist in list
        jobId: company.job_id,               // must exist in list
        candidate_response: "Accepted"
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert("Interview confirmed successfully!");
  } catch (error) {
    console.error(error);
    alert("Error confirming interview");
  }
};
handleReschedule = async (company) => {
  const { newDate, newTime } = this.state;
  if (!newDate || !newTime) return;

  // Optional: prevent selecting past time today
  const now = new Date();
  const selected = new Date(`${newDate}T${newTime}`);
  if (selected < now) {
    alert("Cannot select a past date/time!");
    return;
  }

  const token = sessionStorage.getItem("token");

  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}updatestatus`,
      {
        candidateId: company.candidate_id,
        jobId: company.job_id,
        candidate_response: "Reschedule Requested",
        requested_interview_day: newDate,
        requested_interview_time: newTime,
        candidate_response_message: "Requested new schedule",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Reschedule request sent!");
    // Reset inputs
    this.setState({ newDate: "", newTime: "", rescheduleCompanyId: null });
  } catch (error) {
    console.error("Error requesting reschedule:", error);
    alert("Error requesting reschedule");
  }
};
  renderTable = (list) => {
    if (!list.length)
      return <p className="text-muted p-5 mt-3 mb-0">No companies found</p>;

    return (
      
      <Table striped responsive className="mt-3 text-center">
        <thead className="text-center">
          <tr>
            <th>#</th>
            <th>Company Name</th>
            <th>Job Title</th>
            {this.state.selected === "shortlisted" && (
              <>
                <th>Interview Date</th>
                <th>Interview Time</th>
                <th>Action</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {list.map((company, index) => {
            const formattedDate = company.interview_day
              ? (() => {
                  const d = new Date(company.interview_day);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = d.toLocaleString("en-US", { month: "short" });
                  const year = String(d.getFullYear()).slice(-2);
                  return `${day}-${month}-${year}`;
                })()
              : "-";

            const formattedDay = company.interview_day
              ? new Date(company.interview_day).toLocaleDateString("en-US", {
                  weekday: "long",
                })
              : "";

            const formattedTime = company.interview_time
              ? new Date(
                  `1970-01-01T${company.interview_time}`,
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-";

            return (
              <tr key={index}>
                <td>{index + 1}</td>

                <td
                  className="text-primary fw-semibold"
                  style={{ cursor: "pointer" }}
                  onClick={() => this.handleCompanyClick(company)}
                >
                  {company.company_name || company.name}
                </td>

                <td>{company.job_title || "-"}</td>

                {this.state.selected === "shortlisted" && (
                  <>
                    <td>
                      {formattedDate !== "-" ? (
                        <>
                          {formattedDate}(
                          <small className="text-muted">{formattedDay}</small>)
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{formattedTime}</td>

                  

                   <td className="text-center">
  <FaCheckCircle
    size={22}
    className="text-success me-3 action-icon"
    style={{ cursor: "pointer" }}
    title="Confirm Interview"
    onClick={() => this.handleConfirm(company)}
  />

  {this.state.rescheduleCompanyId === company.company_id ? (
    <div>
      <input
        type="date"
        value={this.state.newDate}
        onChange={(e) => this.setState({ newDate: e.target.value })}
        min={new Date().toISOString().split("T")[0]} // restrict past dates
        className="form-control mb-1"
      />
      <input
        type="time"
        value={this.state.newTime}
        onChange={(e) => this.setState({ newTime: e.target.value })}
        className="form-control mb-1"
      />
      <button
        className="btn btn-warning btn-sm"
        onClick={() => this.handleReschedule(company)}
        disabled={!this.state.newDate || !this.state.newTime}
      >
        Request Reschedule
      </button>
      <button
        className="btn btn-secondary btn-sm ms-1"
        onClick={() =>
          this.setState({ rescheduleCompanyId: null, newDate: "", newTime: "" })
        }
      >
        Cancel
      </button>
    </div>
  ) : (
    <FaCalendarAlt
      size={22}
      className="text-warning"
      style={{ cursor: "pointer" }}
      title="Request Reschedule"
      onClick={() => this.setState({ rescheduleCompanyId: company.company_id })}
    />
  )}
</td>
         
                  </>
                )}
              </tr>
            );
          })}
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
    if (this.state.showCompanyInfo && this.state.selectedCompany) {
      return (
        <CompanyInfo
          company={this.state.selectedCompany}
          onBack={() =>
            this.setState({
              showCompanyInfo: false,
              selectedCompany: null,
            })
          }
        />
      );
    }
    return (
      <>
      <Head>
        <title>Job List</title>
      </Head>
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
      </>
      
    );
  }
}

export default JobList;
