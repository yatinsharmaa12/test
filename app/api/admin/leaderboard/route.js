import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { readDB } from '@/lib/db';

// GET: Return leaderboard data derived from completed attempts
export async function GET() {
    try {
        const db = readDB();

        // Get user names from CSV
        const csvPath = path.join(process.cwd(), 'public', 'users.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const { data: users } = Papa.parse(csvText, { header: true });

        const userMap = {};
        users.forEach(u => {
            if (u.email) userMap[u.email] = u.name;
        });

        // Build leaderboard from completed attempts
        const completedAttempts = db.attempts.filter(a => a.completed);
        const leaderboard = completedAttempts.map((attempt, index) => {
            // Calculate time taken if endTime and startTime exist
            let timeTaken = 'N/A';
            if (attempt.startTime && attempt.endTime) {
                const start = new Date(attempt.startTime);
                const end = new Date(attempt.endTime);
                const diff = Math.round((end - start) / 1000);
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                timeTaken = `${mins}m ${secs}s`;
            }

            return {
                rank: index + 1,
                email: attempt.email,
                name: userMap[attempt.email] || 'Unknown',
                violations: attempt.violations || 0,
                timeTaken,
                submittedAt: attempt.endTime || attempt.startTime
            };
        });

        // Sort by violations (fewer = better), then by time taken
        leaderboard.sort((a, b) => a.violations - b.violations);
        leaderboard.forEach((entry, i) => entry.rank = i + 1);

        return NextResponse.json({ leaderboard });
    } catch (err) {
        console.error('Leaderboard GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
