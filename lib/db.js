import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDB() {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ attempts: [], sessions: {}, notifications: [], blockedUsers: [], logs: [], questions: [] }, null, 2));
        }
    } catch (err) {
        console.warn('DB initialization warning (expected on Vercel):', err.message);
    }
}

export function readDB() {
    try {
        ensureDB();
        if (!fs.existsSync(DB_PATH)) return { attempts: [], sessions: {}, notifications: [], blockedUsers: [], logs: [], questions: [] };
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('DB Read error:', err);
        return { attempts: [], sessions: {}, notifications: [], blockedUsers: [], logs: [], questions: [] };
    }
}

export function writeDB(data) {
    try {
        ensureDB();
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('DB Write error (persistence will fail on Vercel):', err.message);
        // On Vercel, we can't write to the filesystem. 
        // For local development it works, for Vercel it will log this error but not crash the app.
    }
}
