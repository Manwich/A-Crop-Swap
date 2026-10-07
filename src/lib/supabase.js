import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See README.md.');
}

export const supabase = createClient(url, anonKey);

// Turns a Supabase/Postgres error into a sentence a neighbor can act on.
export function friendlyError(error) {
    if (!error) return '';
    const message = error.message || String(error);
    if (/row-level security|permission denied/i.test(message)) return "You don't have permission to do that.";
    if (/Failed to fetch|NetworkError/i.test(message)) return 'Could not reach the server. Check your connection and try again.';
    return message;
}
