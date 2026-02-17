import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// POST: Block a user
export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const db = readDB();

        if (!db.blockedUsers.includes(email)) {
            db.blockedUsers.push(email);
            db.logs.push({
                timestamp: new Date().toLocaleString(),
                action: 'User Blocked',
                user: email,
                details: `User blocked by admin`
            });
            writeDB(db);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Block POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE: Unblock a user
export async function DELETE(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const db = readDB();
        db.blockedUsers = db.blockedUsers.filter(e => e !== email);
        db.logs.push({
            timestamp: new Date().toLocaleString(),
            action: 'User Unblocked',
            user: email,
            details: `User unblocked by admin`
        });
        writeDB(db);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Block DELETE error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
