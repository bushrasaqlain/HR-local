import React, { Component } from "react";
import { Container } from "reactstrap";
import api from "../../../lib/api";
import KpiStrip from "./KpiStrip";
import RevenueChart from "./RevenueChart";
import CompanyTable from "./CompanyTable";
import PaymentMethods from "./PaymentMethods";
import ModelBreakdown from "./ModelBreakdown";
import CompanyDetailModal from "./CompanyDetailModal";
import Head from "next/head";

class AdminRevenuePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      summary:       null,
      trend:         [],
      byModel:       [],
      byMethod:      [],
      alerts:        [],
      loading:       true,

      // table state
      companies:     [],
      page:          1,
      limit:         15,
      total:         0,
      total_pages:   0,
      search:        "",
      pricing_model: "",
      status:        "",
      sort:          "paid_at",
      order:         "DESC",
      tableLoading:  false,

      // drill-down
      selectedCompany:  null,
      showCompanyModal: false,
    };
  }

  fetchOverview = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/revenue/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data.data;
      this.setState({
        summary:  d.summary,
        trend:    d.trend,
        byModel:  d.by_model,
        byMethod: d.by_payment_method,
        alerts:   d.alerts.items,
        loading:  false,
      });
    } catch (err) {
      console.error("Revenue overview fetch failed", err);
      this.setState({ loading: false });
    }
  };

  fetchCompanies = async () => {
    const { page, limit, search, pricing_model, status, sort, order } = this.state;
    this.setState({ tableLoading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/revenue/companies", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search, pricing_model, status, sort, order },
      });
      this.setState({
        companies:    res.data.data,
        total:        res.data.total,
        total_pages:  res.data.total_pages,
        tableLoading: false,
      });
    } catch (err) {
      console.error("Companies fetch failed", err);
      this.setState({ tableLoading: false });
    }
  };

  fetchCompanyDetail = async (accountId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/revenue/company/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.setState({ selectedCompany: res.data.data, showCompanyModal: true });
    } catch (err) {
      console.error("Company detail fetch failed", err);
    }
  };

  componentDidMount() {
    this.fetchOverview();
    this.fetchCompanies();
  }

  componentDidUpdate(_, prevState) {
    const keys = ["page", "search", "pricing_model", "status", "sort", "order"];
    const changed = keys.some((k) => prevState[k] !== this.state[k]);
    if (changed) this.fetchCompanies();
  }

  handleSearch = (val) => this.setState({ search: val, page: 1 });
  handleFilter = (key, val) => this.setState({ [key]: val, page: 1 });
  handleSort   = (col) => this.setState((prev) => ({
    sort:  col,
    order: prev.sort === col && prev.order === "DESC" ? "ASC" : "DESC",
    page:  1,
  }));
  handlePage = (p) => this.setState({ page: p });

  render() {
    const {
      summary, trend, byModel, byMethod,
      alerts, loading, companies, tableLoading,
      page, total_pages, search, pricing_model,
      status, sort, order,
      selectedCompany, showCompanyModal,
    } = this.state;

    if (loading) {
      return (
        <div className="p-5 text-center" style={{ color: "#6b7280", fontSize: "14px" }}>
          Loading revenue data...
        </div>
      );
    }

    return (
      <Container fluid>
        <Head>
          <title>Revenue</title>
        </Head>

        {/* KPI Strip */}
        <KpiStrip summary={summary} />

        {/* Charts row */}
        <div className="row g-3 mt-2">
          <div className="col-12 col-xl-8">
            <RevenueChart trend={trend} />
          </div>
          <div className="col-12 col-xl-4">
            <div className="row g-3">
              <div className="col-12">
                <ModelBreakdown data={byModel} />
              </div>
              <div className="col-12">
                <PaymentMethods data={byMethod} />
              </div>
            </div>
          </div>
        </div>

      

        {/* Company Table */}
        <div className="mt-3 mb-5">
          <CompanyTable
            data={companies}
            loading={tableLoading}
            page={page}
            total_pages={total_pages}
            search={search}
            pricing_model={pricing_model}
            status={status}
            sort={sort}
            order={order}
            onSearch={this.handleSearch}
            onFilter={this.handleFilter}
            onSort={this.handleSort}
            onPage={this.handlePage}
            onRowClick={(accountId) => this.fetchCompanyDetail(accountId)}
          />
        </div>

        {/* Drill-down modal */}
        {showCompanyModal && (
          <CompanyDetailModal
            data={selectedCompany}
            onClose={() => this.setState({ showCompanyModal: false, selectedCompany: null })}
          />
        )}

      </Container>
    );
  }
}

export default AdminRevenuePage;