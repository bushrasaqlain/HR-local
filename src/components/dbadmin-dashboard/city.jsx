import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import AsyncSelect from "react-select/async";
import api from '../lib/api.jsx';

const City = () => {
  const [cities, setCities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [postalcode, setPostalcode] = useState("");
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState(null);
  // Selected dropdowns (objects: {label, value})
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalCities, setTotalCities] = useState(0);
  const totalPages = Math.ceil(totalCities / itemsPerPage);
  const [isActive, setIsActive] = useState("active");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // ------------------ Loaders for AsyncSelect ------------------ //
  const loadCountries = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}country/getallCountries`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.countries.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading countries:", error);
      return [];
    }
  };

  const loadDistricts = async (inputValue) => {
    if (!selectedCountry?.value) return [];
    try {
      const res = await axios.get(`${apiBaseUrl}getalldistricts`, {
        params: {
          country_id: selectedCountry.value,
          search: inputValue || "",
          page: 1,
          limit: 15,
        },
      });
      return res.data.districts.map((d) => ({
        label: d.name,
        value: d.id,
      }));
    } catch (error) {
      console.error("Error loading districts:", error);
      return [];
    }
  };

  // ------------------ Fetch Cities ------------------ //
  const fetchCities =  async (page = currentPage, status = isActive) =>  {
    if (selectedDistrict?.value) {
      axios
        .get(
          `${apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}?page=${currentPage}&limit=${itemsPerPage}`
        )
        .then((response) => {
          setCities(response.data.cities);
          setTotalCities(response.data.total);
        })
        .catch((error) =>
          console.error("Error fetching cities by district:", error)
        );
    } else {
      axios
        .get(`${apiBaseUrl}getallcities?page=${currentPage}&limit=${itemsPerPage}&status=${isActive}`)
        .then((response) => {
          setCities(response.data.cities);
          setTotalCities(response.data.total);
        })
        .catch((error) => console.error("Error fetching all cities:", error));
    }
  };

   useEffect(() => {
             fetchCities();
             resetSearch();
           }, [currentPage, isActive]);

  // ------------------ Modal Toggle ------------------ //
  const toggleForm = (item = null) => {
    if (item) {
 
      setEditId(item.id);
      setInputValue(item.name);

      // Preselect country + district as objects
      setSelectedCountry(
        item.country_id ? { value: item.country_id, label: item.country_name } : null
      );
      setSelectedDistrict(
        item.district_id ? { value: item.district_id, label: item.district_name } : null
      );
    } else {
      setEditId(null);
      setInputValue("");
      setPostalcode("");
      setSelectedCountry(null);
      setSelectedDistrict(null);
    }
    setShowModal(true);
  };

  // ------------------ Save ------------------ //
  const handleSave = async () => {
    try {
      if (!selectedCountry?.value || !selectedDistrict?.value) {
        alert("Please select a country and district.");
        return;
      }

      if (editId) {
        await api.put(`${apiBaseUrl}editCity/${editId}`, {
          name: inputValue,
          district_id: selectedDistrict.value,
        });
        setCities((prev) => prev.map((city) => 
          city.id === editId ? {...city, name: inputValue, district_id: selectedDistrict.value, district_name: selectedDistrict.label, country_id: selectedCountry.value, country_name: selectedCountry.label } : city
        ))
      } else {
        await api.post(`${apiBaseUrl}addcities`, {
          name: inputValue,
          postalcode,
          district_id: selectedDistrict.value,
        });
        fetchCities();

      }

      setShowModal(false);
      setInputValue("");
      setEditId(null);
      setSelectedCountry(null);

      
      setSelectedDistrict(null);
    } catch (error) {
      console.error("Error saving city:", error);
    }
  };

  // ------------------ Delete ------------------ //
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${apiBaseUrl}deleteCity/${deleteId}`);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchCities();
    } catch (error) {
      console.error("Error deleting city:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const fetchHistory = async (id) => {
        if (!id) return;
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}dbadminhistory`, {
                params: { entity_type: "city", entity_id: id }
            });
        
            setHistory(res.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }
    const toggleHistory = (item = null) => {
        if (item) {
            fetchHistory(item.id);
        }
        setShowHistoryModal(true);
    }

    const handleSearch = async (e) => {
         const {name, value} = e.target;
         setCurrentPage(1);
          const inputs = ["name", "district", "country", "created_at", "updated_at"];
          inputs.forEach((input) => {
            if(input !== name) {
              const ele = document.getElementById(input);
              if(ele) ele.value = "";
            }
          })
        try {
          const res = await axios.get(`${apiBaseUrl}getallcities`, {
            params: {
              name,
              search: value,
              status: isActive,
              page: 1,
              limit: itemsPerPage,
            }
          });
         
          setCities(res.data.cities);
          setTotalCities(res.data.total);
        } catch (error) {
          console.error("error in search", error);
        }
      }

      
          const resetSearch = () => {
              document.getElementById("name").value = "";
              document.getElementById("district").value = "";
              document.getElementById("country").value = "";
              document.getElementById("created_at").value = "";
              document.getElementById("updated_at").value = "";
          }
      
          useEffect(() => {
              resetSearch();
          }, [isActive])
    

  // ------------------ Render ------------------ //
  return (
    <>
      <table className="default-table manage-job-table">
        <thead>
          <tr>
            <th>
              <div><input type="text" name="name" id="name" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>City</div>
              </th>
            <th>
              <div><input type="text" name="district" id="district" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>District</div>
              </th>
            
            <th>
              <div><input type="text" name="country" id="country" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>Country</div>
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
          {cities?.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.district_name}</td>
                            <td>{item.country_name}</td>
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
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Add/Edit modal */}
      {showModal && (
        <div className="Modal-outer-div">
          <div className="Modal-inner-div">
            <h4>{editId ? "Edit City" : "Add City"}</h4>

            <label>Country</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadCountries}
              value={selectedCountry}
              onChange={(option) => {
                setSelectedCountry(option);
                setSelectedDistrict(null); // reset district
              }}
              placeholder="Select Country"
              className="Modal-input"
            />

            <label>District</label>
            <AsyncSelect
              key={selectedCountry?.value} // re-render when country changes
              cacheOptions
              defaultOptions
              loadOptions={loadDistricts}
              value={selectedDistrict}
              onChange={(option) => setSelectedDistrict(option)}
              placeholder="Select District"
              isDisabled={!selectedCountry}
              className="Modal-input"
            />

            <label>City Name</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter City name"
              className="Modal-input"
            />

            <div
              style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}
            >
              <button
                className="Modal-cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="Modal-save-button"
                onClick={handleSave}
                disabled={!selectedCountry || !selectedDistrict || !inputValue}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="Modal-outer-div">
          <div className="Modal-inner-div">
            <h4>Confirm {isActive === "active" ? " In Activate" : " Activate"} </h4>
            <p>Are you sure you want to {isActive} this City?</p>
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
                                ))} </div>
                        </div>
                    </div>
                </div>
            )}
    </>
  );
};

export default City;
