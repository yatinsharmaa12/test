import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

// GET: Return activity logs
export async function GET() {
    try {
        const db = readDB();
        const logs = (db.logs || []).slice().reverse();
        return NextResponse.json({ logs });
    } catch (err) {
        console.error('Logs GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
