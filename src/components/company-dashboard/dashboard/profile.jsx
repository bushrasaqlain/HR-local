import TopCardBlock from "./TopCardBlock";
import ProfileChart from "./ProfileChart";
import Notification from "./Notification";
import Applicants from "./Applicants";
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
            <div className="col-xl-7 col-lg-12">
              {/* <!-- Graph widget --> */}
              <div className="graph-widget ls-widget">
                <ProfileChart />
              </div>
            </div>
            {/* End .col */}

            <div className="col-xl-5 col-lg-12">
              {/* <!-- Notification Widget --> */}
              <div className="notification-widget ls-widget">
                
                <div className="widget-content">
                  <Notification />
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
