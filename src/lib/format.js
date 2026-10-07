export const TYPE_LABELS = { fruit: 'Fruit', handmade: 'Handmade' };
export const AVAILABILITY_LABELS = { available_now: 'Available now', future: 'Ripening' };

export const RESERVATION_STATUS = {
    reserved: { label: 'Reserved', tone: 'info' },
    ready: { label: 'Ready for pickup', tone: 'warning' },
    completed: { label: 'Completed', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
    refunded: { label: 'Refunded', tone: 'neutral' },
};

export function credits(n) {
    return `${n} credit${n === 1 ? '' : 's'}`;
}

export function shortDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Map of neighbor id → name, for showing who posted or is trading.
export async function loadNames(supabase, ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return {};
    const { data } = await supabase.from('neighbor_names').select('id, name').in('id', unique);
    return Object.fromEntries((data || []).map(n => [n.id, n.name]));
}
