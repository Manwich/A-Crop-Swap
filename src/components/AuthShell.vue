<template>
    <div class="auth">
        <div class="card auth__card">
            <h1>{{ title }}</h1>
            <p v-if="subtitle" class="muted">{{ subtitle }}</p>
            <slot />
        </div>
        <p v-if="$slots.footer" class="auth__footer"><slot name="footer" /></p>
    </div>
</template>

<script setup>
defineProps({ title: String, subtitle: String });
</script>

<style scoped>
.auth {
    max-width: 440px;
    margin: 0 auto;
    padding: clamp(2rem, 8vw, 4rem) 1rem;
}
.auth__card h1 {
    font-size: 1.625rem;
}
.auth__card > p {
    margin-bottom: 1.5rem;
}
.auth__footer {
    text-align: center;
    margin-top: 1.25rem;
    color: var(--ink-muted);
}
</style>
