import { createRouter, createWebHistory } from 'vue-router';
import { session, whenSessionReady } from './lib/session.js';

const SITE = 'A Crop Swap';
const DESCRIPTION =
    'A neighborhood site for trading backyard fruit and handmade goods using a credit system that lets neighbors give fruit today and redeem it once it ripens.';

// meta.auth: signed-in members only (RU-24…RU-28). meta.guest: hide from signed-in users.
// meta.noindex: send robots noindex (also sent as an X-Robots-Tag header by vercel.json).
const routes = [
    { path: '/', name: 'landing', component: () => import('./views/LandingView.vue'), meta: { title: SITE } },
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { title: 'Log in', guest: true, noindex: true } },
    { path: '/signup', name: 'signup', component: () => import('./views/SignupView.vue'), meta: { title: 'Sign up', guest: true, noindex: true } },
    { path: '/reset-password', name: 'reset-password', component: () => import('./views/ResetPasswordView.vue'), meta: { title: 'Reset password', noindex: true } },
    { path: '/home', name: 'feed', component: () => import('./views/FeedView.vue'), meta: { title: SITE, auth: true, noindex: true } },
    { path: '/post', name: 'post', component: () => import('./views/PostListingView.vue'), meta: { title: 'Post a Listing', auth: true, noindex: true } },
    { path: '/listings/:id', name: 'listing', component: () => import('./views/ListingDetailView.vue'), meta: { title: 'Listing Detail', auth: true, noindex: true } },
    { path: '/activity', name: 'activity', component: () => import('./views/ActivityView.vue'), meta: { title: 'My Trades', auth: true, noindex: true } },
    { path: '/profile', name: 'profile', component: () => import('./views/ProfileView.vue'), meta: { title: 'My Backyard', auth: true, noindex: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue'), meta: { title: 'Page not found', noindex: true } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: (to, from, saved) => saved || { top: 0 },
});

router.beforeEach(async to => {
    await whenSessionReady();
    if (to.meta.auth && !session.user) {
        return { name: 'login', query: { redirect: to.fullPath } };
    }
    if (to.meta.guest && session.user) {
        return { name: 'feed' };
    }
});

router.afterEach(to => {
    document.title = to.meta.title === SITE ? SITE : `${to.meta.title} · ${SITE}`;
    setMeta('robots', to.meta.noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('description', DESCRIPTION);
});

function setMeta(name, content) {
    let tag = document.head.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

export default router;
