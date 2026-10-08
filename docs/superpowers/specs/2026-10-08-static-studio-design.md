# Static Studio — design spec

## Direction
A small typography workshop for turning text, images, and links into a single polished static page. The interface feels like a warm paper desk: charcoal type, one brick-red accent, hairline rules, generous margins, and an asymmetrical editor/preview composition.

## Design system
- Paper: `#F3EBDD`
- Ink: `#28251F`
- Rule: `#CFC4B3`
- Muted: `#84796C`
- Accent: `#C95B43`
- Heading stack: `PT Serif, Iowan Old Style, Palatino Linotype, serif`
- UI stack: `IBM Plex Mono, SFMono-Regular, monospace`
- No gradients, glass, shadows-as-cards, pill controls, bento grids, meta badges, or oversized hero.
- A small geometric three-line mark anchors the editor header.

## User flow
1. Open Static Studio and see a ready-made note template in a live Preview.
2. Choose one of four compositions: note, portfolio, poster, handbook.
3. Edit existing blocks or add heading, text, image, link, or divider blocks.
4. Reorder blocks with keyboard-friendly move controls and drag handles.
5. Tune page width, paper/ink/accent colors, and heading/body font stacks.
6. Import local images; they are stored as data URLs in the project state.
7. Export a self-contained ZIP with `index.html`, `styles.css`, and `assets/`.
8. Save/import the project as JSON for a fully local round trip.

## Architecture
- Static vanilla HTML/CSS/JS, deployable to GitHub Pages.
- A single in-memory JSON state owns template, settings, and block content.
- Renderer turns state into editor controls and a preview DOM.
- Exporter serializes the preview to standalone HTML, writes styles, extracts data URLs to `assets/`, and builds an uncompressed ZIP in-browser with a small CRC32 writer.
- No backend, external API, login, account, cloud sync, or CDN dependency.

## Responsive behavior and accessibility
- Desktop: editor rail on the left, preview paper on the right.
- Mobile: editor rail becomes a top stack; preview follows and remains the dominant result.
- All controls have visible focus rings and keyboard labels. Motion is suppressed under `prefers-reduced-motion`.
- Empty blocks show a direct hint and never break Preview. Image failures show a local error message.

## README deliverables
README embeds a lightweight demo GIF, links to an example export, and explains how to open the exported `index.html` directly without a build step.
