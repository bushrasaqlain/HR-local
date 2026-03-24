"use client";
import React, { Component } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";
import Select from "react-select"; // Add this import

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
};

class ProfileChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      labels: [],
      chartData: [],
      filter: {
        type: "month",
        value: 1,
      },
    };

    // Define options for react-select
    this.selectOptions = [
      { value: "1", label: "Last 1 Month" },
      { value: "2", label: "Last 2 Months" },
      { value: "4", label: "Last 4 Months" },
      { value: "6", label: "Last 6 Months" },
      { value: "8", label: "Last 8 Months" },
      { value: "10", label: "Last 10 Months" },
      { value: "12", label: "Last 12 Months" },
    ];
  }

  componentDidMount() {
    this.fetchChartData(this.state.filter.type, this.state.filter.value);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.filter.type !== this.state.filter.type ||
      prevState.filter.value !== this.state.filter.value
    ) {
      this.fetchChartData(this.state.filter.type, this.state.filter.value);
    }
  }

  fetchChartData = async (type, value) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const userId = sessionStorage.getItem("userId");
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        `${apiBaseUrl}job/gettotaljob/${userId}?type=${type}&value=${value}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      this.setState({
        labels: res.data.labels,
        chartData: res.data.data,
      });
    } catch (error) {
      console.error("Chart API error", error);
    }
  };

  handleFilterChange = (selectedOption) => {
    const val = parseInt(selectedOption.value);
    if (val <= 12) {
      this.setState({ filter: { type: "month", value: val } });
    } else {
      this.setState({ filter: { type: "year", value: val } });
    }
  };

  // Custom styles for react-select
  customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      width: "100%",
      minHeight: "45px",
      padding: "0",
      fontSize: "14px",
      borderColor: state.isFocused ? "#36565f" : "#5f8190",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(0, 0, 0, 0.1)" : "none",
      "&:hover": {
        borderColor: "#36565f",
      },
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: "#ffffff",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#5f8190"
        : state.isFocused
          ? "#5f8190" // This is your custom hover color - BLACK
          : "#ffffff",
      color: state.isSelected || state.isFocused ? "#ffffff" : "#1e293b",
      padding: "12px 20px",
      fontSize: "14px",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#36565f",
        color: "white",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      zIndex: 1000,
      marginTop: "4px",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "0",
      borderRadius: "8px",
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: "#f1f1f1",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "#717272",
        borderRadius: "4px",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1e293b",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: "#64748b",
      transition: "all 0.2s ease",
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
      "&:hover": {
        color: "#36565f",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 12px",
    }),
  };

  render() {
    const { labels, chartData, filter } = this.state;

    const data = {
      labels: labels.length ? labels : ["No data"],
      datasets: [
        {
          label: "Job Posts",
          data: chartData.length ? chartData : [0],
          borderColor: "#1967d2",
          backgroundColor: "#1967d2",
          fill: false,
          tension: 0.4,
        },
      ],
    };

    // Find the currently selected option
    const selectedOption = this.selectOptions.find(
      (opt) => opt.value === String(filter.value),
    );

    return (
      <Card className="tabs-box rounded-5 overflow-auto">
        <CardHeader
          className="widget-title text-white mb-2 hover shadow-sm"
          style={{ background: "#5f8190" }}
        >
          <h5 className="fw-semibold p-2 m-2 hover">Job Posts Analytics</h5>
        </CardHeader>

        <CardBody>
          <div className="chosen-outer mb-3 p-2 tabs-box">
            <Select
              options={this.selectOptions}
              styles={this.customSelectStyles}
              value={selectedOption}
              onChange={this.handleFilterChange}
              placeholder="Select time period..."
              isSearchable={false}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#36565f",
                  primary25: "#36565f", // Hover color
                  primary50: "#1a1a1a",
                  primary75: "#36565f",
                },
              })}
            />
          </div>

          <div className="widget-content mt-2">
            <Line options={options} data={data} />
          </div>
        </CardBody>
      </Card>
    );
  }
}

export default ProfileChart;
