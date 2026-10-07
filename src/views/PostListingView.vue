<template>
    <div class="page page--narrow">
        <div class="page-head">
            <div>
                <h1>Post a Listing</h1>
                <p>Share fruit or something handmade, available now or once it ripens.</p>
            </div>
        </div>
        <div class="card">
            <ListingForm :submit-label="busy && status ? status : 'Post listing'" :busy="busy" :error="error" with-photos @submit="post">
                <template #actions>
                    <RouterLink to="/home" class="btn btn--ghost">Cancel</RouterLink>
                </template>
            </ListingForm>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ListingForm from '../components/ListingForm.vue';
import { supabase, friendlyError } from '../lib/supabase.js';
import { session, refreshNeighbor } from '../lib/session.js';
import { addPhotos } from '../lib/photos.js';

const router = useRouter();
const busy = ref(false);
const error = ref('');
const status = ref('');

async function post(form, files = []) {
    error.value = '';
    if (!form.title) return (error.value = 'Give your listing a title.');
    busy.value = true;
    const neighbor = session.neighbor || (await refreshNeighbor());
    if (!neighbor) {
        busy.value = false;
        return (error.value = 'Your neighbor profile is missing. Try logging out and back in.');
    }
    const { data, error: err } = await supabase
        .from('listings')
        .insert({ ...form, description: form.description || null, poster_id: neighbor.id })
        .select('id')
        .single();
    if (err) {
        busy.value = false;
        return (error.value = friendlyError(err));
    }
    let photoError = '';
    if (files.length) {
        const result = await addPhotos(data.id, files, 0, (n, total) => (status.value = `Uploading photo ${n} of ${total}…`));
        photoError = result.error;
    }
    busy.value = false;
    router.push({ path: `/listings/${data.id}`, query: photoError ? { photos: 'failed' } : {} });
}
</script>
