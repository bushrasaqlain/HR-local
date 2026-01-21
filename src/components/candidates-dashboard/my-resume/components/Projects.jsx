// import { useHistory } from 'react-router-dom';
import axios from "axios";
import { useState, useEffect } from "react";
import Link from "next/link";
// import Link from "next/link";
import ProjectsForm from "./ProjectsForm";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
const Projects = ({ userId, projects, setProjects }) => {
  const [projectsData, setProjectsData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false); // State to control the visibility of the form modal
  const [editProjectId, setEditProjectId] = useState(null);
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


  const handleAddProjectsClick = () => {
    setShowFormModal(true);
  };

  const handleEditProjectsClick = (projectsId) => {
    setEditProjectId(projectsId);
    setIsEditMode(true);
    setShowFormModal(true);
  };
  const handleDeleteProjectsClick = async (projectsId) => {
    try {
      // Your DELETE API endpoint for deleting projects
      const apiUrl = `http://localhost:8080/projects/delete/${projectsId}`;

      const response = await axios.delete(apiUrl);

      if (response.status === 200) {
        // Remove the deleted record from the state
        setProjectsData((prevData) =>
          prevData.filter((project) => project.id !== projectsId)
        );
        toast.success("Project record deleted successfully!");
      } else {
        console.error(
          "Failed to delete project record:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Failed to delete project record. Please try again.");
    }
  };
  useEffect(() => {
    // Your API endpoint for fetching education data
    const apiUrl = `http://localhost:8080/projects/${userId}`;

    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl);
        if (response.status === 200) {
          setProjectsData(response.data);
          setProjects(response.data); // Update the parent component's state
        } else {
          console.error("Failed to fetch project data:", response.statusText);
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    };

    fetchData();
  }, [userId]);
  return (
    <>
      <div className="resume-outer theme-green">
        <div className="upper-title">
          <h4>Projects</h4>
          <button className="add-info-btn" onClick={handleAddProjectsClick}>
            <span className="icon flaticon-plus"></span>Add Project
          </button>
        </div>

        {projectsData.map((project) => (
          <div key={project.id} className="resume-block">
            <div className="inner">
              <span className="name">{project.role[0]}</span>
              <div className="title-box">
                <div className="info-box">
                  <h3>{project.project_title}</h3>
                  <span>{project.role}</span>
                </div>
                <div className="edit-box">
                  <div className="edit-btns">
                    <button
                      onClick={() => handleEditProjectsClick(project.id)}
                    >
                      <span className="la la-pencil"></span>
                    </button>
                    <button
                      onClick={() => handleDeleteProjectsClick(project.id)}
                    >
                      <span className="la la-trash"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                {project.skills_used.map((skill, index) => (
                  <span key={index} className="skills year me-2">{skill}</span>
                ))}
              </div>
              <div className="text mt-5 mb-2">{project.project_description}</div>
              {project.project_link && 
                <Link href={project.project_link} target="_blank" rel="noopener noreferrer" className="btn btn-success text-white">
                  Live Demo
                </Link>
              }
              
            </div>
          </div>
        ))}

        {showFormModal && (
          <ProjectsForm
            userId={userId}
            projectsId={editProjectId}   // null for add, id for edit
            isEditMode={isEditMode}         // clearer prop name
            setProjectsData={setProjectsData}
            onClose={() => {
              setShowFormModal(false);
              setEditProjectId(null);     // reset for next open
              setIsEditMode(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Projects;
