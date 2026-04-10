"use client";
import React, { Component, createRef } from "react";
import { Modal, ModalBody, ModalHeader, Container } from "reactstrap";
import AsyncSelect from "react-select/async";
import AsyncCreatableSelect from "react-select/async-creatable";
import axios from "axios";
import PricingForm from "./pricingform";
import api from "../lib/api";
import { withRouter } from "next/router";
import Head from "next/head";

/* ─────────────────────────────────────────────
   Indeed-style design tokens
───────────────────────────────────────────── */
const BLUE = "#36565f";
const BLUE_LIGHT = "#e8f0fe";
const BLUE_TEXT = "#000";
const BORDER = "#d1d5db";
const BORDER_FOCUS = "#36565f";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6b7280";
const BG = "#f9fafb";
const WHITE = "#ffffff";
const RED = "#dc2626";
const RED_LIGHT = "#fef2f2";

const indeedSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "44px",
    borderRadius: "8px",
    border: state.isFocused
      ? `1.5px solid ${BORDER_FOCUS}`
      : `1.5px solid ${BORDER}`,
    boxShadow: state.isFocused
      ? "0 0 0 3px rgba(33,100,243,0.12)"
      : "none",
    backgroundColor: WHITE,
    fontSize: "14px",
    cursor: "pointer",
    transition: "border 0.15s, box-shadow 0.15s",
    "&:hover": { borderColor: "#9ca3af" },
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "14px" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? BLUE
      : state.isFocused
      ? BLUE_LIGHT
      : WHITE,
    color: state.isSelected ? WHITE : TEXT_PRIMARY,
    fontSize: "14px",
    cursor: "pointer",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: BLUE_LIGHT,
    borderRadius: "20px",
    padding: "0 4px",
  }),
  multiValueLabel: (base) => ({ ...base, color: BLUE_TEXT, fontSize: "12px", fontWeight: 500 }),
  multiValueRemove: (base) => ({
    ...base,
    color: BLUE_TEXT,
    borderRadius: "50%",
    "&:hover": { backgroundColor: "#c7d9fd", color: BLUE },
  }),
  singleValue: (base) => ({ ...base, color: TEXT_PRIMARY, fontSize: "14px" }),
  menu: (base) => ({ ...base, borderRadius: "8px", border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 99 }),
  indicatorSeparator: () => ({ display: "none" }),
};

