# Static Studio Reliability Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Harden the existing browser-only typography workshop with reversible editing, resilient local persistence, precise live updates, safe offline export, and a restrained paper-based interface.

**Architecture:** Keep the direct-file vanilla `index.html`/`styles.css`/`app.js` deployment shape. Add explicit project snapshots, bounded history, resilient local persistence, pure validation helpers, and targeted DOM updates inside `app.js`; keep the paper/editor tokens in `styles.css` and mirror only the standalone export tokens in `EXPORT_STYLES`. Exported pages reuse generated semantic content and package local image data with validated ZIP paths.

**Tech Stack:** Vanilla static HTML/CSS/JS, GitHub Pages, FileReader, Blob, URL, localStorage, and Node's built-in test runner for pure serialization/export regression tests. No runtime CDN or backend.

---

### Task 0: Add regression tests before implementation

**Files:**
- Create: `tests/static-studio.test.js`
- Create or modify: `package.json`

- [ ] **Step 1: Load `app.js` without a DOM**
  Use Node `vm` to evaluate `app.js` with `document` undefined and a small `window` object. Read APIs from `window.StaticStudio` so tests exercise production functions without a browser dependency.

- [ ] **Step 2: Write failing safety tests**
  Cover link protocol rejection, imported heading levels clamped to 1–3, imported block cap, image MIME whitelist, long and case-conflicting asset names, and ZIP output accepted by a standard extractor.

- [ ] **Step 3: Run the red suite**
  Run `node --test tests/static-studio.test.js`; the new assertions must fail against the current implementation for the newly requested behavior.

### Task 1: Refresh the semantic shell

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace stale mounts**
  Leave the block list and editor as empty mounts so a no-JavaScript fallback cannot advertise controls that do not exist. Keep the existing section headings and labels.

- [ ] **Step 2: Add project identity and history controls**
  Replace the static project-name text with a labeled `#project-title` text input. Add Undo and Redo buttons with `aria-label`, disabled state, and keyboard shortcut hints. Add a visible `#project-status` live region beside the local-save indicator.

- [ ] **Step 3: Keep only functional document metadata**
  Keep charset and viewport for direct local rendering, remove the description/theme-color metadata and any visual metadata-like copy. Preserve the existing deferred script and local stylesheet.

### Task 2: Add history, autosave, and project identity

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Define versioned snapshots**
  Add `PROJECT_VERSION = 2`, `STORAGE_KEY`, `MAX_HISTORY = 50`, and helpers that clone `id/title/template/settings/blocks/selectedBlockId` without DOM references.

- [ ] **Step 2: Implement bounded history**
  Add `history = { past: [], future: [] }`, `recordHistory(label)`, `undo()`, `redo()`, and `syncHistoryControls()`. Push one snapshot for structural actions and coalesce repeated edits with the same `blockId:field` key during a short typing window. Clear future entries after a new edit.

- [ ] **Step 3: Implement safe local persistence**
  Add debounced `saveToStorage()` with `try/catch` around `localStorage`; include only the versioned project payload. On startup, parse and validate the stored payload through `normalizeImportedProject`; ignore corrupt or unavailable data and report a recoverable status.

- [ ] **Step 4: Wire title and keyboard shortcuts**
  Bind `#project-title` input to `state.title` with a 120-character limit, use it for JSON/HTML export titles, and handle `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, and `Cmd/Ctrl+Y` outside editable text controls.

### Task 3: Make rendering incremental and accessible

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Make block list semantics valid**
  Render `ol[role=listbox]`, `li[role=option]`, and one focusable selection button per row. Remove the extra row tab stop, preserve `aria-selected`, and add `aria-keyshortcuts` to the selection button.

- [ ] **Step 2: Avoid editor replacement during typing**
  Change `updateBlockField` to mutate state, record/coalesce history, update the affected row summary, update the preview, and schedule persistence without calling `renderAll()`. Use full rendering only for structural changes and imports.

- [ ] **Step 3: Improve settings updates**
  Apply width/color/font changes immediately when valid, keep the active input intact, and update preview without replacing settings markup.

- [ ] **Step 4: Improve drag/drop feedback**
  Track the dragged id, add `.is-dragging` and `.drop-target` classes, announce the resulting position in the live status, and keep Alt+Arrow movement as the keyboard path.

- [ ] **Step 5: Refine touch and contrast tokens**
  Give icon actions at least 40px hit areas, use the stronger muted token for readable labels, and keep the existing rectangular, no-gradient design system.

### Task 4: Harden content and image behavior

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Remove decorative preview copy**
  Render only the page blocks and purposeful empty states. Keep user-facing editor headings intact; remove preview overlines/kickers from exported HTML.

- [ ] **Step 2: Validate block and image limits**
  Cap UI additions at 100 blocks, clamp imported heading levels to 1–3, accept only exporter-supported image MIME types, and verify the target image block still exists when FileReader completes.

- [ ] **Step 3: Add image recovery**
  Add a clear-image action, attach an error handler for remote image failures, replace a broken image with a placeholder, and report the block-specific error without throwing.

- [ ] **Step 4: Mark external export dependencies**
  Keep data URLs packaged into `assets/`; leave remote URLs intact but report that they remain external so a user understands the offline limitation.

### Task 5: Make ZIP export safe and deterministic

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Bound asset names**
  Limit sanitized UTF-8 asset names to 180 bytes, deduplicate case-insensitively, and avoid Windows device basenames such as `CON`, `NUL`, `COM1`, and `LPT1`.

- [ ] **Step 2: Validate ZIP limits**
  Reject empty/traversal/control paths, more than 65,535 entries, names over 255 bytes, and data/offset values above ZIP32 limits before writing headers.

- [ ] **Step 3: Sanitize exported document fields**
  Use the same color/title validation as the editor for `theme-color` removal and HTML title escaping. Ensure every exported image path is relative and safe.

### Task 6: Verify and document the finished workflow

**Files:**
- Modify: `README.md`
- Modify: `examples/export/index.html` and `examples/export/styles.css` only if generated output changes.
- Test: `tests/static-studio.test.js`

- [ ] **Step 1: Run automated regression tests**
  Run `node --test tests/static-studio.test.js` and confirm all pure helper/export cases pass.

- [ ] **Step 2: Run browser smoke checks**
  Open the root `index.html` from disk and verify template switching, title editing, autosave recovery, undo/redo, add/edit/duplicate/delete, keyboard and drag reorder, local image import/clear, broken-image recovery, settings, JSON round trip, ZIP export, empty state, malformed JSON, mobile preview, reduced motion, and focus order.

- [ ] **Step 3: Inspect an actual ZIP**
  Export a project with local and external images, unpack it with `unzip -t`, open its `index.html` directly, and verify text, styles, local assets, and the external-image status behavior.

- [ ] **Step 4: Update README**
  Document autosave/undo/redo, title editing, supported image formats, external-image limitation, and the direct-file workflow. Keep the existing GIF and example export links.

- [ ] **Step 5: Commit**
  Run `git diff --check`, review `git status`, and create focused commits for tests, editor reliability, and export/accessibility changes.
