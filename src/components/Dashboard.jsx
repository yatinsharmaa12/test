import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const Dashboard = ({ onBack }) => {
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        const loadData = () => {
            const data = JSON.parse(localStorage.getItem('quiz_attempts') || '[]');
            // Sort by latest
            setAttempts(data.reverse());
        };
        loadData();
        const interval = setInterval(loadData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const clearRecords = () => {
        if (window.confirm("Are you sure you want to clear all quiz records?")) {
            localStorage.removeItem('quiz_attempts');
            setAttempts([]);
        }
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto' }}>
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center' }}>
                            <Users size={28} style={{ marginRight: '12px', color: 'var(--primary)' }} />
                            Admin Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Real-time student monitoring</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onBack} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Student Login
                        </button>
                        <button className="btn" onClick={clearRecords} style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                            Clear All
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Student Email</th>
                                <th style={{ padding: '1rem' }}>Start Time</th>
                                <th style={{ padding: '1rem' }}>Violations</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No attempts recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                attempts.map((attempt, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{attempt.email}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{attempt.startTime}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: attempt.violations > 5 ? 'var(--danger)' : attempt.violations > 0 ? '#ffb347' : 'var(--success)',
                                                fontWeight: 'bold'
                                            }}>
                                                {attempt.violations}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {attempt.completed ? (
                                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontSize: '0.85rem' }}>
                                                    <CheckCircle size={14} style={{ marginRight: '6px' }} /> Completed
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', color: '#ffb347', fontSize: '0.85rem' }}>
                                                    <RefreshCw size={14} className="rotating" style={{ marginRight: '6px' }} /> In Progress
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
        th { font-weight: 600; font-size: 0.9rem; }
      `}</style>
        </div>
    );
};

export default Dashboard;
