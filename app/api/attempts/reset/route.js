import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';

export async function POST() {
    try {
        writeDB({ attempts: [], sessions: {} });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Reset error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
