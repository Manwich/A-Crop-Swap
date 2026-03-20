import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const pages = {"index":{"outputDir":"./","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/"}]},"signup":{"outputDir":"./signup","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/signup/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/signup/"}]},"product-information":{"outputDir":"./product-information","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/product-information/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/product-information/"}]},"backyard":{"outputDir":"./backyard","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/backyard/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/backyard/"}]},"list":{"outputDir":"./list","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/list/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/list/"}]},"product-details":{"outputDir":"./product-details","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/product-details/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/product-details/"}]},"profile":{"outputDir":"./profile","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/profile/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/profile/"}]},"signup---no-error":{"outputDir":"./signup---no-error","lang":"en","title":"","cacheVersion":16,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/signup---no-error/"},{"rel":"alternate","hreflang":"en","href":"https://e88328d3-07a9-4129-bbbf-85dcca5848a8.weweb-preview.io/signup---no-error/"}]}};

// Read the main HTML template
const template = fs.readFileSync(path.resolve(__dirname, 'template.html'), 'utf-8');
const compiledTemplate = handlebars.compile(template);

// Generate an HTML file for each page with its metadata
Object.values(pages).forEach(pageConfig => {
    // Compile the template with page metadata
    const html = compiledTemplate({
        title: pageConfig.title,
        lang: pageConfig.lang,
        meta: pageConfig.meta,
        structuredData: pageConfig.structuredData || null,
        scripts: {
            head: pageConfig.scripts.head,
            body: pageConfig.scripts.body,
        },
        alternateLinks: pageConfig.alternateLinks,
        cacheVersion: pageConfig.cacheVersion,
        baseTag: pageConfig.baseTag,
    });

    // Save output html for each page
    if (!fs.existsSync(pageConfig.outputDir)) {
        fs.mkdirSync(pageConfig.outputDir, { recursive: true });
    }
    fs.writeFileSync(`${pageConfig.outputDir}/index.html`, html);
});

const rollupOptionsInput = {};
for (const pageName in pages) {
    rollupOptionsInput[pageName] = path.resolve(__dirname, pages[pageName].outputDir, 'index.html');
}

export default defineConfig(() => {
    return {
        plugins: [nodePolyfills({ include: ['events', 'stream', 'string_decoder'] }), vue()],
        base: "/",
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
            postcss: {
                plugins: [autoprefixer],
            },
        },
        build: {
            chunkSizeWarningLimit: 10000,
            rollupOptions: {
                input: rollupOptionsInput,
                onwarn: (entry, next) => {
                    if (entry.loc?.file && /js$/.test(entry.loc.file) && /Use of eval in/.test(entry.message)) return;
                    return next(entry);
                },
                maxParallelFileOps: 900,
            },
        },
        logLevel: 'warn',
    };
});
