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

      <section className="love-section">
        <div className="container">
          <div className="row"
          style={{background: "white"}}>

            {/* 🔷 LEFT SIDE - CANDIDATES */}
            <div className="col-md-6 love-box left-box" box-shadow data-aos="fade-right" style={{background: "#c1c9cc", color: "white"}}>
              <span className="small-text text-black">Looking for a Job?</span>
              <h2 className="text-black">Why Candidates Choose Us</h2>

              <div className="love-item" data-aos="fade-up" data-aos-delay="100">
                <FaUserCheck className="icon" />
                <p className="text-black">Easy registration with admin approval for secure access.</p>
              </div>

              <div className="love-item" data-aos="fade-up" data-aos-delay="100">
                <FaSearch className="icon" />
                <p className="text-black">Get matched with jobs based on your profile and skills.</p>
              </div>

              <div className="love-item" data-aos="fade-up" data-aos-delay="100">
                <FaCheckCircle className="icon" />
                <p className="text-black">Track shortlisted status and interview schedules easily.</p>
              </div>

              <div className="love-item" data-aos="fade-up" data-aos-delay="100">
                <FaComments className="icon" />
                <p className="text-black">Communicate directly with employers through messaging.</p>
              </div>

              <div className="btn">
                <Link href="/?page=about" className="btn-light">
                  Learn More
                </Link>

                <Link href="/?page=register" className="btn border-3 text-white " style={{background: "#121a1d"}}>
                  Sign Up
                </Link>
              </div>
            </div>

            {/* 🔷 RIGHT SIDE - EMPLOYERS */}
            <div className="col-md-6 love-box text-white right-box" data-aos="fade-left"
            style={{background: "#4f6168"}}>
              <span className="small-text text-white">Hiring Talent?</span>
              <h2>Why Employers Trust Us</h2>

              <div className="love-item" text-white data-aos="fade-up" data-aos-delay="100">
                <FaBriefcase className="icon" />
                <p className="text-white">Post jobs easily with flexible package options.</p>
              </div>

              <div className="love-item"  text-white data-aos="fade-up" data-aos-delay="100">
                <FaUsers className="icon" />
                <p className="text-white">Access a pool of verified and approved candidates.</p>
              </div>

              <div className="love-item"  text-white data-aos="fade-up" data-aos-delay="100">
                <FaFilter className="icon" />
                <p className="text-white">Filter and shortlist candidates based on job criteria.</p>
              </div>

              <div className="love-item" data-aos="fade-up" data-aos-delay="100">
                <FaCalendarCheck className="icon" />
                <p className="text-white">Schedule interviews and manage communication in one place.</p>
              </div>

              <div className="btns">
                <Link href="/?page=about" className="btn-light">
                  Learn More
                </Link>

                <Link href="/?page=register" className="btn border-3 text-white " style={{background: "#121a1d"}}>
                  Sign Up
                </Link>
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
