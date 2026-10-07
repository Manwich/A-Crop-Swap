<template>
    <footer class="footer">
        <div class="footer__inner">
            <span class="footer__brand"><LogoMark /> A Crop Swap</span>
            <span>Share more. Waste less. Live local.</span>
        </div>
    </footer>
</template>

<script setup>
import LogoMark from './LogoMark.vue';
</script>

<style scoped>
.footer {
    border-top: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink-subtle);
    font-size: 0.875rem;
}
.footer__inner {
    max-width: var(--page-width);
    margin: 0 auto;
    padding: 1.5rem 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    justify-content: space-between;
}
.footer__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 600;
    color: var(--ink-muted);
}
.footer__brand svg {
    color: var(--brand);
    width: 18px;
    height: 18px;
}
</style>
