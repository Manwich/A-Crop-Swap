<template>
    <header class="header">
        <a class="skip" href="#main">Skip to content</a>
        <div class="header__inner">
            <RouterLink :to="session.user ? '/home' : '/'" class="logo">
                <LogoMark />
                <span>A Crop Swap</span>
            </RouterLink>

            <button
                class="menu-toggle"
                type="button"
                :aria-expanded="open"
                aria-controls="site-nav"
                @click="open = !open"
            >
                <span class="visually-hidden">Menu</span>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <path v-if="open" d="M6 6l12 12M18 6L6 18" />
                    <path v-else d="M4 7h16M4 12h16M4 17h16" />
                </svg>
            </button>

            <nav id="site-nav" class="nav" :class="{ 'nav--open': open }" aria-label="Main">
                <template v-if="session.user">
                    <RouterLink to="/home" class="nav__link">Backyard Feed</RouterLink>
                    <RouterLink to="/activity" class="nav__link">My Trades</RouterLink>
                    <RouterLink to="/profile" class="nav__link">
                        My Backyard
                        <span v-if="session.neighbor" class="credit-chip" :title="credits(session.neighbor.credit_balance)">
                            <span aria-hidden="true">{{ session.neighbor.credit_balance }}</span>
                            <span class="visually-hidden">({{ credits(session.neighbor.credit_balance) }})</span>
                        </span>
                    </RouterLink>
                    <RouterLink to="/post" class="btn btn--primary btn--sm">Post a listing</RouterLink>
                    <button type="button" class="btn btn--ghost btn--sm" @click="logOut">Log out</button>
                </template>
                <template v-else>
                    <a href="/#how-it-works" class="nav__link">How it works</a>
                    <RouterLink to="/login" class="nav__link">Log in</RouterLink>
                    <RouterLink to="/signup" class="btn btn--primary btn--sm">Sign up</RouterLink>
                </template>
            </nav>
        </div>
    </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LogoMark from './LogoMark.vue';
import { session, signOut } from '../lib/session.js';
import { credits } from '../lib/format.js';

const open = ref(false);
const route = useRoute();
const router = useRouter();
watch(() => route.fullPath, () => (open.value = false));

async function logOut() {
    await signOut();
    router.push('/');
}
</script>

<style scoped>
.header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
}
.skip {
    position: absolute;
    left: -999px;
}
.skip:focus {
    left: 1rem;
    top: 0.5rem;
    background: var(--surface);
    padding: 0.5rem;
    z-index: 20;
}
.header__inner {
    max-width: var(--page-width);
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 800;
    font-size: 1.25rem;
    color: var(--ink);
    text-decoration: none;
}
.logo svg {
    color: var(--brand);
    width: 28px;
    height: 28px;
}
.nav {
    display: flex;
    align-items: center;
    gap: 0.25rem 1rem;
}
.nav__link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--ink-muted);
    font-weight: 500;
    text-decoration: none;
    padding: 0.5rem 0.25rem;
}
.nav__link:hover,
.nav__link.router-link-active {
    color: var(--brand-strong);
}
.credit-chip {
    min-width: 1.5rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 0.8125rem;
    font-weight: 700;
    text-align: center;
}
.menu-toggle {
    display: none;
    background: none;
    border: 0;
    color: var(--ink);
    padding: 0.5rem;
    cursor: pointer;
}

@media (max-width: 820px) {
    .menu-toggle {
        display: inline-flex;
    }
    .nav {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        padding: 0.75rem 1rem 1rem;
        background: var(--surface);
        border-bottom: 1px solid var(--line);
        box-shadow: var(--shadow);
    }
    .nav--open {
        display: flex;
    }
    .nav__link {
        padding: 0.75rem 0.25rem;
    }
}
</style>
