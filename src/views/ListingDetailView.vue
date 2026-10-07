<template>
    <div class="page page--narrow">
        <RouterLink to="/home" class="back">← Backyard Feed</RouterLink>

        <div v-if="loading" class="spinner" role="status" aria-label="Loading listing"></div>

        <div v-else-if="!listing" class="empty">
            <h1>Listing not found</h1>
            <p>It may have been removed by the neighbor who posted it.</p>
            <RouterLink to="/home" class="btn btn--primary">Browse the feed</RouterLink>
        </div>

        <template v-else>
            <div v-if="notice" class="alert alert--success" role="status">{{ notice }}</div>
            <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>

            <article v-if="!editing" class="card">
                <PhotoGallery v-if="photos.length" :photos="photos" :title="listing.title" />
                <div v-else class="art" :class="`art--${listing.type}`" aria-hidden="true">{{ listing.type === 'fruit' ? '🍑' : '🧶' }}</div>
                <div class="badges">
                    <span class="badge" :class="`badge--${listing.type}`">{{ TYPE_LABELS[listing.type] }}</span>
                    <span class="badge" :class="listing.availability === 'future' ? 'badge--warning' : 'badge--success'">
                        {{ AVAILABILITY_LABELS[listing.availability] }}
                    </span>
                </div>
                <h1>{{ listing.title }}</h1>
                <p class="muted">Posted by {{ isMine ? 'you' : posterName || 'a neighbor' }} · {{ shortDate(listing.created_at) }}</p>
                <p v-if="listing.description" class="desc">{{ listing.description }}</p>

                <div v-if="isMine" class="actions">
                    <button class="btn btn--outline" type="button" @click="editing = true">Edit listing</button>
                    <button class="btn btn--danger" type="button" :disabled="busy" @click="remove">Remove</button>
                </div>
            </article>

            <div v-else class="card">
                <h2>Edit listing</h2>
                <ListingForm :initial="listing" submit-label="Save changes" :busy="busy" :error="error" @submit="save">
                    <template #actions>
                        <button class="btn btn--ghost" type="button" @click="editing = false">Cancel</button>
                    </template>
                </ListingForm>
            </div>

            <PhotoManager v-if="isMine && !editing" :listing-id="listing.id" :title="listing.title" :photos="photos" @changed="refreshPhotos" />

            <!-- Poster: what's happening with this listing -->
            <section v-if="isMine && !editing" class="card">
                <h2>Trades on this listing</h2>
                <p v-if="!posterTrades" class="muted">
                    No one has {{ listing.availability === 'future' ? 'reserved' : 'asked for' }} this yet.
                </p>
                <p v-else class="muted">{{ posterTrades }}</p>
                <RouterLink to="/activity" class="btn btn--outline btn--sm">Manage in My Trades</RouterLink>
            </section>

            <!-- Someone else's ripening listing: reserve it -->
            <section v-else-if="!isMine && listing.availability === 'future'" class="card">
                <h2>Reserve this harvest</h2>
                <template v-if="myReservation">
                    <p>
                        You reserved this.
                        <span class="badge" :class="`badge--${RESERVATION_STATUS[myReservation.status].tone}`">
                            {{ RESERVATION_STATUS[myReservation.status].label }}
                        </span>
                    </p>
                    <RouterLink to="/activity" class="btn btn--outline btn--sm">View in My Trades</RouterLink>
                </template>
                <template v-else-if="reservedByOther">
                    <p class="muted">Another neighbor has already reserved this. Check back later in case it frees up.</p>
                </template>
                <template v-else>
                    <p class="muted">
                        It isn't ripe yet. Reserving costs <strong>1 credit</strong>, taken now. If it never ripens or
                        you cancel, the credit comes back to you.
                    </p>
                    <p>You have <strong>{{ credits(balance) }}</strong>.</p>
                    <button class="btn btn--primary" type="button" :disabled="busy || balance < 1" @click="reserve">
                        Reserve for 1 credit
                    </button>
                    <p v-if="balance < 1" class="hint">
                        You need a credit first. Give something away by
                        <RouterLink to="/post">posting a listing</RouterLink> and completing a trade.
                    </p>
                </template>
            </section>

            <!-- Someone else's available-now listing: direct exchange -->
            <section v-else-if="!isMine" class="card">
                <h2>Get this from {{ posterName || 'your neighbor' }}</h2>
                <template v-if="myExchange">
                    <ol class="checklist">
                        <li :class="{ done: true }">You asked for it</li>
                        <li :class="{ done: myExchange.receiver_confirmed }">You confirm you received it</li>
                        <li :class="{ done: myExchange.giver_confirmed }">{{ posterName || 'The giver' }} confirms they handed it over</li>
                    </ol>
                    <p class="muted">Arrange the handoff with your neighbor, then confirm here. Once you both confirm, they earn 1 credit.</p>
                    <button v-if="!myExchange.receiver_confirmed" class="btn btn--primary" type="button" :disabled="busy" @click="confirmReceived">
                        I received it
                    </button>
                    <p v-else class="muted">Waiting for {{ posterName || 'the giver' }} to confirm.</p>
                </template>
                <template v-else-if="completedExchange">
                    <p>✅ Trade complete. Enjoy!</p>
                </template>
                <template v-else>
                    <p class="muted">
                        It's ready now and free to you. Once you've picked it up, you both confirm the exchange and
                        {{ posterName || 'the giver' }} earns 1 credit.
                    </p>
                    <button class="btn btn--primary" type="button" :disabled="busy" @click="requestExchange">I'd like this</button>
                </template>
            </section>
        </template>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ListingForm from '../components/ListingForm.vue';
