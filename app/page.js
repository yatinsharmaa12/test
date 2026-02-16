'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      // Store user data in sessionStorage for client-side access
      sessionStorage.setItem('quiz_user', JSON.stringify(data));
      router.push('/quiz');
    } catch (err) {
      setError('Failed to connect to server');
      setIsLoading(false);
    }
  };

  return (
    <div className="app-main">
      <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Secure Exam Platform</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label><Mail size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Email Address</label>
            <input
              type="email"
              className="input-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label><Lock size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Password</label>
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
            style={{ marginTop: '1rem' }}
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
    </div>
  );
}
