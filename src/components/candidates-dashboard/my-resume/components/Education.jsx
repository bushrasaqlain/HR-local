// import { useHistory } from 'react-router-dom';
import axios from "axios";
import { useState, useEffect, use } from "react";
import EducationForm from "./EducationForm";
import { toast } from "react-toastify";

const Education = ({ userId }) => {
  const [educationData, setEducationData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false); // State to control the visibility of the form modal
  const [editEducationId, setEditEducationId] = useState(null);
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

  const handleAddEducationClick = () => {
    setShowFormModal(true);
  };

  const handleEditEducationClick = (educationId) => {
    setEditEducationId(educationId);
    setIsEditMode(true);
    setShowFormModal(true);
  };
  
  const handleDeleteEducationClick = async (educationId) => {
    try {
      // Your DELETE API endpoint for deleting education
      const apiUrl = `http://localhost:8080/education/delete/${educationId}`;

      const response = await axios.delete(apiUrl);

      if (response.status === 200) {
        // Remove the deleted record from the state
        setEducationData((prevData) =>
          prevData.filter((education) => education.id !== educationId)
        );
        toast.success("Education record deleted successfully!");
      } else {
        console.error(
          "Failed to delete education record:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to delete education record. Please try again.");
    }
  };
  useEffect(() => {
    // Your API endpoint for fetching education data
    const apiUrl = `http://localhost:8080/education/${userId}`;

    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);
        if (response.status === 200) {
          setEducationData(response.data);
        } else {
          console.error("Failed to fetch education data:", response.statusText);
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    };

    fetchData();
  }, [userId]);


  return (
    <>
      {/* <div className="resume-outer">
      <div className="upper-title">
        <h4>Education</h4>
        <button className="add-info-btn" onClick={handleAddEducationClick}>
          <span className="icon flaticon-plus"></span> Add Aducation
        </button>
      </div>
      
      <div className="resume-block">
        <div className="inner">
          <span className="name">M</span>
          <div className="title-box">
            <div className="info-box">
              <h3>Bachlors in Fine Arts</h3>
              <span>Modern College</span>
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
      </div>

      
      <div className="resume-block">
        <div className="inner">
          <span className="name">H</span>
          <div className="title-box">
            <div className="info-box">
              <h3>Computer Science</h3>
              <span>Harvard University</span>
            </div>
            <div className="edit-box">
              <span className="year">2008 - 2012</span>
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
      </div>
    </div> */}

      <div className="resume-outer">
        <div className="upper-title">
          <h4>Education</h4>
          <button className="add-info-btn" onClick={handleAddEducationClick}>
            <span className="icon flaticon-plus"></span>Add Education
          </button>
        </div>

        {educationData.map((education) => (
          <div key={education.id} className="resume-block">
            <div className="inner">
              <span className="name">{education.institute_name[0]}</span>
              <div className="title-box">
                <div className="info-box">
                  <h3>{education.degree_title} - {education.field_of_study}</h3>
                  <span>{education.institute_name}</span>
                </div>
                <div className="edit-box">
                  <span className="year">{new Date(education.start_date).toLocaleDateString("en-GB")} - {education.end_date !== null ? new Date(education.end_date).toLocaleDateString("en-GB") : "Present"}</span>
                  <div className="edit-btns">
                    <button
                      onClick={() => handleEditEducationClick(education.id)}
                    >
                      <span className="la la-pencil"></span>
                    </button>
                    <button
                      onClick={() => handleDeleteEducationClick(education.id)}
                    >
                      <span className="la la-trash"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="text">{education.education_description}</div>
            </div>
          </div>
        ))}

        {showFormModal && (
          <EducationForm
            userId={userId}
            educationId={editEducationId}   // null for add, id for edit
            isEditMode={isEditMode}         // clearer prop name
            setEducationData={setEducationData}
            onClose={() => {
              setShowFormModal(false);
              setEditEducationId(null);     // reset for next open
              setIsEditMode(false);
            }}
          />
        )}

        {/* Modal for Education Form */}
        {/* {showFormModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={handleCloseFormModal}>
                &times;
              </span>
              <EducationForm userId={userId} />
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

export default Education;
