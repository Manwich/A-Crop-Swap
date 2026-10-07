<template>
    <AuthShell title="Join A Crop Swap" subtitle="Share your backyard harvest and discover what your neighbors grow and make.">
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <div v-if="checkEmail" class="alert alert--success" role="status">
            Almost there! We sent a confirmation link to <strong>{{ email }}</strong>. Open it to finish signing up.
        </div>
        <form v-else @submit.prevent="submit" novalidate>
            <label class="field">
                <span class="field__label">Your name</span>
                <input v-model.trim="name" class="input" type="text" autocomplete="name" required />
                <span class="field__hint">Neighbors see this on your listings.</span>
            </label>
            <label class="field">
                <span class="field__label">Email</span>
                <input v-model.trim="email" class="input" type="email" autocomplete="email" required />
            </label>
            <label class="field">
                <span class="field__label">Password</span>
                <input v-model="password" class="input" type="password" autocomplete="new-password" minlength="8" required />
                <span class="field__hint">At least 8 characters.</span>
            </label>
            <button class="btn btn--primary btn--block" :disabled="busy">{{ busy ? 'Creating account…' : 'Create account' }}</button>
        </form>
        <template #footer>Already a member? <RouterLink to="/login">Log in</RouterLink></template>
    </AuthShell>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthShell from '../components/AuthShell.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { refreshNeighbor, session } from '../lib/session.js';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);
const checkEmail = ref(false);

const ALREADY_REGISTERED = 'An account with this email already exists. Log in instead, or reset your password.';

async function submit() {
    error.value = '';
    if (!name.value) return (error.value = 'Tell your neighbors your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.value)) return (error.value = 'Enter a valid email address.');
    if (password.value.length < 8) return (error.value = 'Use a password with at least 8 characters.');

    busy.value = true;
    const { data, error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { name: name.value, role: 'neighbor' }, emailRedirectTo: `${location.origin}/home` },
    });
    busy.value = false;

    if (err) {
        error.value = /already registered|already exists/i.test(err.message) ? ALREADY_REGISTERED : friendlyError(err);
        return;
    }
    // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
        error.value = ALREADY_REGISTERED;
        return;
    }
    if (data.session) {
        session.user = data.user;
        await refreshNeighbor();
        router.replace('/home');
    } else {
        checkEmail.value = true;
    }
}
</script>