import PhotoGallery from '../components/PhotoGallery.vue';
import PhotoManager from '../components/PhotoManager.vue';
import { loadPhotos, removeAllFiles } from '../lib/photos.js';
import { supabase, friendlyError } from '../lib/supabase.js';
import { session, refreshNeighbor } from '../lib/session.js';
import { TYPE_LABELS, AVAILABILITY_LABELS, RESERVATION_STATUS, credits, shortDate, loadNames } from '../lib/format.js';
import { startExchange, confirmExchange, reserveListing } from '../lib/trades.js';

const route = useRoute();
const router = useRouter();

const listing = ref(null);
const posterName = ref('');
const exchanges = ref([]);
const reservations = ref([]);
const photos = ref([]);
const reservedByOther = ref(false);
const loading = ref(true);
const busy = ref(false);
const editing = ref(false);
const error = ref('');
const notice = ref('');

const me = computed(() => session.neighbor?.id);
const balance = computed(() => session.neighbor?.credit_balance ?? 0);
const isMine = computed(() => listing.value && listing.value.poster_id === me.value);
const myExchange = computed(() => exchanges.value.find(e => e.receiver_id === me.value && !e.credited));
const completedExchange = computed(() => exchanges.value.find(e => e.receiver_id === me.value && e.credited));
const myReservation = computed(() =>
    reservations.value.find(r => r.reserver_id === me.value && ['reserved', 'ready'].includes(r.status))
);
const posterTrades = computed(() => {
    const openEx = exchanges.value.filter(e => !e.credited).length;
    const active = reservations.value.filter(r => ['reserved', 'ready'].includes(r.status)).length;
    const parts = [];
    if (openEx) parts.push(`${openEx} open exchange${openEx === 1 ? '' : 's'} waiting on confirmation`);
    if (active) parts.push('an active reservation');
    return parts.join(' and ');
});

async function load() {
    loading.value = true;
    error.value = '';
    if (!session.neighbor) await refreshNeighbor();
    const id = route.params.id;
    const { data, error: err } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
    if (err && !/invalid input syntax/i.test(err.message)) error.value = friendlyError(err);
    listing.value = data;
    if (data) {
        const [names, ex, res, active, pics] = await Promise.all([
            loadNames(supabase, [data.poster_id]),
            supabase.from('exchanges').select('*').eq('listing_id', id),
            supabase.from('reservations').select('*').eq('listing_id', id),
            supabase.rpc('listing_has_active_reservation', { p_listing_id: id }),
            loadPhotos(id),
        ]);
        photos.value = pics.photos;
        posterName.value = names[data.poster_id] || '';
        exchanges.value = ex.data || [];
        reservations.value = res.data || [];
        reservedByOther.value = !!active.data;
    }
    loading.value = false;
}

async function refreshPhotos() {
    photos.value = (await loadPhotos(listing.value.id)).photos;
}

async function run(action, successMessage) {
    busy.value = true;
    error.value = '';
    notice.value = '';
    const { error: err } = await action();
    busy.value = false;
    if (err) return (error.value = err);
    notice.value = successMessage;
    await load();
}

const reserve = () => run(() => reserveListing(listing.value.id), 'Reserved! 1 credit was used. You’ll see it in My Trades.');
const requestExchange = () => run(() => startExchange(listing.value.id), 'Request sent. Arrange the handoff, then confirm below.');
const confirmReceived = () => run(() => confirmExchange(myExchange.value.id), 'Thanks for confirming!');

async function save(form) {
    if (!form.title) return (error.value = 'Give your listing a title.');
    busy.value = true;
    error.value = '';
    const { error: err } = await supabase
        .from('listings')
        .update({ title: form.title, type: form.type, availability: form.availability, description: form.description || null })
        .eq('id', listing.value.id);
    busy.value = false;
    if (err) return (error.value = friendlyError(err));
    editing.value = false;
    notice.value = 'Listing updated.';
    await load();
}

async function remove() {
    if (!confirm('Remove this listing? Its photos and any open trades on it will be removed too.')) return;
    busy.value = true;
    await removeAllFiles(listing.value.id);
    const { error: err } = await supabase.from('listings').delete().eq('id', listing.value.id);
    busy.value = false;
    if (err) return (error.value = friendlyError(err));
    router.replace('/profile');
}

watch(
    () => route.params.id,
    async () => {
        if (route.name !== 'listing') return;
        await load();
        if (route.query.photos === 'failed') {
            error.value = 'Your listing was posted, but some photos didn’t upload. Add them again below.';
            router.replace({ query: {} });
        }
    },
    { immediate: true }
);
</script>

<style scoped>
.back {
    display: inline-block;
    margin-bottom: 1rem;
    text-decoration: none;
    font-weight: 500;
}
.art {
    display: grid;
    place-items: center;
    height: 160px;
    font-size: 4rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1.25rem;
}
.art--fruit {
    background: var(--app-cat-1-soft);
}
.art--handmade {
    background: var(--app-cat-2-soft);
}
.badges {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
}
.desc {
    white-space: pre-line;
}
.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.25rem;
}
.hint {
    font-size: 0.875rem;
    color: var(--ink-muted);
    margin: 0.75rem 0 0;
}
.checklist {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: grid;
    gap: 0.5rem;
}
.checklist li {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    color: var(--ink-muted);
}
.checklist li::before {
    content: '';
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
}
.checklist li.done {
    color: var(--ink);
}
.checklist li.done::before {
    content: '✓';
    display: grid;
    place-items: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--on-brand);
    background: var(--brand);
    border-color: var(--brand);
}
</style>
