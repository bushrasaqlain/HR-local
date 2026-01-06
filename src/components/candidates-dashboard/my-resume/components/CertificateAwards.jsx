// import { useHistory } from 'react-router-dom';
import axios from "axios";
import { useState, useEffect } from "react";
import CertificateAwardsForm from "./CertificateAwardsForm";
import { toast } from "react-toastify";

const CertificateAwards = ({ userId, awards, setAwards }) => {

  const [certificateAwardsData, setCertificateAwardsData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editAwardId, setEditAwardId] = useState(null);
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


  const handleAddCertificateAwardsClick = () => {
    setShowFormModal(true);
  };

  const handleEditCertificateAwardsClick = (certificateAwardsId) => {
    setEditAwardId(certificateAwardsId);
    setIsEditMode(true);
    setShowFormModal(true);
  };
  const handleDeleteCertificateAwardsClick = async (certificateAwardsId) => {
    try {
      // Your DELETE API endpoint for deleting certificateAwards
      const apiUrl = `http://localhost:8080/certificateAwards/delete/${certificateAwardsId}`;

      const response = await axios.delete(apiUrl);

      if (response.status === 200) {
        // Remove the deleted record from the state
        setCertificateAwardsData((prevData) =>
          prevData.filter((certificateAward) => certificateAward.id !== certificateAwardsId)
        );
        toast.success("CertificateAwards record deleted successfully!");
      } else {
        console.error(
          "Failed to delete certificateAwards record:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to delete certificateAwards record. Please try again.");
    }
  };
  useEffect(() => {
    // Your API endpoint for fetching certificateAwards data
    const apiUrl = `http://localhost:8080/certificateAwards/${userId}`;

    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);
        if (response.status === 200) {
          setCertificateAwardsData(response.data);
          setAwards(response.data); // Update the parent component's state
        } else {
          console.error("Failed to fetch certificateAwards data:", response.statusText);
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <>

      <div className="resume-outer theme-yellow">
        <div className="upper-title">
          <h4>Certification & Awards</h4>
          <button className="add-info-btn" onClick={handleAddCertificateAwardsClick}>
            <span className="icon flaticon-plus"></span>Add Certification & Awards
          </button>
        </div>

        {certificateAwardsData.map((certificateAward) => (
          <div key={certificateAward.id} className="resume-block">
            <div className="inner">
              <span className="name">{certificateAward.institute_name[0]}</span>
              <div className="title-box">
                <div className="info-box">
                  <h3>{certificateAward.title}</h3>
                  <span>{certificateAward.institute_name}</span>
                </div>
                <div className="edit-box">
                  <span className="year">{certificateAward.passing_year}</span>
                  <div className="edit-btns">
                    <button
                      onClick={() => handleEditCertificateAwardsClick(certificateAward.id)}
                    >
                      <span className="la la-pencil"></span>
                    </button>
                    <button
                      onClick={() => handleDeleteCertificateAwardsClick(certificateAward.id)}
                    >
                      <span className="la la-trash"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="text">{certificateAward.description}</div>
            </div>
          </div>
        ))}

        {showFormModal && (
          <CertificateAwardsForm
            userId={userId}
            certificateAwardsId={editAwardId}   // null for add, id for edit
            isEditMode={isEditMode}         // clearer prop name
            setCertificateAwardsData={setCertificateAwardsData}
            onClose={() => {
              setShowFormModal(false);
              setEditAwardId(null);     // reset for next open
              setIsEditMode(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default CertificateAwards;
