<template>
    <div class="photo-picker">
        <span class="field__label">Photos <span class="muted">(optional, up to {{ MAX_PHOTOS }})</span></span>
        <ul v-if="items.length" class="thumbs">
            <li v-for="(item, i) in items" :key="item.key" class="thumb">
                <img :src="item.preview" :alt="`Photo ${i + 1}`" />
                <span v-if="i === 0" class="thumb__cover">Cover</span>
                <div class="thumb__actions">
                    <button v-if="i > 0" type="button" class="thumb__btn" :aria-label="`Make photo ${i + 1} the cover`" @click="makeCover(i)">★</button>
                    <button type="button" class="thumb__btn" :aria-label="`Remove photo ${i + 1}`" @click="remove(i)">✕</button>
                </div>
            </li>
        </ul>
        <label v-if="items.length < MAX_PHOTOS" class="add-photo">
            <input type="file" :accept="ACCEPTED_TYPES.join(',')" multiple @change="pick" />
            <span aria-hidden="true">＋</span> {{ items.length ? 'Add more photos' : 'Add photos' }}
        </label>
        <span class="field__hint">JPEG, PNG or WebP. Photos are resized and their location data removed before upload.</span>
        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { MAX_PHOTOS, ACCEPTED_TYPES, checkFile } from '../lib/photos.js';

const emit = defineEmits(['update:modelValue']);
const items = ref([]);
const error = ref('');
let seq = 0;

function sync() {
    emit('update:modelValue', items.value.map(i => i.file));
}

function pick(event) {
    error.value = '';
    const files = [...event.target.files];
    event.target.value = '';
    const room = MAX_PHOTOS - items.value.length;
    if (files.length > room) error.value = `Only ${MAX_PHOTOS} photos per listing; the extra ${files.length - room === 1 ? 'one was' : 'ones were'} skipped.`;
    for (const file of files.slice(0, room)) {
        const problem = checkFile(file);
        if (problem) {
            error.value = problem;
            continue;
        }
        items.value.push({ key: ++seq, file, preview: URL.createObjectURL(file) });
    }
    sync();
}

function remove(i) {
    URL.revokeObjectURL(items.value[i].preview);
    items.value.splice(i, 1);
    sync();
}

function makeCover(i) {
    items.value.unshift(...items.value.splice(i, 1));
    sync();
}

onBeforeUnmount(() => items.value.forEach(i => URL.revokeObjectURL(i.preview)));
</script>

<style scoped>
.photo-picker {
    margin-bottom: 1.125rem;
}
.photo-picker .alert {
    margin-top: 0.75rem;
}
</style>