/* ─────────────────────────────────────────────
   Shared inline style helpers
───────────────────────────────────────────── */
const s = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "28px 16px 64px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: TEXT_PRIMARY,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  brandLogo: {
    width: "34px",
    height: "34px",
    background: BLUE,
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: WHITE,
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "-0.5px",
    flexShrink: 0,
  },
  brandName: {
    fontSize: "18px",
    fontWeight: 700,
    color: TEXT_PRIMARY,
    letterSpacing: "-0.3px",
  },
  progressWrap: {
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "2px",
    marginBottom: "24px",
    overflow: "hidden",
  },
  stepsRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "28px",
  },
  stepLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb",
    margin: "0 8px",
    maxWidth: "80px",
  },
  pageHeading: {
    fontSize: "22px",
    fontWeight: 700,
    color: TEXT_PRIMARY,
    marginBottom: "4px",
    letterSpacing: "-0.4px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: TEXT_SECONDARY,
    marginBottom: "20px",
  },
  notice: {
    display: "flex",
    gap: "10px",
    padding: "12px 16px",
    background: BLUE_LIGHT,
    borderRadius: "8px",
    borderLeft: `3px solid ${BLUE}`,
    marginBottom: "20px",
    fontSize: "13px",
    color: BLUE_TEXT,
  },
  card: {
    background: WHITE,
    border: `1px solid #e5e7eb`,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: TEXT_SECONDARY,
    marginBottom: "18px",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  row3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 120px",
    gap: "12px",
    marginBottom: "0",
  },
  row1: {
    marginBottom: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: TEXT_PRIMARY,
  },
  req: {
    color: RED,
    marginLeft: "2px",
  },
  input: {
    height: "44px",
    padding: "0 14px",
    fontSize: "14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    background: WHITE,
    color: TEXT_PRIMARY,
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  },
  inputErr: {
    borderColor: RED,
  },
  textarea: {
    padding: "12px 14px",
    fontSize: "14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    background: WHITE,
    color: TEXT_PRIMARY,
    width: "100%",
    outline: "none",
    resize: "vertical",
    minHeight: "120px",
    lineHeight: "1.6",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  select: {
    height: "44px",
    padding: "0 14px",
    fontSize: "14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    background: WHITE,
    color: TEXT_PRIMARY,
    width: "100%",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  errMsg: {
    fontSize: "12px",
    color: RED,
    marginTop: "2px",
  },
  hint: {
    fontSize: "12px",
    color: TEXT_SECONDARY,
    marginTop: "2px",
  },
  timeRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  timeSep: {
    fontSize: "13px",
    color: TEXT_SECONDARY,
    flexShrink: 0,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
  },
  btnPrimary: {
    height: "44px",
    padding: "0 28px",
    background: BLUE,
    color: WHITE,
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",
    fontFamily: "inherit",
  },
  btnGhost: {
    height: "44px",
    padding: "0 24px",
    background: "transparent",
    color: TEXT_SECONDARY,
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  reviewRow: {
    display: "flex",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
  },
  reviewKey: {
    minWidth: "140px",
    color: TEXT_SECONDARY,
    fontWeight: 500,
    flexShrink: 0,
  },
  reviewVal: {
    color: TEXT_PRIMARY,
    flex: 1,
  },
  successWrap: {
    textAlign: "center",
    padding: "64px 24px",
  },
  successCircle: {
    width: "60px",
    height: "60px",
    background: BLUE,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
const StepIndicator = ({ current }) => {
  const steps = ["Job Details", "Requirements", "Review & Post"];
  return (
    <div style={s.stepsRow}>
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = num < current;
        const isActive = num === current;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isDone || isActive ? BLUE : "#e5e7eb",
                  color: isDone || isActive ? WHITE : TEXT_SECONDARY,
                  transition: "all 0.2s",
                }}
              >
                {isDone ? "✓" : num}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? BLUE : isDone ? TEXT_PRIMARY : TEXT_SECONDARY,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div style={s.stepLine} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Field = ({ label, required, error, hint, children, style }) => (
  <div style={{ ...s.field, ...style }}>
    <label style={s.label}>
      {label}
      {required && <span style={s.req}>*</span>}
    </label>
    {children}
    {error && <div style={s.errMsg}>{error}</div>}
    {hint && !error && <div style={s.hint}>{hint}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
class PostBoxForm extends Component {
  constructor(props) {
    super(props);
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

    this.state = {
      currentPage: 1,
      showLangModal: false,
  languages: [],
  modalCountries: [],
  jobCountryId: null,
  jobCountry: "Pakistan",
  jobLanguage: "English",
  langModalLoading: false,
      values: {
        job_title: "",
        job_description: "",
        skill_ids: [],
        time_from: "",
        time_to: "",
        job_type_id: null,
        min_salary: "",
        max_salary: "",
        min_experience: "",
        max_experience: "",
        speciality_id: null,
        degree_id: null,
        application_deadline: "",
    screening_start: "",
    screening_end: "",
    interview_start: "",
    interview_end: "",
    expected_joining_date: "",
  
        no_of_positions: "",
        industry: "",
        currency_id: null,
      },
       initialDistricts: [], 
      selectedCountry: null,
      selectedDistrict: null,
      selectedCity: null,
      errors: {},
      showPricing: false,
      jobId: null,
    };

    this.allSkills = [];

    this.experienceOptions = [
      { value: "Fresh", label: "Fresh" },
      { value: "<1", label: "Less than 1 Year" },
      ...Array.from({ length: 20 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1} Year${i > 0 ? "s" : ""}`,
      })),
      { value: ">21", label: "More than 20 Years" },
    ];
  }

componentDidMount() {
  this.loadSkills().then(() => {
    if (this.props.jobId) this.loadJobDetails(this.props.jobId);
  });
  this.loadCompanyDefaultsAndCountries().then(() => {
    // After country is pre-filled, load districts automatically
    this.loadDistrictsForPrefilledCountry();
  });
}
// Add this new method
loadDistrictsForPrefilledCountry = async () => {
  const { selectedCountry, jobCountryId } = this.state;
  const countryId = selectedCountry?.value ?? jobCountryId;
  if (!countryId) return;

  try {
    let page = 1;
    const limit = 500;
    let allDistricts = [];
    let hasMore = true;

    while (hasMore) {
      const res = await axios.get(`${this.apiBaseUrl}getalldistricts`, {
        params: { country_id: countryId, page, limit },
      });

      const fetched = res.data.districts ?? [];
      allDistricts = [...allDistricts, ...fetched];

      // stop if we got less than limit (last page) or nothing
      hasMore = fetched.length === limit;
      page++;
    }

    const districts = allDistricts.map((d) => ({ label: d.name, value: d.id }));
    this.setState({ initialDistricts: districts });
  } catch (err) {
    console.error("Failed to load initial districts", err);
  }
};
loadCompanyDefaultsAndCountries = async () => {
  this.setState({ langModalLoading: true });
  try {
    // fetch all three in parallel
    const [profileRes, countryRes] = await Promise.all([
      axios.get(`${this.apiBaseUrl}company-info/getcompanyviaids/${this.userId}`).catch(() => null),
  
      axios.get(`${this.apiBaseUrl}getallCountries`, { params: { page: 1, limit: 1000 } }).catch(() => null),
    ]);
console.log("countryRes:", countryRes);
console.log("countryRes data:", countryRes?.data);
   const languages = ["English", "Arabic", "Urdu", "French", "Spanish", "German"];
    const modalCountries = countryRes?.data?.countries?.map((c) => ({
      label: c.name,
      value: c.id,
    })) ?? [];

    const company = profileRes?.data;
console.log("FULL COMPANY PROFILE:", company); // ← add this
const companyCountryId = company?.country_id ?? null;
console.log("COUNTRY ID FROM PROFILE:", companyCountryId); // ← add this

const matched = companyCountryId
  ? modalCountries.find((c) => String(c.value) === String(companyCountryId))
  : null;

// ADD THIS FALLBACK — if id match fails, try matching by country name
const finalMatch = matched ?? 
  (company?.country 
    ? modalCountries.find((c) => c.label.trim().toLowerCase() === company.country.trim().toLowerCase())
    : null);

this.setState({
  languages,
  modalCountries,
  jobCountry: finalMatch?.label ?? company?.country ?? "Pakistan",
  jobCountryId: finalMatch?.value ?? null,        // ← was staying null
  selectedCountry: finalMatch ?? null,
});
  } catch (err) {
    console.error(err);
    this.setState({
      languages: ["English", "Arabic", "Urdu", "French", "Spanish", "German"],
      modalCountries: [],
      jobCountry: "Pakistan",
    });
  } finally {
    this.setState({ langModalLoading: false });
  }
};
  componentDidUpdate(prevProps) {
    if (prevProps.jobId !== this.props.jobId) {
      this.loadSkills().then(() => this.loadJobDetails(this.props.jobId));
    }
  }

  /* ── Loaders ── */
  loadJobDetails = async (jobId) => {
    try {
      if (!this.allSkills?.length) await this.loadSkills();
      const res = await axios.get(`${this.apiBaseUrl}job/getSinglejob/${jobId}`);
      const job = res.data;
      const selectedSkills =
        job.skill_ids?.map(
          (id) =>
            this.allSkills.find((sk) => sk.value === id) || {
              label: `Skill ${id}`,
              value: id,
            }
        ) || [];
      this.setState({
        values: {
          ...this.state.values,
          job_title: job.job_title || "",
          job_description: job.job_description || "",
          skill_ids: selectedSkills,
          time_from: job.time_from || "",
          time_to: job.time_to || "",
          job_type_id: job.job_type_id ? { label: job.job_type, value: job.job_type_id } : null,
          min_salary: job.min_salary || "",
          max_salary: job.max_salary || "",
          currency_id: job.currency_id ? { label: job.currency, value: job.currency_id } : null,
          min_experience: job.min_experience || "",
          max_experience: job.max_experience || "",
          speciality_id: job.speciality_id ? { label: job.speciality, value: job.speciality_id } : null,
          degree_id: job.degree_id ? { label: job.degree, value: job.degree_id } : null,
          application_deadline: job.application_deadline?.split("T")[0] || "",
          no_of_positions: job.no_of_positions || "",
          industry: job.industry || "",
        },
        selectedCountry: job.country_id ? { label: job.country, value: job.country_id } : null,
        selectedDistrict: job.district_id ? { label: job.district, value: job.district_id } : null,
        selectedCity: job.city_id ? { label: job.city, value: job.city_id } : null,
      });
    } catch (err) {
      console.error("Failed to load job details", err);
    }
  };

  loadJobTitles = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getAllJobTitles`, {
        params: { search: inputValue || "", page: 1, limit: 50 },
      });
      return res.data.jobtitles.map((c) => ({ label: c.name, value: c.id }));
    } catch { return []; }
  };
loadCountries = async (inputValue) => {
  try {
    const res = await axios.get(`${this.apiBaseUrl}getallCountries`, {
      params: { search: inputValue || "", name: "name", page: 1, limit: 1000 },
    });
    return res.data.countries.map((c) => ({ label: c.name, value: c.id }));
  } catch { return []; }
};

loadDistricts = async (inputValue = "") => {
  const { selectedCountry, jobCountryId } = this.state;
  const countryId = selectedCountry?.value ?? jobCountryId;
  if (!countryId) return [];
  try {
    const res = await axios.get(`${this.apiBaseUrl}getalldistricts`, {
      params: { 
        country_id: countryId, 
        search: inputValue,
        page: 1,
        limit: 1000,  // ← was missing, API was defaulting to ~15
      },
    });
    return res.data.districts.map((d) => ({ label: d.name, value: d.id }));
  } catch { return []; }
};
  fetchCities = async () => {
    const { selectedDistrict } = this.state;
    if (!selectedDistrict?.value) return [];
    try {
      const res = await axios.get(
        `${this.apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`
      );
      return res.data.cities.map((c) => ({ label: c.name, value: c.id }));
    } catch { return []; }
  };

  loadJobTypes = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalljobtypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.jobtypes.map((c) => ({ label: c.name, value: c.id }));
    } catch { return []; }
  };

  loadSkills = async (inputValue) => {
    try {
      if (!this.allSkills?.length) {
        const res = await axios.get(`${this.apiBaseUrl}getallskills`, {
          params: { page: 1, limit: 1000 },
        });
        this.allSkills = res.data.skills.map((sk) => ({ label: sk.name, value: sk.id }));
      }
      return this.allSkills.filter((sk) =>
        sk.label.toLowerCase().includes((inputValue || "").toLowerCase())
      );
    } catch { return []; }
  };

  loadSpeciality = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallspeciality`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.speciality.map((c) => ({ label: c.name, value: c.id }));
    } catch { return []; }
  };

  loadDegree = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldegreetype`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.degreetypes.map((c) => ({ label: c.name, value: c.id }));
    } catch { return []; }
  };

  loadCurrency = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch { return []; }
  };

  /* ── Handlers ── */
  capitalizeWords = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  handleInputChange = (e) => {
    const { name, value } = e.target;
    const capitalized = name === "industry" ? value : this.capitalizeWords(value);
    this.setState((prev) => ({
      values: { ...prev.values, [name]: capitalized },
      errors: { ...prev.errors, [name]: undefined },
    }));
  };

  handleSelectChange = (name, option) => {
    this.setState((prev) => ({
      values: { ...prev.values, [name]: option },
      errors: { ...prev.errors, [name]: undefined },
    }));
  };

  /* ── Validation ── */
validatePage1 = () => {
  const { values, selectedCountry, selectedDistrict, selectedCity, jobCountryId } = this.state;
  const errors = {};
  if (!values.job_title) errors.job_title = "Job title is required.";
  if (!values.job_description) errors.job_description = "Job description is required.";
  if (!values.job_type_id) errors.job_type_id = "Job type is required.";
  if (!values.industry) errors.industry = "Industry is required.";
  if (!values.time_from) errors.time_from = "Start time is required.";
  if (!values.time_to) errors.time_to = "End time is required.";
  // ← only validate country if not already set via modal
  // if (!selectedCountry && !jobCountryId) errors.country_id = "Country is required.";
  const isRemote = values.job_type_id?.label?.toLowerCase() === "remote";
  if (!isRemote && !selectedDistrict) errors.district_id = "District is required.";
  if (!isRemote && !selectedCity) errors.city_id = "City is required.";
  if (values.min_salary && values.max_salary && parseFloat(values.max_salary) <= parseFloat(values.min_salary)) {
    errors.salary = "Max salary must exceed min salary.";
  }
  return errors;
};

  validatePage2 = () => {
    const { values } = this.state;
    const errors = {};
    if (!values.skill_ids?.length) errors.skill_ids = "Add at least one skill.";
    if (!values.min_experience) errors.min_experience = "Minimum experience is required.";
    if (!values.max_experience) errors.max_experience = "Maximum experience is required.";
    if (!values.speciality_id) errors.speciality_id = "Speciality is required.";
    if (!values.degree_id) errors.degree_id = "Qualification is required.";
    if (!values.no_of_positions) errors.no_of_positions = "Number of positions is required.";
    if (!values.application_deadline) {
      errors.application_deadline = "Application deadline is required.";
    } else if (new Date(values.application_deadline) <= new Date()) {
      errors.application_deadline = "Deadline must be a future date.";
    }
    return errors;
  };

  goToPage1 = () => this.setState({ currentPage: 1 });

  goToPage2 = () => {
    const errors = this.validatePage1();
    this.setState({ errors });
    if (!Object.keys(errors).length) this.setState({ currentPage: 2, errors: {} });
  };

  goToPage3 = () => {
    const errors = this.validatePage2();
    this.setState({ errors });
    if (!Object.keys(errors).length) this.setState({ currentPage: 3, errors: {} });
  };

  handleSubmit = async () => {
    const { values, selectedCountry, selectedDistrict, selectedCity } = this.state;
    const editjobid = this.props.jobId;

    const formattedDeadline = new Date(values.application_deadline)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const payload = {
      ...values,
      country_id: selectedCountry?.value,
      district_id: selectedDistrict?.value,
      city_id: selectedCity?.value,
      job_type_id: values.job_type_id?.value,
      currency_id: values.currency_id?.value,
      speciality_id: values.speciality_id?.value,
      degree_id: values.degree_id?.value,
      skill_ids: values.skill_ids.map((s) => s.value),
      application_deadline: formattedDeadline,
       screening_start: values.screening_start || null,
  screening_end: values.screening_end || null,
  interview_start: values.interview_start || null,
  interview_end: values.interview_end || null,
  expected_joining_date: values.expected_joining_date || null,
    };

    try {
      if (editjobid) {
        await api.put(
          `${this.apiBaseUrl}job/updatejob/${this.userId}/${editjobid}`,
          payload
        );
        if (this.props.onSuccess) this.props.onSuccess();
        return;
      }

      const response = await api.post(
        `${this.apiBaseUrl}job/postjob/${this.userId}`,
        payload
      );

      this.setState({ jobId: response.data.job_id, showPricing: true });
    } catch (err) {
      console.error(err);
    }
  };

  resetForm = () => {
    this.setState({
      currentPage: 1,
      values: {
        job_title: "", job_description: "", skill_ids: [],
        time_from: "", time_to: "", job_type_id: null,
        min_salary: "", max_salary: "", min_experience: "",
        max_experience: "", speciality_id: null, degree_id: null,
        application_deadline: "", no_of_positions: "", industry: "", currency_id: null,
        screening_start: "",
    screening_end: "",
    interview_start: "",
    interview_end: "",
    expected_joining_date: "",
      },
      selectedCountry: null, selectedDistrict: null, selectedCity: null,
      errors: {}, showPricing: false, jobId: null,
    });
  };

  /* ── Render helpers ── */
  renderProgressBar = () => {
    const { currentPage } = this.state;
    return (
      <div style={s.progressWrap}>
        <div
          style={{
            height: "100%",
            width: `${(currentPage / 3) * 100}%`,
            background: BLUE,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    );
  };

  renderPage1 = () => {
    const { values, errors, selectedCountry, selectedDistrict, selectedCity } = this.state;
    const isRemote = values.job_type_id?.label?.toLowerCase() === "remote";

    return (
      <div>
        <h2 style={s.pageHeading}>Tell us about the job</h2>
        <p style={s.pageSubtitle}>Start with the basics — role, location, and compensation.</p>

        <div style={s.notice}>
          All fields marked with <strong style={{ margin: "0 3px" }}>*</strong> are required before you can continue.
        </div>

        {/* Job Basics */}
        <div style={s.card}>
          <div style={s.cardTitle}>Job basics</div>

          <div style={s.row1}>
            <Field label="Job title" required error={errors.job_title}>
              <AsyncCreatableSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadJobTitles}
                value={values.job_title ? { label: values.job_title, value: values.job_title } : null}
                onChange={(option) => {
                  const val = option ? this.capitalizeWords(option.label) : "";
                  this.setState((prev) => ({
                    values: { ...prev.values, job_title: val },
                    errors: { ...prev.errors, job_title: undefined },
                  }));
                }}
                onCreateOption={(inputValue) => {
                  const val = this.capitalizeWords(inputValue);
                  this.setState((prev) => ({
                    values: { ...prev.values, job_title: val },
                    errors: { ...prev.errors, job_title: undefined },
                  }));
                }}
                placeholder="Search or type a job title..."
                styles={indeedSelectStyles}
              />
            </Field>
          </div>

          <div style={s.row1}>
            <Field label="Job description" required error={errors.job_description}>
              <textarea
                name="job_description"
                value={values.job_description}
                placeholder="Describe responsibilities, team culture, and what makes this role exciting..."
                onChange={this.handleInputChange}
                style={s.textarea}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
            </Field>
          </div>

          <div style={s.row2}>
            <Field label="Job location type" required error={errors.job_type_id}>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadJobTypes}
                value={values.job_type_id}
                onChange={(option) => this.handleSelectChange("job_type_id", option)}
                placeholder="Select type..."
                styles={indeedSelectStyles}
              />
            </Field>

            <Field label="Industry / Facility type" required error={errors.industry}>
              <select
                name="industry"
                value={values.industry}
                onChange={this.handleInputChange}
                style={{ ...s.select, borderColor: errors.industry ? RED : BORDER }}
              >
                <option value="">Select industry</option>
                <option value="hospital_small">Hospital (Small, &lt;50 beds)</option>
                <option value="hospital_medium">Hospital (Medium, 50–200 beds)</option>
                <option value="hospital_large">Hospital (Large, 200+ beds)</option>
                <option value="clinic">Clinic</option>
                <option value="diagnostic_center">Diagnostic Center</option>
                <option value="medical_laboratory">Medical Laboratory</option>
                <option value="rehabilitation_center">Rehabilitation Center</option>
                <option value="medical_equipment_supplier">Medical Equipment Supplier</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Location */}
        <div style={s.card}>
          <div style={s.cardTitle}>Location & working hours</div>


<div style={s.row2}>
  <Field
    label="Districts"
    required={!isRemote}
    error={errors.district_id}
    style={{ gridColumn: "1 / -1" }}  // full width since country field is gone
  >

<AsyncSelect
  key={`district-${selectedCountry?.value ?? this.state.jobCountryId}-${this.state.initialDistricts?.length}`}
  defaultOptions={this.state.initialDistricts?.length ? this.state.initialDistricts : true}
  loadOptions={this.loadDistricts}
  value={selectedDistrict}
  onChange={(option) =>
    this.setState({
      selectedDistrict: option,
      selectedCity: null,
      errors: { ...this.state.errors, district_id: undefined },
    })
  }
  isDisabled={(!selectedCountry && !this.state.jobCountryId) || isRemote}
  placeholder={isRemote ? "Not required for remote" : "Select state / district..."}
  styles={indeedSelectStyles}
/>
  </Field>
</div>

          <div style={s.row2}>
            <Field label="City" required={!isRemote} error={errors.city_id}>
              <AsyncSelect
                key={selectedDistrict?.value || "city"}
                cacheOptions
                defaultOptions
                loadOptions={this.fetchCities}
                value={selectedCity}
                onChange={(option) =>
                  this.setState({
                    selectedCity: option,
                    errors: { ...this.state.errors, city_id: undefined },
                  })
                }
                isDisabled={!selectedDistrict || isRemote}
                placeholder={isRemote ? "Not required for remote" : "Select after state..."}
                styles={indeedSelectStyles}
              />
            </Field>

            <Field label="Working hours" required error={errors.time_from || errors.time_to}>
              <div style={s.timeRow}>
                <input
                  type="time"
                  name="time_from"
                  value={values.time_from}
                  onChange={this.handleInputChange}
                  style={{ ...s.input, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = BLUE)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
                <span style={s.timeSep}>to</span>
                <input
                  type="time"
                  name="time_to"
                  value={values.time_to}
                  onChange={this.handleInputChange}
                  style={{ ...s.input, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = BLUE)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Salary */}
        <div style={s.card}>
          <div style={s.cardTitle}>Compensation</div>
          <Field
            label="Salary range"
            hint="Monthly salary. Min and max required to proceed."
            error={errors.salary || errors.min_salary || errors.max_salary || errors.currency_id}
          >
            <div style={s.row3}>
              <input
                type="number"
                name="min_salary"
                value={values.min_salary}
                placeholder="Minimum"
                onChange={this.handleInputChange}
                min="0"
                style={{ ...s.input, borderColor: errors.min_salary ? RED : BORDER }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = errors.min_salary ? RED : BORDER)}
              />
              <input
                type="number"
                name="max_salary"
                value={values.max_salary}
                placeholder="Maximum"
                onChange={this.handleInputChange}
                min="0"
                style={{ ...s.input, borderColor: errors.max_salary ? RED : BORDER }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = errors.max_salary ? RED : BORDER)}
              />
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadCurrency}
                value={values.currency_id}
                onChange={(option) => this.handleSelectChange("currency_id", option)}
                placeholder="Currency"
                styles={indeedSelectStyles}
              />
            </div>
          </Field>
        </div>

        <div style={s.actions}>
          <span style={{ fontSize: "12px", color: TEXT_SECONDARY }}>
            <span style={{ color: RED }}>*</span> Required fields
          </span>
          <button
            style={s.btnPrimary}
            onClick={this.goToPage2}
            onMouseEnter={(e) => (e.target.style.background = "#1a52cc")}
            onMouseLeave={(e) => (e.target.style.background = BLUE)}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  };

  renderPage2 = () => {
    const { values, errors } = this.state;

    return (
      <div>
        <h2 style={s.pageHeading}>Requirements & details</h2>
        <p style={s.pageSubtitle}>Help candidates understand exactly what you are looking for.</p>

        {/* Skills */}
        <div style={s.card}>
          <div style={s.cardTitle}>Skills required</div>
          <Field
            label="Skills"
            required
            error={errors.skill_ids}
            hint="Type to search or create a new skill"
          >
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={this.loadSkills}
              value={values.skill_ids || []}
              onChange={(selected) =>
                this.setState((prev) => ({
                  values: { ...prev.values, skill_ids: selected || [] },
                  errors: { ...prev.errors, skill_ids: undefined },
                }))
              }
              onCreateOption={(inputValue) => {
                const newSkill = {
                  label: this.capitalizeWords(inputValue),
                  value: inputValue,
                };
                this.setState((prev) => ({
                  values: {
                    ...prev.values,
                    skill_ids: [...prev.values.skill_ids, newSkill],
                  },
                }));
              }}
              placeholder="Search skills or type to create..."
              styles={indeedSelectStyles}
            />
          </Field>
        </div>

        {/* Experience & Qualifications */}
        <div style={s.card}>
          <div style={s.cardTitle}>Experience & qualifications</div>

          <div style={{ ...s.row2, marginBottom: "16px" }}>
            <Field label="Minimum experience" required error={errors.min_experience}>
              <select
                name="min_experience"
                value={values.min_experience}
                onChange={this.handleInputChange}
                style={{ ...s.select, borderColor: errors.min_experience ? RED : BORDER }}
              >
                <option value="">Select</option>
                {this.experienceOptions.map((opt) => (
                  <option key={opt.value} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Maximum experience" required error={errors.max_experience}>
              <select
                name="max_experience"
                value={values.max_experience}
                onChange={this.handleInputChange}
                style={{ ...s.select, borderColor: errors.max_experience ? RED : BORDER }}
              >
                <option value="">Select</option>
                {this.experienceOptions.map((opt) => (
                  <option key={opt.value} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={s.row2}>
            <Field label="Speciality" required error={errors.speciality_id}>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadSpeciality}
                value={values.speciality_id}
                onChange={(option) => this.handleSelectChange("speciality_id", option)}
                placeholder="Select speciality..."
                styles={indeedSelectStyles}
              />
            </Field>

            <Field label="Qualification required" required error={errors.degree_id}>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadDegree}
                value={values.degree_id}
                onChange={(option) => this.handleSelectChange("degree_id", option)}
                placeholder="Select degree..."
                styles={indeedSelectStyles}
              />
            </Field>
          </div>
        </div>

        {/* Posting details */}
        <div style={s.card}>
          <div style={s.cardTitle}>Posting details</div>

          <div style={s.row2}>
            <Field
              label="Number of positions"
              required
              error={errors.no_of_positions}
              hint="How many people are you hiring for this role?"
            >
              <input
                type="number"
                name="no_of_positions"
                value={values.no_of_positions}
                onChange={this.handleInputChange}
                min="1"
                placeholder="e.g. 3"
                style={{ ...s.input, borderColor: errors.no_of_positions ? RED : BORDER }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = errors.no_of_positions ? RED : BORDER)}
              />
            </Field>

            <Field
              label="Application deadline"
              required
              error={errors.application_deadline}
              hint="Applications will close on this date"
            >
              <input
                type="date"
                name="application_deadline"
                value={values.application_deadline}
                onChange={this.handleInputChange}
                style={{ ...s.input, borderColor: errors.application_deadline ? RED : BORDER }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) => (e.target.style.borderColor = errors.application_deadline ? RED : BORDER)}
              />
            </Field>
          </div>
            {/* ── Hiring Timeline ── */}
  <div style={{
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #f3f4f6"
  }}>
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "2px" }}>
        Hiring timeline
        <span style={{
          marginLeft: "8px",
          fontSize: "11px",
          fontWeight: 500,
          background: "#e8f0fe",
          color: "#1a56db",
          padding: "2px 8px",
          borderRadius: "20px"
        }}>
          Optional
        </span>
      </div>
      <div style={{ fontSize: "12px", color: TEXT_SECONDARY }}>
        Let candidates know what to expect — improves response rate and reduces drop-offs.
      </div>
    </div>

    <div style={s.row2}>
      <Field label="Screening period — start" hint="When will you start reviewing CVs?">
        <input
          type="date"
          name="screening_start"
          value={values.screening_start}
          onChange={this.handleInputChange}
          style={s.input}
        />
      </Field>

      <Field label="Screening period — end">
        <input
          type="date"
          name="screening_end"
          value={values.screening_end}
          onChange={this.handleInputChange}
          style={s.input}
        />
      </Field>
    </div>

    <div style={s.row2}>
      <Field label="Interview dates — start" hint="When do interviews begin?">
        <input
          type="date"
          name="interview_start"
          value={values.interview_start}
          onChange={this.handleInputChange}
          style={s.input}
        />
      </Field>

      <Field label="Interview dates — end">
        <input
          type="date"
          name="interview_end"
          value={values.interview_end}
          onChange={this.handleInputChange}
          style={s.input}
        />
      </Field>
    </div>

    <div style={{ maxWidth: "calc(50% - 8px)" }}>
      <Field label="Expected joining date" hint="When should the selected candidate start?">
        <input
          type="date"
          name="expected_joining_date"
          value={values.expected_joining_date}
          onChange={this.handleInputChange}
          style={s.input}
        />
      </Field>
    </div>
  </div>
        </div>

        <div style={s.actions}>
          <button
            style={s.btnGhost}
            onClick={this.goToPage1}
            onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            ← Back
          </button>
          <button
            style={s.btnPrimary}
            onClick={this.goToPage3}
            onMouseEnter={(e) => (e.target.style.background = "#1a52cc")}
            onMouseLeave={(e) => (e.target.style.background = BLUE)}
          >
            Review & Post →
          </button>
        </div>
      </div>
    );
  };

  renderPage3 = () => {
    const { values, selectedCountry, selectedDistrict, selectedCity } = this.state;
    const isRemote = values.job_type_id?.label?.toLowerCase() === "remote";

    const location = isRemote
      ? "Remote"
      : [selectedCity?.label, selectedDistrict?.label, selectedCountry?.label]
          .filter(Boolean)
          .join(", ");

    const rows = [
      ["Job Title", values.job_title],
      ["Job Type", values.job_type_id?.label],
      ["Industry", values.industry?.replace(/_/g, " ")],
      ["Location", location],
      ["Working Hours", values.time_from && values.time_to ? `${values.time_from} – ${values.time_to}` : "—"],
      [
        "Salary",
        values.min_salary && values.max_salary
          ? `${values.min_salary} – ${values.max_salary} ${values.currency_id?.label || ""}`
          : "Not disclosed",
      ],
      ["Skills", values.skill_ids?.map((s) => s.label).join(", ")],
      ["Experience", values.min_experience && values.max_experience ? `${values.min_experience} to ${values.max_experience}` : "—"],
      ["Speciality", values.speciality_id?.label],
      ["Qualification", values.degree_id?.label],
      ["No. of Positions", values.no_of_positions],
      ["Application Deadline", values.application_deadline],
      ["Application Deadline", values.application_deadline],
  ["Screening Period",
    values.screening_start && values.screening_end
      ? `${values.screening_start} – ${values.screening_end}`
      : values.screening_start || "—"
  ],
  ["Interview Dates",
    values.interview_start && values.interview_end
      ? `${values.interview_start} – ${values.interview_end}`
      : values.interview_start || "—"
  ],
  ["Expected Joining Date", values.expected_joining_date || "—"],
    ];

    return (
      <div>
        <h2 style={s.pageHeading}>Review your job post</h2>
        <p style={s.pageSubtitle}>Double-check everything before publishing. Candidates will see this listing immediately.</p>

        <div style={s.card}>
          <div style={s.cardTitle}>Job summary</div>
          {rows.map(([key, val]) => (
            <div key={key} style={s.reviewRow}>
              <span style={s.reviewKey}>{key}</span>
              <span style={s.reviewVal}>{val || "—"}</span>
            </div>
          ))}

          {values.job_description && (
            <div style={{ paddingTop: "12px" }}>
              <div style={{ ...s.reviewKey, marginBottom: "8px" }}>Description</div>
              <div
                style={{
                  fontSize: "14px",
                  color: TEXT_PRIMARY,
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                  background: BG,
                  padding: "12px 16px",
                  borderRadius: "8px",
                }}
              >
                {values.job_description}
              </div>
            </div>
          )}
        </div>

        <div style={s.actions}>
          <button
            style={s.btnGhost}
            onClick={this.goToPage2}
            onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            ← Edit
          </button>
          <button
            style={s.btnPrimary}
            onClick={this.handleSubmit}
            onMouseEnter={(e) => (e.target.style.background = "#1a52cc")}
            onMouseLeave={(e) => (e.target.style.background = BLUE)}
          >
            Post Job
          </button>
        </div>
      </div>
    );
  };

  render() {
    const { currentPage, showPricing, jobId } = this.state;

    return (
      <div style={{ background: BG, minHeight: "100vh" }}>
        <Head>
          <title>Post a Job</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
{this.state.showLangModal && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  }}>
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "28px",
      width: "100%", maxWidth: "440px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      fontFamily: "inherit"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
          Edit language and country
        </h3>
        <button
          onClick={() => this.setState({ showLangModal: false })}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: TEXT_SECONDARY, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {this.state.langModalLoading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: TEXT_SECONDARY, fontSize: "14px" }}>
          Loading options…
        </div>
      ) : (
        <>
          {/* Language */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: TEXT_PRIMARY, display: "block", marginBottom: "6px" }}>
              Language of job post <span style={{ color: RED }}>*</span>
            </label>
            <select
              value={this.state.jobLanguage}
              onChange={(e) => this.setState({ jobLanguage: e.target.value })}
              style={{ ...s.select, width: "100%" }}
            >
              {this.state.languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div style={{ fontSize: "12px", color: TEXT_SECONDARY, marginTop: "5px" }}>
              The language your job post is written in.
            </div>
          </div>

          {/* Country */}
        {/* Country */}
<div style={{ marginBottom: "24px" }}>
  <label style={{ fontSize: "13px", fontWeight: 600, color: TEXT_PRIMARY, display: "block", marginBottom: "6px" }}>
    Country where job post is shown <span style={{ color: RED }}>*</span>
  </label>
 <select
  value={String(this.state.jobCountryId ?? "")}  
  onChange={(e) => {
    const selected = this.state.modalCountries.find(
      (c) => String(c.value) === e.target.value
    );
    this.setState({
      jobCountry: selected?.label ?? "",
      jobCountryId: selected?.value ?? null,
      selectedCountry: selected ?? null,
      selectedDistrict: null,
      selectedCity: null,
    });
  }}
  style={{ ...s.select, width: "100%" }}
>
    <option value="">Select a country</option>
    {this.state.modalCountries.map((c) => (
      <option key={c.value} value={String(c.value)}>{c.label}</option> 
    ))}
  </select>
  <div style={{ fontSize: "12px", color: TEXT_SECONDARY, marginTop: "5px" }}>
    Pre-filled from your company profile. Change if posting for a different region.
  </div>
</div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={() => this.setState({ showLangModal: false })}
          style={{ ...s.btnGhost, padding: "0 20px" }}
        >
          Close
        </button>
      <button
  onClick={() => this.setState({ showLangModal: false })}
  style={{ ...s.btnPrimary, padding: "0 24px", background: "#36565f" }}
  onMouseEnter={(e) => (e.target.style.background = "#36565f")}
  onMouseLeave={(e) => (e.target.style.background = BLUE)}
  disabled={this.state.langModalLoading}
>
  Done
</button>
      </div>
    </div>
  </div>
)}
        <div style={s.page}>
          {/* Brand header */}
          <div style={s.brand}>
            
            <span style={s.brandName}>Post a Job</span>
          </div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "12px" }}>
  <button
   // ── Update the globe button onClick ──
onClick={() => {
  this.setState({ showLangModal: true });
}}
    style={{
      background: "none", border: "1px solid #d1d5db", borderRadius: "6px",
      padding: "5px 12px", fontSize: "12px", color: TEXT_SECONDARY,
      cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
    }}
  >
    🌐 {this.state.jobLanguage} · {this.state.jobCountry}
  </button>
</div>
          {/* Progress */}
          {this.renderProgressBar()}
          <StepIndicator current={currentPage} />

          {/* Pages */}
          {currentPage === 1 && this.renderPage1()}
          {currentPage === 2 && this.renderPage2()}
          {currentPage === 3 && this.renderPage3()}
        </div>

        {/* Pricing modal — unchanged from original */}
        {showPricing && (
          <Modal
            isOpen={showPricing}
            toggle={() => this.setState({ showPricing: false })}
            size="lg"
            centered
          >
            <ModalHeader toggle={() => this.setState({ showPricing: false })}>
              Pricing
            </ModalHeader>
            <ModalBody>
              <PricingForm
                jobId={jobId}
                onPaymentSuccess={() => this.setState({ showPricing: false })}
              />
            </ModalBody>
          </Modal>
        )}
      </div>
    );
  }
}

export default withRouter(PostBoxForm);