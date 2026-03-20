import { createRouter, createWebHistory } from 'vue-router';

import wwPage from './views/wwPage.vue';

import { initializeData, initializePlugins, onPageUnload } from '@/_common/helpers/data';

let router;
const routes = [];

function scrollBehavior(to) {
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    } else {
        return { top: 0 };
    }
}

 
/* wwFront:start */
import pluginsSettings from '../../plugins-settings.json';

// eslint-disable-next-line no-undef
window.wwg_designInfo = {"id":"e88328d3-07a9-4129-bbbf-85dcca5848a8","homePageId":"91441ee4-206b-46a0-90d0-7f102653bf2c","authPluginId":"1fa0dd68-5069-436c-9a7d-3b54c340f1fa","baseTag":null,"defaultTheme":"light","langs":[{"lang":"en","default":true}],"background":{},"workflows":[],"pages":[{"id":"91441ee4-206b-46a0-90d0-7f102653bf2c","linkId":"91441ee4-206b-46a0-90d0-7f102653bf2c","name":"Home","folder":null,"paths":{"en":"home","default":"home"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"cf5471aa-2973-4c3a-b11b-4a2db5681b79","sectionTitle":"Homepage Container","linkId":"526aa087-65e1-45a8-9638-6ec7d1489ad2"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"59202930-3726-41fb-ad53-4aa1306962c3","linkId":"59202930-3726-41fb-ad53-4aa1306962c3","name":"Signup - Error","folder":null,"paths":{"en":"signup","default":"signup"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"c697dbf0-e57e-4132-9db7-76ac0c3f5e16","sectionTitle":"Main Container","linkId":"3c56290e-297c-4339-b806-809ea390a9c3"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"18d00c22-8e39-468b-92c2-3848403ea283","linkId":"18d00c22-8e39-468b-92c2-3848403ea283","name":"Product Information","folder":null,"paths":{"en":"product-information","default":"product-information"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"4ab9d6fc-4159-45c0-b542-b9f1d8dd168d","sectionTitle":"Header Section","linkId":"88c1f8e4-c571-4441-8086-069a053c5c24"},{"uid":"ec90e20d-2af6-43e4-83ab-4ce54806344c","sectionTitle":"Main Content","linkId":"a24547ea-ac9b-4155-bc35-244974fb3ef6"},{"uid":"e2ef1d9f-2b08-438d-b244-a795e6ec9894","sectionTitle":"Footer Section","linkId":"26b0a976-22e9-492a-bc27-d6d9808c4b6a"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"2512eaab-b41a-48e5-bafb-648354ef85c1","linkId":"2512eaab-b41a-48e5-bafb-648354ef85c1","name":"Backyard","folder":null,"paths":{"en":"backyard","default":"backyard"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"4ab9d6fc-4159-45c0-b542-b9f1d8dd168d","sectionTitle":"Header Section","linkId":"88c1f8e4-c571-4441-8086-069a053c5c24"},{"uid":"28356ce3-6abd-48bf-b085-6036f6ab8dfe","sectionTitle":"Main Content","linkId":"33fb9ba1-966f-46c2-bfd8-1ecb8f2e76cd"},{"uid":"e2ef1d9f-2b08-438d-b244-a795e6ec9894","sectionTitle":"Footer Section","linkId":"26b0a976-22e9-492a-bc27-d6d9808c4b6a"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"15a9db44-8ec2-4e1b-ac18-e26a25ba6aa3","linkId":"15a9db44-8ec2-4e1b-ac18-e26a25ba6aa3","name":"Product List","folder":null,"paths":{"en":"list","default":"list"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"04881ac4-853f-4b2d-aacb-086a0c80a995","sectionTitle":"Main Container","linkId":"1c81fef0-dcf1-4deb-84bb-2bdad084c66a"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"f8cbcc8b-16d6-4f05-af8a-5aed519737dd","linkId":"f8cbcc8b-16d6-4f05-af8a-5aed519737dd","name":"Product Edit","folder":null,"paths":{"en":"product-details","default":"product-details"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"408b8b39-9b8c-4f7f-ad60-890938c0afb3","sectionTitle":"Main Content","linkId":"8f62bafd-47ea-472e-a9cc-bc436821ee39"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"afdc83ea-2b90-456d-bafc-ca62989bb03e","linkId":"afdc83ea-2b90-456d-bafc-ca62989bb03e","name":"Profile","folder":null,"paths":{"en":"profile","default":"profile"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"4ab9d6fc-4159-45c0-b542-b9f1d8dd168d","sectionTitle":"Header Section","linkId":"88c1f8e4-c571-4441-8086-069a053c5c24"},{"uid":"3104a741-2f74-4687-b74b-7826ef1407dc","sectionTitle":"Profile Main Section","linkId":"34157dcf-4c3e-4930-a265-3b14751b062d"},{"uid":"e2ef1d9f-2b08-438d-b244-a795e6ec9894","sectionTitle":"Footer Section","linkId":"26b0a976-22e9-492a-bc27-d6d9808c4b6a"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"5559275e-9ba0-4662-bf3d-6cb5cfadcdfe","linkId":"5559275e-9ba0-4662-bf3d-6cb5cfadcdfe","name":"Signup - No Error","folder":null,"paths":{"en":"signup---no-error","default":"signup---no-error"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"c697dbf0-e57e-4132-9db7-76ac0c3f5e16","sectionTitle":"Main Container","linkId":"3c56290e-297c-4339-b806-809ea390a9c3"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""}],"plugins":[{"id":"f9ef41c3-1c53-4857-855b-f2f6a40b7186","name":"Supabase","namespace":"supabase"},{"id":"1fa0dd68-5069-436c-9a7d-3b54c340f1fa","name":"Supabase Auth","namespace":"supabaseAuth"},{"id":"2bd1c688-31c5-443e-ae25-59aa5b6431fb","name":"REST API","namespace":"restApi"}]};
// eslint-disable-next-line no-undef
window.wwg_cacheVersion = 16;
// eslint-disable-next-line no-undef
window.wwg_pluginsSettings = pluginsSettings;
// eslint-disable-next-line no-undef
window.wwg_disableManifest = false;

const defaultLang = window.wwg_designInfo.langs.find(({ default: isDefault }) => isDefault) || {};

const registerRoute = (page, lang, forcedPath) => {
    const langSlug = !lang.default || lang.isDefaultPath ? `/${lang.lang}` : '';
    let path =
        forcedPath ||
        (page.id === window.wwg_designInfo.homePageId ? '/' : `/${page.paths[lang.lang] || page.paths.default}`);

    //Replace params
    path = path.replace(/{{([\w]+)\|([^/]+)?}}/g, ':$1');

    routes.push({
        path: langSlug + path,
        component: wwPage,
        name: `page-${page.id}-${lang.lang}`,
        meta: {
            pageId: page.id,
            lang,
            isPrivate: !!page.pageUserGroups?.length,
        },
        async beforeEnter(to, from) {
            if (to.name === from.name) return;
            //Set page lang
            wwLib.wwLang.defaultLang = defaultLang.lang;
            wwLib.$store.dispatch('front/setLang', lang.lang);

            //Init plugins
            await initializePlugins();

            //Check if private page
            if (page.pageUserGroups?.length) {
                // cancel navigation if no plugin
                if (!wwLib.wwAuth.plugin) {
                    return false;
                }

                await wwLib.wwAuth.init();

                // Redirect to not sign in page if not logged
                if (!wwLib.wwAuth.getIsAuthenticated()) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthenticatedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }

                //Check roles are required
                if (
                    page.pageUserGroups.length > 1 &&
                    !wwLib.wwAuth.matchUserGroups(page.pageUserGroups.map(({ userGroup }) => userGroup))
                ) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthorizedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }
            }

            try {
                await import(`@/pages/${page.id.split('_')[0]}.js`);
                await wwLib.wwWebsiteData.fetchPage(page.id);

                //Scroll to section or on top after page change
                if (to.hash) {
                    const targetElement = document.getElementById(to.hash.replace('#', ''));
                    if (targetElement) targetElement.scrollIntoView();
                } else {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }

                return;
            } catch (err) {
                wwLib.$store.dispatch('front/showPageLoadProgress', false);

                if (err.redirectUrl) {
                    return { path: err.redirectUrl || '404' };
                } else {
                    //Any other error: go to target page using window.location
                    window.location = to.fullPath;
                }
            }
        },
    });
};

for (const page of window.wwg_designInfo.pages) {
    for (const lang of window.wwg_designInfo.langs) {
        if (!page.langs.includes(lang.lang)) continue;
        registerRoute(page, lang);
    }
}

const page404 = window.wwg_designInfo.pages.find(page => page.paths.default === '404');
if (page404) {
    for (const lang of window.wwg_designInfo.langs) {
        // Create routes /:lang/:pathMatch(.*)* etc for all langs of the 404 page
        if (!page404.langs.includes(lang.lang)) continue;
        registerRoute(
            page404,
            {
                default: false,
                lang: lang.lang,
            },
            '/:pathMatch(.*)*'
        );
    }
    // Create route /:pathMatch(.*)* using default project lang
    registerRoute(page404, { default: true, isDefaultPath: false, lang: defaultLang.lang }, '/:pathMatch(.*)*');
} else {
    routes.push({
        path: '/:pathMatch(.*)*',
        async beforeEnter() {
            window.location.href = '/404';
        },
    });
}

let routerOptions = {};

const isProd =
    !window.location.host.includes(
        // TODO: add staging2 ?
        '-staging.' + (process.env.WW_ENV === 'staging' ? import.meta.env.VITE_APP_PREVIEW_URL : '')
    ) && !window.location.host.includes(import.meta.env.VITE_APP_PREVIEW_URL);

if (isProd && window.wwg_designInfo.baseTag?.href) {
    let baseTag = window.wwg_designInfo.baseTag.href;
    if (!baseTag.startsWith('/')) {
        baseTag = '/' + baseTag;
    }
    if (!baseTag.endsWith('/')) {
        baseTag += '/';
    }

    routerOptions = {
        base: baseTag,
        history: createWebHistory(baseTag),
        routes,
    };
} else {
    routerOptions = {
        history: createWebHistory(),
        routes,
    };
}

router = createRouter({
    ...routerOptions,
    scrollBehavior,
});

//Trigger on page unload
let isFirstNavigation = true;
router.beforeEach(async (to, from) => {
    if (to.name === from.name) return;
    if (!isFirstNavigation) await onPageUnload();
    isFirstNavigation = false;
    wwLib.globalVariables._navigationId++;
    return;
});

//Init page
router.afterEach((to, from, failure) => {
    wwLib.$store.dispatch('front/showPageLoadProgress', false);
    let fromPath = from.path;
    let toPath = to.path;
    if (!fromPath.endsWith('/')) fromPath = fromPath + '/';
    if (!toPath.endsWith('/')) toPath = toPath + '/';
    if (failure || (from.name && toPath === fromPath)) return;
    initializeData(to);
});
/* wwFront:end */

export default router;
