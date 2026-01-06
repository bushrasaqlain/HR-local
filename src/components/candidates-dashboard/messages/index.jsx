"use client"
import BreadCrumb from "../../BreadCrumb";
import ChatBox from "../../messagesComponents";
import { useSelector } from "react-redux";

const Index = () => {
  const { chatSidebar } = useSelector((state) => state.toggle);

  return (
      <section className="user-dashboard">
        <div className="dashboard-outer">
          <BreadCrumb />
          {/* breadCrumb */}

          {/* <MenuToggler /> */}
          {/* Collapsible sidebar button */}

          <div className="row">
            <div
              className={`col-lg-12 ${
                chatSidebar ? "active-chat-contacts" : ""
              }`}
            >
              <div className="chat-widget">
                <div className="widget-content">
                  <ChatBox />
                </div>
              </div>
              {/* <!-- Chat Widget --> */}
            </div>
          </div>
          {/* End row */}
        </div>
        {/* End dashboard-outer */}
      </section>
  );
};

export default Index;
