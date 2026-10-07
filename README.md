# CropSwap

Vue 3 + Vite site, exported from WeWeb. Data and auth go through Supabase (public anon key in `plugins-settings.json`).

## Run locally

```bash
npm install
npm run serve      # dev server
npm run build      # production build -> dist/
npm run preview    # serve the built dist/
```

Requires Node 20+.

## Deploy to Vercel

The repo already contains `vercel.json`, so the default settings work.

**Dashboard:** go to vercel.com/new, import this GitHub repo, keep the detected settings (Framework *Vite*, Build `npm run build`, Output `dist`), and click Deploy. Every push to the production branch redeploys.

**CLI:**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

### Notes

- `vite.config.js` generates one HTML entry per page (`/signup`, `/list`, `/profile`, ...) at build time. Those generated files are gitignored.
- `vercel.json` sends unknown paths to `index.html` so client-side routing works, and caches hashed `/assets/*` files forever.
- `.env` holds the public WeWeb runtime URLs and is committed on purpose (no secrets).
- Supabase: under Authentication → URL Configuration in your Supabase project, add your Vercel domain to the Site URL and Redirect URLs so sign-up/login redirects work.
- To add a page, add it to both the `pages` object in `vite.config.js` and `window.wwg_designInfo` in `src/_front/router.js`, and add its folder to `.gitignore`.
