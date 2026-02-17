import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: List all users with block status
export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');

        const { data: blocked, error: blockedError } = await supabase
            .from('blocked_users')
            .select('email');

        const blockedEmails = new Set((blocked || []).map(b => b.email));

        const usersWithStatus = (users || []).map(u => ({
            ...u,
            blocked: blockedEmails.has(u.email)
        }));

        return NextResponse.json({ users: usersWithStatus });
    } catch (err) {
        console.error('Users GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Add a new user
export async function POST(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { email, password, name, number, location } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('users')
            .insert({ email, password, name, number, location })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'User already exists' }, { status: 409 });
            }
            throw error;
        }

        // Log the action
        await supabase.from('logs').insert({
            action: 'User Added',
            user: email,
            details: `New user "${name}" added by admin`
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Users POST error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
