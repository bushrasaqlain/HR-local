import SearchForm3 from "./SearchForm3";
import PopularSearch from "./PopularSearch";

const Hero = () => {
  return (

    <section
      className="banner-section-four"
      style={{ backgroundImage: "url(/images/background/2.png)" }}
    >

      <div className="auto-container">
        <div className="cotnent-box">
          <div className="title-box" data-aso-delay="500" data-aos="fade-up">
            <h3>The Easiest Way to Get Your New Job</h3>
          </div>

          {/* <!-- Job Search Form --> */}
          <div
            className="job-search-form"
            data-aos-delay="700"
            data-aos="fade-up"
          >
            <SearchForm3 btnStyle="btn-style-two" />
          </div>
        </div>
        {/* <!-- Job Search Form --> */}

        {/* <!-- Popular Search --> */}
        <PopularSearch />
        {/* <!-- End Popular Search --> */}
      </div>
    </section>
  );
};

export default Hero;
