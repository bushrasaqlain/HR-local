import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx"; 
import api from '../lib/api.jsx';

const Currency = () => {
  const [packageData, setPackageData] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [inputValue, setInputValue] = useState("");   
  const [editId, setEditId] = useState(null);        
  const [deleteId, setDeleteId] = useState(null);    // Track id to delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show confirm modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
  
  
    const [totalCities, setTotalCities] = useState(0);
    const totalPages = Math.ceil(totalCities / itemsPerPage);
    const [isActive, setIsActive] = useState("active");
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchcurrency = async (page = currentPage, status = isActive) =>  {
    axios.get(`${apiBaseUrl}getallcurrencies?page=${currentPage}&limit=15&status=${isActive}`)
      .then(response => {
        
 setPackageData(response.data.currencies);
        setTotalCities(response.data.total);      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`${apiBaseUrl}editcurrency/${editId}`, { name: inputValue });
        setPackageData((prevData) => prevData.map((currency) => 
          currency.id === editId ? {...currency, code: inputValue}: currency));
      } else {
        await api.post(`${apiBaseUrl}addcurrency`, { name: inputValue });
        fetchcurrency();
      }
      setShowModal(false);
      setInputValue("");
      setEditId(null);
      
    } catch (error) {
      console.error('Error saving profession:', error);
    }
  };

  // Instead of deleting directly, show confirmation modal first
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  // When user confirms deletion
  const handleDelete = async () => {
    try {
      await api.delete(`${apiBaseUrl}deletecurrency/${deleteId}`);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchcurrency();
    } catch (error) {
      console.error('Error deleting currency:', error);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
  
    try {
      const response = await axios.get(
        `${apiBaseUrl}search`, { params: { name: res.name, type: "Currency", page, limit: 15 } }
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
        params: {entity_type: "currency", entity_id: id}
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
      const {name, value} = e.target;
      setCurrentPage(1);
        const inputs = ["code", "created_at", "updated_at"];
        inputs.forEach((input) => {
          if(input !== name) {
            const ele = document.getElementById(input);
            if(ele) ele.value = "";
          }
        })
      try {
        const res = await axios.get(`${apiBaseUrl}getallcurrencies`, {
          params: {
            name,
            search: value,
            status: isActive,
            page: 1,
            limit: itemsPerPage
          }
        });
        setPackageData(res.data.currencies);
          setTotalCities(res.data.total);
      } catch (error) {
        console.error("error in search", error);
      }
    }

    
        const resetSearch = () => {
            document.getElementById("code").value = "";
            document.getElementById("created_at").value = "";
            document.getElementById("updated_at").value = "";
        }
    
        useEffect(() => {
           fetchcurrency();
           resetSearch();
         }, [currentPage, isActive]);
  

  return (
    <>
      <table className="default-table manage-job-table">
        <thead>
          <tr>
            <th>
              <div><input type="text" name="code" id="code" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
              <div>Country Name</div>
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
          {packageData?.map((item) => (
            <tr key={item.id}>
              <td>{item.code}</td>
              <td>{new Date(item.created_at).toISOString().split('T')[0]}</td>
              <td>{new Date(item.updated_at).toISOString().split('T')[0]}</td>
              <td className="status">
                <button onClick={() => toggleForm(item)}>
                  <span className="la la-pencil"></span>
                </button>  
                              <button onClick={() => confirmDelete(item.id)} className="mx-3">

                { item.status === "active" ? 
<span className="la la-times-circle" style={{color:"red"}}></span> :
<span className="la la-check-circle" style={{color:"green"}}></span>


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
    if(res){
    handlePageChange(page);
    }
  }}
      />

      {/* Add/Edit modal */}
      {showModal && (
        <div className="Modal-outer-div">
          <div className="Modal-inner-div">
            <h4>{editId ? "Edit Currency" : "Add Currency"}</h4>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Currency name"
              className="Modal-input"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="Modal-cancel-button" onClick={() => setShowModal(false)}>
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
            <p>Are you sure you want to {isActive} this Currency?</p>
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

export default Currency;
