import React, { Component } from "react";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
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
      selectedCard: null // Track selected card
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
      this.setState({ selectedCard: tabKey }); // Store selected card
      this.props.onTabChange(tabKey, filterStatus);
    }
  };

  handleBackClick = () => {
    this.setState({ selectedCard: null });
    if (this.props.onTabChange) {
      this.props.onTabChange('profile', null); // Go back to profile tab
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
    
    // Don't render if activeTab is not 'profile'
    if (this.props.activeTab && this.props.activeTab !== 'profile' && !selectedCard) {
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
        filterStatus: null,
        bgGradient: "linear-gradient(135deg, #232424 0%, #7c7979 100%)",
        iconBg: "rgba(228, 228, 228, 0.2)"
      },
      {
        id: 2,
        icon: "la-file-invoice",
        countNumber: activeJobCount,
        metaName: "Active Posted Jobs",
        uiClass: "ui-red",
        tabKey: "jobList",
        filterStatus: "Active",
        quickStatusFilter: "Active",
        bgGradient: "linear-gradient(135deg, #252c2c 0%, #414c50 100%)",
        iconBg: "rgba(66, 63, 66, 0.2)"
      },
      {
        id: 3,
        icon: "la-box",
        countNumber: packageCount,
        metaName: "Packages",
        uiClass: "ui-purple",
        tabKey: "packagesList",
        filterStatus: null,
        bgGradient: "linear-gradient(135deg, #314252 0%, #0c4a4e 100%)",
        iconBg: "rgba(79, 172, 254, 0.2)"
      },
      {
        id: 4,
        icon: "la-users",
        countNumber: applicantCount,
        metaName: "Total Applicants",
        uiClass: "ui-green",
        tabKey: "allApplicants",
        filterStatus: null,
        bgGradient: "linear-gradient(135deg, #5f8190 0%, #36565f 100%)",
        iconBg: "rgba(67, 233, 123, 0.2)"
      },
    ];

    // Show back button if a card is selected
    if (selectedCard) {
      return (
        <div className="position-relative mb-3">
          <Button
            color="link"
            onClick={this.handleBackClick}
            className="d-inline-flex align-items-center text-decoration-none mb-3"
            style={{
              color: '#495057',
              fontSize: '1rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none'
            }}
          >
            <i className="la la-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>
            Back
          </Button>
        </div>
      );
    }

    return (
      <Row className="g-4 m-2">
        {cardContent.map((item) => (
          <Col
            key={item.id}
            xl="3"
            lg="6"
            md="6"
            sm="12"
          >
            <Card 
              className={`card-hover overflow-hidden`}
              style={{
                cursor: item.tabKey ? 'pointer' : 'default',
                border: 'none',
                borderRadius: '20px',
                background: item.bgGradient,
                transition: 'all 0.3s ease',
                transform: hoveredCard === item.id ? 'translateY(-10px)' : 'translateY(0)',
                boxShadow: hoveredCard === item.id 
                  ? '0 20px 40px rgba(0,0,0,0.3)' 
                  : '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                minHeight: '160px'
              }}
              onClick={() => this.handleCardClick(item.tabKey, item.filterStatus)}
              onMouseEnter={() => this.setHoveredCard(item.id)}
              onMouseLeave={this.clearHoveredCard}
            >
              {/* Background Pattern */}
              <div
                style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '200px',
                  height: '200px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />
              
              {/* Animated Shine Effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: hoveredCard === item.id ? '100%' : '-100%',
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transition: 'left 0.5s ease',
                  pointerEvents: 'none',
                  transform: 'skewX(-25deg)'
                }}
              />
              
              <CardBody className="d-flex align-items-center position-relative" style={{ zIndex: 1 }}>
                {/* Icon with Background */}
                <div 
                  className="me-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '15px',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    transform: hoveredCard === item.id ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0)'
                  }}
                >
                  <i 
                    className={`icon la ${item.icon}`} 
                    style={{ 
                      fontSize: "2rem",
                      color: '#ffffff'
                    }}
                  />
                </div>
                
                {/* Content */}
                <div>
                  <h4 
                    style={{
                      fontSize: '2.2rem',
                      fontWeight: '700',
                      marginBottom: '5px',
                      color: '#ffffff',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {item.countNumber}
                  </h4>
                  <p 
                    className="mb-0"
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: 'rgba(255,255,255,0.9)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.metaName}
                  </p>
                </div>

                {/* Small Indicator Badge */}
                {item.filterStatus && (
                  <div 
                    className="position-absolute top-0 end-0 m-3"
                    style={{
                      width: '8px',
                      height: '8px',
                      background: '#ffd700',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px #ffd700',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        ))}
        
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .card-hover {
            transition: all 0.3s ease;
          }
          
          .card-hover:hover {
            box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
          }
        `}</style>
      </Row>
    );
  }
}

export default TopCardBlock;