import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Return leaderboard data derived from completed attempts
export async function GET() {
    try {
        // 1. Get all users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, name');

        const userMap = {};
        if (users) {
            users.forEach(u => userMap[u.email] = u.name);
        }

        // 2. Get completed attempts (selecting specifically known columns)
        let { data: attempts, error: attemptsError } = await supabase
            .from('attempts')
            .select('email, violations, completed, start_time, end_time, score, total_questions')
            .eq('completed', true);

        if (attemptsError) {
            console.error('[Leaderboard API] Query error:', attemptsError.message);
            // Fallback if score/total_questions are missing
            if (attemptsError.code === 'PGRST204' || attemptsError.code === '42703') {
                const { data: fallbackAttempts, error: fallbackError } = await supabase
                    .from('attempts')
                    .select('email, violations, completed, start_time, end_time')
                    .eq('completed', true);
                if (fallbackError) throw fallbackError;
                attempts = fallbackAttempts;
            } else {
                throw attemptsError;
            }
        }

        const leaderboard = (attempts || []).map((attempt) => {
            let timeTaken = 'N/A';
            if (attempt.start_time && attempt.end_time) {
                const start = new Date(attempt.start_time);
                const end = new Date(attempt.end_time);
                const diff = Math.round((end - start) / 1000);
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                timeTaken = `${mins}m ${secs}s`;
            }

            return {
                email: attempt.email,
                name: userMap[attempt.email] || 'Unknown',
                violations: attempt.violations || 0,
                score: attempt.score || 0,
                totalQuestions: attempt.total_questions || 0,
                timeTaken,
                submittedAt: attempt.end_time ? new Date(attempt.end_time).toLocaleString() : '—'
            };
        });

        // Sort by score (desc), then violations (asc), then time taken
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.violations - b.violations;
        });

        // Assign rank
        leaderboard.forEach((entry, i) => entry.rank = i + 1);

        return NextResponse.json({ leaderboard });
    } catch (err) {
        console.error('Leaderboard GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
