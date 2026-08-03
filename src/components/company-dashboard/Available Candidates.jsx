import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";

class CustomSelect extends Component {
    state = { isOpen: false };
    wrapperRef = React.createRef();

    componentDidMount() {
        document.addEventListener("mousedown", this.handleOutsideClick);
    }
    componentWillUnmount() {
        document.removeEventListener("mousedown", this.handleOutsideClick);
    }
    handleOutsideClick = (e) => {
        if (this.wrapperRef.current && !this.wrapperRef.current.contains(e.target)) {
            this.setState({ isOpen: false });
        }
    };
    toggleOpen = () => this.setState(prev => ({ isOpen: !prev.isOpen }));
    handleSelect = (value) => {
        this.props.onChange(value);
        this.setState({ isOpen: false });
    };

    render() {
        const { options, value, placeholder, maxWidth } = this.props;
        const { isOpen } = this.state;
        const selectedLabel = options.find(opt => String(opt.value) === String(value))?.label || placeholder;

        return (
            <div ref={this.wrapperRef} style={{ position: "relative", width: "100%", maxWidth: maxWidth || 160 }}>
                <div
                    onClick={this.toggleOpen}
                    style={{
                        border: "1px solid #36565f", borderRadius: "6px", padding: "6px 12px",
                        fontSize: "0.875rem", color: "#1e293b", background: "#fff",
                        display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                    }}
                >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedLabel}
                    </span>
                    <span style={{
                        color: "#36565f", fontSize: "0.7rem", marginLeft: "8px",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease",
                    }}>▼</span>
                </div>

                {isOpen && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)", maxHeight: "240px", overflowY: "auto", zIndex: 1000,
                    }}>
                        {options.map(opt => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => this.handleSelect(opt.value)}
                                    style={{
                                        padding: "8px 12px", fontSize: "0.875rem", cursor: "pointer",
                                        background: isSelected ? "rgba(54, 86, 95, 0.1)" : "#fff",
                                        color: isSelected ? "#36565f" : "#1e293b",
                                        fontWeight: isSelected ? "600" : "400",
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
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
    }
}

const AVATAR_COLORS = ["primary", "success", "warning", "danger", "info", "secondary"];
const avatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

const expLabel = (val) => {
    const n = parseInt(val);
    if (!n || n === 0) return "Fresh";
    return n === 1 ? "1 yr" : `${n} yrs`;
};

const SkeletonCard = () => (
    <div className="card p-3">
        <div className="placeholder-glow">
            <div className="rounded-circle placeholder bg-secondary mb-3" style={{ width: 52, height: 52 }} />
            <div className="placeholder col-8 mb-2" />
            <div className="placeholder col-5 mb-2" />
            <div className="d-flex gap-2">
                <div className="placeholder col-4 rounded-pill" />
                <div className="placeholder col-3 rounded-pill" />
            </div>
        </div>
    </div>
);

const CandidateCard = ({ candidate, index, onUnlock, unlocking, unlockedData, creditBalance }) => {
    const color = avatarColor(index);
    const scope = unlockedData?.scope;
    const data = unlockedData?.data;
    const isUnlocking = unlocking === candidate.candidate_id;
    const hasCredits = creditBalance?.remaining_credits > 0;

    return (
        <div className={`card h-100 ${candidate.is_boosted ? "border-warning" : ""}`}>
            {candidate.is_boosted && (
                <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2">⭐ Featured</span>
            )}
            <div className="card-body d-flex flex-column gap-2">
                {/* Avatar */}
                <div
                    className={`rounded-circle d-flex align-items-center justify-content-center text-${color} bg-${color} bg-opacity-10 fw-bold`}
                    style={{ width: 52, height: 52, fontSize: 18, overflow: "hidden", flexShrink: 0 }}
                >
                    {candidate.passport_photo
                        ? <img src={candidate.passport_photo} alt={candidate.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (candidate.initial || "?")}
                </div>

                <div className="fw-semibold text-dark">{candidate.full_name || "Anonymous"}</div>
                <div className="text-muted small">📍 {candidate.city_name || "Location not specified"}</div>

                <div className="d-flex flex-wrap gap-1">
                    <span className="badge bg-light text-secondary border">⏰ {candidate.availability_status || "Not set"}</span>
                    <span className="badge bg-light text-secondary border">🛠️ {candidate.skills_count || 0} skills</span>
                    {candidate.total_experience && (
                        <span className="badge bg-light text-secondary border">💼 {expLabel(candidate.total_experience)}</span>
                    )}
                </div>

                {/* Unlocked contact info */}
                {unlockedData && data && (scope === "contact" || scope === "full") && (
                    <div className="bg-light rounded p-2 small">
                        {data.email && <div>✉ {data.email}</div>}
                        {data.phone && <div>📞 {data.phone}</div>}
                    </div>
                )}

                {/* Resume link */}
                {unlockedData && scope === "full" && data?.resume && (
                    <a href={`${process.env.NEXT_PUBLIC_FILE_BASE_URL}${data.resume}`} target="_blank" rel="noopener noreferrer" className="small text-purple">
                        📄 Download Resume
                    </a>
                )}

                {/* Unlock button */}
                {!unlockedData && candidate.hasActiveJob && hasCredits && (
                    <button
                        onClick={() => onUnlock(candidate.candidate_id)}
                        disabled={isUnlocking}
                        className="btn btn-sm btn-purple mt-auto"
                        style={{ background: "#6B21A8", color: "#fff", border: "none" }}
                    >
                        {isUnlocking ? "Unlocking..." : `🔓 Unlock (${creditBalance.remaining_credits} left)`}
                    </button>
                )}

                {!unlockedData && candidate.hasActiveJob && !hasCredits && (
                    <div className="text-muted small mt-auto">🔒 Buy credits to unlock</div>
                )}

                {!unlockedData && !candidate.hasActiveJob && (
                    <div className="text-warning small mt-auto">⚠️ Post a job to unlock</div>
                )}
            </div>
        </div>
    );
};

class AvailableCandidates extends Component {
    state = {
        candidates: [], stats: null, skills: [], cities: [],
        skillId: "", cityId: "", experience: "", search: "",
        loading: false, hasSearched: false, total: 0, page: 1, limit: 12,
        hasActiveJob: false, checkingJob: true,
        creditBalance: null, unlockedIds: new Set(), unlockedData: {},
        unlocking: null, alertMsg: null,
    };

    searchTimeout = null;
    apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
    token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;

    componentDidMount() {
        this.checkEmployerActiveJob();
        this.fetchCities();
        this.fetchSkills();
        this.fetchCreditBalance();
        this.fetchUnlockedCandidates();
    }

    checkEmployerActiveJob = async () => {
        try {
            const res = await axios.get(`${this.apiBase}job/managejob/${this.userId}`);
            const hasActiveJob = (res.data || []).some(j => j.status === "Active" && j.approval_status === "Approved");
            this.setState({ hasActiveJob, checkingJob: false });
        } catch {
            this.setState({ hasActiveJob: false, checkingJob: false });
        }
    };

    fetchCities = async () => {
        try {
            const res = await axios.get(`${this.apiBase}getallCities`);
            this.setState({ cities: res.data?.cities || [] });
        } catch (err) { console.error(err); }
    };

    fetchSkills = async () => {
        try {
            const res = await axios.get(`${this.apiBase}getAllskills`);
            this.setState({ skills: res.data?.skills || [] });
        } catch (err) { console.error(err); }
    };

    fetchCreditBalance = async () => {
        try {
            const res = await axios.get(`${this.apiBase}credit/balance`, { headers: { Authorization: `Bearer ${this.token}` } });
            this.setState({ creditBalance: res.data.credit || null });
        } catch (err) { console.error(err); }
    };

    fetchCandidates = async (overrides = {}) => {
        const { page, limit, search, cityId, experience, skillId } = { ...this.state, ...overrides };
        if (!search && !cityId && !experience && !skillId && !this.state.hasSearched) return;

        this.setState({ loading: true, hasSearched: true });
        try {
            const params = { page, limit };
            if (search?.trim()) params.search = search.trim();
            if (cityId) params.city_id = cityId;
            if (experience) params.experience = experience;
            if (skillId) params.skill_id = skillId;

            const res = await axios.get(`${this.apiBase}candidateProfile/available-candidates`, {
                headers: { Authorization: `Bearer ${this.token}` },
                params,
            });

            const candidates = (res.data.candidates || []).map(c => ({
                ...c,
                hasActiveJob: this.state.hasActiveJob,
                availability_status: c.availability_status || "Not specified",
            }));

            this.setState({ candidates, stats: res.data.stats || null, total: res.data.total || 0, loading: false });
        } catch (err) {
            console.error(err);
            this.setState({ loading: false });
        }
    };

    fetchUnlockedCandidates = async () => {
        try {
            const res = await axios.get(`${this.apiBase}credit/unlocked-list`, { headers: { Authorization: `Bearer ${this.token}` } });
            const list = res.data.data || [];
            if (!list.length) return;

            const unlockedIds = new Set();
            const unlockedData = {};

            await Promise.all(list.map(async ({ candidate_id }) => {
                try {
                    const r = await axios.get(`${this.apiBase}credit/profile/${candidate_id}`, { headers: { Authorization: `Bearer ${this.token}` } });
                    unlockedIds.add(candidate_id);
                    unlockedData[candidate_id] = { scope: r.data.scope, data: r.data.data };
                } catch (err) { console.error(err); }
            }));

            this.setState({ unlockedIds, unlockedData });
        } catch (err) { console.error(err); }
    };

    handleUnlock = async (candidateId) => {
        this.setState({ unlocking: candidateId });
        try {
            const unlockRes = await axios.post(`${this.apiBase}credit/unlock`, { candidate_id: candidateId }, { headers: { Authorization: `Bearer ${this.token}` } });
            if (!unlockRes.data.success) {
                this.showAlert("error", unlockRes.data.message || "Unlock failed.");
                return this.setState({ unlocking: null });
            }

            const profileRes = await axios.get(`${this.apiBase}credit/profile/${candidateId}`, { headers: { Authorization: `Bearer ${this.token}` } });

            this.setState(prev => ({
                unlockedIds: new Set([...prev.unlockedIds, candidateId]),
                unlockedData: { ...prev.unlockedData, [candidateId]: { scope: profileRes.data.scope, data: profileRes.data.data } },
                creditBalance: prev.creditBalance ? {
                    ...prev.creditBalance,
                    remaining_credits: unlockRes.data.already_unlocked ? prev.creditBalance.remaining_credits : unlockRes.data.credits_remaining,
                } : null,
                unlocking: null,
            }));

            if (!unlockRes.data.already_unlocked) this.showAlert("success", "Profile unlocked!");
        } catch (err) {
            const msg = err.response?.data?.error === "no_credits" ? err.response.data.message : "Failed to unlock. Try again.";
            this.showAlert("error", msg);
            this.setState({ unlocking: null });
        }
    };

    showAlert = (type, text) => {
        this.setState({ alertMsg: { type, text } });
        setTimeout(() => this.setState({ alertMsg: null }), 15000);
    };

    handleFilter = (key, value) => {
        this.setState({ [key]: value, page: 1 }, () => {
            if (key === "search") {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.fetchCandidates(), 300);
            } else {
                this.fetchCandidates();
            }
        });
    };

    handlePageChange = (newPage) => this.setState({ page: newPage }, () => this.fetchCandidates());
    goToPostJob = () => this.props.onTabChange?.("postJob");
    goToPackages = () => this.props.onTabChange?.("viewpackage");

    render() {
        const { candidates, stats, loading, total, page, limit, cityId, experience,
            cities, hasActiveJob, checkingJob, creditBalance, unlockedIds, unlockedData,
            unlocking, alertMsg } = this.state;

        const totalPages = Math.ceil(total / limit);

        return (
            <>
                <Head><title>Available Candidates | Dashboard</title></Head>

                <style jsx global>{`
            .form-select:focus {
                border-color: #36565f !important;
                box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
            }
            .page-item.active .page-link {
                background-color: #36565f !important;
                border-color: #36565f !important;
            }
            .page-link {
                color: #36565f !important;
            }
            .page-link:focus {
                box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
            }
        `}</style>
                <div className="container-fluid px-4 py-4" style={{ maxWidth: 1200, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

                    {/* Alert */}
                    {alertMsg && (
                        <div className={`alert alert-${alertMsg.type === "success" ? "success" : "danger"} d-flex align-items-center gap-2`}>
                            {alertMsg.type === "success" ? "✅" : "❌"} {alertMsg.text}
                        </div>
                    )}

                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                        <div>
                            <h5 className="fw-semibold mb-1">Available Candidates</h5>
                            <p className="text-muted small mb-0">Browse candidates — post a job &amp; buy CV Credits to unlock profiles</p>
                        </div>
                        {creditBalance && (
                            <div className="d-flex align-items-center gap-2 border rounded-3 px-3 py-2 bg-light">
                                <span>🎟</span>
                                <div>
                                    <div className="fw-semibold small">{creditBalance.remaining_credits} credits left</div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>{creditBalance.package_name} · {creditBalance.unlock_scope} scope</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CTA Banners */}
                    {!hasActiveJob && !checkingJob && (
                        <div className="alert alert-success d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                            <div>
                                <strong>{(stats?.total_candidates || total) > 0 ? `${stats?.total_candidates || total}+ candidates ready to hire!` : "Candidates are ready to hire!"}</strong>
                                <div className="small">Post a job and buy a CV Credits package to unlock full profiles</div>
                            </div>
                            <button className="btn btn-success btn-sm" onClick={this.goToPostJob}>Post a Job →</button>
                        </div>
                    )}

                    {hasActiveJob && !creditBalance && (
                        <div className="alert d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4" style={{ background: "#e2f0f0", borderColor: "#e2f0f0" }}>
                            <div>
                                <strong style={{ color: "#36565f" }}>Your job is live! Buy a CV Credits package to unlock profiles.</strong>
                                <div className="small" style={{ color: "#36565f" }}>Each credit unlocks one candidate's profile.</div>
                            </div>
                            <button className="btn btn-sm text-white" style={{ background: "#36565f" }} onClick={this.goToPackages}>Buy Credits →</button>
                        </div>
                    )}

                    {hasActiveJob && creditBalance && (
                        <div className="alert mb-4"
                            style={{ color: "#36565f", background: "#e2f0f0" }}>
                            <strong>Ready to hire!</strong> Click "Unlock" on any candidate to reveal their profile.
                            You have <strong>{creditBalance.remaining_credits}</strong> credits ({creditBalance.unlock_scope} scope).
                        </div>
                    )}

                    {/* Stats */}
                    {stats && (
                        <div className="row g-3 mb-4">
                            {[
                                { label: "Total Registered", value: `${stats.total_candidates}+`, color: "text-dark" },
                                { label: "New This Week", value: stats.new_this_week, color: "text-success" },
                                { label: "Featured Profiles", value: stats.boosted_count, color: "text-warning" },
                            ].map(({ label, value, color }) => (
                                <div className="col-4" key={label}>
                                    <div className="card text-center py-3">
                                        <div className={`fs-4 fw-bold ${color}`}>{value}</div>
                                        <div className="text-muted small">{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <CustomSelect
                            placeholder="All Skills"
                            maxWidth={160}
                            value={this.state.skillId}
                            onChange={(val) => this.handleFilter("skillId", val)}
                            options={[
                                { value: "", label: "All Skills" },
                                ...this.state.skills.map(s => ({ value: s.id, label: s.name }))
                            ]}
                        />
                        <CustomSelect
                            placeholder="All Cities"
                            maxWidth={160}
                            value={cityId}
                            onChange={(val) => this.handleFilter("cityId", val)}
                            options={[
                                { value: "", label: "All Cities" },
                                ...cities.map(c => ({ value: c.id, label: c.name }))
                            ]}
                        />
                        <CustomSelect
                            placeholder="Fresh Graduate"
                            maxWidth={160}
                            value={experience}
                            onChange={(val) => this.handleFilter("experience", val)}
                            options={[
                                { value: "fresh", label: "Fresh Graduate" },
                                { value: "1-3", label: "1 – 3 Years" },
                                { value: "3-5", label: "3 – 5 Years" },
                                { value: "5+", label: "5+ Years" },
                            ]}
                        />
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="row g-3">
                            {Array.from({ length: 12 }).map((_, i) => <div className="col-6 col-md-4 col-lg-3" key={i}><SkeletonCard /></div>)}
                        </div>
                    ) : !this.state.hasSearched ? (
                        <div className="text-center py-5 text-muted">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.2" className="mb-3">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p className="fw-semibold text-dark mb-1">Search for Candidates</p>
                            <p className="small">Use the filters above to find candidates by skill, experience, or city</p>
                            <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                                {["fresh", "1-3", "3-5", "5+"].map(exp => (
                                    <button key={exp} className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => this.handleFilter("experience", exp)}>
                                        {exp === "fresh" ? "🎓 Fresh" : exp === "1-3" ? "1–3 yrs" : exp === "3-5" ? "3–5 yrs" : "5+ yrs"}
                                    </button>
                                ))}
                            </div>
                            <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                                {this.state.skills.slice(0, 6).map(s => (
                                    <button
                                        key={s.id}
                                        className="btn btn-sm rounded-pill"
                                        style={{ border: "1px solid #36565f", color: "#36565f" }}
                                        onClick={() => this.handleFilter("skillId", String(s.id))}
                                    >
                                        💡 {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="fw-semibold">No candidates found</p>
                            <p className="small">Try different filters</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted small mb-3">Showing {candidates.length} of {total} candidates</p>
                            <div className="row g-3">
                                {candidates.map((c, idx) => (
                                    <div className="col-6 col-md-4 col-lg-3" key={c.candidate_id}>
                                        <CandidateCard
                                            candidate={c}
                                            index={idx}
                                            isLocked={!unlockedIds.has(c.candidate_id)}
                                            onUnlock={this.handleUnlock}
                                            unlocking={unlocking}
                                            unlockedData={unlockedData[c.candidate_id]}
                                            creditBalance={creditBalance}
                                        />
                                    </div>
                                ))}
                            </div>

                            {candidates.some(c => !unlockedIds.has(c.candidate_id)) && (
                                <div className="d-flex align-items-center gap-2 bg-light border rounded p-2 mt-3 small text-muted">
                                    🔒 {creditBalance
                                        ? `${creditBalance.remaining_credits} credits remaining — click Unlock on any card`
                                        : "Buy a CV Credits package to unlock candidate profiles"}
                                    {!creditBalance && (
                                        <button className="btn btn-sm text-white ms-auto" style={{ background: "#6B21A8" }} onClick={this.goToPackages}>Buy Credits →</button>
                                    )}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <nav className="d-flex justify-content-center mt-4">
                                    <ul className="pagination pagination-sm">
                                        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => this.handlePageChange(page - 1)}>‹</button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => Math.abs(p - page) <= 2)
                                            .map(p => (
                                                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                                    <button className="page-link" onClick={() => this.handlePageChange(p)}>{p}</button>
                                                </li>
                                            ))}
                                        <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => this.handlePageChange(page + 1)}>›</button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}

                    {/* Bottom CTA */}
                    <div className="text-center rounded-4 p-4 mt-4 border" style={{ background: "#e2f0f0", borderColor: "#e2f0f0" }}>
                        <h6 className="fw-semibold" style={{ color: "#36565f" }}>Want to hire from these candidates?</h6>
                        <p className="small mb-3" style={{ color: "#000" }}>Post a job, choose a CV Credits package, and start unlocking profiles directly from this page.</p>
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                            <button className="btn btn-sm btn-outline-secondary" onClick={this.goToPackages}>View Packages</button>
                            <button className="btn btn-sm text-white" style={{ background: "#36565f" }} onClick={this.goToPostJob}>Post a Job Now →</button>
                        </div>
                    </div>

                </div>
            </>
        );
    }
}

export default AvailableCandidates;