import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";

const AVATAR_COLORS = [
    { bg: "#E8F4FD", text: "#1A6FA8", border: "#A8D4F0" },
    { bg: "#E8F8F0", text: "#1A7A4A", border: "#A8E4C4" },
    { bg: "#FDF3E8", text: "#A85A1A", border: "#F0C8A8" },
    { bg: "#F3E8FD", text: "#6A1AA8", border: "#C8A8F0" },
    { bg: "#FDE8F3", text: "#A81A6A", border: "#F0A8C8" },
    { bg: "#E8FDF8", text: "#1A8A7A", border: "#A8F0E4" },
    { bg: "#FDF8E8", text: "#8A7A1A", border: "#F0E4A8" },
    { bg: "#F0E8FD", text: "#4A1A9A", border: "#B8A8F0" },
];

const avatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

const expLabel = (val) => {
    const n = parseInt(val);
    if (!n || n === 0) return "Fresh";
    if (n === 1) return "1 yr";
    return `${n} yrs`;
};

const SkeletonCard = () => (
    <div style={styles.card}>
        <div style={styles.skeletonCircle} />
        <div style={{ ...styles.skeletonLine, width: "70%", marginTop: 12 }} />
        <div style={{ ...styles.skeletonLine, width: "50%", marginTop: 8 }} />
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <div style={styles.skeletonPill} />
            <div style={{ ...styles.skeletonPill, width: 48 }} />
        </div>
    </div>
);

