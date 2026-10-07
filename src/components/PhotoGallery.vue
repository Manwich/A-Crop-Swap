<template>
    <div class="gallery">
        <button type="button" class="gallery__main" :aria-label="`Open ${alt(active)} full size`" @click="open">
            <img :src="photos[active].url" :alt="alt(active)" />
        </button>
        <div v-if="photos.length > 1" class="gallery__thumbs" role="group" aria-label="Choose photo">
            <button
                v-for="(p, i) in photos"
                :key="p.id"
                type="button"
                class="gallery__thumb"
                :class="{ 'gallery__thumb--active': i === active }"
                :aria-label="`Show photo ${i + 1}`"
                :aria-pressed="i === active"
                @click="active = i"
            >
                <img :src="p.url" alt="" />
            </button>
        </div>
        <dialog ref="dialog" class="lightbox" @click.self="dialog.close()">
            <img :src="photos[active].url" :alt="alt(active)" />
            <button type="button" class="lightbox__close" aria-label="Close" @click="dialog.close()">✕</button>
        </dialog>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    photos: { type: Array, required: true },
    title: { type: String, default: 'Listing' },
});
const active = ref(0);
const dialog = ref(null);

const alt = i => (props.photos.length > 1 ? `${props.title}, photo ${i + 1} of ${props.photos.length}` : props.title);
const open = () => dialog.value.showModal();
watch(() => props.photos.length, n => (active.value = Math.min(active.value, Math.max(n - 1, 0))));
</script>

<style scoped>
.gallery {
    margin-bottom: 1.25rem;
}
.gallery__main {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--surface-sunken);
    cursor: zoom-in;
}
.gallery__main img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
}
.gallery__thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    overflow-x: auto;
}
.gallery__thumb {
    flex: none;
    width: 64px;
    height: 64px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: pointer;
    background: var(--surface-sunken);
}
.gallery__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.gallery__thumb--active {
    border-color: var(--brand);
}
.lightbox {
    padding: 0;
    border: 0;
    background: transparent;
    max-width: 96vw;
    max-height: 92vh;
}
.lightbox::backdrop {
    background: rgb(17 24 39 / 0.85);
}
.lightbox img {
    display: block;
    max-width: 96vw;
    max-height: 92vh;
    object-fit: contain;
}
.lightbox__close {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: rgb(255 255 255 / 0.9);
    color: var(--ink);
    font-size: 1.125rem;
    cursor: pointer;
}
</style>
