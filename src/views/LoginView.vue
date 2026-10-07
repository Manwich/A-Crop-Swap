<template>
    <AuthShell title="Welcome back" subtitle="Log in to see what your neighbors are sharing.">
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <form @submit.prevent="submit" novalidate>
            <label class="field">
                <span class="field__label">Email</span>
                <input v-model.trim="email" class="input" type="email" autocomplete="email" required />
            </label>
            <label class="field">
                <span class="field__label">Password</span>
                <input v-model="password" class="input" type="password" autocomplete="current-password" required />
            </label>
            <button class="btn btn--primary btn--block" :disabled="busy">{{ busy ? 'Logging in…' : 'Log in' }}</button>
        </form>
        <p class="forgot"><RouterLink to="/reset-password">Forgot your password?</RouterLink></p>
        <template #footer>New here? <RouterLink to="/signup">Create an account</RouterLink></template>
    </AuthShell>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthShell from '../components/AuthShell.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { refreshNeighbor, session } from '../lib/session.js';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
    error.value = '';
    if (!email.value || !password.value) {
        error.value = 'Enter your email and password.';
        return;
    }
    busy.value = true;
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
    busy.value = false;
    if (err) {
        error.value = /invalid login/i.test(err.message) ? 'That email and password don’t match an account.' : friendlyError(err);
        return;
    }
    session.user = data.user;
    await refreshNeighbor();
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/home';
    router.replace(redirect);
}
</script>

<style scoped>
.forgot {
    text-align: center;
    margin: 1rem 0 0;
    font-size: 0.9375rem;
}
</style>
