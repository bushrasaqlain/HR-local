import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import api from '../lib/api.jsx';


const BusinessEntityTypes = () => {
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

    const fetchskills = async (page = currentPage, status = isActive) => {
        axios.get(`${apiBaseUrl}getallbusinesstypes?page=${currentPage}&limit=15&status=${isActive}`)
            .then(response => {
                setPackageData(response.data.business_types);
                setTotalCities(response.data.total);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

   
    useEffect(() => {
                       fetchskills();
                       resetSearch();
                     }, [currentPage, isActive]);
    

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

    const handleSave = async () => {
        try {
            if (editId) {
                // ✅ update API
                const response = await api.put(`${apiBaseUrl}editbusinesstype/${editId}`, { name: inputValue });

                // ✅ update local state instead of refreshing
                setPackageData((prev) =>
                    prev.map((item) =>
                        item.id === editId ? { ...item, name: inputValue, updated_at: new Date().toISOString() } : item
                    )
                );
            } else {
                // ✅ add new entry
                const response = await api.post(`${apiBaseUrl}addbusinesstype`, { name: inputValue });

                // if API returns the new item, use that, else just create temp
                const newItem = response.data?.business_type || {
                    id: Date.now(), // fallback temp id
                    name: inputValue,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: "active",
                };

                // prepend OR append (depending on your requirement)
                setPackageData((prev) => [newItem, ...prev]);
                setTotalCities((prev) => prev + 1);
            }

            // ✅ close modal, reset
            setShowModal(false);
            setInputValue("");
            setEditId(null);
        } catch (error) {
            console.error("Error saving business entity type:", error);
        }
    };


    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    // When user confirms deletion
    const handleDelete = async () => {
        try {
            await api.delete(`${apiBaseUrl}deletebusinesstype/${deleteId}`);
            setShowDeleteConfirm(false);
            setDeleteId(null);
            fetchskills();
        } catch (error) {
            console.error('Error deleting business entity type:', error);
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
            const response = await axios.get(`${apiBaseUrl}search`, {
                params: {
                    name: res?.name || "",
                    type: "BusinessEntityType",
                    page,
                    limit: 15
                }
            });


            setPackageData(response.data.results);
            setTotalCities(response.data.total);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    };

    const fetchHistory = async (id) => {
        if (!id) return;
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}dbadminhistory`, {
                params: { entity_type: "business_entity_type", entity_id: id }
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
        const { name, value } = e.target;

        // reset to page 1 when searching
        setCurrentPage(1);

        // clear other fields
        const inputs = ["name", "created_at", "updated_at"];
        inputs.forEach((input) => {
            if (input !== name) {
                const ele = document.getElementById(input);
                if (ele) ele.value = "";
            }
        });

        try {
            const res = await axios.get(`${apiBaseUrl}getallbusinesstypes`, {
                params: {
                    name,
                    search: value,
                    status: isActive,
                    page: 1,   // force backend to send first page
                    limit: 15,
                },
            });
            setPackageData(res.data.business_types);
            setTotalCities(res.data.total);
        } catch (error) {
            console.error("error in search", error);
        }
    };


    const resetSearch = () => {
        document.getElementById("name").value = "";
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
                            <div>Name</div>
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
                            <td>{item.name}</td>
                            <td>{new Date(item.created_at).toISOString().split('T')[0]}</td>
                            <td>{new Date(item.updated_at).toISOString().split('T')[0]}</td>
                            <td className="status">
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

            {/* Add/Edit modal */}
            {showModal && (
                <div className="Modal-outer-div">
                    <div className="Modal-inner-div">
                        <h4>{editId ? "Edit Business Entity Type" : "Add Business Entity Type"}</h4>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter Business Entity Type name"
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
                        <p>Are you sure you want to {isActive} this Business Entity?</p>
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

export default BusinessEntityTypes;

