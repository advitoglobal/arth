# Director review pack

Share this folder. Do not send only the HTML file.

## Open this

**[ARTH-DIRECTOR-REVIEW.html](ARTH-DIRECTOR-REVIEW.html)** — product, design system, live screenshots, access law, stack, APIs, and excerpts of the enforcing code.

**[CODE-ATLAS.md](CODE-ATLAS.md)** — every application source file and the governing markdown books inlined. IT can review implementation without a separate checkout.

**[FILE-MANIFEST.md](FILE-MANIFEST.md)** — path and size of each inlined file.

**[screens/](screens/)** — PNG captures of the running floor, 31 Aug 2026.

## Zip for email

From the repository root:

```bash
zip -r arth-director-review.zip docs/directors-review \
  -x 'docs/directors-review/node_modules/*' \
  -x 'docs/directors-review/__pycache__/*'
```

Keep `screens/` next to the HTML so images load.

## What is not in this zip

Database URLs, Neon or Vercel claim tokens, `.env.local`. Demonstration password is visible on the login screenshot because testers already use it.

## Regenerate

```bash
npm run dev   # 127.0.0.1:43127
node docs/directors-review/capture-screens.mjs   # needs playwright-core + Chrome
python3 docs/directors-review/build-pack.py
```
