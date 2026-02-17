"use client";
import React, { Component } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Payment from "./payment.jsx";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Button,
} from "reactstrap";

class PricingForm extends Component {
  constructor(props) {
    super(props);

    this.APIBASEURL = process.env.NEXT_PUBLIC_API_BASE_URL;

    this.state = {
      packages: null,
      userId: typeof window !== "undefined" ? sessionStorage.getItem("userId") : null,
      showPayment: false,
      selectedPackage: null,
      selectedPrice: null,
      selectedCurrency: null,
    };
  }

  componentDidMount() {
    this.loadPackages();
  }

  loadPackages = async () => {
    try {
      const response = await axios.get(`${this.APIBASEURL}packages/getallpackages`);
      this.setState({ packages: response.data.packages });
    } catch (error) {
      toast.error("Failed to load packages");
    }
  };

  addPackage = async (packageId) => {
    const { jobId } = this.props;
    const { userId, packages } = this.state;

    if (!jobId) {
      toast.error("Job ID not found. Please post job first.");
      return;
    }

    // Find the selected package BEFORE making the API call
    const selectedPkg = packages.find(pkg => pkg.id === packageId);

    try {
      const response = await axios.put(`${this.APIBASEURL}job/subcribepackage`, { jobId, packageId, userId });
      if (response.status === 200) {
        this.setState({ 
          showPayment: true, 
          selectedPackage: packageId,
          selectedPrice: selectedPkg?.price,
          selectedCurrency: selectedPkg?.currency
        });
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  handlePaymentSuccess = () => {
    this.setState({ 
      showPayment: false, 
      selectedPackage: null,
      selectedPrice: null,
      selectedCurrency: null
    });
    if (this.props.onPaymentSuccess) this.props.onPaymentSuccess();
  };

  getPlanConfig = (durationUnit) => {
    switch (durationUnit) {
      case "Hours":
        return {
          cardClass: "plan-hours",
          features: [
            "Quick job posting for urgent needs",
            "Job visible immediately after approval",
            "Basic applicant tracking included",
            "Affordable short-term exposure",
          ],
        };
      case "Days":
        return {
          cardClass: "plan-days",
          features: [
            "Job listed for multiple days",
            "Highlighted in search results",
            "Email notifications to candidates",
            "Access to applicant details & resumes",
            "Standard support included",
          ],
        };
      case "Months":
        return {
          cardClass: "plan-months",
          features: [
            "Extended job visibility",
            "Boosted placement in candidate dashboards",
            "Priority listing above short-term plans",
            "Analytics on views and applications",
            "Dedicated employer support",
          ],
        };
      case "Years":
        return {
          cardClass: "plan-years",
          features: [
            "Premium long-term visibility",
            "Maximum exposure across platform",
            "Unlimited applicant management",
            "Featured employer branding",
            "Priority customer support",
          ],
        };
      default:
        return {
          cardClass: "plan-default",
          features: [
            "Standard job posting",
            "Candidate application tracking",
            "Basic support included",
          ],
        };
    }
  };

  render() {
    const { packages, showPayment, selectedPackage, selectedPrice, selectedCurrency } = this.state;

    return (
      <Container className="pb-5">
        <h2 className="text-center py-5 fw-bold" style={{ fontSize: "2.5rem", color: "#333" }}>
          Pricing Plans
        </h2>

        <Row className="g-4 justify-content-center">
          {packages?.map((pkg) => {
            const { cardClass, features } = this.getPlanConfig(pkg.duration_unit);

            return (
              <Col key={pkg.id} xs={12} sm={6} md={6} lg={6}>
                <Card
                  className={`h-100 ${cardClass}`}
                  style={{
                    borderRadius: "16px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                  }}
                >
                  <CardBody className="d-flex flex-column text-center p-4">
                    <CardTitle tag="h5" className="fw-bold mb-3" style={{ fontSize: "1.25rem" }}>
                      {pkg.duration_unit.charAt(0).toUpperCase() + pkg.duration_unit.slice(1)} Plan
                    </CardTitle>

                    <div className="plan-price mb-3" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                      {pkg.price} {pkg.currency} <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>/ {pkg.duration_unit}</span>
                    </div>

                    <p className="plan-desc mb-3" style={{ color: "#555" }}>
                      Your job post will show for <strong>{pkg.duration_value} {pkg.duration_unit}</strong>
                    </p>

                    <ul className="plan-features text-start flex-grow-1 mb-3" style={{ paddingInlineStart: "1rem", color: "#555" }}>
                      {features.map((feature, index) => (
                        <li key={index} style={{ marginBottom: "0.5rem" }}>{feature}</li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      color="primary"
                      className="w-100 mt-auto"
                      style={{
                        borderRadius: "50px",
                        padding: "0.75rem",
                        fontWeight: "600",
                        background: "linear-gradient(90deg, #4b6cb7, #182848)",
                        border: "none",
                      }}
                      onClick={() => this.addPackage(pkg.id)}
                    >
                      Select Plan
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Payment Modal */}
        <Payment
          isOpen={showPayment}
          toggle={() => this.setState({ showPayment: false })}
          packageId={selectedPackage}
          jobId={this.props.jobId}
          amount={selectedPrice}
          currency={selectedCurrency}
          onPaymentSuccess={this.handlePaymentSuccess}
        />
      </Container>
    );
  }
}

export default PricingForm;