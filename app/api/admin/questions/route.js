import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET: Return quiz questions
export async function GET() {
    try {
        const db = readDB();
        return NextResponse.json({ questions: db.questions || [] });
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

        const db = readDB();
        const maxId = db.questions.reduce((max, question) => Math.max(max, question.id || 0), 0);

        const question = {
            id: maxId + 1,
            q,
            options,
            correct: Number(correct)
        };

        db.questions.push(question);
        db.logs.push({
            timestamp: new Date().toLocaleString(),
            action: 'Question Added',
            user: 'Admin',
            details: `New question: "${q.substring(0, 50)}..."`
        });
        writeDB(db);

        return NextResponse.json({ success: true, question });
    } catch (err) {
        console.error('Questions POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE: Remove a question
export async function DELETE(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        const db = readDB();
        const questionIdx = db.questions.findIndex(q => q.id === id);

        if (questionIdx === -1) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        const removed = db.questions.splice(questionIdx, 1)[0];
        db.logs.push({
            timestamp: new Date().toLocaleString(),
            action: 'Question Deleted',
            user: 'Admin',
            details: `Deleted question: "${removed.q.substring(0, 50)}..."`
        });
        writeDB(db);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Questions DELETE error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
