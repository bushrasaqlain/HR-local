"use client";

import React, { Component } from "react";
import { connect } from "react-redux";
import { Table, Button, FormGroup, Label, Input } from "reactstrap";
import Link from "next/link";
import axios from "axios";

class AllApplicants extends Component {
  state = {
    applicantsData: [],
    ShortlistApplicants: [],
    SelectedApplicants: [],
    rejectedApplicants: [],
    currentPageTotal: 1,
    currentPageApproved: 1,
    currentPageShortlist: 1,
    currentPageRejected: 1,
    itemsPerPage: 6,
    selectedTabIndex: 0,
  };

  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData = async () => {
    const { userId } = this.props;
    try {
      const [applied, approved, shortlisted, rejected] = await Promise.all([
        axios.get(`${this.apiBaseUrl}applicantsData/${userId}/applied`),
        axios.get(`${this.apiBaseUrl}applicantsData/${userId}/Approve`),
        axios.get(`${this.apiBaseUrl}applicantsData/${userId}/shortlisted`),
        axios.get(`${this.apiBaseUrl}applicantsData/${userId}/Rejected`),
      ]);

      this.setState({
        applicantsData: applied.data,
        SelectedApplicants: approved.data,
        ShortlistApplicants: shortlisted.data,
        rejectedApplicants: rejected.data,
      });
    } catch (err) {
      console.error(err);
    }
  };

  updateStatus = async (url) => {
    await axios.put(url);
    this.fetchAllData();
  };

  handleShortlistApplication = (id) =>
    this.updateStatus(`${this.apiBaseUrl}ShortListedApplicants/${id}`);

  handleApproveApplication = (id) =>
    this.updateStatus(`${this.apiBaseUrl}ApprovedApplicatns/${id}`);

  handleRejectApplication = (id) =>
    this.updateStatus(`${this.apiBaseUrl}RejectedApplicatns/${id}`);

  paginate = (data, page) => {
    const { itemsPerPage } = this.state;
    return data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  };

  renderRow = (item, actions = []) => (
    <tr key={item.id}>
      <td>
        <Link href={`/candidates-single-v1/${item.candidate_id}`}>
          {item.candidate_name}
        </Link>
      </td>
      <td>{item.job_title}</td>
      <td>{item.skills}</td>
      <td>{item.Complete_Address}</td>
      {actions.length > 0 && (
        <td>
          {actions.map((a, i) => (
            <Button
              key={i}
              color={a.icon.includes("times") ? "danger" : "success"}
              size="sm"
              className="me-1"
              onClick={() => a.fn(item.application_id)}
            >
              <i className={a.icon}></i>
            </Button>
          ))}
        </td>
      )}
    </tr>
  );

  renderTable = ({ data, page, actions = [], showAction = true }) => (
    <Table striped responsive hover>
      <thead>
        <tr>
          <th>Name</th>
          <th>Job Title</th>
          <th>Skills</th>
          <th>Address</th>
          {showAction && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {this.paginate(data, page).map((item) =>
          this.renderRow(item, actions)
        )}
        {data.length === 0 && (
          <tr>
            <td colSpan={showAction ? 5 : 4} className="text-center">
              No records found
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );

  render() {
    const {
      applicantsData,
      SelectedApplicants,
      ShortlistApplicants,
      rejectedApplicants,
      selectedTabIndex,
      currentPageTotal,
      currentPageApproved,
      currentPageShortlist,
      currentPageRejected,
    } = this.state;

    return (
      <div className="ls-widget">
        <div className="widget-title d-flex align-items-center mb-3">
          <h4 className="me-3">Applicants</h4>
          <FormGroup className="mb-0">
            <Label for="tabSelect" className="visually-hidden">
              Select Tab
            </Label>
            <Input
              type="select"
              id="tabSelect"
              value={selectedTabIndex}
              onChange={(e) =>
                this.setState({ selectedTabIndex: +e.target.value })
              }
            >
              <option value={0}>Applied ({applicantsData.length})</option>
              <option value={1}>Selected ({SelectedApplicants.length})</option>
              <option value={2}>Shortlisted ({ShortlistApplicants.length})</option>
              <option value={3}>Rejected ({rejectedApplicants.length})</option>
            </Input>
          </FormGroup>
        </div>

        {selectedTabIndex === 0 &&
          this.renderTable({
            data: applicantsData,
            page: currentPageTotal,
            actions: [
              { icon: "la la-check", fn: this.handleShortlistApplication },
              { icon: "la la-times-circle", fn: this.handleRejectApplication },
            ],
          })}

        {selectedTabIndex === 1 &&
          this.renderTable({
            data: SelectedApplicants,
            page: currentPageApproved,
          })}

        {selectedTabIndex === 2 &&
          this.renderTable({
            data: ShortlistApplicants,
            page: currentPageShortlist,
            actions: [
              { icon: "la la-check", fn: this.handleApproveApplication },
              { icon: "la la-times-circle", fn: this.handleRejectApplication },
            ],
          })}

        {selectedTabIndex === 3 &&
          this.renderTable({
            data: rejectedApplicants,
            page: currentPageRejected,
            actions: [
              { icon: "la la-check", fn: this.handleShortlistApplication },
            ],
          })}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.user.userId,
});

export default connect(mapStateToProps)(AllApplicants);
