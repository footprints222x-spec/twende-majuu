# Twende Majuu – Frontend

React website for the Twende Majuu crew registration platform. It works the same on a phone and a
computer: one layout that reflows, a thumb-reach tab bar on phones, and tables that become cards.

**Stack:** React 19 · Vite · React Router · plain CSS (no UI framework) · Bricolage Grotesque (bundled, no Google Fonts request)

It talks to the Flask backend in `twende-majuu-backend` (the `/api/...` endpoints).

---

## 1. Run it on your computer

Needs **Node 20.19 or newer** and the backend running on port 5000.

```bash
npm install
cp .env.example .env        # optional in development, the defaults work
npm run dev                 # http://localhost:5173
```

In another terminal, start the backend (`flask run` in the backend folder).

In development the browser only talks to Vite, and Vite forwards `/api` to Flask. That means
you do not need any CORS setup locally.

## 2. Open it on your phone

1. Put the phone and the computer on the same Wi-Fi.
2. Run `npm run dev` (it already listens on your network) and note your computer's local IP address,
   for example `192.168.1.20`.
3. On the phone open `http://192.168.1.20:5173`.

If it does not load, allow port 5173 through your computer's firewall. Camera upload for the passport
photograph and tap-to-call/tap-to-email in the admin area can only be tried properly on a real phone.

## 3. Put it online

```bash
npm run build               # creates the dist/ folder
```

Upload `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, Render static site, or your own
nginx).

**Before you build, set one variable** so the live site knows where your API is:

```
VITE_API_URL=https://api.your-domain.com/api
```

(Set it in `.env`, or in the host's environment settings, then build.)

**On the backend**, add your website address to `CORS_ORIGINS` in the backend `.env`:

```
CORS_ORIGINS=https://your-domain.com
```

**Page refresh on /app or /admin:** because this is a single-page app, your host must serve
`index.html` for every path. Already included:

- Netlify and Cloudflare Pages: `public/_redirects`
- Vercel: `vercel.json`
- nginx: `location / { try_files $uri /index.html; }`

Serve the site over HTTPS. The API handles passport data and login tokens.

## 4. What is in it

| Address | Who | What |
|---|---|---|
| `/` | anyone | Landing page |
| `/register` | anyone | Three-step sign-up (account, about you, passport and work). Steps 2 and 3 can be skipped and finished later |
| `/login` | anyone | Log in. "Keep me signed in on this device" is optional |
| `/app` | applicant | Application status tracker and a checklist of what is still missing |
| `/app/profile` | applicant | Edit profile, change password |
| `/app/documents` | applicant | Upload, replace, download and delete documents |
| `/admin` | admin | Totals, status breakdown, top positions and nationalities |
| `/admin/applicants` | admin | Search, filter, sort and page through applicants |
| `/admin/applicants/:id` | admin | Full profile, documents, status and notes, delete |

Administrators are created with `flask create-admin` on the backend. Public registration only ever creates applicants.

## 5. Built for phones

- One column on phones, two on desktop; nothing scrolls sideways at any width.
- Applicants and admins get a bottom tab bar on phones and top navigation on desktop.
- All form fields are 16px or larger (so iPhones do not zoom in) and every button is at least 44px tall.
- Forms use the right keyboard (`email`, `tel`, numbers) and browser autofill hints.
- Registration is split into short steps; long forms show a "Save changes" bar only when something changed.
- The admin applicant list becomes cards on phones; filters fold behind a button. Filters live in the web address, so a filtered view can be bookmarked or shared.
- Dialogs slide up from the bottom on phones.
- Respects the phone's safe areas (notch, home bar) and the "reduce motion" setting.

## 6. How login works

- The short-lived access token is kept in memory only.
- The refresh token is kept in `sessionStorage` (gone when the tab closes), or in `localStorage` if the person ticks
  "Keep me signed in on this device".
- When an access token expires, the site fetches a new one and repeats the request without the person noticing.
- Log out revokes the tokens on the server.
- Documents are never linked directly. Downloads and the passport photo thumbnail are fetched with the login token and
  handed to the browser as a file.

## 7. Project layout

```
public/            favicon, photos (WebP), SPA redirect files
src/
  api/client.js    fetch wrapper: tokens, silent refresh, errors, file download
  context/         AuthContext (who is signed in), ToastContext
  components/      Header, TabBar, form fields, status tracker, dialog, document slot
  pages/           Home, Login, Register, applicant/*, admin/*
  hooks/           useAsync, useBlobUrl, useDebouncedValue
  utils/           constants (document types, statuses), formatting
  styles/          base.css (tokens + components), layout.css, home.css, app.css
```

Colours, spacing and fonts are CSS variables at the top of `src/styles/base.css`.

## 8. Photos

The crew and ship photographs in `public/images` are the ones supplied for this project, resized to WebP.
Make sure you have the right to publish them, particularly the photographs of people. To replace one, keep the file name
or change it in `src/pages/Home.jsx`.
# twende-majuu
