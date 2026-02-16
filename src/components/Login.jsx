import React, { useState } from 'react';
import Papa from 'papaparse';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/users.csv');
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                complete: (results) => {
                    const user = results.data.find(
                        (u) => u.email === email && u.password === password
                    );

                    if (user) {
                        onLoginSuccess(user);
                    } else {
                        setError('Invalid email or password');
                    }
                    setIsLoading(false);
                },
                error: (err) => {
                    setError('Error reading authentication data');
                    setIsLoading(false);
                }
            });
        } catch (err) {
            setError('Failed to connect to authentication server');
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Login</h1>
                <p style={{ color: 'var(--text-muted)' }}>Secure Quiz conduction platform</p>
            </div>

            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label><Mail size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Email Address</label>
                    <input
                        type="email"
                        className="input-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@quiz.com"
                        required
                    />
                </div>

                <div className="input-group">
                    <label><Lock size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Password</label>
                    <input
                        type="password"
                        className="input-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button
                    type="submit"
                    className="btn"
                    style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Verifying...' : (
                        <>
                            <LogIn size={18} style={{ marginRight: '10px' }} />
                            Sign In
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default Login;
