import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Quiz from './components/Quiz'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('login')

  useEffect(() => {
    // Handle hash-based routing
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setView('admin');
      } else {
        setView(user ? 'quiz' : 'login');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Initial check

    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setView('quiz')
  }

  const handleLogout = () => {
    setUser(null)
    setView('login')
    window.location.hash = '';
  }

  const navigateToAdmin = () => {
    window.location.hash = 'admin';
  }

  const navigateToLogin = () => {
    window.location.hash = '';
  }

  return (
    <div className="app-main">
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', opacity: 0.3, transition: 'opacity 0.3s' }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.3}>
        <button className="btn btn-secondary" onClick={view === 'admin' ? navigateToLogin : navigateToAdmin} style={{ padding: '0.5rem 1rem' }}>
          {view === 'admin' ? 'Student View' : 'Admin Dashboard'}
        </button>
      </div>

      {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {view === 'quiz' && <Quiz user={user} onLogout={handleLogout} />}
      {view === 'admin' && <Dashboard onBack={navigateToLogin} />}
    </div>
  )
}

export default App
