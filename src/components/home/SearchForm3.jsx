"use client";

import { useRouter } from "next/navigation";

const SearchForm3 = () => {
  const router = useRouter(); // get the router instance

  const handleSubmit = (event) => {
    event.preventDefault();
    router.push("/job-list/job-list-v5"); // navigate programmatically
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        {/* <!-- Form Group --> */}
        <div className="form-group col-lg-4 col-md-12 col-sm-12">
          <span className="icon flaticon-search-1"></span>
          <input
            type="text"
            name="field_name"
            placeholder="Job title, keywords, or company"
          />
        </div>

        {/* <!-- Form Group --> */}
        <div className="form-group col-lg-3 col-md-12 col-sm-12 location">
          <span className="icon flaticon-map-locator"></span>
          <input type="text" name="field_name" placeholder="City or postcode" />
        </div>

        {/* <!-- Form Group --> */}
        <div className="form-group col-lg-3 col-md-12 col-sm-12 category">
          <span className="icon flaticon-briefcase"></span>
          <select className="chosen-single form-select">
            <option value="">All Categories</option>
            <option value="44">Accounting / Finance</option>
            <option value="106">Automotive Jobs</option>
            <option value="46">Customer</option>
            <option value="48">Design</option>
            <option value="47">Development</option>
            <option value="45">Health and Care</option>
            <option value="105">Marketing</option>
            <option value="107">Project Management</option>
          </select>
        </div>

        {/* <!-- Form Group --> */}
        <div className="form-group col-lg-2 col-md-12 col-sm-12 text-right">
          <button type="submit" className="theme-btn btn-style-one">
            Find Jobs
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm3;
