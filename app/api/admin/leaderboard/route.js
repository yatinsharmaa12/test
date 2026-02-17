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

        // 2. Get completed attempts
        const { data: attempts, error: attemptsError } = await supabase
            .from('attempts')
            .select('*')
            .eq('completed', true);

        if (attemptsError) throw attemptsError;

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
                timeTaken,
                submittedAt: attempt.end_time ? new Date(attempt.end_time).toLocaleString() : '—'
            };
        });

        // Sort by violations (fewer = better), then by time taken
        // We can just use violations for now as primary sort
        leaderboard.sort((a, b) => a.violations - b.violations);

        // Assign rank
        leaderboard.forEach((entry, i) => entry.rank = i + 1);

        return NextResponse.json({ leaderboard });
    } catch (err) {
        console.error('Leaderboard GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
