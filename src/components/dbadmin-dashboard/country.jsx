import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from '../lib/api.jsx';

const Country = () => {
  const [countries, setCountries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCountries, setTotalCountries] = useState(0);
  const [isActive, setIsActive] = useState("active");

  const itemsPerPage = 15;
  const totalPages = Math.ceil(totalCountries / itemsPerPage);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch countries
  const fetchCountries = async (page = currentPage, status = isActive) => {
    try {
      const response = await axios.get(`${apiBaseUrl}getallCountries`, {
        params: { page, limit: itemsPerPage, status },
      });
      setCountries(response.data.countries || []);
      setTotalCountries(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // Fetch history
  const fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "country", entity_id: id },
      });
      setHistory(res.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Modal toggles
  const toggleForm = (item = null) => {
    if (item) {
      setEditId(item.id);
      setInputValue(item.name);
    } else {
      setEditId(null);
      setInputValue("");
    }
    setShowModal(true);
  };

  const toggleHistory = (item = null) => {
    if (item) fetchHistory(item.id);
    setShowHistoryModal(true);
  };

  // Save/Add country
  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`${apiBaseUrl}editcountry/${editId}`, { name: inputValue });
        setCountries((prev) =>
          prev.map((item) => (item.id === editId ? { ...item, name: inputValue } : item))
        );
      } else {
        await api.post(`${apiBaseUrl}addcountries`, { name: inputValue });
        fetchCountries(1);
      }
      setShowModal(false);
      setInputValue("");
      setEditId(null);
    } catch (error) {
      console.error("Error saving country:", error);
    }
  };

  // Delete / Activate toggle
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${apiBaseUrl}deletecountry/${deleteId}`);
      setShowDeleteConfirm(false);
      toast.success(
        isActive === "active" ? "Inactivated successfully" : "Activated successfully"
      );
      fetchCountries();
    } catch (error) {
      console.error("Error deleting country:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  // Search
  const handleSearch = async (e) => {
    const { name, value } = e.target;
    const inputs = ["name", "created_at", "updated_at"];
    inputs.forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });
    setCurrentPage(1);

    try {
      const res = await axios.get(`${apiBaseUrl}getallCountries`, {
        params: { name, search: value, status: isActive, page: 1, limit: itemsPerPage },
      });
      setCountries(res.data.countries || []);
      setTotalCountries(res.data.total || 0);
    } catch (error) {
      console.error("Error searching countries:", error);
    }
  };

  // Reset search fields
  const resetSearch = () => {
    ["name", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  // Pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCountries(page);
  };

  // Fetch countries whenever currentPage or isActive changes
  useEffect(() => {
    fetchCountries();
    resetSearch();
  }, [currentPage, isActive]);

  return (
    <>
      <table className="default-table manage-job-table">
        <thead>
          <tr>
            <th>
              <input
                type="text"
                name="name"
                id="name"
                className="py-4 px-3 mb-3 w-100 rounded-4"
                placeholder="Search by name"
                onChange={handleSearch}
              />
              <div>Country Name</div>
            </th>
            <th>
              <input
                type="date"
                name="created_at"
                id="created_at"
                className="py-4 px-3 mb-3 w-100 rounded-4"
                max={new Date().toISOString().split("T")[0]}
                onChange={handleSearch}
              />
              <div>Created At</div>
            </th>
            <th>
              <input
                type="date"
                name="updated_at"
                id="updated_at"
                className="py-4 px-3 mb-3 w-100 rounded-4"
                max={new Date().toISOString().split("T")[0]}
                onChange={handleSearch}
              />
              <div>Updated At</div>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{new Date(item.created_at).toISOString().split("T")[0]}</td>
              <td>{new Date(item.updated_at).toISOString().split("T")[0]}</td>
              <td className="status">
                <button onClick={() => toggleForm(item)}>
                  <span className="la la-pencil"></span>
                </button>
                <button onClick={() => confirmDelete(item.id)} className="mx-3">
                  {item.status === "active" ? (
                    <span className="la la-times-circle" style={{ color: "red" }}></span>
                  ) : (
                    <span className="la la-check-circle" style={{ color: "green" }}></span>
                  )}
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
        onPageChange={handlePageChange}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="Modal-outer-div">
          <div className="Modal-inner-div">
            <h4>{editId ? "Edit Country" : "Add Country"}</h4>
            <label>Name</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Country name"
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="Modal-outer-div">
          <div className="Modal-inner-div">
            <h4>Confirm {isActive === "active" ? "Inactivate" : "Activate"}</h4>
            <p>Are you sure you want to {isActive} this Country?</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="Modal-cancel-button" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="Modal-save-button" onClick={handleDelete}>
                {isActive === "active" ? "Inactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <>
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
                  {history.map((item, idx) => (
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
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowHistoryModal(false)}
          ></div>
        </>
      )}
    </>
  );
};

export default Country;
