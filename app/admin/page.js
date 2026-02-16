'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, RefreshCw, ArrowLeft, Search, User, Phone, MapPin } from 'lucide-react';

export default function AdminPage() {
    const [attempts, setAttempts] = useState([]);
    const [sessions, setSessions] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    const loadData = async () => {
        try {
            const res = await fetch('/api/attempts');
            const data = await res.json();
            setAttempts([...data.attempts].reverse());
            setSessions(data.sessions);
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        }
    };

    useEffect(() => {
        // Get total user count from CSV
        const loadUsers = async () => {
            try {
                const res = await fetch('/users.csv');
                const text = await res.text();
                const lines = text.trim().split('\n');
                setTotalUsers(Math.max(0, lines.length - 1)); // -1 for header
            } catch (err) {
                console.error('Failed to count users', err);
            }
        };

        loadUsers();
        loadData();
        const interval = setInterval(loadData, 3000);
        window.addEventListener('focus', loadData);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', loadData);
        };
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: searchEmail, searchOnly: true })
            });
            const data = await res.json();
            setSearchResult(res.ok ? data : "Not Found");
        } catch (err) {
            setSearchResult("Not Found");
        }
    };

    const clearRecords = async () => {
        if (!window.confirm("Clear all quiz records?")) return;
        try {
            await fetch('/api/attempts/reset', { method: 'POST' });
            setAttempts([]);
            setSessions({});
        } catch (err) {
            console.error('Reset failed', err);
        }
    };

    const activeCount = attempts.filter(a => !a.completed).length;
    const completedCount = attempts.filter(a => a.completed).length;
    const nonActiveCount = Math.max(0, totalUsers - activeCount - completedCount);

    return (
        <div className="app-main" style={{ justifyContent: 'flex-start' }}>
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <Users size={32} style={{ marginRight: '16px', color: 'var(--primary)' }} />
                            Admin Panel
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Server-Side Monitoring</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="/" className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.2rem', textDecoration: 'none' }}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Student Portal
                        </a>
                        <button className="btn" onClick={clearRecords} style={{ width: 'auto', padding: '0.6rem 1.2rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                            Reset All Data
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Users</p>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>{totalUsers}</h2>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: 'var(--success)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Now</p>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--success)' }}>{activeCount}</h2>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Non-Active</p>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>{nonActiveCount}</h2>
                    </div>
                </div>

                {/* Profile Search */}
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                        <Search size={20} style={{ marginRight: '10px' }} /> Profile Search
                    </h3>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input
                            type="email"
                            className="input-control"
                            placeholder="Enter student email..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn" style={{ width: '160px' }}>Search</button>
                    </form>

                    {searchResult && (
                        <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem' }}>
                            {searchResult === "Not Found" ? (
                                <p style={{ color: 'var(--danger)', textAlign: 'center' }}>User not found.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <User size={24} style={{ marginRight: '12px', color: 'var(--primary)' }} />
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name</p>
                                            <p style={{ fontWeight: '500' }}>{searchResult.name}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Phone size={24} style={{ marginRight: '12px', color: 'var(--primary)' }} />
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Number</p>
                                            <p style={{ fontWeight: '500' }}>{searchResult.number}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <MapPin size={24} style={{ marginRight: '12px', color: 'var(--primary)' }} />
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</p>
                                            <p style={{ fontWeight: '500' }}>{searchResult.location}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Attempts Table */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Quiz Attempts</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Email</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Time</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Violations</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No attempts recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    attempts.map((attempt, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{attempt.email}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{attempt.startTime}</td>
                                            <td style={{ padding: '1rem' }}>{sessions[attempt.email] || 0}/2</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: attempt.violations > 5 ? 'var(--danger)' : attempt.violations > 0 ? '#ffb347' : 'var(--success)',
                                                    fontWeight: 'bold',
                                                    padding: '4px 8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '6px'
                                                }}>
                                                    {attempt.violations}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {attempt.completed ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontSize: '0.85rem' }}>
                                                        <CheckCircle size={14} style={{ marginRight: '6px' }} /> Submitted
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', color: '#ffb347', fontSize: '0.85rem' }}>
                                                        <RefreshCw size={14} className="rotating" style={{ marginRight: '6px' }} /> Live
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style>{`
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .rotating { animation: rotate 2s linear infinite; }
        `}</style>
            </div>
        </div>
    );
}
