'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize, AlertTriangle, CheckCircle, PlayCircle, Clock, Monitor, RefreshCw } from 'lucide-react';

export default function QuizPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warning, setWarning] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(600);
    const [isMultiScreen, setIsMultiScreen] = useState(false);

    // Load user from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('quiz_user');
        if (!stored) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(stored));
    }, [router]);

    // Sync violations to server
    useEffect(() => {
        if (!quizStarted || !user || isSubmitting) return;

        const syncViolations = async () => {
            try {
                await fetch('/api/attempts', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, violations: violationCount })
                });
            } catch (err) {
                console.error('Failed to sync violations', err);
            }
        };

        syncViolations();
    }, [violationCount, quizStarted, user]);

    // Timer
    useEffect(() => {
        if (!quizStarted || timeLeft <= 0) {
            if (timeLeft === 0 && quizStarted) finishQuiz();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [quizStarted, timeLeft]);

    // Multi-screen detection
    useEffect(() => {
        const checkMultiScreen = () => {
            if (window.screen.isExtended !== undefined) {
                setIsMultiScreen(window.screen.isExtended);
            }
        };
        checkMultiScreen();
        window.addEventListener('resize', checkMultiScreen);
        return () => window.removeEventListener('resize', checkMultiScreen);
    }, []);

    const [questions, setQuestions] = useState([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

    // Fetch questions from Supabase
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const res = await fetch('/api/admin/questions');
                const data = await res.json();
                if (data.questions) {
                    setQuestions(data.questions);
                }
            } catch (err) {
                console.error('Failed to load questions', err);
            } finally {
                setIsLoadingQuestions(false);
            }
        };
        loadQuestions();
    }, []);

    const enterFullscreen = async () => {
        if (isMultiScreen) {
            alert("Please disconnect additional monitors to start the quiz.");
            return;
        }

        try {
            await document.documentElement.requestFullscreen();

            // Create attempt on server
            await fetch('/api/attempts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            setQuizStarted(true);
        } catch (err) {
            console.warn("Fullscreen request failed:", err);
        }
    };

    // Anti-cheating listeners
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
            setWarning("Action blocked: Activity restricted.");
            setTimeout(() => setWarning(null), 3000);
        };

        const handleKeyDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setWarning("Keyboard input is disabled during the exam.");
            setTimeout(() => setWarning(null), 2000);
            return false;
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('contextmenu', preventDefault);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('contextmenu', preventDefault);
        };
    }, [quizStarted, isFullscreen]);

    // Fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
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

    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const finishQuiz = async (finalAnswers = answers) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Calculate score
        let score = 0;
        console.log('[Quiz] Calculating score for answers:', finalAnswers);
        questions.forEach((q, idx) => {
            const selected = finalAnswers[idx];
            const correct = q.correct;
            const isCorrect = (selected == correct);
            console.log(`[Quiz] Q${idx + 1}: Selected=${selected}, Correct=${correct}, Result=${isCorrect}`);
            if (isCorrect) {
                score++;
            }
        });
        console.log(`[Quiz] Final Title Score: ${score}/${questions.length}`);

        try {
            console.log('[Quiz] Submitting to /api/attempts...', { email: user.email, score });
            const res = await fetch('/api/attempts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    violations: violationCount,
                    completed: true,
                    score: score,
                    total_questions: questions.length
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Submission failed:', errorData.error);
                setWarning(`Critical: Submission failed (${errorData.error}). Please notify admin.`);
                setIsSubmitting(false); // Let them try again
                return;
            }

            // Success! Wait a tiny bit to ensure state/network settles
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            console.error('Failed to submit quiz', err);
            setWarning(`Submission error: ${err.message}. Please check your connection.`);
            setIsSubmitting(false);
            return;
        } finally {
            // Remove state check that was blocking redirect due to stale closure
            sessionStorage.removeItem('quiz_user');
            router.push('/');
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!user || isLoadingQuestions) return (
        <div className="app-main">
            <div className="glass-card animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <RefreshCw size={32} className="rotating" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p>Preparing Secure Environment...</p>
            </div>
        </div>
    );

    if (isMultiScreen && !quizStarted) {
        return (
            <div className="app-main">
                <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', textAlign: 'center', borderColor: 'var(--danger)' }}>
                    <Monitor size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ color: 'var(--danger)' }}>Multi-Screen Detected</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>Please disconnect additional monitors and refresh.</p>
                </div>
            </div>
        );
    }

    if (!quizStarted || !isFullscreen) {
        return (
            <div className="app-main">
                <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <Maximize size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                    <h2>Security Check</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
                        • Keyboard Disabled • 10m Timer • 1 Attempt Only
                    </p>
                    <button className="btn" onClick={enterFullscreen}>
                        <PlayCircle size={20} style={{ marginRight: '10px' }} />
                        Start Secure Exam
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-main">
            <div className="quiz-container animate-fade-in">
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Question {currentQuestion + 1} / {questions.length}</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-main)', fontWeight: 'bold' }}>
                                <Clock size={16} style={{ marginRight: '6px' }} />
                                {formatTime(timeLeft)}
                            </div>
                            <div style={{ padding: '4px 12px', background: violationCount > 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: violationCount > 3 ? 'var(--danger)' : 'var(--text-muted)', borderRadius: '20px', fontSize: '0.8rem' }}>
                                Violations: {violationCount}
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
                        <div
                            key={i}
                            className={`option-card ${answers[currentQuestion] == i ? 'selected' : ''}`}
                            onClick={() => {
                                console.log(`[Quiz] Selecting option ${i} for question ${currentQuestion}`);
                                setAnswers(prev => ({ ...prev, [currentQuestion]: i }));
                                setWarning(null);
                            }}
                        >
                            {opt}
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                        <button
                            className="btn-outline"
                            onClick={() => setCurrentQuestion(curr => Math.max(0, curr - 1))}
                            disabled={currentQuestion === 0}
                            style={{ opacity: currentQuestion === 0 ? 0.3 : 1, width: 'auto', minWidth: '120px' }}
                        >
                            Previous
                        </button>

                        {currentQuestion < questions.length - 1 ? (
                            <button
                                className="btn"
                                onClick={() => setCurrentQuestion(curr => curr + 1)}
                                style={{ width: 'auto', minWidth: '120px' }}
                            >
                                Next Question
                            </button>
                        ) : (
                            <button
                                className="btn"
                                style={{ background: '#16a34a', width: 'auto', minWidth: '140px' }}
                                onClick={() => finishQuiz()}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <RefreshCw size={16} className="rotating" /> : 'Submit Quiz'}
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <span>User: {user.email}</span>
                            <span>Selected: {answers[currentQuestion] !== undefined ? `Option ${answers[currentQuestion] + 1}` : 'None'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
