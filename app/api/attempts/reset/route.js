import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        // Danger: Clears all quiz data
        await supabase.from('attempts').delete().neq('id', 0); // Delete all attempts
        await supabase.from('sessions').delete().neq('count', -1); // Delete all sessions
        await supabase.from('logs').insert({
            action: 'System Reset',
            user: 'Admin',
            details: 'All quiz attempts and sessions have been cleared.'
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Reset error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
