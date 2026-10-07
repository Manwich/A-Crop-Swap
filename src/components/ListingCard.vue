<template>
    <RouterLink :to="`/listings/${listing.id}`" class="listing-card">
        <img v-if="coverUrl" class="listing-card__photo" :src="coverUrl" :alt="listing.title" loading="lazy" />
        <div v-else class="listing-card__art" :class="`listing-card__art--${listing.type}`" aria-hidden="true">
            {{ listing.type === 'fruit' ? '🍑' : '🧶' }}
        </div>
        <div class="listing-card__body">
            <div class="listing-card__badges">
                <span class="badge" :class="`badge--${listing.type}`">{{ TYPE_LABELS[listing.type] }}</span>
                <span class="badge" :class="listing.availability === 'future' ? 'badge--warning' : 'badge--success'">
                    {{ AVAILABILITY_LABELS[listing.availability] }}
                </span>
            </div>
            <h3>{{ listing.title }}</h3>
            <p v-if="listing.description" class="listing-card__desc">{{ listing.description }}</p>
            <p class="listing-card__meta">
                <template v-if="posterName">by {{ posterName }} · </template>{{ shortDate(listing.created_at) }}
            </p>
        </div>
    </RouterLink>
</template>

<script setup>
import { TYPE_LABELS, AVAILABILITY_LABELS, shortDate } from '../lib/format.js';

defineProps({
    listing: { type: Object, required: true },
    posterName: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
});
</script>

<style scoped>
.listing-card {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    box-shadow: var(--shadow);
    transition: transform 0.15s, box-shadow 0.15s;
}
.listing-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgb(17 24 39 / 0.1);
}
.listing-card__photo {
    display: block;
    width: 100%;
    height: 168px;
    object-fit: cover;
    background: var(--surface-sunken);
}
.listing-card__art {
    display: grid;
    place-items: center;
    height: 168px;
    font-size: 2.75rem;
}
.listing-card__art--fruit {
    background: var(--app-cat-1-soft);
}
.listing-card__art--handmade {
    background: var(--app-cat-2-soft);
}
.listing-card__body {
    padding: 1rem 1.125rem 1.125rem;
}
.listing-card__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.625rem;
}
.listing-card__desc {
    color: var(--ink-muted);
    font-size: 0.9375rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0.5rem;
}
.listing-card__meta {
    color: var(--ink-subtle);
    font-size: 0.8125rem;
    margin: 0;
}
</style>
