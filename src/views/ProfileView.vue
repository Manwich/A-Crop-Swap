<template>
    <div class="page">
        <div v-if="!neighbor" class="spinner" role="status" aria-label="Loading profile"></div>
        <template v-else>
            <div class="summary card">
                <div class="avatar" aria-hidden="true">{{ initials }}</div>
                <div class="summary__who">
                    <template v-if="!editingName">
                        <h1>{{ neighbor.name }}</h1>
                        <p class="muted">{{ session.user?.email }}</p>
                        <button class="btn btn--ghost btn--sm" type="button" @click="startEdit">Edit name</button>
                    </template>
                    <form v-else class="name-form" @submit.prevent="saveName">
                        <label class="visually-hidden" for="name">Your name</label>
                        <input id="name" v-model.trim="nameDraft" class="input" type="text" maxlength="80" required />
                        <button class="btn btn--primary btn--sm" :disabled="busy">Save</button>
                        <button class="btn btn--ghost btn--sm" type="button" @click="editingName = false">Cancel</button>
                    </form>
                    <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
                </div>
                <div class="balance">
                    <span class="balance__number">{{ neighbor.credit_balance }}</span>
                    <span class="balance__label">{{ neighbor.credit_balance === 1 ? 'credit' : 'credits' }}</span>
                    <span class="balance__hint">Earn by giving · spend to reserve</span>
                </div>
            </div>

            <div class="page-head listings-head">
                <h2>My listings <span class="muted">({{ listings.length }})</span></h2>
                <RouterLink to="/post" class="btn btn--primary btn--sm">Post a listing</RouterLink>
            </div>
            <div v-if="loading" class="spinner" role="status" aria-label="Loading listings"></div>
            <div v-else-if="!listings.length" class="empty">
                <p>You haven't posted anything yet. Share some fruit to earn your first credit.</p>
                <RouterLink to="/post" class="btn btn--primary">Post your first listing</RouterLink>
            </div>
            <div v-else class="grid">
                <ListingCard v-for="l in listings" :key="l.id" :listing="l" />
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ListingCard from '../components/ListingCard.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { session, refreshNeighbor } from '../lib/session.js';

const listings = ref([]);
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const editingName = ref(false);
const nameDraft = ref('');

const neighbor = computed(() => session.neighbor);
const initials = computed(() =>
    (neighbor.value?.name || '?')
        .split(/\s+/)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
);

function startEdit() {
    nameDraft.value = neighbor.value.name;
    editingName.value = true;
}

async function saveName() {
    if (!nameDraft.value) return (error.value = 'Your name can’t be empty.');
    busy.value = true;
    error.value = '';
    const { error: err } = await supabase.from('neighbors').update({ name: nameDraft.value }).eq('id', neighbor.value.id);
    busy.value = false;
    if (err) return (error.value = friendlyError(err));
    await refreshNeighbor();
    editingName.value = false;
}

onMounted(async () => {
    const n = session.neighbor || (await refreshNeighbor());
    if (n) {
        // Only your own listings (A-32, A-33).
        const { data, error: err } = await supabase
            .from('listings')
            .select('id, title, description, type, availability, poster_id, created_at')
            .eq('poster_id', n.id)
            .order('created_at', { ascending: false });
        if (err) error.value = friendlyError(err);
        listings.value = data || [];
    }
    loading.value = false;
});
</script>

<style scoped>
.summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem 1.5rem;
}
.avatar {
    flex: none;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-weight: 800;
    font-size: 1.5rem;
}
.summary__who {
    flex: 1 1 220px;
    min-width: 0;
}
.summary__who h1 {
    margin-bottom: 0.125rem;
}
.summary__who p {
    margin-bottom: 0.5rem;
}
.name-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.name-form .input {
    flex: 1 1 200px;
}
.balance {
    display: grid;
    justify-items: center;
    padding: 1rem 1.5rem;
    border-radius: var(--radius);
    background: var(--brand-soft);
    color: var(--brand-strong);
    text-align: center;
}
.balance__number {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
}
.balance__label {
    font-weight: 600;
}
.balance__hint {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}
.listings-head {
    margin-top: 2.5rem;
    align-items: center;
}
.listings-head h2 {
    margin: 0;
}
</style>
