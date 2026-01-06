import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const CertificateAwardsForm = ({ userId, certificateAwardsId, isEditMode, setCertificateAwardsData, onClose }) => {
    const [formData, setFormData] = useState({
        title: "",
        instituteName: "",
        passingYear: "",
        description: "",
        user_id: userId,
    });

    const [errors, setErrors] = useState({});



    const validateField = (name, value) => {
        let error = "";

        switch (name) {
            case "title":
                if (!value.trim()) {
                    error = "Title is required";
                } else if (!/^[A-Za-z\s]+$/.test(value)) {
                    error = "Title must contain only letters";
                }
                break;

            case "instituteName":
                if (!value.trim()) error = "Institute name is required";
                break;


            case "passingYear":
                if (!value) {
                    error = "Passing Year is required";
                }
                break;

            default:
                break;
        }

        setErrors((prev) => ({ ...prev, [name]: error }));
    };


    const validateForm = () => {
        let newErrors = {};

        Object.keys(formData).forEach((key) => {
            let error = "";
            const value = formData[key];

            switch (key) {
                case "title":
                    if (!value.trim()) {
                        error = "Title is required";
                    } else if (!/^[A-Za-z\s]+$/.test(value)) {
                        error = "Title must contain only letters";
                    }
                    break;
                case "instituteName":
                    if (!value.trim()) error = "Institute name is required";
                    break;

                case "passingYear":
                    if (!value) error = "Passing Year is required";
                    break;

                default:
                    break;
            }

            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };




    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
            user_id: userId,
        });
        validateField(name, value); // real-time validation
    };



    useEffect(() => {
        // Fetch the existing data if in edit mode
        // populates the form fields
        if (isEditMode && certificateAwardsId) {
            // Your API endpoint for fetching specific certificateAwards data
            const apiUrl = `http://localhost:8080/certificateAwards-get/${certificateAwardsId}`;

            const fetchData = async () => {
                try {
                    const response = await axios.get(apiUrl);
                    if (response.status === 200) {
                        console.log("ResponseData: ", response.data);
                        // Ensure the response.data structure matches the state structure
                        const {
                            title,
                            institute_name,
                            passing_year,
                            description,
                        } = response.data[0];

                        // Set the form data
                        setFormData({
                            title: title,
                            instituteName: institute_name,
                            passingYear: passing_year,
                            description: description,
                            user_id: userId,
                        });

                    } else {
                        console.error(
                            "Failed to fetch certificateAwards data:",
                            response.statusText
                        );
                    }
                } catch (error) {
                    console.error("Error:", error.message);
                }
            };

            fetchData();
        }
    }, [isEditMode, certificateAwardsId, userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            ...formData,
            passingYear: formData.passingYear
                ? (formData.passingYear instanceof Date
                    ? formData.passingYear.getFullYear()
                    : formData.passingYear) // if it's already a string/number, just use it
                : null
        };


        // Determine the API endpoint based on add or edit mode
        const apiUrl = isEditMode
            ? `http://localhost:8080/certificateAwards/${certificateAwardsId}`
            : "http://localhost:8080/certificateAwards";
        try {
            const response = isEditMode
                ? await axios.put(apiUrl, payload)
                : await axios.post(apiUrl, payload);

            if (response.status === 200) {
                if (isEditMode) {
                    toast.success("Updated Successfully!");
                    setCertificateAwardsData((prev) => prev.map((item) =>
                        item.id === response.data.id ? response.data : item
                    ));
                } else {
                    toast.success("Certification / Award is added Successfully!");

                    setCertificateAwardsData(prev => [...prev, response.data])

                }
                onClose();
            } else {
                console.error(
                    "Failed to add/update Certificate Awards record:",
                    response.statusText
                );
            }
        } catch (error) {
            console.error("Error:", error.message);
            toast.success("Form submission failed. Please try again.");
        }
    };


    useEffect(() => {
        console.log("Form Data:", formData);
    }, [formData])

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.6)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                className="no-scrollbar"
                style={{
                    background: "#fff",
                    borderRadius: 8,
                    maxWidth: "50vw",
                    maxHeight: "80vh",
                    padding: 32,
                    boxShadow: "0 2px 24px rgba(0,0,0,0.2)",
                    overflowY: "auto"
                }}
                onClick={(e) => e.stopPropagation()}
            >                <div style={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
                    <button
                        type="button"
                        style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", position: "absolute" }}
                        aria-label="Close"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>
                <div className="row">
                    <div className="text-center mt-5">
                        <h3>Certification & Award Form</h3>
                    </div>
                    <div className="col-lg-12 col-md-12 offset-lg-1 offset-md-1">
                        <div className="default-form" >
                            <div className="row">
                                <div className="form-group col-lg-10 col-md-10 ">
                                    <label>Certificate/Award Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="certificate or award name"
                                        onChange={handleChange}
                                        value={formData.title}
                                    />
                                    {errors.title && <small className="text-danger">{errors.title}</small>}
                                </div>
                                <div className="form-group col-lg-10 col-md-10 ">
                                    <label>Institute Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        name="instituteName"
                                        placeholder="Institute Name"
                                        onChange={handleChange}
                                        value={formData.instituteName}
                                    />
                                    {errors.instituteName && <small className="text-danger">{errors.instituteName}</small>}
                                </div>



                                <div className="form-group col-lg-10 col-md-10 certificate-date-field">
                                    <label>
                                        Passing Year <span className="text-danger">*</span>
                                    </label>

                                    <div className="input-with-icon">
                                        <DatePicker
                                            selected={formData.passingYear}
                                            onChange={(date) => {
                                                setFormData({ ...formData, passingYear: date });
                                                validateField("passingYear", date);
                                            }}
                                            showYearPicker
                                            dateFormat="yyyy"
                                            className="form-control"
                                            name="passingYear"
                                            placeholderText="2023"
                                            maxDate={new Date()}
                                        />

                                        <span className="la la-calendar calendar-icon"></span>
                                    </div>

                                    {errors.passingYear && <small className="text-danger">{errors.passingYear}</small>}

                                </div>

                                <div className="form-group  col-lg-10 col-md-10">
                                    <label>Certification/Award Description</label>
                                    <textarea
                                        name="description"
                                        placeholder="Description"
                                        onChange={handleChange}
                                        value={formData.description}
                                        rows={3}
                                        className="form-control no-scrollbar"
                                        style={{ resize: "vertical", overflow: "auto" }}
                                    />
                                </div>

                                <div className="form-group col-lg-12 col-md-12 ">
                                    <button
                                        type="button"
                                        className="theme-btn btn-style-one"
                                        onClick={handleSubmit} 
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateAwardsForm;
