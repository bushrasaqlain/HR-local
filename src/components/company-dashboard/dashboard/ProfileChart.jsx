"use client";
import React, { Component } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.setState({
        labels: res.data.labels,
        chartData: res.data.data,
      });
    } catch (error) {
      console.error("Chart API error", error);
    }
  };

  handleFilterChange = (e) => {
    const val = e.target.value;
    if (val === "6" || val === "12" || val === "24") {
      this.setState({ filter: { type: "month", value: parseInt(val) } });
    } else {
      this.setState({ filter: { type: "year", value: parseInt(val) } });
    }
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

    return (
      <div className="tabs-box">
        <div className="widget-title">
          <h4>Job Posts Analytics</h4>

          <div className="chosen-outer">
            <select
              className="chosen-single form-select"
              onChange={this.handleFilterChange}
              value={filter.value}
            >
              <option value="1">Last 1 Months</option>
              <option value="2">Last 2 Months</option>
              <option value="4">Last 4 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="8">Last 8 Months</option>
              <option value="10">Last 10 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
        </div>

        <div className="widget-content">
          <Line options={options} data={data} />
        </div>
      </div>
    );
  }
}

export default ProfileChart;
