<template>
    <AppHeader />
    <main id="main">
        <RouterView v-if="session.ready" />
        <div v-else class="spinner" role="status" aria-label="Loading"></div>
    </main>
    <AppFooter />
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import { session } from './lib/session.js';
</script>
