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
import PricingPage from "./viewpackage";
import { AddCardForm } from "./wallet";
import MonthYearPicker, { CustomSelect } from "./dashboard/Picker";

/* ─────────────────────────────────────────────
   Indeed-style design tokens
───────────────────────────────────────────── */
const BLUE = "#36565f";
const BLUE_LIGHT = "#e6eeef";
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
    boxShadow: state.isFocused ? "0 0 0 3px rgba(54,86,95,0.15)" : "none",
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
  multiValueLabel: (base) => ({
    ...base,
    color: BLUE_TEXT,
    fontSize: "12px",
    fontWeight: 500,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: BLUE_TEXT,
    borderRadius: "50%",
    "&:hover": { backgroundColor: "#c3d3d6", color: "#254048" },
  }),
  singleValue: (base) => ({ ...base, color: TEXT_PRIMARY, fontSize: "14px" }),
  menu: (base) => ({
    ...base,
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    zIndex: 99,
  }),
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
                  color: isActive
                    ? BLUE
                    : isDone
                      ? TEXT_PRIMARY
                      : TEXT_SECONDARY,
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
    this.userId =
      typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

    this.state = {
      currentPage: 1,
      showLangModal: false,
      languages: [],
      modalCountries: [],
      jobCountryId: null,
      jobCountry: "Pakistan",
      jobLanguage: "English",
      langModalLoading: false,
      showAddCardModal: false,

      values: {
        job_title: "",
        job_description: "",
        skill_ids: [],
        time_from: "",
        time_to: "",
        job_type_id: null,
        job_location_type: "",
        min_salary: "",
        max_salary: "",
        min_experience: "",
        max_experience: "",
        speciality_id: null,
        degree_id: null,
        degreefields_id: [],
        application_deadline: "",
        screening_start: "",
        screening_end: "",
        interview_start: "",
        interview_end: "",
        expected_joining_date: "",

        no_of_positions: "",
        industry: "",
        currency_id: null,
        salary_period: "monthly",
      },
      initialDistricts: [],
      selectedCountry: null,
      selectedDistrict: [],
      selectedCity: [],
      errors: {},
      showPricing: false,
      jobId: null,
      availablePackages: [],
      showPackageModal: false,
      chosenPackageId: null,
      dailyBudget: "",
      budgetMode: false,
    };
    this.isEditRestricted = props.isEditRestricted || false;

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

      const districts = allDistricts.map((d) => ({
        label: d.name,
        value: d.id,
      }));
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
        axios
          .get(`${this.apiBaseUrl}company-info/getcompanyviaids/${this.userId}`)
          .catch(() => null),

        axios
          .get(`${this.apiBaseUrl}getallCountries`, {
            params: { page: 1, limit: 1000 },
          })
          .catch(() => null),
      ]);
      console.log("countryRes:", countryRes);
      console.log("countryRes data:", countryRes?.data);
      const languages = [
        "English",
        "Arabic",
        "Urdu",
        "French",
        "Spanish",
        "German",
      ];
      const modalCountries =
        countryRes?.data?.countries?.map((c) => ({
          label: c.name,
          value: c.id,
        })) ?? [];

      const company = profileRes?.data;
      console.log("FULL COMPANY PROFILE:", company); // ← add this
      const companyCountryId = company?.country_id ?? null;
      console.log("COUNTRY ID FROM PROFILE:", companyCountryId); // ← add this

      const matched = companyCountryId
        ? modalCountries.find(
          (c) => String(c.value) === String(companyCountryId),
        )
        : null;

      // ADD THIS FALLBACK — if id match fails, try matching by country name
      const finalMatch =
        matched ??
        (company?.country
          ? modalCountries.find(
            (c) =>
              c.label.trim().toLowerCase() ===
              company.country.trim().toLowerCase(),
          )
          : null);

      this.setState({
        languages,
        modalCountries,
        jobCountry: finalMatch?.label ?? company?.country ?? "Pakistan",
        jobCountryId: finalMatch?.value ?? null, // ← was staying null
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
  loadIndustry = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}industry/getallindustry`, {
        params: { search: inputValue || "", page: 1, limit: 50, status: "Active" },
      });
      return res.data.industry.map((c) => ({ label: c.name, value: c.id }));
    } catch {
      return [];
    }
  };
  /* ── Loaders ── */
  loadJobDetails = async (jobId) => {
    try {
      if (!this.allSkills?.length) await this.loadSkills();
      const res = await axios.get(`${this.apiBaseUrl}job/getSinglejob/${jobId}`);
      const job = res.data;

      const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();
      const isApproved = job.approval_status === 'Approved';

      const selectedSkills = job.skill_ids?.map(
        (id) => this.allSkills.find((sk) => sk.value === id) || {
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
          degreefields_id: job.degreefields_ids
            ? job.degreefields_ids.map((id, i) => ({ label: job.degreefields_names?.[i] || `Field ${id}`, value: id }))
            : (job.degreefields_id ? [{ label: job.degreefield, value: job.degreefields_id }] : []),
          application_deadline: job.application_deadline?.split("T")[0] || "",
          no_of_positions: job.no_of_positions || "",
        },
        selectedCountry: job.country_id ? { label: job.country, value: job.country_id } : null,
        selectedDistrict: job.district_id ? [{ label: job.district, value: job.district_id }] : [],
        selectedCity: job.city_id ? [{ label: job.city, value: job.city_id }] : [],
        industry: job.industry_id ? { label: job.industry_name, value: job.industry_id } : null,
      });

      if (isApproved && isExpired) {
        this.setState({
          deadlineWarning: "⚠️ This job is currently INACTIVE because the deadline has passed. Extending the deadline will automatically reactivate it."
        });
      } else {
        this.setState({ deadlineWarning: null });
      }

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
    } catch {
      return [];
    }
  };
  loadCountries = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallCountries`, {
        params: {
          search: inputValue || "",
          name: "name",
          page: 1,
          limit: 1000,
        },
      });
      return res.data.countries.map((c) => ({ label: c.name, value: c.id }));
    } catch {
      return [];
    }
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
          limit: 1000, // ← was missing, API was defaulting to ~15
        },
      });
      return res.data.districts.map((d) => ({ label: d.name, value: d.id }));
    } catch {
      return [];
    }
  };
  formatSalary = (value) => {
    const num = value.replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  parseSalary = (value) => value.replace(/[^0-9]/g, "");
  fetchCities = async () => {
    const { selectedDistrict } = this.state;
    if (!selectedDistrict?.length) return [];
    try {
      // fetch cities for all selected districts in parallel
      const results = await Promise.all(
        selectedDistrict.map((d) =>
          axios
            .get(`${this.apiBaseUrl}getCitiesByDistrict/${d.value}`)
            .then((res) =>
              res.data.cities.map((c) => ({ label: c.name, value: c.id })),
            )
            .catch(() => []),
        ),
      );
      // flatten and deduplicate
      const allCities = results.flat();
      const unique = allCities.filter(
        (city, index, self) =>
          self.findIndex((c) => c.value === city.value) === index,
      );
      return unique;
    } catch {
      return [];
    }
  };

  loadJobTypes = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalljobtypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.jobtypes.map((c) => ({ label: c.name, value: c.id }));
    } catch {
      return [];
    }
  };

  loadSkills = async (inputValue) => {
    try {
      if (!this.allSkills?.length) {
        const res = await axios.get(`${this.apiBaseUrl}getallskills`, {
          params: { page: 1, limit: 1000 },
        });
        this.allSkills = res.data.skills.map((sk) => ({
          label: sk.name,
          value: sk.id,
        }));
      }
      return this.allSkills.filter((sk) =>
        sk.label.toLowerCase().includes((inputValue || "").toLowerCase()),
      );
    } catch {
      return [];
    }
  };

  loadSpeciality = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallspeciality`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.speciality.map((c) => ({ label: c.name, value: c.id }));
    } catch {
      return [];
    }
  };

  loadDegree = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldegreetype`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.degreetypes.map((c) => ({ label: c.name, value: c.id }));
    } catch {
      return [];
    }
  };
  loadDegreeFields = async (degreeId, inputValue) => {
    console.log("🔥 API CALL TRIGGERED", degreeId, inputValue);

    try {
      const res = await axios.get(
        `${this.apiBaseUrl}getallDegreeFields`,
        {
          params: {
            degree_type_id: Number(degreeId), // ✅ FIX HERE
            search: inputValue || "",
            page: 1,
            limit: 550,
          },
        }
      );

      return (res.data.degreefields || []).map((d) => ({
        label: d.name,
        value: d.id,
      }));
    } catch (err) {
      console.log("API ERROR", err);
      return [];
    }
  };
  loadCurrency = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch {
      return [];
    }
  };

  /* ── Handlers ── */
  capitalizeWords = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  handleInputChange = (e) => {
    const { name, value } = e.target;

    // ✅ Don't capitalize select/enum fields
    const skipCapitalize = ["industry", "job_location_type", "job_description", "salary_period", "min_experience", "max_experience",];
    const capitalized = skipCapitalize.includes(name)
      ? value
      : this.capitalizeWords(value);

    if (name === "NTN") {
      this.setState((prevState) => ({
        formData: { ...prevState.formData, [name]: value },
        ntnError: this.validateNTN(value) ? "" : "Invalid NTN format. 8 digit",
      }));
      return;
    }

    if (name === "phone") {
      let cleanedValue = value.replace(/[^\d]/g, "");
      if (cleanedValue.length > 4) {
        cleanedValue =
          cleanedValue.slice(0, 4) + "-" + cleanedValue.slice(4, 11);
      }
      this.setState((prevState) => ({
        formData: { ...prevState.formData, phone: cleanedValue },
      }));
      return;
    }
    if (name === "min_salary" || name === "max_salary") {
      const raw = value.replace(/[^0-9]/g, "");
      this.setState((prev) => ({
        values: { ...prev.values, [name]: raw },
        errors: { ...prev.errors, [name]: undefined },
      }));
      return;
    }
    this.setState((prevState) => ({
      values: { ...prevState.values, [name]: capitalized },
      errors: { ...prevState.errors, [name]: undefined },
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
    const {
      values,
      selectedCountry,
      selectedDistrict,
      selectedCity,
      jobCountryId,
    } = this.state;
    const errors = {};

    // Check if we're in restricted edit mode (live job)
    const isRestrictedMode = this.isEditRestricted && this.props.jobId;

    // For restricted mode, ONLY validate fields that are NOT disabled
    if (!isRestrictedMode) {
      // Full validation for normal mode
      if (!values.job_title) errors.job_title = "Job title is required.";
      if (!values.job_description)
        errors.job_description = "Job description is required.";
      if (!values.job_type_id) errors.job_type_id = "Job type is required.";
      if (!values.job_location_type)
        errors.job_location_type = "Job location type is required.";
      if (!values.industry) errors.industry = "Industry is required.";
      if (!values.time_from) errors.time_from = "Start time is required.";
      if (!values.time_to) errors.time_to = "End time is required.";

      const isRemote = values.job_location_type === "remote";
      if (!isRemote && !selectedDistrict?.length)
        errors.district_id = "District is required.";
      if (!isRemote && !selectedCity?.length)
        errors.city_id = "City is required.";
    } else {
      // RESTRICTED MODE - Only validate fields that are NOT disabled
      // These are the fields that remain editable in live jobs
      if (!values.job_description)
        errors.job_description = "Job description is required.";
      if (!values.industry) errors.industry = "Industry is required.";
      // No validation for job_title, job_type, location, time, district, city
    }

    // Salary validation - always check if both values exist
    if (
      values.min_salary &&
      values.max_salary &&
      parseFloat(values.max_salary) <= parseFloat(values.min_salary)
    ) {
      errors.salary = "Max salary must exceed min salary.";
    }

    return errors;
  };

  validatePage2 = () => {
    const { values } = this.state;
    const errors = {};

    // Check if we're in restricted edit mode (live job)
    const isRestrictedMode = this.isEditRestricted && this.props.jobId;

    if (!isRestrictedMode) {
      // Full validation for normal mode
      if (!values.skill_ids?.length) errors.skill_ids = "Add at least one skill.";
      if (!values.min_experience)
        errors.min_experience = "Minimum experience is required.";
      if (!values.max_experience)
        errors.max_experience = "Maximum experience is required.";
      if (!values.speciality_id) errors.speciality_id = "Speciality is required.";
      if (!values.degree_id) errors.degree_id = "Qualification is required.";
      if (!values.degreefields_id?.length)
        errors.degreefields_id = "At least one field of study is required.";
    }

    // These fields are ALWAYS validated (even in restricted mode)
    if (!values.no_of_positions)
      errors.no_of_positions = "Number of positions is required.";

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
    console.log("Validation errors:", errors); // ← see what's failing
    console.log("Current values:", this.state.values); // ← see current form state
    console.log("selectedDistrict:", this.state.selectedDistrict);
    console.log("selectedCity:", this.state.selectedCity);
    this.setState({ errors });
    if (!Object.keys(errors).length)
      this.setState({ currentPage: 2, errors: {} });
  };

  goToPage3 = () => {
    const errors = this.validatePage2();
    this.setState({ errors });
    if (!Object.keys(errors).length)
      this.setState({ currentPage: 3, errors: {} });
  };
  submitJobPayload = async (chosenPackageId) => {
    const { values, selectedCountry, selectedDistrict, selectedCity } =
      this.state;
    const editjobid = this.props.jobId;

    const payload = {
      ...values,
      country_id: selectedCountry?.value,
      district_id: selectedDistrict?.map((d) => d.value) ?? [],
      city_id: selectedCity?.map((c) => c.value) ?? [],
      job_type_id: values.job_type_id?.value,
      currency_id: values.currency_id?.value,
      speciality_id: values.speciality_id?.value,
      degree_id: values.degree_id?.value,
      degreefields_id: values.degreefields_id?.map((f) => f.value) ?? [],
      skill_ids: values.skill_ids.map((s) => s.value),
      application_deadline: new Date(values.application_deadline)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      screening_start: values.screening_start || null,
      screening_end: values.screening_end || null,
      interview_start: values.interview_start || null,
      interview_end: values.interview_end || null,
      expected_joining_date: values.expected_joining_date || null,
      chosen_package_id: chosenPackageId || null,
      daily_budget: this.state.dailyBudget || 0, // ← add
      chosen_daily_package_id: this.state.chosenPackageId || null, // ← add
      industry: values.industry?.value ?? values.industry ?? null,
      // chosen_package_id: chosenPackageId || null,
    };

    try {
      if (editjobid) {
        await api.put(
          `${this.apiBaseUrl}job/updatejob/${this.userId}/${editjobid}`,
          payload,
        );
        if (this.props.onSuccess) this.props.onSuccess();
      } else {
        const response = await api.post(
          `${this.apiBaseUrl}job/postjob/${this.userId}`,
          payload,
        );
        this.setState({
          jobId: response.data.job_id,
          showPackageModal: false,
          budgetMode: false,
        });
        this.resetForm();
        if (this.props.onSuccess) this.props.onSuccess();
      }
    } catch (err) {
      const errorCode = err.response?.data?.error;
      if (errorCode === "no_package" || errorCode === "package_exhausted") {
        this.setState({ showPricing: true, showPackageModal: false });
      } else if (errorCode === "no_saved_card") {
        this.setState({
          showPackageModal: false,
          showAddCardModal: true, // ← this triggers your card adding UI
        });
      } else {
        console.error("Job post failed:", err);
      }
    }
  };

  handleSubmit = async () => {
    const editjobid = this.props.jobId;

    // EDIT MODE - for existing jobs
    if (editjobid) {
      // If in restricted edit mode (Approved + Active)
      if (this.isEditRestricted) {
        const { values } = this.state;

        // Get the original deadline from when the job was loaded
        const originalDeadline = this.state.originalDeadline;

        // Prepare payload - include ALL fields (both restricted and allowed)
        const payload = {
          // These fields are ALLOWED to be edited even in live jobs
          job_description: values.job_description,
          industry: values.industry?.value ?? values.industry ?? null,
          min_salary: values.min_salary || null,
          max_salary: values.max_salary || null,
          currency_id: values.currency_id?.value,
          salary_period: values.salary_period,
          no_of_positions: values.no_of_positions,

          // Also allow deadline
          application_deadline: values.application_deadline
            ? new Date(values.application_deadline).toISOString().slice(0, 19).replace("T", " ")
            : null,
        };

        // Validate deadline if changed
        if (values.application_deadline && values.application_deadline !== originalDeadline) {
          const newDeadline = new Date(values.application_deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (newDeadline < today) {
            this.setState({
              errors: {
                ...this.state.errors,
                application_deadline: "Deadline cannot be in the past"
              }
            });
            return;
          }
        }

        try {
          await api.put(
            `${this.apiBaseUrl}job/updatejob/${this.userId}/${editjobid}`,
            payload
          );
          if (this.props.onSuccess) this.props.onSuccess();
        } catch (err) {
          console.error("Failed to update job:", err);
          if (err.response?.data?.error) {
            alert(err.response.data.error);
          } else {
            alert("Failed to update job. Please try again.");
          }
        }
        return;
      }

      // Full edit mode (not restricted)
      await this.submitJobPayload(null);
      return;
    }

    // NEW JOB MODE - rest of your existing code remains same
    try {
      const res = await axios.get(
        `${this.apiBaseUrl}job/getUserPackages/${this.userId}`,
      );

      const allPackages = res.data || [];

      const usablePackages = allPackages
        .filter((pkg) => {
          const snap = pkg.package;
          const today = new Date();
          const endDate = new Date(pkg.end_date);

          if (pkg.status !== "active") return false;
          if (endDate < today) return false;

          if (pkg.pricing_model === "duration_bundle") {
            return pkg.used_posts < (snap?.num_posts || 0);
          }
          if (pkg.pricing_model === "job_slot") {
            return pkg.used_slots < (snap?.slot_count || 0);
          }
          if (pkg.pricing_model === "cv_credits") {
            return true;
          }
          return false;
        })
        .map((pkg) => {
          const snap = pkg.package;
          let remaining = null;
          let detail = "";

          if (pkg.pricing_model === "duration_bundle") {
            remaining = (snap?.num_posts || 0) - (pkg.used_posts || 0);
            detail = `${remaining} post${remaining !== 1 ? "s" : ""} remaining`;
          } else if (pkg.pricing_model === "job_slot") {
            remaining = (snap?.slot_count || 0) - (pkg.used_slots || 0);
            detail = `${remaining} slot${remaining !== 1 ? "s" : ""} remaining`;
          } else if (pkg.pricing_model === "cv_credits") {
            detail = "CV credits (unlimited posts)";
          }

          return {
            id: pkg.subscription_id,
            name: snap?.name || "Package",
            pricing_model: pkg.pricing_model,
            end_date: pkg.end_date,
            remaining,
            detail,
          };
        });

      if (usablePackages.length > 1) {
        this.setState({
          availablePackages: usablePackages,
          showPackageModal: true,
          budgetMode: false,
        });
      } else if (usablePackages.length === 1) {
        await this.submitJobPayload(usablePackages[0].id);
      } else {
        try {
          const pkgRes = await axios.get(
            `${this.apiBaseUrl}packages/getAvailablePackages`,
            { params: { pricing_model: "daily_budget" } },
          );

          this.setState({
            availablePackages: pkgRes.data.packages || [],
            showPackageModal: true,
            budgetMode: true,
            chosenPackageId: null,
            dailyBudget: "",
          });
        } catch (err) {
          console.error("Failed to fetch daily_budget packages", err);
          this.setState({
            availablePackages: [],
            showPackageModal: true,
            budgetMode: true,
            chosenPackageId: null,
            dailyBudget: "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch user packages", err);
    }
  };

  generateTimeOptions = () => {
    const slots = [
      { v: '06:00', l: '06:00 AM' }, { v: '06:30', l: '06:30 AM' },
      { v: '07:00', l: '07:00 AM' }, { v: '07:30', l: '07:30 AM' },
      { v: '08:00', l: '08:00 AM' }, { v: '08:30', l: '08:30 AM' },
      { v: '09:00', l: '09:00 AM' }, { v: '09:30', l: '09:30 AM' },
      { v: '10:00', l: '10:00 AM' }, { v: '10:30', l: '10:30 AM' },
      { v: '11:00', l: '11:00 AM' }, { v: '11:30', l: '11:30 AM' },
      { v: '12:00', l: '12:00 PM' }, { v: '12:30', l: '12:30 PM' },
      { v: '13:00', l: '01:00 PM' }, { v: '13:30', l: '01:30 PM' },
      { v: '14:00', l: '02:00 PM' }, { v: '14:30', l: '02:30 PM' },
      { v: '15:00', l: '03:00 PM' }, { v: '15:30', l: '03:30 PM' },
      { v: '16:00', l: '04:00 PM' }, { v: '16:30', l: '04:30 PM' },
      { v: '17:00', l: '05:00 PM' }, { v: '17:30', l: '05:30 PM' },
      { v: '18:00', l: '06:00 PM' }, { v: '18:30', l: '06:30 PM' },
      { v: '19:00', l: '07:00 PM' }, { v: '19:30', l: '07:30 PM' },
      { v: '20:00', l: '08:00 PM' }, { v: '20:30', l: '08:30 PM' },
      { v: '21:00', l: '09:00 PM' }, { v: '21:30', l: '09:30 PM' },
      { v: '22:00', l: '10:00 PM' }, { v: '22:30', l: '10:30 PM' },
      { v: '23:00', l: '11:00 PM' }, { v: '23:30', l: '11:30 PM' },
      { v: '00:00', l: '12:00 AM' }, { v: '00:30', l: '12:30 AM' },
      { v: '01:00', l: '01:00 AM' }, { v: '01:30', l: '01:30 AM' },
      { v: '02:00', l: '02:00 AM' }, { v: '02:30', l: '02:30 AM' },
    ];
    return slots.map(s => <option key={s.v} value={s.v}>{s.l}</option>);
  };

  timeOptionsList = () => {
    const slots = [
      { v: '06:00', l: '06:00 AM' }, { v: '06:30', l: '06:30 AM' },
      { v: '07:00', l: '07:00 AM' }, { v: '07:30', l: '07:30 AM' },
      { v: '08:00', l: '08:00 AM' }, { v: '08:30', l: '08:30 AM' },
      { v: '09:00', l: '09:00 AM' }, { v: '09:30', l: '09:30 AM' },
      { v: '10:00', l: '10:00 AM' }, { v: '10:30', l: '10:30 AM' },
      { v: '11:00', l: '11:00 AM' }, { v: '11:30', l: '11:30 AM' },
      { v: '12:00', l: '12:00 PM' }, { v: '12:30', l: '12:30 PM' },
      { v: '13:00', l: '01:00 PM' }, { v: '13:30', l: '01:30 PM' },
      { v: '14:00', l: '02:00 PM' }, { v: '14:30', l: '02:30 PM' },
      { v: '15:00', l: '03:00 PM' }, { v: '15:30', l: '03:30 PM' },
      { v: '16:00', l: '04:00 PM' }, { v: '16:30', l: '04:30 PM' },
      { v: '17:00', l: '05:00 PM' }, { v: '17:30', l: '05:30 PM' },
      { v: '18:00', l: '06:00 PM' }, { v: '18:30', l: '06:30 PM' },
      { v: '19:00', l: '07:00 PM' }, { v: '19:30', l: '07:30 PM' },
      { v: '20:00', l: '08:00 PM' }, { v: '20:30', l: '08:30 PM' },
      { v: '21:00', l: '09:00 PM' }, { v: '21:30', l: '09:30 PM' },
      { v: '22:00', l: '10:00 PM' }, { v: '22:30', l: '10:30 PM' },
      { v: '23:00', l: '11:00 PM' }, { v: '23:30', l: '11:30 PM' },
      { v: '00:00', l: '12:00 AM' }, { v: '00:30', l: '12:30 AM' },
      { v: '01:00', l: '01:00 AM' }, { v: '01:30', l: '01:30 AM' },
      { v: '02:00', l: '02:00 AM' }, { v: '02:30', l: '02:30 AM' },
    ];
    return slots.map(s => ({ value: s.v, label: s.l }));
  };

  fmt12 = (v) => {
    if (!v) return '';
    const [h, m] = v.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  calcHours = (from, to) => {
    if (!from || !to) return '';
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    let mins = (th * 60 + tm) - (fh * 60 + fm);
    if (mins <= 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m shift` : `${h}h shift`;
  };
  resetForm = () => {
    this.setState({
      currentPage: 1,
      values: {
        job_title: "",
        job_description: "",
        skill_ids: [],
        time_from: "",
        time_to: "",
        job_type_id: null,
        job_location_type: "",
        min_salary: "",
        max_salary: "",
        min_experience: "",
        max_experience: "",
        speciality_id: null,
        degree_id: null,
        application_deadline: "",
        no_of_positions: "",
        industry: "",
        currency_id: null,
        screening_start: "",
        screening_end: "",
        interview_start: "",
        interview_end: "",
        expected_joining_date: "",
        salary_period: "monthly",
      },
      selectedCountry: null,
      selectedDistrict: [],
      selectedCity: [],
      errors: {},
      showPricing: false,
      jobId: null,
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
    const { values, errors, selectedCountry, selectedDistrict, selectedCity } =
      this.state;
    const isRemote = values.job_location_type === "remote";

    return (
      <div>
        <h2 style={s.pageHeading}>Tell us about the job</h2>
        <p style={s.pageSubtitle}>
          Start with the basics — role, location, and compensation.
        </p>

        <div style={s.notice}>
          All fields marked with <strong style={{ margin: "0 3px" }}>*</strong>{" "}
          are required before you can continue.
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
                isDisabled={this.isEditRestricted && this.props.jobId}
                value={
                  values.job_title
                    ? { label: values.job_title, value: values.job_title }
                    : null
                }
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
            <Field
              label="Job description"
              required
              error={errors.job_description}
            >
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
            <Field label="Job type" required error={errors.job_type_id}>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadJobTypes}
                value={values.job_type_id}
                onChange={(option) =>
                  this.handleSelectChange("job_type_id", option)
                }
                isDisabled={this.isEditRestricted && this.props.jobId}
                placeholder="Select type..."
                styles={indeedSelectStyles}
              />
            </Field>

            <Field label="Job location type" required error={errors.job_location_type}>
              <CustomSelect
                options={[
                  { value: "on-site", label: "On-site" },
                  { value: "remote", label: "Remote" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
                value={values.job_location_type}
                onChange={(val) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, job_location_type: val },
                    errors: { ...prev.errors, job_location_type: undefined },
                  }))
                }
                placeholder="Select location type"
                error={!!errors.job_location_type}
                disabled={this.isEditRestricted && this.props.jobId}
              />
            </Field>

            <Field
              label="Industry / Facility type"
              required
              error={errors.industry}
            >
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadIndustry}
                value={values.industry || null}
                onChange={(option) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, industry: option || null },
                    errors: { ...prev.errors, industry: undefined },
                  }))
                }
                placeholder="Select industry..."
                styles={indeedSelectStyles}
              />
            </Field>
          </div>
        </div>

        {/* Location & Working Hours */}
        <div style={s.card}>
          <div style={s.cardTitle}>Location & working hours</div>

          {/* District + City */}
          <div style={{ ...s.row2, marginBottom: "16px" }}>
            <Field
              label="Districts"
              required={!isRemote}
              error={errors.district_id}
            >
              <AsyncSelect
                isMulti
                key={`district-${selectedCountry?.value ?? this.state.jobCountryId}-${this.state.initialDistricts?.length}`}
                defaultOptions={
                  this.state.initialDistricts?.length
                    ? this.state.initialDistricts
                    : true
                }
                loadOptions={this.loadDistricts}
                value={selectedDistrict}
                onChange={(options) =>
                  this.setState({
                    selectedDistrict: options || [],
                    selectedCity: [],
                    errors: { ...this.state.errors, district_id: undefined },
                  })
                }
                isDisabled={(!selectedCountry && !this.state.jobCountryId) || (this.isEditRestricted && this.props.jobId)}
                placeholder="Select district..."
                styles={indeedSelectStyles}
              />
            </Field>

            <Field label="City" required={!isRemote} error={errors.city_id}>
              <AsyncSelect
                isMulti
                key={selectedDistrict?.map((d) => d.value).join("-") || "city"}
                cacheOptions
                defaultOptions
                loadOptions={this.fetchCities}
                value={selectedCity}
                onChange={(options) =>
                  this.setState({
                    selectedCity: options || [],
                    errors: { ...this.state.errors, city_id: undefined },
                  })
                }
                isDisabled={!selectedDistrict?.length || (this.isEditRestricted && this.props.jobId)}
                placeholder="Select city..."
                styles={indeedSelectStyles}
              />
            </Field>
          </div>

          {/* Working Hours */}
          <Field
            label="Working hours"
            required
            error={errors.time_from || errors.time_to}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1", minWidth: "140px" }}>
                <span style={{ fontSize: "11px", color: TEXT_SECONDARY }}>Start time</span>
                <CustomSelect
                  options={this.timeOptionsList()}
                  value={values.time_from}
                  onChange={(val) =>
                    this.setState((prev) => ({
                      values: { ...prev.values, time_from: val },
                      errors: { ...prev.errors, time_from: undefined },
                    }))
                  }
                  placeholder="Select start"
                  error={!!errors.time_from}
                  disabled={this.isEditRestricted && this.props.jobId}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", paddingTop: "18px" }}>
                <div style={{ width: "1px", height: "12px", background: BORDER }} />
                <span style={{ fontSize: "12px", color: TEXT_SECONDARY }}>to</span>
                <div style={{ width: "1px", height: "12px", background: BORDER }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1", minWidth: "140px" }}>
                <span style={{ fontSize: "11px", color: TEXT_SECONDARY }}>End time</span>
                <CustomSelect
                  options={this.timeOptionsList()}
                  value={values.time_to}
                  onChange={(val) =>
                    this.setState((prev) => ({
                      values: { ...prev.values, time_to: val },
                      errors: { ...prev.errors, time_to: undefined },
                    }))
                  }
                  placeholder="Select end"
                  error={!!errors.time_to}
                  disabled={this.isEditRestricted && this.props.jobId}
                />
              </div>
            </div>

            {values.time_from && values.time_to && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "12px", fontWeight: 500, padding: "5px 12px",
                  borderRadius: "20px", background: "#f3f4f6", color: TEXT_SECONDARY,
                  border: `0.5px solid ${BORDER}`
                }}>
                  {this.fmt12(values.time_from)} — {this.fmt12(values.time_to)}
                </span>
                <span style={{
                  fontSize: "12px", fontWeight: 500, padding: "5px 12px",
                  borderRadius: "20px", background: BLUE_LIGHT, color: "#254048"
                }}>
                  {this.calcHours(values.time_from, values.time_to)}
                </span>
              </div>
            )}
            <div style={s.hint}>For overnight shifts, end time can be earlier than start time</div>
          </Field>
        </div>

        {/* Compensation */}
        <div style={s.card}>
          <div style={s.cardTitle}>Compensation</div>
          <Field
            label="Salary range"
            hint="Enter min and max salary with currency and period."
            error={
              errors.salary ||
              errors.min_salary ||
              errors.max_salary ||
              errors.currency_id
            }
          >
            <div style={{ ...s.row3, gridTemplateColumns: "1fr 1fr 120px 130px" }}>
              <input
                type="text"
                name="min_salary"
                value={values.min_salary ? Number(values.min_salary).toLocaleString() : ""}
                placeholder="Minimum"
                onChange={this.handleInputChange}
                style={{
                  ...s.input,
                  borderColor: errors.min_salary ? RED : BORDER,
                }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.min_salary ? RED : BORDER)
                }
              />
              <input
                type="text"
                name="max_salary"
                value={values.max_salary ? Number(values.max_salary).toLocaleString() : ""}
                placeholder="Maximum"
                onChange={this.handleInputChange}
                style={{
                  ...s.input,
                  borderColor: errors.max_salary ? RED : BORDER,
                }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.max_salary ? RED : BORDER)
                }
              />
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadCurrency}
                value={values.currency_id}
                onChange={(option) =>
                  this.handleSelectChange("currency_id", option)
                }
                placeholder="Currency"
                styles={indeedSelectStyles}
              />
              <CustomSelect
                options={[
                  { value: "hourly", label: "Hourly" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
                value={values.salary_period}
                onChange={(val) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, salary_period: val },
                  }))
                }
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
            onMouseEnter={(e) => (e.target.style.background = "#5f8190")}
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
        <p style={s.pageSubtitle}>
          Help candidates understand exactly what you are looking for.
        </p>

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
              isDisabled={this.isEditRestricted && this.props.jobId}
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
              <CustomSelect
                options={this.experienceOptions.map((o) => ({ value: o.label, label: o.label }))}
                value={values.min_experience}
                onChange={(val) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, min_experience: val },
                    errors: { ...prev.errors, min_experience: undefined },
                  }))
                }
                placeholder="Select"
                error={!!errors.min_experience}
                disabled={this.isEditRestricted && this.props.jobId}
              />
            </Field>

            <Field
              label="Maximum experience"
              required
              error={errors.max_experience}
            >
              <CustomSelect
                options={this.experienceOptions.map((o) => ({ value: o.label, label: o.label }))}
                value={values.max_experience}
                onChange={(val) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, max_experience: val },
                    errors: { ...prev.errors, max_experience: undefined },
                  }))
                }
                placeholder="Select"
                error={!!errors.max_experience}
                disabled={this.isEditRestricted && this.props.jobId}
              />
            </Field>
          </div>

          <div style={s.row2}>
            <Field label="Speciality" required error={errors.speciality_id}>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadSpeciality}
                value={values.speciality_id}
                onChange={(option) =>
                  this.handleSelectChange("speciality_id", option)
                }
                isDisabled={this.isEditRestricted && this.props.jobId}
                placeholder="Select speciality..."
                styles={indeedSelectStyles}
              />
            </Field>

            <Field
              label="Qualification required"
              required
              error={errors.degree_id}
            >
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={this.loadDegree}
                value={values.degree_id}
                onChange={(option) =>
                  this.setState((prev) => ({
                    values: {
                      ...prev.values,
                      degree_id: option,
                      degreefields_id: null, // reset dependent field
                    },
                    errors: {
                      ...prev.errors,
                      degree_id: undefined,
                    },
                  }))
                }
                isDisabled={this.isEditRestricted && this.props.jobId}
                placeholder="Select degree..."
                styles={indeedSelectStyles}
              />
            </Field>
            <Field
              label="Field of Study"
              required
              error={errors.degreefields_id}
            >
              <AsyncSelect
                key={values.degree_id?.value || "degree-field"}
                isMulti                              // ← ADD THIS
                cacheOptions
                defaultOptions
                loadOptions={(inputValue) => {
                  const degreeId = this.state.values.degree_id?.value;
                  if (!degreeId) return [];
                  return this.loadDegreeFields(degreeId, inputValue);
                }}
                value={values.degreefields_id}       // already array now
                onChange={(options) =>
                  this.setState((prev) => ({
                    values: { ...prev.values, degreefields_id: options || [] },
                    errors: { ...prev.errors, degreefields_id: undefined },
                  }))
                }
                isDisabled={!values.degree_id || (this.isEditRestricted && this.props.jobId)}
                placeholder="Select field(s) of study..."
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
                style={{
                  ...s.input,
                  borderColor: errors.no_of_positions ? RED : BORDER,
                }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) =>
                (e.target.style.borderColor = errors.no_of_positions
                  ? RED
                  : BORDER)
                }
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
                style={{
                  ...s.input,
                  borderColor: errors.application_deadline ? RED : BORDER,
                }}
                onFocus={(e) => (e.target.style.borderColor = BLUE)}
                onBlur={(e) =>
                (e.target.style.borderColor = errors.application_deadline
                  ? RED
                  : BORDER)
                }
              />
            </Field>
          </div>
          {/* ── Hiring Timeline ── */}
          {/* <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  marginBottom: "2px",
                }}
              >
                Hiring timeline
                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "11px",
                    fontWeight: 500,
                    background: "#e8f0fe",
                    color: "#1a56db",
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  Optional
                </span>
              </div>
              <div style={{ fontSize: "12px", color: TEXT_SECONDARY }}>
                Let candidates know what to expect — improves response rate and
                reduces drop-offs.
              </div>
            </div>

            <div style={s.row2}>
              <Field
                label="Screening period — start"
                hint="When will you start reviewing CVs?"
              >
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
              <Field
                label="Interview dates — start"
                hint="When do interviews begin?"
              >
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
              <Field
                label="Expected joining date"
                hint="When should the selected candidate start?"
              >
                <input
                  type="date"
                  name="expected_joining_date"
                  value={values.expected_joining_date}
                  onChange={this.handleInputChange}
                  style={s.input}
                />
              </Field>
            </div>
          </div> */}
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
            onMouseEnter={(e) => (e.target.style.background = "#36565f")}
            onMouseLeave={(e) => (e.target.style.background = BLUE)}
          >
            Review & Post
          </button>
        </div>
      </div>
    );
  };

  renderPage3 = () => {
    const { values, selectedCountry, selectedDistrict, selectedCity } =
      this.state;
    const isRemote = values.job_location_type === "remote";

    const location = isRemote
      ? "Remote"
      : [
        selectedCity?.map((c) => c.label).join(", "),
        selectedDistrict?.map((d) => d.label).join(", "),
        selectedCountry?.label,
      ]
        .filter(Boolean)
        .join(" — ");

    const rows = [
      ["Job Title", values.job_title],
      ["Job Type", values.job_type_id?.label],
      ["Location Type", values.job_location_type || "—"],
      ["Industry", values.industry?.label ?? "—"],
      ["Location", location],
      [
        "Working Hours",
        values.time_from && values.time_to
          ? `${values.time_from} – ${values.time_to}`
          : "—",
      ],
      [
        "Salary",
        values.min_salary && values.max_salary
          ? `${values.min_salary} – ${values.max_salary} ${values.currency_id?.label || ""}`
          : "Not disclosed",
      ],
      ["Skills", values.skill_ids?.map((s) => s.label).join(", ")],
      [
        "Experience",
        values.min_experience && values.max_experience
          ? `${values.min_experience} to ${values.max_experience}`
          : "—",
      ],
      ["Speciality", values.speciality_id?.label],
      ["Qualification", values.degree_id?.label],
      ["Field of Study", values.degreefields_id?.map((f) => f.label).join(", ") || "—"],
      ["No. of Positions", values.no_of_positions],
      ["Application Deadline", values.application_deadline],
      // ["Application Deadline", values.application_deadline],
      // [
      //   "Screening Period",
      //   values.screening_start && values.screening_end
      //     ? `${values.screening_start} – ${values.screening_end}`
      //     : values.screening_start || "—",
      // ],
      // [
      //   "Interview Dates",
      //   values.interview_start && values.interview_end
      //     ? `${values.interview_start} – ${values.interview_end}`
      //     : values.interview_start || "—",
      // ],
      // ["Expected Joining Date", values.expected_joining_date || "—"],
    ];

    return (
      <div>
        <h2 style={s.pageHeading}>Review your job post</h2>
        <p style={s.pageSubtitle}>
          Double-check everything before publishing. Candidates will see this
          listing immediately.
        </p>

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
              <div style={{ ...s.reviewKey, marginBottom: "8px" }}>
                Description
              </div>
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
            onMouseEnter={(e) => (e.target.style.background = "#5f8190")}
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
    if (showPricing)
      return (
        <div style={{ background: BG, minHeight: "100vh" }}>
          <div
            style={{
              padding: "14px 32px",
              borderBottom: `1px solid ${BORDER}`,
              background: WHITE,
            }}
          >
            <button
              style={s.btnGhost}
              onClick={() => this.setState({ showPricing: false })}
            >
              ← Back to Job Post
            </button>
          </div>
          <div style={{ padding: "32px" }}>
            <PricingPage
              jobId={jobId}
              onPaymentSuccess={() => this.setState({ showPricing: false })}
            />
          </div>
        </div>
      );
    return (
      <div style={{ background: BG, minHeight: "100vh" }}>
        <Head>
          <title>Post a Job</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        {this.state.showLangModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px",
                width: "100%",
                maxWidth: "440px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "22px",
                }}
              >
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: TEXT_PRIMARY,
                    margin: 0,
                  }}
                >
                  Edit language and country
                </h3>
                <button
                  onClick={() => this.setState({ showLangModal: false })}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: TEXT_SECONDARY,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {this.state.langModalLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: TEXT_SECONDARY,
                    fontSize: "14px",
                  }}
                >
                  Loading options…
                </div>
              ) : (
                <>
                  {/* Language */}
                  <div style={{ marginBottom: "18px" }}>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: TEXT_PRIMARY,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Language of job post <span style={{ color: RED }}>*</span>
                    </label>
                    <select
                      value={this.state.jobLanguage}
                      onChange={(e) =>
                        this.setState({ jobLanguage: e.target.value })
                      }
                      style={{ ...s.select, width: "100%" }}
                    >
                      {this.state.languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        fontSize: "12px",
                        color: TEXT_SECONDARY,
                        marginTop: "5px",
                      }}
                    >
                      The language your job post is written in.
                    </div>
                  </div>

                  {/* Country */}
                  {/* Country */}
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: TEXT_PRIMARY,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Country where job post is shown{" "}
                      <span style={{ color: RED }}>*</span>
                    </label>
                    <select
                      value={String(this.state.jobCountryId ?? "")}
                      onChange={(e) => {
                        const selected = this.state.modalCountries.find(
                          (c) => String(c.value) === e.target.value,
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
                        <option key={c.value} value={String(c.value)}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        fontSize: "12px",
                        color: TEXT_SECONDARY,
                        marginTop: "5px",
                      }}
                    >
                      Pre-filled from your company profile. Change if posting
                      for a different region.
                    </div>
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => this.setState({ showLangModal: false })}
                  style={{ ...s.btnGhost, padding: "0 20px" }}
                >
                  Close
                </button>
                <button
                  onClick={() => this.setState({ showLangModal: false })}
                  style={{
                    ...s.btnPrimary,
                    padding: "0 24px",
                    background: "#36565f",
                  }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              marginBottom: "12px",
            }}
          >
            <button
              // ── Update the globe button onClick ──
              onClick={() => {
                this.setState({ showLangModal: true });
              }}
              style={{
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                color: TEXT_SECONDARY,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🌐 {this.state.jobLanguage} · {this.state.jobCountry}
            </button>
          </div>
          {/* Progress */}
          {this.renderProgressBar()}
          <StepIndicator current={currentPage} />

          {this.isEditRestricted && this.props.jobId && (
            <div style={{
              ...s.notice,
              background: '#fef3c7',
              borderLeftColor: '#f59e0b',
              marginBottom: '20px'
            }}>
              <span>⚠️</span>
              <div>
                <strong>Limited editing mode</strong> — This job is live (Approved + Active).<br />
                You can edit: <strong>Job Description, Industry, Salary Range, Number of Positions & Application Deadline</strong><br />
                Other fields like Job Title, Location, Skills, etc. cannot be changed while job is live.
              </div>
            </div>
          )}

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
        {this.state.showPackageModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px",
                width: "100%",
                maxWidth: "480px",
                maxHeight: "90vh", // ← cap the height
                overflowY: "auto", // ← enable scroll
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                fontFamily: "inherit",
              }}
            >
              {/* ── Multiple packages ── */}
              {!this.state.budgetMode &&
                this.state.availablePackages.length > 0 && (
                  <>
                    <h3
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Select a package to use
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "20px",
                      }}
                    >
                      You have {this.state.availablePackages.length} active
                      packages. Choose which one to apply to this job post.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginBottom: "24px",
                      }}
                    >
                      {this.state.availablePackages.map((pkg) => {
                        const snap = JSON.parse(pkg.package_snapshot || "{}");
                        const isChosen = this.state.chosenPackageId === pkg.id;

                        let detail = "";
                        if (pkg.pricing_model === "duration_bundle")
                          detail = `${pkg.remaining} post${pkg.remaining !== 1 ? "s" : ""} remaining`;
                        else if (pkg.pricing_model === "job_slot")
                          detail = `${pkg.remaining} slot${pkg.remaining !== 1 ? "s" : ""} remaining`;
                        else if (pkg.pricing_model === "cv_credits")
                          detail = "CV credits (unlimited posts)";

                        return (
                          <div
                            key={pkg.id}
                            onClick={() =>
                              this.setState({ chosenPackageId: pkg.id })
                            }
                            style={{
                              border: `2px solid ${isChosen ? "#36565f" : "#e5e7eb"}`,
                              borderRadius: "10px",
                              padding: "14px 16px",
                              cursor: "pointer",
                              background: isChosen ? "#e8f0fe" : "#fff",
                              transition: "all 0.15s",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{ fontWeight: 600, fontSize: "14px" }}
                              >
                                {pkg.package_name}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 10px",
                                  borderRadius: "20px",
                                  background: isChosen ? "#36565f" : "#f3f4f6",
                                  color: isChosen ? "#fff" : "#6b7280",
                                  fontWeight: 600,
                                }}
                              >
                                {isChosen ? "Selected" : "Select"}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginTop: "4px",
                              }}
                            >
                              {detail} · Expires{" "}
                              {new Date(pkg.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          this.setState({
                            showPackageModal: false,
                            chosenPackageId: null,
                          })
                        }
                        style={{ ...s.btnGhost, padding: "0 20px" }}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!this.state.chosenPackageId}
                        onClick={() => {
                          this.setState({ showPackageModal: false });
                          this.submitJobPayload(this.state.chosenPackageId);
                        }}
                        style={{
                          ...s.btnPrimary,
                          padding: "0 24px",
                          opacity: this.state.chosenPackageId ? 1 : 0.5,
                          cursor: this.state.chosenPackageId
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        Post Job with Selected Package
                      </button>
                    </div>
                  </>
                )}

              {/* ── No package — budget / subscription ── */}
              {this.state.budgetMode && (
                <>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    No active package found
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "16px",
                    }}
                  >
                    Choose a daily budget plan — your job gets promoted and
                    you're only charged based on actual candidate interactions,
                    up to your daily cap.
                  </p>

                  {/* ── How it works ── */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0",
                      marginBottom: "20px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    {[
                      {
                        icon: "📋",
                        title: "Job goes live",
                        desc: "Your post is published and shown to matching candidates",
                      },
                      {
                        icon: "📩",
                        title: "Applications come in",
                        desc: "Candidates apply or appear in your search results",
                      },
                      {
                        icon: "💳",
                        title: "You're charged",
                        desc: "Only when you view profiles or receive applications — up to your daily cap",
                      },
                    ].map((step, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          borderRight: i < 2 ? "1px solid #e5e7eb" : "none",
                        }}
                      >
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          {step.icon}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#111827",
                            marginBottom: "2px",
                          }}
                        >
                          {step.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            lineHeight: "1.4",
                          }}
                        >
                          {step.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Billing model legend ── */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    {[
                      {
                        key: "cpc",
                        label: "CPC",
                        title: "Cost per Profile View",
                        desc: "Charged each time you open a candidate's profile",
                        color: "#185FA5",
                        bg: "#E6F1FB",
                      },
                      {
                        key: "cpm",
                        label: "CPM",
                        title: "Cost per 1,000 Profiles",
                        desc: "Charged per 1,000 candidate profiles shown to you",
                        color: "#3B6D11",
                        bg: "#EAF3DE",
                      },
                      {
                        key: "cpa",
                        label: "CPA",
                        title: "Cost per Application",
                        desc: "Charged only when a candidate applies to your job",
                        color: "#854F0B",
                        bg: "#FAEEDA",
                      },
                    ].map((bm) => (
                      <div
                        key={bm.key}
                        style={{
                          background: bm.bg,
                          borderRadius: "8px",
                          padding: "10px 12px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: bm.color,
                            background: "rgba(255,255,255,0.6)",
                            padding: "1px 8px",
                            borderRadius: "20px",
                            display: "inline-block",
                            marginBottom: "4px",
                          }}
                        >
                          {bm.label}
                        </span>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#111827",
                            marginBottom: "2px",
                          }}
                        >
                          {bm.title}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            lineHeight: "1.3",
                          }}
                        >
                          {bm.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Package cards from DB ── */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    {this.state.availablePackages.length === 0 && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          textAlign: "center",
                          padding: "24px",
                          background: "#f9fafb",
                          borderRadius: "10px",
                          border: "1px dashed #d1d5db",
                        }}
                      >
                        No daily budget plans available right now.
                      </div>
                    )}

                    {this.state.availablePackages.map((pkg) => {
                      const isChosen = this.state.chosenPackageId === pkg.id;

                      const billingMeta = {
                        cpc: {
                          label: "Cost per Profile View",
                          color: "#185FA5",
                          bg: "#E6F1FB",
                        },
                        cpm: {
                          label: "Cost per 1,000 Profiles",
                          color: "#3B6D11",
                          bg: "#EAF3DE",
                        },
                        cpa: {
                          label: "Cost per Application",
                          color: "#854F0B",
                          bg: "#FAEEDA",
                        },
                      }[pkg.billing_model] || {
                        label: pkg.billing_model?.toUpperCase(),
                        color: "#6b7280",
                        bg: "#f3f4f6",
                      };

                      // description lines → bullet points (same as your admin)
                      const features = pkg.description
                        ? pkg.description
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={pkg.id}
                          onClick={() =>
                            this.setState({
                              chosenPackageId: pkg.id,
                              dailyBudget: pkg.daily_budget_cap,
                            })
                          }
                          style={{
                            border: `2px solid ${isChosen ? "#36565f" : "#e5e7eb"}`,
                            borderRadius: "12px",
                            padding: "18px",
                            cursor: "pointer",
                            background: isChosen ? "#f0f7f8" : "#fff",
                            transition: "all 0.15s",
                          }}
                        >
                          {/* ── Top row: name + billing badge + select ── */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "12px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "2px",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    color: "#111827",
                                  }}
                                >
                                  {pkg.name}
                                </span>
                                {pkg.is_featured === 1 && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      padding: "1px 8px",
                                      borderRadius: "20px",
                                      background: "#36565f",
                                      color: "#fff",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ⭐ Most Popular
                                  </span>
                                )}
                                {pkg.sponsor_to_top === 1 && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      padding: "1px 8px",
                                      borderRadius: "20px",
                                      background: "#FAEEDA",
                                      color: "#854F0B",
                                      fontWeight: 600,
                                    }}
                                  >
                                    🚀 Sponsored to Top
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 10px",
                                  borderRadius: "20px",
                                  background: billingMeta.bg,
                                  color: billingMeta.color,
                                }}
                              >
                                {billingMeta.label}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "4px 14px",
                                borderRadius: "20px",
                                fontWeight: 600,
                                background: isChosen ? "#36565f" : "#f3f4f6",
                                color: isChosen ? "#fff" : "#6b7280",
                                flexShrink: 0,
                                marginLeft: "10px",
                                alignSelf: "center",
                              }}
                            >
                              {isChosen ? "✓ Selected" : "Select"}
                            </span>
                          </div>

                          {/* ── Stats: daily cap / rate / duration ── */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr",
                              gap: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            {[
                              {
                                label: "Daily Cap",
                                value: `${pkg.daily_budget_cap}`,
                                sub: "max spend per day",
                              },
                              {
                                label: "Rate",
                                value: `${pkg.rate_per_unit}`,
                                sub:
                                  pkg.billing_model === "cpm"
                                    ? "per 1k profiles"
                                    : pkg.billing_model === "cpc"
                                      ? "per profile view"
                                      : "per application",
                              },
                              {
                                label: "Duration",
                                value: pkg.campaign_duration_days
                                  ? `${pkg.campaign_duration_days} days`
                                  : "Open-ended",
                                sub: "campaign length",
                              },
                            ].map((stat) => (
                              <div
                                key={stat.label}
                                style={{
                                  background: isChosen
                                    ? "rgba(255,255,255,0.7)"
                                    : "#f9fafb",
                                  borderRadius: "8px",
                                  padding: "8px 10px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                  }}
                                >
                                  {stat.value}
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    color: "#6b7280",
                                    marginTop: "1px",
                                  }}
                                >
                                  {stat.label}
                                </div>
                                <div
                                  style={{ fontSize: "10px", color: "#9ca3af" }}
                                >
                                  {stat.sub}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* ── Min budget warning ── */}
                          {pkg.min_daily_budget && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#854F0B",
                                background: "#FAEEDA",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                marginBottom: "10px",
                                display: "inline-block",
                              }}
                            >
                              ⚠️ Minimum daily spend: {pkg.min_daily_budget}
                            </div>
                          )}

                          {/* ── Feature bullets from description ── */}
                          {features.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginBottom: "4px",
                              }}
                            >
                              {features.map((f, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: "11px",
                                    color: "#374151",
                                    background: "#f3f4f6",
                                    borderRadius: "20px",
                                    padding: "2px 10px",
                                  }}
                                >
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Buy subscription ── */}
                  <div
                    style={{
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      marginBottom: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>
                        📦 Need unlimited posts or job slots?
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        Buy a duration bundle, job slot, or CV credits package
                        for better value.
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        this.setState({
                          showPackageModal: false,
                          showPricing: true,
                        })
                      }
                      style={{
                        ...s.btnPrimary,
                        padding: "0 18px",
                        fontSize: "13px",
                        flexShrink: 0,
                      }}
                    >
                      View plans
                    </button>
                  </div>

                  {/* ── Actions ── */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() =>
                        this.setState({
                          showPackageModal: false,
                          budgetMode: false,
                          chosenPackageId: null,
                          dailyBudget: "",
                        })
                      }
                      style={{ ...s.btnGhost, padding: "0 20px" }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!this.state.chosenPackageId} // must pick a plan
                      onClick={() => {
                        this.setState({
                          showPackageModal: false,
                          budgetMode: false,
                        });
                        this.submitJobPayload(null); // don't pass as chosen_package_id
                      }}
                      style={{
                        ...s.btnPrimary,
                        padding: "0 24px",
                        opacity:
                          this.state.dailyBudget || this.state.chosenPackageId
                            ? 1
                            : 0.5,
                        cursor:
                          this.state.dailyBudget || this.state.chosenPackageId
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      Post Job →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {this.state.showAddCardModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px",
                width: "100%",
                maxWidth: "440px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                  Add a Card to Continue
                </h3>
                <button
                  onClick={() => this.setState({ showAddCardModal: false })}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  ×
                </button>
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                A saved card is required for daily budget jobs. You'll only be
                charged after admin approves your job.
              </p>

              <AddCardForm
                onSave={async (cardInput) => {
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                  try {
                    await axios.post(
                      `${apiBaseUrl}payment/addPayment/${this.userId}`,
                      {
                        paymentDetails: {
                          method: "card",
                          cardLast4: cardInput.last4,
                          cardName: cardInput.holder,
                          saveForLater: true,
                          acceptedTypes: cardInput.acceptedTypes,
                        },
                        amount: 0,
                        currency: "PKR",
                        packageId: null,
                        jobId: null,
                      },
                    );

                    // Card saved — close modal and retry job post
                    this.setState({ showAddCardModal: false });
                    this.handleSubmit(); // retry posting the job
                  } catch (err) {
                    console.error("Failed to save card", err);
                    alert("Could not save card. Please try again.");
                  }
                }}
                onBrowse={() => this.setState({ showAddCardModal: false })}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(PostBoxForm);