// ── Candidate Card ────────────────────────────────────────────────────────────
const CandidateCard = ({
    candidate,
    index,
    isLocked,
    onUnlock,
    unlocking,
    unlockedData,
    creditBalance,
}) => {
    const color = avatarColor(index);
    const scope = unlockedData?.scope;
    const data = unlockedData?.data;
    const isUnlocking = unlocking === candidate.candidate_id;

    return (
        <div
            style={{
                ...styles.card,
                ...(candidate.is_boosted ? styles.boostedCard : {}),
                position: "relative",
                overflow: "hidden",
            }}
        >
            {candidate.is_boosted && (
                <div style={styles.boostedRibbon}>⭐ Featured</div>
            )}

            {/* Avatar */}
            <div
                style={{
                    ...styles.avatar,
                    background: isLocked ? "#F0F0F0" : color.bg,
                    color: isLocked ? "#BDBDBD" : color.text,
                    border: `2px solid ${isLocked ? "#E0E0E0" : color.border}`,
                }}
            >
                {isLocked ? "?" : (data?.full_name?.[0]?.toUpperCase() || candidate.initial || "?")}
            </div>

            {/* Name */}
            <div style={styles.cardName}>
                {isLocked
                    ? <span style={styles.lockedText}>●●●●●●●●</span>
                    : (data?.full_name || candidate.full_name)}
            </div>

            {/* Sub info */}
            <div style={styles.cardSub}>
                {isLocked
                    ? <span style={styles.lockedText}>●●●●●●</span>
                    : `${expLabel(candidate.total_experience)} experience${candidate.city_name ? ` · ${candidate.city_name}` : ""}`}
            </div>

            {/* Contact info — shown when scope is contact or full */}
            {!isLocked && (scope === "contact" || scope === "full") && data && (
                <div style={styles.contactBox}>
                    {data.email && (
                        <div style={styles.contactRow}>
                            <span style={styles.contactIcon}>✉</span>
                            <span style={styles.contactText}>{data.email}</span>
                        </div>
                    )}
                    {data.phone && (
                        <div style={styles.contactRow}>
                            <span style={styles.contactIcon}>📞</span>
                            <span style={styles.contactText}>{data.phone}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Resume link — shown only for full scope */}
            {!isLocked && scope === "full" && data?.resume && (
                <a
                    href={`${process.env.NEXT_PUBLIC_FILE_BASE_URL}${data.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.resumeLink}
                >
                    📄 Download Resume
                </a>
            )}

            {/* Skills pill row */}
            <div style={styles.pillRow}>
                {isLocked ? (
                    <>
                        <div style={styles.lockedPill} />
                        <div style={{ ...styles.lockedPill, width: 48 }} />
                        <div style={{ ...styles.lockedPill, width: 36 }} />
                    </>
                ) : (
                    <>
                        <span style={styles.skillPill}>
                            {candidate.skills_count} skill{candidate.skills_count !== 1 ? "s" : ""}
                        </span>
                        {candidate.city_name && (
                            <span style={styles.cityPill}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5"
                                    style={{ marginRight: 3 }}>
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                    <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                {candidate.city_name}
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Unlock button — shown only when card is locked */}
            {isLocked && (
                <button
                    onClick={() => onUnlock(candidate.candidate_id)}
                    disabled={!creditBalance || isUnlocking}
                    style={{
                        ...styles.unlockBtn,
                        background: isUnlocking
                            ? "#9CA3AF"
                            : creditBalance
                                ? "#6B21A8"
                                : "#E2E8F0",
                        color: creditBalance ? "#fff" : "#9CA3AF",
                        cursor: (!creditBalance || isUnlocking) ? "not-allowed" : "pointer",
                    }}
                >
                    {isUnlocking
                        ? "Unlocking..."
                        : creditBalance
                            ? `🔓 Unlock (${creditBalance.remaining_credits} left)`
                            : "🔒 No credits"}
                </button>
            )}

            {/* Lock overlay — only show if no unlock button (i.e. no active job scenario) */}
            {isLocked && !creditBalance && (
                <div style={styles.lockOverlay}>
                    <div style={styles.lockIconWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#2E7D5E">
                            <path d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3.1-9H8.9V6a3.1 3.1 0 016.2 0v2z" />
                        </svg>
                    </div>
                    <p style={styles.lockLabel}>Buy a package to unlock</p>
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
class AvailableCandidates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            candidates: [],
            stats: null,
            skillId: "",
            skills: [],
            loading: false,
            hasSearched: false,
            total: 0,
            page: 1,
            limit: 12,
            search: "",
            cityId: "",
            experience: "",
            cities: [],
            hasActiveJob: false,
            checkingJob: true,
            // ── Credit state ──
            creditBalance: null,
            unlockedIds: new Set(),
            unlockedData: {},      // candidate_id => { scope, data }
            unlocking: null,       // candidate_id being unlocked right now
            alertMsg: null,        // { type: "success"|"error", text }
        };
        this.searchTimeout = null;
    }

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

    // ── Check active job ──────────────────────────────────────────────────────
    checkEmployerActiveJob = async () => {
        try {
            const res = await axios.get(`${this.apiBase}job/managejob/${this.userId}`);
            const jobs = res.data || [];
            const hasActiveJob = jobs.some(
                (j) => j.status === "Active" && j.approval_status === "Approved"
            );
            this.setState({ hasActiveJob, checkingJob: false });
        } catch {
            this.setState({ hasActiveJob: false, checkingJob: false });
        }
    };

    // ── Fetch dropdown data ───────────────────────────────────────────────────
    fetchCities = async () => {
        try {
            const res = await axios.get(`${this.apiBase}getallCities`);
            this.setState({ cities: res.data?.cities || [] });
        } catch (err) {
            console.error("Cities fetch error:", err);
        }
    };

    fetchSkills = async () => {
        try {
            const res = await axios.get(`${this.apiBase}getAllskills`);
            this.setState({ skills: res.data?.skills || [] });
        } catch (err) {
            console.error("Skills fetch error:", err);
        }
    };

    // ── Fetch credit balance ──────────────────────────────────────────────────
    fetchCreditBalance = async () => {
        try {
            const res = await axios.get(`${this.apiBase}credit/balance`, {
                headers: { Authorization: `Bearer ${this.token}` },
            });
            this.setState({ creditBalance: res.data.credit || null });
        } catch (err) {
            console.error("Credit balance fetch error:", err);
        }
    };

    // ── Fetch candidates ──────────────────────────────────────────────────────
    fetchCandidates = async (overrides = {}) => {
        const merged = { ...this.state, ...overrides };
        const { page, limit, search, cityId, experience, skillId } = merged;

        if (!search && !cityId && !experience && !skillId) {
            this.setState({ candidates: [], loading: false });
            return;
        }

        this.setState({ loading: true, hasSearched: true });

        try {
            const res = await axios.get(
                `${this.apiBase}candidateProfile/available-candidates`,
                {
                    headers: { Authorization: `Bearer ${this.token}` },
                    params: {
                        page,
                        limit,
                        search: search || undefined,
                        city_id: cityId || undefined,
                        experience: experience || undefined,
                        skill_id: skillId || undefined,
                    },
                }
            );
            this.setState({
                candidates: res.data.candidates || [],
                stats: res.data.stats || null,
                total: res.data.total || 0,
                loading: false,
            });
        } catch (err) {
            console.error("fetchCandidates error:", err);
            this.setState({ loading: false });
        }
    };

    // ── Fetch unlocked candidates ─────────────────────────────────────────────
    fetchUnlockedCandidates = async () => {
        try {
            // Step 1: Get unlocked candidate list
            const res = await axios.get(
                `${this.apiBase}credit/unlocked-list`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            );

            const unlockedCandidates = res.data.data || [];

            if (!unlockedCandidates.length) {
                return;
            }

            const unlockedIds = new Set();
            const unlockedData = {};

            // Step 2: Fetch each unlocked profile detail
            await Promise.all(
                unlockedCandidates.map(async (candidate) => {
                    try {
                        const profileRes = await axios.get(
                            `${this.apiBase}credit/profile/${candidate.candidate_id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${this.token}`,
                                },
                            }
                        );

                        unlockedIds.add(candidate.candidate_id);

                        unlockedData[candidate.candidate_id] = {
                            scope: profileRes.data.scope,
                            data: profileRes.data.data,
                        };
                    } catch (err) {
                        console.error(
                            `Failed to fetch unlocked profile ${candidate.candidate_id}`,
                            err
                        );
                    }
                })
            );

            this.setState({
                unlockedIds,
                unlockedData,
            });
        } catch (err) {
            console.error("Unlocked candidates fetch error:", err);
        }
    };

    // ── Unlock handler ────────────────────────────────────────────────────────
    handleUnlock = async (candidateId) => {
        this.setState({ unlocking: candidateId });
        try {
            // Step 1: Unlock (deduct credit)
            const unlockRes = await axios.post(
                `${this.apiBase}credit/unlock`,
                { candidate_id: candidateId },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );

            if (!unlockRes.data.success) {
                this.showAlert("error", unlockRes.data.message || "Unlock failed.");
                this.setState({ unlocking: null });
                return;
            }

            // Step 2: Fetch unlocked profile data
            const profileRes = await axios.get(
                `${this.apiBase}credit/profile/${candidateId}`,
                { headers: { Authorization: `Bearer ${this.token}` } }
            );

            const scope = profileRes.data.scope;
            const data = profileRes.data.data;

            this.setState((prev) => ({
                unlockedIds: new Set([...prev.unlockedIds, candidateId]),
                unlockedData: {
                    ...prev.unlockedData,
                    [candidateId]: { scope, data },
                },
                // Update remaining credits in balance
                creditBalance: prev.creditBalance
                    ? {
                        ...prev.creditBalance,
                        remaining_credits: unlockRes.data.already_unlocked
                            ? prev.creditBalance.remaining_credits
                            : unlockRes.data.credits_remaining,
                    }
                    : null,
                unlocking: null,
            }));

            if (!unlockRes.data.already_unlocked) {
                this.showAlert("success", "Profile unlocked successfully!");
            }
        } catch (err) {
            const msg =
                err.response?.data?.error === "no_credits"
                    ? err.response.data.message
                    : "Failed to unlock profile. Please try again.";
            this.showAlert("error", msg);
            this.setState({ unlocking: null });
        }
    };

    showAlert = (type, text) => {
        this.setState({ alertMsg: { type, text } });
        setTimeout(() => this.setState({ alertMsg: null }), 15000);
    };

    // ── Filters & pagination ──────────────────────────────────────────────────
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

    handlePageChange = (newPage) => {
        this.setState({ page: newPage }, () => this.fetchCandidates());
    };

    goToPostJob = () => this.props.onTabChange?.("postJob");
    goToPackages = () => this.props.onTabChange?.("viewpackage");

    // ── Render ────────────────────────────────────────────────────────────────
    render() {
        const {
            candidates, stats, loading, total, page, limit,
            cityId, experience, cities, hasActiveJob, checkingJob,
            creditBalance, unlockedIds, unlockedData, unlocking, alertMsg,
        } = this.state;

        const totalPages = Math.ceil(total / limit);

        return (
            <>
                <Head><title>Available Candidates | Dashboard</title></Head>

                <div style={styles.page}>

                    {/* Alert */}
                    {alertMsg && (
                        <div style={{
                            ...styles.alert,
                            background: alertMsg.type === "success" ? "#EBF7F1" : "#FEF2F2",
                            borderColor: alertMsg.type === "success" ? "#A8E4C4" : "#FECACA",
                            color: alertMsg.type === "success" ? "#065F46" : "#991B1B",
                        }}>
                            {alertMsg.type === "success" ? "✅" : "❌"} {alertMsg.text}
                        </div>
                    )}

                    {/* Page header */}
                    <div style={styles.pageHeader}>
                        <div>
                            <h1 style={styles.pageTitle}>Available Candidates</h1>
                            <p style={styles.pageSub}>
                                Browse all registered candidates — post a job &amp; buy a CV Credits package to unlock full profiles
                            </p>
                        </div>
                        {/* Credit balance chip */}
                        {creditBalance && (
                            <div style={styles.creditChip}>
                                <span style={styles.creditChipIcon}>🎟</span>
                                <div>
                                    <div style={styles.creditChipTitle}>
                                        {creditBalance.remaining_credits} credits left
                                    </div>
                                    <div style={styles.creditChipSub}>
                                        {creditBalance.package_name} · {creditBalance.unlock_scope} scope
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CTA Banners */}
                    {!hasActiveJob && !checkingJob && (
                        <div style={styles.ctaBanner}>
                            <div style={styles.ctaBannerLeft}>
                                <div style={styles.ctaBannerIcon}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#2E7D5E">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={styles.ctaBannerTitle}>
                                        {(stats?.total_candidates || total) > 0
                                            ? `${stats?.total_candidates || total}+ candidates are ready to be hired!`
                                            : "Candidates are ready to be hired!"}
                                    </p>
                                    <p style={styles.ctaBannerSub}>
                                        Post a job and buy a CV Credits package to unlock full profiles
                                    </p>
                                </div>
                            </div>
                            <button style={styles.btnGreen} onClick={this.goToPostJob}>
                                Post a Job →
                            </button>
                        </div>
                    )}

                    {hasActiveJob && !creditBalance && (
                        <div style={{ ...styles.ctaBanner, background: "#F3E8FD", borderColor: "#C8A8F0" }}>
                            <div style={styles.ctaBannerLeft}>
                                <div style={{ ...styles.ctaBannerIcon, background: "#6B21A820" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#6B21A8">
                                        <path d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3.1-9H8.9V6a3.1 3.1 0 016.2 0v2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ ...styles.ctaBannerTitle, color: "#3C1A6A" }}>
                                        Your job is live! Now buy a CV Credits package to unlock candidate profiles.
                                    </p>
                                    <p style={{ ...styles.ctaBannerSub, color: "#6B21A8" }}>
                                        Each credit unlocks one candidate's profile based on the package scope.
                                    </p>
                                </div>
                            </div>
                            <button style={{ ...styles.btnGreen, background: "#6B21A8" }} onClick={this.goToPackages}>
                                Buy Credits →
                            </button>
                        </div>
                    )}

                    {hasActiveJob && creditBalance && (
                        <div style={{ ...styles.ctaBanner, background: "#E8F4FD", borderColor: "#A8D4F0" }}>
                            <div style={styles.ctaBannerLeft}>
                                <div style={{ ...styles.ctaBannerIcon, background: "#1A6FA820" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1A6FA8">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ ...styles.ctaBannerTitle, color: "#1A4A6A" }}>
                                        Ready to hire! Click "Unlock" on any candidate card to reveal their profile.
                                    </p>
                                    <p style={{ ...styles.ctaBannerSub, color: "#1A6FA8" }}>
                                        You have <strong>{creditBalance.remaining_credits}</strong> credits remaining ({creditBalance.unlock_scope} scope).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    {stats && (
                        <div style={styles.statsRow}>
                            <div style={styles.statCard}>
                                <span style={styles.statNum}>{stats.total_candidates}+</span>
                                <span style={styles.statLabel}>Total Registered</span>
                            </div>
                            <div style={styles.statCard}>
                                <span style={{ ...styles.statNum, color: "#1A7A4A" }}>{stats.new_this_week}</span>
                                <span style={styles.statLabel}>New This Week</span>
                            </div>
                            <div style={styles.statCard}>
                                <span style={{ ...styles.statNum, color: "#A85A1A" }}>{stats.boosted_count}</span>
                                <span style={styles.statLabel}>Featured Profiles</span>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div style={styles.filterBar}>
                        <select style={styles.filterSelect} value={this.state.skillId}
                            onChange={(e) => this.handleFilter("skillId", e.target.value)}>
                            <option value="">All Skills</option>
                            {this.state.skills.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <select style={styles.filterSelect} value={cityId}
                            onChange={(e) => this.handleFilter("cityId", e.target.value)}>
                            <option value="">All Cities</option>
                            {cities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select style={styles.filterSelect} value={experience}
                            onChange={(e) => this.handleFilter("experience", e.target.value)}>
                            <option value="">All Experience</option>
                            <option value="fresh">Fresh Graduate</option>
                            <option value="1-3">1 – 3 Years</option>
                            <option value="3-5">3 – 5 Years</option>
                            <option value="5+">5+ Years</option>
                        </select>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div style={styles.grid}>
                            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : !this.state.hasSearched ? (
                        <div style={styles.emptyState}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.2">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p style={{ fontSize: 17, fontWeight: 600, color: "#2D3748", margin: "8px 0 4px" }}>
                                Search for Candidates
                            </p>
                            <p style={{ fontSize: 13, color: "#718096", margin: 0, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                                Use the filters above to find candidates by skill, experience level, or city
                            </p>
                            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                                {["fresh", "1-3", "3-5", "5+"].map((exp) => (
                                    <button key={exp} onClick={() => this.handleFilter("experience", exp)}
                                        style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#F7FAFC", color: "#4A5568", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                                        {exp === "fresh" ? "🎓 Fresh Graduate" : exp === "1-3" ? "1–3 Years" : exp === "3-5" ? "3–5 Years" : "5+ Years"}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                                {this.state.skills.slice(0, 6).map((skill) => (
                                    <button key={skill.id} onClick={() => this.handleFilter("skillId", String(skill.id))}
                                        style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid #BEE3F8", background: "#EBF8FF", color: "#2B6CB0", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                                        💡 {skill.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div style={styles.emptyState}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                            <p style={styles.emptyText}>No candidates found</p>
                            <p style={{ color: "#A0AEC0", fontSize: 13, margin: 0 }}>Try different filters</p>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: 13, color: "#718096", marginBottom: 12 }}>
                                Showing {candidates.length} of {total} candidates
                            </p>
                            <div style={styles.grid}>
                                {candidates.map((candidate, idx) => (
                                    <CandidateCard
                                        key={candidate.candidate_id}
                                        candidate={candidate}
                                        index={idx}
                                        isLocked={!unlockedIds.has(candidate.candidate_id)}
                                        onUnlock={this.handleUnlock}
                                        unlocking={unlocking}
                                        unlockedData={unlockedData[candidate.candidate_id]}
                                        creditBalance={creditBalance}
                                    />
                                ))}
                            </div>

                            {candidates.some(c => !unlockedIds.has(c.candidate_id)) && (
                                <div style={styles.lockStrip}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#36565f">
                                        <path d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3.1-9H8.9V6a3.1 3.1 0 016.2 0v2z" />
                                    </svg>
                                    <span>
                                        {creditBalance
                                            ? `${creditBalance.remaining_credits} credits remaining — click Unlock on any card`
                                            : "Buy a CV Credits package to unlock candidate profiles"}
                                    </span>
                                    {!creditBalance && (
                                        <button onClick={this.goToPackages} style={styles.stripBtn}>
                                            Buy Credits →
                                        </button>
                                    )}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div style={styles.pagination}>
                                    <button style={{ ...styles.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
                                        disabled={page <= 1} onClick={() => this.handlePageChange(page - 1)}>‹</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => Math.abs(p - page) <= 2)
                                        .map((p) => (
                                            <button key={p}
                                                style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}
                                                onClick={() => this.handlePageChange(p)}>{p}</button>
                                        ))}
                                    <button style={{ ...styles.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
                                        disabled={page >= totalPages} onClick={() => this.handlePageChange(page + 1)}>›</button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Bottom CTA */}
                    <div style={styles.bottomCta}>
                        <h3 style={styles.bottomCtaTitle}>Want to hire from these candidates?</h3>
                        <p style={styles.bottomCtaSub}>
                            Post a job, choose a CV Credits package, and start unlocking candidate profiles directly from this page.
                        </p>
                        <div style={styles.btnRow}>
                            <button style={styles.btnOutlinePurple} onClick={this.goToPackages}>View Packages</button>
                            <button style={styles.btnFillPurple} onClick={this.goToPostJob}>Post a Job Now →</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

const styles = {
    page: { padding: "24px", maxWidth: 1200, margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif" },
    pageHeader: { marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
    pageTitle: { fontSize: 22, fontWeight: 600, color: "#1A202C", margin: 0 },
    pageSub: { fontSize: 13, color: "#718096", marginTop: 4, marginBottom: 0 },

    // Credit chip
    creditChip: { display: "flex", alignItems: "center", gap: 10, background: "#F3E8FD", border: "1px solid #C8A8F0", borderRadius: 10, padding: "10px 14px" },
    creditChipIcon: { fontSize: 20 },
    creditChipTitle: { fontSize: 14, fontWeight: 600, color: "#3C1A6A" },
    creditChipSub: { fontSize: 11, color: "#6B21A8" },

    // Alert
    alert: { padding: "12px 16px", borderRadius: 8, border: "1px solid", marginBottom: 16, fontSize: 13, fontWeight: 500 },

    // CTA Banner
    ctaBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#EBF7F1", border: "1px solid #A8E4C4", borderRadius: 12, padding: "16px 20px", marginBottom: 20, flexWrap: "wrap" },
    ctaBannerLeft: { display: "flex", alignItems: "flex-start", gap: 12, flex: 1 },
    ctaBannerIcon: { width: 40, height: 40, borderRadius: "50%", background: "#2E7D5E20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    ctaBannerTitle: { fontSize: 14, fontWeight: 600, color: "#1A4A30", margin: "0 0 3px" },
    ctaBannerSub: { fontSize: 12, color: "#2E7D5E", margin: 0 },

    // Stats
    statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 },
    statCard: { background: "#F7FAFC", borderRadius: 10, padding: "14px 16px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 },
    statNum: { fontSize: 24, fontWeight: 700, color: "#1A202C" },
    statLabel: { fontSize: 12, color: "#718096" },

    // Filters
    filterBar: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
    filterSelect: { flex: "0 1 150px", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#2D3748", background: "#fff", cursor: "pointer" },

    // Grid
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 16 },

    // Card
    card: { background: "#fff", border: "1px solid #E8EDF2", borderRadius: 12, padding: "18px 16px", position: "relative", transition: "box-shadow 0.2s" },
    boostedCard: { border: "1px solid #F0C840", background: "#FFFDF0" },
    boostedRibbon: { position: "absolute", top: 10, right: 10, background: "#FEF3C7", color: "#92400E", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid #FCD34D" },
    avatar: { width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, marginBottom: 12 },
    cardName: { fontSize: 14, fontWeight: 600, color: "#2D3748", marginBottom: 4 },
    cardSub: { fontSize: 12, color: "#718096", marginBottom: 8 },
    lockedText: { color: "#CBD5E0", letterSpacing: 2 },

    // Contact info
    contactBox: { background: "#F7FAFC", borderRadius: 6, padding: "8px 10px", marginBottom: 8 },
    contactRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 },
    contactIcon: { fontSize: 11, flexShrink: 0 },
    contactText: { fontSize: 11, color: "#2D3748", wordBreak: "break-all" },
    resumeLink: { display: "block", fontSize: 11, color: "#6B21A8", marginBottom: 8, textDecoration: "none", fontWeight: 500 },

    // Pills
    pillRow: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 },
    skillPill: { fontSize: 11, padding: "3px 9px", background: "#EBF4FF", color: "#2B6CB0", borderRadius: 20 },
    cityPill: { fontSize: 11, padding: "3px 9px", background: "#F0FFF4", color: "#276749", borderRadius: 20, display: "flex", alignItems: "center" },
    lockedPill: { height: 20, width: 60, background: "#EDF2F7", borderRadius: 20 },

    // Unlock button
    unlockBtn: { width: "100%", padding: "8px 0", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, marginTop: 4, transition: "opacity 0.2s" },

    // Lock overlay (only when no credits at all)
    lockOverlay: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12, gap: 5, backdropFilter: "blur(1px)" },
    lockIconWrap: { width: 32, height: 32, borderRadius: "50%", background: "#E8F7F1", display: "flex", alignItems: "center", justifyContent: "center" },
    lockLabel: { fontSize: 11, fontWeight: 600, color: "#2E7D5E", textAlign: "center", margin: 0 },

    // Lock strip
    lockStrip: { display: "flex", alignItems: "center", gap: 8, background: "#FAF5FF", border: "1px solid #D6BCFA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#553C9A", marginBottom: 20 },
    stripBtn: { marginLeft: "auto", background: "#6B21A8", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" },

    // Empty state
    emptyState: { textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
    emptyText: { fontSize: 16, color: "#718096", margin: 0 },

    // Pagination
    pagination: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 28, flexWrap: "wrap" },
    pageBtn: { width: 36, height: 36, borderRadius: "50%", border: "1px solid #E2E8F0", background: "#fff", color: "#2D3748", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    pageBtnActive: { background: "#2E7D5E", color: "#fff", border: "1px solid #2E7D5E" },

    // Bottom CTA
    bottomCta: { background: "#F3E8FD", border: "1px solid #C8A8F0", borderRadius: 14, padding: "28px 24px", textAlign: "center", marginTop: 12 },
    bottomCtaTitle: { fontSize: 17, fontWeight: 600, color: "#3C1A6A", marginBottom: 8 },
    bottomCtaSub: { fontSize: 13, color: "#6A1AA8", lineHeight: 1.7, marginBottom: 20 },
    btnRow: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
    btnGreen: { background: "#2E7D5E", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    btnOutlinePurple: { border: "1px solid #6A1AA8", color: "#6A1AA8", background: "transparent", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
    btnFillPurple: { background: "#6A1AA8", color: "#F3E8FD", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },

    // Skeletons
    skeletonCircle: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" },
    skeletonLine: { height: 12, borderRadius: 6, background: "linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" },
    skeletonPill: { height: 20, width: 60, borderRadius: 20, background: "linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginTop: 12 },
};

export default AvailableCandidates;
