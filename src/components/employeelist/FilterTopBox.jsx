import Link from "next/link";
import ListingShowing from "../common/ListingShowing";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  addDestination,
  addFoundationDate,
  addKeyword,
  addLocation,
  addPerPage,
  addSort,
} from "../../redux/features/filter/employerFilterSlice";
import Image from "next/image";

const FilterTopBox = () => {
  const [companies, setCompanies] = useState([]);
 const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  useEffect(() => {
    // Fetch data from the API when the component mounts
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}employers`); // Change the URL to your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();

         
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData(); // Call the fetchData function
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const {
    keyword,
    location,
    destination,
    category,
    foundationDate,
    sort,
    perPage,
  } = useSelector((state) => state.employerFilter) || {};
  const dispatch = useDispatch();

  // keyword filter
  const keywordFilter = (item) =>
    keyword !== ""
      ? item?.name?.toLowerCase().includes(keyword?.toLowerCase()) && item
      : item;

  // location filter
  const locationFilter = (item) =>
    location !== ""
      ? item?.location?.toLowerCase().includes(location?.toLowerCase())
      : item;

  // destination filter
  const destinationFilter = (item) =>
    item?.destination?.min >= destination?.min &&
    item?.destination?.max <= destination?.max;

  // category filter
  const categoryFilter = (item) =>
    category !== ""
      ? item?.category?.toLocaleLowerCase() === category?.toLocaleLowerCase()
      : item;

  // foundation date filter
  const foundationDataFilter = (item) =>
    item?.foundationDate?.min >= foundationDate?.min &&
    item?.foundationDate?.max <= foundationDate?.max;

  // sort filter
  const sortFilter = (a, b) =>
    sort === "des" ? a.id > b.id && -1 : a.id < b.id && -1;

    let content = (
      <>
        {companies.map((company) => (
          <div className="company-block-three" key={company.id}>
            <div className="inner-box">
              <div className="content">
                <div className="content-inner">
                  <span className="company-logo">
                    {/* Display the image from base64 data */}
                    <Image
                      width={50}
                      height={50}
                      src={`data:image/jpeg;base64,${company.Image}`}
                      alt="company brand"
                    />
                  </span>
                  <h4>
                    <Link href={`/employers-single-v1/${company.id}`}>
                      {company.fullName}
                    </Link>
                  </h4>
                  <ul className="job-info">
                    <li>
                      <span className="icon flaticon-map-locator"></span>{" "}
                      {company.completeAddress}
                    </li>
                    <li>
                      <span className="icon flaticon-briefcase"></span>{" "}
                      {company.department}
                    </li>
                  </ul>
                </div>
    
                <ul className="job-other-info">
                  {company.isFeatured ? (
                    <li className="privacy">Featured</li>
                  ) : (
                    ""
                  )}
    
                  <li className="time">Open Jobs – {company.jobNumber}</li>
                </ul>
              </div>
    
              <div className="text">{company.jobDetails}</div>
    
              <button className="bookmark-btn">
                <span className="flaticon-bookmark"></span>
              </button>
            </div>
          </div>
        ))}
      </>
    );
    

  // per page handler
  const perPageHandler = (e) => {
    const pageData = JSON.parse(e.target.value);
    dispatch(addPerPage(pageData));
  };

  // sort handler
  const sortHandler = (e) => {
    dispatch(addSort(e.target.value));
  };

  // clear handler
  const clearAll = () => {
    dispatch(addKeyword(""));
    dispatch(addLocation(""));
    dispatch(addDestination({ min: 0, max: 100 }));
    dispatch(addCategory(""));
    dispatch(addFoundationDate({ min: 1900, max: 2028 }));
    dispatch(addSort(""));
    dispatch(addPerPage({ start: 0, end: 0 }));
  };

  return (
    <>
      <div className="ls-switcher">
        <div className="showing-result">
          <div className="text">
            <strong>{content?.length}</strong> jobs
          </div>
        </div>
        {/* End showing-result */}

        <div className="sort-by">
          {keyword !== "" ||
          location !== "" ||
          destination.min !== 0 ||
          destination.max !== 100 ||
          category !== "" ||
          foundationDate.min !== 1900 ||
          foundationDate.max !== 2028 ||
          sort !== "" ||
          perPage.start !== 0 ||
          perPage.end !== 0 ? (
            <button
              onClick={clearAll}
              className="btn btn-danger text-nowrap me-2"
              style={{
                minHeight: "45px",
                marginBottom: "15px",
              }}
            >
              Clear All
            </button>
          ) : undefined}

          <select
            value={sort}
            className="chosen-single form-select"
            onChange={sortHandler}
          >
            <option value="">Sort by (default)</option>
            <option value="asc">Newest</option>
            <option value="des">Oldest</option>
          </select>
          {/* End select */}

          <select
            onChange={perPageHandler}
            className="chosen-single form-select ms-3 "
            value={JSON.stringify(perPage)}
          >
            <option
              value={JSON.stringify({
                start: 0,
                end: 0,
              })}
            >
              All
            </option>
            <option
              value={JSON.stringify({
                start: 0,
                end: 10,
              })}
            >
              10 per page
            </option>
            <option
              value={JSON.stringify({
                start: 0,
                end: 20,
              })}
            >
              20 per page
            </option>
            <option
              value={JSON.stringify({
                start: 0,
                end: 24,
              })}
            >
              24 per page
            </option>
          </select>
          {/* End select */}
        </div>
      </div>
      {/* End top filter bar box */}

      {content}

      <ListingShowing />
      {/* <!-- Listing Show More --> */}
    </>
  );
};

export default FilterTopBox;
// export default FilterTopBox;
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import ListingShowing from "../components/ListingShowing";
// import { useDispatch, useSelector } from "react-redux";
// import Image from "next/image";

// const FilterTopBox = () => {
  // const [companies, setCompanies] = useState([]);

  // useEffect(() => {
  //   // Fetch data from the API when the component mounts
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch("http://localhost:8080/employers"); // Change the URL to your API endpoint
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch data");
  //       }
  //       const data = await response.json();
  //       setCompanies(data);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };

  //   fetchData(); // Call the fetchData function
  // }, []); // Empty dependency array ensures this effect runs only once on mount

//   return (
//     <>
//       <div className="ls-switcher">
//         {/* Map over the companies array to render each company */}
//         {companies.map((company) => (
//           <div className="company-block-three" key={company.id}>
//             <div className="inner-box">
//               <div className="content">
//                 <div className="content-inner">
//                   <span className="company-logo">
//                     {/* Display the image from base64 data */}
//                     <Image
//                       width={50}
//                       height={50}
//                       src={`data:image/jpeg;base64,${company.Image}`}
//                       alt="company brand"
//                     />
//                   </span>
//                   <h4>
//                     <Link href={`/employers-single-v1/${company.id}`}>
//                       {company.fullName}
//                     </Link>
//                   </h4>
//                   <ul className="job-info">
//                     <li>
//                       <span className="icon flaticon-map-locator"></span>{" "}
//                       {company.completeAddress}
//                     </li>
//                     <li>
//                       <span className="icon flaticon-briefcase"></span>{" "}
//                       {company.department}
//                     </li>
//                   </ul>
//                 </div>

//                 <ul className="job-other-info">
//                   {company.isFeatured ? (
//                     <li className="privacy">Featured</li>
//                   ) : (
//                     ""
//                   )}

//                   <li className="time">Open Jobs – {company.jobNumber}</li>
//                 </ul>
//               </div>

//               <div className="text">{company.jobDetails}</div>

//               <button className="bookmark-btn">
//                 <span className="flaticon-bookmark"></span>
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//       {/* End top filter bar box */}

//       <ListingShowing />
//       {/* <!-- Listing Show More --> */}
//     </>
//   );
// };

// export default FilterTopBox;
