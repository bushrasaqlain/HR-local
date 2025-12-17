// import Breadcrumb from "../../common/Breadcrumb";
import FaqChild from "./FaqChild";

const index = () => {
  return (
    <>
      {/* <Breadcrumb title="Faq's" meta="Faq's" /> */}
      {/* <!--End Page Title--> */}

      <section className="faqs-section mt-5">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Frequently Asked Questions</h2>
            <div className="text">Home / Faq</div>
          </div>

          <h3>Payments</h3>
          {/* <!--Accordian Box--> */}
          <ul className="accordion-box">
            <FaqChild />
          </ul>

          <h3>Suggestions</h3>
          {/* <!--Accordian Box--> */}
          <ul className="accordion-box mb-0">
            <FaqChild />
          </ul>
        </div>
      </section>
      {/* <!-- End Faqs Section --> */}
    </>
  );
};

export default index;
