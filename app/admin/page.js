'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Bell, ShieldBan, SendHorizonal, UserPlus, UserCircle,
    ClipboardList, Trophy, FileText, HelpCircle, RefreshCw,
    CheckCircle, LogOut, Search, User, Phone, MapPin, Mail,
    Trash2, Plus, Shield, Clock, AlertTriangle
} from 'lucide-react';
import styles from './admin.module.css';

const TABS = [
    { key: 'active-logins', label: 'Active Logins', icon: Users },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'blocked-users', label: 'Blocked Users', icon: ShieldBan },
    { key: 'send-notification', label: 'Send Notification', icon: SendHorizonal },
    { key: 'add-users', label: 'Add Users', icon: UserPlus },
    { key: 'user-profile', label: 'User Profile', icon: UserCircle },
    { key: 'submission-history', label: 'Submission History', icon: ClipboardList },
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'logs', label: 'Logs', icon: FileText },
    { key: 'questions', label: 'Questions', icon: HelpCircle },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('active-logins');

    // Data states
    const [attempts, setAttempts] = useState([]);
    const [sessions, setSessions] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const [allUsers, setAllUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [logs, setLogs] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);

    // Form states
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', name: '', number: '', location: '' });
    const [newQuestion, setNewQuestion] = useState({ q: '', options: ['', '', '', ''], correct: 0 });

    // UI states
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    // ===== Data fetchers =====
    const loadAttempts = useCallback(async () => {
        try {
            const res = await fetch('/api/attempts');
            const data = await res.json();
            setAttempts([...data.attempts].reverse());
            setSessions(data.sessions);
        } catch (err) { console.error('Failed to load attempts', err); }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setAllUsers(data.users || []);
            setTotalUsers(data.users?.length || 0);
        } catch (err) { console.error('Failed to load users', err); }
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (err) { console.error('Failed to load notifications', err); }
    }, []);

    const loadLogs = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/logs');
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) { console.error('Failed to load logs', err); }
    }, []);

    const loadQuestions = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/questions');
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (err) { console.error('Failed to load questions', err); }
    }, []);

    const loadLeaderboard = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/leaderboard');
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
        } catch (err) { console.error('Failed to load leaderboard', err); }
    }, []);

    const refreshAll = useCallback(() => {
        loadAttempts();
        loadUsers();
        loadNotifications();
        loadLogs();
        loadQuestions();
        loadLeaderboard();
    }, [loadAttempts, loadUsers, loadNotifications, loadLogs, loadQuestions, loadLeaderboard]);

    useEffect(() => {
        refreshAll();
        const interval = setInterval(loadAttempts, 5000);
        return () => clearInterval(interval);
    }, [refreshAll, loadAttempts]);

    // ===== Actions =====
    const handleSearchProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: searchEmail, searchOnly: true })
            });
            const data = await res.json();
            setSearchResult(res.ok ? data : 'Not Found');
        } catch { setSearchResult('Not Found'); }
    };

    const handleBlockUser = async (email) => {
        try {
            await fetch('/api/admin/users/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            showAlert('success', `Blocked ${email}`);
            loadUsers();
            loadLogs();
        } catch { showAlert('error', 'Failed to block user'); }
    };

    const handleUnblockUser = async (email) => {
        try {
            await fetch('/api/admin/users/block', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            showAlert('success', `Unblocked ${email}`);
            loadUsers();
            loadLogs();
        } catch { showAlert('error', 'Failed to unblock user'); }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: notifTitle, message: notifMessage })
            });
            if (res.ok) {
                showAlert('success', 'Notification sent successfully!');
                setNotifTitle('');
                setNotifMessage('');
                loadNotifications();
                loadLogs();
            } else {
                showAlert('error', 'Failed to send notification');
            }
        } catch { showAlert('error', 'Failed to send notification'); }
        setLoading(false);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserForm)
            });
            const data = await res.json();
            if (res.ok) {
                showAlert('success', 'User added successfully!');
                setNewUserForm({ email: '', password: '', name: '', number: '', location: '' });
                loadUsers();
                loadLogs();
            } else {
                showAlert('error', data.error || 'Failed to add user');
            }
        } catch { showAlert('error', 'Failed to add user'); }
        setLoading(false);
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const filteredOptions = newQuestion.options.filter(o => o.trim());
            const res = await fetch('/api/admin/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newQuestion, options: filteredOptions })
            });
            if (res.ok) {
                showAlert('success', 'Question added!');
                setNewQuestion({ q: '', options: ['', '', '', ''], correct: 0 });
                loadQuestions();
                loadLogs();
            } else {
                showAlert('error', 'Failed to add question');
            }
        } catch { showAlert('error', 'Failed to add question'); }
        setLoading(false);
    };

    const handleDeleteQuestion = async (id) => {
        if (!confirm('Delete this question?')) return;
        try {
            const res = await fetch('/api/admin/questions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                showAlert('success', 'Question deleted');
                loadQuestions();
                loadLogs();
            }
        } catch { showAlert('error', 'Failed to delete question'); }
    };

    const handleResetData = async () => {
        if (!confirm('Are you absolutely sure? This will delete ALL attempts and session counts permanently!')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/attempts/reset', { method: 'POST' });
            if (res.ok) {
                showAlert('success', 'System reset successful. All users can now give tests again.');
                refreshAll();
            } else {
                showAlert('error', 'Reset failed');
            }
        } catch { showAlert('error', 'Reset failed'); }
        setLoading(false);
    };

    // ===== Computed =====
    const activeCount = attempts.filter(a => !a.completed).length;
    const completedCount = attempts.filter(a => a.completed).length;
    const nonActiveCount = Math.max(0, totalUsers - activeCount - completedCount);
    const blockedUsers = allUsers.filter(u => u.blocked);

    const getLogDotClass = (action) => {
        if (action.includes('Added') || action.includes('Submitted') || action.includes('Unblock')) return styles.logDotGreen;
        if (action.includes('Block') || action.includes('Delete')) return styles.logDotRed;
        if (action.includes('Notification')) return styles.logDotBlue;
        return styles.logDotOrange;
    };

    const getViolationClass = (v) => {
        if (v > 5) return styles.violationHigh;
        if (v > 0) return styles.violationMid;
        return styles.violationLow;
    };

    const getRankClass = (rank) => {
        if (rank === 1) return styles.rankGold;
        if (rank === 2) return styles.rankSilver;
        if (rank === 3) return styles.rankBronze;
        return styles.rankDefault;
    };

    // ===== Tab Content Renderers =====
    const renderActiveLogins = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <span className={styles.activeDot}></span>
                    Active Logins
                </div>
                <button className={styles.refreshBtn} onClick={refreshAll}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                    <div className={`${styles.statValue} ${styles.statValueBlue}`}>{totalUsers}</div>
                    <div className={styles.statLabel}>Total Users</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                    <div className={`${styles.statValue} ${styles.statValueGreen}`}>{activeCount}</div>
                    <div className={styles.statLabel}>Active Now</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardRed}`}>
                    <div className={`${styles.statValue} ${styles.statValueRed}`}>{nonActiveCount}</div>
                    <div className={styles.statLabel}>Not Active</div>
                </div>
            </div>
            {attempts.filter(a => !a.completed).length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No active users</p>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Start Time</th>
                            <th>Sessions</th>
                            <th>Violations</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.filter(a => !a.completed).map((a, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{a.email}</td>
                                <td>{a.startTime}</td>
                                <td>{sessions[a.email] || 0}/2</td>
                                <td>
                                    <span className={`${styles.violationBadge} ${getViolationClass(a.violations)}`}>
                                        {a.violations}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${styles.badgeLive}`}>
                                        <RefreshCw size={12} className={styles.rotating} /> Live
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderNotifications = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <Bell size={20} /> Notifications
                </div>
                <button className={styles.refreshBtn} onClick={loadNotifications}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>
            {notifications.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No notifications yet</p>
            ) : (
                [...notifications].reverse().map((n) => (
                    <div key={n.id} className={styles.notificationCard}>
                        <div className={styles.notificationTitle}>{n.title}</div>
                        <div className={styles.notificationMessage}>{n.message}</div>
                        <div className={styles.notificationTime}>
                            <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {n.timestamp}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderBlockedUsers = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <ShieldBan size={20} /> Blocked Users
                </div>
            </div>
            {blockedUsers.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No blocked users</p>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blockedUsers.map((u, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{u.email}</td>
                                <td>{u.name}</td>
                                <td><span className={`${styles.badge} ${styles.badgeBlocked}`}><ShieldBan size={12} /> Blocked</span></td>
                                <td>
                                    <button className={styles.successBtn} onClick={() => handleUnblockUser(u.email)}>
                                        <Shield size={14} /> Unblock
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderSendNotification = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <SendHorizonal size={20} /> Send Notification
                </div>
            </div>
            {alert && activeTab === 'send-notification' && (
                <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
                    {alert.type === 'success' ? <CheckCircle size={16} /> : null}
                    {alert.message}
                </div>
            )}
            <form onSubmit={handleSendNotification}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Title</label>
                    <input className={styles.formInput} value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Notification title..." required />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Message</label>
                    <textarea className={styles.formTextarea} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Write your notification message..." required />
                </div>
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                    <SendHorizonal size={16} /> {loading ? 'Sending...' : 'Send Notification'}
                </button>
            </form>
        </div>
    );

    const renderAddUsers = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <UserPlus size={20} /> Add Users
                </div>
            </div>
            {alert && activeTab === 'add-users' && (
                <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
                    {alert.type === 'success' ? <CheckCircle size={16} /> : null}
                    {alert.message}
                </div>
            )}
            <form onSubmit={handleAddUser}>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email *</label>
                        <input className={styles.formInput} type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} placeholder="user@example.com" required />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Password *</label>
                        <input className={styles.formInput} type="text" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} placeholder="Password" required />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name *</label>
                    <input className={styles.formInput} value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} placeholder="John Doe" required />
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Phone Number</label>
                        <input className={styles.formInput} value={newUserForm.number} onChange={e => setNewUserForm({ ...newUserForm, number: e.target.value })} placeholder="+1234567890" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Location</label>
                        <input className={styles.formInput} value={newUserForm.location} onChange={e => setNewUserForm({ ...newUserForm, location: e.target.value })} placeholder="City" />
                    </div>
                </div>
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                    <Plus size={16} /> {loading ? 'Adding...' : 'Add User'}
                </button>
            </form>

            {/* Existing Users Table */}
            <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#555', fontSize: '0.9rem', fontWeight: 600 }}>Existing Users ({allUsers.length})</h4>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.length === 0 ? (
                            <tr><td colSpan="6" className={styles.emptyRow}>No users found</td></tr>
                        ) : (
                            allUsers.map((u, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{u.email}</td>
                                    <td>{u.name}</td>
                                    <td>{u.number || '—'}</td>
                                    <td>{u.location || '—'}</td>
                                    <td>
                                        <span className={`${styles.badge} ${u.blocked ? styles.badgeBlocked : styles.badgeActive}`}>
                                            {u.blocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        {u.blocked ? (
                                            <button className={styles.successBtn} onClick={() => handleUnblockUser(u.email)}>Unblock</button>
                                        ) : (
                                            <button className={styles.dangerBtn} onClick={() => handleBlockUser(u.email)}>Block</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUserProfile = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <UserCircle size={20} /> User Profile
                </div>
            </div>
            <form onSubmit={handleSearchProfile} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input className={styles.formInput} type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="Enter user email to search..." required />
                <button type="submit" className={styles.primaryBtn} style={{ whiteSpace: 'nowrap' }}>
                    <Search size={16} /> Search
                </button>
            </form>
            {searchResult && (
                searchResult === 'Not Found' ? (
                    <div className={styles.alertError}>User not found</div>
                ) : (
                    <div className={styles.profileCard}>
                        <div className={styles.profileField}>
                            <div className={styles.profileFieldIcon}><User size={20} /></div>
                            <div>
                                <div className={styles.profileFieldLabel}>Name</div>
                                <div className={styles.profileFieldValue}>{searchResult.name}</div>
                            </div>
                        </div>
                        <div className={styles.profileField}>
                            <div className={styles.profileFieldIcon}><Mail size={20} /></div>
                            <div>
                                <div className={styles.profileFieldLabel}>Email</div>
                                <div className={styles.profileFieldValue}>{searchResult.email}</div>
                            </div>
                        </div>
                        <div className={styles.profileField}>
                            <div className={styles.profileFieldIcon}><Phone size={20} /></div>
                            <div>
                                <div className={styles.profileFieldLabel}>Phone</div>
                                <div className={styles.profileFieldValue}>{searchResult.number || '—'}</div>
                            </div>
                        </div>
                        <div className={styles.profileField}>
                            <div className={styles.profileFieldIcon}><MapPin size={20} /></div>
                            <div>
                                <div className={styles.profileFieldLabel}>Location</div>
                                <div className={styles.profileFieldValue}>{searchResult.location || '—'}</div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );

    const renderSubmissionHistory = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <ClipboardList size={20} /> Submission History
                </div>
                <button className={styles.refreshBtn} onClick={loadAttempts}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Sessions</th>
                        <th>Violations</th>
                        <th>Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attempts.length === 0 ? (
                        <tr><td colSpan="7" className={styles.emptyRow}>No submissions yet</td></tr>
                    ) : (
                        attempts.map((a, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{a.email}</td>
                                <td>{a.startTime}</td>
                                <td>{a.endTime || '—'}</td>
                                <td>{sessions[a.email] || 0}/2</td>
                                <td>
                                    <span className={`${styles.violationBadge} ${getViolationClass(a.violations)}`}>
                                        {a.violations}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                    {a.score !== undefined ? `${a.score} / ${a.total_questions || '?'}` : '—'}
                                </td>
                                <td>
                                    {a.completed ? (
                                        <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                                            <CheckCircle size={12} /> Submitted
                                        </span>
                                    ) : (
                                        <span className={`${styles.badge} ${styles.badgeLive}`}>
                                            <RefreshCw size={12} className={styles.rotating} /> Live
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderLeaderboard = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <Trophy size={20} /> Leaderboard
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className={styles.dangerBtn} onClick={handleResetData} disabled={loading}>
                        <Trash2 size={14} /> {loading ? 'Resetting...' : 'Reset All Data'}
                    </button>
                    <button className={styles.refreshBtn} onClick={loadLeaderboard}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Violations</th>
                        <th>Score</th>
                        <th>Time Taken</th>
                        <th>Submitted At</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.length === 0 ? (
                        <tr><td colSpan="7" className={styles.emptyRow}>No completed quizzes yet</td></tr>
                    ) : (
                        leaderboard.map((entry, i) => (
                            <tr key={i}>
                                <td>
                                    <span className={`${styles.rankBadge} ${getRankClass(entry.rank)}`}>
                                        {entry.rank}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{entry.name}</td>
                                <td>{entry.email}</td>
                                <td>
                                    <span className={`${styles.violationBadge} ${getViolationClass(entry.violations)}`}>
                                        {entry.violations}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                    {entry.score} / {entry.totalQuestions}
                                </td>
                                <td>{entry.timeTaken}</td>
                                <td>{entry.submittedAt}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderLogs = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <FileText size={20} /> Logs
                </div>
                <button className={styles.refreshBtn} onClick={loadLogs}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>
            {logs.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No logs yet</p>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className={styles.logEntry}>
                        <span className={`${styles.logDot} ${getLogDotClass(log.action)}`}></span>
                        <div style={{ flex: 1 }}>
                            <div className={styles.logAction}>{log.action}</div>
                            <div className={styles.logDetails}>
                                {log.user && <span style={{ marginRight: 8 }}>{log.user}</span>}
                                {log.details}
                            </div>
                        </div>
                        <span className={styles.logTimestamp}>{log.timestamp}</span>
                    </div>
                ))
            )}
        </div>
    );

    const renderQuestions = () => (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <HelpCircle size={20} /> Questions
                </div>
            </div>

            {alert && activeTab === 'questions' && (
                <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
                    {alert.type === 'success' ? <CheckCircle size={16} /> : null}
                    {alert.message}
                </div>
            )}

            {/* Add Question Form */}
            <form onSubmit={handleAddQuestion} style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8f9ff', borderRadius: '10px', border: '1px solid #e0e4ff' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700 }}>Add New Question</h4>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Question Text</label>
                    <input className={styles.formInput} value={newQuestion.q} onChange={e => setNewQuestion({ ...newQuestion, q: e.target.value })} placeholder="Enter the question..." required />
                </div>
                <div className={styles.formRow}>
                    {newQuestion.options.map((opt, i) => (
                        <div key={i} className={styles.formGroup}>
                            <label className={styles.formLabel}>Option {i + 1} {i < 2 ? '*' : ''}</label>
                            <input
                                className={styles.formInput}
                                value={opt}
                                onChange={e => {
                                    const opts = [...newQuestion.options];
                                    opts[i] = e.target.value;
                                    setNewQuestion({ ...newQuestion, options: opts });
                                }}
                                placeholder={`Option ${i + 1}`}
                                required={i < 2}
                            />
                        </div>
                    ))}
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Correct Answer (0-indexed)</label>
                    <input className={styles.formInput} type="number" min="0" max="3" value={newQuestion.correct} onChange={e => setNewQuestion({ ...newQuestion, correct: parseInt(e.target.value) })} required />
                </div>
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                    <Plus size={16} /> {loading ? 'Adding...' : 'Add Question'}
                </button>
            </form>

            {/* Questions List */}
            {questions.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No questions yet</p>
            ) : (
                questions.map((q) => (
                    <div key={q.id} className={styles.questionCard}>
                        <div className={styles.questionText}>Q{q.id}: {q.q}</div>
                        <div className={styles.questionOptions}>
                            {q.options.map((opt, i) => (
                                <span key={i} className={`${styles.optionTag} ${i === q.correct ? styles.optionTagCorrect : ''}`}>
                                    {i === q.correct ? '✓ ' : ''}{opt}
                                </span>
                            ))}
                        </div>
                        <div className={styles.questionActions}>
                            <button className={styles.dangerBtn} onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'active-logins': return renderActiveLogins();
            case 'notifications': return renderNotifications();
            case 'blocked-users': return renderBlockedUsers();
            case 'send-notification': return renderSendNotification();
            case 'add-users': return renderAddUsers();
            case 'user-profile': return renderUserProfile();
            case 'submission-history': return renderSubmissionHistory();
            case 'leaderboard': return renderLeaderboard();
            case 'logs': return renderLogs();
            case 'questions': return renderQuestions();
            default: return renderActiveLogins();
        }
    };

    return (
        <div className={styles.dashboardWrapper}>
            {/* Top Header */}
            <header className={styles.topHeader}>
                <div className={styles.headerTitle}>
                    <Shield size={22} />
                    Admin Dashboard — Hack With Simle
                </div>
                <button className={styles.logoutBtn} onClick={() => router.push('/')}>
                    <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Logout
                </button>
            </header>

            <div className={styles.dashboardBody}>
                {/* Sidebar */}
                <nav className={styles.sidebar}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {alert && !['send-notification', 'add-users', 'questions'].includes(activeTab) && (
                        <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError} style={{ marginBottom: '1rem' }}>
                            {alert.type === 'success' ? <CheckCircle size={16} /> : null}
                            {alert.message}
                        </div>
                    )}
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
}
