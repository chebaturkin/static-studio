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

## Reliability pass (2026-10-08)
- The editor remains browser-only and works from `file://`; there is no server, account, CDN, or external runtime.
- The page title is editable and is used in the exported document title and JSON payload.
- A bounded undo/redo history makes template replacement, deletion, reordering, and field edits reversible. Keyboard shortcuts are `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, and `Cmd/Ctrl+Y`.
- The current project is autosaved to `localStorage` when available. A corrupt or unavailable store never blocks startup; the in-memory editor continues to work and reports the limitation in its status line.
- Field typing updates the model and preview without replacing the active editor control. History coalesces consecutive keystrokes in one field into a single undo step.
- Template changes and deletion use the undo path instead of destructive confirmation dialogs. The status line names the action and exposes the available undo shortcut.
- The block list uses valid listbox/option semantics, keyboard move controls, and a visible drag insertion target. The live status announces reorder results.
- Image uploads accept only formats that the exporter can package. Broken remote images get a recoverable placeholder; external images remain explicitly marked as external during ZIP export.
- ZIP entry names are UTF-8 length limited, case-insensitively deduplicated, and protected from traversal, reserved device names, and integer overflow.
- The preview contains only user content and purposeful empty/error states. Decorative overlines and metadata-like labels are kept out of the exported page.

## Out of scope
- Rich text editing, CMS behavior, accounts, cloud sync, collaboration, analytics, social metadata, and server-side image fetching.

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
