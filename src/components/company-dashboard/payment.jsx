"use client";
import React, { Component } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Button } from "reactstrap";
import axios from "axios";

class Payment extends Component {

  state = {
    paymentData: {
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
      amount: "",
      currency: "",
    },
    currencies: [],
    errors: {},
    loading: false,
    userId: null,
  };

  getCurrencies = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}getCurrencyinPayment`
      );
      this.setState({ currencies: res.data.currencies });
    } catch (error) {
      console.error("Failed to load currencies");
    }
  };

  componentDidMount() {
    const userId = sessionStorage.getItem("userId");
    this.setState({ userId });
    this.getCurrencies();

    const { amount, currency } = this.props;
    if (amount && currency) {
      this.setState(prev => ({
        paymentData: {
          ...prev.paymentData,
          amount: amount,
          currency: currency,
        }
      }));
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.amount !== this.props.amount || prevProps.currency !== this.props.currency) {
      const { amount, currency } = this.props;
      if (amount && currency) {
        this.setState(prev => ({
          paymentData: {
            ...prev.paymentData,
            amount: amount,
            currency: currency,
          }
        }));
      }
    }
  }

  handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "expiry") {
      value = value
        .replace(/\D/g, "")
        .slice(0, 4);

      if (value.length >= 3) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
    }

    this.setState(prev => ({
      paymentData: {
        ...prev.paymentData,
        [name]: value,
      },
      // ✅ ADD: type karne par us field ka error clear ho
      errors: { ...prev.errors, [name]: "" },
    }));
  };

  validate = () => {
    const { paymentData } = this.state;
    const errors = {};
    const { cardNumber, cardHolder, expiry, cvv, amount, currency } = paymentData;

    if (!/^\d{16}$/.test(cardNumber)) {
      errors.cardNumber = "Card number must be 16 digits";
    }

    if (!/^[a-zA-Z ]+$/.test(cardHolder.trim())) {
      errors.cardHolder = "Only letters are allowed";
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      errors.expiry = "Expiry must be MM/YY";
    } else {
      const [month, year] = expiry.split("/").map(Number);
      const currentDate = new Date();
      const expiryDate = new Date(2000 + year, month);
      if (expiryDate <= currentDate) {
        errors.expiry = "Card is expired";
      }
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits";
    }

    if (Number(amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    }

    if (!currency) {
      errors.currency = "Currency is required";
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handlePayment = async () => {
    if (!this.validate()) return;

    const { packageId, jobId, onPaymentSuccess, isRegistration, paymentType } = this.props;
    const { paymentData } = this.state;

    try {
      this.setState({ loading: true });

      if (isRegistration) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}payment/registration/${this.state.userId}`,
          {
            paymentMethod: "Card",
            cardNumber: paymentData.cardNumber,
            cardHolder: paymentData.cardHolder,
            amount: paymentData.amount,
            currency: paymentData.currency,
            packageId,
          },
          { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}payment/addpayment/${this.state.userId}`,
          {
            paymentDetails: {
              method: "Card",
              cardLast4: paymentData.cardNumber,
              cardName: paymentData.cardHolder,
              saveForLater: false,
            },
            amount: paymentData.amount,
            currency: paymentData.currency,
            packageId: packageId || null,
            jobId: jobId || null,
            payment_type: paymentType || "job",  
          }
        );
      }

      this.props.toggle();
      if (onPaymentSuccess) onPaymentSuccess();

    } catch (err) {
      this.setState(prev => ({
        errors: {
          ...prev.errors,
          general: err.response?.data?.message || "Payment failed. Try again.",
        },
      }));
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { isOpen, toggle } = this.props;
    const { paymentData, loading, errors, currencies } = this.state;

    return (
      <Modal isOpen={isOpen} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>
          Payment Details
        </ModalHeader>

        <ModalBody>
          {/* ✅ ADD: General error alert */}
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}

          <Form>
            <FormGroup>
              <Label>Card Number</Label>
              <Input
                name="cardNumber"
                value={paymentData.cardNumber}
                onChange={this.handleChange}
                placeholder="Enter 16 digit card number"
                maxLength="16"
              />
              {errors.cardNumber && (
                <div className="text-danger small">{errors.cardNumber}</div>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Card Holder</Label>
              <Input
                name="cardHolder"
                value={paymentData.cardHolder}
                onChange={this.handleChange}
                placeholder="Enter Card Holder Name"
              />
              {errors.cardHolder && <div className="text-danger small">{errors.cardHolder}</div>}
            </FormGroup>

            <FormGroup>
              <Label>Expiry (MM/YY)</Label>
              <Input
                name="expiry"
                placeholder="MM/YY"
                value={paymentData.expiry}
                onChange={this.handleChange}
                maxLength="5"
              />
              {errors.expiry && (
                <div className="text-danger small">{errors.expiry}</div>
              )}
            </FormGroup>

            <FormGroup>
              <Label>CVV</Label>
              <Input
                type="password"
                name="cvv"
                value={paymentData.cvv}
                onChange={this.handleChange}
                placeholder="123"
                maxLength="4"
              />
              {errors.cvv && <div className="text-danger small">{errors.cvv}</div>}
            </FormGroup>

            <FormGroup>
              <Label>Amount</Label>
              <Input
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={this.handleChange}
                readOnly
                style={{ backgroundColor: '#f0f0f0' }}
              />
              {errors.amount && <div className="text-danger small">{errors.amount}</div>}
            </FormGroup>

            <FormGroup>
              <Label>Currency</Label>
              <Input
                type="text"
                name="currency"
                value={paymentData.currency}
                readOnly
                style={{ backgroundColor: '#f0f0f0' }}
              />
              {errors.currency && (
                <div className="text-danger small">{errors.currency}</div>
              )}
            </FormGroup>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button color="secondary" type="button" onClick={toggle}>
            Cancel
          </Button>

          <Button
            color="primary"
            type="button"
            onClick={this.handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ${paymentData.amount} ${paymentData.currency}`}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default Payment;