// "use client";
import React from "react";
import ProfileChart from "./ProfileChart";
import Head from "next/head";

const Profile = () => {
  return (
    <>
      <Head>
        <title>Company Profile</title>
      </Head>

      <section className="user-dashboard">
        <div className="dashboard-outer">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="graph-widget ls-widget">
                <ProfileChart />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
