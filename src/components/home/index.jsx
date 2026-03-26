import JobFilterTab from "./JobFilterTab";
import Block2 from "./Block2";
import TopCompany from "./TopCompany";
import Partner from "./Partner";
import Hero4 from "./hero";
import Link from "next/link";

const index = () => {
  return (
    <>
      <Hero4 />

      {/* <!-- End Job Section --> */}

      {/* <section className="process-section pt-0"> */}
      <section className="process-section bg-light">
        <div className="auto-container">
          <div className="fw-bold sec-title text-center">
            <h2>How Does It Works?</h2>
            <div className="fw-semibold">
              Partner with us to access elite talent and foster diversity that
              drives success.
            </div>
          </div>

          <div className="row justify-content-center" data-aos="fade-up">
            <Block2 />
          </div>
        </div>
      </section>
      {/* <!-- End Process Section --> */}
      <section className="stats-section">
        <div className="auto-container">
          <div className="fw-bold sec-title text-center">
            <h2>Who are Our Candidates?</h2>
            <div className="fw-semibold">Exceptional Candidates</div>
          </div>
          {/* End sec-title */}

          <div className="row text-center">
            <div data-aos="fade-up">
              <JobFilterTab />
            </div>
          </div>
          {/* End .default-tabs */}
        </div>
      </section>
      <section className="top-employers">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2 className="fw-bold text-white">
              Your Gateway to Top Employers
            </h2>
            <div className="text text-white">
              Some of the employers we have helped recruit excellent applicants
              over the years.
            </div>
          </div>

          <div className="carousel-outer" data-aos="fade-up">
            <div className="row justify-content-center align-items-center">
              <TopCompany />
            </div>
            <div className="text-center mt-4">
              <Link href="/companies">
                <button className="show-all-btn">
                  Show All Companies
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- End Top Companies --> */}

      <section className="top-companies style-two">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Popular Job Categories</h2>
            <div className="text">2020 jobs live - 293 added today.</div>
          </div>

          <div
            className="row "
            data-aos="fade-up"
            data-aos-anchor-placement="top-bottom"
          >
            {/* <!-- Category Block --> */}
            {/* <JobCategorie1 /> */}
          </div>
        </div>
      </section>
      {/* End Job Categorie Section */}

      {/* <section className="news-section style-two">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Recent News Articles</h2>
            <div className="text">
              Fresh job related news content posted each day.
            </div>
          </div>
          <div className="row" data-aos="fade-up">
            <Blog />
          </div>
        </div>
      </section> */}
      {/* <!-- End News Section --> */}

      {/* <section className="clients-section alternate">
        <div className="sponsors-outer" data-aos="fade">
          <ul className="sponsors-carousel">
            <Partner />
          </ul>
        </div>
      </section> */}
    </>
  );
};

export default index;
