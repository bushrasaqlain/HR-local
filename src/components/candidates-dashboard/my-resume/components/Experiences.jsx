import axios from "axios";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Experience from "./Work&ExperienceForm"

const Experiences = ({ userId, experiences, setExperiences }) => {

  const [workExperienceData, setWorkExperienceData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false); // State to control the visibility of the form modal
  const [editExperienceId, setEditExperienceId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

useEffect(() => {
  if (showFormModal) {
    document.body.style.overflow = "hidden";  // disable scroll
  } else {
    document.body.style.overflow = "auto";    // enable scroll again
  }

  return () => {
    document.body.style.overflow = "auto";    // cleanup just in case
  };
}, [showFormModal]);


  const handleEditClick = (experienceId) => {
    setEditExperienceId(experienceId);
    setIsEditMode(true);
    setShowFormModal(true);

  };

  const handleAddWorkClick = () => {
    setShowFormModal(true);


  };

  const handleDeleteClick = async (experienceId) => {
    try {
      // Your DELETE API endpoint for deleting work experience
      const apiUrl = `http://localhost:8080/work-experience/delete/${experienceId}`;

      const response = await axios.delete(apiUrl);

      if (response.status === 200) {
        // Remove the deleted record from the state
        setWorkExperienceData((prevData) =>
          prevData.filter((experience) => experience.id !== experienceId)
        );
        toast.success('Work experience deleted successfully!');
      } else {
        console.error('Failed to delete work experience:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error.message);
      toast.error('Failed to delete work experience. Please try again.');
    }
  };


  useEffect(() => {
    // Your API endpoint for fetching work experience data
    const apiUrl = `http://localhost:8080/work-experience/${userId}`;

    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);
        if (response.status === 200) {
          setWorkExperienceData(response.data);
          setExperiences(response.data) // Update the parent component's state
          // console.log("mmmmmmmmmmmm", workExperienceData)
        } else {
          console.error(
            "Failed to fetch work experience data:",
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="resume-outer theme-blue">
      <div className="upper-title">
        <h4>Work & Experience</h4>
        <button className="add-info-btn" onClick={handleAddWorkClick}>
          <span className="icon flaticon-plus"></span> Add Work
        </button>
      </div>
      {/* <!-- Resume BLock --> */}
      {/* <div className="resume-block">
        <div className="inner">
          <span className="name">S</span>
          <div className="title-box">
            <div className="info-box">
              <h3>Product Designer</h3>
              <span>Spotify Inc.</span>
            </div>
            <div className="edit-box">
              <span className="year">2012 - 2014</span>
              <div className="edit-btns">
                <button>
                  <span className="la la-pencil"></span>
                </button>
                <button>
                  <span className="la la-trash"></span>
                </button>
              </div>
            </div>
          </div>
          <div className="text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a
            ipsum tellus. Interdum et malesuada fames ac ante
            <br /> ipsum primis in faucibus.
          </div>
        </div>
      </div>  */}

      {workExperienceData.map((experience) => (
        // console.log("experience id: ", experience.id),
        <div key={experience.id} className="resume-block">
          <div className="inner">
            <span className="name">{experience.company_name[0]}</span>
            <div className="title-box">
              <div className="info-box">
                <h3>{experience.designation}</h3>
                <span>{experience.company_name}</span>
              </div>
              <div className="edit-box">
                <span className="year">{new Date(experience.start_date).toLocaleDateString("en-GB")} - {experience.end_date !== null ? new Date(experience.end_date).toLocaleDateString("en-GB") : "Present"}</span>
                <div className="edit-btns">
                  <button onClick={() => handleEditClick(experience.id)}>
                    <span className="la la-pencil"></span>
                  </button>
                  <button onClick={() => handleDeleteClick(experience.id)}>
                    <span className="la la-trash"></span>
                  </button>
                </div>
              </div>
            </div>
            <div className="text">{experience.description}</div>
          </div>
        </div>
      ))}

      {showFormModal && (
        <Experience
          userId={userId}
          experienceId={editExperienceId}   // null for add, id for edit
          isEditMode={isEditMode}         // clearer prop name
          setWorkExperienceData={setWorkExperienceData}
          onClose={() => {
            setShowFormModal(false);
            setEditExperienceId(null);     // reset for next open
            setIsEditMode(false);
          }}
        />
      )}

      {/* <!-- Resume BLock --> */}
      {/* <div className="resume-block">
        <div className="inner">
          <span className="name">D</span>
          <div className="title-box">
            <div className="info-box">
              <h3>Sr UX Engineer</h3>
              <span>Dropbox Inc.</span>
            </div>
            <div className="edit-box">
              <span className="year">2012 - 2014</span>
              <div className="edit-btns">
                <button>
                  <span className="la la-pencil"></span>
                </button>
                <button>
                  <span className="la la-trash"></span>
                </button>
              </div>
            </div>
          </div>
          <div className="text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a
            ipsum tellus. Interdum et malesuada fames ac ante
            <br /> ipsum primis in faucibus.
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Experiences;
