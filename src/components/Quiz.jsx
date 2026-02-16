import React, { useState, useEffect, useRef } from 'react';
import { Maximize, AlertTriangle, CheckCircle, ShieldAlert, PlayCircle, LogOut } from 'lucide-react';

const Quiz = ({ user, onLogout }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warning, setWarning] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    // Persistence: Update localStorage whenever violationCount changes
    useEffect(() => {
        if (!quizStarted) return;

        const attempts = JSON.parse(localStorage.getItem('quiz_attempts') || '[]');
        const currentAttemptIndex = attempts.findIndex(a => a.email === user.email && !a.completed);

        if (currentAttemptIndex !== -1) {
            attempts[currentAttemptIndex].violations = violationCount;
            localStorage.setItem('quiz_attempts', JSON.stringify(attempts));
        }
    }, [violationCount, quizStarted, user.email]);

    const questions = [
        {
            q: "Which property is used in CSS to detect user's color scheme preference?",
            options: ["@media (prefers-color-scheme)", "@theme", "color-query", "scheme-detect"],
            correct: 0
        },
        {
            q: "What does the screen sharing API primarily provide for anti-cheating?",
            options: ["Remote control", "Visual record of activity", "Keyboard logging", "IP tracking"],
            correct: 1
        },
        {
            q: "Which event is triggered when a user switches tabs in a browser?",
            options: ["tabchange", "visibilitychange", "window-switch", "blur-detect"],
            correct: 1
        }
    ];

    const enterFullscreen = () => {
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }

            // Initialize attempt in localStorage
            const attempts = JSON.parse(localStorage.getItem('quiz_attempts') || '[]');
            attempts.push({
                email: user.email,
                startTime: new Date().toLocaleString(),
                violations: 0,
                completed: false
            });
            localStorage.setItem('quiz_attempts', JSON.stringify(attempts));

            setQuizStarted(true);
        } catch (err) {
            console.warn("Fullscreen request failed:", err);
        }
    };

    // Anti-cheating listeners - active if quizStarted and isFullscreen
    useEffect(() => {
        if (!quizStarted || !isFullscreen) return;

        const handleViolation = (msg) => {
            setViolationCount(prev => prev + 1);
            setWarning(msg);
            setTimeout(() => setWarning(null), 5000);
        };

        const handleBlur = () => handleViolation("Warning: Window focus lost!");
        const handleVisibilityChange = () => {
            if (document.hidden) handleViolation("Warning: Tab switch detected!");
        };

        const preventDefault = (e) => {
            e.preventDefault();
            setWarning("Action blocked: Copy/Paste/Right-click disabled.");
            setTimeout(() => setWarning(null), 3000);
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                if (navigator.clipboard) navigator.clipboard.writeText('');
                handleViolation("Screenshot attempt detected!");
            }
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('contextmenu', preventDefault);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('contextmenu', preventDefault);
        };
    }, [quizStarted, isFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            setIsFullscreen(isFull);

            if (!isFull && quizStarted) {
                setViolationCount(prev => prev + 1);
                setWarning("Warning: Fullscreen exited!");
                setTimeout(() => setWarning(null), 5000);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [quizStarted]);

    const finishQuiz = () => {
        const attempts = JSON.parse(localStorage.getItem('quiz_attempts') || '[]');
        const currentAttemptIndex = attempts.findIndex(a => a.email === user.email && !a.completed);
        if (currentAttemptIndex !== -1) {
            attempts[currentAttemptIndex].completed = true;
            attempts[currentAttemptIndex].endTime = new Date().toLocaleString();
            localStorage.setItem('quiz_attempts', JSON.stringify(attempts));
        }
        alert("Quiz Completed Successfully!");
        onLogout();
    };

    if (!quizStarted || !isFullscreen) {
        return (
            <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <Maximize size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                <h2>Ready to Start?</h2>
                <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
                    This quiz will be conducted in <b>Fullscreen Mode</b>.
                    Your activity is being monitored for the admin report.
                </p>
                <button className="btn" onClick={enterFullscreen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={20} style={{ marginRight: '10px' }} />
                    Begin Exam
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container animate-fade-in">
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--text-muted)' }}>Question {currentQuestion + 1} of {questions.length}</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ padding: '4px 12px', background: violationCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: violationCount > 0 ? 'var(--danger)' : 'var(--text-muted)', borderRadius: '20px', fontSize: '0.8rem' }}>
                            Violations: {violationCount}
                        </div>
                        <div style={{ padding: '4px 12px', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                            <CheckCircle size={14} style={{ marginRight: '6px' }} /> Monitoring Active
                        </div>
                    </div>
                </div>

                {warning && (
                    <div className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#ff8080' }}>
                        <AlertTriangle size={20} style={{ marginRight: '12px', flexShrink: 0 }} />
                        {warning}
                    </div>
                )}

                <h2 style={{ marginBottom: '2rem', lineHeight: '1.4' }}>{questions[currentQuestion].q}</h2>

                {questions[currentQuestion].options.map((opt, i) => (
                    <div key={i} className="option-card" onClick={() => {
                        if (currentQuestion < questions.length - 1) {
                            setCurrentQuestion(curr => curr + 1);
                            setWarning(null);
                        } else {
                            finishQuiz();
                        }
                    }}>
                        {opt}
                    </div>
                ))}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={onLogout} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <LogOut size={14} style={{ marginRight: '8px' }} /> Quit Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
