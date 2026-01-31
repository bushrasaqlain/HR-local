"use client";

import React, { Component, createRef } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Button, Col, Container, Form } from "reactstrap";
import { Formik, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../components/lib/api.jsx";
// import Header from "../layout/header.jsx";
// import Footer from "../layout/footer.jsx";

class CandidateRegisterForm extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.formikRef = React.createRef();

    this.state = {
      step: 1, // current step

      formData: {
        // Step 1 - Personal Details
        full_name: "",
        phone: "",
        email: "",
        date_of_birth: "",
        gender: "",
        marital_status: "",
        total_experience: "",
        license_type: "",
        license_number: "",
        country: "",
        otherPreferredCities: [],
        district: "",
        city: "",
        speciality: "",
        degreeFieldData: [],
        address: "",
        education: [
          {
            degree: "",
            degreeTitle: "",
            degreeTitle_label: "",
            institutes: "",
            startDate: "",
            endDate: "",
            ongoing: false,
          },
        ],
        experience: [
          {
            companyName: "",
            designation: "",
            startDate: "",
            endDate: "",
            ongoing: false,
            id: null,
          },
        ],
        resume: null,
        availability: [
          {
            day: "",
            shift: "",
            startTime: "",
            endTime: "",
          },
        ],
      },
      fileData: { // 👈 add this
passport_photo: null,
resume: null,
},
      isNewImageUploaded: false,
      countries: [], // <-- move here
      districts: [], // <-- move here
      cities: [], // <-- move here
      skills: [], // <-- move here
      allCities: [],
      degree: [],
      degreeTitles: [], // { [degreeId]: [ {id, name} ] }
      degreeFieldData: [], // must exist
      editID: "",
      isEdit: false,
      getManager: [],
      getError: "",
      previewUrl: null,
      entries: [],
      editingIndex: null,
      shiftOptions: [
        { value: "morning", label: "Morning" },
        { value: "evening", label: "Evening" },
        { value: "night", label: "Night" },
      ],
      dayOptions: [
        { value: "Monday", label: "Monday" },
        { value: "Tuesday", label: "Tuesday" },
        { value: "Wednesday", label: "Wednesday" },
        { value: "Thursday", label: "Thursday" },
        { value: "Friday", label: "Friday" },
        { value: "Saturday", label: "Saturday" },
        { value: "Sunday", label: "Sunday" },
      ],
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Example options
    this.shiftOptions = [
      { value: "day", label: "Day Shift" },
      { value: "night", label: "Night Shift" },
      { value: "both", label: "Both" },
    ];
  }

  // Move to next/prev step
  nextStep = () => this.setState((prev) => ({ step: prev.step + 1 }));
  prevStep = () => this.setState((prev) => ({ step: prev.step - 1 }));

handleFileChange = (event, fieldName, setFieldValue) => {
  const file = event.target.files[0];
  if (!file) return;

  // 1️⃣ Formik
  setFieldValue(fieldName, file);

  // 2️⃣ Component state (THIS WAS MISSING)
  this.setState(prev => ({
    fileData: {
      ...prev.fileData,
      [fieldName]: file
    }
  }));
};
  loadCountries = async () => {
    try {
      // Set limit = 0 to fetch all countries
      const res = await api.get("/getallCountries", {
        params: { page: 1, limit: 0 },
      });

      // Depending on API response structure
      const countries = Array.isArray(res.data.countries)
        ? res.data.countries
        : res.data || [];

      this.setState({ countries });
    } catch (err) {
      console.error("Failed to load countries", err);
      toast.error("Could not load countries");
    }
  };

  loadDistricts = async (countryId) => {
    if (!countryId) {
      this.setState({ districts: [], cities: [] });
      return;
    }

    try {
      const res = await api.get("/getalldistricts", {
        params: { country_id: countryId }, // pass country filter if API supports it
      });

      const districts = Array.isArray(res.data)
        ? res.data
        : res.data.districts || res.data.results || [];

      this.setState({ districts, cities: [] }); // reset cities too
    } catch (err) {
      console.error("Failed to load districts", err);
      toast.error("Could not load districts");
    }
  };

  loadCities = async (districtId) => {
    if (!districtId) {
      this.setState({ cities: [] });
      return;
    }

    try {
      const res = await api.get(`/getCitiesByDistrict/${districtId}`);

      const cities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ cities });
    } catch (error) {
      console.error("Failed to load cities", error);
      toast.error("Could not load cities");
    }
  };

  loadAllCities = async () => {
    try {
      const res = await api.get("/getallCities");
      const allCities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ allCities });
    } catch (error) {
      console.error("Failed to load all cities", error);
      toast.error("Could not load cities");
    }
  };
  // Load speciality from API
  loadSpeciality = async () => {
    try {
      const res = await api.get("/getAllspeciality");

      // Extract the array from the object
      const specialityArray = Array.isArray(res.data.speciality)
        ? res.data.speciality
        : [];

      this.setState({ speciality: specialityArray });
    } catch (err) {
      console.error("Failed to load speciality", err);
      toast.error("Could not load speciality");
    }
  };
  loadLicenseTypes = async () => {
    try {
      const res = await api.get("/getAllLicenseTypes"); // your API endpoint

      const licenseArray = Array.isArray(res.data.licenseTypes)
        ? res.data.licenseTypes
        : res.data.results || []; // adjust if API returns results

      this.setState({ licenseTypes: licenseArray });
    } catch (err) {
      console.error("Failed to load license types", err);
      toast.error("Could not load license types");
    }
  };

  // Load skills from API
