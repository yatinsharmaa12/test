import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Fetch all notifications
export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        // Format timestamp for frontend
        const formatted = (data || []).map(n => ({
            ...n,
            timestamp: new Date(n.timestamp).toLocaleString()
        }));

        return NextResponse.json({ notifications: formatted });
    } catch (err) {
        console.error('Notifications GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create a new notification
export async function POST(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { title, message } = await request.json();

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert({ title, message })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('logs').insert({
            action: 'Notification Sent',
            user: 'Admin',
            details: `Notification: "${title}"`
        });

        return NextResponse.json({ success: true, notification: { ...data, timestamp: new Date(data.timestamp).toLocaleString() } });
    } catch (err) {
        console.error('Notifications POST error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
