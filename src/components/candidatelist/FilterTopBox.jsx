import Link from "next/link";
import Pagination from "../common/pagination";
import { useDispatch, useSelector } from "react-redux";
import {
  addCandidateGender,
  addCategory,
  addDatePost,
  addDestination,
  addKeyword,
  addLocation,
  addPerPage,
  addSort,
  clearExperienceF,
  clearQualificationF,
} from "../../redux/features/filter/candidateFilterSlice";
// import {
//   clearDatePost,
//   clearExperience,
//   clearQualification,
// } from "../../redux/features/candidate/candidateSlice";
import Image from "next/image";
import { useEffect, useState } from "react";

const FilterTopBox = () => {
  const [candidatesData, setCandidatesData] = useState([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiBaseUrl}candidateProfile`)
      .then((res) => res.json())
      .then((data) => {
        // Convert buffer image to base64 if present
        const formattedData = data.map((item) => ({
          ...item,
          avatar: item.Image
            ? `data:image/jpeg;base64,${Buffer.from(item.Image.data).toString("base64")}`
            : "/default-avatar.png", // fallback image
        }));
        setCandidatesData(formattedData);
      })
      .catch((err) => console.error(err));
  }, []);

  const {
    keyword,
    location,
    destination,
    category,
    candidateGender,
    datePost,
    experiences,
    qualifications,
    sort,
    perPage,
  } = useSelector((state) => state.candidateFilter) || {};

  const dispatch = useDispatch();

  // Filters
  const keywordFilter = (item) =>
    keyword ? item.full_name?.toLowerCase().includes(keyword?.toLowerCase()) : true;

  const locationFilter = (item) =>
    location ? item.city?.toLowerCase().includes(location?.toLowerCase()) : true;

  const categoryFilter = (item) =>
    category ? item.department?.toLowerCase() === category?.toLowerCase() : true;

  const genderFilter = (item) =>
    candidateGender ? item.gender?.toLowerCase() === candidateGender?.toLowerCase() : true;

  const datePostedFilter = (item) =>
    datePost && datePost !== "all"
      ? item.current_date_time?.includes(datePost)
      : true;

  // Sorting
  const sortFilter = (a, b) =>
    sort === "des" ? b.id - a.id : a.id - b.id;

  const content = candidatesData
    ?.slice(perPage?.start || 0, perPage?.end || candidatesData.length)
    ?.filter(keywordFilter)
    ?.filter(locationFilter)
    ?.filter(categoryFilter)
    ?.filter(genderFilter)
    ?.filter(datePostedFilter)
    ?.sort(sortFilter)
    ?.map((candidate) => (
      <div className="candidate-block-four col-lg-6 col-md-6 col-sm-12" key={candidate.id}>
        <div className="inner-box">
          <ul className="job-other-info">
            <li className="green">Featured</li>
          </ul>

          <span className="thumb">
            <Image width={90} height={90} src={candidate.avatar} alt={candidate.full_name} />
          </span>

          <h3 className="name">
            <Link href={`/candidates-single-v3/${candidate.id}`}>
              {candidate.full_name}
            </Link>
          </h3>
          <span className="cat">{candidate.department || "N/A"}</span>

          <ul className="job-info">
            <li>
              <span className="icon flaticon-map-locator"></span>{" "}
              {candidate.location || "N/A"}
            </li>
            <li>
              <span className="icon flaticon-mail"></span>{" "}
              {candidate.email || "N/A"}
            </li>
          </ul>

          <Link
            href={`/candidates-single-v3/${candidate.id}`}
            className="theme-btn btn-style-three"
          >
            View Profile
          </Link>
        </div>
      </div>
    ));

  const sortHandler = (e) => dispatch(addSort(e.target.value));
  const perPageHandler = (e) => dispatch(addPerPage(JSON.parse(e.target.value)));

  const clearHandler = () => {
    dispatch(addKeyword(""));
    dispatch(addLocation(""));
    dispatch(addDestination({ min: 0, max: 100 }));
    dispatch(addCategory(""));
    dispatch(addCandidateGender(""));
    dispatch(addDatePost(""));
    // dispatch(clearDatePost());
    dispatch(clearExperienceF());
    // dispatch(clearExperience());
    // dispatch(clearQualification());
    dispatch(clearQualificationF());
    dispatch(addSort(""));
    dispatch(addPerPage({ start: 0, end: 0 }));
  };

  return (
    <>
      <div className="ls-switcher">
        <div className="showing-result">
          <div className="show-1023">
            <button
              type="button"
              className="theme-btn toggle-filters"
              data-bs-toggle="offcanvas"
              data-bs-target="#filter-sidebar"
            >
              <span className="icon icon-filter"></span> Filter
            </button>
          </div>
          <div className="text">
            <strong>{content?.length}</strong> candidates
          </div>
        </div>

        <div className="sort-by">
          {(keyword || location || category || candidateGender || datePost || sort || (perPage?.start || perPage?.end)) && (
            <button className="btn btn-danger me-2" onClick={clearHandler}>
              Clear All
            </button>
          )}

          <select onChange={sortHandler} className="chosen-single form-select" value={sort}>
            <option value="">Sort by (default)</option>
            <option value="asc">Newest</option>
            <option value="des">Oldest</option>
          </select>

          <select
            className="chosen-single form-select ms-3"
            onChange={perPageHandler}
            value={JSON.stringify(perPage)}
          >
            <option value={JSON.stringify({ start: 0, end: 0 })}>All</option>
            <option value={JSON.stringify({ start: 0, end: 15 })}>15 per page</option>
            <option value={JSON.stringify({ start: 0, end: 20 })}>20 per page</option>
            <option value={JSON.stringify({ start: 0, end: 25 })}>25 per page</option>
          </select>
        </div>
      </div>

      <div className="row">{content}</div>
      <Pagination />
    </>
  );
};

export default FilterTopBox;
