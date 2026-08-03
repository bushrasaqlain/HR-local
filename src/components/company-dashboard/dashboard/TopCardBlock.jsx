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
      activeJobCount: 0,
      hoveredCard: null,
      selectedCard: null
    };
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = sessionStorage.getItem("userId");
  }

  componentDidMount() {
    this.fetchPostedJobsCount();
  }

  // Add this method to reset selected card when activeTab changes
  componentDidUpdate(prevProps) {
    // If activeTab changes to 'profile' and previously it wasn't 'profile', reset selectedCard
    if (this.props.activeTab === 'profile' && prevProps.activeTab !== 'profile') {
      if (this.state.selectedCard) {
        this.setState({ selectedCard: null });
      }
    }

    // If activeTab changes and it's not the selected card's target, reset
    if (this.state.selectedCard && this.props.activeTab !== this.state.selectedCard) {
      this.setState({ selectedCard: null });
    }
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
      this.setState({ selectedCard: tabKey });
      this.props.onTabChange(tabKey, filterStatus);
    }
  };

  handleBackClick = () => {
    this.setState({ selectedCard: null });
    if (this.props.onTabChange) {
      this.props.onTabChange('profile', null);
    }
  };

  setHoveredCard = (id) => {
    this.setState({ hoveredCard: id });
  };

  clearHoveredCard = () => {
    this.setState({ hoveredCard: null });
  };

  render() {
    const { postedJobsCount, packageCount, applicantCount, activeJobCount, hoveredCard, selectedCard } = this.state;

    // Only show if on profile tab OR if a card is selected
    if (this.props.activeTab && this.props.activeTab !== 'profile' && !selectedCard) {
      return null;
    }

    const cardContent = [
      {
        id: 1,
        icon: "la-briefcase",
        countNumber: postedJobsCount,
        metaName: "Posted Jobs",
        tabKey: "jobList",
        filterStatus: null,
        bgColor: "#FFFFFF",
        iconBg: "#edfafd",
        iconColor: "#36565f",
        textColor: "#1F2937",
        subTextColor: "#6B7280"
      },
      {
        id: 2,
        icon: "la-file-invoice",
        countNumber: activeJobCount,
        metaName: "Active Posted Jobs",
        tabKey: "jobList",
        filterStatus: "Active",
        bgColor: "#FFFFFF",
        iconBg: "#F0FDF4",
        iconColor: "#10B981",
        textColor: "#1F2937",
        subTextColor: "#6B7280"
      },
      {
        id: 3,
        icon: "la-file-invoice",
        countNumber: packageCount,
        metaName: "Packages",
        tabKey: "viewpackage",
        filterStatus: null,
        bgColor: "#FFFFFF",
        iconBg: "#FEF3C7",
        iconColor: "#F59E0B",
        textColor: "#1F2937",
        subTextColor: "#6B7280"
      },
      {
        id: 4,
        icon: "la-bookmark-o",
        countNumber: applicantCount,
        metaName: "Total Applicants",
        tabKey: "allApplicants",
        filterStatus: null,
        bgColor: "#FFFFFF",
        iconBg: "#FCE7F3",
        iconColor: "#EC4899",
        textColor: "#1F2937",
        subTextColor: "#6B7280"
      },
    ];

    // Show back button if a card is selected
    if (selectedCard) {
      return (
        <div className="position-relative mb-3">
          <button
            onClick={this.handleBackClick}
            className="d-inline-flex align-items-center mb-3"
            style={{
              color: '#36565F',
              fontSize: '0.875rem',
              padding: '0.5rem 0',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              fontWeight: 500
            }}
          >
            <i className="la la-arrow-left me-2" style={{ fontSize: '1rem' }}></i>
            Back to Dashboard
          </button>
        </div>
      );
    }

    return (
      <>
        <Row className="g-4 mb-4">
          {cardContent.map((item) => (
            <Col
              key={item.id}
              xl="3"
              lg="6"
              md="6"
              sm="12"
              className="px-2"
            >
              <div
                className="card-stats"
                style={{
                  cursor: item.tabKey ? 'pointer' : 'default',
                  background: item.bgColor,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === item.id ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredCard === item.id
                    ? '0 12px 24px rgba(0,0,0,0.1)'
                    : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
                  border: '1px solid #E5E7EB',
                }}
                onClick={() => this.handleCardClick(item.tabKey, item.filterStatus)}
                onMouseEnter={() => this.setHoveredCard(item.id)}
                onMouseLeave={this.clearHoveredCard}
              >
                <div className="d-flex align-items-center justify-content-between">
                  {/* Left side - Stats */}
                  <div>
                    <h3
                      style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        marginBottom: '0.25rem',
                        color: item.textColor,
                        lineHeight: 1.2
                      }}
                    >
                      {item.countNumber.toLocaleString()}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: item.subTextColor,
                        marginBottom: 0,
                        letterSpacing: '0.3px'
                      }}
                    >
                      {item.metaName}
                    </p>
                  </div>

                  {/* Right side - Icon */}
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: item.iconBg,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      transform: hoveredCard === item.id ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <i
                      className={`la ${item.icon}`}
                      style={{
                        fontSize: "1.5rem",
                        color: item.iconColor
                      }}
                    />
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <style jsx global>{`
          .card-stats {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-stats:hover {
            border-color: #E5E7EB !important;
          }
          
          @media (max-width: 768px) {
            .card-stats {
              padding: 1rem !important;
            }
            .card-stats h3 {
              font-size: 1.5rem !important;
            }
            .card-stats p {
              font-size: 0.75rem !important;
            }
            .card-stats .d-flex.align-items-center.justify-content-center {
              width: 40px !important;
              height: 40px !important;
            }
            .card-stats i {
              font-size: 1.25rem !important;
            }
          }
        `}</style>
      </>
    );
  }
}

export default TopCardBlock;