import { reactive } from 'vue';
import { supabase } from './supabase.js';

// Signed-in user plus their Neighbor record (name + credit balance).
export const session = reactive({
    ready: false,
    user: null,
    neighbor: null,
    recovering: false, // true after following a password-reset email link
});

let readyPromise;

export function initSession() {
    readyPromise = (async () => {
        const { data } = await supabase.auth.getSession();
        session.user = data.session?.user ?? null;
        if (session.user) await refreshNeighbor();
        session.ready = true;
    })();

    supabase.auth.onAuthStateChange((event, authSession) => {
        if (event === 'PASSWORD_RECOVERY') session.recovering = true;
        const user = authSession?.user ?? null;
        const changed = user?.id !== session.user?.id;
        session.user = user;
        if (!user) session.neighbor = null;
        // Defer: Supabase deadlocks if you query from inside this callback.
        else if (changed) setTimeout(refreshNeighbor, 0);
    });

    return readyPromise;
}

export function whenSessionReady() {
    return readyPromise;
}

export async function refreshNeighbor() {
    if (!session.user) return null;
    const { data } = await supabase.from('neighbors').select('id, name, credit_balance').maybeSingle();
    session.neighbor = data;
    return data;
}

export async function signOut() {
    await supabase.auth.signOut();
    session.user = null;
    session.neighbor = null;
}
