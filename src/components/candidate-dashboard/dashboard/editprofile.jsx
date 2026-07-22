import Head from "next/head";
import React, { Component } from "react";
// import * as faceapi from "face-api.js";
// import Select from "react-select";
import AsyncSelect from "react-select/async";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import { Modal } from "react-bootstrap";
// import ResearchStep from "./research";
import EducationStep from "./EducationStep";
import ExperienceStep from "./experience";
import CertificatesStep from "./certificates";
import AvailabilityStep from "./availabilty";
import ResumeStep from "./resume";
// import { FaPencilAlt } from "react-icons/fa"; // Font Awesome pencil
import {
  FaPencilAlt,
  FaLinkedin,
  FaFacebook,
  FaGithub,
  FaGlobe,
} from "react-icons/fa";
import Select, { components } from "react-select";
import {
  Card,
  CardBody,
  Container,
  Button,
  Input,
  Label,
  Progress,
} from "reactstrap";
import api from "../../lib/api";
let faceapi = null;
let faceapiLoaded = false;
const CustomOption = (props) => (
  <components.Option {...props}>
    <span style={{ marginRight: 8 }}>{props.data.icon}</span>
    {props.data.label}
  </components.Option>
);

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", error = false, disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          height: "38px",
          padding: "0 12px",
          fontSize: "14px",
          border: `1px solid ${open ? "#36565f" : error ? "#dc3545" : "#ced4da"}`,
          borderRadius: "6px",
          background: disabled ? "#e9ecef" : "#fff",
          color: selectedOption ? "#212529" : "#6c757d",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? "0 0 0 3px rgba(54,86,95,0.15)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "8px" }}>▾</span>
      </div>

      {open && !disabled && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
            background: "#fff", borderRadius: "6px", border: "1px solid #ced4da",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: "220px", overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: "8px 12px", fontSize: "14px", cursor: "pointer",
                  background: isSelected ? "#36565f" : "#fff",
                  color: isSelected ? "#fff" : "#212529",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#e6eeef"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

class EditProfile extends Component {
  constructor(props) {
    super(props);

    this.sectionsRef = {
      personalInfo: React.createRef(),
      links: React.createRef(),
      qualifications: React.createRef(),
      experience: React.createRef(),
      resume: React.createRef(),
      availability: React.createRef(),
      // research: React.createRef(),
      certificates: React.createRef(),
    };
    this.resumeInputRef = React.createRef();
    // Initialize state here
    this.state = {
      activeStep: 1,
      editableField: null,
      formData: {
        Links: [],
      },
      loading: false,
      isFaceDetecting: false,
      passportPhotoError: "", // 👈 add this
      showPersonalInfoModal: false,
      personalInfoErrors: {}, // <-- add this
      countries: [],
      districts: [],
      cities: [],
      licenseTypes: [],
      successMessage: "",
      errorMessage: "",
      currencies: [],
      jobPrefCities: [],
      jobPrefSuccessMessage: "",
      jobPrefErrorMessage: "",
      newJobTitle: "",
    };
  }

  // Add this inside the class but outside any method
  linkOptions = [
    {
      value: "linkedin",
      label: "LinkedIn",
      icon: <FaLinkedin color="#0A66C2" />,
    },
    {
      value: "facebook",
      label: "Facebook",
      icon: <FaFacebook color="#1877F2" />,
    },
    { value: "github", label: "GitHub", icon: <FaGithub /> },
    { value: "portfolio", label: "Portfolio", icon: <FaGlobe /> },
    { value: "website", label: "Website", icon: <FaGlobe /> },
  ];

  componentDidMount() {
    this.loadFaceModels().then(() => {
      this.fetchCandidateInfo();
      this.loadCountries();
      this.loadLicenseTypes();
    });
  }
  loadFaceModels = async () => {
    if (faceapiLoaded) return; // already loaded, skip

    // Dynamically import so it only runs in the browser
    faceapi = await import("@vladmandic/face-api");
    faceapiLoaded = true;

    const MODEL_URL = "/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  };

  detectFace = async (file) => {
    try {
      if (!faceapiLoaded || !faceapi) {
        await this.loadFaceModels();
      }

      const img = await faceapi.bufferToImage(file);

      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
      );

      return detections.length > 0;
    } catch (err) {
      console.error("Face detection error:", err);
      return false;
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
      this.setState({ errorMessage: "Could not load license types" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
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
      this.setState({ errorMessage: "Could not load countries" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  loadDistricts = async (countryId) => {
    if (!countryId) {
      this.setState({ districts: [], cities: [] });
      return;
    }

    const id = typeof countryId === "object" ? countryId?.id : countryId;
    if (!id) return;

    try {
      const res = await api.get("/getalldistricts", {
        params: { country_id: id, limit: 1000 },
      });

      const districts = Array.isArray(res.data.districts)
        ? res.data.districts
        : Array.isArray(res.data)
          ? res.data
          : [];

      this.setState({ districts, cities: [] });
    } catch (err) {
      console.error("Failed to load districts", err);
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
      this.setState({ errorMessage: "Could not load cities" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };
  fetchCandidateInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      this.setState({ loading: true });

      // Fetch all endpoints in parallel
      const [profileRes, eduRes, expRes, availRes, certRes] =
        await Promise.all([
          api.get("/candidateProfile/candidate", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/candidateeducation/getallcandidateeducation"),
          api.get("/candidateexperience/getexperience"),
          api.get("/candidate_availability/getavailability"),
          api.get("/candidateCertificate/getcertificate"),
          // api.get("/candidateResearch/getresearch", {
          //   params: { status: "Active" },
          // }),
        ]);

      const profile = profileRes.data || {};

      // Map education
      const educationList = Array.isArray(eduRes.data)
        ? eduRes.data.map((item) => ({
          id: item.id,
          degree: item.degreetype_id || null,
          degree_label: item.degreetype || "",
          degreeTitle: item.degreefield_id || null,
          degreeTitle_label: item.degreefield || "",
          institutes: item.institute_id || null,
          startDate: item.start_date ? item.start_date.split("T")[0] : "",
          endDate: item.end_date ? item.end_date.split("T")[0] : "",
          ongoing: Boolean(item.is_ongoing),
        }))
        : [];

      // Map experience
      const experienceList = Array.isArray(expRes.data?.data)
        ? expRes.data.data.map((item) => ({
          id: item.id,
          companyName: item.company_name || "",
          designation: item.designation || "",
          speciality_id: item.speciality_id || "",
          startDate: item.start_date || "",
          endDate: item.end_date || "",
          ongoing: Boolean(item.is_ongoing),
        }))
        : [];

      // Map availability
      const availabilityList = Array.isArray(availRes.data?.data)
        ? availRes.data.data
        : [];

      const entriesFromBackend = availabilityList.flatMap((daySlot) =>
        (daySlot.shifts || []).map((shift) => ({
          day: daySlot.day,
          shift: shift.shift,
          startTime: shift.startTime,
          endTime: shift.endTime,
        })),
      );

      // Map certificates
      const certificatesList = Array.isArray(certRes.data?.data)
        ? certRes.data.data.map((c) => ({
          id: c.id,
          title: c.title || "",
          file: null,
          hasExistingFile: !!c.document_path,
          filePreviewUrl: c.document_path
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/uploads/certificate/${c.document_path.split("\\").pop()}`
            : "",
        }))
        : [];

      // Map research
      // const researchList = Array.isArray(researchRes.data?.data)
      //   ? researchRes.data.data.map((r) => ({
      //     id: r.id,
      //     title: r.research_title,
      //     link: r.research_link || "",
      //     file: null,
      //     hasExistingFile: !!r.document_path,
      //     filePreviewUrl: r.document_path
      //       ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/uploads/research/${r.document_path.split("\\").pop()}`
      //       : "",
      //   }))
      //   : [];

      // Combine everything into formData
      const mappedData = {
        ...profile,
        Links: profile?.Links || [],
        education: educationList,
        experience: experienceList,
        availability: availabilityList,
        certificates: certificatesList,
        // research: researchList,
        passport_photoPreview: profile.passport_photo
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${profile.passport_photo}`
          : "",
        resume: profile.resume || null,
        availabilityEntries:
          entriesFromBackend.length > 0
            ? entriesFromBackend
            : [{ day: "", shift: "", startTime: "", endTime: "" }],
      };

      this.setState({
        formData: mappedData,
        entries:
          entriesFromBackend.length > 0
            ? entriesFromBackend
            : [{ day: "", shift: "", startTime: "", endTime: "" }],
        profileCompletion: profile.profile_completion_percent || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching candidate info:", error);
      this.setState({ loading: false });
      this.setState({ errorMessage: "Failed to load profile data" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  handleUpdate = async () => {
    const token = localStorage.getItem("token");
    const values = this.state.formData;

    try {
      this.setState({ loading: true });

      switch (this.state.activeStep) {
        /* ===================== STEP 1 – Personal Info + Links + Files ===================== */
        case 1: {
          const accountId = values.account_id;
          if (!accountId) throw new Error("Account ID missing");

          const formData = new FormData();

          const fields = [
            "full_name",
            "email",
            "phone",
            "date_of_birth",
            "gender",
            "marital_status",
            "license_type",
            "license_number",
            "current_salary",
            "expected_salary",
            "total_experience",
            "country",
            "district",
            "city",
            "address",
          ];

          fields.forEach((field) => {
            const value = values[field];

            if (value !== undefined && value !== null) {
              // Object fields → send ID only
              if (
                ["license_type", "country", "district", "city"].includes(field)
              ) {
                formData.append(field, value?.id || "");
              } else {
                formData.append(field, value);
              }
            }
          });

          // Links (JSON)
          if (Array.isArray(values.Links)) {
            formData.append("Links", JSON.stringify(values.Links));
          }
          console.log("passport_photo value:", values.passport_photo);
          console.log(
            "passport_photo is File:",
            values.passport_photo instanceof File,
          );

          // Files
          if (values.passport_photo instanceof File) {
            formData.append("passport_photo", values.passport_photo);
          }

          if (values.resume instanceof File) {
            formData.append("resume", values.resume);
          }

          await api.put(`/candidateProfile/${accountId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          break;
        }

        /* ===================== STEP 2 – Education ===================== */
        case 2: {
          const editedEducation = (values.education || []).filter((e) => e.id);

          if (editedEducation.length > 0) {
            await api.put(
              `${this.apiBaseUrl}candidateeducation/editcandidateeducation`,
              { education: editedEducation },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          }
          break;
        }

        /* ===================== STEP 3 – Experience ===================== */
        case 3: {
          if (this.state.editexpID) {
            const exp = (values.experience || []).find(
              (e) => e.id === this.state.editexpID,
            );

            if (exp) {
              await api.put(
                `${this.apiBaseUrl}candidateexperience/updateexperience/${exp.id}`,
                {
                  ...exp,
                  speciality_id: exp.speciality_id || null,
                },
                { headers: { Authorization: `Bearer ${token}` } },
              );
            }
          }
          break;
        }

        /* ===================== STEP 4 – Availability ===================== */
        case 4: {
          if (Array.isArray(values.availability)) {
            for (const item of values.availability) {
              if (item.id) {
                await api.put(
                  `${this.apiBaseUrl}candidate_availability/updateavailability/${item.id}`,
                  item,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
              }
            }
          }
          break;
        }

        /* ===================== STEP 5 – Research ===================== */
        // case 5: {
        //   const researchItems = values.research || [];

        //   for (const item of researchItems) {
        //     const formData = new FormData();

        //     formData.append("research_title", item.title || "");
        //     formData.append("research_link", item.link || "");

        //     if (item.file instanceof File) {
        //       formData.append("file", item.file);
        //     } else if (item.id && item.filePreviewUrl) {
        //       formData.append("keep_existing_file", "1");
        //     }

        //     if (item.id) {
        //       await api.put(
        //         `/candidateResearch/updateresearch/${item.id}`,
        //         formData,
        //         {
        //           headers: {
        //             Authorization: `Bearer ${token}`,
        //             "Content-Type": "multipart/form-data",
        //           },
        //         },
        //       );
        //     } else {
        //       await api.post(`/candidateResearch/addresearch`, formData, {
        //         headers: {
        //           Authorization: `Bearer ${token}`,
        //           "Content-Type": "multipart/form-data",
        //         },
        //       });
        //     }
        //   }
        //   break;
        // }

        /* ===================== STEP 6 – Certificates ===================== */
        case 6: {
          const editedCertificates = (values.certificates || []).filter(
            (c) => c.id,
          );

          if (editedCertificates.length > 0) {
            await api.put(
              `${this.apiBaseUrl}candidateCertificates/update`,
              { certificates: editedCertificates },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          }
          break;
        }

        default:
          break;
      }

      this.setState({ successMessage: "Updated successfully" });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
      this.fetchCandidateInfo();
      this.setState({ loading: false });
    } catch (err) {
      console.error("Update failed:", err);
      this.setState({ errorMessage: "Update failed" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      this.setState({ loading: false });
    }
  };

  handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      this.setState({ passportPhotoError: "Passport photo must be less than 5 MB" });
      e.target.value = "";
      return;
    }

    // Show loading state
    this.setState({
      loading: true,
      isFaceDetecting: true,
      passportPhotoError: "",
      successMessage: "",
      errorMessage: ""
    });

    try {
      // ✅ FACE VALIDATION
      const hasFace = await this.detectFace(file);

      if (!hasFace) {
        this.setState({
          passportPhotoError: "❌ No face detected! Please upload a clear face photo.",
          loading: false,
          isFaceDetecting: false,
        });
        e.target.value = "";
        return;
      }

      // ✅ OPTIONAL: multiple faces check (strict validation)
      const img = await faceapi.bufferToImage(file);
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 1) {
        this.setState({
          passportPhotoError: "❌ Multiple faces detected! Please upload a photo with only one face.",
          loading: false,
          isFaceDetecting: false,
        });
        e.target.value = "";
        return;
      }

      // ✅ Face detection successful
      this.setState({ passportPhotoError: "", isFaceDetecting: false });

      const reader = new FileReader();
      reader.onloadend = async () => {
        this.setState((prevState) => ({
          formData: {
            ...prevState.formData,
            passport_photo: file,
            passport_photoPreview: reader.result,
          },
        }));

        try {
          const token = localStorage.getItem("token");
          const accountId = this.state.formData.account_id;

          const formData = new FormData();
          formData.append("passport_photo", file);

          await api.put(`/candidateProfile/${accountId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          this.setState({
            successMessage: "✅ Photo updated successfully! Face verified.",
            loading: false,
          });

          // Clear success message after 3 seconds
          setTimeout(() => this.setState({ successMessage: "" }), 3000);

        } catch (err) {
          this.setState({
            errorMessage: "Failed to upload photo",
            loading: false,
          });
          setTimeout(() => this.setState({ errorMessage: "" }), 3000);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Face detection error:", err);
      this.setState({
        passportPhotoError: "Face detection failed. Please try again.",
        loading: false,
        isFaceDetecting: false,
      });
      e.target.value = "";
    }
  };

  handleAddLink = () => {
    this.setState({
      showLinkModal: true,
      newLink: { type: "", url: "" },
      editLinkIndex: null,
      linkErrors: null,
    });
  };

  openEditLinkModal = (index) => {
    const link = this.state.formData.Links[index];
    this.setState({
      showLinkModal: true,
      newLink: { ...link },
      editLinkIndex: index,
      linkErrors: null,
    });
  };

  handleSaveLink = async () => {
    const { newLink, editLinkIndex, formData } = this.state;
    const token = localStorage.getItem("token");

    // ✅ Validation
    if (!newLink.type || !newLink.url) {
      this.setState({ linkErrors: "Type and URL are required" });
      return;
    }

    // 1️⃣ Clone existing Links array
    const updatedLinks = [...(formData.Links || [])];

    if (editLinkIndex !== null) {
      updatedLinks[editLinkIndex] = { ...newLink };
    } else {
      updatedLinks.push({ ...newLink });
    }

    try {
      // 2️⃣ Persist immediately (JSON column)
      const apiForm = new FormData();
      apiForm.append("Links", JSON.stringify(updatedLinks));

      await api.put(`/candidateProfile/${formData.account_id}`, apiForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // 3️⃣ Update UI ONLY after success
      this.setState({
        formData: { ...formData, Links: updatedLinks },
        showLinkModal: false,
        newLink: { type: "", url: "" },
        editLinkIndex: null,
        linkErrors: null,
      });
    } catch (err) {
      console.error("Failed to save link:", err);
      this.setState({ linkErrors: "Failed to save link" });
    }
  };

  handleRemoveLink = (index) => {
    const { formData } = this.state;
    const updatedLinks = [...formData.Links];
    updatedLinks.splice(index, 1);
    this.setState({ formData: { ...formData, Links: updatedLinks } });
  };
  // ------------------- Add this inside the class -------------------
  formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // 18-Nov-2025
  };
  handleEdit = (field) => {
    this.setState({ editableField: field });
  };
  handleChange = (e, field) => {
    let value = e.target.value;

    // Restrict phone input to numbers and dash only
    if (field === "phone") {
      value = value.replace(/[^0-9-]/g, "");
    }

    // Live validation message
    let errorMsg = "";

    if (field === "email") {
      if (!value) {
        errorMsg = "Email is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) errorMsg = "Invalid email format";
      }
    }

    if (field === "phone") errorMsg = this.validatePakPhone(value);

    // DOB live validation
    if (field === "date_of_birth") {
      if (!value) {
        errorMsg = "Date of birth is required";
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        const minAgeDate = new Date();
        minAgeDate.setFullYear(today.getFullYear() - 15);

        if (selectedDate > minAgeDate) {
          errorMsg = "You must be at least 15 years old";
        }
      }
    }

    this.setState((prev) => ({
      formData: { ...prev.formData, [field]: value },
      personalInfoErrors: { ...prev.personalInfoErrors, [field]: errorMsg },
    }));
  };

  getMissingSteps = () => {
    const { formData } = this.state;
    const missing = {};

    // Personal info required
    const personalFields = [
      "full_name",
      "email",
      "phone",
      "date_of_birth",
      "gender",
      "marital_status",
      "license_type",
      "license_number",
      "current_salary",
      "expected_salary",
      // "total_experience",
      "country",
      "district",
      "city",
      "address",
    ];

    missing.personalInfo = personalFields.some((f) => {
      const val = formData[f];
      if (!val) return true;
      if (["license_type", "country", "district", "city"].includes(f))
        return !val?.id;
      return false;
    });

    // Other steps
    missing.links = !formData.Links || formData.Links.length === 0;
    missing.education = !formData.education || formData.education.length === 0;
    missing.experience =
      !formData.experience || formData.experience.length === 0;
    missing.resume = !formData.resume;
    missing.availability =
      !formData.availability || formData.availability.length === 0;
    // missing.research = !formData.research || formData.research.length === 0;
    missing.certificates =
      !formData.certificates || formData.certificates.length === 0;

    return missing;
  };

  renderField(label, field, required = false, options = []) {
    const { formData, isEditing } = this.state; // use global edit state

    let displayValue = formData[field] || "";

    // Format salary fields with commas
    if (
      (field === "current_salary" || field === "expected_salary") &&
      displayValue
    ) {
      displayValue = Number(displayValue).toLocaleString(); // 25000 → 25,000
    }
    // Format date
    if (field === "date_of_birth" && displayValue) {
      displayValue = this.formatDate(displayValue);
    }

    // Show license_type name instead of raw ID
    if (field === "license_type" && formData.license_type) {
      displayValue = formData.license_type.name || "";
    }

    // Map IDs to names for location fields
    if (field === "country" && formData.country?.name)
      displayValue = formData.country.name;
    if (field === "district" && formData.district?.name)
      displayValue = formData.district.name;
    if (field === "city" && formData.city?.name)
      displayValue = formData.city.name;

    return (
      <div className="mb-2">
        <Label className="fw-semibold mb-0">{label}</Label>
        <Input
          value={displayValue}
          readOnly={!isEditing} // now controlled by global edit button
          onChange={(e) => this.handleChange(e, field)}
        />
      </div>
    );
  }

  genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  maritalStatusOptions = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" },
  ];
  // Format number with commas
  formatNumberWithCommas = (num) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Remove commas to get raw number
  parseNumber = (str) => {
    return str.replace(/,/g, "");
  };
  validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Invalid email format";
    return "";
  };

  validatePakPhone = (phone) => {
    const pakPhoneRegex = /^(03\d{2}|0[2-9]\d)-\d{7}$/;
    if (!phone) return "Phone number is required";
    if (!pakPhoneRegex.test(phone))
      return "Invalid Pakistani phone number format";
    return "";
  };

  renderLinksStep() {
    const { formData, showLinkModal, newLink, linkErrors } = this.state;

    return (
      <>
        <h5 className="mb-3">Links</h5>
        <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
  Add your LinkedIn profile or other professional/social media links to strengthen your profile.
</p>

        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Type</th>
              <th>URL</th>
              <th style={{ width: "120px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.Links && formData.Links.length > 0 ? (
              formData.Links.map((link, index) => (
                <tr key={index}>
                  <td>{link.type}</td>
                  <td>
                    {link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm me-2"
                      style={{
                        background: "#36565F",
                        border: "#36565F",
                        color: "white",
                      }}
                      onClick={() => this.openEditLinkModal(index)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  No links added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          className="btn btn-outline-primary"
          onClick={this.handleAddLink}
          style={{ background: "#36565F", border: "#36565F", color: "white" }}
        >
          + Add Link
        </button>

        {/* ===== Add/Edit Link Modal ===== */}
        {showLinkModal && (
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {this.state.editLinkIndex !== null
                      ? "Edit Link"
                      : "Add Link"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => this.setState({ showLinkModal: false })}
                  ></button>
                </div>
                <div className="modal-body">
                  {linkErrors && (
                    <div className="text-danger mb-2">{linkErrors}</div>
                  )}

                  <div className="mb-3">
                    <Select
                      options={this.linkOptions}
                      components={{ Option: CustomOption }}
                      value={
                        this.linkOptions.find(
                          (o) => o.value === newLink.type,
                        ) || null
                      }
                      onChange={(selected) =>
                        this.setState({
                          newLink: { ...newLink, type: selected.value },
                        })
                      }
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? "#36565F" : base.borderColor,
                          boxShadow: state.isFocused ? "0 0 0 1px #36565F" : base.boxShadow,
                          "&:hover": {
                            borderColor: "#36565F",
                          },
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "#36565F"
                            : state.isFocused
                              ? "#e6eeef"
                              : "#fff",
                          color: state.isSelected ? "#fff" : "#212529",
                          cursor: "pointer",
                          "&:active": {
                            backgroundColor: "#36565F",
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 30,
                        }),
                      }}
                    />
                  </div>

                  <div className="mb-3 text-dark">
                    <label>URL</label>
                    <Input
                      type="url"
                      placeholder="https://"
                      value={newLink.url}
                      className="text-dark"
                      onChange={(e) =>
                        this.setState({
                          newLink: { ...newLink, url: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => this.setState({ showLinkModal: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: "#36565F", border: "#36565F" }}
                    onClick={this.handleSaveLink}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------------- STEP CONTENT ---------------- */

  renderStepContent() {
    switch (this.state.activeStep) {
      case 1:
        return (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Personal Information</h5>
              <Button
                // color="primary"
                className="p-1 custom-progress-bar"
                onClick={() =>
                  this.setState({ showPersonalInfoModal: true }, async () => {
                    const { formData } = this.state;
                    await this.loadCountries();
                    if (formData.country?.id)
                      await this.loadDistricts(formData.country.id);
                    if (formData.district?.id)
                      await this.loadCities(formData.district.id);
                    await this.loadLicenseTypes();
                  })
                }
              >
                <FaPencilAlt size={16} /> Edit
              </Button>
            </div>

            {this.renderField("Full Name", "full_name")}
            {this.renderField("Email", "email")}
            {this.renderField("Phone", "phone")}
            {this.renderField("Country", "country", true, this.state.countries)}
            {this.renderField("City", "city", true, this.state.cities)}
            {this.renderField(
              "District",
              "district",
              true,
              this.state.districts,
            )}
            {this.renderField("DOB", "date_of_birth")}
            {this.renderField("Gender", "gender")}
            {this.renderField("Marital Status", "marital_status")}
            {this.renderField("License Type", "license_type")}
            {this.renderField("License No", "license_number")}
            {this.renderField("Current Salary", "current_salary")}
            {this.renderField("Expected Salary", "expected_salary")}
            {/* {this.renderField("Total Experience", "total_experience")} */}
            {this.renderField("Address", "address")}
          </>
        );

      case 2:
        return this.renderLinksStep();

      case 3: // step number for Education
        return (
          <div ref={this.sectionsRef.qualifications}>
            <EducationStep />
          </div>
        );

      case 4:
        return (
          <div ref={this.sectionsRef.experience}>

            {/* ✅ Fresher Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1.5px solid ${this.state.formData?.is_fresher ? "#1D9E75" : "#e5e7eb"}`,
                background: this.state.formData?.is_fresher ? "#E1F5EE" : "#f8fafb",
                cursor: "pointer",
                marginBottom: "1.2rem",
                transition: "all 0.2s",
              }}
              onClick={async () => {
                const newVal = !this.state.formData?.is_fresher;

                // ✅ Update local state
                this.setState((prev) => ({
                  formData: { ...prev.formData, is_fresher: newVal },
                }));

                // ✅ Save to DB immediately
                try {
                  const token = localStorage.getItem("token");
                  const accountId = this.state.formData.account_id;
                  const fd = new FormData();
                  fd.append("is_fresher", newVal ? "1" : "0");

                  await api.put(`/candidateProfile/${accountId}`, fd, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "multipart/form-data",
                    },
                  });

                  this.setState({ successMessage: newVal ? "Marked as Fresher" : "Fresher status removed" });
                  setTimeout(() => this.setState({ successMessage: "" }), 2000);
                } catch (err) {
                  console.error("Fresher update failed:", err);
                  this.setState({ errorMessage: "Failed to update fresher status" });
                  setTimeout(() => this.setState({ errorMessage: "" }), 3000);
                  // Revert on error
                  this.setState((prev) => ({
                    formData: { ...prev.formData, is_fresher: !newVal },
                  }));
                }
              }}
            >
              {/* Toggle switch */}
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: this.state.formData?.is_fresher ? "#1D9E75" : "#d1d5db",
                position: "relative", flexShrink: 0, transition: "background 0.2s",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 2,
                  left: this.state.formData?.is_fresher ? 18 : 2,
                  transition: "left 0.2s",
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: this.state.formData?.is_fresher ? "#0F6E56" : "#1a1a1a" }}>
                  I am a Fresher
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                  {this.state.formData?.is_fresher
                    ? "✅ Marked as fresher — no work experience required"
                    : "Check this if you have no work experience"}
                </div>
              </div>
            </div>

            <ExperienceStep />
          </div>
        );

      case 5:
        return (
          <div ref={this.sectionsRef.resume}>
            <ResumeStep />
          </div>
        );

      case 6:
        return (
          <div ref={this.sectionsRef.availability}>
            <AvailabilityStep />
          </div>
        );
      // case 7:
      //   return (
      //     <div ref={this.sectionsRef.research}>
      //       <ResearchStep />
      //     </div>
      //   );

      case 7:
        return (
          <div ref={this.sectionsRef.certificates}>
            <CertificatesStep />
          </div>
        );

      default:
        return null;
    }
  }

  render() {
    const steps = [
      "Personal Info",
      "Links",
      "Qualifications",
      "Experience",
      "Resume",
      "Availability",
      // "Research",
      "Certificates",
    ];
    const { formData, personalInfoErrors } = this.state; // <-- add this line
    // 2️⃣ Add this line immediately after
    const profileImage =
      formData?.passport_photoPreview || // new file preview
      (typeof formData?.passport_photo === "string" &&
        formData.passport_photo.trim() !== ""
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${formData.passport_photo.replace(/^\//, "")}`
        : "/images/default-avatar.png");

    const profileresume =
      formData?.resume && formData.resume.trim() !== ""
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${formData.resume.replace(/^\//, "")}`
        : "/images/default-avatar.png";
    const missingSteps = this.getMissingSteps();
    return (
      <Container fluid className="py-4">
        <Head>
          <title>Edit Profile</title>
        </Head>

        {this.state.successMessage && (
          <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>{this.state.successMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
          </div>
        )}
        {this.state.errorMessage && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-x-circle-fill"></i>
            <span>{this.state.errorMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
          </div>
        )}
        {/* ---------- BACK BUTTON ABOVE EVERYTHING ---------- */}
        {this.props.onBack && (
          <div className="mb-3">
            <button
              className="btn custom-progress text-white"
              onClick={this.props.onBack}
            >
              &larr; Back
            </button>
          </div>
        )}

        <div className="row">
          {/* ---------- LEFT STEPPER ---------- */}
          <div className="col-md-3 mb-3">
            <Card className="shadow-sm">
              <CardBody>
                {/* -------- Profile Image -------- */}
                <div className="mb-3 text-center">
                  {/* <img
                    src={profileImage}
                    alt="Profile"
                    className="rounded-circle mb-2"
                    style={{
                      width: "110px",
                      height: "110px",
                      objectFit: "cover",
                      border: "2px solid #e5e7eb",
                    }}
                  /> */}

                  {/* Profile Image + Update */}
                  <div className="mb-3 text-center">
                    <div className="d-flex flex-column align-items-center gap-2">
                      <img
                        src={
                          this.state.formData?.passport_photoPreview ||
                          (this.state.formData?.passport_photo
                            ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/${this.state.formData.passport_photo.replace(/^\//, "")}`
                            : "/images/default-avatar.png")
                        }
                        alt="Profile"
                        style={{
                          width: "110px",
                          height: "110px",
                          objectFit: "cover",
                          borderRadius: "50%",
                          border: "2px solid #e5e7eb",
                          opacity: this.state.isFaceDetecting ? 0.5 : 1,
                        }}
                      />

                      {/* Loading spinner overlay */}
                      {this.state.isFaceDetecting && (
                        <div className="position-absolute" style={{ marginTop: "-55px" }}>
                          <div className="spinner-border text-primary" role="status" style={{ width: "40px", height: "40px" }}>
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* "Choose File" button */}
                      <label
                        htmlFor="profilePhotoInput"
                        className={`btn btn-sm custom-progress-bar text-white mt-2 ${this.state.isFaceDetecting ? 'disabled' : ''}`}
                        style={{ cursor: this.state.isFaceDetecting ? "not-allowed" : "pointer", opacity: this.state.isFaceDetecting ? 0.6 : 1 }}
                      >
                        {this.state.isFaceDetecting ? "🔍 Detecting face..." : "Update Photo"}
                      </label>
                      <input
                        type="file"
                        id="profilePhotoInput"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={this.handleProfilePhotoChange}
                        disabled={this.state.isFaceDetecting}
                      />
                    </div>
                    {this.state.passportPhotoError && (
                      <small className="text-danger mt-1 d-block">
                        {this.state.passportPhotoError}
                      </small>
                    )}
                    {this.state.isFaceDetecting && (
                      <small className="text-info mt-1 d-block">
                        ⏳ Analyzing photo... This may take a few seconds
                      </small>
                    )}
                  </div>
                </div>
                <h6 style={{ color: "#36565F" }}>
                  Profile Completion: {this.state.profileCompletion || 0}%
                </h6>
                <Progress
                  value={this.state.profileCompletion || 0}
                  className="mb-4"
                  barClassName="custom-progress-bar"
                  style={{ background: "#e9ecef" }} // Background track color
                />

                {steps.map((step, index) => {
                  let stepKey;
                  switch (index) {
                    case 0:
                      stepKey = "personalInfo";
                      break;
                    case 1:
                      stepKey = "links";
                      break;
                    case 2:
                      stepKey = "education";
                      break;
                    case 3:
                      stepKey = "experience";
                      break;
                    case 4:
                      stepKey = "resume";
                      break;
                    case 5:
                      stepKey = "availability";
                      break;
                    // case 6:
                    //   stepKey = "research";
                    //   break;
                    case 6:
                      stepKey = "certificates";
                      break;
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        cursor: "pointer",
                        color:
                          this.state.activeStep === index + 1
                            ? "#36565F"
                            : missingSteps[stepKey]
                              ? "#dc3545" // bootstrap danger color
                              : "#6c757d", // bootstrap muted color
                      }}
                      className={`mb-3 fw-${this.state.activeStep === index + 1 ? "bold" : "normal"}`}
                      onClick={() => this.setState({ activeStep: index + 1 })}
                    >
                      {index + 1}. {step}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </div>

          {/* ---------- RIGHT CONTENT ---------- */}
          <div className="col-md-9">
            <Card className="shadow-sm">
              <CardBody>
                {this.renderStepContent()}

                <div className="text-end mt-4">
                  {/* <Button
                    color="primary"
                    onClick={this.handleUpdate}
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? "Saving..." : "Save Changes"}
                  </Button> */}
                </div>
                <Modal
                  show={this.state.showPersonalInfoModal}
                  onHide={() => this.setState({ showPersonalInfoModal: false })}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Edit Personal Information</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="mb-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Full Name"
                        value={formData.full_name || ""}
                        onChange={(e) =>
                          this.setState({
                            formData: {
                              ...formData,
                              full_name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <Label>Email</Label>
                      <Input
                        placeholder="Email"
                        value={formData.email || ""}
                        onChange={(e) => this.handleChange(e, "email")}
                      />
                      {personalInfoErrors?.email && (
                        <div className="text-danger mt-1">
                          {personalInfoErrors.email}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <Label>Phone</Label>
                      <Input
                        type="text"
                        placeholder="Phone (e.g., 0314-9874562 or 051-4785963)"
                        value={formData.phone || ""}
                        onChange={(e) => this.handleChange(e, "phone")}
                      />
                      {personalInfoErrors?.phone && (
                        <div className="text-danger mt-1">
                          {personalInfoErrors.phone}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth || ""}
                        onChange={(e) => this.handleChange(e, "date_of_birth")}
                      />
                      {personalInfoErrors?.date_of_birth && (
                        <div className="text-danger mt-1">
                          {personalInfoErrors.date_of_birth}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <Label>Gender</Label>
                      {this.state.personalInfoErrors?.gender && (
                        <div className="text-danger mb-1">{this.state.personalInfoErrors.gender}</div>
                      )}
                      <CustomSelect
                        options={this.genderOptions}
                        value={formData.gender || ""}
                        onChange={(val) =>
                          this.setState({
                            formData: { ...formData, gender: val },
                            personalInfoErrors: { ...this.state.personalInfoErrors, gender: "" },
                          })
                        }
                        placeholder="Select Gender"
                        error={!!this.state.personalInfoErrors?.gender}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>Marital Status</Label>
                      {this.state.personalInfoErrors?.marital_status && (
                        <div className="text-danger mb-1">{this.state.personalInfoErrors.marital_status}</div>
                      )}
                      <CustomSelect
                        options={this.maritalStatusOptions}
                        value={formData.marital_status || ""}
                        onChange={(val) =>
                          this.setState({
                            formData: { ...formData, marital_status: val },
                            personalInfoErrors: { ...this.state.personalInfoErrors, marital_status: "" },
                          })
                        }
                        placeholder="Select Marital Status"
                        error={!!this.state.personalInfoErrors?.marital_status}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>Address</Label>
                      <Input
                        value={formData.address || ""}
                        onChange={(e) =>
                          this.setState({
                            formData: { ...formData, address: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <Label>Country</Label>
                      {personalInfoErrors?.country && (
                        <div className="text-danger mb-1">{personalInfoErrors.country}</div>
                      )}
                      <CustomSelect
                        options={this.state.countries.map((c) => ({ value: c.id, label: c.name }))}
                        value={formData.country?.id || ""}
                        onChange={async (val) => {
                          const selected = this.state.countries.find((c) => String(c.id) === String(val));
                          this.setState((prev) => ({
                            formData: { ...prev.formData, country: selected || null, district: null, city: null },
                            districts: [],
                            cities: [],
                            personalInfoErrors: { ...prev.personalInfoErrors, country: "" },
                          }));
                          if (selected?.id) await this.loadDistricts(selected.id);
                        }}
                        placeholder="Select Country"
                        error={!!personalInfoErrors?.country}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>District</Label>
                      {personalInfoErrors?.district && (
                        <div className="text-danger mb-1">{personalInfoErrors.district}</div>
                      )}
                      <CustomSelect
                        options={this.state.districts.map((d) => ({ value: d.id, label: d.name }))}
                        value={formData.district?.id || ""}
                        onChange={async (val) => {
                          const selected = this.state.districts.find((d) => String(d.id) === String(val));
                          this.setState((prev) => ({
                            formData: { ...prev.formData, district: selected || null, city: null },
                            cities: [],
                            personalInfoErrors: { ...prev.personalInfoErrors, district: "" },
                          }));
                          if (selected?.id) await this.loadCities(selected.id);
                        }}
                        placeholder="Select District"
                        error={!!personalInfoErrors?.district}
                        disabled={!formData.country}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>City</Label>
                      {personalInfoErrors?.city && (
                        <div className="text-danger mb-1">{personalInfoErrors.city}</div>
                      )}
                      <CustomSelect
                        options={this.state.cities.map((c) => ({ value: c.id, label: c.name }))}
                        value={formData.city?.id || ""}
                        onChange={(val) => {
                          const selected = this.state.cities.find((c) => String(c.id) === String(val));
                          this.setState((prev) => ({
                            formData: { ...prev.formData, city: selected || null },
                            personalInfoErrors: { ...prev.personalInfoErrors, city: "" },
                          }));
                        }}
                        placeholder="Select City"
                        error={!!personalInfoErrors?.city}
                        disabled={!formData.district}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>License Type</Label>
                      {this.state.personalInfoErrors?.license_type && (
                        <div className="text-danger mb-1">{this.state.personalInfoErrors.license_type}</div>
                      )}
                      <CustomSelect
                        options={this.state.licenseTypes.map((l) => ({ value: l.id, label: l.name }))}
                        value={formData.license_type?.id || ""}
                        onChange={(val) => {
                          const selected = this.state.licenseTypes.find((l) => String(l.id) === String(val));
                          this.setState((prev) => ({
                            formData: { ...prev.formData, license_type: selected || null },
                            personalInfoErrors: { ...prev.personalInfoErrors, license_type: "" },
                          }));
                        }}
                        placeholder="Select License Type"
                        error={!!this.state.personalInfoErrors?.license_type}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>License Number</Label>
                      <Input
                        value={formData.license_number || ""}
                        onChange={(e) =>
                          this.setState({
                            formData: {
                              ...formData,
                              license_number: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <Label>Current Salary</Label>
                      {this.state.personalInfoErrors?.current_salary && (
                        <div className="text-danger mb-1">
                          {this.state.personalInfoErrors.current_salary}
                        </div>
                      )}
                      <Input
                        type="text"
                        placeholder="Current Salary"
                        value={this.formatNumberWithCommas(
                          formData.current_salary,
                        )}
                        onChange={(e) => {
                          // Allow only digits and commas while typing
                          const rawValue = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                          this.setState({
                            formData: { ...formData, current_salary: rawValue },
                            personalInfoErrors: {
                              ...this.state.personalInfoErrors,
                              current_salary: "",
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="mb-2">
                      <Label>Expected Salary</Label>
                      {this.state.personalInfoErrors?.expected_salary && (
                        <div className="text-danger mb-1">
                          {this.state.personalInfoErrors.expected_salary}
                        </div>
                      )}
                      <Input
                        type="text"
                        placeholder="Expected Salary"
                        value={this.formatNumberWithCommas(
                          formData.expected_salary,
                        )}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                          this.setState({
                            formData: {
                              ...formData,
                              expected_salary: rawValue,
                            },
                            personalInfoErrors: {
                              ...this.state.personalInfoErrors,
                              expected_salary: "",
                            },
                          });
                        }}
                      />
                    </div>

                    {/* <div className="mb-2">
                      <Label>Total Experience (Optional)</Label>
                      <Input
                        value={formData.total_experience || ""}
                        placeholder="Total Experience in years (e.g., 3)"
                        onChange={(e) =>
                          this.setState({
                            formData: {
                              ...formData,
                              total_experience: e.target.value,
                            },
                          })
                        }
                      />
                    </div> */}
                  </Modal.Body>

                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        this.setState({ showPersonalInfoModal: false })
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        const email = formData.email || "";
                        const phone = formData.phone || "";
                        const dob = formData.date_of_birth || "";
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        const pakPhoneRegex = /^(03\d{2}|0[2-9]\d)-\d{7}$/;

                        const errors = {};

                        // Email validation
                        if (!email) {
                          errors.email = "Email is required";
                        } else if (!emailRegex.test(email)) {
                          errors.email = "Invalid email format";
                        }

                        // Phone validation
                        if (!phone) {
                          errors.phone = "Phone number is required";
                        } else if (!pakPhoneRegex.test(phone)) {
                        }
                        // DOB validation
                        if (!dob) {
                          errors.date_of_birth = "Date of birth is required";
                        } else {
                          const selectedDate = new Date(dob);
                          const today = new Date();
                          const minAgeDate = new Date();
                          minAgeDate.setFullYear(today.getFullYear() - 15);

                          if (selectedDate > minAgeDate) {
                            errors.date_of_birth =
                              "You must be at least 15 years old";
                          }
                        }
                        if (!formData.gender) {
                          errors.gender = "Gender is required";
                        }

                        if (!formData.marital_status) {
                          errors.marital_status = "Marital status is required";
                        }

                        // If there are errors, set them and return
                        if (Object.keys(errors).length > 0) {
                          this.setState({ personalInfoErrors: errors });
                          return;
                        }

                        // ✅ No errors → save changes
                        // ✅ No errors → save changes
                        this.setState({ activeStep: 1 }, () => {
                          this.handleUpdate();
                          this.setState({
                            showPersonalInfoModal: false,
                            personalInfoErrors: {},
                          });
                        });
                      }}
                    >
                      Save Changes
                    </Button>
                  </Modal.Footer>
                </Modal>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    );
  }
}

export default EditProfile;