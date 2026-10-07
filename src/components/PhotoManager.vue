<template>
    <section class="card">
        <h2>Photos</h2>
        <p class="muted">Up to {{ MAX_PHOTOS }}. The first photo is the cover on the feed.</p>
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <ul v-if="photos.length" class="thumbs">
            <li v-for="(p, i) in photos" :key="p.id" class="thumb">
                <img :src="p.url" :alt="`${title}, photo ${i + 1}`" />
                <span v-if="i === 0" class="thumb__cover">Cover</span>
                <div class="thumb__actions">
                    <button v-if="i > 0" type="button" class="thumb__btn" :disabled="busy" :aria-label="`Make photo ${i + 1} the cover`" @click="makeCover(i)">★</button>
                    <button type="button" class="thumb__btn" :disabled="busy" :aria-label="`Remove photo ${i + 1}`" @click="remove(p)">✕</button>
                </div>
            </li>
        </ul>
        <label v-if="photos.length < MAX_PHOTOS" class="add-photo" :class="{ 'add-photo--busy': busy }">
            <input type="file" :accept="ACCEPTED_TYPES.join(',')" multiple :disabled="busy" @change="pick" />
            <span aria-hidden="true">＋</span> {{ status || 'Add photos' }}
        </label>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import { MAX_PHOTOS, ACCEPTED_TYPES, checkFile, addPhotos, removePhoto, reorderPhotos } from '../lib/photos.js';

const props = defineProps({
    listingId: { type: String, required: true },
    title: { type: String, default: 'Listing' },
    photos: { type: Array, required: true },
});
const emit = defineEmits(['changed']);
const busy = ref(false);
const error = ref('');
const status = ref('');

async function pick(event) {
    error.value = '';
    const files = [...event.target.files];
    event.target.value = '';
    const room = MAX_PHOTOS - props.photos.length;
    const bad = files.map(checkFile).find(Boolean);
    if (bad) return (error.value = bad);
    if (files.length > room) error.value = `Only ${MAX_PHOTOS} photos per listing; the extras were skipped.`;
    busy.value = true;
    const result = await addPhotos(props.listingId, files.slice(0, room), props.photos.length, (n, total) => {
        status.value = `Uploading ${n} of ${total}…`;
    });
    status.value = '';
    busy.value = false;
    if (result.error) error.value = result.error;
    emit('changed');
}

async function remove(photo) {
    if (!confirm('Remove this photo?')) return;
    await run(() => removePhoto(props.listingId, photo, props.photos.filter(p => p.id !== photo.id)));
}

async function makeCover(i) {
    const ids = props.photos.map(p => p.id);
    ids.unshift(...ids.splice(i, 1));
    await run(() => reorderPhotos(props.listingId, ids));
}

async function run(action) {
    busy.value = true;
    error.value = await action();
    busy.value = false;
    emit('changed');
}
</script>
