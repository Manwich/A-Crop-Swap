<template>
    <div class="page">
        <div class="page-head">
            <div>
                <h1>Backyard Feed</h1>
                <p>Everything your neighbors are sharing, ready now or still ripening.</p>
            </div>
            <RouterLink to="/post" class="btn btn--primary">Post a listing</RouterLink>
        </div>

        <div class="filters" role="group" aria-label="Filter listings">
            <label class="filters__search">
                <span class="visually-hidden">Search listings</span>
                <input v-model.trim="search" class="input" type="search" placeholder="Search plums, jam, scarves…" />
            </label>
            <select v-model="type" class="select" aria-label="Type">
                <option value="">All types</option>
                <option value="fruit">Fruit</option>
                <option value="handmade">Handmade</option>
            </select>
            <select v-model="availability" class="select" aria-label="Availability">
                <option value="">Any availability</option>
                <option value="available_now">Available now</option>
                <option value="future">Ripening (reserve)</option>
            </select>
        </div>

        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <div v-if="loading" class="spinner" role="status" aria-label="Loading listings"></div>
        <div v-else-if="!listings.length" class="empty">
            <h2>No listings yet</h2>
            <p>Be the first on your block to share something.</p>
            <RouterLink to="/post" class="btn btn--primary">Post a listing</RouterLink>
        </div>
        <div v-else-if="!filtered.length" class="empty">
            <p>No listings match those filters.</p>
            <button class="btn btn--ghost" type="button" @click="clearFilters">Clear filters</button>
        </div>
        <div v-else class="grid">
            <ListingCard v-for="l in filtered" :key="l.id" :listing="l" :poster-name="names[l.poster_id]" :cover-url="covers[l.id]" />
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ListingCard from '../components/ListingCard.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { loadNames } from '../lib/format.js';
import { loadCovers } from '../lib/photos.js';

const listings = ref([]);
const names = ref({});
const covers = ref({});
const loading = ref(true);
const error = ref('');
const search = ref('');
const type = ref('');
const availability = ref('');

const filtered = computed(() => {
    const q = search.value.toLowerCase();
    return listings.value.filter(
        l =>
            (!type.value || l.type === type.value) &&
            (!availability.value || l.availability === availability.value) &&
            (!q || `${l.title} ${l.description || ''}`.toLowerCase().includes(q))
    );
});

function clearFilters() {
    search.value = '';
    type.value = '';
    availability.value = '';
}

onMounted(async () => {
    const { data, error: err } = await supabase
        .from('listings')
        .select('id, title, description, type, availability, poster_id, created_at')
        .order('created_at', { ascending: false });
    if (err) error.value = friendlyError(err);
    listings.value = data || [];
    [names.value, covers.value] = await Promise.all([
        loadNames(supabase, listings.value.map(l => l.poster_id)),
        loadCovers(listings.value.map(l => l.id)),
    ]);
    loading.value = false;
});
</script>

<style scoped>
.filters {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}
@media (max-width: 640px) {
    .filters {
        grid-template-columns: 1fr 1fr;
    }
    .filters__search {
        grid-column: 1 / -1;
    }
}
</style>
