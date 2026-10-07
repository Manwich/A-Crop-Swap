import { supabase, friendlyError } from './supabase.js';

export const BUCKET = 'listing-photos';
export const MAX_PHOTOS = 4;
export const MAX_EDGE = 1600; // px, longest side after resizing
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // bucket limit for the resized file
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024; // phone photos are resized before upload
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SIGNED_URL_SECONDS = 60 * 60;

// Checks a picked file before we try to read it. Returns an error message or ''.
export function checkFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return `"${file.name}" isn't a JPEG, PNG or WebP image.`;
    if (file.size > MAX_ORIGINAL_BYTES) return `"${file.name}" is over 25 MB. Choose a smaller photo.`;
    return '';
}

// Scales to at most MAX_EDGE px and re-encodes as JPEG. Drawing onto a canvas drops all
// metadata, including GPS location (RU-37), and applies the EXIF rotation first.
export async function resizePhoto(file) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    for (const quality of [0.8, 0.65, 0.5]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
    }
    throw new Error(`"${file.name}" is still over 5 MB after resizing.`);
}

// Uploads files as photos at the given positions. Returns { added, error }.
export async function addPhotos(listingId, files, firstPosition = 0, onProgress = () => {}) {
    let added = 0;
    for (const [i, file] of files.entries()) {
        onProgress(i + 1, files.length);
        try {
            const blob = await resizePhoto(file);
            const path = `${listingId}/${crypto.randomUUID()}.jpg`;
            const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
            if (up.error) throw up.error;
            const row = await supabase.from('listing_photos').insert({ listing_id: listingId, path, position: firstPosition + added });
            if (row.error) {
                await supabase.storage.from(BUCKET).remove([path]);
                throw row.error;
            }
            added++;
        } catch (err) {
            return { added, error: friendlyError(err) };
        }
    }
    return { added, error: '' };
}

// Photos for one listing, in order, each with a short-lived signed URL.
export async function loadPhotos(listingId) {
    const { data, error } = await supabase
        .from('listing_photos')
        .select('id, path, position')
        .eq('listing_id', listingId)
        .order('position');
    if (error) return { photos: [], error: friendlyError(error) };
    const urls = await signedUrls(data.map(p => p.path));
    return { photos: data.map(p => ({ ...p, url: urls[p.path] })), error: '' };
}

// Map of listing id → cover photo URL, for cards.
export async function loadCovers(listingIds) {
    if (!listingIds.length) return {};
    const { data } = await supabase
        .from('listing_photos')
        .select('listing_id, path')
        .eq('position', 0)
        .in('listing_id', listingIds);
    const rows = data || [];
    const urls = await signedUrls(rows.map(r => r.path));
    return Object.fromEntries(rows.map(r => [r.listing_id, urls[r.path]]).filter(([, url]) => url));
}

async function signedUrls(paths) {
    if (!paths.length) return {};
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    return Object.fromEntries((data || []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
}

// Removes one photo, then closes the gap so positions stay 0..n-1 and a cover remains.
export async function removePhoto(listingId, photo, remaining) {
    const del = await supabase.from('listing_photos').delete().eq('id', photo.id);
    if (del.error) return friendlyError(del.error);
    await supabase.storage.from(BUCKET).remove([photo.path]);
    return reorderPhotos(listingId, remaining.map(p => p.id));
}

export async function reorderPhotos(listingId, photoIds) {
    if (!photoIds.length) return '';
    const { error } = await supabase.rpc('reorder_listing_photos', { p_listing_id: listingId, p_photo_ids: photoIds });
    return error ? friendlyError(error) : '';
}

// Deletes every file for a listing; call before deleting the listing (its rows cascade).
export async function removeAllFiles(listingId) {
    const { data } = await supabase.from('listing_photos').select('path').eq('listing_id', listingId);
    const paths = (data || []).map(p => p.path);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
