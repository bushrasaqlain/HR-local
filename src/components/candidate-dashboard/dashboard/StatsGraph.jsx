import React, { useState, useEffect } from 'react';
import api from '../../../components/lib/api';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/**
 * Props:
 *  type: 'views' | 'shortlisted' | 'approved'
 */
const StatsGraph = ({ type = 'views' }) => {
    const [stats, setStats] = useState([]);
    const [period, setPeriod] = useState('28days');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ current: 0, previous: 0 });

    // Config per type
    const config = {
        views: {
            title: 'Profile Views',
            subtitle: 'How many recruiters viewed your profile',
            color: '#0a66c2',
            endpoint: '/candidateProfile/profile-view-stats',
            countLabel: 'view',
        },
        shortlisted: {
            title: 'Shortlisted',
            subtitle: 'Companies that shortlisted your profile',
            color: '#7c3aed',
            endpoint: '/applicant/application-stats',
            countLabel: 'time',
        },
        approved: {
            title: 'Approved',
            subtitle: 'Companies that approved your profile',
            color: '#059669',
            endpoint: '/applicant/application-stats',
            countLabel: 'time',
        },
    };

    const { title, subtitle, color, endpoint, countLabel } = config[type];

    useEffect(() => {
        fetchStats();
    }, [period, type]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = { period };
            if (type !== 'views') params.type = type; // shortlisted ya approved

            const res = await api.get(endpoint, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });

            setStats(res.data.data || []);
            setSummary({
                current: res.data.current_total || 0,
                previous: res.data.previous_total || 0,
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const pctChange = summary.previous === 0
        ? null
        : Math.round(((summary.current - summary.previous) / summary.previous) * 100);
    const isPositive = pctChange !== null && pctChange >= 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const val = payload[0].value;
        return (
            <div style={{
                background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '6px', padding: '8px 12px',
                fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
                <div style={{ color: '#666', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontWeight: 700, color }}>
                    {val} {countLabel}{val !== 1 ? 's' : ''}
                </div>
            </div>
        );
    };

    const periodOptions = [
        { value: '28days', label: 'Last 28 days' },
        { value: 'weekly', label: 'Last 8 weeks' },
        { value: 'monthly', label: 'Last 6 months' },
    ];

    // Gradient id unique per type
    const gradientId = `gradient_${type}`;

    return (
        <div style={{
            background: '#fff', borderRadius: '10px',
            border: '1px solid #e0e0e0', padding: '20px 24px',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#000' }}>
                            {summary.current} {title}
                        </span>
                        <span style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: '#666', color: '#fff', fontSize: '10px',
                            fontWeight: 700, display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'default',
                        }} title={subtitle}>i</span>
                    </div>

                    {pctChange !== null && (
                        <div style={{
                            fontSize: '13px',
                            color: isPositive ? '#057642' : '#cc1016',
                            marginTop: '2px',
                        }}>
                            {isPositive ? '+' : ''}{pctChange}% from previous period
                        </div>
                    )}
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{
                        border: '1px solid #c0c0c0', borderRadius: '20px',
                        padding: '5px 14px', fontSize: '13px', color: '#000',
                        cursor: 'pointer', outline: 'none', background: '#fff',
                    }}
                >
                    {periodOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Chart */}
            <div style={{ marginTop: '16px' }}>
                {loading ? (
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '28px', height: '28px',
                            border: `3px solid #e0e0e0`,
                            borderTopColor: color,
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : stats.length === 0 || stats.every(s => s.count === 0) ? (
                    <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                            {type === 'views' ? '👁️' : type === 'shortlisted' ? '📋' : '✅'}
                        </div>
                        <div style={{ fontWeight: 600 }}>No data yet</div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#9ca3af' }}>{subtitle}</div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false} tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false} tickLine={false}
                                allowDecimals={false} width={35}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#${gradientId})`}
                                dot={false}
                                activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default StatsGraph;
