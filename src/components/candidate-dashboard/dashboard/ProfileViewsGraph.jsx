import React, { useState, useEffect } from 'react';
import api from '../../../components/lib/api';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const ProfileViewsGraph = () => {
    const [stats, setStats] = useState([]);
    const [period, setPeriod] = useState('28days');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ current: 0, previous: 0 });

    useEffect(() => {
        fetchViewStats();
    }, [period]);

    const fetchViewStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/candidateProfile/profile-view-stats', {
                params: { period },
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data.data || [];
            setStats(data);
            setSummary({
                current: res.data.current_total || 0,
                previous: res.data.previous_total || 0,
            });
        } catch (err) {
            console.error('Error fetching view stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const pctChange = summary.previous === 0
        ? null
        : Math.round(((summary.current - summary.previous) / summary.previous) * 100);

    const isPositive = pctChange !== null && pctChange >= 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ color: '#666', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontWeight: 700, color: '#0a66c2' }}>
                        {payload[0].value} view{payload[0].value !== 1 ? 's' : ''}
                    </div>
                </div>
            );
        }
        return null;
    };

    const periodOptions = [
        { value: '28days', label: 'Last 28 days' },
        { value: 'weekly', label: 'Last 8 weeks' },
        { value: 'monthly', label: 'Last 6 months' },
    ];

    return (
        <div style={{
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            padding: '20px 24px',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#000' }}>
                            {summary.current} Views
                        </span>
                        <span style={{
                            width: '16px', height: '16px',
                            borderRadius: '50%',
                            background: '#666',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'default',
                        }} title="Number of times recruiters viewed your profile">i</span>
                    </div>

                    {pctChange !== null && (
                        <div style={{ fontSize: '13px', color: isPositive ? '#057642' : '#cc1016', marginTop: '2px' }}>
                            {isPositive ? '+' : ''}{pctChange}% from previous period
                        </div>
                    )}
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{
                        border: '1px solid #c0c0c0',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '13px',
                        color: '#000',
                        cursor: 'pointer',
                        outline: 'none',
                        background: '#fff',
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
                            border: '3px solid #e0e0e0',
                            borderTopColor: '#0a66c2',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : stats.length === 0 ? (
                    <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>👁️</div>
                        <div style={{ fontWeight: 600 }}>No views yet</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>Views will appear as recruiters view your profile</div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0a66c2" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                width={35}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: '#0a66c2', strokeWidth: 1, strokeDasharray: '4 2' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#0a66c2"
                                strokeWidth={2}
                                fill="url(#viewsGradient)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#0a66c2', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ProfileViewsGraph;
