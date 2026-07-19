# Install Arcanum as a phone app (PWA)

This game is a **Progressive Web App**. You do **not** need the App Store.
After install it opens full-screen from a home-screen icon (no Safari/Chrome address bar).

## Important

| Host | Can install as app? |
| --- | --- |
| `http://localhost�` on the laptop | No (or unreliable) for a real phone icon |
| **Netlify HTTPS** URL | Yes � use this |
| GitHub Pages HTTPS | Yes |

Install from your **Netlify site URL** (example: `https://something.netlify.app`).

## Deploy / refresh on Netlify

1. Push or drag-drop the `mcat-mastery-game` folder so Netlify publishes the latest build.
2. Confirm `netlify.toml` is in the site root (headers for `sw.js` + manifest).
3. Open the live HTTPS URL on the phone (same Wi?Fi not required once it�s online).

## iPhone (Safari)

1. Open the Netlify URL in **Safari** (not Chrome-in-app / Instagram browser).
2. Tap **Share** (square with ?).
3. Tap **Add to Home Screen**.
4. Name it **Arcanum** ? **Add**.
5. Open the new icon � it runs as a standalone app.

Progress saves in that phone�s Safari storage (local). Cloud sync needs Supabase later.

## Android (Chrome)

1. Open the Netlify URL in **Chrome**.
2. Either tap the in-game **Install app** banner, or Chrome menu **? ? Install app** / **Add to Home screen**.
3. Confirm ? open the home-screen icon.

## What the code already does

- `manifest.webmanifest` � `display: "standalone"` (app chrome)
- `sw.js` � service worker for offline cache of core files
- Apple meta tags + `apple-touch-icon` for iOS home screen
- `js/pwa-install.js` � install banner (Android prompt + iOS instructions)

## If Install doesn�t appear

- You must be on **HTTPS** (Netlify), not localhost
- Use Safari on iPhone / Chrome on Android
- Visit twice, wait a few seconds, hard-refresh
- Clear site data only if testing a stuck old cache, then reopen the Netlify URL
