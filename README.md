# Portfolio Site

This portfolio is configured for a true zero-cost deployment path using a static frontend and browser-based local storage for content edits.

## Deployment model

- Public site: static HTML/CSS/JS via Vite build output
- Hosting: GitHub Pages (no purchase required)
- Content persistence: browser localStorage, so no public backend is required
- Admin editing: works locally in the browser, not exposed publicly

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The generated static files are placed in `dist/` and can be published directly to GitHub Pages.

## Notes

This project intentionally avoids a public Node/Express backend so it remains compatible with a zero-cost deployment model.
