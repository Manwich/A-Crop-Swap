import { supabase, friendlyError } from './supabase.js';
import { refreshNeighbor } from './session.js';

// Every credit-affecting action is a database function (see supabase/schema.sql),
// so the rules hold no matter what the browser sends.
async function call(fn, args) {
    const { data, error } = await supabase.rpc(fn, args);
    await refreshNeighbor();
    return { data, error: error ? friendlyError(error) : '' };
}

export const startExchange = listingId => call('start_exchange', { p_listing_id: listingId });
export const confirmExchange = exchangeId => call('confirm_exchange', { p_exchange_id: exchangeId });
export const reserveListing = listingId => call('reserve_listing', { p_listing_id: listingId });
export const markReady = reservationId => call('mark_reservation_ready', { p_reservation_id: reservationId });
export const confirmPickup = reservationId => call('confirm_pickup', { p_reservation_id: reservationId });
export const cancelReservation = reservationId => call('cancel_reservation', { p_reservation_id: reservationId });
