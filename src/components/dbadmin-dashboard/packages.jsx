import React, { Component } from "react";
import axios from "axios";
import Pagination from "../common/pagination.jsx";
import api from "../lib/api.jsx";
import Helmet from "react-helmet";
import { withRouter } from "next/router";
import * as XLSX from "xlsx";
import {
  Card,
  Row,
  Col,
  Container,
  CardBody,
  Table,
  Button,
  Modal,
} from "react-bootstrap";
import AsyncSelect from "react-select/async";
import "bootstrap-icons/font/bootstrap-icons.css";

const tealSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#36565F" : "#ccc",
    boxShadow: state.isFocused ? "0 0 0 1px #36565F" : "none",
    "&:hover": { borderColor: "#36565F" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#36565F"
      : state.isFocused
        ? "#e8eef0"
        : "#fff",
    color: state.isSelected ? "#fff" : "#000",
    cursor: "pointer",
  }),
};

// ─── Pricing model definitions ────────────────────────────────────────────────
const PRICING_MODELS = [
  {
    value: "daily_budget",
    label: "Daily Budget",
    icon: "bi-calendar2-day",
    badge: "CPC / CPM",
    badgeColor: "#185FA5",
    badgeBg: "#E6F1FB",
    description: "Pay per day the job is promoted",
    hint: "Employer sets a daily spend cap; you charge per click, impression, or application",
  },
  // {
  //   value: "per_apply",
  //   label: "Pay Per Apply",
  //   icon: "bi-hand-index-thumb",
  //   badge: "Performance",
  //   badgeColor: "#3B6D11",
  //   badgeBg: "#EAF3DE",
  //   description: "Charged per qualified applicant",
  //   hint: "Bill only when a candidate meets your qualification bar",
  // },
  {
    value: "job_slot",
    label: "Job Slot",
    icon: "bi-grid-1x2",
    badge: "Subscription",
    badgeColor: "#854F0B",
    badgeBg: "#FAEEDA",
    description: "Fixed slot — swap jobs freely",
    hint: "Employer buys N simultaneous live job slots on a monthly/annual cycle",
  },
  // {
  //   value: "duration_bundle",
  //   label: "Duration Bundle",
  //   icon: "bi-calendar-range",
  //   badge: "Bundle",
  //   badgeColor: "#185FA5",
  //   badgeBg: "#E6F1FB",
  //   description: "30 / 60 / 90 day posting packs",
  //   hint: "Buy X posts of a fixed duration; activate within validity window",
  // },
  {
    value: "cv_credits",
    label: "CV Credits",
    icon: "bi-person-vcard",
    badge: "Credits",
    badgeColor: "#3C3489",
    badgeBg: "#EEEDFE",
    description: "Buy credits to unlock candidates",
    hint: "Each credit unlocks one candidate profile; volume tiers apply",
  },
  {
    value: "featured_boost",
    label: "Featured Boost",
    icon: "bi-lightning-charge",
    badge: "Add-on",
    badgeColor: "#854F0B",
    badgeBg: "#FAEEDA",
    description: "One-time job spotlight upgrade",
    hint: "Purchasable on top of any base package; stored as separate add-on",
  },
];

const EMPTY_FORM = {
  // shared
  name: "",
  package_type: "",
  pricing_model: "",
  price: "",
  description: "",
  is_featured: false,

  // daily_budget
  daily_budget_cap: "",
  billing_model: "ppv",
  rate_per_unit: "",
  campaign_duration_days: "",
  min_daily_budget: "",
  sponsor_to_top: false,
  email_blast: false,

  // per_apply
  cost_per_apply: "",
  max_applies: "",
  budget_ceiling: "",
  qualification_filter: "any",

  // job_slot
  slot_count: "",
  billing_cycle: "monthly",
  price_per_slot: "",
  free_views_per_slot: "",
  extra_view_charge: "",
  swap_allowed: true,

  // duration_bundle
  duration_days: "30",
  custom_duration_days: "",
  num_posts: "",
  bundle_validity_days: "",
  include_views: false,
  include_featured_slot: false,
  include_analytics: false,

  // cv_credits
  credit_count: "",
  credit_expiry_days: "",
  unlock_scope: "full",
  tier2_credits: "",
  tier2_price: "",
  tier3_credits: "",
  tier3_price: "",

  // featured_boost
  boost_type: "top",
  boost_duration_days: "7",
  boost_compatible: ["job_slot", "duration_bundle", "per_apply", "daily_budget"],
};

