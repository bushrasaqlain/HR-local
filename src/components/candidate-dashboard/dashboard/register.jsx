"use client";

import React, { Component } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Form } from "reactstrap";
import { Helmet } from "react-helmet";
import { Formik, Field, FieldArray } from "formik";
import * as Yup from "yup";
import api from "../../lib/api";
import "bootstrap-icons/font/bootstrap-icons.css";
import ThemedTimeInput from "./ThemeTimeInput";

let faceapi = null;

const rsSelectStyles = {
  control: (b, state) => ({
    ...b,
    borderColor: state.isFocused ? "#36565f" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(54,86,95,0.13)" : "none",
    borderRadius: 7,
    fontSize: 14,
    minHeight: 38,
    "&:hover": { borderColor: "#36565f" },
  }),
  option: (b, state) => ({
    ...b,
    backgroundColor: state.isSelected ? "#36565f" : state.isFocused ? "#e6eeef" : "#fff",
    color: state.isSelected ? "#fff" : "#1a1a1a",
    cursor: "pointer",
  }),
  multiValue: (b) => ({ ...b, backgroundColor: "#e2f0f0" }),
  multiValueLabel: (b) => ({ ...b, color: "#36565f" }),
};

const StyledInput = (props) => <input {...props} className={`cr-field-input ${props.className || ""}`} />;
const StyledSelect = (props) => <select {...props} className={`cr-field-input cr-field-select ${props.className || ""}`} />;
const StyledTextarea = (props) => <textarea {...props} className={`cr-field-textarea ${props.className || ""}`} />;

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", disabled = false }) => {
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

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          height: "38px", padding: "0 12px", fontSize: "14px",
          border: `1px solid ${open ? "#36565f" : "#e5e7eb"}`,
          borderRadius: "7px", background: disabled ? "#e9ecef" : "#fff",
          color: selectedOption ? "#1a1a1a" : "#6c757d",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? "0 0 0 3px rgba(54,86,95,0.13)" : "none",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "8px" }}>▾</span>
      </div>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: "#fff", borderRadius: "7px", border: "1px solid #e5e7eb",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: "220px", overflowY: "auto",
        }}>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: "8px 12px", fontSize: "14px", cursor: "pointer",
                  background: isSelected ? "#36565f" : "#fff",
                  color: isSelected ? "#fff" : "#1a1a1a",
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

// Formik-bound wrapper so we don't repeat <Field><CustomSelect/></Field> everywhere
const FormikCustomSelect = ({ name, options, placeholder, onExtraChange, disabled = false }) => (
  <Field name={name}>
    {({ field, form }) => (
      <CustomSelect
        options={options}
        value={field.value}
        disabled={disabled}
        onChange={(val) => {
          form.setFieldValue(name, val);
          if (onExtraChange) onExtraChange(val, form);
        }}
        placeholder={placeholder}
      />
    )}
  </Field>
);

const FieldWrap = ({ label, required, hint, error, children, span2 = false }) => (
  <div className={`cr-field-group ${span2 ? "span-2" : ""}`}>
    {label && (
      <label className="cr-field-label">
        {label}
        {required && <span className="required"> *</span>}
      </label>
    )}
    {children}
    {hint && <span className="cr-field-hint">{hint}</span>}
    {error && <span className="cr-field-error">{error}</span>}
  </div>
);

const Divider = ({ label }) => (
  <>
    <div className="cr-divider" />
    {label && <div className="cr-section-label">{label}</div>}
  </>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="2,8 6,12 14,4" />
  </svg>
);

const isDateOngoing = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) > new Date();
};

const EMPTY_FORM_DATA = {
  full_name: "",
  phone: "",
  email: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  total_experience: "",
  current_salary: "",
  expected_salary: "",
  license_type: "",
  license_number: "",
  country: "",
  otherPreferredCities: [],
  district: "",
  city: "",
  speciality: "",
  address: "",
  photoMessage: null,
  formMessage: null,
  skills: [],
  isFresher: false,
  education: [
    { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false, id: null },
  ],
  experience: [
    { companyName: "", speciality_id: "", designation: "", job_type_id: "", startDate: "", endDate: "", ongoing: false, id: null },
  ],
  resume: null,
  passport_photo: null,
  passport_photoPreview: "",
};

