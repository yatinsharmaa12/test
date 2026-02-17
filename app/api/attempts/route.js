import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Return all attempts and session counts
export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { data: attempts, error: attemptsError } = await supabase
            .from('attempts')
            .select('*')
            .order('start_time', { ascending: false });

        const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*');

        const sessionsMap = {};
        if (sessionsData) {
            sessionsData.forEach(s => sessionsMap[s.email] = s.count);
        }

        // Format dates to locale string as expected by frontend
        const formattedAttempts = (attempts || []).map(a => ({
            ...a,
            startTime: a.start_time ? new Date(a.start_time).toLocaleString() : null,
            endTime: a.end_time ? new Date(a.end_time).toLocaleString() : null
        }));

        return NextResponse.json({ attempts: formattedAttempts, sessions: sessionsMap });
    } catch (err) {
        console.error('Attempts GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create a new attempt
export async function POST(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { email } = await request.json();

        const { data, error } = await supabase
            .from('attempts')
            .insert({
                email,
                violations: 0,
                completed: false
            })
            .select()
            .single();

        if (error) throw error;

        // Log the action
        await supabase.from('logs').insert({
            action: 'Quiz Started',
            user: email,
            details: 'User started quiz attempt'
        });

        return NextResponse.json({ success: true, attemptId: data.id });
    } catch (err) {
        console.error('Attempts POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT: Update an existing attempt (violations, completion)
export async function PUT(request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        }
        const { email, violations, completed, score, total_questions } = await request.json();

        // 1. Find the most recent incomplete attempt for this user
        const { data: latestAttempt, error: findError } = await supabase
            .from('attempts')
            .select('*')
            .eq('email', email)
            .eq('completed', false)
            .order('start_time', { ascending: false })
            .limit(1)
            .single();

        if (findError || !latestAttempt) {
            console.error('Find attempt error:', findError);
            return NextResponse.json({ error: 'No active attempt found' }, { status: 404 });
        }

        const updateData = {};
        if (violations !== undefined) updateData.violations = violations;

        // Try to update with score if provided, but handle missing columns gracefully
        if (score !== undefined) updateData.score = score;
        if (total_questions !== undefined) updateData.total_questions = total_questions;

        if (completed) {
            updateData.completed = true;
            updateData.end_time = new Date().toISOString();
            console.log(`[Attempts API] Marking attempt for ${email} as completed. Score: ${score}/${total_questions}`);
        }

        let { error: updateError } = await supabase
            .from('attempts')
            .update(updateData)
            .eq('id', latestAttempt.id);

        if (updateError) {
            console.error('[Attempts API] Update error:', updateError.message);
            // If it failed due to missing columns, try updating only violations and completion
            if (updateError.code === '42703') { // Undefined column
                console.warn('[Attempts API] Missing columns, falling back...');
                const fallbackData = { violations: updateData.violations };
                if (completed) {
                    fallbackData.completed = true;
                    fallbackData.end_time = updateData.end_time;
                }
                const { error: retryError } = await supabase
                    .from('attempts')
                    .update(fallbackData)
                    .eq('id', latestAttempt.id);
                if (retryError) {
                    console.error('[Attempts API] Retry error:', retryError.message);
                    throw retryError;
                }
            } else {
                throw updateError;
            }
        }

        if (completed) {
            // Log completion
            await supabase.from('logs').insert({
                action: 'Quiz Submitted',
                user: email,
                details: `User completed quiz with score ${score}/${total_questions}`
            });
            console.log(`[Attempts API] Successfully submitted quiz for ${email}`);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Attempts PUT error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
