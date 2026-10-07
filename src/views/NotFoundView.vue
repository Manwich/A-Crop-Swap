<template>
    <div class="page page--narrow">
        <div class="empty">
            <h1>Nothing growing here</h1>
            <p>That page doesn't exist. It may have been moved or removed.</p>
            <RouterLink :to="session.user ? '/home' : '/'" class="btn btn--primary">Back to safety</RouterLink>
        </div>
    </div>
</template>

<script setup>
import { session } from '../lib/session.js';
</script>