class CandidateRegisterForm extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.formikRef = React.createRef();

    this.state = {
      // "resume" (default landing) -> "form" (everything, prefilled or blank)
      phase: "form",

      formData: { ...EMPTY_FORM_DATA },
      fileData: { passport_photo: null, resume: null },
      countries: [],
      districts: [],
      cities: [],
      skillsOptions: [],
      allCities: [],
      degreeFieldData: [],
      licenseTypes: [],
      jobTypes: [],
      speciality: [],

      editID: "",
      isEdit: false,
      editexpID: "",
      isExpEdit: false,

      entries: [],
      currentEntry: { day: "", shift: "", startTime: "", endTime: "" },
      allShiftsTimings: {
        morning: { startTime: "09:00", endTime: "17:00" },
        evening: { startTime: "15:00", endTime: "23:00" },
        night: { startTime: "21:00", endTime: "06:00" },
      },
      isAllShiftsMode: false,

      photoMessage: null,
      formMessage: null,

      cvUploading: false,
      cvExtracted: null,
      isFaceDetecting: false,
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  /* ───────────────────────── lookups ───────────────────────── */

  loadCountries = async () => {
    try {
      const res = await api.get("/getallCountries", { params: { page: 1, limit: 0 } });
      const countries = Array.isArray(res.data.countries) ? res.data.countries : res.data || [];
      this.setState({ countries });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load countries" } });
    }
  };

  loadDistricts = async (countryId) => {
    if (!countryId) { this.setState({ districts: [], cities: [] }); return; }
    const id = typeof countryId === "object" ? countryId?.id : countryId;
    if (!id) return;
    try {
      const res = await api.get("/getalldistricts", { params: { country_id: id, limit: 1000 } });
      const districts = Array.isArray(res.data.districts) ? res.data.districts : Array.isArray(res.data) ? res.data : [];
      this.setState({ districts, cities: [] });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load districts" } });
    }
  };

  loadCities = async (districtId) => {
    if (!districtId) { this.setState({ cities: [] }); return; }
    const id = typeof districtId === "object" ? districtId?.id : districtId;
    if (!id) return;
    try {
      const res = await api.get(`/getCitiesByDistrict/${id}`);
      const cities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ cities });
    } catch (error) {
      this.setState({ formMessage: { type: "error", text: "Could not load cities" } });
    }
  };

  loadAllCities = async () => {
    try {
      const res = await api.get("/getallCities");
      const allCities = Array.isArray(res.data.cities) ? res.data.cities : [];
      this.setState({ allCities });
    } catch (error) {
      this.setState({ formMessage: { type: "error", text: "Could not load cities" } });
    }
  };

  loadSpeciality = async () => {
    try {
      const res = await api.get("/getAllspeciality");
      const specialityArray = Array.isArray(res.data.speciality) ? res.data.speciality : [];
      this.setState({ speciality: specialityArray });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load speciality" } });
    }
  };

  loadLicenseTypes = async () => {
    try {
      const res = await api.get("/getAllLicenseTypes");
      const licenseArray = Array.isArray(res.data.licenseTypes) ? res.data.licenseTypes : res.data.results || [];
      this.setState({ licenseTypes: licenseArray });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load license types" } });
    }
  };

  loadJobTypes = async () => {
    try {
      const res = await api.get("/getalljobtypes");
      const jobTypes = res.data?.jobtypes || [];
      this.setState({ jobTypes });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load job types" } });
    }
  };

  loadSkills = async () => {
    try {
      const res = await api.get("/getAllskills");
      const skillsArray = Array.isArray(res.data.skills) ? res.data.skills : [];
      this.setState({ skillsOptions: skillsArray });
    } catch (err) {
      this.setState({ formMessage: { type: "error", text: "Could not load skills" } });
    }
  };

  loadDegrees = async () => {
    try {
      const res = await api.get("/getalldegreetype");
      const degreeArray = Array.isArray(res.data?.degreetypes) ? res.data.degreetypes : [];
      this.setState({ degreeFieldData: degreeArray });
    } catch (err) {
      this.setState({ degreeFieldData: [] });
    }
  };

  loadInstitutes = async (inputValue) => {
    try {
      const res = await api.get("/institute/getallInstitute", { params: { search: inputValue || "", status: "Active" } });
      const institutes = Array.isArray(res.data?.institutes) ? res.data.institutes : [];
      return institutes.map((inst) => ({ label: inst.name, value: inst.id }));
    } catch (err) {
      return [];
    }
  };

  loadDegreeTitles = (degreeId) => async (inputValue) => {
    if (!degreeId) return [];
    const res = await api.get("/getDegreeFieldsDropdown", { params: { search: inputValue || "", degree_type_id: degreeId } });
    return (res.data.degreefields || []).map((t) => ({ value: t.id, label: t.name }));
  };

  loadFaceModels = async () => {
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.setBackend("webgl");
      await tf.ready();
      faceapi = await import("@vladmandic/face-api");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    } catch (err) {
      console.error("Face model load failed:", err);
    }
  };

  componentDidMount() {
    console.log("🟢 componentDidMount fired");
    this.loadFaceModels();
    this.loadCountries();
    this.loadSkills();
    this.loadAllCities();
    this.loadSpeciality();
    this.loadLicenseTypes();
    this.loadInstitutes();
    this.loadDegrees();
    this.loadDegreeTitles();
    this.loadJobTypes();
    // If candidate already has a partially completed profile (e.g. returning
    // after an earlier CV upload), prefill from the backend instead of
    // starting from the resume screen.
    this.fetchExistingProfileIfAny();
    console.log("🟢 fetchExistingProfileIfAny() called");
  }

  /* ───────────────────── existing profile prefill ───────────────────── */

  mapEducation = (list = []) =>
    list.map((edu) => ({
      id: edu.id,
      degree: edu.degree_id || "",
      degreeTitle: edu.degreefield_id || "",
      degreeTitle_label: edu.degreefield || "",
      institutes: edu.institute_id || "",
      institutes_label: edu.institute || "",
      startDate: edu.start_date ? new Date(edu.start_date).toISOString().slice(0, 10) : "",
      endDate: edu.end_date ? new Date(edu.end_date).toISOString().slice(0, 10) : "",
      ongoing: edu.is_ongoing === 1,
    }));

  mapExperience = (list = []) =>
    list.map((exp) => ({
      id: exp.id,
      designation: exp.designation || "",
      speciality_id: exp.speciality_id || "",
      job_type_id: exp.job_type_id || "",
      companyName: exp.company_name || "",
      startDate: exp.start_date ? new Date(exp.start_date).toISOString().slice(0, 10) : "",
      endDate: exp.end_date ? new Date(exp.end_date).toISOString().slice(0, 10) : "",
      ongoing: exp.is_ongoing === 1,
    }));

  // Silently checks whether this candidate already has profile data (e.g. a
  // previously-uploaded CV). If so, skip straight to the full form,
  // prefilled — otherwise start at the resume-upload screen.
  fetchExistingProfileIfAny = async () => {
    console.log("🔵 STEP 1 - inside fetchExistingProfileIfAny");
    try {
      const token = sessionStorage.getItem("token");
      console.log("🔵 STEP 2 - token is:", token);
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, eduRes, expRes, availRes] = await Promise.allSettled([
        api.get("/candidateProfile/candidate", { headers }),
        api.get(`/candidateeducation/getallcandidateeducation`, { headers }),
        api.get(`/candidateexperience/getexperience`, { headers }),
        api.get(`/candidate_availability/getavailability`, { headers }),
      ]);

      console.log("🟣 STEP 3 - settled results:", { profileRes, eduRes, expRes, availRes });

      if (profileRes.status !== "fulfilled") {
        console.log("🔴 STEP 3a - profile call itself failed, bailing:", profileRes.reason);
        return;
      }

      const data = profileRes.value.data || {};
      const eduData = eduRes.status === "fulfilled" ? eduRes.value.data : [];
      const expData = expRes.status === "fulfilled" ? expRes.value.data : { data: [] };
      const availData = availRes.status === "fulfilled" ? availRes.value.data : { data: [] };

      console.log("🟡 STEP 4 - extracted data:", { data, eduData, expData, availData });
      console.log("🟡 STEP 4a - individual call statuses:", {
        profile: profileRes.status,
        education: eduRes.status,
        experience: expRes.status,
        availability: availRes.status,
      });
      if (eduRes.status === "rejected") console.log("🔴 education call failed:", eduRes.reason);
      if (expRes.status === "rejected") console.log("🔴 experience call failed:", expRes.reason);
      if (availRes.status === "rejected") console.log("🔴 availability call failed:", availRes.reason);

      const hasAnyProfileData = Boolean(
        data.full_name || data.phone || data.email || data.resume ||
        (Array.isArray(eduData) && eduData.length) ||
        (Array.isArray(expData?.data) && expData.data.length)
      );
      console.log("🟢 STEP 5 - hasAnyProfileData:", hasAnyProfileData);
      if (!hasAnyProfileData) {
        console.log("⚪ STEP 5a - no profile data found, staying on resume screen");
        return;
      }

      const mappedData = {
        ...EMPTY_FORM_DATA,
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().slice(0, 10) : "",
        gender: data.gender ?? "",
        marital_status: data.marital_status ?? "",
        total_experience: data.total_experience ?? "",
        current_salary: data.current_salary ?? "",
        expected_salary: data.expected_salary ?? "",
        skills: Array.isArray(data.skills) ? data.skills.map((s) => s.id) : [],
        otherPreferredCities: Array.isArray(data.otherPreferredCities) ? data.otherPreferredCities : [],
        address: data.address ?? "",
        passport_photoPreview: data.passport_photo
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${data.passport_photo}`
          : "",
        education: [
          { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false, id: null },
          ...this.mapEducation(eduData || []),
        ],
        experience: [
          { companyName: "", speciality_id: "", designation: "", job_type_id: "", startDate: "", endDate: "", ongoing: false, id: null },
          ...this.mapExperience(expData?.data || []),
        ],
        passport_photo: data.passport_photo || null,
        resume: data.resume ? {
          name: data.resume.split("/").pop(),
          url: `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${data.resume}`,
          isExisting: true,
        } : null,
        country: data.country?.id || "",
        district: data.district?.id || "",
        city: data.city?.id || "",
        isFresher: data.is_fresher || false,
        license_type: data.license_type?.id || "",
        license_number: data.license_number ?? "",
      };

      console.log("🟢 STEP 6 - mappedData built:", mappedData);
      console.log("🟢 STEP 6a - mappedData.email specifically:", mappedData.email);

      const rawAvail = Array.isArray(availData?.data) ? availData.data : [];
      const entries = rawAvail.map((e) => ({ day: e.day, shift: e.shift, startTime: e.startTime, endTime: e.endTime }));

      console.log("🟢 STEP 7 - entries built:", entries);

      this.setState({ formData: mappedData, entries, phase: "form" }, () => {
        console.log("✅ STEP 8 - setState complete, this.state.formData is now:", this.state.formData);
      });

      if (mappedData.country) await this.loadDistricts(mappedData.country);
      if (mappedData.district) await this.loadCities(mappedData.district);
    } catch (err) {
      console.error("🔴 Prefill fetch failed", err);
    }
  };
  /* ───────────────────────── resume / CV extraction ───────────────────────── */

  handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      this.setState({ formMessage: { type: "error", text: "Only PDF, DOC, DOCX files allowed" } });
      return;
    }
    if (file.size > maxSize) {
      this.setState({ formMessage: { type: "error", text: "File too large — max 3MB" } });
      return;
    }

    this.setState({ cvUploading: true, formMessage: { type: "info", text: "Uploading & parsing CV…" } });

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await api.post(
        `/resume/upload-cv`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        const ext = res.data.extracted || {};

        // Merge extracted values into formData so the full form opens prefilled.
        this.setState((prev) => {
          const merged = {
            ...prev.formData,
            resume: { name: file.name, url: URL.createObjectURL(file), isExisting: false, file },
            full_name: ext.full_name || prev.formData.full_name,
            phone: ext.phone || prev.formData.phone,
            email: ext.email || prev.formData.email,
            date_of_birth: ext.date_of_birth || prev.formData.date_of_birth,
            gender: ext.gender || prev.formData.gender,
            marital_status: ext.marital_status || prev.formData.marital_status,
            skills: Array.isArray(ext.skill_ids) && ext.skill_ids.length ? ext.skill_ids : prev.formData.skills,
          };

          const degreeTypeLabel = (typeId) =>
            this.state.degreeFieldData.find((d) => String(d.id) === String(typeId))?.name || "";

          const education = Array.isArray(ext.education) && ext.education.length
            ? [
              { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", institutes_label: "", startDate: "", endDate: "", ongoing: false, id: null },
              ...ext.education.map((edu) => ({
                id: edu.id || null,
                degree: edu.degree_type_id ? String(edu.degree_type_id) : "",
                degree_label: degreeTypeLabel(edu.degree_type_id) || edu.degree_name || "",
                degreeTitle: edu.degreefield_id || "",
                degreeTitle_label: edu.degreefield_name || edu.raw_line || "",
                institutes: edu.institute_id || "",
                institutes_label: edu.institute_name || "",
                startDate: edu.startDate || "",
                endDate: edu.endDate || "",
                ongoing: edu.ongoing ?? !edu.endDate,
              })),
            ]
            : prev.formData.education;
          const experience = Array.isArray(ext.experience) && ext.experience.length
            ? [
              prev.formData.experience[0],
              ...ext.experience.map((exp) => ({
                id: exp.id || null,
                companyName: exp.company_name || exp.companyName || "",
                designation: exp.designation || "",
                speciality_id: exp.speciality_id || "",
                job_type_id: exp.job_type_id || "",
                startDate: exp.start_date || "",
                endDate: exp.end_date || "",
                ongoing: !exp.end_date,
              })),
            ]
            : prev.formData.experience;

          return {
            cvUploading: false,
            cvExtracted: ext,
            formData: { ...merged, education, experience },
            phase: "form",
            formMessage: { type: "success", text: "CV parsed — review and complete the highlighted fields below." },
          };
        });
      } else {
        throw new Error(res.data?.error || "Upload failed");
      }
    } catch (err) {
      this.setState({
        cvUploading: false,
        formMessage: {
          type: "error",
          text: err.response?.data?.error || "Upload failed",
        },
      });
    }
  };

  skipResumeUpload = () => {
    this.setState({ phase: "form" });
  };

  /* ───────────────────────── validation ───────────────────────── */

  fullSchema = Yup.object().shape({
    passport_photo: Yup.mixed().required("Please upload a profile photo"),
    full_name: Yup.string().trim().matches(/^[A-Za-z ]+$/, "Name can only contain letters and spaces").min(3).max(50).required("Full name is required"),
    phone: Yup.string().matches(/^(03\d{2}-\d{7}|0\d{2,3}-\d{7})$/, "Enter a valid Pakistani mobile or landline number").required("Contact number is required"),
    email: Yup.string().email("Invalid email").required("Required"),
    date_of_birth: Yup.date().required("Date of Birth is required").test("age", "You must be at least 15 years old", (value) => {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age >= 15;
    }),
    license_number: Yup.string().trim().matches(/^[A-Za-z0-9-\/]+$/).min(3).max(20).required("License number is required"),
    total_experience: Yup.string().nullable().notRequired(),
    education: Yup.array().test("education-required", "Please add at least one education entry", (eduArr) => {
      if (!eduArr || eduArr.length <= 1) return false;
      return eduArr.slice(1).some((e) => e.degreeTitle && e.startDate);
    }),
    isFresher: Yup.boolean(),
    experience: Yup.array().when("isFresher", {
      is: true,
      then: () => Yup.array().notRequired(),
      otherwise: () => Yup.array().test("experience-required", "Please add at least one experience", (expArr) => {
        if (!expArr || expArr.length <= 1) return false;
        return expArr.slice(1).every((e) => e.designation && e.companyName);
      }),
    }),
    resume: Yup.mixed().required("Please upload your resume").test("fileSize", "File size must be less than 3MB", function (value) {
      if (value && value.file instanceof File) return value.file.size <= 3 * 1024 * 1024;
      return true;
    }),
  });

  /* ───────────────────────── save / submit ───────────────────────── */

  handleFinalSubmit = async (values) => {
    try {
      await this.fullSchema.validate(values, { abortEarly: false });

      if (!this.state.entries || this.state.entries.length === 0) {
        this.setState({ formMessage: { type: "error", text: "Please add at least one availability entry before submitting" } });
        return;
      }

      // ---- Personal details ----
      const formData = new FormData();
      formData.append("mode", "submit");
      const fields = ["full_name", "phone", "date_of_birth", "gender", "marital_status", "license_type", "license_number", "total_experience", "country", "district", "city", "otherPreferredCities", "address", "current_salary", "expected_salary"];
      fields.forEach((field) => {
        const value = values[field];
        if (Array.isArray(value)) formData.append(field, JSON.stringify(value));
        else if (value !== undefined && value !== null) formData.append(field, value);
      });
      if (Array.isArray(values.skills)) formData.append("skills", JSON.stringify(values.skills));
      formData.append("is_fresher", values.isFresher ? "true" : "false");
      if (values.passport_photo instanceof File) formData.append("passport_photo", values.passport_photo);
      await api.post(`/candidateProfile/candidate/passport-photo`, formData, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
      });

      // ---- Resume ----
      const resumeFile = values.resume?.file || (values.resume instanceof File ? values.resume : null);
      if (resumeFile) {
        const resumeForm = new FormData();
        resumeForm.append("resume", resumeFile);
        await api.post(`/resume/addresume`, resumeForm, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
        });
      }

      // ---- Education ----
      const newRows = values.education.slice(1).filter((e) => !e.id && e.degreeTitle && e.startDate);
      const editedRows = values.education.slice(1).filter((e) => e.id && e.degreeTitle && e.startDate);
      if (editedRows.length > 0) {
        await api.put(`/candidateeducation/editcandidateeducation`, { education: editedRows });
      }
      if (newRows.length > 0) {
        await api.post(`/candidateeducation/addcandidateeducation`, { education: newRows, mode: "save" });
      }

      // ---- Experience ----
      if (!values.isFresher) {
        const existingExperiences = values.experience.slice(1).filter((e) => e.id);
        const draftExp = values.experience[0];
        const draftRow = (!draftExp?.id && draftExp?.companyName && draftExp?.designation && draftExp?.startDate)
          ? [{ ...draftExp, speciality_id: draftExp.speciality_id || null }]
          : [];
        const newExperiences = [
          ...values.experience.slice(1)
            .filter((e) => !e.id && e.companyName && e.designation && e.startDate)
            .map((e) => ({ ...e, speciality_id: e.speciality_id || null })),
          ...draftRow,
        ];
        if (newExperiences.length === 0 && existingExperiences.length === 0) {
          this.setState({ formMessage: { type: "error", text: "Please fill Company, Designation and Start Date" } });
          return;
        }
        if (newExperiences.length > 0) {
          await api.post(`/candidateexperience/addexperience`, { experience: newExperiences },
            { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
          );
        }
      }

      // ---- Availability ----
      await api.post(`/candidate_availability/addavailability`, {
        availability: this.state.entries,
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });

      this.setState({ formMessage: { type: "success", text: "Profile submitted successfully" } });

      sessionStorage.clear();
      sessionStorage.clear();
      window.location.replace("/login");

    } catch (err) {
      if (err.name === "ValidationError") {
        this.setState({ formMessage: { type: "error", text: err.inner?.[0]?.message || err.message } });
        return;
      }
      this.setState({ formMessage: { type: "error", text: "Submit failed" } });
    }
  };

  /* ───────────────────────── field blocks ───────────────────────── */

  renderPersonalDetails = (values, setFieldValue, errors, touched) => (
    <div className="cr-step-group">
      <div className="cr-step-group-title">Personal Details</div>

      <div className="cr-photo-area">
        <div className="cr-photo-circle">
          {values.passport_photoPreview
            ? <img src={values.passport_photoPreview} alt="Profile" className="cr-photo-img" />
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#36565f" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          }
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 2 }}>Profile Photo</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Clear face photo — JPG or PNG, max 5MB</div>
          <label className="cr-btn-add" style={{ display: "inline-block", cursor: "pointer" }}>
            Choose photo
            <input type="file" name="passport_photo" accept=".jpg,.jpeg,.png" style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
                if (!allowedTypes.includes(file.type)) {
                  this.setState({ photoMessage: { type: "error", text: "Only JPG or PNG image is allowed!" } });
                  e.target.value = "";
                  return;
                }

                this.setState({ isFaceDetecting: true, photoMessage: { type: "info", text: "🔍 Detecting face in photo... Please wait" } });

                const img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.onload = async () => {
                  try {
                    if (!faceapi) {
                      this.setState({
                        isFaceDetecting: false,
                        photoMessage: { type: "error", text: "Face detection not ready, please try again." }
                      });
                      e.target.value = "";
                      return;
                    }

                    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());

                    if (!detection) {
                      this.setState({
                        isFaceDetecting: false,
                        photoMessage: { type: "error", text: "No face detected! Please upload a clear face photo." }
                      });
                      e.target.value = "";
                      return;
                    }

                    this.setState({
                      isFaceDetecting: false,
                      photoMessage: { type: "success", text: "✅ Photo accepted! Face detected successfully." }
                    });

                    setFieldValue("passport_photo", file);
                    const reader = new FileReader();
                    reader.onload = () => setFieldValue("passport_photoPreview", reader.result);
                    reader.readAsDataURL(file);

                  } catch (err) {
                    this.setState({
                      isFaceDetecting: false,
                      photoMessage: { type: "error", text: "Could not verify photo. Please try again." }
                    });
                    e.target.value = "";
                  } finally {
                    URL.revokeObjectURL(img.src);
                  }
                };

                img.onerror = () => {
                  this.setState({
                    isFaceDetecting: false,
                    photoMessage: { type: "error", text: "Failed to load image" }
                  });
                  e.target.value = "";
                };
              }}
            />
          </label>

          {this.state.isFaceDetecting && (
            <div className="cr-alert cr-alert-info" style={{ marginTop: 8 }}>
              <span>⏳ Processing image... Please wait</span>
            </div>
          )}
        </div>
      </div>

      {this.state.photoMessage && (
        <div className={`cr-alert ${this.state.photoMessage.type === "success" ? "cr-alert-success" : "cr-alert-error"}`}>
          <span>{this.state.photoMessage.text}</span>
          <button className="cr-alert-close" onClick={() => this.setState({ photoMessage: null })}>×</button>
        </div>
      )}

      <div className="cr-grid-2">
        <FieldWrap label="Full name" required error={touched.full_name && errors.full_name}>
          <Field name="full_name">
            {({ field, form }) => (
              <StyledInput {...field} placeholder="e.g. Saba Khalid"
                onChange={(e) => {
                  let v = e.target.value.replace(/[^A-Za-z ]/g, "").slice(0, 50);
                  form.setFieldValue("full_name", v);
                }}
              />
            )}
          </Field>
        </FieldWrap>

        <FieldWrap label="Contact number" required hint="Pakistani mobile or landline" error={touched.phone && errors.phone}>
          <Field name="phone">
            {({ field }) => (
              <StyledInput {...field} placeholder="03XX-XXXXXXX"
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.startsWith("03")) {
                    if (v.length > 4) v = v.slice(0, 4) + "-" + v.slice(4, 11);
                    v = v.slice(0, 12);
                  } else if (v.startsWith("0")) {
                    if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3, 10);
                    if (v.length > 11) v = v.slice(0, 11);
                  }
                  setFieldValue("phone", v);
                }}
              />
            )}
          </Field>
        </FieldWrap>
      </div>

      <div className="cr-grid-2" style={{ marginTop: 14 }}>
        <FieldWrap label="Email address" hint="Cannot be changed">
          <Field name="email" type="email">
            {({ field }) => <StyledInput {...field} readOnly placeholder="you@email.com" />}
          </Field>
        </FieldWrap>
        <FieldWrap label="Date of birth" required error={touched.date_of_birth && errors.date_of_birth}>
          <Field name="date_of_birth">
            {({ field, form }) => {
              const today = new Date();
              const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
              return (
                <StyledInput {...field} type="date" max={maxDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    form.setFieldValue("date_of_birth", e.target.value);
                    const bd = new Date(e.target.value);
                    let age = today.getFullYear() - bd.getFullYear();
                    const m = today.getMonth() - bd.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                    if (age < 15) form.setFieldError("date_of_birth", "You must be at least 15 years old");
                    else form.setFieldError("date_of_birth", "");
                  }}
                />
              );
            }}
          </Field>
        </FieldWrap>
      </div>

      <div className="cr-grid-2" style={{ marginTop: 14 }}>
        <FieldWrap label="Gender">
          <FormikCustomSelect
            name="gender"
            placeholder="Select gender"
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </FieldWrap>
        <FieldWrap label="Marital status">
          <FormikCustomSelect
            name="marital_status"
            placeholder="Select status"
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "divorced", label: "Divorced" },
              { value: "widowed", label: "Widowed" },
              { value: "separated", label: "Separated" },
            ]}
          />
        </FieldWrap>
      </div>

      <Divider label="License information" />

      <div className="cr-grid-2">
        <FieldWrap label="License type">
          <FormikCustomSelect
            name="license_type"
            placeholder="Select license type"
            options={(this.state.licenseTypes || []).map((l) => ({ value: String(l.id), label: l.name }))}
          />
        </FieldWrap>
        <FieldWrap label="License number" required error={touched.license_number && errors.license_number}>
          <Field name="license_number">
            {({ field }) => <StyledInput {...field} placeholder="e.g. PMC-12345" />}
          </Field>
        </FieldWrap>
      </div>

      <Divider label="Salary & experience" />

      <div className="cr-grid-3">
        <FieldWrap label="Current salary">
          <Field name="current_salary">
            {({ field, form }) => (
              <StyledInput {...field} placeholder="0"
                value={field.value ? Number(field.value).toLocaleString() : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (/^\d*$/.test(raw)) form.setFieldValue("current_salary", raw);
                }}
              />
            )}
          </Field>
        </FieldWrap>
        <FieldWrap label="Expected salary">
          <Field name="expected_salary">
            {({ field, form }) => (
              <StyledInput {...field} placeholder="0"
                value={field.value ? Number(field.value).toLocaleString() : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (/^\d*$/.test(raw)) form.setFieldValue("expected_salary", raw);
                }}
              />
            )}
          </Field>
        </FieldWrap>
      </div>

      <Divider label="Location" />

      <div className="cr-grid-3">
        <FieldWrap label="Country">
          <FormikCustomSelect
            name="country"
            placeholder="Select country"
            options={this.state.countries.map((c) => ({ value: String(c.id), label: c.name }))}
            onExtraChange={(val, form) => {
              form.setFieldValue("district", "");
              form.setFieldValue("city", "");
              this.loadDistricts(val);
            }}
          />
        </FieldWrap>
        <FieldWrap label="District">
          <FormikCustomSelect
            name="district"
            placeholder="Select district"
            options={this.state.districts.map((d) => ({ value: String(d.id), label: d.name }))}
            onExtraChange={(val, form) => {
              form.setFieldValue("city", "");
              this.loadCities(val);
            }}
          />
        </FieldWrap>
        <FieldWrap label="City">
          <FormikCustomSelect
            name="city"
            placeholder="Select city"
            options={this.state.cities.map((c) => ({ value: c.id, label: c.name }))}
          />
        </FieldWrap>
      </div>

      <div style={{ marginTop: 14 }}>
        <FieldWrap label="Other preferred cities">
          <Select isMulti
            options={this.state.allCities.map((c) => ({ value: c.id, label: c.name }))}
            value={values.otherPreferredCities.map((id) => {
              const city = this.state.allCities.find((c) => c.id === id);
              return city ? { value: city.id, label: city.name } : null;
            }).filter(Boolean)}
            onChange={(selected) => setFieldValue("otherPreferredCities", selected ? selected.map((o) => o.value) : [])}
            styles={rsSelectStyles}
          />
        </FieldWrap>
      </div>

      <div style={{ marginTop: 14 }}>
        <FieldWrap label="Complete address">
          <Field name="address">
            {({ field }) => <StyledTextarea {...field} placeholder="Street, area, city..." />}
          </Field>
        </FieldWrap>
      </div>
    </div>
  );

  renderEducation = (values, setFieldValue) => (
    <div className="cr-step-group">
      <div className="cr-step-group-title">Education</div>
      <FieldArray name="education">
        {({ push, remove }) => {
          const draft = values.education?.[0] || { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "" };
          return (
            <>
              <div className="cr-subsection">
                <div className="cr-subsection-title">Add education</div>

                <div className="cr-grid-2">
                  <FieldWrap label="Degree">
                    <FormikCustomSelect
                      name="education.0.degree"
                      placeholder="Select degree"
                      options={this.state.degreeFieldData.map((d) => ({ value: String(d.id), label: d.name }))}
                      onExtraChange={(val, form) => {
                        form.setFieldValue("education.0.degreeTitle", "");
                        form.setFieldValue("education.0.degreeTitle_label", "");
                      }}
                    />
                  </FieldWrap>
                  <FieldWrap label="Degree title">
                    <AsyncSelect key={draft.degree || "no-degree"} cacheOptions={false} defaultOptions
                      isDisabled={!draft.degree}
                      loadOptions={draft.degree ? this.loadDegreeTitles(Number(draft.degree)) : () => []}
                      value={draft.degreeTitle ? { value: draft.degreeTitle, label: draft.degreeTitle_label } : null}
                      onChange={(opt) => {
                        setFieldValue("education.0.degreeTitle", opt?.value || "");
                        setFieldValue("education.0.degreeTitle_label", opt?.label || "");
                      }}
                      placeholder="Select degree title"
                      styles={rsSelectStyles}
                    />
                  </FieldWrap>
                </div>

                <div className="cr-grid-2" style={{ marginTop: 14 }}>
                  <FieldWrap label="Institute">
                    <AsyncSelect cacheOptions defaultOptions loadOptions={this.loadInstitutes}
                      value={draft.institutes ? { value: draft.institutes, label: draft.institutes_label } : null}
                      onChange={(opt) => setFieldValue("education.0", { ...draft, institutes: opt?.value || "", institutes_label: opt?.label || "" })}
                      styles={rsSelectStyles}
                    />
                  </FieldWrap>
                  <FieldWrap label="Start date">
                    <Field type="date" name="education.0.startDate" className="cr-field-input" />
                  </FieldWrap>
                </div>

                <div className="cr-grid-2" style={{ marginTop: 14 }}>
                  <FieldWrap label="End date" hint="Leave empty if currently studying">
                    <Field type="date" name="education.0.endDate" className="cr-field-input" />
                  </FieldWrap>
                  <div></div>
                </div>

                <button type="button" className="cr-btn-add" style={{ marginTop: "1rem" }}
                  onClick={() => {
                    if (!draft.degree || !draft.degreeTitle) {
                      this.setState({ formMessage: { type: "error", text: "Please fill required fields" } });
                      return;
                    }

                    const degreeLabel = this.state.degreeFieldData.find(
                      (d) => String(d.id) === String(draft.degree)
                    )?.name || "";

                    const entryToSave = { ...draft, degree_label: degreeLabel };

                    if (draft.id) {
                      const index = values.education.findIndex((e) => e.id === draft.id);
                      if (index > -1) setFieldValue(`education.${index}`, entryToSave);
                    } else {
                      push(entryToSave);
                    }
                    setFieldValue("education.0", { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", id: null });
                    this.setState({ editID: null });
                  }}>
                  + Add education
                </button>
              </div>

              {values.education.length > 1 && (
                <div style={{ overflowX: "auto" }}>
                  <table className="cr-table">
                    <thead>
                      <tr>
                        {["Degree", "Title", "Institute", "Start", "End / Status", ""].map((h) => (
                          <th key={h} className="cr-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {values.education.slice(1).map((edu, i) => (
                        <tr key={edu.id || i}>
                          <td className="cr-td">{edu.degree_label}</td>
                          <td className="cr-td">{edu.degreeTitle_label}</td>
                          <td className="cr-td">{edu.institutes_label}</td>
                          <td className="cr-td">{edu.startDate}</td>
                          <td className="cr-td">
                            {!edu.endDate || isDateOngoing(edu.endDate)
                              ? <span className="cr-ongoing-badge">Ongoing</span>
                              : edu.endDate}
                          </td>
                          <td className="cr-td">
                            <button type="button" className="cr-btn-info"
                              onClick={() => { setFieldValue("education.0", { ...edu }); this.setState({ editID: edu.id, isEdit: true }); remove(i + 1); }}>
                              Edit
                            </button>
                            <button type="button" className="cr-btn-danger"
                              onClick={() => {
                                if (edu.id) {
                                  api.delete(`/candidateeducation/deletecandidateeducation/${edu.id}`)
                                    .then(() => { this.setState({ formMessage: { type: "success", text: "Deleted" } }); remove(i + 1); });
                                } else { remove(i + 1); }
                              }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          );
        }}
      </FieldArray>
    </div>
  );

  renderExperience = (values, setFieldValue) => (
    <div className="cr-step-group">
      <div className="cr-step-group-title">Work Experience & Skills</div>
      <FieldArray name="experience">
        {({ push, remove }) => {
          const draft = values.experience?.[0] || { companyName: "", designation: "", speciality_id: "", startDate: "", endDate: "", job_type_id: "", id: null };
          return (
            <>
              <div className={`cr-fresher-box ${values.isFresher ? "on" : ""}`}
                onClick={() => {
                  setFieldValue("isFresher", !values.isFresher);
                  if (!values.isFresher) setFieldValue("experience", [{ companyName: "", designation: "", speciality_id: "", job_type_id: "", startDate: "", endDate: "", id: null }]);
                }}>
                <div className={`cr-fresher-switch ${values.isFresher ? "on" : ""}`}>
                  <div className={`cr-fresher-knob ${values.isFresher ? "on" : ""}`} />
                </div>
                <div>
                  <div className={`cr-fresher-title ${values.isFresher ? "on" : ""}`}>I am a Fresher</div>
                  <div className="cr-fresher-sub">
                    {values.isFresher ? "Work experience section will be skipped" : "Check this if you have no work experience"}
                  </div>
                </div>
              </div>

              {!values.isFresher && (
                <div className="cr-subsection">
                  <div className="cr-subsection-title">Add experience</div>

                  <div className="cr-grid-2">
                    <FieldWrap label="Company name">
                      <Field type="text" name="experience.0.companyName" className="cr-field-input" placeholder="Company name" />
                    </FieldWrap>
                    <FieldWrap label="Designation">
                      <Field type="text" name="experience.0.designation" className="cr-field-input" placeholder="Your role" />
                    </FieldWrap>
                  </div>

                  <div className="cr-grid-2" style={{ marginTop: 14 }}>
                    <FieldWrap label="Speciality">
                      <FormikCustomSelect
                        name="experience.0.speciality_id"
                        placeholder="Select speciality"
                        options={Array.isArray(this.state.speciality) ? this.state.speciality.map((s) => ({ value: String(s.id), label: s.name })) : []}
                      />
                    </FieldWrap>
                    <FieldWrap label="Job Type">
                      <FormikCustomSelect
                        name="experience.0.job_type_id"
                        placeholder="Select job type"
                        options={Array.isArray(this.state.jobTypes) ? this.state.jobTypes.map((jt) => ({ value: String(jt.id), label: jt.name })) : []}
                      />
                    </FieldWrap>
                  </div>

                  <div className="cr-grid-2" style={{ marginTop: 14 }}>
                    <FieldWrap label="Start date">
                      <Field type="date" name="experience.0.startDate" className="cr-field-input" max={new Date().toISOString().split("T")[0]} />
                    </FieldWrap>
                    <FieldWrap label="End date" hint="Leave empty if currently working here">
                      <Field type="date" name="experience.0.endDate" className="cr-field-input" />
                    </FieldWrap>
                  </div>

                  <button type="button" className="cr-btn-add" style={{ marginTop: "1rem" }}
                    onClick={() => {
                      if (!draft.companyName || !draft.designation || !draft.startDate) {
                        this.setState({ formMessage: { type: "error", text: "Please fill required fields" } });
                        return;
                      }
                      const expToPush = { ...draft, speciality_id: draft.speciality_id ? Number(draft.speciality_id) : "", job_type_id: draft.job_type_id ? Number(draft.job_type_id) : "" };
                      if (draft.id) {
                        const index = values.experience.findIndex((e) => e.id === draft.id);
                        if (index > -1) setFieldValue(`experience.${index}`, expToPush);
                      } else {
                        push(expToPush);
                      }
                      setFieldValue("experience.0", { companyName: "", designation: "", speciality_id: "", startDate: "", endDate: "", job_type_id: "", id: null });
                      this.setState({ editexpID: null });
                    }}>
                    + Add experience
                  </button>
                </div>
              )}

              <div className="cr-subsection">
                <div className="cr-subsection-title">Skills</div>
                <Field name="skills">
                  {({ field, form }) => (
                    <Select isMulti
                      value={field.value?.map((val) => {
                        const s = this.state.skillsOptions.find((sk) => sk.id === val);
                        return s ? { value: s.id, label: s.name } : null;
                      }).filter(Boolean)}
                      onChange={(selected) => form.setFieldValue("skills", selected ? selected.map((o) => o.value) : [])}
                      options={this.state.skillsOptions.map((s) => ({ value: s.id, label: s.name }))}
                      placeholder="Select skills..."
                      styles={rsSelectStyles}
                    />
                  )}
                </Field>
              </div>

              {values.experience.length > 1 && (
                <div style={{ overflowX: "auto" }}>
                  <table className="cr-table">
                    <thead>
                      <tr>
                        {["Company", "Designation", "Speciality", "Job Type", "Start", "End / Status", ""].map((h) => (
                          <th key={h} className="cr-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {values.experience.slice(1).map((exp, i) => (
                        <tr key={exp.id || i}>
                          <td className="cr-td">{exp.companyName}</td>
                          <td className="cr-td">{exp.designation}</td>
                          <td className="cr-td">{this.state.speciality?.find((s) => s.id === exp.speciality_id)?.name || "—"}</td>
                          <td className="cr-td">{this.state.jobTypes?.find((jt) => jt.id === exp.job_type_id)?.name || "—"}</td>
                          <td className="cr-td">{exp.startDate}</td>
                          <td className="cr-td">
                            {!exp.endDate || isDateOngoing(exp.endDate)
                              ? <span className="cr-ongoing-badge">Ongoing</span>
                              : exp.endDate}
                          </td>
                          <td className="cr-td">
                            <button type="button" className="cr-btn-info"
                              onClick={() => {
                                setFieldValue("experience.0", { ...exp });
                                remove(i + 1);
                                this.setState({ editexpID: exp.id, isExpEdit: true });
                              }}>
                              Edit
                            </button>
                            <button type="button" className="cr-btn-danger"
                              onClick={() => {
                                if (exp.id) {
                                  api.delete(`/candidateexperience/deleteexperience/${exp.id}`)
                                    .then(() => {
                                      this.setState({ formMessage: { type: "success", text: "Deleted" } });
                                      remove(i + 1);
                                    });
                                } else {
                                  remove(i + 1);
                                }
                              }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          );
        }}
      </FieldArray>
    </div>
  );

  renderResume = (values, setFieldValue, errors, touched, setFieldTouched, setFieldError) => {
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      setFieldTouched("resume", true);
      if (!file) return;

      const maxSize = 3 * 1024 * 1024; // 3MB
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

      if (!allowedTypes.includes(file.type)) {
        setFieldError("resume", "Invalid file type");
        setFieldValue("resume", null);
        e.target.value = "";
        return;
      }
      if (file.size > maxSize) {
        setFieldError("resume", "File too large — max 3MB");
        setFieldValue("resume", null);
        e.target.value = "";
        return;
      }

      setFieldValue("resume", { name: file.name, url: URL.createObjectURL(file), isExisting: false, file });
      setFieldError("resume", "");
    };

    return (
      <div className="cr-step-group">
        <div className="cr-step-group-title">Resume</div>

        {values.resume ? (
          <div className="cr-resume-uploaded">
            <div className="cr-resume-uploaded-info">
              <span className="cr-resume-icon">📄</span>
              <div>
                <a href={values.resume.url} target="_blank" rel="noopener noreferrer" className="cr-resume-name">
                  {values.resume.name}
                </a>
                <div className="cr-resume-meta">PDF, DOC, DOCX — max 3MB</div>
              </div>
            </div>
            <label className="cr-btn-outline" style={{ cursor: "pointer" }}>
              Replace
              <input
                type="file"
                name="resume"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="cr-cv-dropzone">
            <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", marginBottom: 4 }}>
              Click to upload your resume
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: "1.2rem" }}>PDF, DOC, DOCX — max 3MB</div>
            <label className="cr-btn-next" style={{ display: "inline-flex", cursor: "pointer" }}>
              Browse file
              <input
                type="file"
                name="resume"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {errors.resume && touched.resume && (
          <div className="cr-field-error" style={{ marginTop: 8 }}>{errors.resume}</div>
        )}
      </div>
    );
  };

  renderAvailability = () => {
    const isTimeCrossingMidnight = (startTime, endTime) => {
      if (!startTime || !endTime) return false;
      return startTime > endTime;
    };

    const is247Selection = (day, shift) => shift === "All Shifts";

    const validateShiftTiming = (shift, startTime, endTime) => {
      if (!startTime || !endTime) {
        return { isValid: false, error: "Please select both start and end time" };
      }
      switch (shift) {
        case "morning":
          if (startTime >= "12:00") return { isValid: false, error: "❌ Morning shift must start before 12:00 PM (e.g., 09:00 AM)" };
          if (startTime >= endTime) return { isValid: false, error: "❌ End time must be after start time" };
          return { isValid: true, error: null };
        case "evening":
          if (startTime <= "12:00") return { isValid: false, error: "❌ Evening shift must start after 12:00 PM (e.g., 15:00 PM)" };
          if (startTime >= endTime) return { isValid: false, error: "❌ End time must be after start time" };
          return { isValid: true, error: null };
        case "night":
          if (startTime <= endTime) return { isValid: false, error: "❌ Night shift must cross midnight (e.g., 21:00 to 06:00 next day)" };
          return { isValid: true, error: null };
        default:
          return { isValid: true, error: null };
      }
    };

    const { currentEntry, allShiftsTimings } = this.state;
    const is247 = is247Selection(currentEntry?.day, currentEntry?.shift);

    const getTimingError = () => {
      if (!currentEntry?.shift || !currentEntry?.startTime || !currentEntry?.endTime) return null;
      const validation = validateShiftTiming(currentEntry.shift, currentEntry.startTime, currentEntry.endTime);
      return validation.error;
    };

    return (
      <div className="cr-step-group">
        <div className="cr-step-group-title">Availability</div>

        <div className="availability-card cr-subsection">
          <div className="availability-title cr-subsection-title">Add availability</div>

          <div style={{ marginBottom: "1rem" }}>
            <FieldWrap label="Day">
              <CustomSelect
                value={currentEntry?.day || ""}
                placeholder="Select Day"
                options={[
                  { value: "All Days", label: "All Days" },
                  { value: "Monday", label: "Monday" },
                  { value: "Tuesday", label: "Tuesday" },
                  { value: "Wednesday", label: "Wednesday" },
                  { value: "Thursday", label: "Thursday" },
                  { value: "Friday", label: "Friday" },
                  { value: "Saturday", label: "Saturday" },
                  { value: "Sunday", label: "Sunday" },
                ]}
                onChange={(val) => {
                  this.setState((prev) => ({
                    currentEntry: { ...prev.currentEntry, day: val },
                    timingError: null,
                  }));
                }}
              />
            </FieldWrap>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <FieldWrap label="Shift">
              <CustomSelect
                value={currentEntry?.shift || ""}
                placeholder="Select Shift"
                options={[
                  { value: "All Shifts", label: "All Shifts (24/7 availability)" },
                  { value: "morning", label: "Morning" },
                  { value: "evening", label: "Evening" },
                  { value: "night", label: "Night" },
                ]}
                onChange={(val) => {
                  const isAllShifts = val === "All Shifts";
                  this.setState((prev) => ({
                    currentEntry: { ...prev.currentEntry, shift: val, startTime: "", endTime: "" },
                    isAllShiftsMode: isAllShifts,
                    timingError: null,
                    allShiftsTimings: isAllShifts ? {
                      morning: { startTime: "09:00", endTime: "17:00" },
                      evening: { startTime: "15:00", endTime: "23:00" },
                      night: { startTime: "21:00", endTime: "06:00" },
                    } : prev.allShiftsTimings,
                  }));
                }}
              />
            </FieldWrap>
          </div>

          {is247 && currentEntry?.day && (
            <div className="availability-info" style={{ marginTop: "1rem", fontSize: 13 }}>
              <strong>🕒 24/7 Availability Selected!</strong>
              <br />
              <small>
                You will be marked as available for {currentEntry.day === "All Days" ? "all days" : currentEntry.day} across all shifts without specific time restrictions.
              </small>
            </div>
          )}

          {currentEntry?.shift === "All Shifts" && !is247 ? (
            <div style={{ marginTop: "1rem" }}>
              <label className="cr-field-label" style={{ display: "block", marginBottom: 8 }}>Set timings for each shift:</label>
              {[
                { key: "morning", label: "Morning Shift" },
                { key: "evening", label: "Evening Shift" },
                { key: "night", label: "Night Shift" },
              ].map((shift) => {
                const timing = this.state.allShiftsTimings?.[shift.key] || { startTime: "", endTime: "" };
                const validation = validateShiftTiming(shift.key, timing.startTime, timing.endTime);
                return (
                  <div key={shift.key} className="time-box" style={{ marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 110 }}><strong>{shift.label}</strong></div>
                    <div>
                      <label className="cr-field-label" style={{ display: "block", marginBottom: 4 }}>Start Time</label>
                      <ThemedTimeInput
                        value={timing.startTime}
                        onChange={(e) => {
                          const newTimings = { ...this.state.allShiftsTimings };
                          newTimings[shift.key] = { ...newTimings[shift.key], startTime: e.target.value };
                          this.setState({ allShiftsTimings: newTimings, timingError: null });
                        }}
                      />
                    </div>
                    <div>
                      <label className="cr-field-label" style={{ display: "block", marginBottom: 4 }}>End Time</label>
                      <ThemedTimeInput
                        value={timing.endTime}
                        onChange={(e) => {
                          const newTimings = { ...this.state.allShiftsTimings };
                          newTimings[shift.key] = { ...newTimings[shift.key], endTime: e.target.value };
                          this.setState({ allShiftsTimings: newTimings, timingError: null });
                        }}
                      />
                    </div>
                    {validation.isValid === false && (
                      <small className="cr-field-error" style={{ display: "block", width: "100%", marginTop: 4 }}>{validation.error}</small>
                    )}
                  </div>
                );
              })}
            </div>
          ) : currentEntry?.shift && !is247 && (
            <>
              <div className="time-box" style={{ marginTop: 14 }}>
                <FieldWrap label="Start Time">
                  <ThemedTimeInput
                    value={currentEntry?.startTime || ""}
                    onChange={(e) => {
                      this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, startTime: e.target.value }, timingError: null }));
                    }}
                  />
                </FieldWrap>
                <FieldWrap label="End Time">
                  <ThemedTimeInput
                    value={currentEntry?.endTime || ""}
                    onChange={(e) => {
                      this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, endTime: e.target.value }, timingError: null }));
                    }}
                  />
                </FieldWrap>
              </div>

              {getTimingError() && (
                <div className="cr-alert cr-alert-error" style={{ marginTop: 8, fontSize: 12, padding: "8px 12px" }}>
                  <span>⚠️ {getTimingError()}</span>
                </div>
              )}
            </>
          )}

          {currentEntry?.day && currentEntry?.shift && (
            <div className={`cr-alert cr-alert-info ${is247 ? "cr-alert-success" : ""}`} style={{ marginTop: "1rem", fontSize: 13, padding: "8px 12px" }}>
              <strong>📋 Summary:</strong> You are about to add{' '}
              <strong>
                {currentEntry.day === "All Days" ? 7 : 1} × {currentEntry.shift === "All Shifts" ? 3 : 1} ={' '}
                {(currentEntry.day === "All Days" ? 7 : 1) * (currentEntry.shift === "All Shifts" ? 3 : 1)} entries
              </strong>
              {is247 && (
                <div style={{ marginTop: 4 }}>
                  <small>✅ No time restrictions - you will be marked as available 24/7</small>
                </div>
              )}
            </div>
          )}

          <button type="button" className="cr-btn-add" style={{ marginTop: "1rem" }}
            onClick={() => {
              const { currentEntry, allShiftsTimings } = this.state;

              if (!currentEntry?.day || !currentEntry?.shift) {
                this.setState({ formMessage: { type: "error", text: "Please select day and shift" } });
                return;
              }

              let daysToAdd = [];
              let availabilityArray = [];

              if (currentEntry.day === "All Days") {
                daysToAdd = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
              } else {
                daysToAdd = [currentEntry.day];
              }

              const isAllShifts = currentEntry.shift === "All Shifts";

              if (isAllShifts) {
                if (currentEntry.day === "All Days") {
                  // True 24/7 across every day — store as ONE entry
                  availabilityArray.push({ day: "All Days", shift: "All Shifts", startTime: null, endTime: null });
                } else {
                  // Single day, all shifts — still one entry
                  availabilityArray.push({ day: currentEntry.day, shift: "All Shifts", startTime: null, endTime: null });
                }
              } else {
                if (!currentEntry.startTime || !currentEntry.endTime) {
                  this.setState({ formMessage: { type: "error", text: "Please select start time and end time" } });
                  return;
                }

                const validation = validateShiftTiming(currentEntry.shift, currentEntry.startTime, currentEntry.endTime);
                if (!validation.isValid) {
                  this.setState({ formMessage: { type: "error", text: validation.error } });
                  return;
                }

                for (const day of daysToAdd) {
                  availabilityArray.push({ day, shift: currentEntry.shift, startTime: currentEntry.startTime, endTime: currentEntry.endTime });
                }
              }

              this.setState((prev) => ({
                entries: [...prev.entries, ...availabilityArray],
                currentEntry: { day: "", shift: "", startTime: "", endTime: "" },
                isAllShiftsMode: false,
                timingError: null,
                allShiftsTimings: {
                  morning: { startTime: "09:00", endTime: "17:00" },
                  evening: { startTime: "15:00", endTime: "23:00" },
                  night: { startTime: "21:00", endTime: "06:00" },
                },
                formMessage: { type: "success", text: `${availabilityArray.length} availability entr${availabilityArray.length === 1 ? 'y' : 'ies'} added — will be saved on submit` },
              }));
            }}>
            + Add availability
          </button>
        </div>

        {this.state.entries.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="cr-table">
              <thead>
                <tr>
                  {["Day", "Shift", "Start", "End", ""].map((h) => (
                    <th key={h} className="cr-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {this.state.entries.map((e, i) => {
                  const isFullyOpen = e.day === "All Days" && e.shift === "All Shifts";
                  const dayLabel = e.day === "All Days" ? "All Days" : e.day;
                  const shiftLabel = e.shift === "All Shifts" ? "All Shifts" : (e.shift === "morning" ? "Morning" : e.shift === "evening" ? "Evening" : "Night");

                  return (
                    <tr key={i}>
                      <td className="cr-td"><span className="cr-tag">{dayLabel}</span></td>
                      <td className="cr-td">{shiftLabel}</td>
                      <td className="cr-td">{isFullyOpen ? "—" : (e.startTime || "24/7")}</td>
                      <td className="cr-td">
                        {isFullyOpen ? <span className="cr-ongoing-badge">Available Anytime</span> : (e.endTime || "Available")}
                      </td>
                      <td className="cr-td">
                        <button type="button" className="cr-btn-danger" onClick={() => this.setState((prev) => ({ entries: prev.entries.filter((_, idx) => idx !== i) }))}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ───────────────────────── resume-first screen ───────────────────────── */

  renderResumeScreen = () => {
    const { formMessage, cvUploading } = this.state;
    return (
      <div className="cr-wrap">
        <Helmet><title>Candidate | Registration</title></Helmet>
        <div className="cr-inner" style={{ maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h1 className="cr-page-title">Start Your Profile</h1>
            <p className="cr-page-sub">
              Upload your resume and we'll prefill the form for you — or skip and fill everything in manually.
            </p>
          </div>

          {formMessage && (
            <div className={`cr-alert ${formMessage.type === "success" ? "cr-alert-success" : formMessage.type === "info" ? "cr-alert-info" : "cr-alert-error"}`}>
              <span>{formMessage.text}</span>
              <button className="cr-alert-close" onClick={() => this.setState({ formMessage: null })}>×</button>
            </div>
          )}

          <div className="cr-cv-dropzone">
            <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#36565f", marginBottom: 4 }}>
              Click to upload your resume
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: "1.2rem" }}>
              PDF, DOC, DOCX — max 3MB
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="cr-field-input"
              style={{ maxWidth: 280, margin: "0 auto", background: "#fff" }}
              disabled={cvUploading}
              onChange={this.handleCVUpload}
            />
            {cvUploading && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                ⏳ Parsing your resume, please wait…
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: "1.5rem" }}>
            Prefer to fill everything yourself?{" "}
            <button
              style={{ background: "none", border: "none", color: "#36565f", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
              onClick={this.skipResumeUpload}
            >
              Skip and fill manually
            </button>
          </p>
        </div>
      </div>
    );
  };

  /* ───────────────────────── full form screen ───────────────────────── */

  renderFullForm = () => {
    const { formData, formMessage } = this.state;

    return (
      <div className="cr-wrap">
        <Helmet><title>Candidate | Registration</title></Helmet>
        <div className="cr-inner">
          <h1 className="cr-page-title">Complete Your Profile</h1>
          <p className="cr-page-sub">Review the fields below — anything from your resume is already filled in — then submit.</p>

          {formMessage && (
            <div className={`cr-alert ${formMessage.type === "success" ? "cr-alert-success" : formMessage.type === "info" ? "cr-alert-info" : "cr-alert-error"}`}>
              <span>{formMessage.text}</span>
              <button className="cr-alert-close" onClick={() => this.setState({ formMessage: null })}>×</button>
            </div>
          )}

          <Formik
            enableReinitialize={true}
            innerRef={this.formikRef}
            initialValues={formData}
            validationSchema={this.fullSchema}
            onSubmit={(values, { setSubmitting }) => { setSubmitting(false); }}
          >
            {({ values, setFieldValue, handleSubmit, errors, touched, setFieldError, setFieldTouched }) => (
              <Form onSubmit={handleSubmit}>
                <div className="cr-card">
                  <div className="cr-card-header">
                    <div className="cr-card-header-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#36565f" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    </div>
                    <span className="cr-card-header-title">Candidate Profile</span>
                  </div>
                  <div className="cr-card-body">

                    {this.renderPersonalDetails(values, setFieldValue, errors, touched)}
                    {this.renderEducation(values, setFieldValue)}
                    {this.renderExperience(values, setFieldValue)}
                    {this.renderResume(values, setFieldValue, errors, touched, setFieldTouched, setFieldError)}
                    {this.renderAvailability()}
                  </div>
                  <div className="cr-card-footer">
                    <span />
                    <button type="button" className="cr-btn-next" disabled={this.state.entries.length === 0}
                      onClick={() => this.handleFinalSubmit(values)}>
                      Submit profile ✓
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  };

  /* ───────────────────────── main render ───────────────────────── */

  render() {
    return this.renderFullForm();
  }
}

export default CandidateRegisterForm;
