<template>
    <AuthShell v-if="session.recovering" title="Choose a new password">
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <form @submit.prevent="updatePassword" novalidate>
            <label class="field">
                <span class="field__label">New password</span>
                <input v-model="password" class="input" type="password" autocomplete="new-password" minlength="8" required />
                <span class="field__hint">At least 8 characters.</span>
            </label>
            <button class="btn btn--primary btn--block" :disabled="busy">Save password</button>
        </form>
    </AuthShell>

    <AuthShell v-else title="Reset your password" subtitle="We'll email you a link to choose a new one.">
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <div v-if="sent" class="alert alert--success" role="status">
            If an account exists for <strong>{{ email }}</strong>, a reset link is on its way.
        </div>
        <form v-else @submit.prevent="sendLink" novalidate>
            <label class="field">
                <span class="field__label">Email</span>
                <input v-model.trim="email" class="input" type="email" autocomplete="email" required />
            </label>
            <button class="btn btn--primary btn--block" :disabled="busy">Send reset link</button>
        </form>
        <template #footer><RouterLink to="/login">Back to log in</RouterLink></template>
    </AuthShell>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthShell from '../components/AuthShell.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { session } from '../lib/session.js';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);
const sent = ref(false);

async function sendLink() {
    error.value = '';
    if (!/^\S+@\S+\.\S+$/.test(email.value)) return (error.value = 'Enter a valid email address.');
    busy.value = true;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: `${location.origin}/reset-password`,
    });
    busy.value = false;
    if (err) error.value = friendlyError(err);
    else sent.value = true;
}

async function updatePassword() {
    error.value = '';
    if (password.value.length < 8) return (error.value = 'Use a password with at least 8 characters.');
    busy.value = true;
    const { error: err } = await supabase.auth.updateUser({ password: password.value });
    busy.value = false;
    if (err) return (error.value = friendlyError(err));
    session.recovering = false;
    router.replace('/home');
}
</script>
