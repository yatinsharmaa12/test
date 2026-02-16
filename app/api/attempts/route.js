import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET: Return all attempts
export async function GET() {
    try {
        const db = readDB();
        return NextResponse.json({ attempts: db.attempts, sessions: db.sessions });
    } catch (err) {
        console.error('Attempts GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create a new attempt
export async function POST(request) {
    try {
        const { email } = await request.json();
        const db = readDB();

        db.attempts.push({
            email,
            startTime: new Date().toLocaleString(),
            violations: 0,
            completed: false
        });

        writeDB(db);
        return NextResponse.json({ success: true, attemptIndex: db.attempts.length - 1 });
    } catch (err) {
        console.error('Attempts POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT: Update an existing attempt (violations, completion)
export async function PUT(request) {
    try {
        const { email, violations, completed } = await request.json();
        const db = readDB();

        // Find the most recent incomplete attempt for this user
        let idx = -1;
        for (let i = db.attempts.length - 1; i >= 0; i--) {
            if (db.attempts[i].email === email && !db.attempts[i].completed) {
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            return NextResponse.json({ error: 'No active attempt found' }, { status: 404 });
        }

        if (violations !== undefined) {
            db.attempts[idx].violations = violations;
        }
        if (completed) {
            db.attempts[idx].completed = true;
            db.attempts[idx].endTime = new Date().toLocaleString();
        }

        writeDB(db);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Attempts PUT error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
