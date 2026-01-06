import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import MetaTags from "react-meta-tags";
import {
  Card,
  Row,
  Col,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
} from "react-bootstrap";

class Degreetype extends Component {
  constructor(props) {
    super(props);
    this.state = {
      degreetypes: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      history: [],
      currentPage: 1,
      totalDegreetype: 0,
      isActive: "all",

    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchdegreetype();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchdegreetype();
      this.resetSearch();
    }
  }

  fetchdegreetype = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await axios.get(`${this.apiBaseUrl}getalldegreetype`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        degreetypes: response.data.degreetypes || [],
        totalDegreetype: response.data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching Degree type:", error);
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" }); // Sep
    const year = String(date.getFullYear()).slice(-2); // 25

    return `${day}-${month}-${year}`;
  };

  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "degreetypes", entity_id: id },
      });
      this.setState({ history: res.data || [] });
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  toggleForm = (item = null) => {
    if (item) {
      this.setState({
        editId: item.id,
        inputValue: item.name,
        showModal: true,
      });
    } else {
      this.setState({ editId: null, inputValue: "", showModal: true });
    }
  };

  toggleHistory = (item = null) => {
    if (item) this.fetchHistory(item.id);
    this.setState({ showHistoryModal: true });
  };

  handleSave = async () => {
    const { editId, inputValue } = this.state;
    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}editdegreetype/${editId}`, {
          name: inputValue,
        });
        this.setState((prevState) => ({
          degreetypes: prevState.degreetypes.map((item) =>
            item.id === editId ? { ...item, name: inputValue } : item
          ),
        }));
      } else {
        await api.post(`${this.apiBaseUrl}adddegreetype`, { name: inputValue });
        this.fetchdegreetype(1);
      }
      this.setState({ showModal: false, inputValue: "", editId: null });
    } catch (error) {
      console.error("Error saving degreetype:", error);
    }
  };

  confirmDelete = (id, status) => {
    this.setState({
      deleteId: id,
      deleteStatus: status, // ✅ actual row status
      showDeleteConfirm: true,
    });
  };
  handleDelete = async () => {
    const { deleteId, isActive } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}deletedegreetype/${deleteId}`);
      toast.success(
        isActive === "active"
          ? "Inactivated successfully"
          : "Activated successfully"
      );
      this.setState({ showDeleteConfirm: false }, this.fetchdegreetype);
    } catch (error) {
      console.error("Error deleting degreetype:", error);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    ["name", "created_at", "updated_at"].forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });

    this.setState({ currentPage: 1 });

    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldegreetypes`, {
        params: {
          name,
          search: value,
          status: this.state.isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        degreetypes: res.data.degreetypes || [],
        totalDegreetype: res.data.total || 0,
      });
    } catch (error) {
      console.error("Error searching degreetype:", error);
    }
  };

  resetSearch = () => {
    ["name", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      degreetypes,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      history,
      currentPage,
      totalDegreetype,
      deleteStatus,
      isActive,
      editId,
    } = this.state;
    const totalPages = Math.ceil(totalDegreetype / this.itemsPerPage);

    return (
      <React.Fragment>
        <MetaTags>
          <title>Degree | List</title>
        </MetaTags>
        <h6 className="fw-bold mb-3">Degree List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="degreetype-header-section">
              <p
                className="breadcrumb-text"
                title="History"
                breadcrumbItem="Activity Log"
              />

              <div className="d-flex justify-content-end my-2">
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-degreetype-btn"
                >
                  Add New Degee
                </Button>
              </div>

              <div className="w-100 m-2">
                <p className="filter-label text-dark">Filter by Status</p>
                <select
                  className="rounded-square form-select p-2"
                  style={{
                    maxWidth: "250px",
                    // fontFamily: "Helvetica Neue, Arial, sans-serif",
                    color: "#666565ff",
                    border: "1px solid #ccc",
                  }}
                  value={isActive}
                  onChange={(e) => this.setState({ isActive: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>


              </div>
            </div>

            <Card>
              <CardBody>
                <div className="table-responsive">
                  <Table className="table-responsive align-middle default-table manage-job-table p-2 w-100 table table-striped custom-table">
                    <thead className="align-middle">
                      <tr>
                       
                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Degree Type 
                            </small>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              className="form-control rounded-4 text-center"
                              placeholder="Search by name"
                              onChange={this.handleSearch}
                              style={{ maxWidth: "180px", borderColor: "#ccc" }}
                            />
                          </div>
                        </th>

                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Created
                            </small>
                            <input
                              type="date"
                              name="created_at"
                              id="created_at"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>

                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Updated
                            </small>
                            <input
                              type="date"
                              name="updated_at"
                              id="updated_at"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>
                        <th
                          className="text-center"
                          style={{ borderBottom: "1px solid #ccc" }}
                        >
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small
                              className="text-dark fw-bold"
                              style={{ fontSize: "1rem" }}
                            >
                              Status
                            </small>
                            <input
                              type="text"
                              name="status"
                              id="status"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>
                        <th
                          className="text-center text-dark fw-bold"
                          style={{
                            fontSize: "1rem",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {degreetypes.map((item) => (
                        <tr key={item.id}>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            {this.formatDate(item.created_at)}
                          </td>
                          <td className="text-center">
                            {this.formatDate(item.updated_at)}
                          </td>
                          <td className="text-center">
                            {item.status}
                          </td>

                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">
                              <button onClick={() => this.toggleForm(item)} className="icon-btn">
                                <span className="la la-pencil"></span>
                              </button>

                              <button
                                onClick={() => this.confirmDelete(item.id, item.status)}
                                className="icon-btn"
                              >
                                {item.status === "active" ? (
                                  <span className="la la-times-circle text-danger"></span>
                                ) : (
                                  <span className="la la-check-circle text-success"></span>
                                )}
                              </button>

                              <button onClick={() => this.toggleHistory(item)} className="icon-btn">
                                <span className="la la-history"></span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Container>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={this.handlePageChange}
          />

          {/* Add/Edit Modal */}
          <Modal
            show={showModal}
            onHide={() => this.setState({ showModal: false })}
            centered
          >
            <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
              <Modal.Title style={{ fontSize: "1rem", marginBottom: "0" }}>
                {editId ? "Edit degreetype" : "Add New degreetype"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "0.5rem" }}>
              <label style={{ marginBottom: "0.25rem" }}>Name</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                placeholder="Enter degreetype name"
                className="form-control"
              />
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={this.handleSave}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Confirmation */}
          <Modal show={showDeleteConfirm} onHide={this.cancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "1rem", fontWeight: 600 }}>
                Confirm {deleteStatus === "active" ? "Inactivate" : "Activate"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="text-center py-3">
              <p style={{ marginBottom: 0 }}>
                Are you sure you want to{" "}
                <strong>
                  {deleteStatus === "active" ? "inactivate" : "activate"}
                </strong>{" "}
                this degreetype?
              </p>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={this.cancelDelete}>
                Cancel
              </Button>

              <Button
                variant={deleteStatus === "active" ? "danger" : "success"}
                onClick={this.handleDelete}
              >
                {deleteStatus === "active" ? "Inactivate" : "Activate"}
              </Button>
            </Modal.Footer>
          </Modal>


          {/* History Modal */}
          <Modal
            show={showHistoryModal}
            onHide={() => this.setState({ showHistoryModal: false })}
            centered
            scrollable
          >
            <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
              <Modal.Title style={{ fontSize: "1rem", marginBottom: 0 }}>
                History
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ paddingTop: "0.5rem" }}>
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
                  <strong> {item.data.name} </strong> was{" "}
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
                  {this.formatDate(item.changed_at)}
                </div>
              ))}
            </Modal.Body>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default Degreetype;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Pagination from "../common/pagination.jsx";
// import api from '../lib/api.jsx';

// const degreetype = () => {
//   const [packageData, setPackageData] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [inputValue, setInputValue] = useState("");
//   const [editId, setEditId] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);    // Track id to delete
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show confirm modal
//   const [showHistoryModal, setShowHistoryModal] = useState(false);
//   const [history, setHistory] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 15;
//   const [isActive, setIsActive] = useState("active");


//   const [totalCities, setTotalCities] = useState(0);
//   const totalPages = Math.ceil(totalCities / itemsPerPage);


//   const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

//   const fetchdegreetypetypes = async (page = currentPage, status = isActive) => {
//     axios.get(`${apiBaseUrl}getalldegreetypes?page=${currentPage}&limit=15&status=${isActive}`)
//       .then(response => {
//         setPackageData(response.data.degreetypetypes);
//         setTotalCities(response.data.total);
//       })
//       .catch(error => {
//         console.error('Error fetching data:', error);
//       });
//   };

//    useEffect(() => {
//                fetchdegreetypetypes();
//                resetSearch();
//              }, [currentPage, isActive]);

//   const toggleForm = (item = null) => {
//     if (item) {
//       setEditId(item.id);
//       setInputValue(item.name);
//     } else {
//       setEditId(null);
//       setInputValue("");

//     }
//     setShowModal(true);
//   };

//   const handleSave = async () => {
//     try {
//       if (editId) {
//         await api.put(`${apiBaseUrl}editdegreetype/${editId}`, { name: inputValue });
//         setPackageData((prevData) => prevData.map((item) => 
//           item.id === editId ? {...item, name: inputValue}: item));
//       } else {
//         await api.post(`${apiBaseUrl}adddegreetype`, { name: inputValue });
//         fetchdegreetypetypes();
//       }
//       setShowModal(false);
//       setInputValue("");
//       setEditId(null);
      
//     } catch (error) {
//       console.error('Error saving degreetype:', error);
//     }
//   };

//   // Instead of deleting directly, show confirmation modal first
//   const confirmDelete = (id) => {
//     setDeleteId(id);
//     setShowDeleteConfirm(true);
//   };

//   // When user confirms deletion
//   const handleDelete = async () => {
//     try {
//       await api.delete(`${apiBaseUrl}deletedegreetype/${deleteId}`);
//       setShowDeleteConfirm(false);
//       setDeleteId(null);
//       fetchdegreetypetypes();
//     } catch (error) {
//       console.error('Error deleting degreetype:', error);
//     }
//   };

//   // Cancel deletion
//   const cancelDelete = () => {
//     setShowDeleteConfirm(false);
//     setDeleteId(null);
//   };

//   const handlePageChange = async (page) => {
//     setCurrentPage(page);

//     try {
//       const response = await axios.get(
//         `${apiBaseUrl}search`, { params: { name: res.name, type: "degreetype", page, limit: 15 } }
//       );

//       setPackageData(response.data.results);
//       setTotalCities(response.data.total);
//     } catch (error) {
//       console.error("Error fetching search results:", error);
//     }
//   };
//   const fetchHistory = async (id) => {
//     if (!id) return;
//     try {
//       const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}dbadminhistory`, {
//         params: { entity_type: "degreetype", entity_id: id }
//       });

//       setHistory(res.data);

//     } catch (error) {

//     }
//   }
//   const toggleHistory = (item = null) => {
//     if (item) {
//       fetchHistory(item.id);
//     }
//     setShowHistoryModal(true);
//   }

//   const handleSearch = async (e) => {
//     setCurrentPage(1);
//       const {name, value} = e.target;
//         const inputs = ["name", "created_at", "updated_at"];
//         inputs.forEach((input) => {
//           if(input !== name) {
//             const ele = document.getElementById(input);
//             if(ele) ele.value = "";
//           }
//         })
//       try {
//         const res = await axios.get(`${apiBaseUrl}getalldegreetypes`, {
//           params: {
//             name,
//             search: value,
//             status: isActive,
//             page: 1,
//             limit: itemsPerPage
//           }
//         });
//         setPackageData(res.data.degreetypetypes);
//           setTotalCities(res.data.total);
//       } catch (error) {
//         console.error("error in search", error);
//       }
//     }

    
//         const resetSearch = () => {
//             document.getElementById("name").value = "";
//             document.getElementById("created_at").value = "";
//             document.getElementById("updated_at").value = "";
//         }
    
//         useEffect(() => {
//             resetSearch();
//         }, [isActive])

//   return (
//     <>
//       <table className="default-table manage-job-table">
//         <thead>
//           <tr>
//             <th>
//               <div><input type="text" name="name" id="name" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
//               <div>degreetype Name</div>
//               </th>
//             <th>
//               <div><input type="date" name="created_at" id="created_at" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} max={new Date().toISOString().split('T')[0]} /></div>
//               <div>Created At</div>
//               </th>
//             <th>
//               <div><input type="date" name="updated_at" id="updated_at" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} max={new Date().toISOString().split('T')[0]} /></div>
//               <div>Updated At</div>
//               </th>
//             <th className="align-bottom">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {packageData?.map((item) => (
//             <tr key={item.id}>
//               <td>{item.name}</td>
//               <td>{new Date(item.created_at).toISOString().split('T')[0]}</td>
//               <td>{new Date(item.updated_at).toISOString().split('T')[0]}</td>
//               <td className="status">
//                 <button onClick={() => toggleForm(item)}>
//                   <span className="la la-pencil"></span>
//                 </button>
//                 <button onClick={() => confirmDelete(item.id)} className="mx-3">

//                   {item.status === "active" ?
//                     <span className="la la-times-circle" style={{ color: "red" }}></span> :
//                     <span className="la la-check-circle" style={{ color: "green" }}></span>


//                   }
//                 </button>
//                 <button onClick={() => toggleHistory(item)}>

//                   <span className="la la-history"></span>
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={(page) => {
//           setCurrentPage(page);
//           if (res) {
//             handlePageChange(page);
//           }
//         }}
//       />

//       {/* Add/Edit modal */}
//       {showModal && (
//         <div className="Modal-outer-div">
//           <div className="Modal-inner-div">
//             <h4>{editId ? "Edit degreetype" : "Add degreetype"}</h4>
//             <label>Name</label>
//             <input
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               placeholder="Enter degreetype name"
//               className="Modal-input"
//             />


//             <div style={{ display: "flex", justifyContent: "flex-end" }}>
//               <button className="Modal-cancel-button" onClick={() => setShowModal(false)}>
//                 Cancel
//               </button>
//               <button className="Modal-save-button" onClick={handleSave}>
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete confirmation modal */}
//       {showDeleteConfirm && (
//         <div className="Modal-outer-div">
//           <div className="Modal-inner-div">
//             <h4>Confirm {isActive === "active" ? " In Activate" : " Activate"} </h4>
//             <p>Are you sure you want to {isActive} this degreetype?</p>
//             <div style={{ display: "flex", justifyContent: "flex-end" }}>
//               <button className="Modal-cancel-button" onClick={cancelDelete}>
//                 Cancel
//               </button>
//               <button className="Modal-save-button" onClick={handleDelete}>
//                 {isActive === "active" ? " In Activate" : " Activate"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//        {showHistoryModal && (
//   <div className="modal fade show" style={{ display: "block" }}>
//     <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
//       <div className="modal-content">
        
//         <div className="modal-header">
//           <h5 className="modal-title">History</h5>
//           <button
//             type="button"
//             className="btn-close"
//             onClick={() => setShowHistoryModal(false)}
//           ></button>
//         </div>

//         <div className="modal-body">
//           {history?.map((item, idx) => (
//             <div
//               key={item.id || idx}
//               className="p-2 mb-2 rounded"
//               style={{
//                 backgroundColor: idx % 2 === 0 ? "#f8f9fa" : "#e9ecef",
//                 border: "1px solid #dee2e6",
//                 fontSize: "14px",
//               }}
//             >
//               <strong>{item.data.name}</strong> was{" "}
//               <span
//                 style={{
//                   color:
//                     item.action === "ADDED"
//                       ? "green"
//                       : item.action === "UPDATED"
//                       ? "purple"
//                       : item.action === "ACTIVE"
//                       ? "teal"
//                       : "red",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {item.action}
//               </span>{" "}
//               by <em>{item.changed_by_name}</em> on{" "}
//               {item.changed_at?.split("T")[0]}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   </div>
// )}

// {/* Backdrop */}
// {showHistoryModal && (
//   <div
//     className="modal-backdrop fade show"
//     onClick={() => setShowHistoryModal(false)}
//   ></div>
// )}



//     </>
//   );
// };

// export default degreetype;
