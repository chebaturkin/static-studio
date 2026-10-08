# Static Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a GitHub Pages-ready, browser-only typography workshop with live Preview, four starter compositions, block editing/reordering, local image import, JSON round trips, and self-contained ZIP export.

**Architecture:** A vanilla static app splits state/serialization, rendering, and ZIP generation into focused files. `index.html` provides semantic structure, `styles.css` owns the paper/editor visual system and responsive states, and `app.js` owns project state, templates, editor interactions, preview rendering, JSON import/export, and a tiny uncompressed ZIP writer. Exported pages reuse generated HTML and a standalone stylesheet and rewrite local image data URLs into `assets/`.

**Tech Stack:** HTML5, CSS3, modern browser JavaScript (FileReader, Blob, URL, download, CompressionStream not required), GitHub Pages. No runtime CDN or backend.

---

### Task 1: Create the static shell and design tokens

**Files:**
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: Write semantic shell**
  Add the header mark, project title, import/export controls, editor rail sections, block list mount, settings mount, and preview mount with accessible labels and live regions.

- [ ] **Step 2: Define the visual system**
  Add CSS custom properties for paper/ink/rule/muted/accent, PT Serif/IBM Plex Mono fallback stacks, two-column desktop layout, paper preview, hairlines, visible focus rings, responsive mobile stack, and reduced-motion media query. Keep controls rectangular with 1px borders and no gradients/shadows.

- [ ] **Step 3: Smoke-check the shell**
  Open `index.html` in a browser and confirm the editor rail, preview paper, and mobile stack render without JavaScript errors.

- [ ] **Step 4: Commit**
  `git add index.html styles.css && git commit -m "feat: add Static Studio shell"`

### Task 2: Add project state, templates, and editor rendering

**Files:**
- Create: `app.js`
- Modify: `index.html` to load `app.js` as a module/defer script

- [ ] **Step 1: Define the state shape**
  Implement `createId`, `createDefaultProject`, four template definitions, block factories for `heading`, `text`, `image`, `link`, and `divider`, and settings defaults.

- [ ] **Step 2: Render composition controls**
  Render four template buttons. Selecting a template replaces blocks with a deep clone and calls `renderAll()`.

- [ ] **Step 3: Render editable block list**
  Render each block with a drag handle, type label, move up/down buttons, duplicate/delete buttons, and type-specific fields. Use event delegation to update state and preserve focus after rerender.

- [ ] **Step 4: Add block creation**
  Add a select/button control that appends one of the five block types with sensible starter content and re-renders.

- [ ] **Step 5: Add keyboard reordering**
  Implement `moveBlock(id, direction)` and wire buttons plus `Alt+ArrowUp/Down` on focused block rows. Disable controls at list boundaries.

- [ ] **Step 6: Commit**
  `git add index.html app.js && git commit -m "feat: add templates and block editor"`

### Task 3: Build live Preview and settings

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Render Preview from state**
  Implement `renderPreview(project)` with semantic `<article>` output, type-specific markup, empty content hints, safe link attributes, and an image fallback state.

- [ ] **Step 2: Add settings controls**
  Render width presets, color inputs for paper/ink/accent, and two font-stack selects. Bind inputs to state and CSS variables; re-render only the affected surfaces where practical.

- [ ] **Step 3: Add Preview mode affordance**
  Add a compact toggle for `Edit`/`Preview` on small screens and a full-preview class that hides the editor rail while retaining a return control.

- [ ] **Step 4: Accessibility pass**
  Add `aria-live` to status/error output, labels for all inputs, focus-visible styles, and reduced-motion-safe transitions.

- [ ] **Step 5: Commit**
  `git add app.js styles.css && git commit -m "feat: add live preview and settings"`

### Task 4: Implement local images and JSON import/export

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Step 1: Import local images**
  Add a hidden file input accepting image types. On selection, use `FileReader.readAsDataURL`, store `src`, `alt`, and original filename on the image block, and report unsupported/oversize files clearly.

- [ ] **Step 2: JSON export**
  Serialize the current project with `JSON.stringify`, create a Blob, and download `static-studio-project.json`.

- [ ] **Step 3: JSON import**
  Parse a selected JSON file, validate settings/templates/blocks, merge safe defaults, reject malformed projects with an in-app error, and call `renderAll()` on success.

- [ ] **Step 4: Empty/error states**
  Ensure a new project with zero blocks shows a useful Preview hint and that missing images render a recoverable editor message rather than throwing.

- [ ] **Step 5: Commit**
  `git add index.html app.js && git commit -m "feat: support local images and project JSON"`

### Task 5: Implement standalone ZIP export

**Files:**
- Modify: `app.js`
- Create: `export-template.css` only if keeping export CSS separate is clearer; otherwise generate CSS from the same token string

- [ ] **Step 1: Add CRC32 and ZIP writer**
  Implement `crc32(bytes)` and `buildZip(files)` for uncompressed store entries with local headers, central directory, and end record. Return a Blob with `application/zip`.

- [ ] **Step 2: Generate export files**
  Implement `buildExportFiles(project)` to produce `index.html`, `styles.css`, and `assets/<safe-name>` for every data URL image. Rewrite preview image `src` values to relative asset paths.

- [ ] **Step 3: Wire the Export ZIP action**
  Download `static-studio-export.zip`, update status text, and catch/report failures without losing the in-memory project.

- [ ] **Step 4: Verify offline export**
  Unzip a generated archive, open `index.html` directly from disk, and confirm text, links, styles, and imported local images work without a server or network.

- [ ] **Step 5: Commit**
  `git add app.js && git commit -m "feat: export standalone ZIP"`

### Task 6: Documentation, demo asset, and final verification

**Files:**
- Modify: `README.md`
- Create: `demo.gif`
- Create: `examples/export/index.html`
- Create: `examples/export/styles.css`
- Create: `examples/export/assets/` with one small local image if available

- [ ] **Step 1: Create a lightweight demo GIF**
  Capture two or three local screenshots/states or generate a small animated GIF showing the editor and Preview. Keep it lightweight and checked into the repo.

- [ ] **Step 2: Document usage**
  Replace the placeholder README with setup/open instructions, GIF embed, feature list, JSON workflow, sample export link, and direct-file instructions: unzip, double-click `index.html`, no build needed.

- [ ] **Step 3: Verify desktop/mobile and keyboard paths**
  Test template switching, block add/edit/reorder/delete, JSON import/export, image import, width/color/font settings, ZIP export, `Tab` focus, `Alt+Arrow` reorder, mobile layout, empty state, malformed JSON, missing image, and reduced motion.

- [ ] **Step 4: Commit**
  `git add README.md demo.gif examples && git commit -m "docs: add demo and offline export example"`

- [ ] **Step 5: Final review**
  Run `git log --oneline -6`, inspect the generated archive contents, and summarize verified paths and any browser limitations.
