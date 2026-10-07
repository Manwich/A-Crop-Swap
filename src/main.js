import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';
import { initSession } from './lib/session.js';
import './style.css';

initSession();
createApp(App).use(router).mount('#app');
