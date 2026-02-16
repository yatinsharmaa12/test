import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { readDB, writeDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { email, password, searchOnly } = await request.json();

        // Read and parse CSV
        const csvPath = path.join(process.cwd(), 'public', 'users.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const { data: users } = Papa.parse(csvText, { header: true });

        const user = users.find(u => u.email === email);

        // Search-only mode: return profile info without auth
        if (searchOnly) {
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            return NextResponse.json({ name: user.name, number: user.number, location: user.location, email: user.email });
        }

        // Auth mode
        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Check session limit
        const db = readDB();
        const sessionCount = db.sessions[email] || 0;

        if (sessionCount >= 2) {
            return NextResponse.json({ error: 'Login limit reached (Max 2 sessions allowed)' }, { status: 403 });
        }

        // Check if already completed
        const hasCompleted = db.attempts.some(a => a.email === email && a.completed);
        if (hasCompleted) {
            return NextResponse.json({ error: 'You have already submitted this quiz. Re-attempts are not allowed.' }, { status: 403 });
        }

        // Increment session
        db.sessions[email] = sessionCount + 1;
        writeDB(db);

        return NextResponse.json({
            email: user.email,
            name: user.name,
            number: user.number,
            location: user.location,
            sessionCount: sessionCount + 1
        });
    } catch (err) {
        console.error('Login API error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
