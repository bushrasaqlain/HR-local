// import Breadcrumb from "../../common/Breadcrumb";
import Pricing from "./PricingContent";

const index = () => {
  return (
    <>

      {/* <Breadcrumb title="Pricing" meta="Pricing" /> */}
      {/* <!--End Page Title--> */}

      <section className="pricing-section">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Pricing Packages</h2>
            <div className="text">
              Lorem ipsum dolor sit amet elit, sed do eiusmod tempor.
            </div>
          </div>
          {/* End title */}
          <Pricing />
          {/* End .{/* <!--Pricing Tabs--> */}
        </div>
      </section>
      {/* <!-- End Pricing Section --> */}
    </>
  );
};

export default index;
