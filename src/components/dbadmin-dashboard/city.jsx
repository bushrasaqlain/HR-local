import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import Head from "next/head";
import AsyncSelect from "react-select/async";

import {
  Card,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
} from "react-bootstrap";

class City extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cities: [],
      showModal: false,
      inputValue: "",
      editId: null,
      deleteId: null,
      showDeleteConfirm: false,
      showHistoryModal: false,
      history: [],
      currentPage: 1,
      totalCities: 0,
      isActive: "active",
      selectedDistrict: null,
      postalcode: "",
    };

    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchCities();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchCities();
      this.resetSearch();
    }
  }

  // Load districts for AsyncSelect
  loadDistricts = async (inputValue) => {
    try {
      const res = await api.get(`${this.apiBaseUrl}getAllDistricts`, {
        params: {
          search: inputValue || "",
          page: 1,
          limit: 20,
          status: "active",
        },
      });

      return (res.data.districts || []).map((item) => ({
        value: item.id,
        label: item.name,
      }));
    } catch (err) {
      console.error("Error loading districts", err);
      return [];
    }
  };

  fetchCities = async (
    page = this.state.currentPage,
    status = this.state.isActive
  ) => {
    try {
      const response = await api.get(`${this.apiBaseUrl}getAllCities`, {
        params: { page, limit: this.itemsPerPage, status },
      });
      this.setState({
        cities: response.data.cities || [],
        totalCities: response.data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };
  fetchHistory = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${this.apiBaseUrl}dbadminhistory`, {
        params: { entity_type: "city", entity_id: id },
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
        postalcode: item.postalcode || "",
        selectedDistrict: {
          value: item.district_id,
          label: item.district_name,
        },
        showModal: true,
      });
    } else {
      this.setState({
        editId: null,
        inputValue: "",
        postalcode: "",
        selectedDistrict: null,
        showModal: true,
      });
    }
  };

  toggleHistory = async (item = null) => {
    if (!item) return;
    await this.fetchHistory(item.id);
    this.setState({ showHistoryModal: true });
  };

  handleSave = async () => {
    const { editId, inputValue, selectedDistrict, postalcode } = this.state;

    if (!selectedDistrict) {
      alert("Please select a district.");
      return;
    }

    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}editCity/${editId}`, {
          name: inputValue,
          district_id: selectedDistrict.value,
          postalcode,
        });
        this.fetchCities(); // refresh list
      } else {
        await api.post(`${this.apiBaseUrl}addcities`, {
          name: inputValue,
          district_id: selectedDistrict.value,
          postalcode,
        });
        this.fetchCities(1); // go to first page
      }

      this.setState({
        showModal: false,
        inputValue: "",
        postalcode: "",
        selectedDistrict: null,
        editId: null,
      });
    } catch (error) {
      console.error("Error saving city:", error.response?.data || error);
    }
  };

  confirmDelete = (id) => {
    this.setState({ deleteId: id, showDeleteConfirm: true });
  };

  handleDelete = async () => {
    const { deleteId, isActive } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}deleteCity/${deleteId}`);
      toast.success(
        isActive === "active"
          ? "Inactivated successfully"
          : "Activated successfully"
      );
      this.setState({ showDeleteConfirm: false }, this.fetchCities);
    } catch (error) {
      console.error("Error deleting city:", error);
    }
  };

  cancelDelete = () => {
    this.setState({ showDeleteConfirm: false, deleteId: null });
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    const { isActive } = this.state;

    // reset other search fields
    [
      "city_name",
      "district_name",
      "country_name",
      "created_at",
      "updated_at",
    ].forEach((id) => {
      if (id !== name) {
        const ele = document.getElementById(id);
        if (ele) ele.value = "";
      }
    });

    try {
      const res = await api.get(`${this.apiBaseUrl}getAllCities`, {
        params: {
          name,
          search: value,
          status: isActive,
          page: 1,
          limit: this.itemsPerPage,
        },
      });
      this.setState({
        cities: res.data.cities || [],
        totalCities: res.data.total || 0,
        currentPage: 1,
      });
    } catch (error) {
      console.error("Error searching cities:", error);
    }
  };

  resetSearch = () => {
    [
      "city_name",
      "district_name",
      "country_name",
      "created_at",
      "updated_at",
    ].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      cities,
      showModal,
      inputValue,
      showDeleteConfirm,
      showHistoryModal,
      currentPage,
      totalCities,
      isActive,
      history,
      editId,
      selectedDistrict,
    } = this.state;
    const totalPages = Math.ceil(totalCities / this.itemsPerPage);

    return (
      <React.Fragment>
        <Head>
          <title>City | List</title>
        </Head>
        <h6 className="fw-bold mb-3">City List</h6>
        <div className="poppins-font">
          <Container fluid>
            <div className="district-header-section">
              <p
                className="breadcrumb-text"
                title="History"
                breadcrumbItem="Activity Log"
              />

              <div className="d-flex justify-content-end my-2">
                <Button
                  variant="dark"
                  onClick={() => this.toggleForm()}
                  className="add-district-btn"
                >
                  Add New City
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
                  {/* <option value="all">All</option> */}
                  <option value="active">Active</option>
                  <option value="inactive">In Active</option>
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
                              City
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
                              District
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
                              Country
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
                      {cities.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.district_name}</td>
                          <td>{item.country_name}</td>
                          <td>{this.formatDate(item.created_at)}</td>
                          <td>{this.formatDate(item.updated_at)}</td>
                          <td className="status text-center">
                            <button onClick={() => this.toggleForm(item)}>
                              <span className="la la-pencil"></span>
                            </button>

                            <button
                              onClick={() => this.confirmDelete(item.id)}
                              className="mx-3"
                            >
                              {item.status === "active" ? (
                                <span className="la la-times-circle text-danger"></span>
                              ) : (
                                <span className="la la-check-circle text-success"></span>
                              )}
                            </button>

                            <button onClick={() => this.toggleHistory(item)}>
                              <span className="la la-history"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Container>
        </div>
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
              {editId ? "Edit City" : "Add New City"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ paddingTop: "0.5rem" }}>
            <label style={{ marginBottom: "0.25rem" }}>District</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={this.loadDistricts}
              value={selectedDistrict}
              onChange={(selectedDistrict) =>
                this.setState({ selectedDistrict })
              }
              placeholder="Select District"
              className="mb-2"
            />

            <label>City Name</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => this.setState({ inputValue: e.target.value })}
              placeholder="Enter city name"
              className="form-control"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={this.handleSave}
              disabled={!inputValue || !selectedDistrict}
            >
              Save
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation */}
        <Modal show={showDeleteConfirm} onHide={this.cancelDelete} centered>
          <Modal.Header closeButton style={{ paddingBottom: "0.25rem" }}>
            <Modal.Title style={{ fontSize: "1rem", marginBottom: 0 }}>
              Confirm {isActive === "active" ? "Inactivate" : "Activate"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{ paddingTop: "0.5rem", paddingBottom: "0.75rem" }}
          >
            Are you sure you want to {isActive} this Districts?
          </Modal.Body>

          <Modal.Footer style={{ paddingTop: "0.5rem" }}>
            <Button variant="danger" onClick={this.handleDelete}>
              {isActive === "active" ? "Inactivate" : "Activate"}
            </Button>
          </Modal.Footer>
        </Modal>
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
            {(Array.isArray(history) ? history : []).map((item, idx) => (
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
                by{" "}
                <em>
                  <strong>{item.changed_by_name}</strong>
                </em>{" "}
                on {this.formatDate(item.changed_at)}
              </div>
            ))}
          </Modal.Body>
        </Modal>
      </React.Fragment>
    );
  }
}

export default City;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Pagination from "../common/pagination.jsx";
// import AsyncSelect from "react-select/async";
// import api from '../lib/api.jsx';

// const City = () => {
//   const [cities, setCities] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [inputValue, setInputValue] = useState("");
//   const [postalcode, setPostalcode] = useState("");
//   const [editId, setEditId] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//     const [showHistoryModal, setShowHistoryModal] = useState(false);
//     const [history, setHistory] = useState(null);
//   // Selected dropdowns (objects: {label, value})
//   const [selectedDistrict, setSelectedCountry] = useState(null);
//   const [selectedDistrict, setSelectedDistrict] = useState(null);

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 15;
//   const [totalCities, setTotalCities] = useState(0);
//   const totalPages = Math.ceil(totalCities / itemsPerPage);
//   const [isActive, setIsActive] = useState("active");

//   const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

//   // ------------------ Loaders for AsyncSelect ------------------ //
//   const loadCountries = async (inputValue) => {
//     try {
//       const res = await axios.get(`${apiBaseUrl}country/getallCountries`, {
//         params: { search: inputValue || "", page: 1, limit: 15 },
//       });
//       return res.data.countries.map((c) => ({
//         label: c.name,
//         value: c.id,
//       }));
//     } catch (error) {
//       console.error("Error loading countries:", error);
//       return [];
//     }
//   };

//   const loadDistricts = async (inputValue) => {
//     if (!selectedDistrict?.value) return [];
//     try {
//       const res = await axios.get(`${apiBaseUrl}getalldistricts`, {
//         params: {
//           country_id: selectedDistrict.value,
//           search: inputValue || "",
//           page: 1,
//           limit: 15,
//         },
//       });
//       return res.data.districts.map((d) => ({
//         label: d.name,
//         value: d.id,
//       }));
//     } catch (error) {
//       console.error("Error loading districts:", error);
//       return [];
//     }
//   };

//   // ------------------ Fetch Cities ------------------ //
//   const fetchCities =  async (page = currentPage, status = isActive) =>  {
//     if (selectedDistrict?.value) {
//       axios
//         .get(
//           `${apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}?page=${currentPage}&limit=${itemsPerPage}`
//         )
//         .then((response) => {
//           setCities(response.data.cities);
//           setTotalCities(response.data.total);
//         })
//         .catch((error) =>
//           console.error("Error fetching cities by district:", error)
//         );
//     } else {
//       axios
//         .get(`${apiBaseUrl}getallcities?page=${currentPage}&limit=${itemsPerPage}&status=${isActive}`)
//         .then((response) => {
//           setCities(response.data.cities);
//           setTotalCities(response.data.total);
//         })
//         .catch((error) => console.error("Error fetching all cities:", error));
//     }
//   };

//    useEffect(() => {
//              fetchCities();
//              resetSearch();
//            }, [currentPage, isActive]);

//   // ------------------ Modal Toggle ------------------ //
//   const toggleForm = (item = null) => {
//     if (item) {

//       setEditId(item.id);
//       setInputValue(item.name);

//       // Preselect country + district as objects
//       setSelectedCountry(
//         item.country_id ? { value: item.country_id, label: item.country_name } : null
//       );
//       setSelectedDistrict(
//         item.district_id ? { value: item.district_id, label: item.district_name } : null
//       );
//     } else {
//       setEditId(null);
//       setInputValue("");
//       setPostalcode("");
//       setSelectedCountry(null);
//       setSelectedDistrict(null);
//     }
//     setShowModal(true);
//   };

//   // ------------------ Save ------------------ //
//   const handleSave = async () => {
//     try {
//       if (!selectedDistrict?.value || !selectedDistrict?.value) {
//         alert("Please select a country and district.");
//         return;
//       }

//       if (editId) {
//         await api.put(`${apiBaseUrl}editCity/${editId}`, {
//           name: inputValue,
//           district_id: selectedDistrict.value,
//         });
//         setCities((prev) => prev.map((city) =>
//           city.id === editId ? {...city, name: inputValue, district_id: selectedDistrict.value, district_name: selectedDistrict.label, country_id: selectedDistrict.value, country_name: selectedDistrict.label } : city
//         ))
//       } else {
//         await api.post(`${apiBaseUrl}addcities`, {
//           name: inputValue,
//           postalcode,
//           district_id: selectedDistrict.value,
//         });
//         fetchCities();

//       }

//       setShowModal(false);
//       setInputValue("");
//       setEditId(null);
//       setSelectedCountry(null);

//       setSelectedDistrict(null);
//     } catch (error) {
//       console.error("Error saving city:", error);
//     }
//   };

//   // ------------------ Delete ------------------ //
//   const confirmDelete = (id) => {
//     setDeleteId(id);
//     setShowDeleteConfirm(true);
//   };

//   const handleDelete = async () => {
//     try {
//       await api.delete(`${apiBaseUrl}deleteCity/${deleteId}`);
//       setShowDeleteConfirm(false);
//       setDeleteId(null);
//       fetchCities();
//     } catch (error) {
//       console.error("Error deleting city:", error);
//     }
//   };

//   const cancelDelete = () => {
//     setShowDeleteConfirm(false);
//     setDeleteId(null);
//   };

//   const fetchHistory = async (id) => {
//         if (!id) return;
//         try {
//             const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}dbadminhistory`, {
//                 params: { entity_type: "city", entity_id: id }
//             });

//             setHistory(res.data);
//         } catch (error) {
//             console.error("Error fetching history:", error);
//         }
//     }
//     const toggleHistory = (item = null) => {
//         if (item) {
//             fetchHistory(item.id);
//         }
//         setShowHistoryModal(true);
//     }

//     const handleSearch = async (e) => {
//          const {name, value} = e.target;
//          setCurrentPage(1);
//           const inputs = ["name", "district", "country", "created_at", "updated_at"];
//           inputs.forEach((input) => {
//             if(input !== name) {
//               const ele = document.getElementById(input);
//               if(ele) ele.value = "";
//             }
//           })
//         try {
//           const res = await axios.get(`${apiBaseUrl}getallcities`, {
//             params: {
//               name,
//               search: value,
//               status: isActive,
//               page: 1,
//               limit: itemsPerPage,
//             }
//           });

//           setCities(res.data.cities);
//           setTotalCities(res.data.total);
//         } catch (error) {
//           console.error("error in search", error);
//         }
//       }

//           const resetSearch = () => {
//               document.getElementById("name").value = "";
//               document.getElementById("district").value = "";
//               document.getElementById("country").value = "";
//               document.getElementById("created_at").value = "";
//               document.getElementById("updated_at").value = "";
//           }

//           useEffect(() => {
//               resetSearch();
//           }, [isActive])

//   // ------------------ Render ------------------ //
//   return (
//     <>
//       <table className="default-table manage-job-table">
//         <thead>
//           <tr>
//             <th>
//               <div><input type="text" name="name" id="name" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
//               <div>City</div>
//               </th>
//             <th>
//               <div><input type="text" name="district" id="district" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
//               <div>District</div>
//               </th>

//             <th>
//               <div><input type="text" name="country" id="country" className="py-4 px-3 mb-3 w-100 rounded-4" onChange={(e) => handleSearch(e)} /></div>
//               <div>Country</div>
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
//           {cities?.map((item) => (
//                         <tr key={item.id}>
//                             <td>{item.name}</td>
//                             <td>{item.district_name}</td>
//                             <td>{item.country_name}</td>
//                             <td>{new Date(item.created_at).toISOString().split('T')[0]}</td>
//                             <td>{new Date(item.updated_at).toISOString().split('T')[0]}</td>
//                             <td className="status" style={{ padding: "21px 15px"}}>
//                                 <button onClick={() => toggleForm(item)}>
//                                     <span className="la la-pencil"></span>
//                                 </button>
//                                 <button onClick={() => confirmDelete(item.id)} className="mx-3">

//                                     {item.status === "active" ?
//                                         <span className="la la-times-circle" style={{ color: "red" }}></span> :
//                                         <span className="la la-check-circle" style={{ color: "green" }}></span>

//                                     }
//                                 </button>
//                                 <button onClick={() => toggleHistory(item)}>

//                                     <span className="la la-history"></span>
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//         </tbody>
//       </table>

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={(page) => setCurrentPage(page)}
//       />

//       {/* Add/Edit modal */}
//       {showModal && (
//         <div className="Modal-outer-div">
//           <div className="Modal-inner-div">
//             <h4>{editId ? "Edit City" : "Add City"}</h4>

//             <label>Country</label>
//             <AsyncSelect
//               cacheOptions
//               defaultOptions
//               loadOptions={loadCountries}
//               value={selectedDistrict}
//               onChange={(option) => {
//                 setSelectedCountry(option);
//                 setSelectedDistrict(null); // reset district
//               }}
//               placeholder="Select Country"
//               className="Modal-input"
//             />

//             <label>District</label>
//             <AsyncSelect
//               key={selectedDistrict?.value} // re-render when country changes
//               cacheOptions
//               defaultOptions
//               loadOptions={loadDistricts}
//               value={selectedDistrict}
//               onChange={(option) => setSelectedDistrict(option)}
//               placeholder="Select District"
//               isDisabled={!selectedDistrict}
//               className="Modal-input"
//             />

//             <label>City Name</label>
//             <input
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               placeholder="Enter City name"
//               className="Modal-input"
//             />

//             <div
//               style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}
//             >
//               <button
//                 className="Modal-cancel-button"
//                 onClick={() => setShowModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="Modal-save-button"
//                 onClick={handleSave}
//                 disabled={!selectedDistrict || !selectedDistrict || !inputValue}
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete confirmation modal */}
//       {/* Delete confirmation modal */}
//       {showDeleteConfirm && (
//         <div className="Modal-outer-div">
//           <div className="Modal-inner-div">
//             <h4>Confirm {isActive === "active" ? " In Activate" : " Activate"} </h4>
//             <p>Are you sure you want to {isActive} this City?</p>
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