class Packages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      highlightId: null,
      packages: [],
      showModal: false,
      editId: null,
      FormData: { ...EMPTY_FORM },
      selectedCurrency: null,
      errors: {},
      successMessage: "",
      errorMessage: "",
      deleteId: null,
      deleteStatus: null,
      showDeleteConfirm: false,
      currentPage: 1,
      totalPackages: 0,
      isActive: "all",
      statusDropdownOpen: false,
      packageTypeDropdownOpen: false,
      statusDropdownOpen: false,
      packageTypeDropdownOpen: false,
      billingModelDropdownOpen: false,
      qualificationFilterDropdownOpen: false,
      billingCycleDropdownOpen: false,
      unlockScopeDropdownOpen: false,
      boostTypeDropdownOpen: false,
      boostDurationDropdownOpen: false,
      durationDaysDropdownOpen: false,
    };
    this.itemsPerPage = 50;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    this.fetchPackages();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentPage !== this.state.currentPage ||
      prevState.isActive !== this.state.isActive
    ) {
      this.fetchPackages();
      this.resetSearch();
    }
  }

  // ─── Data fetching ─────────────────────────────────────────────────────────
  fetchPackages = async (
    page = this.state.currentPage,
    status = this.state.isActive,
  ) => {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}packages/getallpackages`,
        { params: { page, limit: this.itemsPerPage, status } },
      );
      this.setState(
        {
          packages: response.data.packages || [],
          totalPackages: response.data.total || 0,
        },
        () => {
          const lastHistoryType = sessionStorage.getItem("lastHistoryType");
          const lastHistoryId = sessionStorage.getItem("lastHistoryId");
          if (lastHistoryType === "package" && lastHistoryId) {
            this.setState({ highlightId: parseInt(lastHistoryId) });
            setTimeout(() => {
              this.setState({ highlightId: null });
              sessionStorage.removeItem("lastHistoryId");
              sessionStorage.removeItem("lastHistoryType");
            }, 3000);
          }
        },
      );
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  loadCurrencies = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15, status: "Active" },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  formatLimit = (value) => {
    if (value === null || value === undefined || value === "") return "Unlimited";
    return value;
  };

  getPricingModelMeta = (value) =>
    PRICING_MODELS.find((m) => m.value === value) || {};

  // ─── Excel export/import ───────────────────────────────────────────────────
  handleExcelExport = () => {
    const { packages } = this.state;
    if (!packages || !packages.length) {
      this.setState({ errorMessage: "No packages available to export" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }
    const dataToExport = packages.map((pkg) => ({
      Name: pkg.name,
      "Package Type": pkg.package_type,
      "Pricing Model": pkg.pricing_model,
      Price: pkg.price,
      Currency: pkg.currency,
      "Daily Budget Cap": pkg.daily_budget_cap ?? "",
      "Billing Model": pkg.billing_model ?? "",
      "Rate Per Unit": pkg.rate_per_unit ?? "",
      "Campaign Duration Days": pkg.campaign_duration_days ?? "",
      "Cost Per Apply": pkg.cost_per_apply ?? "",
      "Max Applies": pkg.max_applies ?? "Unlimited",
      "Slot Count": pkg.slot_count ?? "",
      "Billing Cycle": pkg.billing_cycle ?? "",
      "Price Per Slot": pkg.price_per_slot ?? "",
      "Duration Days": pkg.duration_days ?? "",
      "Num Posts": pkg.num_posts ?? "",
      "Credit Count": pkg.credit_count ?? "",
      "Unlock Scope": pkg.unlock_scope ?? "",
      "Boost Type": pkg.boost_type ?? "",
      "Boost Duration Days": pkg.boost_duration_days ?? "",
      "Is Featured": pkg.is_featured ? "Yes" : "No",
      Description: pkg.description || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");
    XLSX.writeFile(workbook, "Packages.xlsx");
    this.setState({ successMessage: "Packages exported successfully" });
    setTimeout(() => this.setState({ successMessage: "" }), 3000);
  };

  handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      this.setState({ errorMessage: "User not logged in" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const formatted = jsonData.map((row) => ({
          name: row["Name"],
          package_type: row["Package Type"],
          pricing_model: row["Pricing Model"],
          price: row["Price"],
          is_featured: row["Is Featured"] === "Yes" ? 1 : 0,
          description: row["Description"] || null,
        }));
        await api.post(`${this.apiBaseUrl}packages/`, { type: "csv", data: formatted });
        this.setState({ successMessage: "Packages imported successfully" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
        this.fetchPackages(1);
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to import Excel" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  // ─── Form handlers ─────────────────────────────────────────────────────────
  handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState((prevState) => ({
      FormData: {
        ...prevState.FormData,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "package_type" ? { pricing_model: "" } : {}),
      },
      errors: { ...prevState.errors, [name]: "" },
    }));
  };

  handleCurrencyChange = (selectedCurrency) => {
    this.setState({
      selectedCurrency,
      errors: { ...this.state.errors, currency: "" },
    });
  };

  handleSearch = async (e) => {
    const { name, value } = e.target;
    ["price", "pricing_model", "status", "created_at", "updated_at"].forEach((input) => {
      if (input !== name) {
        const ele = document.getElementById(input);
        if (ele) ele.value = "";
      }
    });
    this.setState({ currentPage: 1 });
    try {
      const res = await axios.get(`${this.apiBaseUrl}packages/getallpackages`, {
        params: { name, search: value, status: this.state.isActive, page: 1, limit: this.itemsPerPage },
      });
      this.setState({ packages: res.data.packages || [], totalPackages: res.data.total || 0 });
    } catch (error) {
      console.error("Error searching packages:", error);
    }
  };

  resetSearch = () => {
    ["price", "pricing_model", "status", "created_at", "updated_at"].forEach((id) => {
      const ele = document.getElementById(id);
      if (ele) ele.value = "";
    });
  };

  handlePageChange = (page) => this.setState({ currentPage: page });

  // ─── Validation ────────────────────────────────────────────────────────────
  validateForm = () => {
    const { FormData, selectedCurrency } = this.state;
    let errors = {};

    if (!FormData.package_type) errors.package_type = "Package type is required";
    if (!FormData.pricing_model) errors.pricing_model = "Pricing model is required";
    if (!selectedCurrency) errors.currency = "Currency is required";

    const pm = FormData.pricing_model;

    if (pm === "daily_budget") {
      if (!FormData.daily_budget_cap) errors.daily_budget_cap = "Daily budget cap is required";
      if (!FormData.rate_per_unit) errors.rate_per_unit = "Rate per unit is required";
    }

    if (pm === "per_apply") {
      if (!FormData.cost_per_apply) errors.cost_per_apply = "Cost per apply is required";
    }

    if (pm === "job_slot") {
      if (!FormData.slot_count) errors.slot_count = "Slot count is required";
      if (!FormData.price_per_slot) errors.price_per_slot = "Price per slot is required";
    }

    if (pm === "duration_bundle") {
      if (!FormData.price) errors.price = "Bundle price is required";
      if (FormData.duration_days === "custom" && !FormData.custom_duration_days)
        errors.custom_duration_days = "Custom duration is required";
      if (FormData.package_type === "Company" && !FormData.num_posts)
        errors.num_posts = "Number of posts is required";
    }

    if (pm === "cv_credits") {
      if (!FormData.credit_count) errors.credit_count = "Credit count is required";
      if (!FormData.price) errors.price = "Pack price is required";
    }

    if (pm === "featured_boost") {
      if (!FormData.price) errors.price = "Boost price is required";
    }

    // price required for all except job_slot (uses price_per_slot) and daily_budget (uses cap)
    if (!["job_slot", "daily_budget"].includes(pm) && !FormData.price) {
      if (!errors.price) errors.price = "Price is required";
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  // ─── Modal open/close ──────────────────────────────────────────────────────
  toggleForm = (item = null) => {
    if (item) {
      this.setState({
        showModal: true,
        editId: item.id,
        FormData: {
          ...EMPTY_FORM,
          name: item.name || "",
          package_type: item.package_type || "",
          pricing_model: item.pricing_model || "",
          price: item.price || "",
          description: item.description || "",
          is_featured: item.is_featured === 1,
          // daily_budget
          daily_budget_cap: item.daily_budget_cap ?? "",
          billing_model: item.billing_model || "ppv",
          rate_per_unit: item.rate_per_unit ?? "",
          campaign_duration_days: item.campaign_duration_days ?? "",
          min_daily_budget: item.min_daily_budget ?? "",
          // per_apply
          cost_per_apply: item.cost_per_apply ?? "",
          max_applies: item.max_applies ?? "",
          budget_ceiling: item.budget_ceiling ?? "",
          qualification_filter: item.qualification_filter || "any",
          // job_slot
          slot_count: item.slot_count ?? "",
          billing_cycle: item.billing_cycle || "monthly",
          price_per_slot: item.price_per_slot ?? "",
          free_views_per_slot: item.free_views_per_slot ?? "",
          extra_view_charge: item.extra_view_charge ?? "",
          swap_allowed: item.swap_allowed !== false,
          // duration_bundle
          duration_days: item.duration_days || "30",
          num_posts: item.num_posts ?? "",
          bundle_validity_days: item.bundle_validity_days ?? "",
          // cv_credits
          credit_count: item.credit_count ?? "",
          credit_expiry_days: item.credit_expiry_days ?? "",
          unlock_scope: item.unlock_scope || "full",
          tier2_credits: item.tier2_credits ?? "",
          tier2_price: item.tier2_price ?? "",
          tier3_credits: item.tier3_credits ?? "",
          tier3_price: item.tier3_price ?? "",
          // featured_boost
          boost_type: item.boost_type || "top",
          boost_duration_days: item.boost_duration_days || "7",
        },
        selectedCurrency: item.currency
          ? { label: item.currency, value: item.currency_id }
          : null,
        errors: {},
      });
    } else {
      this.setState({
        showModal: true,
        editId: null,
        FormData: { ...EMPTY_FORM },
        selectedCurrency: null,
        errors: {},
      });
    }
  };

  // ─── Build API payload ─────────────────────────────────────────────────────
  buildPayload = () => {
    const { FormData, selectedCurrency } = this.state;
    const pm = FormData.pricing_model;
    const base = {
      name: FormData.name,
      package_type: FormData.package_type,
      pricing_model: pm,
      currency_id: selectedCurrency?.value,
      description: FormData.description || null,
      is_featured: FormData.is_featured ? 1 : 0,
    };

    if (pm === "daily_budget") {
      return {
        ...base,
        price: null,
        daily_budget_cap: Number(FormData.daily_budget_cap),
        billing_model: FormData.billing_model,
        rate_per_unit: Number(FormData.rate_per_unit),
        campaign_duration_days: FormData.campaign_duration_days
          ? Number(FormData.campaign_duration_days)
          : null,
        min_daily_budget: FormData.min_daily_budget
          ? Number(FormData.min_daily_budget)
          : null,
        sponsor_to_top: FormData.sponsor_to_top ? 1 : 0,
        email_blast: FormData.email_blast ? 1 : 0,
      };
    }

    if (pm === "per_apply") {
      return {
        ...base,
        price: Number(FormData.cost_per_apply),
        cost_per_apply: Number(FormData.cost_per_apply),
        max_applies: FormData.max_applies ? Number(FormData.max_applies) : null,
        budget_ceiling: FormData.budget_ceiling ? Number(FormData.budget_ceiling) : null,
        qualification_filter: FormData.qualification_filter,
      };
    }

    if (pm === "job_slot") {
      return {
        ...base,
        price: Number(FormData.price_per_slot),
        slot_count: Number(FormData.slot_count),
        billing_cycle: FormData.billing_cycle,
        price_per_slot: Number(FormData.price_per_slot),
        free_views_per_slot: FormData.free_views_per_slot
          ? Number(FormData.free_views_per_slot)
          : null,
        extra_view_charge: FormData.extra_view_charge
          ? Number(FormData.extra_view_charge)
          : null,
        swap_allowed: FormData.swap_allowed ? 1 : 0,
      };
    }

    if (pm === "duration_bundle") {
      const days =
        FormData.duration_days === "custom"
          ? Number(FormData.custom_duration_days)
          : Number(FormData.duration_days);
      return {
        ...base,
        price: Number(FormData.price),
        duration_days: days,
        num_posts: Number(FormData.num_posts),
        bundle_validity_days: FormData.bundle_validity_days
          ? Number(FormData.bundle_validity_days)
          : null,
        include_views: FormData.include_views ? 1 : 0,
        include_featured_slot: FormData.include_featured_slot ? 1 : 0,
        include_analytics: FormData.include_analytics ? 1 : 0,
      };
    }

    if (pm === "cv_credits") {
      return {
        ...base,
        price: Number(FormData.price),
        credit_count: Number(FormData.credit_count),
        credit_expiry_days: FormData.credit_expiry_days
          ? Number(FormData.credit_expiry_days)
          : null,
        unlock_scope: FormData.unlock_scope,
        tier2_credits: FormData.tier2_credits ? Number(FormData.tier2_credits) : null,
        tier2_price: FormData.tier2_price ? Number(FormData.tier2_price) : null,
        tier3_credits: FormData.tier3_credits ? Number(FormData.tier3_credits) : null,
        tier3_price: FormData.tier3_price ? Number(FormData.tier3_price) : null,
      };
    }

    if (pm === "featured_boost") {
      return {
        ...base,
        price: Number(FormData.price),
        boost_type: FormData.boost_type,
        boost_duration_days: Number(FormData.boost_duration_days),
      };
    }

    return base;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  handleSubmit = async () => {
    if (!this.validateForm()) return;
    const { editId } = this.state;
    const payload = this.buildPayload();
    try {
      if (editId) {
        await api.put(`${this.apiBaseUrl}packages/${editId}`, payload);
      } else {
        await api.post(`${this.apiBaseUrl}packages/`, payload);
      }
      this.fetchPackages();
      this.setState({
        showModal: false,
        editId: null,
        FormData: { ...EMPTY_FORM },
        selectedCurrency: null,
        errors: {},
        successMessage: editId ? "Package updated successfully!" : "Package added successfully!",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      this.setState({ errorMessage: "Something went wrong" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  confirmDelete = (id, status) =>
    this.setState({ deleteId: id, deleteStatus: status, showDeleteConfirm: true });

  handleDelete = async () => {
    const { deleteId, deleteStatus } = this.state;
    try {
      await api.delete(`${this.apiBaseUrl}packages/deletepackage/${deleteId}`);
      this.setState(
        {
          showDeleteConfirm: false,
          successMessage:
            deleteStatus === "Active" ? "Inactivated successfully" : "Activated successfully",
        },
        this.fetchPackages,
      );
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (error) {
      this.setState({ showDeleteConfirm: false, errorMessage: "Failed to update status" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  cancelDelete = () => this.setState({ showDeleteConfirm: false, deleteId: null });

  // ─── Render helpers ────────────────────────────────────────────────────────
  renderModelBadge = (pricingModel) => {
    const meta = this.getPricingModelMeta(pricingModel);
    if (!meta.label) return <span className="text-muted">—</span>;
    return (
      <span
        className="badge"
        style={{
          background: meta.badgeBg,
          color: meta.badgeColor,
          border: `1px solid ${meta.badgeColor}33`,
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        <i className={`bi ${meta.icon} me-1`} style={{ fontSize: "0.7rem" }} />
        {meta.label}
      </span>
    );
  };

  renderPriceCell = (item) => {
    const pm = item.pricing_model;
    const cur = item.currency || "";
    if (pm === "daily_budget")
      return `${item.daily_budget_cap ?? "—"} ${cur}/day`;
    if (pm === "job_slot")
      return `${item.price_per_slot ?? item.price ?? "—"} ${cur}/${item.billing_cycle || "mo"}`;
    return `${item.price ?? "—"} ${cur}`;
  };

  renderCustomSelect = (name, value, options, dropdownKey) => {
    const isOpen = this.state[dropdownKey];
    const selectedLabel =
      options.find((o) => String(o.value) === String(value))?.label ||
      options[0]?.label;

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="form-select text-start custom-dropdown-btn"
          style={{ cursor: "pointer" }}
          onClick={() =>
            this.setState((prev) => ({ [dropdownKey]: !prev[dropdownKey] }))
          }
        >
          {selectedLabel}
        </button>

        {isOpen && (
          <div
            className="shadow-sm"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              marginTop: "2px",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  this.handleInputChange({
                    target: { name, value: opt.value, type: "text" },
                  });
                  this.setState({ [dropdownKey]: false });
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor:
                    String(value) === String(opt.value) ? "#36565F" : "#fff",
                  color: String(value) === String(opt.value) ? "#fff" : "#000",
                }}
                onMouseEnter={(e) => {
                  if (String(value) !== String(opt.value))
                    e.currentTarget.style.backgroundColor = "#e8eef0";
                }}
                onMouseLeave={(e) => {
                  if (String(value) !== String(opt.value))
                    e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  renderModelSummaryCell = (item) => {
    const pm = item.pricing_model;
    if (pm === "daily_budget")
      return `${item.billing_model?.toUpperCase() || "PPV"} · Rate: ${item.rate_per_unit ?? "—"}`;
    if (pm === "per_apply")
      return `Cap: ${item.max_applies ?? "Unlimited"} applies`;
    if (pm === "job_slot")
      return `${item.slot_count ?? "—"} slots · ${item.billing_cycle || "monthly"}`;
    if (pm === "duration_bundle")
      return `${item.num_posts ?? "—"} posts · ${item.duration_days ?? "—"} days`;
    if (pm === "cv_credits")
      return `${item.credit_count ?? "—"} credits · ${item.unlock_scope || "full"}`;
    if (pm === "featured_boost")
      return `${item.boost_type || "top"} · ${item.boost_duration_days ?? "—"} days`;
    return "—";
  };

  // ─── Model-specific form sections ──────────────────────────────────────────
  renderDailyBudgetFields = () => {
    const { FormData, errors } = this.state;
    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-calendar2-day me-2" />Campaign settings
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Daily budget cap <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="daily_budget_cap"
                value={FormData.daily_budget_cap}
                onChange={this.handleInputChange}
                className={`form-control ${errors.daily_budget_cap ? "is-invalid" : ""}`}
                placeholder="e.g. 500"
              />
              {errors.daily_budget_cap && (
                <div className="text-danger small mt-1">{errors.daily_budget_cap}</div>
              )}
              <small className="text-muted">Max spend per calendar day</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Min. daily budget</label>
              <input
                type="number"
                name="min_daily_budget"
                value={FormData.min_daily_budget}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 100"
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Billing model <span className="text-danger">*</span>
              </label>
              {this.renderCustomSelect(
                "billing_model",
                FormData.billing_model,
                [
                  { value: "ppv", label: "PPV — Per Profile View" },
                  { value: "pps", label: "PPS — Per Shortlist" },
                ],
                "billingModelDropdownOpen"
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Rate per unit <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="rate_per_unit"
                value={FormData.rate_per_unit}
                onChange={this.handleInputChange}
                className={`form-control ${errors.rate_per_unit ? "is-invalid" : ""}`}
                placeholder="e.g. 15"
              />
              {errors.rate_per_unit && (
                <div className="text-danger small mt-1">{errors.rate_per_unit}</div>
              )}
              <small className="text-muted">Cost per click / 1k impressions / apply</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Campaign duration (days)</label>
              <input
                type="number"
                name="campaign_duration_days"
                value={FormData.campaign_duration_days}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="Leave blank = open-ended"
              />
            </div>
          </Col>
        </Row>
        <div className="model-form-divider">
          <i className="bi bi-rocket-takeoff me-2" />Boost add-ons
        </div>
        <div className="form-check mb-2">
          <input
            type="checkbox"
            name="sponsor_to_top"
            id="sponsor_to_top"
            checked={FormData.sponsor_to_top}
            onChange={this.handleInputChange}
            className="form-check-input"
          />
          <label htmlFor="sponsor_to_top" className="form-check-label">
            Sponsored to top of results <span className="text-muted">(+20% surcharge)</span>
          </label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            name="email_blast"
            id="email_blast"
            checked={FormData.email_blast}
            onChange={this.handleInputChange}
            className="form-check-input"
          />
          <label htmlFor="email_blast" className="form-check-label">
            Candidate email blast <span className="text-muted">(one-time add-on)</span>
          </label>
        </div>
      </>
    );
  };

  renderPerApplyFields = () => {
    const { FormData, errors } = this.state;
    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-hand-index-thumb me-2" />Application pricing
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Cost per qualified apply <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="cost_per_apply"
                value={FormData.cost_per_apply}
                onChange={this.handleInputChange}
                className={`form-control ${errors.cost_per_apply ? "is-invalid" : ""}`}
                placeholder="e.g. 250"
              />
              {errors.cost_per_apply && (
                <div className="text-danger small mt-1">{errors.cost_per_apply}</div>
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Max applications cap</label>
              <input
                type="number"
                name="max_applies"
                value={FormData.max_applies}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="Leave blank = unlimited"
              />
              <small className="text-muted">Stop charging after N applies</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Total budget ceiling</label>
              <input
                type="number"
                name="budget_ceiling"
                value={FormData.budget_ceiling}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 10,000"
              />
              <small className="text-muted">Total spend limit for this job</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Qualification filter</label>
              {this.renderCustomSelect(
                "qualification_filter",
                FormData.qualification_filter,
                [
                  { value: "any", label: "Any application received" },
                  { value: "screened", label: "Passed screening questions" },
                  { value: "viewed", label: "Employer opened profile" },
                ],
                "qualificationFilterDropdownOpen"
              )}
              <small className="text-muted">Only charge when applicant meets this bar</small>
            </div>
          </Col>
        </Row>
      </>
    );
  };

  renderJobSlotFields = () => {
    const { FormData, errors } = this.state;
    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-grid-1x2 me-2" />Slot subscription settings
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Number of slots <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="slot_count"
                value={FormData.slot_count}
                onChange={this.handleInputChange}
                className={`form-control ${errors.slot_count ? "is-invalid" : ""}`}
                placeholder="e.g. 5"
                min="1"
              />
              {errors.slot_count && (
                <div className="text-danger small mt-1">{errors.slot_count}</div>
              )}
              <small className="text-muted">Simultaneous live jobs employer can run</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Billing cycle</label>
              {this.renderCustomSelect(
                "billing_cycle",
                FormData.billing_cycle,
                [
                  { value: "monthly", label: "Monthly" },
                  { value: "quarterly", label: "Quarterly" },
                  { value: "annual", label: "Annual" },
                ],
                "billingCycleDropdownOpen"
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Price per slot / cycle <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="price_per_slot"
                value={FormData.price_per_slot}
                onChange={this.handleInputChange}
                className={`form-control ${errors.price_per_slot ? "is-invalid" : ""}`}
                placeholder="e.g. 8,000"
              />
              {errors.price_per_slot && (
                <div className="text-danger small mt-1">{errors.price_per_slot}</div>
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Free CV views per slot / month</label>
              <input
                type="number"
                name="free_views_per_slot"
                value={FormData.free_views_per_slot}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 20 (0 = none)"
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Extra view charge</label>
              <input
                type="number"
                name="extra_view_charge"
                value={FormData.extra_view_charge}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 50 per extra view"
              />
            </div>
          </Col>
        </Row>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            name="swap_allowed"
            id="swap_allowed"
            checked={FormData.swap_allowed}
            onChange={this.handleInputChange}
            className="form-check-input"
          />
          <label htmlFor="swap_allowed" className="form-check-label">
            Allow job swapping within active slots
          </label>
        </div>
      </>
    );
  };

  renderDurationBundleFields = () => {
    const { FormData, errors } = this.state;
    const isCandidate = FormData.package_type === "Candidate";

    // ── Candidate ke liye simple boost duration fields ──
    if (isCandidate) {
      return (
        <>
          <div className="model-form-divider">
            <i className="bi bi-calendar-range me-2" />Boost duration
          </div>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Boost duration <span className="text-danger">*</span>
                </label>
                {this.renderCustomSelect(
                  "duration_days",
                  FormData.duration_days,
                  [
                    { value: "7", label: "7 days" },
                    { value: "14", label: "14 days" },
                    { value: "30", label: "30 days" },
                    { value: "60", label: "60 days" },
                    { value: "90", label: "90 days" },
                    { value: "custom", label: "Custom…" },
                  ],
                  "durationDaysDropdownOpen"
                )}
                <small className="text-muted">Your profile will remain featured for the selected number of days</small>
              </div>
            </Col>

            {FormData.duration_days === "custom" && (
              <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Custom days <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="custom_duration_days"
                    value={FormData.custom_duration_days}
                    onChange={this.handleInputChange}
                    className={`form-control ${errors.custom_duration_days ? "is-invalid" : ""}`}
                    placeholder="e.g. 45"
                  />
                  {errors.custom_duration_days && (
                    <div className="text-danger small mt-1">{errors.custom_duration_days}</div>
                  )}
                </div>
              </Col>
            )}
          </Row>

          <div className="alert alert-info" style={{ fontSize: "0.85rem" }}>
            <i className="bi bi-info-circle me-2" />
            The candidate's profile will be featured in search results for{" "}
            <strong>
              {FormData.duration_days === "custom"
                ? FormData.custom_duration_days || "?"
                : FormData.duration_days}{" "}
              days
            </strong>.
          </div>
        </>
      );
    }
    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-calendar-range me-2" />Bundle configuration
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Posting duration <span className="text-danger">*</span>
              </label>
              {this.renderCustomSelect(
                "duration_days",
                FormData.duration_days,
                [
                  { value: "30", label: "30 days" },
                  { value: "60", label: "60 days" },
                  { value: "90", label: "90 days" },
                  { value: "custom", label: "Custom…" },
                ],
                "durationDaysDropdownOpen"
              )}
            </div>
          </Col>
          {FormData.duration_days === "custom" && (
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Custom days <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="custom_duration_days"
                  value={FormData.custom_duration_days}
                  onChange={this.handleInputChange}
                  className={`form-control ${errors.custom_duration_days ? "is-invalid" : ""}`}
                  placeholder="e.g. 45"
                />
                {errors.custom_duration_days && (
                  <div className="text-danger small mt-1">{errors.custom_duration_days}</div>
                )}
              </div>
            </Col>
          )}
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Number of job posts <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="num_posts"
                value={FormData.num_posts}
                onChange={this.handleInputChange}
                className={`form-control ${errors.num_posts ? "is-invalid" : ""}`}
                placeholder="e.g. 3"
              />
              {errors.num_posts && (
                <div className="text-danger small mt-1">{errors.num_posts}</div>
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Bundle validity (days)</label>
              <input
                type="number"
                name="bundle_validity_days"
                value={FormData.bundle_validity_days}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 90"
              />
              <small className="text-muted">After purchase, posts must be activated within this window</small>
            </div>
          </Col>
        </Row>
        <div className="model-form-divider">
          <i className="bi bi-gift me-2" />Inclusions
        </div>
        <div className="form-check mb-2">
          <input type="checkbox" name="include_views" id="include_views"
            checked={FormData.include_views} onChange={this.handleInputChange}
            className="form-check-input" />
          <label htmlFor="include_views" className="form-check-label">Include free candidate views</label>
        </div>
        <div className="form-check mb-2">
          <input type="checkbox" name="include_featured_slot" id="include_featured_slot"
            checked={FormData.include_featured_slot} onChange={this.handleInputChange}
            className="form-check-input" />
          <label htmlFor="include_featured_slot" className="form-check-label">1 featured slot included</label>
        </div>
        <div className="form-check mb-3">
          <input type="checkbox" name="include_analytics" id="include_analytics"
            checked={FormData.include_analytics} onChange={this.handleInputChange}
            className="form-check-input" />
          <label htmlFor="include_analytics" className="form-check-label">Analytics dashboard access</label>
        </div>
      </>
    );
  };

  renderCvCreditsFields = () => {
    const { FormData, errors } = this.state;
    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-person-vcard me-2" />Credit pack
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Credits in pack <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="credit_count"
                value={FormData.credit_count}
                onChange={this.handleInputChange}
                className={`form-control ${errors.credit_count ? "is-invalid" : ""}`}
                placeholder="e.g. 50"
              />
              {errors.credit_count && (
                <div className="text-danger small mt-1">{errors.credit_count}</div>
              )}
              <small className="text-muted">Each credit = 1 candidate profile unlock</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Credit expiry (days)</label>
              <input
                type="number"
                name="credit_expiry_days"
                value={FormData.credit_expiry_days}
                onChange={this.handleInputChange}
                className="form-control"
                placeholder="e.g. 180 (0 = never)"
              />
            </div>
          </Col>
          <Col md={12}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Unlock scope</label>
              {this.renderCustomSelect(
                "unlock_scope",
                FormData.unlock_scope,
                [
                  { value: "basic", label: "Basic info only (name, title)" },
                  { value: "contact", label: "Contact details" },
                  { value: "full", label: "Full CV + contact" },
                ],
                "unlockScopeDropdownOpen"
              )}
            </div>
          </Col>
        </Row>
        <div className="model-form-divider">
          <i className="bi bi-layers me-2" />Volume tiers (optional)
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Tier 2 — credits</label>
              <input type="number" name="tier2_credits" value={FormData.tier2_credits}
                onChange={this.handleInputChange} className="form-control" placeholder="e.g. 200" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Tier 2 — price</label>
              <input type="number" name="tier2_price" value={FormData.tier2_price}
                onChange={this.handleInputChange} className="form-control" placeholder="e.g. 17,000" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Tier 3 — credits</label>
              <input type="number" name="tier3_credits" value={FormData.tier3_credits}
                onChange={this.handleInputChange} className="form-control" placeholder="e.g. 500" />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Tier 3 — price</label>
              <input type="number" name="tier3_price" value={FormData.tier3_price}
                onChange={this.handleInputChange} className="form-control" placeholder="e.g. 37,500" />
            </div>
          </Col>
        </Row>
      </>
    );
  };

  renderFeaturedBoostFields = () => {
    const { FormData } = this.state;
    const isCandidate = FormData.package_type === "Candidate";

    return (
      <>
        <div className="model-form-divider">
          <i className="bi bi-lightning-charge me-2" />Boost configuration
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Boost type</label>
              {this.renderCustomSelect(
                "boost_type",
                FormData.boost_type,
                isCandidate
                  ? [
                    { value: "profile_top", label: "Top of search results" },
                    { value: "highlighted_profile", label: "Highlighted profile" },
                    { value: "recruiter_spotlight", label: "Recruiter spotlight" },
                  ]
                  : [
                    { value: "top", label: "Top of search results" },
                    { value: "highlighted", label: "Highlighted listing" },
                    { value: "homepage", label: "Homepage spotlight" },
                    { value: "email", label: "Candidate email blast" },
                  ],
                "boostTypeDropdownOpen"
              )}
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Boost duration</label>
              {this.renderCustomSelect(
                "boost_duration_days",
                FormData.boost_duration_days,
                [
                  { value: "1", label: "1 day" },
                  { value: "3", label: "3 days" },
                  { value: "7", label: "7 days" },
                  { value: "14", label: "14 days" },
                  { value: "30", label: "30 days" },
                ],
                "boostDurationDropdownOpen"
              )}
            </div>
          </Col>
        </Row>
        <div className="alert alert-info" style={{ fontSize: "0.85rem" }}>
          <i className="bi bi-info-circle me-2" />
          Featured Boost is an <strong>add-on</strong>. It gets linked to a base package
          at checkout — store it in a separate <code>package_addons</code> table and
          reference it via <code>base_package_id</code>.
        </div>
      </>
    );
  };

  getFilteredModels = () => {
    const { FormData } = this.state;
    if (FormData.package_type === "Candidate") {
      return PRICING_MODELS
        .filter(m => m.value === "featured_boost")
        .map(m => ({
          ...m,
          label: "Profile Spotlight",
          description: "Boost profile visibility",
          hint: "Get noticed by recruiters — appear at the top of search results",
        }));
    }
    return PRICING_MODELS;
  };

  renderModelFields = () => {
    const { FormData } = this.state;
    switch (FormData.pricing_model) {
      case "daily_budget": return this.renderDailyBudgetFields();
      case "per_apply": return this.renderPerApplyFields();
      case "job_slot": return this.renderJobSlotFields();
      case "duration_bundle": return this.renderDurationBundleFields();
      case "cv_credits": return this.renderCvCreditsFields();
      case "featured_boost": return this.renderFeaturedBoostFields();
      default: return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  render() {
    const {
      packages, showModal, showDeleteConfirm, currentPage, totalPackages,
      deleteStatus, isActive, editId, successMessage, errorMessage,
      errors, selectedCurrency, FormData,
    } = this.state;
    const totalPages = Math.ceil(totalPackages / this.itemsPerPage);
    const selectedModelMeta = this.getPricingModelMeta(FormData.pricing_model);

    const highlightStyle = `
    .highlight-row td {
        background-color: #fff3cd !important;
        transition: background-color 0.5s ease;
    }

    /* Teal theme - override Bootstrap default blue focus */
    .form-select:focus,
    .form-control:focus {
        border-color: #36565F !important;
        box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
    }

    .custom-dropdown-btn { outline: none !important; }
