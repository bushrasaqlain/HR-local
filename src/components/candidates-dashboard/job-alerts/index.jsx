
import BreadCrumb from "../../BreadCrumb";
import JobAlertsTable from "./components/JobAlertsTable";

const index = () => {
  return (
      <section className="user-dashboard">
        <div className="dashboard-outer">
          <BreadCrumb />
          {/* breadCrumb */}

          {/* <MenuToggler /> */}
          {/* Collapsible sidebar button */}

          <div className="row">
            <div className="col-lg-12">
              {/* <!-- Ls widget --> */}
              <div className="ls-widget">
                <JobAlertsTable />
              </div>
            </div>
          </div>
          {/* End .row */}
        </div>
        {/* End dashboard-outer */}
      </section>
  );
};

export default index;
