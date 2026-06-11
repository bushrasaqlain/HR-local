"use client";
import React, { Component } from "react";
import Head from "next/head";
import DashboardHome from "./DashboardHome";

class Profile extends Component {
  render() {
    return (
      <>
        <Head>
          <title>Company Dashboard</title>
        </Head>
        <section className="user-dashboard">
          <div className="dashboard-outer">
            <DashboardHome
              onTabChange={this.props.onTabChange}
              activeTab={this.props.activeTab}
            />
          </div>
        </section>
      </>
    );
  }
}

export default Profile;