.custom-dropdown-btn:focus {
  outline: none !important;
  border-color: #36565F !important;
  box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
}
`;

    return (
      <React.Fragment>
        <style>{`
          .highlight-row td { background-color: #fff3cd !important; transition: background-color 0.5s ease; }
          .model-selector-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.25rem; }
          @media (max-width: 576px) { .model-selector-grid { grid-template-columns: repeat(2, 1fr); } }
          .model-selector-card { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all .18s; background: #fff; }
          .model-selector-card:hover { border-color: #94a3b8; background: #f8fafc; }
          .model-selector-card.selected { border-color: #36565F; background: #E7EEEF; }
          .model-selector-card .mc-icon { font-size: 1.3rem; margin-bottom: 4px; }
          .model-selector-card .mc-title { font-size: 0.82rem; font-weight: 600; color: #1e293b; margin-bottom: 1px; }
          .model-selector-card .mc-desc { font-size: 0.72rem; color: #64748b; line-height: 1.3; }
          .model-selector-card .mc-badge { display: inline-block; font-size: 0.65rem; padding: 1px 7px; border-radius: 20px; margin-top: 4px; font-weight: 500; }
          .model-form-divider { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 0 10px; margin-top: 4px; display: flex; align-items: center; border-top: 1px solid #f1f5f9; }
          .model-form-divider:first-child { border-top: none; }
          .selected-model-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; margin-bottom: 1rem; }
        `}</style>

        <Helmet><title>Packages | List</title></Helmet>
        <h6 className="fw-bold mb-3">Packages List</h6>

        <div className="poppins-font">
          <Container fluid>

            {/* Top bar */}
            <div className="institute-header-section d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="filter-label text-dark">Filter by Status:</span>

                <div style={{ position: "relative", maxWidth: "200px", width: "100%" }}>
                  <button
                    type="button"
                    className="form-select rounded-square p-2 text-start"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.setState((prev) => ({
                        statusDropdownOpen: !prev.statusDropdownOpen,
                      }))
                    }
                  >
                    {isActive === "all" ? "All" : isActive}
                  </button>

                  {this.state.statusDropdownOpen && (
                    <div
                      className="shadow-sm"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        marginTop: "2px",
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { label: "All", value: "all" },
                        { label: "Active", value: "Active" },
                        { label: "Inactive", value: "Inactive" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() =>
                            this.setState({ isActive: opt.value, statusDropdownOpen: false })
                          }
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            backgroundColor: isActive === opt.value ? "#36565F" : "#fff",
                            color: isActive === opt.value ? "#fff" : "#000",
                          }}
                          onMouseEnter={(e) => {
                            if (isActive !== opt.value)
                              e.currentTarget.style.backgroundColor = "#e8eef0";
                          }}
                          onMouseLeave={(e) => {
                            if (isActive !== opt.value)
                              e.currentTarget.style.backgroundColor = "#fff";
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex align-items-end gap-2 flex-wrap">
                <Button variant="dark" onClick={() => this.toggleForm()}>
                  <i className="bi bi-plus-lg me-1" />Add Package
                </Button>
                
              </div>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
                <i className="bi bi-check-circle-fill text-success" />
                <span>{successMessage}</span>
                <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
              </div>
            )}
            {errorMessage && (
              <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
                <i className="bi bi-x-circle-fill" />
                <span>{errorMessage}</span>
                <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
              </div>
            )}

            {/* Table */}
            <Card>
              <CardBody>
                <div className="table-responsive">
                  <Table className="align-middle default-table manage-job-table p-2 w-100 table table-striped custom-table">
                    <thead className="align-middle">
                      <tr>
                        {[
                          { label: "Name", id: "name", type: "text" },
                          { label: "Type", id: "package_type", type: "text" },
                        ].map(({ label, id, type }) => (
                          <th key={id} className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                            <div className="d-flex flex-column align-items-center gap-1">
                              <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>{label}</small>
                              <input
                                type={type} name={id} id={id}
                                className="form-control rounded-4 text-center"
                                placeholder="Search"
                                onChange={this.handleSearch}
                                style={{ maxWidth: "130px", borderColor: "#ccc" }}
                              />
                            </div>
                          </th>
                        ))}
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Pricing Model</small>
                        </th>
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Price / Rate</small>
                        </th>
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Details</small>
                        </th>
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Featured</small>
                        </th>
                        {[
                          { label: "Created", id: "created_at" },
                          { label: "Updated", id: "updated_at" },
                        ].map(({ label, id }) => (
                          <th key={id} className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                            <div className="d-flex flex-column align-items-center gap-1">
                              <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>{label}</small>
                              <input
                                type="date" name={id} id={id}
                                className="form-control rounded-4 text-center"
                                onChange={this.handleSearch}
                                style={{ borderColor: "#ccc" }}
                              />
                            </div>
                          </th>
                        ))}
                        <th className="text-center" style={{ borderBottom: "1px solid #ccc" }}>
                          <div className="d-flex flex-column align-items-center gap-1">
                            <small className="text-dark fw-bold" style={{ fontSize: "1rem" }}>Status</small>
                            <input
                              type="text" name="status" id="status"
                              className="form-control rounded-4 text-center"
                              onChange={this.handleSearch}
                              style={{ borderColor: "#ccc" }}
                            />
                          </div>
                        </th>
                        <th className="text-center text-dark fw-bold" style={{ fontSize: "1rem", borderBottom: "1px solid #ccc" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((item) => (
                        <tr
                          key={item.id}
                          className={this.state.highlightId === item.id ? "highlight-row" : ""}
                        >
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">
                            <span
                              className={`badge text-white ${item.package_type !== "Company" ? "bg-success" : ""}`}
                              style={item.package_type === "Company" ? { backgroundColor: "#4f7e8b" } : {}}
                            >
                              {item.package_type}
                            </span>
                          </td>
                          <td className="text-center">{this.renderModelBadge(item.pricing_model)}</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border fw-semibold">
                              {this.renderPriceCell(item)}
                            </span>
                          </td>
                          <td className="text-center">
                            <small className="text-muted">{this.renderModelSummaryCell(item)}</small>
                          </td>
                          <td className="text-center">
                            {item.is_featured ? (
                              <span className="badge" style={{ background: "#4f7e8b", color: "#fff" }}>Yes</span>
                            ) : (
                              <span className="badge bg-light text-muted border">No</span>
                            )}
                          </td>
                          <td className="text-center">{this.formatDate(item.created_at)}</td>
                          <td className="text-center">{this.formatDate(item.updated_at)}</td>
                          <td className="text-center">
                            <span className={`badge ${item.status === "Active" ? "badge-active-custom" : "badge-inactive-custom"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="status text-center">
                            <div className="d-flex justify-content-center align-items-center gap-3">
                              <button onClick={() => this.toggleForm(item)} className="icon-btn" title="Update">
                                <i className="bi bi-pencil-square" style={{ color: "#36565F" }} />
                              </button>
                              <button onClick={() => this.confirmDelete(item.id, item.status)} className="icon-btn"
                                title={item.status === "Active" ? "Inactivate" : "Activate"}>
                                {item.status === "Active"
                                  ? <i className="bi bi-x-circle text-danger" />
                                  : <i className="bi bi-check-circle text-success" />}
                              </button>
                              <button className="icon-btn" title="View History"
                                onClick={() => this.props.router.push(`/history/package/${item.id}`)}>
                                <i className="bi bi-clock-history text-dark" />
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

          {/* ── Add / Edit Modal ── */}
          <Modal show={showModal} onHide={() => this.setState({ showModal: false })} centered size="lg">
            <Modal.Header closeButton style={{ background: "#f8fafc" }}>
              <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                {editId ? "Edit Package" : "Add New Package"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: "2rem" }}>
              <Row>
                {/* Step 1 — Package type */}
                <Col md={12}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Package type <span className="text-danger">*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        className={`form-select text-start ${errors.package_type ? "is-invalid" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          this.setState((prev) => ({
                            packageTypeDropdownOpen: !prev.packageTypeDropdownOpen,
                          }))
                        }
                      >
                        {FormData.package_type === "Company"
                          ? "Company — for posting jobs"
                          : FormData.package_type === "Candidate"
                            ? "Candidate — for boosting profile"
                            : "Select type first"}
                      </button>

                      {this.state.packageTypeDropdownOpen && (
                        <div
                          className="shadow-sm"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            marginTop: "2px",
                            overflow: "hidden",
                          }}
                        >
                          {[
                            { label: "Company — for posting jobs", value: "Company" },
                            { label: "Candidate — for boosting profile", value: "Candidate" },
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              onClick={() => {
                                this.setState((prev) => ({
                                  FormData: { ...prev.FormData, package_type: opt.value, pricing_model: "" },
                                  errors: { ...prev.errors, package_type: "" },
                                  packageTypeDropdownOpen: false,
                                }));
                              }}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                backgroundColor:
                                  FormData.package_type === opt.value ? "#36565F" : "#fff",
                                color: FormData.package_type === opt.value ? "#fff" : "#000",
                              }}
                              onMouseEnter={(e) => {
                                if (FormData.package_type !== opt.value)
                                  e.currentTarget.style.backgroundColor = "#e8eef0";
                              }}
                              onMouseLeave={(e) => {
                                if (FormData.package_type !== opt.value)
                                  e.currentTarget.style.backgroundColor = "#fff";
                              }}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.package_type && (
                      <div className="text-danger small mt-1">{errors.package_type}</div>
                    )}
                  </div>
                </Col>

                {FormData.package_type && (
                  <>
                    {/* Step 2 — Pricing model selector */}
                    <Col md={12}>
                      <label className="form-label fw-semibold">
                        Pricing model <span className="text-danger">*</span>
                      </label>
                      {errors.pricing_model && (
                        <div className="text-danger small mb-1">{errors.pricing_model}</div>
                      )}
                      <div className="model-selector-grid">
                        {this.getFilteredModels().map((m) => (
                          <div
                            key={m.value}
                            className={`model-selector-card${FormData.pricing_model === m.value ? " selected" : ""}`}
                            onClick={() =>
                              this.setState((prev) => ({
                                FormData: { ...prev.FormData, pricing_model: m.value },
                                errors: { ...prev.errors, pricing_model: "" },
                              }))
                            }
                          >
                            <div className="mc-icon">
                              <i className={`bi ${m.icon}`} />
                            </div>
                            <div className="mc-title">{m.label}</div>
                            <div className="mc-desc">{m.description}</div>
                            <span
                              className="mc-badge"
                              style={{ background: m.badgeBg, color: m.badgeColor }}
                            >
                              {m.badge}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Col>

                    {/* Hint for selected model */}
                    {selectedModelMeta.hint && (
                      <Col md={12}>
                        <div
                          className="selected-model-chip mb-3"
                          style={{
                            background: selectedModelMeta.badgeBg,
                            color: selectedModelMeta.badgeColor,
                          }}
                        >
                          <i className={`bi ${selectedModelMeta.icon}`} />
                          {selectedModelMeta.hint}
                        </div>
                      </Col>
                    )}

                    {/* Common — Name */}
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={FormData.name}
                          className={`form-control ${errors.name ? "is-invalid" : ""}`}
                          onChange={this.handleInputChange}
                          placeholder="e.g. Basic, Standard, Premium"
                        />
                      </div>
                    </Col>

                    {/* Common — Currency */}
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Currency <span className="text-danger">*</span>
                        </label>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          loadOptions={this.loadCurrencies}
                          value={selectedCurrency}
                          onChange={this.handleCurrencyChange}
                          placeholder="Select Currency"
                          classNamePrefix="react-select"
                          styles={tealSelectStyles}
                        />
                        {errors.currency && (
                          <div className="text-danger small mt-1">{errors.currency}</div>
                        )}
                      </div>
                    </Col>

                    {/* Price (shown for models that need a flat price) */}
                    {["duration_bundle", "cv_credits", "featured_boost", "per_apply"].includes(FormData.pricing_model) && (
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            {FormData.pricing_model === "duration_bundle" ? "Bundle price" :
                              FormData.pricing_model === "cv_credits" ? "Pack price" :
                                FormData.pricing_model === "featured_boost" ? "Boost price" :
                                  "Price"}{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={FormData.price}
                            className={`form-control ${errors.price ? "is-invalid" : ""}`}
                            onChange={this.handleInputChange}
                            placeholder="e.g. 5,000"
                          />
                          {errors.price && (
                            <div className="text-danger small mt-1">{errors.price}</div>
                          )}
                        </div>
                      </Col>
                    )}

                    {/* Model-specific fields */}
                    <Col md={12}>{this.renderModelFields()}</Col>

                    {/* Description */}
                    <Col md={12}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Description <span className="text-muted">(Optional)</span>
                        </label>
                        <textarea
                          name="description"
                          value={FormData.description}
                          onChange={this.handleInputChange}
                          className="form-control"
                          rows="3"
                          placeholder={"Enter one feature per line:\nHighlighted in search results\nEmail alerts to candidates"}
                        />
                        <small className="text-muted">Each line becomes a bullet point on the pricing card</small>
                      </div>
                    </Col>

                    {/* Featured */}
                    <Col md={12}>
                      <div
                        className="mb-3 d-flex align-items-center gap-3 p-3 rounded"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                      >
                        <input
                          type="checkbox"
                          name="is_featured"
                          id="is_featured"
                          checked={FormData.is_featured}
                          onChange={this.handleInputChange}
                          className="form-check-input"
                          style={{ width: 20, height: 20 }}
                        />
                        <div>
                          <label htmlFor="is_featured" className="form-label fw-semibold mb-0" style={{ cursor: "pointer" }}>
                            Mark as "Most Popular"
                          </label>
                          <p className="text-muted small mb-0">
                            This plan will be highlighted with a blue border and "Most popular" badge on the pricing page
                          </p>
                        </div>
                      </div>
                    </Col>
                  </>
                )}
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => this.setState({ showModal: false })}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={this.handleSubmit}
                  disabled={!FormData.package_type || !FormData.pricing_model}
                >
                  {editId ? "Update Package" : "Save Package"}
                </Button>
              </div>
            </Modal.Body>
          </Modal>

          {/* Delete / Status Confirmation */}
          <Modal show={showDeleteConfirm} onHide={this.cancelDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "1rem", fontWeight: 600 }}>
                Confirm {deleteStatus === "Active" ? "Inactivate" : "Activate"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-3">
              <p style={{ marginBottom: 0 }}>
                Are you sure you want to{" "}
                <strong>{deleteStatus === "Active" ? "inactivate" : "activate"}</strong> this package?
              </p>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={this.cancelDelete}>Cancel</Button>
              <Button
                variant={deleteStatus === "Active" ? "danger" : "success"}
                onClick={this.handleDelete}
              >
                {deleteStatus === "Active" ? "Inactivate" : "Activate"}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Packages);