//       {showHistoryModal && (
//                 <div className="modal fade show" style={{ display: "block" }}>
//                     <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
//                         <div className="modal-content">

//                             <div className="modal-header">
//                                 <h5 className="modal-title">History</h5>
//                                 <button
//                                     type="button"
//                                     className="btn-close"
//                                     onClick={() => setShowHistoryModal(false)}
//                                 ></button>
//                             </div>

//                             <div className="modal-body">
//                                 {history?.map((item, idx) => (
//                                     <div
//                                         key={item.id || idx}
//                                         className="p-2 mb-2 rounded"
//                                         style={{
//                                             backgroundColor: idx % 2 === 0 ? "#f8f9fa" : "#e9ecef",
//                                             border: "1px solid #dee2e6",
//                                             fontSize: "14px",
//                                         }}
//                                     >
//                                         <strong>{item.data.name}</strong> was{" "}
//                                         <span
//                                             style={{
//                                                 color:
//                                                     item.action === "ADDED"
//                                                         ? "green"
//                                                         : item.action === "UPDATED"
//                                                             ? "purple"
//                                                             : item.action === "ACTIVE"
//                                                                 ? "teal"
//                                                                 : "red",
//                                                 fontWeight: "bold",
//                                             }}
//                                         >
//                                             {item.action}
//                                         </span>{" "}
//                                         by <em>{item.changed_by_name}</em> on{" "}
//                                         {item.changed_at?.split("T")[0]}
//                                     </div>
//                                 ))} </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//     </>
//   );
// };

// export default City;
