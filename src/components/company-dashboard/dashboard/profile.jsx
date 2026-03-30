import React, { useState } from "react";
import TopCardBlock from "./TopCardBlock";
import ProfileChart from "./ProfileChart";
import Notification from "./Notification";
import Applicants from "./Applicants";
import Head from "next/head";
import ChatBox from "../messages/chatBox";

const Profile = () => {

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const openChatFromNotification = (contact) => {
    setSelectedCandidate({
      account_id: contact.id,
      full_name: contact.full_name,
      jobId: contact.jobId,
    });
    setShowChat(true);
  };

  if (showChat && selectedCandidate) {
    return (
      <ChatBox
        selectedContactId={selectedCandidate.account_id}
        selectedContactName={selectedCandidate.full_name}
        selectedJobId={selectedCandidate.jobId}
        onBack={() => setShowChat(false)}
      />
    );
  }

  return (
    <>
      <Head>
        <title>Company Profile</title>
      </Head>

      <section className="user-dashboard">
        <div className="dashboard-outer">

          <div className="row">
            <div className="col-xl-7 col-lg-12">
              <div className="graph-widget ls-widget">
                <ProfileChart />
              </div>
            </div>

            <div className="col-xl-5 col-lg-12">
              <div className="notification-widget ls-widget">
                <div className="widget-content">
                  <Notification onSelectContact={openChatFromNotification} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;