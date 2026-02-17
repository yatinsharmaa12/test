import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Return quiz questions
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ questions: data || [] });
    } catch (err) {
        console.error('Questions GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Add a new question
export async function POST(request) {
    try {
        const { q, options, correct } = await request.json();

        if (!q || !options || options.length < 2 || correct === undefined) {
            return NextResponse.json({ error: 'Question, options (min 2), and correct answer index are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('questions')
            .insert({
                q,
                options,
                correct: Number(correct)
            })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('logs').insert({
            action: 'Question Added',
            user: 'Admin',
            details: `New question: "${q.substring(0, 50)}..."`
        });

        return NextResponse.json({ success: true, question: data });
    } catch (err) {
        console.error('Questions POST error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// DELETE: Remove a question
export async function DELETE(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        // Fetch question first for logging
        const { data: question } = await supabase
            .from('questions')
            .select('q')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (question) {
            await supabase.from('logs').insert({
                action: 'Question Deleted',
                user: 'Admin',
                details: `Deleted question: "${question.q.substring(0, 50)}..."`
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Questions DELETE error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
