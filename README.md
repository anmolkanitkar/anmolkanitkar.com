# anmolkanitkar.com

Source for my personal site — [anmolkanitkar.com](https://anmolkanitkar.com).

A single page: who I am, what I've built, and how to reach me.

---

## Stack

No framework, no build step, no CDN requests. Plain HTML, CSS and one small
JavaScript file, served as static assets by Cloudflare Pages.

```
anmolkanitkar.com/
├── public/                      ← the ONLY directory that gets deployed
│   ├── index.html
│   ├── 404.html
│   ├── css/style.css
│   ├── js/main.js
│   ├── assets/img/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── _headers                 ← Cloudflare Pages security + cache headers
├── content/projects.json        ← the projects grid, as data
├── scripts/build_projects.py    ← renders that data into index.html
└── .github/workflows/
```

Everything the public should see lives in `public/`. That split is deliberate:
Cloudflare Pages publishes its output directory wholesale, so anything left at
the repo root — this README included — would otherwise be fetchable at
`https://anmolkanitkar.com/README.md`.

## Local development

No build, no server dependencies:

```bash
cd public && python3 -m http.server 8000
```

Then open <http://localhost:8000>.

One caveat: `_headers` is Cloudflare configuration, so `http.server` does not
apply it. The Content-Security-Policy is therefore **not** enforced locally, and
a CSP violation will only show up once deployed. If you add anything
third-party, check the console on the deployed preview URL before merging.

## Adding a project

1. Add an entry to `content/projects.json`.
2. Run the generator:

   ```bash
   python3 scripts/build_projects.py
   ```

3. Commit both `content/projects.json` and `public/index.html`.

The generator replaces only the region of `index.html` between
`<!-- projects:start -->` and `<!-- projects:end -->`. Everything outside those
markers is hand-written and safe to edit; anything written *inside* them by hand
is overwritten on the next run.

`repo` is optional. Set it to `"owner/name"` for a **public** GitHub repo and the
stars, primary language and last-commit date are fetched automatically; leave it
`null` for projects with no public source and the card simply renders without
stats. Private repos return a 404 from the API, so the script warns, keeps
whatever stats it already had, and carries on — a network blip should never wipe
good data.

`GITHUB_TOKEN` is optional locally (it raises the API rate limit from 60 to 5000
requests an hour). `--no-fetch` renders from the stats already on disk with no
network access at all.

`.github/workflows/refresh-stats.yml` runs the same script weekly and commits
**only if the output actually changed**, so the history stays free of empty
"refresh" commits.

## Deploying

Cloudflare Pages, connected to this repo:

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | *(empty)* |
| Build output directory | `public` |
| Root directory | *(leave as `/`)* |

Every push to `main` publishes. Other branches get preview URLs.

`www.anmolkanitkar.com` 301-redirects to the apex via a Cloudflare Redirect
Rule, so there is exactly one canonical URL.

### Headers

`public/_headers` sets a strict CSP (`default-src 'self'`, no inline script or
style), `nosniff`, `X-Frame-Options: DENY`, a locked-down `Permissions-Policy`,
and cache rules.

Assets are **not** content-hashed, since there is no build step, so `_headers`
caps CSS/JS at `max-age=3600` rather than a year. Raise that only if you add
hashed filenames — otherwise a deploy strands visitors on stale CSS.

> **Zone setting that silently overrides this file.** Caching → Configuration →
> **Browser Cache TTL** must stay on **Respect Existing Headers**. Cloudflare
> defaults it to 4 hours, and on that setting the edge rewrites the
> `Cache-Control` on CSS/JS to `max-age=14400` no matter what `_headers` says —
> quadrupling the stale-CSS window this file exists to bound. It is a zone-level
> setting, so it is invisible from the repo; the `curl` check below is the only
> way to notice it has drifted.

Verify from the outside after any change:

```bash
curl -sI https://anmolkanitkar.com | grep -i content-security-policy
curl -sI "https://anmolkanitkar.com/css/style.css?v=1" | grep -i cache-control  # max-age=3600
curl -s -o /dev/null -w '%{http_code}\n' https://anmolkanitkar.com/README.md   # 404
curl -sI https://www.anmolkanitkar.com | grep -iE '^HTTP|^location'            # 301 → apex
```

## Analytics

Cloudflare Web Analytics — cookieless, collects no personal data, and therefore
needs no consent banner and no privacy policy. The beacon `<script>` tag in
`index.html` is commented out until the token is filled in.

The site collects nothing else. There is no form anywhere on the page. If you
ever add one, it needs a working backend *and* a privacy policy before it ships.

## Accessibility

Skip link, semantic landmarks, visible `:focus-visible` rings, a print
stylesheet, and a `prefers-reduced-motion` block that disables the card hover
transform. Keep these intact when editing.

## Before this goes live

- [x] Fill in every `<mark class="todo">` placeholder in `index.html`. None
      remain. The `.todo` style is kept in the stylesheet on purpose — wrap any
      future unfinished copy in `<mark class="todo">` and it renders as a loud
      yellow highlight that cannot be shipped by accident.
- [x] Fill in `alumniOf` in the JSON-LD block.
- [x] Analytics — enabled on the zone, beacon injected at the edge, no token in
      this repo.
- [ ] Add `public/assets/img/og.png` (1200×630). The `og:image` meta tag already
      points at it, so until the file exists, links shared to LinkedIn or
      WhatsApp preview with a broken image rather than no image.
