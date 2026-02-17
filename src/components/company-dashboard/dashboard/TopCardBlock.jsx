import React, { Component } from "react";
import { Row, Col, Card, CardBody } from "reactstrap";
import axios from "axios";

class TopCardBlock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      postedJobsCount: 0,
      packageCount: 0,
      applicantCount: 0,
      activeJobCount: 0
    };
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = sessionStorage.getItem("userId");
  }

  componentDidMount() {
    this.fetchPostedJobsCount();
  }

  fetchPostedJobsCount = async () => {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}company-info/getCount/${this.userId}`
      );
      this.setState({ 
        postedJobsCount: response.data.jobPostsCount,
        packageCount: response.data.packageCount,
        applicantCount: response.data.applicantCount,
        activeJobCount: response.data.activeJobCount 
      });
    } catch (error) {
      console.error("Error fetching posted jobs count:", error);
    }
  };

  handleCardClick = (tabKey, filterStatus = null) => {
    if (tabKey && this.props.onTabChange) {
      this.props.onTabChange(tabKey, filterStatus);
    }
  };

  render() {
    const { postedJobsCount, packageCount, applicantCount, activeJobCount } = this.state;
    
    // Don't render if activeTab is not 'profile'
    if (this.props.activeTab && this.props.activeTab !== 'profile') {
      return null;
    }

    const cardContent = [
      {
        id: 1,
        icon: "flaticon-briefcase",
        countNumber: postedJobsCount,
        metaName: "Posted Jobs",
        uiClass: "ui-blue",
        tabKey: "jobList",
        filterStatus: null
      },
      {
        id: 2,
        icon: "la-file-invoice",
        countNumber: activeJobCount,
        metaName: "Active Posted Job",
        uiClass: "ui-red",
        tabKey: "jobList",
        filterStatus: "Active",
        quickStatusFilter: "Active"
      },
      {
        id: 3,
        icon: "la-file-invoice",
        countNumber: packageCount,
        metaName: "Packages",
        uiClass: "ui-red",
        tabKey: "packagesList",
        filterStatus: null
      },
      {
        id: 4,
        icon: "la-bookmark-o",
        countNumber: applicantCount,
        metaName: "Applicant",
        uiClass: "ui-green",
        tabKey: "allApplicants",
        filterStatus: null
      },
    ];

    return (
      <Row>
        {cardContent.map((item) => (
          <Col
            key={item.id}
            xl="3"
            lg="6"
            md="6"
            sm="12"
            className="mb-4"
          >
            <Card 
              className={`ui-item ${item.uiClass} h-100`}
              style={{ cursor: item.tabKey ? 'pointer' : 'default' }}
              onClick={() => this.handleCardClick(item.tabKey, item.filterStatus)}
            >
              <CardBody className="d-flex align-items-center h-100">
                <div className="left me-3">
                  <i className={`icon la ${item.icon}`} style={{ fontSize: "2rem" }}></i>
                </div>
                <div className="right">
                  <h4>{item.countNumber}</h4>
                  <p className="mb-0">{item.metaName}</p>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
}

export default TopCardBlock;