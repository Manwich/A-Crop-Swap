<template>
    <div class="page">
        <div class="page-head">
            <div>
                <h1>My Trades</h1>
                <p>Exchanges to confirm and reservations to manage.</p>
            </div>
            <span v-if="session.neighbor" class="balance">{{ credits(session.neighbor.credit_balance) }}</span>
        </div>

        <div v-if="notice" class="alert alert--success" role="status">{{ notice }}</div>
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <div v-if="loading" class="spinner" role="status" aria-label="Loading trades"></div>

        <template v-else>
            <section class="block">
                <h2>Exchanges <span class="count">{{ exchanges.length }}</span></h2>
                <p class="muted intro">Direct handoffs of available-now items. When both of you confirm, the giver earns 1 credit.</p>
                <div v-if="!exchanges.length" class="empty">
                    No exchanges yet. Find something on the <RouterLink to="/home">Backyard Feed</RouterLink>.
                </div>
                <ul v-else class="rows">
                    <li v-for="e in exchanges" :key="e.id" class="row">
                        <div class="row__main">
                            <RouterLink :to="`/listings/${e.listing_id}`" class="row__title">{{ e.listing?.title || 'Removed listing' }}</RouterLink>
                            <p class="row__sub">
                                <template v-if="e.giver_id === me">You're giving to {{ names[e.receiver_id] || 'a neighbor' }}</template>
                                <template v-else>{{ names[e.giver_id] || 'A neighbor' }} is giving to you</template>
                                · {{ shortDate(e.created_at) }}
                            </p>
                            <p class="row__checks">
                                <span :class="{ ok: e.giver_confirmed }">{{ e.giver_confirmed ? '✓' : '○' }} Giver confirmed</span>
                                <span :class="{ ok: e.receiver_confirmed }">{{ e.receiver_confirmed ? '✓' : '○' }} Receiver confirmed</span>
                            </p>
                        </div>
                        <div class="row__side">
                            <span class="badge" :class="exchangeStatus(e).tone">{{ exchangeStatus(e).label }}</span>
                            <button
                                v-if="needsMyConfirmation(e)"
                                class="btn btn--primary btn--sm"
                                type="button"
                                :disabled="busy"
                                @click="act(() => confirmExchange(e.id), e.giver_id === me && e.receiver_confirmed ? 'Confirmed. You earned 1 credit!' : 'Confirmed.')"
                            >
                                {{ e.giver_id === me ? 'I handed it over' : 'I received it' }}
                            </button>
                        </div>
                    </li>
                </ul>
            </section>

            <section class="block">
                <h2>Reservations <span class="count">{{ reservations.length }}</span></h2>
                <p class="muted intro">Ripening harvests held for 1 credit. Cancelled or unripened reservations are refunded.</p>
                <div v-if="!reservations.length" class="empty">
                    No reservations yet. Look for <strong>Ripening</strong> listings on the <RouterLink to="/home">Backyard Feed</RouterLink>.
                </div>
                <ul v-else class="rows">
                    <li v-for="r in reservations" :key="r.id" class="row">
                        <div class="row__main">
                            <RouterLink :to="`/listings/${r.listing_id}`" class="row__title">{{ r.listing?.title || 'Removed listing' }}</RouterLink>
                            <p class="row__sub">
                                <template v-if="r.reserver_id === me">You reserved from {{ names[r.listing?.poster_id] || 'a neighbor' }}</template>
                                <template v-else>{{ names[r.reserver_id] || 'A neighbor' }} reserved your harvest</template>
                                · {{ shortDate(r.created_at) }}
                            </p>
                            <p v-if="r.status === 'ready'" class="row__checks">
                                <span :class="{ ok: r.poster_confirmed }">{{ r.poster_confirmed ? '✓' : '○' }} Grower confirmed pickup</span>
                                <span :class="{ ok: r.reserver_confirmed }">{{ r.reserver_confirmed ? '✓' : '○' }} Reserver confirmed pickup</span>
                            </p>
                        </div>
                        <div class="row__side">
                            <span class="badge" :class="`badge--${RESERVATION_STATUS[r.status].tone}`">{{ RESERVATION_STATUS[r.status].label }}</span>
                            <div class="row__buttons">
                                <button
                                    v-if="isPoster(r) && r.status === 'reserved'"
                                    class="btn btn--primary btn--sm"
                                    type="button"
                                    :disabled="busy"
                                    @click="act(() => markReady(r.id), 'Marked ready. Arrange the pickup!')"
                                >
                                    Mark ready
                                </button>
                                <button
                                    v-if="r.status === 'ready' && !myPickupConfirmed(r)"
                                    class="btn btn--primary btn--sm"
                                    type="button"
                                    :disabled="busy"
                                    @click="act(() => confirmPickup(r.id), 'Pickup confirmed.')"
                                >
                                    Confirm pickup
                                </button>
                                <button
                                    v-if="['reserved', 'ready'].includes(r.status)"
                                    class="btn btn--ghost btn--sm"
                                    type="button"
                                    :disabled="busy"
                                    @click="cancel(r)"
                                >
                                    {{ isPoster(r) ? "Won't ripen" : 'Cancel' }}
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </section>
        </template>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { session, refreshNeighbor } from '../lib/session.js';
