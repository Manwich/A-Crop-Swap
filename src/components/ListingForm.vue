<template>
    <form @submit.prevent="emit('submit', { ...form }, files)" novalidate>
        <label class="field">
            <span class="field__label">What are you sharing?</span>
            <input v-model.trim="form.title" class="input" type="text" maxlength="120" placeholder="e.g. Meyer lemons, a bag of 10" required />
        </label>

        <fieldset class="choice-group">
            <legend class="field__label">Type</legend>
            <label class="choice">
                <input v-model="form.type" type="radio" value="fruit" name="type" />
                <strong>🍑 Fruit</strong>
                <span>From your tree, vine or garden</span>
            </label>
            <label class="choice">
                <input v-model="form.type" type="radio" value="handmade" name="type" />
                <strong>🧶 Handmade</strong>
                <span>Jam, bread, crafts, seedlings…</span>
            </label>
        </fieldset>

        <fieldset class="choice-group">
            <legend class="field__label">Availability</legend>
            <label class="choice">
                <input v-model="form.availability" type="radio" value="available_now" name="availability" />
                <strong>Available now</strong>
                <span>Hand it over directly; you earn 1 credit</span>
            </label>
            <label class="choice">
                <input v-model="form.availability" type="radio" value="future" name="availability" />
                <strong>Ripening (future)</strong>
                <span>A neighbor reserves it for 1 credit</span>
            </label>
        </fieldset>

        <label class="field">
            <span class="field__label">Details <span class="muted">(optional)</span></span>
            <textarea v-model.trim="form.description" class="textarea" maxlength="1000" placeholder="How much, when it should ripen, where to pick up…"></textarea>
        </label>

        <PhotoPicker v-if="withPhotos" v-model="files" />

        <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
        <div class="actions">
            <button class="btn btn--primary" :disabled="busy">{{ busy ? 'Saving…' : submitLabel }}</button>
            <slot name="actions" />
        </div>
    </form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import PhotoPicker from './PhotoPicker.vue';

const props = defineProps({
    initial: { type: Object, default: () => ({}) },
    submitLabel: { type: String, default: 'Save' },
    busy: Boolean,
    error: String,
    withPhotos: Boolean,
});
const files = ref([]);
const emit = defineEmits(['submit']);

const form = reactive({
    title: props.initial.title || '',
    type: props.initial.type || 'fruit',
    availability: props.initial.availability || 'available_now',
    description: props.initial.description || '',
});
</script>

<style scoped>
.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}
</style>
