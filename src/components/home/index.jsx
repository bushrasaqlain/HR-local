import JobFilterTab from "./JobFilterTab";
import Block2 from "./Block2";
import TopCompany from "./TopCompany";
import Partner from "./Partner";
import Hero4 from "./hero";
import Link from "next/link";
import {
  FaUserCheck,
  FaSearch,
  FaCheckCircle,
  FaComments,
  FaBriefcase,
  FaUsers,
  FaFilter,
  FaCalendarCheck,
} from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";


const index = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <>
      <Hero4 />

      {/* <!-- End Job Section --> */}

      {/* <section className="process-section pt-0"> */}
      <section className="process-section"
      style={{background: "#e2f0f0"}}>
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
      <section className="stats-section text-white"
      style={{background: "#f4f7f8", color: "#fff"}}>
        <div className="auto-container text-white">
          <div className="fw-bold sec-title text-center text-white">
            <h2>Who are Our Candidates?</h2>
            <div className="fw-semibold text-black">Exceptional Candidates</div>
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
            <h2 className="fw-bold">
              Company We've Helped
            </h2>
            <div className="text">
              Some of the employers we have helped recruit excellent applicants
              over the years.
            </div>
          </div>

          <div className="carousel-outer" >
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

<section className="how-it-works-section py-5" style={{ background: "#f4f7f8" }}>
  <div className="auto-container">
    <div className="sec-title text-center mb-5" data-aos="fade-up">
      <h2 className="fw-bold" style={{ color: "#121a1d" }}>
        Getting Started Is Simple
      </h2>
      <div className="text fw-semibold">
        Whether you're looking for work or looking to hire, here's how it works.
      </div>
    </div>

    <div className="row g-4">
      {/* Candidates path */}
      <div className="col-md-6" data-aos="fade-right">
        <div
          className="h-100 p-4 p-lg-5 rounded-4"
          style={{ background: "#fff", border: "1px solid #e2e8ea", boxShadow: "0 4px 20px rgba(18,26,29,0.06)" }}
        >
          <span className="small-text fw-semibold" style={{ color: "#36565f" }}>
            For Candidates
          </span>
          <h3 className="fw-bold mt-2 mb-4" style={{ color: "#121a1d" }}>
            Find Your Next Role
          </h3>

          {[
            { step: "01", text: "Create your profile and get approved by our team." },
            { step: "02", text: "Browse jobs matched to your skills and experience." },
            { step: "03", text: "Apply and track your status in real time." },
            { step: "04", text: "Message employers directly and schedule interviews." },
          ].map(({ step, text }, i) => (
            <div
              className="d-flex align-items-start gap-3 mb-3"
              key={i}
              data-aos="fade-up"
              data-aos-delay={100 * (i + 1)}
            >
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle fw-bold"
                style={{ width: 42, height: 42, background: "#e2f0f0", color: "#36565f" }}
              >
                {step}
              </div>
              <p className="mb-0 pt-2" style={{ color: "#3a4448" }}>{text}</p>
            </div>
          ))}

          <div className="mt-4">
            <Link href="/register" className="btn text-white rounded-pill px-4" style={{ background: "#36565f" }}>
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Employers path */}
      <div className="col-md-6" data-aos="fade-left">
        <div
          className="h-100 p-4 p-lg-5 rounded-4 text-white"
          style={{ background: "#36565f", boxShadow: "0 4px 20px rgba(18,26,29,0.15)" }}
        >
          <span className="small-text fw-semibold" style={{ color: "#c5dbe0" }}>
            For Employers
          </span>
          <h3 className="fw-bold mt-2 mb-4">Hire With Confidence</h3>

          {[
            { step: "01", text: "Sign up and choose a job posting package." },
            { step: "02", text: "Post your job with the exact requirements you need." },
            { step: "03", text: "Filter and shortlist from verified candidates." },
            { step: "04", text: "Schedule interviews and manage hiring in one place." },
          ].map(({ step, text }, i) => (
            <div
              className="d-flex align-items-start gap-3 mb-3"
              key={i}
              data-aos="fade-up"
              data-aos-delay={100 * (i + 1)}
            >
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle fw-bold"
                style={{ width: 42, height: 42, background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                {step}
              </div>
              <p className="mb-0 pt-2 text-white">{text}</p>
            </div>
          ))}

          <div className="mt-4">
            <Link href="/register" className="btn text-white rounded-pill px-4" style={{ background: "#121a1d" }}>
              Post a Job
            </Link>
          </div>
        </div>
      </div>
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
