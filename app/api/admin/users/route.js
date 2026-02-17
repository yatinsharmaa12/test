import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { readDB, writeDB } from '@/lib/db';

// GET: List all users with block status
export async function GET() {
    try {
        const csvPath = path.join(process.cwd(), 'public', 'users.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const { data: users } = Papa.parse(csvText, { header: true });
        const db = readDB();

        const usersWithStatus = users
            .filter(u => u.email)
            .map(u => ({
                email: u.email,
                name: u.name,
                number: u.number,
                location: u.location,
                blocked: db.blockedUsers.includes(u.email)
            }));

        return NextResponse.json({ users: usersWithStatus });
    } catch (err) {
        console.error('Users GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Add a new user to CSV
export async function POST(request) {
    try {
        const { email, password, name, number, location } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
        }

        const csvPath = path.join(process.cwd(), 'public', 'users.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const { data: users } = Papa.parse(csvText, { header: true });

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Append new user
        const newLine = `\n${email},${password},${name},${number || ''},${location || ''}`;
        fs.appendFileSync(csvPath, newLine);

        // Log the action
        const db = readDB();
        db.logs.push({
            timestamp: new Date().toLocaleString(),
            action: 'User Added',
            user: email,
            details: `New user "${name}" added by admin`
        });
        writeDB(db);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Users POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
