import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { email, password, searchOnly } = await request.json();

        // 1. Fetch user from Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('Fetch user error:', userError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Search-only mode: return profile info without auth
        if (searchOnly) {
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
            return NextResponse.json({ name: user.name, number: user.number, location: user.location, email: user.email });
        }

        // Auth mode
        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // 2. Check if user is blocked
        const { data: blocked, error: blockedError } = await supabase
            .from('blocked_users')
            .select('email')
            .eq('email', email)
            .single();

        if (blocked) {
            return NextResponse.json({ error: 'Your account has been blocked or restricted by the admin.' }, { status: 403 });
        }

        // 3. Check session limit
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('count')
            .eq('email', email)
            .single();

        const sessionCount = session ? session.count : 0;

        if (sessionCount >= 2) {
            return NextResponse.json({ error: 'Login limit reached (Max 2 sessions allowed)' }, { status: 403 });
        }

        // 4. Check if already completed
        const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .select('id')
            .eq('email', email)
            .eq('completed', true)
            .limit(1);

        if (attempt && attempt.length > 0) {
            return NextResponse.json({ error: 'You have already submitted this quiz. Re-attempts are not allowed.' }, { status: 403 });
        }

        // 5. Increment session count
        if (session) {
            await supabase.from('sessions').update({ count: sessionCount + 1 }).eq('email', email);
        } else {
            await supabase.from('sessions').insert({ email, count: 1 });
        }

        // 6. Log the action
        await supabase.from('logs').insert({
            action: 'Login Successful',
            user: email,
            details: 'User logged in to student portal'
        });

        return NextResponse.json({
            email: user.email,
            name: user.name,
            number: user.number,
            location: user.location,
            sessionCount: sessionCount + 1
        });
    } catch (err) {
        console.error('Login API error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
