import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Return activity logs
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        // Format timestamp for frontend
        const formatted = (data || []).map(l => ({
            ...l,
            timestamp: new Date(l.timestamp).toLocaleString()
        }));

        return NextResponse.json({ logs: formatted });
    } catch (err) {
        console.error('Logs GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