import { RESERVATION_STATUS, credits, shortDate, loadNames } from '../lib/format.js';
import { confirmExchange, markReady, confirmPickup, cancelReservation } from '../lib/trades.js';

const exchanges = ref([]);
const reservations = ref([]);
const names = ref({});
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const notice = ref('');

const me = computed(() => session.neighbor?.id);
const ACTIVE_FIRST = { reserved: 0, ready: 0, completed: 1, cancelled: 2, refunded: 2 };

const isPoster = r => r.listing?.poster_id === me.value;
const myPickupConfirmed = r => (isPoster(r) ? r.poster_confirmed : r.reserver_confirmed);
const needsMyConfirmation = e => (e.giver_id === me.value ? !e.giver_confirmed : !e.receiver_confirmed);

function exchangeStatus(e) {
    if (e.credited) return { label: 'Completed', tone: 'badge--success' };
    if (needsMyConfirmation(e)) return { label: 'Needs your confirmation', tone: 'badge--warning' };
    return { label: 'Waiting on neighbor', tone: 'badge--info' };
}

async function load() {
    if (!session.neighbor) await refreshNeighbor();
    const [ex, res] = await Promise.all([
        supabase.from('exchanges').select('*, listing:listings(title, poster_id)').order('created_at', { ascending: false }),
        supabase.from('reservations').select('*, listing:listings(title, poster_id)').order('created_at', { ascending: false }),
    ]);
    if (ex.error || res.error) error.value = friendlyError(ex.error || res.error);
    exchanges.value = (ex.data || []).sort((a, b) => a.credited - b.credited);
    reservations.value = (res.data || []).sort((a, b) => ACTIVE_FIRST[a.status] - ACTIVE_FIRST[b.status]);
    names.value = await loadNames(supabase, [
        ...exchanges.value.flatMap(e => [e.giver_id, e.receiver_id]),
        ...reservations.value.flatMap(r => [r.reserver_id, r.listing?.poster_id]),
    ]);
    loading.value = false;
}

async function act(action, message) {
    busy.value = true;
    error.value = '';
    notice.value = '';
    const { error: err } = await action();
    busy.value = false;
    if (err) error.value = err;
    else notice.value = message;
    await load();
}

function cancel(r) {
    const question = isPoster(r)
        ? 'Mark this harvest as not ripening? The reserver gets their credit back.'
        : 'Cancel this reservation? Your credit will be refunded.';
    if (confirm(question)) act(() => cancelReservation(r.id), 'Reservation cancelled and the credit refunded.');
}

onMounted(load);
</script>

<style scoped>
.balance {
    font-weight: 700;
    color: var(--brand-strong);
    background: var(--brand-soft);
    padding: 0.375rem 0.875rem;
    border-radius: 999px;
}
.block + .block {
    margin-top: 2.5rem;
}
.count {
    display: inline-block;
    min-width: 1.75rem;
    padding: 0 0.5rem;
    border-radius: 999px;
    background: var(--surface-sunken);
    color: var(--ink-muted);
    font-size: 0.875rem;
    text-align: center;
    vertical-align: middle;
}
.intro {
    font-size: 0.9375rem;
}
.rows {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}
.row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
}
.row + .row {
    border-top: 1px solid var(--line);
}
.row__main {
    min-width: 0;
    flex: 1 1 280px;
}
.row__title {
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
}
.row__title:hover {
    color: var(--brand-strong);
}
.row__sub {
    margin: 0.125rem 0 0;
    font-size: 0.875rem;
    color: var(--ink-subtle);
}
.row__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0.375rem 0 0;
    font-size: 0.8125rem;
    color: var(--ink-subtle);
}
.row__checks .ok {
    color: var(--success);
    font-weight: 600;
}
.row__side {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
}
.row__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
</style>
