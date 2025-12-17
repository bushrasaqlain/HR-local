import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import api from '../lib/api.jsx';
import Select from 'react-select';

const Degreefields = () => {
    const [degreeFields, setDegreeFields] = useState([]);
    const [degreeTypes, setDegreeTypes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [postalcode, setPostalcode] = useState(0);
    const [selectedDegreeType, setSelectedDegreeType] = useState();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;


    const [totalCities, setTotalCities] = useState(0);
    const totalPages = Math.ceil(totalCities / itemsPerPage);
    const [isActive, setIsActive] = useState("active");
    



    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const fetchDegreeTypes = async (page = currentPage, status = isActive) => {
        axios
            .get(`${apiBaseUrl}getalldegrees`)
            .then((response) => {
                setDegreeTypes(response.data);
            })
            .catch((error) => {
                console.error("Error fetching degree types:", error);
            });
    };

    const fetchDegreeFields = () => {
       axios.get(`${apiBaseUrl}getalldegreefields?page=${currentPage}&limit=15&status=${isActive}`)

            .then((response) => {
               
                setDegreeFields(response.data.degreefields);
                setTotalCities(response.data.total);
            })
            .catch((error) => {
                console.error("Error fetching degree fields:", error);
            });
    };

 useEffect(() => {
               fetchDegreeFields();
               resetSearch();
             }, [currentPage, isActive]);


    const toggleForm = (item = null) => {
        if (item) {
            setEditId(item.id);
            setInputValue(item.name);
            setSelectedDegreeType({ value: item.degree_type_id, label: item.degree_type});
        } else {
            setEditId(null);
            setInputValue("");
            setSelectedDegreeType("");
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await api.put(`${apiBaseUrl}editdegreefield/${editId}`, {
                    name: inputValue,
                    t_id: selectedDegreeType.value,
                });
                setDegreeFields((prevFields)=> prevFields.map((field) => 
                  field.id === editId ? {...field, name: inputValue, degree_type_id: selectedDegreeType.value, degree_type:selectedDegreeType.label }: field ));
            } else {
                await api.post(`${apiBaseUrl}adddegreefield`, {
                    name: inputValue,
                    t_id: selectedDegreeType.value,
                });
                fetchDegreeFields();
            }
            setShowModal(false);
            setInputValue("");
            setPostalcode("");
            setEditId(null);
            
        } catch (error) {
            console.error("Error saving degree field:", error);
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`${apiBaseUrl}deletedegreefield/${deleteId}`);
            setShowDeleteConfirm(false);
            setDeleteId(null);
            fetchDegreeFields();
        } catch (error) {
            console.error("Error deleting degree field:", error);
        }
    };

    useEffect(()=> {
       
    }, [selectedDegreeType])

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const handlePageChange = async (page) => {
        setCurrentPage(page);

        try {
            const response = await axios.get(
                `${apiBaseUrl}search`, { params: { name: res.name, type: "City", page, limit: 15 } }
            );

            setPackageData(response.data.results);
            setTotalCities(response.data.total);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    };

    const fetchHistory = async (id) => {
    if(!id) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}dbadminhistory`, {
        params: {entity_type: "degreefield", entity_id: id}
      });
    
      setHistory(res.data);

    } catch (error) {
      
    }
  }
  const toggleHistory = (item = null) => {
    if(item) {
      fetchHistory(item.id);
    }
    setShowHistoryModal(true);
  }

   const handleSearch = async (e) => {
    setCurrentPage(1);
        const {name, value} = e.target;
          const inputs = ["name", "degree_field", "created_at", "updated_at"];
          inputs.forEach((input) => {
            if(input !== name) {
              const ele = document.getElementById(input);
              if(ele) ele.value = "";
            }
          })
        try {
          const res = await axios.get(`${apiBaseUrl}getalldegreefields`, {
            params: {
              name,
              search: value,
              status: isActive,
              page: 1,
              limit: itemsPerPage
            }
          });
          setDegreeFields(res.data.degreefields);
            setTotalCities(res.data.total);
        } catch (error) {
          console.error("error in search", error);
        }
      }

      
          const resetSearch = () => {
              document.getElementById("name").value = "";
              document.getElementById("degree_field").value = "";
              document.getElementById("created_at").value = "";
              document.getElementById("updated_at").value = "";
          }
      
          useEffect(() => {
              resetSearch();
          }, [isActive])

    return (
        <>
            <table className="default-table manage-job-table">
                <thead>
                    <tr>
                        
                        <th>
              <div><input type="text" name="name" id="name" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>Degree Field</div>
              </th>
              <th>
              
              <div><input type="text" name="degree_field" id="degree_field" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>Degree Type</div>
              </th>
            <th>
              <div><input type="date" name="created_at" id="created_at" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} max={new Date().toISOString().split('T')[0]} /></div>
              <div>Created At</div>
              </th>
            <th>
              <div><input type="date" name="updated_at" id="updated_at" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} max={new Date().toISOString().split('T')[0]} /></div>
              <div>Updated At</div>
              </th>
            <th className="align-bottom">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {degreeFields?.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.degree_type}</td>
                            <td>{new Date(item.created_at).toISOString().split('T')[0]}</td>
                            <td>{new Date(item.updated_at).toISOString().split('T')[0]}</td>
                            <td className="status" style={{ padding: "21px 15px"}}>
                                <button onClick={() => toggleForm(item)}>
                                    <span className="la la-pencil"></span>
                                </button>
                                <button onClick={() => confirmDelete(item.id)} className="mx-3">

                                    {item.status === "active" ?
                                        <span className="la la-times-circle" style={{ color: "red" }}></span> :
                                        <span className="la la-check-circle" style={{ color: "green" }}></span>


                                    }
                                </button>
                                <button onClick={() => toggleHistory(item)}>

                                    <span className="la la-history"></span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    if (res) {
                        handlePageChange(page);
                    }
                }}
            />

            {showModal && (
                <div className="Modal-outer-div">
                    <div className="Modal-inner-div">
                        <h4>{editId ? "Edit Field" : "Add Field"}</h4>
                        <label>Degree Type</label>
                        <Select
                            options={degreeTypes.map((type)=> ({ value: type.id, label: type.name }))}

                            value={selectedDegreeType}
                             onChange={(selected) => setSelectedDegreeType(selected)}
                                placeholder="Select Degree Type"
                                styles={{
                                    container: (base) => ({ ...base, width: "100%", maxWidth: "300px" })
                                }}
                                className="my-3"
                        />


                        <label>Field</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter Field name"
                            className="Modal-input"
                        />


                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                className="Modal-cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button className="Modal-save-button" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="Modal-outer-div">
                    <div className="Modal-inner-div">
                        <h4>Confirm {isActive === "active" ? " In Activate" : " Activate"} </h4>
                        <p>Are you sure you want to {isActive} this Degree field?</p>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="Modal-cancel-button" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="Modal-save-button" onClick={handleDelete}>
                                {isActive === "active" ? " In Activate" : " Activate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {showHistoryModal && (
                <div className="modal fade show" style={{ display: "block" }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">History</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowHistoryModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                {history?.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="p-2 mb-2 rounded"
                                        style={{
                                            backgroundColor: idx % 2 === 0 ? "#f8f9fa" : "#e9ecef",
                                            border: "1px solid #dee2e6",
                                            fontSize: "14px",
                                        }}
                                    >
                                        <strong>{item.data.name}</strong> was{" "}
                                        <span
                                            style={{
                                                color:
                                                    item.action === "ADDED"
                                                        ? "green"
                                                        : item.action === "UPDATED"
                                                            ? "purple"
                                                            : item.action === "ACTIVE"
                                                                ? "teal"
                                                                : "red",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {item.action}
                                        </span>{" "}
                                        by <em>{item.changed_by_name}</em> on{" "}
                                        {item.changed_at?.split("T")[0]}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showHistoryModal && (
                <div
                    className="modal-backdrop fade show"
                    onClick={() => setShowHistoryModal(false)}
                ></div>
            )}

        </>
    );
};

export default Degreefields;
