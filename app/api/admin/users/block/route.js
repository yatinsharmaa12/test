import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST: Block a user
export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('blocked_users')
            .upsert({ email });

        if (error) throw error;

        await supabase.from('logs').insert({
            action: 'User Blocked',
            user: email,
            details: `User blocked by admin`
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Block POST error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// DELETE: Unblock a user
export async function DELETE(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('email', email);

        if (error) throw error;

        await supabase.from('logs').insert({
            action: 'User Unblocked',
            user: email,
            details: `User unblocked by admin`
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Block DELETE error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
