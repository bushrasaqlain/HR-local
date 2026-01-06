import Categories from "../common/Categories";
import DestinationRangeSlider from "../common/DestinationRangeSlider";
import CandidatesGender from "../common/CandidatesGender";
import LocationBox from "../common/LocationBox";
import SearchBox from "../common/SearchBox";
import DatePosted from "../common/DatePosted";
import Experience from "../common/Experience";
import Qualification from "../common/Qualification";

const FilterSidebar = () => {
    return (
        <div className="inner-column pd-right">
            <div className="filters-outer">
                <button
                    type="button"
                    className="btn-close text-reset close-filters show-1023"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                ></button>
                {/* End .close filter */}

                <div className="filter-block">
                    <h4>Search by Keywords</h4>
                    <div className="form-group">
                        <SearchBox />
                    </div>
                </div>
                {/* <!-- Filter Block --> */}

                <div className="filter-block">
                    <h4>Location</h4>
                    <div className="form-group">
                        <LocationBox />
                    </div>

                    <p>Radius around selected destination</p>
                    <DestinationRangeSlider />
                </div>
                {/* <!-- Filter Block --> */}

                <div className="filter-block">
                    <h4>Category</h4>
                    <div className="form-group">
                        <Categories />
                    </div>
                </div>
                {/* <!-- Filter Block --> */}

                <div className="filter-block">
                    <h4>Candidate Gender</h4>
                    <div className="form-group">
                        <CandidatesGender />
                    </div>
                </div>
                {/* <!-- Filter Block --> */}

                <div className="checkbox-outer">
                    <h4>Date Posted</h4>
                    <DatePosted />
                </div>
                {/* <!-- Filter Block --> */}

                <div className="checkbox-outer">
                    <h4>Experience</h4>
                    <Experience />
                </div>
                {/* <!-- Filter Block --> */}

                <div className=" checkbox-outer">
                    <h4>Qualification</h4>
                    <Qualification />
                </div>
                {/* <!-- Filter Block --> */}
            </div>
            {/* Filter Outer */}
        </div>
    );
};

export default FilterSidebar;
