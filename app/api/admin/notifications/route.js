import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET: Fetch all notifications
export async function GET() {
    try {
        const db = readDB();
        return NextResponse.json({ notifications: db.notifications || [] });
    } catch (err) {
        console.error('Notifications GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create a new notification
export async function POST(request) {
    try {
        const { title, message } = await request.json();

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const db = readDB();
        const notification = {
            id: Date.now(),
            title,
            message,
            timestamp: new Date().toLocaleString(),
            read: false
        };

        db.notifications.push(notification);
        db.logs.push({
            timestamp: new Date().toLocaleString(),
            action: 'Notification Sent',
            user: 'Admin',
            details: `Notification: "${title}"`
        });
        writeDB(db);

        return NextResponse.json({ success: true, notification });
    } catch (err) {
        console.error('Notifications POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
