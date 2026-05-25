  "use client";

  import React, { Component, createRef } from "react";
  import Select from "react-select";
  import AsyncSelect from "react-select/async";
  import { Button, Col, Container, Form } from "reactstrap";
  import { Helmet } from "react-helmet";
  import { Formik, Field, ErrorMessage, FieldArray } from "formik";
  import * as Yup from "yup";
  import api from "../../lib/api";
  import "bootstrap-icons/font/bootstrap-icons.css";

  let faceapi = null;
  let faceapiLoaded = false;

  const T = {
    primary:   "#36565f",
    primary2:  "#36565f",
    primary3:  "#e2f0f0",
    primary4:  "#5f8190",
    slate:     "#36565F",
    slateLight:"#EEF3F4",
    danger:    "#36565f",
    text:      "#1a1a1a",
    textMuted: "#6b7280",
    textLight: "#9ca3af",
    border:    "#e5e7eb",
    borderFocus:"#36565f",
    bg:        "#f8fafb",
    bgCard:    "#ffffff",
    bgSection: "#f4f7f8",
    radius:    "10px",
    radiusSm:  "7px",
    shadow:    "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
    shadowMd:  "0 4px 16px rgba(0,0,0,0.08)",
  };

  const S = {
    wrap: {
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "2rem 1rem 4rem",
    },
    inner: { maxWidth: 820, margin: "0 auto" },

    pageTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: 26,
      fontWeight: 500,
      color: T.text,
      margin: "0 0 4px",
    },
    pageSub: { fontSize: 14, color: T.textMuted, margin: "0 0 2rem" },

    /* stepper */
    stepper: {
      display: "flex",
      gap: 0,
      marginBottom: "2rem",
      overflowX: "auto",
      paddingBottom: 4,
    },
    stepItem: (active, done) => ({
      flex: 1,
      minWidth: 90,
      position: "relative",
      cursor: done ? "pointer" : "default",
    }),
    stepLine: (done) => ({
      position: "absolute",
      top: 17,
      left: "50%",
      width: "100%",
      height: 2,
      background: done ? T.primary : T.border,
      zIndex: 0,
      transition: "background 0.3s",
    }),
    stepInner: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      position: "relative",
      zIndex: 1,
    },
    stepCircle: (active, done) => ({
      width: 34,
      height: 34,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 500,
      background: active ? T.primary : done ? T.primary3 : "#fff",
      border: `2px solid ${active ? T.primary : done ? T.primary : T.border}`,
      color: active ? "#fff" : done ? T.primary2 : T.textMuted,
      transition: "all 0.25s",
    }),
    stepLabel: (active) => ({
      fontSize: 11,
      color: active ? T.primary2 : T.textMuted,
      fontWeight: active ? 500 : 400,
      textAlign: "center",
      lineHeight: 1.3,
    }),

    /* card */
    card: {
      background: T.bgCard,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      overflow: "hidden",
      marginBottom: "1.5rem",
    },
    progressBar: { height: 3, background: T.border },
    progressFill: (pct) => ({
      height: "100%",
      width: `${pct}%`,
      background: T.primary,
      transition: "width 0.4s",
    }),
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "1.1rem 1.4rem",
      borderBottom: `1px solid ${T.border}`,
    },
    cardHeaderIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: T.primary3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    cardHeaderTitle: { fontSize: 15, fontWeight: 500, color: T.text, margin: 0, flex: 1 },
    cardHeaderStep: { fontSize: 12, color: T.textMuted },
    cardBody: { padding: "1.4rem" },
    cardFooter: {
      padding: "1rem 1.4rem",
      borderTop: `1px solid ${T.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: T.bgSection,
    },

    /* photo */
    photoArea: {
      display: "flex",
      alignItems: "center",
      gap: "1.2rem",
      padding: "1rem 1.1rem",
      background: T.bgSection,
      borderRadius: T.radius,
      border: `1.5px dashed ${T.primary4}`,
      marginBottom: "1.4rem",
    },
    photoCircle: {
      width: 68,
      height: 68,
      borderRadius: "50%",
      background: T.primary3,
      border: `2px solid ${T.primary4}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden",
    },
    photoImg: { width: "100%", height: "100%", objectFit: "cover" },

    /* divider */
    divider: { height: 1, background: T.border, margin: "1.2rem 0" },
    sectionLabel: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: T.textMuted,
      marginBottom: "0.8rem",
    },

    /* grid */
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
    grid1: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },

    /* field */
    fieldGroup: { display: "flex", flexDirection: "column", gap: 4 },
    fieldLabel: {
      fontSize: 12,
      fontWeight: 500,
      color: T.textMuted,
      letterSpacing: "0.01em",
    },
    fieldInput: {
      height: 38,
      padding: "0 12px",
      borderRadius: T.radiusSm,
      border: `1px solid ${T.border}`,
      background: "#fff",
      fontSize: 14,
      color: T.text,
      fontFamily: "inherit",
      outline: "none",
      transition: "border-color 0.15s, box-shadow 0.15s",
      width: "100%",
      boxSizing: "border-box",
    },
    fieldInputFocus: {
      borderColor: T.primary,
      boxShadow: `0 0 0 3px ${T.primary}22`,
    },
    fieldInputReadonly: {
      background: T.bgSection,
      color: T.textMuted,
      cursor: "not-allowed",
    },
    fieldTextarea: {
      padding: "9px 12px",
      borderRadius: T.radiusSm,
      border: `1px solid ${T.border}`,
      background: "#fff",
      fontSize: 14,
      color: T.text,
      fontFamily: "inherit",
      outline: "none",
      resize: "vertical",
      minHeight: 80,
      width: "100%",
      boxSizing: "border-box",
    },
    fieldHint: { fontSize: 11, color: T.textLight },
    fieldError: { fontSize: 11, color: T.danger },

    /* buttons */
    btnPrev: {
      padding: "8px 18px",
      borderRadius: T.radiusSm,
      background: "transparent",
      border: `1px solid ${T.border}`,
      color: T.textMuted,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnNext: {
      padding: "8px 22px",
      borderRadius: T.radiusSm,
      background: T.primary,
      border: "none",
      color: "#fff",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    btnAdd: {
      padding: "7px 16px",
      borderRadius: T.radiusSm,
      background: T.primary3,
      border: `1px solid ${T.primary4}`,
      color: T.primary2,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnDanger: {
      padding: "5px 10px",
      borderRadius: T.radiusSm,
      background: "#fef2f0",
      border: `1px solid #f5c4b3`,
      color: T.danger,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnInfo: {
      padding: "5px 10px",
      borderRadius: T.radiusSm,
      background: T.primary3,
      border: `1px solid ${T.primary4}`,
      color: T.primary2,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      marginRight: 6,
    },

    /* alerts */
    alertSuccess: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: "#f0fdf4",
      border: "1px solid #86efac",
      color: "#166534",
      fontSize: 13,
      marginBottom: "1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    alertError: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: "#fff7f5",
      border: "1px solid #f5c4b3",
      color: T.danger,
      fontSize: 13,
      marginBottom: "1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    alertInfo: {
      padding: "10px 14px",
      borderRadius: T.radiusSm,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
      fontSize: 13,
      marginBottom: "1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    /* fresher toggle */
    fresherBox: (on) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: T.radius,
      border: `1.5px solid ${on ? T.primary : T.border}`,
      background: on ? T.primary3 : T.bgSection,
      cursor: "pointer",
      marginBottom: "1.2rem",
      transition: "all 0.2s",
    }),

    /* table */
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13,
      marginTop: "1rem",
    },
    th: {
      padding: "8px 10px",
      textAlign: "left",
      background: T.bgSection,
      borderBottom: `1px solid ${T.border}`,
      fontSize: 11,
      fontWeight: 500,
      color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    td: {
      padding: "9px 10px",
      borderBottom: `1px solid ${T.border}`,
      color: T.text,
      verticalAlign: "middle",
    },

    /* availability tag */
    tag: {
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 20,
      background: T.primary3,
      color: T.primary2,
      fontSize: 12,
      fontWeight: 500,
    },

    /* type selection cards */
    typeCard: (hover) => ({
      background: "#fff",
      border: `2px solid ${hover ? T.primary : T.border}`,
      borderRadius: 14,
      padding: "1.8rem 1.4rem",
      cursor: "pointer",
      transition: "all 0.2s",
      height: "100%",
      boxShadow: hover ? T.shadowMd : "none",
    }),

    /* cv upload */
    cvDropzone: {
      border: `2px dashed ${T.primary4}`,
      borderRadius: T.radius,
      padding: "3rem 2rem",
      textAlign: "center",
      background: T.primary3,
      maxWidth: 480,
      margin: "0 auto",
    },
  };

  /* ─────────────────────────────────────────────
    SMALL REUSABLE COMPONENTS
  ───────────────────────────────────────────── */

  const StyledInput = ({ style = {}, ...props }) => {
    const [focused, setFocused] = React.useState(false);
    return (
      <input
        {...props}
        style={{
          ...S.fieldInput,
          ...(focused ? S.fieldInputFocus : {}),
          ...(props.readOnly ? S.fieldInputReadonly : {}),
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    );
  };

  const StyledSelect = ({ style = {}, ...props }) => (
    <select
      {...props}
      style={{ ...S.fieldInput, cursor: "pointer", ...style }}
    />
  );

  const StyledTextarea = ({ style = {}, ...props }) => (
    <textarea {...props} style={{ ...S.fieldTextarea, ...style }} />
  );

  const FieldWrap = ({ label, required, hint, error, children, span2 = false }) => (
    <div style={{ ...S.fieldGroup, ...(span2 ? { gridColumn: "span 2" } : {}) }}>
      {label && (
        <label style={S.fieldLabel}>
          {label}
          {required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      {children}
      {hint && <span style={S.fieldHint}>{hint}</span>}
      {error && <span style={S.fieldError}>{error}</span>}
    </div>
  );

  const Divider = ({ label }) => (
    <>
      <div style={S.divider} />
      {label && <div style={S.sectionLabel}>{label}</div>}
    </>
  );

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="2,8 6,12 14,4" />
    </svg>
  );

  /* ─────────────────────────────────────────────
    MAIN CLASS
  ───────────────────────────────────────────── */
  class CandidateRegisterForm extends Component {
    constructor(props) {
      super(props);
      this.fileInputRef = React.createRef();
      this.formikRef = React.createRef();

      this.state = {
        // registrationType: null,
        // cvUploadDone: false,
        // cvExtracted: null,
        // cvUploading: false,
        step: 1,
        // hoveredType: null,

        formData: {
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
          photoMessage: null,
          formMessage: null,
          skills: [],
          education: [
            { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false },
          ],
          experience: [
            { companyName: "", speciality_id: "", designation: "", startDate: "", endDate: "", ongoing: false, id: null },
          ],
          resume: null,
          availability: [{ day: "", shift: "", startTime: "", endTime: "" }],
        },
        fileData: { passport_photo: null, resume: null },
        isNewImageUploaded: false,
        countries: [],
        districts: [],
        cities: [],
        skillsOptions: [],
        allCities: [],
        degree: [],
        degreeTitles: [],
        degreeFieldData: [],
        editID: "",
        isEdit: false,
        editexpID: "",
        isExpEdit: false,
        getManager: [],
        getError: "",
        previewUrl: null,
        entries: [],
        editingIndex: null,
        photoMessage: null,
        formMessage: null,
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
      this.shiftOptions = [
        { value: "day", label: "Day Shift" },
        { value: "night", label: "Night Shift" },
        { value: "both", label: "Both" },
      ];
    }

    nextStep = () => this.setState((prev) => ({ step: prev.step + 1 }));
    prevStep = () => this.setState((prev) => ({ step: prev.step - 1 }));

    handleFileChange = (event, fieldName, setFieldValue) => {
      const file = event.target.files[0];
      if (!file) return;
      setFieldValue(fieldName, file);
      this.setState((prev) => ({ fileData: { ...prev.fileData, [fieldName]: file } }));
    };

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

    loadSkills = async () => {
      try {
        const res = await api.get("/getAllskills");
        const skillsArray = Array.isArray(res.data.skills) ? res.data.skills : [];
        this.setState({ skillsOptions: skillsArray });
      } catch (err) {
        this.setState({ formMessage: { type: "error", text: "Could not load skills" } });
      }
    };

    fetchCandidateInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const [profileRes, eduRes, expRes] = await Promise.all([
          api.get("/candidateProfile/candidate", { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`${this.apiBaseUrl}candidateeducation/getallcandidateeducation`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`${this.apiBaseUrl}candidateexperience/getexperience`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const data = profileRes.data || {};
        const entriesFromBackend = (data.availabilityData || []).flatMap((daySlot) =>
          (daySlot.shifts || []).map((shift) => ({
            day: daySlot.day, shift: shift.shift, startTime: shift.startTime, endTime: shift.endTime,
          }))
        );

        const mappedData = {
          ...this.state.formData,
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
            { degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false },
            ...this.mapEducation(eduRes.data || []),
          ],
          experience: [
            { companyName: "", speciality: "", designation: "", startDate: "", endDate: "", ongoing: false },
            ...this.mapExperience(expRes.data?.data || []),
          ],
          passport_photo: data.passport_photo || null,
          resume: data.resume ? {
            name: data.resume.split("/").pop(),
            url: `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${data.resume}`,
            isExisting: true,
          } : null,
          availability: entriesFromBackend,
          country: data.country?.id || "",
          district: data.district?.id || "",
          city: data.city?.id || "",
          isFresher: data.is_fresher || false,
          license_type: data.license_type?.id || "",
          license_number: data.license_number ?? "",
        };

        this.setState({ formData: mappedData });
        if (mappedData.country) await this.loadDistricts(mappedData.country);
        if (mappedData.district) await this.loadCities(mappedData.district);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };

    fetchAvailability = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/candidate_availability/getavailability`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        const entries = raw.map((e) => ({ day: e.day, shift: e.shift, startTime: e.startTime, endTime: e.endTime }));
        this.setState({ entries });
      } catch (err) {
        console.error("Availability fetch failed:", err);
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
        startDate: edu.start_date ? new Date(edu.start_date).toISOString().slice(0, 10) : "",
        endDate: edu.end_date ? new Date(edu.end_date).toISOString().slice(0, 10) : "",
        ongoing: edu.is_ongoing === 1,
      }));

    mapExperience = (list = []) =>
      list.map((exp) => ({
        id: exp.id,
        designation: exp.designation || "",
        speciality_id: exp.speciality_id || "",
        companyName: exp.company_name || "",
        startDate: exp.start_date ? new Date(exp.start_date).toISOString().slice(0, 10) : "",
        endDate: exp.end_date ? new Date(exp.end_date).toISOString().slice(0, 10) : "",
        ongoing: exp.is_ongoing === 1,
      }));

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
    // Load TensorFlow first
    const tf = await import("@tensorflow/tfjs");

    // Set backend
    await tf.setBackend("webgl");

    // Wait until backend is initialized
    await tf.ready();

    // Then load face-api
    faceapi = await import("@vladmandic/face-api");

    // Load models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");

    console.log("Face models loaded successfully");
  } catch (err) {
    console.error("Face model load failed:", err);
  }
};

    componentDidMount() {
      this.loadFaceModels();
      this.loadCountries();
      this.loadSkills();
      this.loadAllCities();
      this.loadSpeciality();
      this.loadLicenseTypes();
      this.loadInstitutes();
      this.loadDegrees();
      this.loadDegreeTitles();
      this.fetchCandidateInfo();
      this.fetchAvailability();
    }

    cvManagerHandler = (e) => {
      const file = e.target.files[0];
      this.setState({ getManager: [file] });
      this.formikRef.current.setFieldValue("resume", file);
    };

    deleteHandler = () => {
      this.setState((prevState) => ({ getManager: [], formData: { ...prevState.formData, resume: null } }));
      if (this.fileInputRef.current) this.fileInputRef.current.value = "";
    };

    handleSubmit = async (values, { setSubmitting }) => {
      try {
        const { step, fileData, formData, entries } = this.state;
        const payload = new FormData();
        payload.append("mode", step === 5 ? "submit" : "save");
        payload.append("current_step", step);

        const fields = ["full_name","phone","email","date_of_birth","gender","marital_status","license_type","license_number","total_experience","speciality","country","district","city","address","current_salary","expected_salary"];
        fields.forEach((field) => {
          const value = values[field];
          if (value !== undefined && value !== null && value !== "") payload.append(field, value);
        });

        if (values.skills?.length) payload.append("skills", JSON.stringify(values.skills));
        if (values.Links?.length) payload.append("Links", JSON.stringify(values.Links));
        if (values.otherPreferredCities?.length) payload.append("otherPreferredCities", JSON.stringify(values.otherPreferredCities));
        if (Array.isArray(entries)) payload.append("availability", JSON.stringify(entries));

        if (fileData.passport_photo instanceof File) payload.append("passport_photo", fileData.passport_photo);
        else if (formData.passport_photo) payload.append("passport_photo", formData.passport_photo);

        if (fileData.resume instanceof File) payload.append("resume", fileData.resume);
        else if (formData.resume) payload.append("resume", formData.resume);

        await api.post("/candidateProfile/candidate/passport-photo", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        this.setState({ formMessage: { type: "success", text: step === 5 ? "Profile submitted successfully" : "Profile saved successfully" } });

        if (step === 5) {
          localStorage.clear();
          sessionStorage.clear();
          setTimeout(() => { window.location.replace("/login"); }, 1500);
          return;
        }
      } catch (error) {
        this.setState({ formMessage: { type: "error", text: "Something went wrong while saving profile" } });
      } finally {
        setSubmitting(false);
      }
    };

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

  this.setState({ cvUploading: true, formMessage: { type: "info", text: "Uploading & parsing CV..." } });

  try {
    const formData = new FormData();
    formData.append("resume", file);

    // ✅ Fix: use the correct route where uploadCV is registered
    const res = await api.post(
      `${this.apiBaseUrl}resume/upload-cv`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (res.data?.success) {
      this.setState({
        cvUploadDone: true,
        cvUploading: false,
        cvExtracted: res.data.extracted,
        formMessage: null,
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

    handleSaveAndNext = async (values) => {
      const { step } = this.state;
      try {
        await this.stepSchemas[step - 1].validate(values, { abortEarly: false });

        if (step === 1) {
          const formData = new FormData();
          formData.append("mode", "save");
          formData.append("current_step", step);
          const fields = ["full_name","phone","date_of_birth","gender","marital_status","license_type","license_number","total_experience","country","district","city","otherPreferredCities","address","current_salary","expected_salary"];
          fields.forEach((field) => {
            const value = values[field];
            if (Array.isArray(value)) formData.append(field, JSON.stringify(value));
            else if (value !== undefined && value !== null) formData.append(field, value);
          });
          if (Array.isArray(values.skills)) formData.append("skills", JSON.stringify(values.skills));
          if (values.passport_photo instanceof File) formData.append("passport_photo", values.passport_photo);
          if (values.resume instanceof File) formData.append("resume", values.resume);
          await api.post(`${this.apiBaseUrl}candidateProfile/candidate/passport-photo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
          });
          this.setState({ formMessage: { type: "success", text: "Step 1 saved successfully" } });
        }

        if (step === 2) {
          const newRows = values.education.slice(1).filter((e) => !e.id && e.degreeTitle && e.startDate);
          const editedRows = values.education.slice(1).filter((e) => e.id && e.degreeTitle && e.startDate);
          if (this.state.isEdit && editedRows.length > 0) {
            await api.put(`${this.apiBaseUrl}candidateeducation/editcandidateeducation`, { education: editedRows });
          }
          if (newRows.length > 0) {
            await api.post(`${this.apiBaseUrl}candidateeducation/addcandidateeducation`, { education: newRows, mode: "save" });
          }
          this.setState({ formMessage: { type: "success", text: "Step 2 saved successfully" } });
        }

        if (step === 3) {
          const formData = new FormData();
          formData.append("mode", "save");
          formData.append("current_step", step);
          formData.append("is_fresher", values.isFresher ? "true" : "false");
          if (Array.isArray(values.skills)) formData.append("skills", JSON.stringify(values.skills));
          await api.post(`${this.apiBaseUrl}candidateProfile/candidate/passport-photo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
          });
          if (values.isFresher) {
            this.setState({ formData: values, formMessage: { type: "success", text: "Saved! Moving to next step..." } }, this.nextStep);
            return;
          }
          const existingExperiences = values.experience.slice(1).filter((e) => e.id);
          const newExperiences = values.experience.slice(1)
            .filter((e) => !e.id && e.companyName && e.designation && e.startDate)
            .map((e) => ({ ...e, speciality_id: e.speciality_id || null }));
          if (newExperiences.length === 0 && existingExperiences.length === 0) {
            this.setState({ formMessage: { type: "error", text: "Please add at least one experience or check 'I am a Fresher'" } });
            return;
          }
          if (this.state.editexpID) {
            const editedRow = values.experience.find((e) => e.id === this.state.editexpID);
            if (editedRow) {
              await api.put(`${this.apiBaseUrl}candidateexperience/updateexperience/${this.state.editexpID}`,
                { ...editedRow, speciality_id: editedRow.speciality_id || null },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
              );
            }
          }
          if (newExperiences.length > 0) {
            await api.post(`${this.apiBaseUrl}candidateexperience/addexperience`, { experience: newExperiences },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
          }
          this.setState({ formMessage: { type: "success", text: "Step 3 saved successfully" } });
        }

        if (step === 4) {
          if (values.resume instanceof File) {
            const formData = new FormData();
            formData.append("resume", values.resume);
            await api.post(`${this.apiBaseUrl}resume/addresume`, formData, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" },
            });
            this.setState({ formMessage: { type: "success", text: "Resume uploaded successfully" } });
          }
        }

        if (this.state.step === 5) {
          if (!this.state.entries || this.state.entries.length === 0) {
            this.setState({ formMessage: { type: "error", text: "Please add at least one availability entry before proceeding" } });
            return;
          }
          const payload = { availability: this.state.entries.map((e) => ({ day: e.day, shift: e.shift, startTime: e.startTime, endTime: e.endTime })) };
          await api.post(`${this.apiBaseUrl}candidate_availability/addavailability`, payload, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          this.setState({ formMessage: { type: "success", text: "Availability saved successfully" } });
          localStorage.removeItem("token");
          setTimeout(() => { window.location.href = "/login"; }, 1500);
          return;
        }

        this.setState({ formData: values, editID: null }, this.nextStep);
      } catch (err) {
        if (err.name === "ValidationError") {
          this.setState({ formMessage: { type: "error", text: err.inner?.[0]?.message || err.message } });
          return;
        }
        this.setState({ formMessage: { type: "error", text: "Save failed" } });
      }
    };

    stepSchemas = [
      Yup.object().shape({
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
      }),
      Yup.object().shape({
        education: Yup.array().test("education-required", "Please add at least one education entry", (eduArr) => {
          if (!eduArr || eduArr.length <= 1) return false;
          return eduArr.slice(1).some((e) => e.degreeTitle && e.startDate);
        }),
      }),
      Yup.object().shape({
        isFresher: Yup.boolean(),
        experience: Yup.array().when("isFresher", {
          is: true,
          then: () => Yup.array().notRequired(),
          otherwise: () => Yup.array().test("experience-required", "Please add at least one experience", (expArr) => {
            if (!expArr || expArr.length <= 1) return false;
            return expArr.slice(1).every((e) => e.designation && e.companyName);
          }),
        }),
      }),
      Yup.object().shape({
        resume: Yup.mixed().required("Upload resume first").test("fileSize", "File size must be less than 3MB", function (value) {
          if (value instanceof File) return value.size <= 3 * 1024 * 1024;
          return true;
        }),
      }),
      Yup.object().shape({
        availability: Yup.array().of(Yup.object().shape({
          day: Yup.string().required("Required"),
          shift: Yup.string().required("Required"),
          startTime: Yup.string().required("Required"),
          endTime: Yup.string().required("Required"),
        })),
      }),
    ];

    /* ─── STEPPER ─── */
    renderStepper = () => {
      const { step, formData } = this.state;
      const isStepFilled = (n) => {
        switch (n) {
          case 1: return formData.full_name || formData.phone || formData.email;
          case 2: return formData.education?.slice(1).some((e) => e.degreeTitle || e.institutes);
          case 3: return formData.experience?.some((e) => e.designation || e.companyName);
          case 4: return Boolean(formData.resume);
          case 5: return this.state.entries.length > 0;
          default: return false;
        }
      };
      const stepNames = ["Personal Details","Education","Work Experience","Upload Resume","Availability"];
      return (
        <div style={S.stepper}>
          {stepNames.map((name, index) => {
            const n = index + 1;
            const active = step === n;
            const done = n < step || isStepFilled(n);
            return (
              <div key={index} style={S.stepItem(active, done)} onClick={() => done && this.setState({ step: n })}>
                {index < stepNames.length - 1 && <div style={S.stepLine(done || n < step)} />}
                <div style={S.stepInner}>
                  <div style={S.stepCircle(active, done && n < step)}>
                    {done && n < step ? <CheckIcon /> : n}
                  </div>
                  <div style={S.stepLabel(active)}>{name}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    /* ─── CARD WRAPPER ─── */
    renderCard = (icon, title, stepNum, progress, children, footerLeft, footerRight) => (
      <div style={S.card}>
        <div style={S.progressBar}><div style={S.progressFill(progress)} /></div>
        <div style={S.cardHeader}>
          <div style={S.cardHeaderIcon}>{icon}</div>
          <span style={S.cardHeaderTitle}>{title}</span>
          <span style={S.cardHeaderStep}>Step {stepNum} of 5</span>
        </div>
        <div style={S.cardBody}>{children}</div>
        <div style={S.cardFooter}>
          {footerLeft}
          {footerRight}
        </div>
      </div>
    );

    /* ─── STEP 1 ─── */
    renderStep1 = (values, setFieldValue, errors, touched) => (
      <>
        {/* Photo upload */}
        <div style={S.photoArea}>
          <div style={S.photoCircle}>
            {values.passport_photoPreview
              ? <img src={values.passport_photoPreview} alt="Profile" style={S.photoImg} />
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>Profile Photo</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Clear face photo — JPG or PNG, max 5MB</div>
            <label style={{ ...S.btnAdd, display: "inline-block", cursor: "pointer" }}>
              Choose photo
              <input type="file" name="passport_photo" accept=".jpg,.jpeg,.png" style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const allowedTypes = ["image/jpeg","image/jpg","image/png"];
                  if (!allowedTypes.includes(file.type)) {
                    this.setState({ photoMessage: { type: "error", text: "Only JPG or PNG image is allowed!" } });
                    e.target.value = ""; return;
                  }
                  const img = document.createElement("img");
                  img.src = URL.createObjectURL(file);
                  img.onload = async () => {
                    try {
                      if (!faceapi) {
                        this.setState({ photoMessage: { type: "error", text: "Face detection not ready, please try again." } });
                        e.target.value = ""; return;
                      }
                      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());
                      if (!detection) {
                        this.setState({ photoMessage: { type: "error", text: "No face detected! Please upload a clear face photo." } });
                        e.target.value = ""; return;
                      }
                      this.setState({ photoMessage: { type: "success", text: "Photo accepted!" } });
                      setFieldValue("passport_photo", file);
                      const reader = new FileReader();
                      reader.onload = () => setFieldValue("passport_photoPreview", reader.result);
                      reader.readAsDataURL(file);
                    } catch (err) {
                      this.setState({ photoMessage: { type: "error", text: "Could not verify photo." } });
                      e.target.value = "";
                    }
                  };
                }}
              />
            </label>
          </div>
        </div>

        {this.state.photoMessage && (
          <div style={this.state.photoMessage.type === "success" ? S.alertSuccess : S.alertError}>
            <span>{this.state.photoMessage.text}</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
              onClick={() => this.setState({ photoMessage: null })}>×</button>
          </div>
        )}

        {/* Row 1 */}
        <div style={S.grid2}>
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

        {/* Row 2 */}
        <div style={{ ...S.grid2, marginTop: 14 }}>
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

        {/* Row 3 */}
        <div style={{ ...S.grid2, marginTop: 14 }}>
          <FieldWrap label="Gender">
            <Field as="select" name="gender" style={{ ...S.fieldInput, cursor: "pointer" }}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Field>
          </FieldWrap>
          <FieldWrap label="Marital status">
            <Field as="select" name="marital_status" style={{ ...S.fieldInput, cursor: "pointer" }}>
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
            </Field>
          </FieldWrap>
        </div>

        <Divider label="License information" />

        <div style={S.grid2}>
          <FieldWrap label="License type">
            <Field as="select" name="license_type" style={{ ...S.fieldInput, cursor: "pointer" }}
              onChange={(e) => setFieldValue("license_type", e.target.value)}>
              <option value="">Select license type</option>
              {(this.state.licenseTypes || []).map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </Field>
          </FieldWrap>
          <FieldWrap label="License number" required error={touched.license_number && errors.license_number}>
            <Field name="license_number">
              {({ field }) => <StyledInput {...field} placeholder="e.g. PMC-12345" />}
            </Field>
          </FieldWrap>
        </div>

        <Divider label="Salary & experience" />

        <div style={S.grid3}>
          <FieldWrap label="Current salary">
            <Field name="current_salary">
              {({ field, form }) => (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.textMuted, pointerEvents: "none" }}></span>
                  <StyledInput {...field} placeholder="0" style={{ paddingLeft: 40 }}
                    value={field.value ? Number(field.value).toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (/^\d*$/.test(raw)) form.setFieldValue("current_salary", raw);
                    }}
                  />
                </div>
              )}
            </Field>
          </FieldWrap>
          <FieldWrap label="Expected salary">
            <Field name="expected_salary">
              {({ field, form }) => (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.textMuted, pointerEvents: "none" }}></span>
                  <StyledInput {...field} placeholder="0" style={{ paddingLeft: 40 }}
                    value={field.value ? Number(field.value).toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (/^\d*$/.test(raw)) form.setFieldValue("expected_salary", raw);
                    }}
                  />
                </div>
              )}
            </Field>
          </FieldWrap>
          <FieldWrap label="Total experience (optional)">
            <Field name="total_experience">
              {({ field }) => <StyledInput {...field} placeholder="e.g. 3 years" />}
            </Field>
          </FieldWrap>
        </div>

        <Divider label="Location" />

        <div style={S.grid3}>
          <FieldWrap label="Country">
            <Field as="select" name="country" style={{ ...S.fieldInput, cursor: "pointer" }}
              onChange={(e) => {
                const countryId = e.target.value;
                setFieldValue("country", countryId);
                setFieldValue("district", "");
                setFieldValue("city", "");
                this.loadDistricts(countryId);
              }}>
              <option value="">Select country</option>
              {this.state.countries.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Field>
          </FieldWrap>
          <FieldWrap label="District">
            <Field as="select" name="district" style={{ ...S.fieldInput, cursor: "pointer" }}
              onChange={(e) => {
                const districtId = e.target.value;
                setFieldValue("district", districtId);
                setFieldValue("city", "");
                this.loadCities(districtId);
              }}>
              <option value="">Select district</option>
              {this.state.districts.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
            </Field>
          </FieldWrap>
          <FieldWrap label="City">
            <Field as="select" name="city" style={{ ...S.fieldInput, cursor: "pointer" }}>
              <option value="">Select city</option>
              {this.state.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Field>
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
              styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
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
      </>
    );

    /* ─── STEP 2 ─── */
    renderStep2 = (values, setFieldValue) => (
      <FieldArray name="education">
        {({ push, remove }) => {
          const draft = values.education?.[0] || { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false };
          return (
            <>
              <div style={{ background: T.bgSection, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "1.1rem", marginBottom: "1.2rem" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: "0.9rem" }}>Add education</div>
                <div style={S.grid2}>
                  <FieldWrap label="Degree">
                    <Field as="select" name="education.0.degree" style={{ ...S.fieldInput, cursor: "pointer" }}
                      onChange={(e) => {
                        setFieldValue("education.0.degree", e.target.value);
                        setFieldValue("education.0.degreeTitle", "");
                        setFieldValue("education.0.degreeTitle_label", "");
                      }}>
                      <option value="">Select degree</option>
                      {this.state.degreeFieldData.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                    </Field>
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
                      styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
                    />
                  </FieldWrap>
                </div>
                <div style={{ ...S.grid2, marginTop: 14 }}>
                  <FieldWrap label="Institute">
                    <AsyncSelect cacheOptions defaultOptions loadOptions={this.loadInstitutes}
                      value={draft.institutes ? { value: draft.institutes, label: draft.institutes_label } : null}
                      onChange={(opt) => setFieldValue("education.0", { ...draft, institutes: opt?.value || "", institutes_label: opt?.label || "" })}
                      styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
                    />
                  </FieldWrap>
                  <FieldWrap label="Start date">
                    <Field type="date" name="education.0.startDate" style={{ ...S.fieldInput }} />
                  </FieldWrap>
                </div>
                <div style={{ ...S.grid2, marginTop: 14 }}>
                  <FieldWrap label="End date">
                    <Field type="date" name="education.0.endDate" style={{ ...S.fieldInput }} disabled={draft.ongoing} />
                  </FieldWrap>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                    <Field type="checkbox" name="education.0.ongoing"
                      style={{ width: 16, height: 16, accentColor: T.primary, cursor: "pointer" }} />
                    <label style={{ fontSize: 13, color: T.textMuted, cursor: "pointer" }}>Ongoing</label>
                  </div>
                </div>
                <button type="button" style={{ ...S.btnAdd, marginTop: "1rem" }}
                  onClick={() => {
                    if (!draft.degree || !draft.degreeTitle) {
                      this.setState({ formMessage: { type: "error", text: "Please fill required fields" } });
                      return;
                    }
                    if (draft.id) {
                      const index = values.education.findIndex((e) => e.id === draft.id);
                      if (index > -1) setFieldValue(`education.${index}`, draft);
                    } else {
                      push({ ...draft });
                    }
                    setFieldValue("education.0", { degree: "", degreeTitle: "", degreeTitle_label: "", institutes: "", startDate: "", endDate: "", ongoing: false, id: null });
                    this.setState({ editID: null });
                  }}>
                  + Add education
                </button>
              </div>

              {values.education.length > 1 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["Degree","Title","Institute","Start","End",""].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {values.education.slice(1).map((edu, i) => (
                        <tr key={edu.id || i}>
                          <td style={S.td}>{edu.degreeTitle_label}</td>
                          <td style={S.td}>{edu.degreeTitle_label}</td>
                          <td style={S.td}>{edu.institutes_label}</td>
                          <td style={S.td}>{edu.startDate}</td>
                          <td style={S.td}>{edu.endDate || "—"}</td>
                          <td style={S.td}>
                            <button type="button" style={S.btnInfo}
                              onClick={() => { setFieldValue("education.0", { ...edu }); this.setState({ editID: edu.id, isEdit: true }); remove(i + 1); }}>
                              Edit
                            </button>
                            <button type="button" style={S.btnDanger}
                              onClick={() => {
                                if (edu.id) {
                                  api.delete(`${this.apiBaseUrl}candidateeducation/deletecandidateeducation/${edu.id}`)
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
    );

    /* ─── STEP 3 ─── */
    renderStep3 = (values, setFieldValue) => (
      <FieldArray name="experience">
        {({ push, remove }) => {
          const draft = values.experience?.[0] || { companyName: "", designation: "", speciality_id: "", startDate: "", endDate: "", ongoing: false, id: null };
          return (
            <>
              {/* Fresher toggle */}
              <div style={S.fresherBox(values.isFresher)}
                onClick={() => {
                  setFieldValue("isFresher", !values.isFresher);
                  if (!values.isFresher) setFieldValue("experience", [{}]);
                }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: values.isFresher ? T.primary : T.border, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: values.isFresher ? 18 : 2, transition: "left 0.2s" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: values.isFresher ? T.primary2 : T.text }}>I am a Fresher</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                    {values.isFresher ? "Work experience section will be skipped" : "Check this if you have no work experience"}
                  </div>
                </div>
              </div>

              {/* Experience form */}
              <div style={{ background: T.bgSection, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "1.1rem", marginBottom: "1.2rem" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: "0.9rem" }}>Add experience</div>
                <div style={S.grid2}>
                  <FieldWrap label="Company name">
                    <Field type="text" name="experience.0.companyName" style={S.fieldInput} placeholder="Company name" />
                  </FieldWrap>
                  <FieldWrap label="Designation">
                    <Field type="text" name="experience.0.designation" style={S.fieldInput} placeholder="Your role" />
                  </FieldWrap>
                </div>
                <div style={{ ...S.grid2, marginTop: 14 }}>
                  <FieldWrap label="Speciality">
                    <Field as="select" name="experience.0.speciality_id" style={{ ...S.fieldInput, cursor: "pointer" }}>
                      <option value="">Select speciality</option>
                      {Array.isArray(this.state.speciality) && this.state.speciality.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </Field>
                  </FieldWrap>
                  <FieldWrap label="Start date">
                    <Field type="date" name="experience.0.startDate" style={S.fieldInput} max={new Date().toISOString().split("T")[0]} />
                  </FieldWrap>
                </div>
                <div style={{ ...S.grid2, marginTop: 14 }}>
                  <FieldWrap label="End date">
                    <Field type="date" name="experience.0.endDate" style={S.fieldInput} disabled={draft.ongoing} max={new Date().toISOString().split("T")[0]} />
                  </FieldWrap>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                    <Field type="checkbox" name="experience.0.ongoing" style={{ width: 16, height: 16, accentColor: T.primary, cursor: "pointer" }} />
                    <label style={{ fontSize: 13, color: T.textMuted }}>Ongoing</label>
                  </div>
                </div>
                <button type="button" style={{ ...S.btnAdd, marginTop: "1rem" }}
                  onClick={() => {
                    if (!draft.companyName || !draft.designation || !draft.startDate) {
                      this.setState({ formMessage: { type: "error", text: "Please fill required fields" } });
                      return;
                    }
                    const expToPush = { ...draft, speciality_id: draft.speciality_id ? Number(draft.speciality_id) : "" };
                    if (this.state.editexpID) push({ ...expToPush, id: this.state.editexpID });
                    else push(expToPush);
                    setFieldValue("experience.0", { companyName: "", designation: "", speciality_id: "", startDate: "", endDate: "", ongoing: false, id: null });
                    this.setState({ editexpID: null });
                  }}>
                  + Add experience
                </button>
              </div>

              {/* Skills */}
              <div style={{ background: T.bgSection, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "1.1rem", marginBottom: "1.2rem" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: "0.9rem" }}>Skills</div>
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
                      styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
                    />
                  )}
                </Field>
              </div>

              {/* Experience table */}
              {values.experience.length > 1 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>{["Company","Designation","Speciality","Start","End",""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {values.experience.slice(1).map((exp, i) => (
                        <tr key={exp.id || i}>
                          <td style={S.td}>{exp.companyName}</td>
                          <td style={S.td}>{exp.designation}</td>
                          <td style={S.td}>{this.state.speciality?.find((s) => s.id === exp.speciality_id)?.name || "—"}</td>
                          <td style={S.td}>{exp.startDate}</td>
                          <td style={S.td}>{exp.endDate || "—"}</td>
                          <td style={S.td}>
                            <button type="button" style={S.btnInfo}
                              onClick={() => { setFieldValue("experience.0", { ...exp }); remove(i + 1); this.setState({ editexpID: exp.id, isExpEdit: true }); }}>
                              Edit
                            </button>
                            <button type="button" style={S.btnDanger}
                              onClick={() => {
                                if (exp.id) {
                                  api.delete(`${this.apiBaseUrl}candidateexperience/deleteexperience/${exp.id}`)
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
    );

    /* ─── STEP 4 ─── */
    renderStep4 = (values, setFieldValue, errors, touched, setFieldTouched, setFieldError) => (
      <>
        {values.resume && (
          <div style={{ ...S.alertInfo, marginBottom: "1.2rem" }}>
            <span>
              Uploaded:{" "}
              <a href={values.resume.url || URL.createObjectURL(values.resume)} target="_blank" rel="noopener noreferrer"
                style={{ color: "inherit", fontWeight: 500 }}>
                {values.resume.name}
              </a>
            </span>
            {!values.resume.isExisting && (
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
                onClick={() => setFieldValue("resume", null)}>×</button>
            )}
          </div>
        )}

        <div style={{ border: `2px dashed ${T.primary4}`, borderRadius: T.radius, padding: "2.5rem 1.5rem", textAlign: "center", background: T.primary3 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: T.text, marginBottom: 4 }}>Click to upload your resume</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: "1.2rem" }}>PDF, DOC, DOCX — max 3MB</div>
          <label style={{ ...S.btnNext, display: "inline-flex", cursor: "pointer" }}>
            Browse file
            <input type="file" name="resume" accept=".doc,.docx,application/msword,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                setFieldTouched("resume", true);
                if (file) {
                  const maxSize = 3 * 1024 * 1024;
                  const allowedTypes = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                  if (!allowedTypes.includes(file.type)) { setFieldError("resume", "Invalid file type"); setFieldValue("resume", null); }
                  else if (file.size > maxSize) { setFieldError("resume", "File too large — max 3MB"); setFieldValue("resume", null); }
                  else { setFieldValue("resume", file); setFieldError("resume", ""); }
                }
              }}
            />
          </label>
          {errors.resume && touched.resume && (
            <div style={{ ...S.fieldError, marginTop: 8 }}>{errors.resume}</div>
          )}
        </div>
      </>
    );

    /* ─── STEP 5 ─── */
    renderStep5 = () => (
      <>
        <div style={{ background: T.bgSection, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "1.1rem", marginBottom: "1.2rem" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: "0.9rem" }}>Add availability</div>
          <div style={S.grid2}>
            <FieldWrap label="Day(s)">
              <Select isMulti
                options={this.state.dayOptions}
                value={this.state.dayOptions.filter((o) => (this.state.currentEntry?.day || []).includes(o.value))}
                onChange={(selected) => this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, day: selected ? selected.map((o) => o.value) : [] } }))}
                placeholder="Select days..."
                styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
              />
            </FieldWrap>
            <FieldWrap label="Shift">
              <Select
                options={this.state.shiftOptions}
                value={this.state.shiftOptions.find((o) => o.value === this.state.currentEntry?.shift) || null}
                onChange={(option) => this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, shift: option.value } }))}
                placeholder="Select shift"
                styles={{ control: (b) => ({ ...b, borderColor: T.border, borderRadius: T.radiusSm, fontSize: 14, minHeight: 38 }) }}
              />
            </FieldWrap>
          </div>
          <div style={{ ...S.grid2, marginTop: 14 }}>
            <FieldWrap label="Start time">
              <StyledInput type="time" value={this.state.currentEntry?.startTime || ""}
                onChange={(e) => this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, startTime: e.target.value } }))} />
            </FieldWrap>
            <FieldWrap label="End time">
              <StyledInput type="time" value={this.state.currentEntry?.endTime || ""}
                onChange={(e) => this.setState((prev) => ({ currentEntry: { ...prev.currentEntry, endTime: e.target.value } }))} />
            </FieldWrap>
          </div>
          <button type="button" style={{ ...S.btnAdd, marginTop: "1rem" }}
            onClick={async () => {
              const { currentEntry } = this.state;
              if (!currentEntry?.day?.length || !currentEntry.shift || !currentEntry.startTime || !currentEntry.endTime) {
                this.setState({ formMessage: { type: "error", text: "Please fill all fields before adding" } });
                return;
              }
              try {
                const payload = currentEntry.day.map((dayValue) => ({ day: dayValue, shift: currentEntry.shift, startTime: currentEntry.startTime, endTime: currentEntry.endTime }));
                await api.post(`${this.apiBaseUrl}candidate_availability/addavailability`, { availability: payload }, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                this.setState((prev) => ({
                  entries: [...prev.entries, ...payload],
                  currentEntry: { day: [], shift: "", startTime: "", endTime: "" },
                  formMessage: { type: "success", text: "Availability added" },
                }));
              } catch (err) {
                this.setState({ formMessage: { type: "error", text: "Failed to add availability" } });
              }
            }}>
            + Add availability
          </button>
        </div>

        {this.state.entries.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>{["Day","Shift","Start","End",""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {this.state.entries.map((e, i) => (
                  <tr key={i}>
                    <td style={S.td}><span style={S.tag}>{e.day}</span></td>
                    <td style={S.td}>{e.shift}</td>
                    <td style={S.td}>{e.startTime}</td>
                    <td style={S.td}>{e.endTime}</td>
                    <td style={S.td}>
                      <button type="button" style={S.btnDanger}
                        onClick={() => this.setState((prev) => ({ entries: prev.entries.filter((_, idx) => idx !== i) }))}>
                        Remove
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

    renderStep = (values, setFieldValue, errors, touched, setFieldTouched, setFieldError) => {
      const { step } = this.state;
      switch (step) {
        case 1: return this.renderStep1(values, setFieldValue, errors, touched);
        case 2: return this.renderStep2(values, setFieldValue);
        case 3: return this.renderStep3(values, setFieldValue);
        case 4: return this.renderStep4(values, setFieldValue, errors, touched, setFieldTouched, setFieldError);
        case 5: return this.renderStep5();
        default: return null;
      }
    };

    getStepMeta = () => {
      const { step } = this.state;
      const icons = [
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary2} strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary2} strokeWidth="1.8"><path d="M12 2l2 7h7l-5.7 4.1 2.2 6.9L12 16l-5.5 4 2.2-6.9L3 9h7z"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary2} strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 00-2 4h12a2 2 0 00-2-4z"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary2} strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary2} strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      ];
      const titles = ["Personal Details","Education","Work Experience & Skills","Upload Resume","Availability"];
      const progress = [20, 40, 60, 80, 100];
      return { icon: icons[step - 1], title: titles[step - 1], progress: progress[step - 1] };
    };

    /* ─── TYPE SELECTION ─── */
    renderTypeSelection = () => {
      const { hoveredType } = this.state;
      return (
        <div style={S.wrap}>
          <Helmet><title>Candidate | Registration</title></Helmet>
          <div style={S.inner}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h1 style={S.pageTitle}>Complete Your Profile</h1>
              <p style={S.pageSub}>Choose how you want to register</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 680, margin: "0 auto" }}>
              {/* Manual */}
              <div style={S.typeCard(hoveredType === "manual")}
                onMouseEnter={() => this.setState({ hoveredType: "manual" })}
                onMouseLeave={() => this.setState({ hoveredType: null })}
                onClick={() => this.setState({ registrationType: "manual" })}>
                <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>📝</div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: T.text, textAlign: "center", margin: "0 0 8px" }}>Fill Form Manually</h3>
                <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "0 0 16px" }}>
                  Step-by-step form for personal details, education and experience
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: 13, color: T.textMuted }}>
                  <li style={{ marginBottom: 6 }}>✅ Full control over your profile</li>
                  <li style={{ marginBottom: 6 }}>✅ Better matching with employers</li>
                  <li style={{ marginBottom: 6 }}>⏱ Takes 5–10 minutes</li>
                </ul>
                <button style={{ ...S.btnNext, width: "100%", justifyContent: "center" }}>
                  Fill manually →
                </button>
              </div>
              {/* CV Upload */}
              <div style={S.typeCard(hoveredType === "cv_only")}
                onMouseEnter={() => this.setState({ hoveredType: "cv_only" })}
                onMouseLeave={() => this.setState({ hoveredType: null })}
                onClick={() => this.setState({ registrationType: "cv_only" })}>
                <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>📄</div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: T.text, textAlign: "center", margin: "0 0 8px" }}>Upload CV Only</h3>
                <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "0 0 16px" }}>
                  Upload your CV and complete your profile later from your dashboard
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: 13, color: T.textMuted }}>
                  <li style={{ marginBottom: 6 }}>⚡ Quick — takes 1 minute</li>
                  <li style={{ marginBottom: 6 }}>📂 CV saved to your profile</li>
                  <li style={{ marginBottom: 6 }}>📋 Can complete profile later</li>
                </ul>
                <button style={{ ...S.btnNext, width: "100%", justifyContent: "center", background: T.slate }}>
                  Upload CV →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    /* ─── CV UPLOAD ─── */
    renderCVUpload = () => {
      const { formMessage, cvUploading } = this.state;
      return (
        <div style={S.wrap}>
          <Helmet><title>Candidate | Upload CV</title></Helmet>
          <div style={{ ...S.inner, maxWidth: 560 }}>
            <button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14, marginBottom: "1.5rem", padding: 0 }}
              onClick={() => this.setState({ registrationType: null })}>
              ← Back
            </button>
            <h1 style={S.pageTitle}>Upload Your CV</h1>
            <p style={{ ...S.pageSub, marginBottom: "1.5rem" }}>We'll save your CV and you can complete your profile from the dashboard</p>

            {formMessage && (
              <div style={formMessage.type === "success" ? S.alertSuccess : formMessage.type === "info" ? S.alertInfo : S.alertError}>
                <span>{formMessage.text}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
                  onClick={() => this.setState({ formMessage: null })}>×</button>
              </div>
            )}

            <div style={S.cvDropzone}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: T.primary2, marginBottom: 4 }}>Click to upload your CV</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: "1.2rem" }}>PDF, DOC, DOCX — Max 3MB</div>
              <input type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ ...S.fieldInput, maxWidth: 280, margin: "0 auto", background: "#fff" }}
                disabled={cvUploading}
                onChange={this.handleCVUpload}
              />
              {cvUploading && (
                <div style={{ marginTop: 12, fontSize: 13, color: T.textMuted }}>
                  Uploading...
                </div>
              )}
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: T.textMuted, marginTop: "1.5rem" }}>
              Want to fill manually instead?{" "}
              <button style={{ background: "none", border: "none", color: T.primary, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                onClick={() => this.setState({ registrationType: "manual" })}>
                Click here
              </button>
            </p>
          </div>
        </div>
      );
    };

    /* ─── CV SUCCESS ─── */
    renderCVSuccess = () => (
      <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Helmet><title>Candidate | CV Uploaded</title></Helmet>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.primary3, border: `2px solid ${T.primary4}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <h2 style={{ ...S.pageTitle, marginBottom: 8 }}>CV Uploaded Successfully!</h2>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: "2rem" }}>
            Your CV has been saved. You can complete your profile anytime from your dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={S.btnNext}
              onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.replace("/login"); }}>
              Go to login →
            </button>
            <button style={S.btnPrev}
              onClick={() => this.setState({ registrationType: "manual", cvUploadDone: false, cvExtracted: null })}>
              Complete profile now
            </button>
          </div>
        </div>
      </div>
    );

    /* ─── MAIN RENDER ─── */
    render() {
      const { step, formData, formMessage, photoMessage, registrationType, cvUploadDone } = this.state;

      // if (!registrationType) return this.renderTypeSelection();
      // if (registrationType === "cv_only" && !cvUploadDone) return this.renderCVUpload();
      // if (registrationType === "cv_only" && cvUploadDone) return this.renderCVSuccess();

      const { icon, title, progress } = this.getStepMeta();

      return (
        <div style={S.wrap}>
          <Helmet><title>Candidate | Registration</title></Helmet>
          <div style={S.inner}>
            <h1 style={S.pageTitle}>Candidate Registration</h1>
            <p style={S.pageSub}>Complete your profile to get matched with the right employers</p>

            {formMessage && (
              <div style={formMessage.type === "success" ? S.alertSuccess : formMessage.type === "info" ? S.alertInfo : S.alertError}>
                <span>{formMessage.text}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
                  onClick={() => this.setState({ formMessage: null })}>×</button>
              </div>
            )}

            {this.renderStepper()}

            <Formik
              enableReinitialize={true}
              innerRef={this.formikRef}
              initialValues={formData}
              validationSchema={this.stepSchemas[step - 1]}
              onSubmit={this.handleSubmit}
            >
              {({ values, setFieldValue, handleSubmit, errors, touched, setFieldError, setFieldTouched }) => (
                <Form onSubmit={handleSubmit}>
                  {this.renderCard(
                    icon, title, step, progress,
                    this.renderStep(values, setFieldValue, errors, touched, setFieldTouched, setFieldError),
                    /* footer left */
                    step > 1
                      ? <button type="button" style={S.btnPrev} onClick={this.prevStep}>← Previous</button>
                      : <span />,
                    /* footer right */
                    step < 5
                      ? <button type="button" style={S.btnNext} onClick={() => this.handleSaveAndNext(values)}>
                          Save & next
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
                        </button>
                      : <button type="button" style={{ ...S.btnNext, opacity: this.state.entries.length === 0 ? 0.5 : 1 }}
                          onClick={() => this.handleSubmit(values, { setSubmitting: () => {} })}
                          disabled={this.state.entries.length === 0}>
                          Submit profile ✓
                        </button>
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      );
    }
  }

  export default CandidateRegisterForm;