loadSkills = async () => {
    try {
      const res = await api.get("/getAllskills"); // replace with your endpoint
      const skillsArray = Array.isArray(res.data.skills) ? res.data.skills : [];
      this.setState({ skillsOptions: skillsArray });
    } catch (err) {
      console.error("Failed to load skills", err);
      toast.error("Could not load skills");
    }
  };

 fetchCandidateInfo = async () => {
  try {
    const token = localStorage.getItem("token");

    const [profileRes, eduRes, expRes] = await Promise.all([
      api.get("/candidateProfile/candidate", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      api.get(`${this.apiBaseUrl}candidateeducation/getallcandidateeducation`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      api.get(`${this.apiBaseUrl}candidateexperience/getexperience`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const data = profileRes.data || {};
    console.log("RAW backend data:", data);

    // Map availability from backend
const entriesFromBackend = (data.availabilityData || []).flatMap(daySlot =>
  (daySlot.shifts || []).map(shift => ({
    day: daySlot.day,
    shift: shift.shift,
    startTime: shift.startTime,
    endTime: shift.endTime,
  }))
);

    console.log("Mapped entries for table:", entriesFromBackend);

    const finalEntries = entriesFromBackend.length > 0
      ? entriesFromBackend
      : [{ day: "", shift: "", startTime: "", endTime: "" }];

    // Map education & experience
    const educationList = this.mapEducation(eduRes.data || []);
    const experienceList = this.mapExperience(expRes.data?.data || []);

    const mappedData = {
      ...this.state.formData,
      full_name: data.full_name ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      date_of_birth: data.date_of_birth
        ? new Date(data.date_of_birth).toISOString().slice(0, 10)
        : "",
      gender: data.gender ?? "",
      marital_status: data.marital_status ?? "",
      total_experience: data.total_experience ?? "",
      license_type: data.license_type ?? "",
      license_number: data.license_number ?? "",
       current_salary: data.current_salary ?? "",
      expected_salary: data.expected_salary ?? "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      // speciality: Array.isArray(data.speciality) ? data.speciality : [],
      otherPreferredCities: Array.isArray(data.otherPreferredCities) ? data.otherPreferredCities : [],
      country: data.country ? String(data.country) : "",
      district: data.district ? String(data.district) : "",
      city: data.city ? String(data.city) : "",
      address: data.address ?? "",
      passport_photoPreview: data.passport_photo
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${data.passport_photo}`
        : "",
      education: [{ degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false }, ...educationList],
      experience: [{ companyName: "", speciality: "", designation: "", startDate: "", endDate: "", ongoing: false }, ...experienceList],
      passport_photo: data.passport_photo || null, // ✅ keep DB value
resume: data.resume || null,
      resumePreviewUrl: data.resume
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${data.resume}`
        : "",
      availability: entriesFromBackend,
    };

    console.log("Final mapped formData:", mappedData);

    this.setState({
      formData: mappedData,
      entries: finalEntries,
    });

    // load dependent dropdowns
    if (mappedData.country) await this.loadDistricts(mappedData.country);
    if (mappedData.district) await this.loadCities(mappedData.district);

  } catch (err) {
    console.error("Fetch failed", err);
  }
};

  mapEducation = (list = []) =>
    list.map((edu) => ({
      id: edu.id,
      degree: edu.degree_id || "",
      degreeTitle: edu.degreefield_id || "",
      degreeTitle_label: edu.degreefield || "",
      institutes: edu.institute_id || "",
      institutes_label: edu.institute || "",
      startDate: edu.start_date
        ? new Date(edu.start_date).toISOString().slice(0, 10)
        : "",
      endDate: edu.end_date
        ? new Date(edu.end_date).toISOString().slice(0, 10)
        : "",
      ongoing: edu.is_ongoing === 1,
    }));

  mapExperience = (list = []) =>
    list.map((exp) => ({
      id: exp.id,
      designation: exp.designation || "",
      speciality_id: exp.speciality_id || "",
      companyName: exp.company_name || "",
      startDate: exp.start_date
        ? new Date(exp.start_date).toISOString().slice(0, 10)
        : "",
      endDate: exp.end_date
        ? new Date(exp.end_date).toISOString().slice(0, 10)
        : "",
      ongoing: exp.is_ongoing === 1,
    }));

  loadDegrees = async () => {
    try {
      const res = await api.get("/getalldegreetype");

      const degreeArray = Array.isArray(res.data?.degreetypes)
        ? res.data.degreetypes
        : [];

      this.setState({ degreeFieldData: degreeArray });
    } catch (err) {
      console.error("Failed to load degreeFieldData", err);
      toast.error("Could not load degreeFieldData");
      this.setState({ degreeFieldData: [] });
    }
  };

  loadInstitutes = async (inputValue) => {
    try {
      const res = await api.get("/institute/getallInstitute", {
        params: {
          search: inputValue || "",
          status: "Active",
        },
      });

      const institutes = Array.isArray(res.data?.institutes)
        ? res.data.institutes
        : [];

      return institutes.map((inst) => ({
        label: inst.name, // MUST exist
        value: inst.id, // MUST exist
      }));
    } catch (err) {
      console.error("Institute load failed:", err);
      return [];
    }
  };

  loadDegreeTitles = (degreeId) => async (inputValue) => {
    if (!degreeId) return [];

    const res = await api.get("/getDegreeFieldsDropdown", {
      params: {
        search: inputValue || "",
        degree_type_id: degreeId,
      },
    });

    return (res.data.degreefields || []).map((t) => ({
      value: t.id,
      label: t.name,
    }));
  };

  componentDidMount() {
    this.loadCountries();
    this.loadSkills();
    this.loadAllCities();
    this.loadSpeciality();
    this.loadLicenseTypes();
    this.loadInstitutes();
    this.loadDegrees();
    this.loadDegreeTitles();
    this.fetchCandidateInfo();
  }
  checkFileTypes(files) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return files.every((file) => allowedTypes.includes(file.type));
  }

  cvManagerHandler = (e) => {
    const file = e.target.files[0];

    this.setState({
      getManager: [file], // preview ke liye
    });

    this.formikRef.current.setFieldValue("resume", file);
  };

  deleteHandler = () => {
    this.setState((prevState) => ({
      getManager: [],
      formData: {
        ...prevState.formData,
        resume: null,
      },
    }));

    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = "";
    }
  };

handleSubmit = async (values, { setSubmitting }) => {
  try {
    const { step, fileData, formData, entries } = this.state;

    const payload = new FormData();

    // mode: save | submit
    payload.append("mode", step === 5 ? "submit" : "save");
    payload.append("current_step", step);

    /* ================= STEP 1 FIELDS ================= */
    const fields = [
      "full_name",
      "phone",
      "email",
      "date_of_birth",
      "gender",
      "marital_status",
      "license_type",
      "license_number",
      "total_experience",
      "speciality",
      "country",
      "district",
      "city",
      "address",
      "current_salary",
      "expected_salary",
    ];

    fields.forEach((field) => {
      const value = values[field];
      if (value !== undefined && value !== null) {
        payload.append(field, value);
      }
    });

    /* ================= ARRAY / JSON FIELDS ================= */
    if (values.skills?.length) {
      payload.append("skills", JSON.stringify(values.skills));
    }

    if (values.Links?.length) {
      payload.append("Links", JSON.stringify(values.Links));
    }

    if (values.otherPreferredCities?.length) {
      payload.append(
        "otherPreferredCities",
        JSON.stringify(values.otherPreferredCities),
      );
    }

    /* ================= AVAILABILITY ================= */
    if (Array.isArray(entries)) {
      payload.append("availability", JSON.stringify(entries));
    }

    /* ================= PASSPORT PHOTO ================= */
    if (fileData.passport_photo instanceof File) {
      // new file selected
      payload.append("passport_photo", fileData.passport_photo);
    } else if (formData.passport_photo) {
      // keep existing DB value
      payload.append("passport_photo", formData.passport_photo);
    }

    /* ================= RESUME ================= */
    if (fileData.resume instanceof File) {
      payload.append("resume", fileData.resume);
    } else if (formData.resume) {
      payload.append("resume", formData.resume);
    }

    /* ================= API CALL ================= */
    await api.post("/candidateProfile/candidate/passport-photo", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success(
      step === 5
        ? "Profile submitted successfully"
        : "Profile saved successfully",
    );
  } catch (error) {
    console.error("Submit Error:", error);
    toast.error("Something went wrong while saving profile");
  } finally {
    setSubmitting(false);
  }
};
handleSaveAndNext = async (values) => {
  try {
    // Base FormData for Step 1 only
    let formDataStep1 = null;
    if (this.state.step === 1) {
const formData = new FormData();
formData.append("mode", "save");
formData.append("current_step", this.state.step);


// Append regular fields
const fields = [
"full_name", "phone", "date_of_birth", "gender",
"marital_status", "license_type", "license_number",
"total_experience", "country",
"district", "city", "otherPreferredCities", "address",
"current_salary", "expected_salary"
];


fields.forEach((field) => {
const value = values[field];
if (Array.isArray(value)) {
formData.append(field, JSON.stringify(value));
} else if (value !== undefined && value !== null) {
formData.append(field, value);
}
});


// Skills
if (values.skills && Array.isArray(values.skills)) {
formData.append("skills", JSON.stringify(values.skills));
}


// Files
if (values.passport_photo instanceof File) {
formData.append("passport_photo", values.passport_photo);
console.log("Passport photo appended:", values.passport_photo);
}


if (values.resume instanceof File) {
formData.append("resume", values.resume);
console.log("Resume appended:", values.resume);
}


// Send to backend
await api.post(`${this.apiBaseUrl}candidateProfile/candidate/passport-photo`, formData, {
headers: {
Authorization: `Bearer ${localStorage.getItem("token")}`,
"Content-Type": "multipart/form-data",
},
});


toast.success("Step 1 saved successfully");
}

    // Step 2: Education
    if (this.state.step === 2) {
      const newRows = values.education
        .slice(1)
        .filter((e) => !e.id && e.degreeTitle && e.startDate);

      const editedRows = values.education
        .slice(1)
        .filter((e) => e.id && e.degreeTitle && e.startDate);

      // Edit existing rows
      if (this.state.isEdit && editedRows.length > 0) {
        await api.put(`${this.apiBaseUrl}candidateeducation/editcandidateeducation`, {
          education: editedRows,
        });
      }

      // Add new rows
      if (newRows.length > 0) {
        await api.post(`${this.apiBaseUrl}candidateeducation/addcandidateeducation`, {
          education: newRows,
          mode: "save",
        });
      }
    }

if (this.state.step === 3) {

  // Only rows that are REALLY new
const newExperiences = values.experience.slice(1)
  .filter(e => !e.id && e.companyName && e.designation && e.startDate)
  .map(e => ({
    ...e,
    speciality_id: e.speciality_id || null   // <-- use the correct field
  }));
  // UPDATE existing experience
  if (this.state.editexpID) {
    const editedRow = values.experience.find(e => e.id === this.state.editexpID);

if (editedRow) {
  await api.put(
    `${this.apiBaseUrl}candidateexperience/updateexperience/${this.state.editexpID}`,
    {
      ...editedRow,
      speciality_id: editedRow.speciality_id || null  // <-- use correct field
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
}
  }

  // ADD new experience
  if (newExperiences.length > 0) {
    await api.post(
      `${this.apiBaseUrl}candidateexperience/addexperience`,
      { experience: newExperiences },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // 🔥 MANDATORY: REFRESH FROM BACKEND
    const res = await api.get(
      `${this.apiBaseUrl}candidateexperience/getexperience`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // 🔥 Update source of truth
    this.setState({
      experienceData: res.data,
      editexpID: null,
    });
  }
}

    // Step 4: Resume
    if (this.state.step === 4) {
      if (values.resume && values.resume instanceof File) {
        const formData = new FormData();
        formData.append("resume", values.resume);

        const res = await api.post(`${this.apiBaseUrl}resume/addresume`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("Resume response:", res.data);
      } else {
        console.warn("No resume file found");
      }
    }

    // Step 5: Availability
    if (this.state.step === 5) {
      if (!this.state.entries || this.state.entries.length === 0) {
        toast.error("Please add at least one availability entry before proceeding");
        return;
      }

      const payload = {
        availability: this.state.entries.map(e => ({
          day: e.day,
          shift: e.shift,
          start_time: e.startTime,
          end_time: e.endTime,
        })),
      };

      await api.post(`${this.apiBaseUrl}candidate_availability/addavailability`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast.success("Availability saved successfully");
    }

    // Update state & move to next step
    this.setState({ formData: values, editID: null }, this.nextStep);
    toast.success("Saved");
  } catch (err) {
    console.error(err);
    toast.error("Save failed", err);
  }
};

  // Validation Schemas for each step
  stepSchemas = [
    Yup.object().shape({
      full_name: Yup.string()
        .trim()
        .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces")
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must be at most 50 characters")
        .required("Full name is required"),

      phone: Yup.string()
        .matches(
          /^(03\d{2}-\d{7}|0\d{2,3}-\d{7})$/,
          "Enter a valid Pakistani mobile or landline number",
        )
        .required("Contact number is required"),

      email: Yup.string().email("Invalid email").required("Required"),

      license_number: Yup.string()
        .trim()
        .matches(
          /^[A-Za-z0-9-\/]+$/,
          "License number can only contain letters, numbers, hyphens, or slashes",
        )
        .min(3, "License number must be at least 3 characters")
        .max(20, "License number must be at most 20 characters")
        .required("License number is required"),
    }),
    Yup.object().shape({
      education: Yup.array().min(2, "At least one education is required"), // because index 0 is draft
    }),
    Yup.object().shape({
      experience: Yup.array().of(
        Yup.object().shape({
          designation: Yup.string().required("Required"),
          companyName: Yup.string().required("Required"),
        }),
      ),
    }),
    Yup.object().shape({
      resume: Yup.mixed().required("Upload your resume"),
    }),
    Yup.object().shape({
      availability: Yup.array().of(
        Yup.object().shape({
          day: Yup.string().required("Required"),
          shift: Yup.string().required("Required"),
          startTime: Yup.string().required("Required"),
          endTime: Yup.string().required("Required"),
        }),
      ),
    }),
  ];

  renderStep = (values, setFieldValue) => {
    const { step, countries, districts, cities, skills } = this.state;

    switch (step) {
      case 1:
        return (
          <div>
            <h4>Step 1: Personal Details</h4>
            <div className="mb-3">
              <label>Upload Photo</label>

              <div className="d-flex align-items-center gap-3">
                <input
                  type="file"
                  name="passport_photo"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFieldValue("passport_photo", file);
                      const reader = new FileReader();
                      reader.onload = () =>
                        setFieldValue("passport_photoPreview", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="form-control"
                  style={{ maxWidth: "280px" }}
                />

                {values.passport_photoPreview && (
                  <div className="profile-photo-wrapper">
                    <img
                      src={values.passport_photoPreview}
                      alt="Profile"
                      className="profile-photo"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="row mb-3">
              {/* Full Name */}
              <div className="col-md-6">
                <label>Enter Full Name</label>
                <Field
                  name="full_name"
                  placeholder="Full Name"
                  className="form-control"
                />
                <ErrorMessage
                  name="full_name"
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label>Contact No.</label>
                <Field
                  name="phone"
                  placeholder="Phone"
                  className="form-control"
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

                    if (value.startsWith("03")) {
                      // Mobile: 03XX-XXXXXXX
                      if (value.length > 4) {
                        value = value.slice(0, 4) + "-" + value.slice(4, 11);
                      }
                      value = value.slice(0, 12); // max length 12
                    } else if (value.startsWith("0")) {
                      // Landline: 0XX-XXXXXXX or 0XXX-XXXXXXX
                      if (value.length > 3) {
                        value = value.slice(0, 3) + "-" + value.slice(3, 10);
                      }
                      if (value.length > 11) {
                        value = value.slice(0, 11);
                      }
                    }

                    setFieldValue("phone", value);
                  }}
                />

                <ErrorMessage
                  name="phone"
                  component="div"
                  className="text-danger"
                />
              </div>
            </div>
            {/* <div className="row mb-3">
      <div className="col-md-6">
        <label>Email</label>
                   <Field name="email" placeholder="Email" type="email" className="form-control" />
                <ErrorMessage name="email" component="div" className="text-danger" />
      </div>
      </div> */}
            <div className="row mb-3">
              {/* Full Name */}
              <div className="col-md-6">
                <label>Email</label>
                <Field
                  name="email"
                  readOnly
                  backgroundColor="gray"
                  placeholder="Email"
                  type="email"
                  className="form-control"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label>Date of Birth</label>
                <Field
                  name="date_of_birth"
                  type="date"
                  className="form-control"
                  placeholder="Date of Birth"
                />
              </div>
            </div>

            <div className="row mb-3">
              {/* Full Name */}
              <div className="col-md-6">
                <label>Gender</label>
                <Field as="select" name="gender" className="form-control">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Field>
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label>Marital Status</label>
                <Field
                  as="select"
                  name="marital_status"
                  className="form-control"
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                </Field>
              </div>
            </div>

            <div className="row mb-3">
              {/* Full Name */}
              <div className="col-md-6">
                <label>License Type</label>
                <Field
                  as="select" // Use select for dropdown
                  name="license_type" // Correct field name
                  className="form-control"
                  onChange={(e) =>
                    setFieldValue("license_type", e.target.value)
                  }
                >
                  <option value="">Select License Type</option>
                  {(this.state.licenseTypes || []).map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="license_type" // Fix error message binding
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label>License No.</label>
                <Field
                  name="license_number"
                  placeholder="License Number"
                  className="form-control"
                />
              </div>
            </div>
<div className="row mb-3">
  {/* Current Salary */}
  <div className="col-md-6">
    <label>Current Salary</label>
    <Field name="current_salary">
  {({ field, form }) => {
    const handleChange = (e) => {
      // Remove non-digit characters to get raw number
      const rawValue = e.target.value.replace(/\D/g, "");

      // Store plain number in Formik
      form.setFieldValue("current_salary", rawValue);

      // Update input value with commas for display
      e.target.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
      <input
        {...field}
        placeholder="Current Salary"
        className="form-control"
        onChange={handleChange}
      />
    );
  }}
</Field>

<ErrorMessage
  name="current_salary"
  component="div"
  className="text-danger"
/>
  </div>

  {/* Expected Salary */}
  <div className="col-md-6">
    <label>Expected Salary</label>
    <Field name="expected_salary">
  {({ field, form }) => {
    const handleChange = (e) => {
      // Remove non-digit characters for storage
      const rawValue = e.target.value.replace(/\D/g, "");

      // Store plain number in Formik (safe for INT column)
      form.setFieldValue("expected_salary", rawValue);

      // Show formatted number with commas for user
      e.target.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
      <input
        {...field}
        placeholder="Expected Salary"
        className="form-control"
        onChange={handleChange}
      />
    );
  }}
</Field>

<ErrorMessage
  name="expected_salary"
  component="div"
  className="text-danger"
/>
  </div>
</div>
            <div className="row mb-3">
              {/* Full Name */}
              <div className="col-md-6">
                <label>Total Experience</label>
                <Field
                  name="total_experience"
                  placeholder="Total Experience"
                  className="form-control"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* Phone */}
              
            </div>

            <div className="row mb-3">
              {/* Country */}
              <div className="col-md-6">
                <label>Country</label>
                <Field
                  as="select"
                  name="country"
                  className="form-control"
                  onChange={(e) => {
                    const countryId = e.target.value;

                    setFieldValue("country", countryId);
                    setFieldValue("district", "");
                    setFieldValue("city", "");

                    this.loadDistricts(countryId); // call with countryId
                  }}
                >
                  <option value="">Select Country</option>
                  {Array.isArray(this.state.countries) &&
                    this.state.countries.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                </Field>

                <ErrorMessage
                  name="country"
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* District */}
              <div className="col-md-6">
                <label>District</label>
                <Field
                  as="select"
                  name="district"
                  className="form-control"
                  onChange={(e) => {
                    const districtId = e.target.value; // string from select
                    setFieldValue("district", districtId);
                    setFieldValue("city", ""); // reset city
                    this.loadCities(districtId); // make sure API accepts string or convert to int
                  }}
                >
                  <option value="">Select District</option>
                  {Array.isArray(this.state.districts) &&
                    this.state.districts.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                </Field>

                <ErrorMessage
                  name="district"
                  component="div"
                  className="text-danger"
                />
              </div>
            </div>

            <div className="row mb-3">
              {/* City */}
              <div className="col-md-6">
                <label>City</label>
                <Field as="select" name="city" className="form-control">
                  <option value="">Select City</option>
                  {Array.isArray(this.state.cities) &&
                    this.state.cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Field>
                <ErrorMessage
                  name="city"
                  component="div"
                  className="text-danger"
                />
              </div>

              {/* Other Preferred Cities */}
              <div className="col-md-6">
                <label>Other Preferred Cities</label>
                <Select
                  isMulti
                  options={this.state.allCities.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={values.otherPreferredCities
                    .map((id) => {
                      const city = this.state.allCities.find(
                        (c) => c.id === id,
                      );
                      return city ? { value: city.id, label: city.name } : null;
                    })
                    .filter(Boolean)}
                  onChange={(selected) =>
                    setFieldValue(
                      "otherPreferredCities",
                      selected ? selected.map((o) => o.value) : [],
                    )
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              {/* Full Name */}
              <div>
                <label>Complete Address</label>
                <Field
                  as="textarea"
                  name="address"
                  placeholder="Complete Address"
                  className="form-control"
                />
                <ErrorMessage
                  name="address"
                  component="div"
                  className="text-danger"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h4>Step 2: Education</h4>

            <FieldArray name="education">
              {({ push, remove }) => {
                const draft =
                  values.education && values.education.length > 0
                    ? values.education[0]
                    : {
                        degree: "",
                        degreeTitle: "",
                        degreeTitle_label: "",
                        institutes: "",
                        startDate: "",
                        endDate: "",
                        ongoing: false,
                      };

                return (
                  <>
                    <div className="mb-4 border p-3 rounded">
                      <h6>Add / Edit Education</h6>

                      <div className="row mb-3">
                        {/* Degree */}
                        <div className="col-md-6">
                          <label>Degree</label>
                          <Field
                            as="select"
                            name="education.0.degree"
                            className="form-control"
                            onChange={(e) => {
                              const degreeId = e.target.value;
                              setFieldValue("education.0.degree", degreeId);
                              setFieldValue("education.0.degreeTitle", "");
                              setFieldValue(
                                "education.0.degreeTitle_label",
                                "",
                              );
                            }}
                          >
                            <option value="">Select Degree</option>
                            {this.state.degreeFieldData.map((d) => (
                              <option key={d.id} value={String(d.id)}>
                                {d.name}
                              </option>
                            ))}
                          </Field>
                        </div>

                        {/* Degree Title */}
                        <div className="col-md-6">
                          <label>Degree Title</label>
                          <AsyncSelect
                            key={draft.degree || "no-degree"}
                            cacheOptions={false}
                            defaultOptions
                            isDisabled={!draft.degree}
                            loadOptions={
                              draft.degree
                                ? this.loadDegreeTitles(Number(draft.degree))
                                : () => []
                            }
                            value={
                              draft.degreeTitle
                                ? {
                                    value: draft.degreeTitle,
                                    label: draft.degreeTitle_label,
                                  }
                                : null
                            }
                            onChange={(opt) => {
                              setFieldValue(
                                "education.0.degreeTitle",
                                opt?.value || "",
                              );
                              setFieldValue(
                                "education.0.degreeTitle_label",
                                opt?.label || "",
                              );
                            }}
                            placeholder="Select Degree Title"
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        {/* Institute */}
                        <div className="col-md-6">
                          <label>Institute</label>
                          <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={this.loadInstitutes}
                            value={
                              draft.institutes
                                ? {
                                    value: draft.institutes,
                                    label: draft.institutes_label,
                                  }
                                : null
                            }
                            onChange={(opt) =>
                              setFieldValue("education.0", {
                                ...draft,
                                institutes: opt?.value || "",
                                institutes_label: opt?.label || "",
                              })
                            }
                          />
                        </div>

                        {/* Start Date */}
                        <div className="col-md-6">
                          <label>Start Date</label>
                          <Field
                            type="date"
                            name="education.0.startDate"
                            className="form-control"
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        {/* End Date */}
                        <div className="col-md-6">
                          <label>End Date</label>
                          <Field
                            type="date"
                            name="education.0.endDate"
                            className="form-control"
                            disabled={draft.ongoing}
                          />
                        </div>

                        {/* Ongoing */}
                        <div className="col-md-6 d-flex align-items-center">
                          <div className="form-check mt-4">
                            <Field
                              type="checkbox"
                              name="education.0.ongoing"
                              className="form-check-input"
                            />
                            <label className="form-check-label">Ongoing</label>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!draft.degree || !draft.degreeTitle) {
                            toast.error("Please fill required fields");
                            return;
                          }
                          if (draft.id) {
                            // This is editing an existing row
                            const index = values.education.findIndex(
                              (e) => e.id === draft.id,
                            );
                            if (index > -1) {
                              // replace the edited row
                              setFieldValue(`education.${index}`, draft);
                            }
                          } else {
                            push({ ...draft });
                          }
                          setFieldValue("education.0", {
                            degree: "",
                            degreeTitle: "",
                            degreeTitle_label: "",
                            institutes: "",
                            startDate: "",
                            endDate: "",
                            ongoing: false,
                            id: null,
                          });
                          this.setState({ editID: null });
                        }}
                      >
                        Add More
                      </button>
                    </div>

                    {values.education.length > 1 && (
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Degree</th>
                            <th>Title</th>
                            <th>Institute</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {values.education.slice(1).map((edu, i) => (
                            <tr key={edu.id || i}>
                              <td>{edu.degreeTitle_label}</td>
                              <td>{edu.degreeTitle_label}</td>
                              <td>{edu.institutes_label}</td>
                              <td>{edu.startDate}</td>
                              <td>{edu.endDate || "-"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => {
                                    setFieldValue("education.0", {
                                      ...edu,
                                    });
                                    this.setState({
                                      editID: edu.id,
                                      isEdit: true,
                                    });
                                    remove(i + 1);
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    if (edu.id) {
                                      api
                                        .delete(
                                          `${this.apiBaseUrl}candidateeducation/deletecandidateeducation/${edu.id}`,
                                        )
                                        .then(() => {
                                          toast.success("Deleted");
                                          remove(i + 1);
                                        });
                                    } else {
                                      remove(i + 1); // just remove from form, not in DB
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                );
              }}
            </FieldArray>
          </div>
        );

case 3:
        return (
          <div>
            <h4>Step 3: Experience</h4>

            <FieldArray name="experience">
              {({ push, remove }) => {
                const draft =
                  values.experience && values.experience.length > 0
                    ? values.experience[0]
                    : {
                      companyName: "",
                      designation: "",
                      speciality_id: "",
                      startDate: "",
                      endDate: "",
                      ongoing: false,
                      id: null,
                    };

                return (
                  <>
                    <div className="mb-4 border p-3 rounded">
                      <h6>Add / Edit Experience</h6>

                      <div className="row mb-3">
                        {/* Company Name */}
                        <div className="col-md-6">
                          <label>Company Name</label>
                          <Field
                            type="text"
                            name="experience.0.companyName"
                            placeholder="Company Name"
                            className="form-control"
                          />
                        </div>

                        {/* Designation */}
                        <div className="col-md-6">
                          <label>Designation</label>
                          <Field
                            type="text"
                            name="experience.0.designation"
                            placeholder="Designation"
                            className="form-control"
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        {/* Speciality */}
                        <div className="col-md-6">
                          <label>Speciality</label>
                          <Field
                            as="select"
                            name="experience.0.speciality_id"
                            className="form-control"
                          >

                            <option value="">Select Speciality</option>
                            {Array.isArray(this.state.speciality) &&
                              this.state.speciality.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.name}
                                </option>
                              ))}
                          </Field>

                          <ErrorMessage
                            name="experience.0.speciality"
                            component="div"
                            className="text-danger"
                          />
                        </div>

                        {/* Start Date */}
                        <div className="col-md-6">
                          <label>Start Date</label>
                          <Field
                            type="date"
                            name="experience.0.startDate"
                            className="form-control"
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        {/* End Date */}
                        <div className="col-md-6">
                          <label>End Date</label>
                          <Field
                            type="date"
                            name="experience.0.endDate"
                            className="form-control"
                            disabled={draft.ongoing}
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>

                        {/* Ongoing */}
                        <div className="col-md-6 d-flex align-items-center">
                          <div className="form-check mt-4">
                            <Field
                              type="checkbox"
                              name="experience.0.ongoing"
                              className="form-check-input"
                            />
                            <label className="form-check-label">Ongoing</label>
                          </div>
                        </div>
                      </div>

                      <button
type="button"
className="btn btn-primary"
onClick={() => {
if (!draft.companyName || !draft.designation || !draft.startDate) {
toast.error("Please fill required fields");
return;
}


const experienceToPush = {
...draft,
speciality_id: draft.speciality_id ? Number(draft.speciality_id) : ""
};


if (this.state.editexpID) {
// Editing → push edited row
push({ ...experienceToPush, id: this.state.editexpID });
} else {
// New → push normally
push(experienceToPush);
}


// Reset draft
setFieldValue("experience.0", {
companyName: "",
designation: "",
speciality_id: "",
startDate: "",
endDate: "",
ongoing: false,
id: null,
});


// Clear edit ID
this.setState({ editexpID: null });
}}
>
Add More
</button>
                    </div>
                    <div className="mb-4 border p-3 rounded">
                      <h6>Add Skills</h6>

                      <div className="mb-4">

                        <label>Select Skills</label>
                        <Field name="skills">
                          {({ field, form }) => {
                            const handleChange = (selectedOptions) => {
                              // selectedOptions is array of { value, label }
                              const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                              form.setFieldValue("skills", values);
                            };

                            const selectedOptions = field.value?.map((val) => {
                              const skillObj = this.state.skillsOptions.find((s) => s.id === val);
                              return skillObj ? { value: skillObj.id, label: skillObj.name } : null;
                            }).filter(Boolean);

                            const options = Array.isArray(this.state.skillsOptions)
                              ? this.state.skillsOptions.map((s) => ({ value: s.id, label: s.name }))
                              : [];


                            return (
                              <Select
                                isMulti
                                value={selectedOptions}
                                onChange={handleChange}
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select skills"
                              />
                            );
                          }}
                        </Field>

                        <ErrorMessage name="skills" component="div" className="text-danger" />
                      </div>
                    </div>
                    {/* Table for existing experiences */}
                    {values.experience.length > 1 && (
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Company Name</th>
                            <th>Designation</th>
                            <th>Speciality</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {values.experience.slice(1).map((exp, i) => (
                            <tr key={exp.id || i}>
                              <td>{exp.companyName}</td>
                              <td>{exp.designation}</td>
                              <td>
                                {this.state.speciality.find((s) => s.id === exp.speciality_id)?.name || "-"}
                              </td>

                              <td>{exp.startDate}</td>
                              <td>{exp.endDate || "-"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => {
                                    // Load into draft
                                    setFieldValue("experience.0", { ...exp });

                                    // Remove from table immediately
                                    remove(i + 1);

                                    this.setState({
                                      editexpID: exp.id,
                                      isExpEdit: true
                                    });
                                  }}
                                >
                                  Edit
                                </button>


                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    if (exp.id) {
                                      api
                                        .delete(
                                          `${this.apiBaseUrl}candidateexperience/deleteexperience/${exp.id}`
                                        )
                                        .then(() => {
                                          toast.success("Deleted");
                                          remove(i + 1);
                                        });
                                    } else {
                                      remove(i + 1);
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                );
              }}
            </FieldArray>
          </div>
        );


      case 4:
        return (
          <div>
          {values.resumePreviewUrl && !values.resume && (
  <div className="file-preview text-center mb-3">
    <p>
      <strong>Uploaded Resume:</strong>{" "}
      <a
        href={values.resumePreviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-decoration-underline"
      >
        View Resume
      </a>
    </p>
  </div>
)}
  <h4 className="mb-3">Step 4: Upload CV</h4>

  <div className="text-danger text-center mb-2">
    Upload only .doc, .docx, .pdf format
  </div>

  {/* Resume Preview */}
  {values.resume && (
    <div className="file-preview text-center mb-3">
      <p>
        <strong>Selected File:</strong>{" "}
        <span
          className="text-primary"
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => {
            const fileURL = URL.createObjectURL(values.resume);
            window.open(fileURL, "_blank");
          }}
        >
          {values.resume.name}
        </span>

        <button
          type="button"
          className="btn btn-sm ms-2"
          onClick={() => setFieldValue("resume", null)}
        >
          <span className="la la-close"></span>
        </button>
      </p>
    </div>
  )}

  {/* Upload Section */}
  <div className="uploading-resume">
    <div className="uploadButton">
      <label className="cv-uploadButton position-relative w-100">
        <input
          type="file"
          name="resume"
          accept=".doc,.docx,application/msword,application/pdf"
          className="form-control position-absolute top-0 start-0 w-100 h-100 opacity-0"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setFieldValue("resume", file);
            }
          }}
        />

        <div className="text-center py-3 border rounded">
          <strong>Click here or drop file to upload</strong>
          <div className="text-muted small">
            Max 5MB | Allowed: (.doc, .docx, .pdf)
          </div>
        </div>
      </label>
    </div>
  </div>
</div>
        );

case 5:
  return (
    <div>
      <h4>Step 5: Availability</h4>

      {/* Days Multi-Select */}
      <div className="mb-2">
        <Select
          isMulti
          options={this.state.dayOptions}
          value={this.state.dayOptions.filter(o =>
            (this.state.currentEntry?.day ? [this.state.currentEntry.day] : []).includes(o.value)
          )}
          onChange={(selectedOptions) => {
            this.setState(prev => ({
              currentEntry: {
                ...prev.currentEntry,
                day: selectedOptions ? selectedOptions.map(o => o.value) : []
              }
            }));
          }}
          placeholder="Select Days (Friday, Sunday, Monday...)"
        />
      </div>

      {/* Shift Select */}
      <div className="mb-2">
        <Select
          options={this.state.shiftOptions}
          value={this.state.shiftOptions.find(o => o.value === this.state.currentEntry?.shift)}
          onChange={(option) => {
            this.setState(prev => ({
              currentEntry: { ...prev.currentEntry, shift: option.value }
            }));
          }}
          placeholder="Select Shift"
        />
      </div>

      {/* Start & End Time */}
      <div className="mb-2">
        <Field
          name="startTime"
          type="time"
          className="form-control"
          value={this.state.currentEntry?.startTime || ""}
          onChange={(e) => this.setState(prev => ({
            currentEntry: { ...prev.currentEntry, startTime: e.target.value }
          }))}
        />
      </div>

      <div className="mb-2">
        <Field
          name="endTime"
          type="time"
          className="form-control"
          value={this.state.currentEntry?.endTime || ""}
          onChange={(e) => this.setState(prev => ({
            currentEntry: { ...prev.currentEntry, endTime: e.target.value }
          }))}
        />
      </div>

      {/* Add Availability Button */}
      <button
        type="button"
        className="btn btn-primary mb-3"
        onClick={() => {
          const { currentEntry } = this.state;
          if (!currentEntry || !currentEntry.day || !currentEntry.shift || !currentEntry.startTime || !currentEntry.endTime) {
            alert("Please fill all fields");
            return;
          }

          // Add multiple days if multi-select
          const newEntries = currentEntry.day.map(dayValue => ({
            day: dayValue,
            shift: currentEntry.shift,
            startTime: currentEntry.startTime,
            endTime: currentEntry.endTime,
          }));

          this.setState(prev => {
  const updatedEntries = [...prev.entries, ...newEntries];

  return {
    entries: updatedEntries,
    formData: {
      ...prev.formData,
      availability: updatedEntries, // 🔑 sync here
    },
    currentEntry: { day: [], shift: "", startTime: "", endTime: "" },
  };
});
        }}
      >
        Add Availability
      </button>

      {/* Availability Table */}
      {this.state.entries.length > 0 && (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Day</th>
              <th>Shift</th>
              <th>Start</th>
              <th>End</th>
              <th>Action</th>
            </tr>
          </thead>
         <tbody>
  {this.state.entries.length > 0 ? (
    this.state.entries.map((e, i) => (
      <tr key={i}>
        <td>{e.day}</td>
        <td>{e.shift}</td>
        <td>{e.startTime}</td>
        <td>{e.endTime}</td>
        <td>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() =>
              this.setState(prev => ({
                entries: prev.entries.filter((_, idx) => idx !== i)
              }))
            }
          >
            Delete
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={5} className="text-center">No availability added</td>
    </tr>
  )}
</tbody>
        </table>
      )}

      {/* Save & Next */}
      <button
        type="button"
        className="btn btn-success mt-3"
        onClick={() => this.handleSaveAndNext({ ...this.state.formData, availability: this.state.entries })}
      >
        Save & Next
      </button>
    </div>
  );

      default:
        return null;
    }
  };
  // Add this function inside your class
  renderStepper = () => {
    const { step, formData } = this.state;
    console.log("data", formData);
    // Check if step is "filled" for clickability
    const isStepFilled = (stepNumber) => {
      switch (stepNumber) {
        case 1:
          return formData.full_name || formData.phone || formData.email;
        case 2:
          return formData.education
            .slice(1) // 👈 ignore draft row
            .some((edu) => edu.degreeTitle || edu.institutes);

        case 3:
          return formData.experience.some(
            (exp) => exp.designation || exp.companyName || exp.speciality_id,
          );
        case 4:
  return Boolean(formData.resume || formData.resumePreviewUrl);
        case 5:
          return formData.availability.some((av) => av.day || av.shift);
        default:
          return false;
      }
    };

    const stepNames = [
      "Personal Details",
      "Education",
      "Work Experience",
      "Upload CV",
      "Availability",
    ];

    return (
      <div
        className="d-flex flex-wrap justify-content-center mb-4"
        style={{ gap: "8px" }} // spacing between steps
      >
        {stepNames.map((name, index) => {
          const stepNumber = index + 1;
          const filled = isStepFilled(stepNumber);

          return (
            <div
              key={index}
              className={`step-indicator p-2 text-center ${
                step === stepNumber
                  ? "current-step"
                  : filled
                    ? "completed-step"
                    : "inactive-step"
              }`}
              style={{
                cursor: filled ? "pointer" : "default",
                flex: "1 1 120px", // minimum width + flexibility
                borderRadius: "5px",
                backgroundColor:
                  step === stepNumber
                    ? "#4CAF50"
                    : filled
                      ? "#a5d6a7"
                      : "#e0e0e0",
                color: step === stepNumber || filled ? "#fff" : "#000",
                minWidth: "120px", // ensures readable labels on mobile
              }}
              onClick={() => filled && this.setState({ step: stepNumber })}
            >
              <div style={{ fontWeight: "bold" }}>{stepNumber}</div>
              <div style={{ fontSize: "0.8rem" }}>{name}</div>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { step, formData } = this.state;

    return (
      <div className="p-5">
        <h1>Candidate Registration Form</h1>
        <Container
          className="mt-5 mb-5 p-5 bg-gray"
          style={{ backgroundColor: "#f0f5f7", borderRadius: "10px" }}
        >
          <div className="row justify-content-center mb-4">
            <Col xs="12" sm="12" md="10" lg="8" xl="6" xxl="5">
              {this.renderStepper()}
            </Col>
          </div>

            <Formik
              enableReinitialize={true}
              innerRef={this.formikRef}
              initialValues={formData}
              validationSchema={this.stepSchemas[step - 1]}
              onSubmit={this.handleSubmit}
            >
              {({ values, setFieldValue, handleSubmit }) => (
                <Form onSubmit={handleSubmit}>
                  {this.renderStep(values, setFieldValue)}

                  <div className="m-3 d-flex gap-2">
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={this.prevStep}
                      >
                        Previous
                      </button>
                    )}

                    {step < 5 && (
                      <>
                        {/* <Button
          className="btn-success"
          type="button"
          onClick={this.nextStep}
        >
          Next
        </Button> */}

                        <Button
                          type="button"
                          className="btn-info"
                          onClick={() => this.handleSaveAndNext(values)}
                        >
                          Save & Next
                        </Button>
                      </>
                    )}

                 {step === 5 && (
  <button
    type="submit"
    className="btn btn-primary"
    // disabled={!this.state.reviewed} // only enable if checkbox checked
  >
    Submit
  </button>
)}
                  </div>
                </Form>
              )}
            </Formik>
        </Container>
      </div>
    );
  }
}

export default CandidateRegisterForm;
