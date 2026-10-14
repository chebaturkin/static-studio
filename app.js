/* static studio: project state, templates, editor, and export. */

const BLOCK_LABELS = Object.freeze({
  heading: 'заголовок',
  text: 'текст',
  image: 'изображение',
  link: 'ссылка',
  divider: 'разделитель',
});

const TEMPLATE_LABELS = Object.freeze({
  note: 'заметка',
  portfolio: 'портфолио',
  poster: 'афиша',
  guide: 'инструкция',
  blank: 'пустая страница',
});

const DEFAULT_SETTINGS = Object.freeze({
  width: 760,
  paper: '#FFFDF7',
  ink: '#292E2B',
  accent: '#315D4A',
  headingFont: 'serif',
  bodyFont: 'grotesk',
});

const FONT_STACKS = Object.freeze({
  serif: 'var(--serif)',
  mono: 'var(--mono)',
  system: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  grotesk: '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif',
});

const WIDTH_PRESETS = Object.freeze([640, 760, 960, 1200]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const PROJECT_VERSION = 2;
const STORAGE_KEY = 'static-studio:project:v2';
const MAX_HISTORY = 50;
const MAX_BLOCKS = 100;
const MAX_TITLE_LENGTH = 120;
const MAX_ZIP_ENTRIES = 65535;
const MAX_ZIP_NAME_BYTES = 255;
const MAX_ZIP_VALUE = 0xFFFFFFFF;
const MAX_PROJECT_SIZE = 15 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100000;
const MAX_IMAGE_DATA_URL_LENGTH = 15 * 1024 * 1024;

const EXPORT_STYLES = `:root {
  --paper: #F3EBDD;
  --ink: #28251F;
  --accent: #C95B43;
  --muted-strong: color-mix(in srgb, var(--ink) 72%, var(--paper));
  --page-line: color-mix(in srgb, var(--ink) 22%, var(--paper));
  --accent-strong: var(--accent);
  --page-width: 960px;
  --heading-font: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  --body-font: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}
* { box-sizing: border-box; }
html { min-width: 320px; background: var(--paper); }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: var(--body-font); }
main { min-height: 100vh; padding: clamp(12px, 3.5vw, 48px); }
h1, h2, h3, p { margin: 0; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.page-preview { width: min(100%, var(--page-width)); min-height: 560px; margin: 0 auto; padding: clamp(28px, 5vw, 60px); color: var(--ink); background: var(--paper); font-family: var(--body-font); line-height: 1.5; container-type: inline-size; overflow-wrap: anywhere; }
.page-preview h1, .page-preview h2, .page-preview h3 { margin: 0 0 24px; color: var(--ink); font-family: var(--heading-font); font-weight: 400; letter-spacing: -.035em; line-height: 1.15; text-wrap: balance; }
.page-preview h1 { font-size: clamp(32px, 9cqw, 52px); }
.page-preview h2 { font-size: clamp(27px, 7cqw, 38px); }
.page-preview h3 { font-size: clamp(23px, 5cqw, 30px); }
.page-preview .preview-text { margin: 0 0 24px; color: var(--ink); font-size: 17px; line-height: 1.7; }
.preview-rule { margin: 32px 0; border: 0; border-top: 1px solid var(--page-line); }
.preview-space { height: 40px; }
.preview-image { margin: 0 0 28px; }
.preview-image img { display: block; width: 100%; max-height: 520px; object-fit: cover; border-radius: 12px; }
.preview-image-placeholder { display: grid; justify-items: center; align-content: center; gap: 10px; min-height: 180px; border: 1px dashed var(--page-line); border-radius: 12px; color: var(--muted-strong); font-size: 14px; }
.placeholder-cross { font-size: 26px; }
.page-caption { margin: 10px 0 0; color: var(--muted-strong); font-family: var(--body-font); font-size: 13px; line-height: 1.5; }
.preview-link { margin: 0 0 20px; font-family: var(--body-font); font-size: 17px; }
.preview-link a { color: var(--accent-strong); text-decoration-thickness: 1px; text-underline-offset: 5px; }
.preview-link a:hover { text-decoration-thickness: 2px; }
.preview-link.is-disabled { display: grid; gap: 6px; color: var(--muted-strong); }
.preview-link small { font-size: 13px; }
.empty-hint { color: var(--muted-strong); font-style: italic; }
.page-preview > :last-child { margin-bottom: 0; }
`;

const IMAGE_MIME_EXTENSIONS = Object.freeze({
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
});

const EXPORT_FONT_STACKS = Object.freeze({
  serif: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  system: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  grotesk: '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif',
});

let idCounter = 0;

function createId(prefix = 'block') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function withId(type, defaults, overrides = {}) {
  return {
    id: overrides.id || createId(type),
    type,
    ...defaults,
    ...overrides,
  };
}

function createHeading(overrides = {}) {
  return withId('heading', { content: 'соберите страницу', level: 1 }, overrides);
}

function createText(overrides = {}) {
  return withId('text', { content: 'добавьте текст блока.' }, overrides);
}

function createImage(overrides = {}) {
  return withId('image', { src: '', alt: '', name: '', caption: '' }, overrides);
}

function createLink(overrides = {}) {
  return withId('link', { label: 'открыть ссылку', url: 'https://example.com' }, overrides);
}

function createDivider(overrides = {}) {
  return withId('divider', { style: 'line' }, overrides);
}

const blockFactories = Object.freeze({ heading: createHeading, text: createText, image: createImage, link: createLink, divider: createDivider });

const templateFactories = Object.freeze({
  blank: () => [],
  note: () => [
    createHeading({ content: 'название заметки' }),
    createText({ content: 'здесь будет текст вашей заметки.' }),
  ],
  portfolio: () => [
    createHeading({ content: 'избранные работы' }),
    createText({ content: 'несколько слов о вас и вашей работе.' }),
    createImage({ caption: 'название проекта' }),
    createLink({ label: 'посмотреть все проекты', url: 'https://example.com/portfolio' }),
    createDivider(),
  ],
  poster: () => [
    createHeading({ content: 'название события' }),
    createText({ content: 'дата · время\nместо проведения' }),
    createImage({ alt: 'постер события', caption: 'программа и детали' }),
    createLink({ label: 'зарегистрироваться', url: 'https://example.com/register' }),
  ],
  guide: () => [
    createHeading({ content: 'мини-справочник' }),
    createText({ content: 'о чём эта инструкция и кому она пригодится.' }),
    createDivider(),
    createHeading({ content: 'раздел', level: 2 }),
    createText({ content: 'текст раздела.' }),
    createLink({ label: 'дополнительный материал', url: 'https://example.com/guide' }),
  ],
});

const templates = Object.freeze(Object.keys(TEMPLATE_LABELS).reduce((result, key) => {
  result[key] = Object.freeze({
    id: key,
    label: TEMPLATE_LABELS[key],
    createBlocks: templateFactories[key],
  });
  return result;
}, {}));

function createDefaultProject(template = 'note') {
  const templateId = templates[template] ? template : 'note';
  return {
    id: createId('project'),
    title: templateId === 'note' ? 'новая заметка' : templateId === 'blank' ? 'новая страница' : TEMPLATE_LABELS[templateId],
    template: templateId,
    settings: { ...DEFAULT_SETTINGS },
    blocks: templateFactories[templateId](),
  };
}

// The complete in-memory state is intentionally small and serializable.
const state = {
  ...createDefaultProject('note'),
  selectedBlockId: null,
};

const history = {
  past: [],
  future: [],
  lastFieldKey: '',
  lastFieldAt: 0,
};

let saveTimer = null;
let statusTimer = null;
const dialogFocus = new WeakMap();
let dragState = null;

let initialized = false;

const dom = {
  title: null,
  status: null,
  saveState: null,
  undoButton: null,
  redoButton: null,
  list: null,
  editor: null,
  settingsMount: null,
  previewMount: null,
  previewStatus: null,
  shell: null,
  imageFile: null,
  projectFile: null,
  exportButton: null,
  zipExportButton: null,
  importButton: null,
};

function getBlock(id) {
  return state.blocks.find((block) => block.id === id) || null;
}

function getSelectedBlock() {
  return getBlock(state.selectedBlockId) || state.blocks[0] || null;
}

function projectSnapshot() {
  return {
    version: PROJECT_VERSION,
    id: state.id,
    title: state.title,
    template: state.template,
    selectedBlockId: state.selectedBlockId,
    settings: { ...state.settings },
    blocks: state.blocks.map((block) => ({ ...block })),
  };
}

function applySnapshot(snapshot) {
  Object.assign(state, {
    id: snapshot.id,
    title: snapshot.title,
    template: snapshot.template,
    selectedBlockId: snapshot.selectedBlockId,
    settings: { ...snapshot.settings },
    blocks: snapshot.blocks.map((block) => ({ ...block })),
  });
}

function updateHistoryButtons() {
  if (dom.undoButton) dom.undoButton.disabled = history.past.length === 0;
  if (dom.redoButton) dom.redoButton.disabled = history.future.length === 0;
}

function rememberMutation(label, { fieldKey = '', force = false } = {}) {
  const now = Date.now();
  const canCoalesce = !force && fieldKey && history.lastFieldKey === fieldKey && now - history.lastFieldAt < 700;
  if (!canCoalesce) history.past.push({ label, snapshot: projectSnapshot() });
  if (history.past.length > MAX_HISTORY) history.past.shift();
  history.future.length = 0;
  history.lastFieldKey = fieldKey;
  history.lastFieldAt = now;
  updateHistoryButtons();
}

function commitMutation(label, mutator, options = {}) {
  rememberMutation(label, options);
  mutator();
  markDirty();
}

function undo() {
  const entry = history.past.pop();
  if (!entry) return false;
  history.future.push({ label: entry.label, snapshot: projectSnapshot() });
  applySnapshot(entry.snapshot);
  history.lastFieldKey = '';
  renderAll();
  markDirty();
  setProjectStatus(`отменено: ${entry.label}.`);
  return true;
}

function redo() {
  const entry = history.future.pop();
  if (!entry) return false;
  history.past.push({ label: entry.label, snapshot: projectSnapshot() });
  applySnapshot(entry.snapshot);
  history.lastFieldKey = '';
  renderAll();
  markDirty();
  setProjectStatus(`повторено: ${entry.label}.`);
  return true;
}

function markDirty() {
  if (dom.saveState) dom.saveState.textContent = 'сохраняем…';
  scheduleSave();
  updateHistoryButtons();
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToStorage, 350);
}

function saveToStorage() {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectSnapshot()));
    if (dom.saveState) {
      dom.saveState.textContent = 'сохранено в браузере';
      delete dom.saveState.dataset.status;
    }
    return true;
  } catch {
    if (dom.saveState) {
      dom.saveState.textContent = 'не сохранено · скачайте json';
      dom.saveState.dataset.status = 'error';
    }
    setProjectStatus('браузер не сохранил изменения. выберите «проект → сохранить проект», чтобы не потерять работу.', true);
    return false;
  }
}

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeImportedProject(JSON.parse(raw), { allowDraftUrls: true });
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be unavailable */ }
    return null;
  }
}

function rememberFocus() {
  if (typeof document === 'undefined') return null;
  const active = document.activeElement;
  if (!active || (!dom.editor?.contains(active) && !dom.list?.contains(active))) return null;
  const focusKey = active.dataset.focusKey;
  if (!focusKey) return null;
  return {
    focusKey,
    start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
    end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
  };
}

function restoreFocus(snapshot) {
  if (!snapshot || !dom.editor) return;
  const controls = [...dom.editor.querySelectorAll('[data-focus-key]'), ...(dom.list?.querySelectorAll('[data-focus-key]') || [])];
  const target = Array.from(controls).find((control) => control.dataset.focusKey === snapshot.focusKey);
  if (!target) return;
  target.focus({ preventScroll: true });
  if (snapshot.start !== null && typeof target.setSelectionRange === 'function') {
    const length = String(target.value || '').length;
    target.setSelectionRange(Math.min(snapshot.start, length), Math.min(snapshot.end ?? snapshot.start, length));
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeHref(value) {
  const href = String(value ?? '').trim();
  // Backslashes can be normalized into URL separators by browsers; reject them
  // before checking protocols so //\\evil.com and \\evil.com stay relative-safe.
  if (!href || /[\\\u0000-\u001F\u007F]/.test(href) || href.startsWith('//')) return '';
  if (/^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);base64,[a-z\d+/]+=*$/i.test(href)) return href;
  if (/^https:\/\//i.test(href)) {
    try {
      return new URL(href).protocol === 'https:' ? href : '';
    } catch {
      return '';
    }
  }
  // Permit relative paths, hashes, and query strings. Explicit protocols are rejected.
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return '';
  return href;
}

function safeLinkHref(value) {
  const href = safeHref(value);
  return /^data:/i.test(href) ? '' : href;
}

function textHtml(value, emptyLabel) {
  const text = String(value ?? '');
  if (!text.trim()) return `<span class="empty-hint">${escapeHtml(emptyLabel)}</span>`;
  return escapeHtml(text).replace(/\r?\n/g, '<br>');
}

function renderPreview(project = state, { mount = true } = {}) {
  const editing = mount && !dom.shell?.classList.contains('full-preview');
  const blocks = Array.isArray(project?.blocks) ? project.blocks : [];
  const content = blocks.map((block) => {
    if (!block || !block.type) return '';
    const selection = editing ? ` data-preview-block-id="${escapeHtml(block.id || '')}"` : '';
    if (block.type === 'heading') {
      if (!editing && !String(block.content || '').trim()) return '';
      const level = Math.min(3, Math.max(1, Number(block.level) || 1));
      return `<h${level} class="preview-block preview-heading"${selection}>${textHtml(block.content, 'добавьте заголовок')}</h${level}>`;
    }
    if (block.type === 'text') {
      if (!editing && !String(block.content || '').trim()) return '';
      return `<p class="preview-block preview-text"${selection}>${textHtml(block.content, 'добавьте текст')}</p>`;
    }
    if (block.type === 'image') {
      const src = safeHref(block.src);
      if (!editing && !src) return '';
      const caption = String(block.caption ?? '').trim();
      const media = src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt || '')}" loading="lazy"${mount ? ` data-image-block-id="${escapeHtml(block.id || '')}"` : ''}>`
        : '<div class="preview-image-placeholder" role="img" aria-label="изображение не добавлено"><span class="placeholder-cross" aria-hidden="true">+</span><span>добавьте изображение</span></div>';
      return `<figure class="preview-block preview-image"${selection}>${media}${caption ? `<figcaption class="page-caption">${textHtml(caption, '')}</figcaption>` : ''}</figure>`;
    }
    if (block.type === 'link') {
      const href = safeLinkHref(block.url);
      if (!editing && (!href || !String(block.label || '').trim())) return '';
      const label = textHtml(block.label, 'добавьте текст ссылки');
      return href
        ? `<p class="preview-block preview-link"${selection}><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`
        : `<p class="preview-block preview-link is-disabled"${selection}><span aria-disabled="true">${label}</span><small class="empty-hint">укажите адрес https://, путь или якорь</small></p>`;
    }
    if (block.type === 'divider') {
      return block.style === 'space'
        ? `<div class="preview-block preview-space"${selection} aria-hidden="true"></div>`
        : `<hr class="preview-block preview-rule"${selection}>`;
    }
    return '';
  }).join('');
  const empty = editing ? '<div class="preview-empty"><h2>здесь будет ваша страница</h2><p>добавьте заголовок, текст или изображение в панели слева.</p><button class="button button-quiet" type="button" data-action="add-first-block">добавить текст</button></div>' : '';
  const html = `<article class="page-preview"${mount ? ' tabindex="-1"' : ''} data-template="${escapeHtml(project?.template || 'note')}">${content || empty}</article>`;
  if (mount && dom.previewMount) {
    dom.previewMount.innerHTML = html;
    updatePreviewSelection();
  }
  if (mount && dom.previewStatus) dom.previewStatus.textContent = 'предпросмотр обновлён.';
  return html;
}

function updatePreviewSelection() {
  dom.previewMount?.querySelectorAll('[data-preview-block-id]').forEach((block) => {
    block.classList.toggle('is-editing', block.dataset.previewBlockId === state.selectedBlockId);
  });
}

function setProjectStatus(message, isError = false) {
  const target = dom.status;
  if (!target) return;
  if (statusTimer) clearTimeout(statusTimer);
  target.textContent = message;
  target.hidden = !message;
  target.dataset.status = isError ? 'error' : 'success';
  target.setAttribute('role', isError ? 'alert' : 'status');
  if (message && !isError) statusTimer = setTimeout(() => { target.hidden = true; }, 4500);
}

function projectPayload() {
  return projectSnapshot();
}

function exportProject() {
  try {
    if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof document === 'undefined') throw new Error('браузер не поддерживает локальную загрузку файлов.');
    const blob = new Blob([JSON.stringify(projectPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'static-studio-project.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setProjectStatus('проект экспортирован в static-studio-project.json.');
    return true;
  } catch (error) {
    setProjectStatus(`не удалось экспортировать проект: ${error.message}`, true);
    return false;
  }
}

function asBytes(value) {
  if (typeof value === 'string') return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new TypeError('ZIP entry data must be a string or byte array.');
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(input) {
  const bytes = asBytes(input);
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeU16(view, offset, value) { view.setUint16(offset, value, true); }
function writeU32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

function zipEntries(files) {
  if (files instanceof Map) return Array.from(files.entries()).map(([name, data]) => ({ name, data }));
  if (Array.isArray(files)) return files.map((entry) => Array.isArray(entry)
    ? { name: entry[0], data: entry[1] }
    : { name: entry.name ?? entry.path, data: entry.data ?? entry.content });
  if (files && typeof files === 'object') return Object.entries(files).map(([name, data]) => ({ name, data }));
  throw new TypeError('ZIP files must be an object, Map, or array.');
}

function validateZipName(name) {
  const normalizedName = String(name ?? '');
  const segments = normalizedName.split('/');
  const nameBytes = new TextEncoder().encode(normalizedName);
  if (!normalizedName
    || normalizedName.startsWith('/')
    || /^[a-zA-Z]:[\\/]/.test(normalizedName)
    || /[\\\u0000-\u001F\u007F]/.test(normalizedName)
    || segments.some((segment) => !segment || segment === '.' || segment === '..')
    || nameBytes.length > MAX_ZIP_NAME_BYTES) {
    throw new Error('ZIP entry has an unsafe or overly long name.');
  }
  return { name: normalizedName, nameBytes };
}

function buildZip(files) {
  const rawEntries = zipEntries(files);
  if (rawEntries.length > MAX_ZIP_ENTRIES) throw new Error('ZIP contains too many entries.');
  const names = new Set();
  const entries = rawEntries.map(({ name, data }) => {
    const validated = validateZipName(name);
    const key = validated.name.toLowerCase();
    if (names.has(key)) throw new Error('ZIP contains duplicate entry names.');
    names.add(key);
    const bytes = asBytes(data);
    if (bytes.length > MAX_ZIP_VALUE) throw new Error('ZIP entry is too large.');
    return { ...validated, data: bytes };
  });
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const header = new Uint8Array(30 + entry.nameBytes.length);
    const view = new DataView(header.buffer);
    writeU32(view, 0, 0x04034B50);
    writeU16(view, 4, 10);
    writeU16(view, 6, 0x0800);
    writeU16(view, 8, 0);
    writeU16(view, 10, 0);
    writeU16(view, 12, 0);
    writeU32(view, 14, crc32(entry.data));
    writeU32(view, 18, entry.data.length);
    writeU32(view, 22, entry.data.length);
    writeU16(view, 26, entry.nameBytes.length);
    writeU16(view, 28, 0);
    header.set(entry.nameBytes, 30);
    localParts.push(header, entry.data);

    const central = new Uint8Array(46 + entry.nameBytes.length);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014B50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 10);
    writeU16(centralView, 8, 0x0800);
    writeU16(centralView, 10, 0);
    writeU16(centralView, 12, 0);
    writeU16(centralView, 14, 0);
    writeU32(centralView, 16, crc32(entry.data));
    writeU32(centralView, 20, entry.data.length);
    writeU32(centralView, 24, entry.data.length);
    writeU16(centralView, 28, entry.nameBytes.length);
    writeU16(centralView, 30, 0);
    writeU16(centralView, 32, 0);
    writeU16(centralView, 34, 0);
    writeU16(centralView, 36, 0);
    writeU32(centralView, 38, 0);
    writeU32(centralView, 42, offset);
    central.set(entry.nameBytes, 46);
    centralParts.push(central);
    offset += header.length + entry.data.length;
    if (offset > MAX_ZIP_VALUE) throw new Error('ZIP archive is too large.');
  }
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  if (centralSize > MAX_ZIP_VALUE || centralOffset + centralSize > MAX_ZIP_VALUE) throw new Error('ZIP archive is too large.');
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  writeU32(eocdView, 0, 0x06054B50);
  writeU16(eocdView, 4, 0);
  writeU16(eocdView, 6, 0);
  writeU16(eocdView, 8, entries.length);
  writeU16(eocdView, 10, entries.length);
  writeU32(eocdView, 12, centralSize);
  writeU32(eocdView, 16, centralOffset);
  writeU16(eocdView, 20, 0);
  return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
}

function decodeBase64(payload) {
  const normalized = payload.replace(/\s/g, '');
  if (typeof atob === 'function') {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(normalized, 'base64'));
  throw new Error('This browser cannot decode image data.');
}

function parseImageDataUrl(value) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(String(value || ''));
  if (!match || !IMAGE_MIME_EXTENSIONS[match[1].toLowerCase()]) return null;
  return { mime: match[1].toLowerCase(), bytes: decodeBase64(match[2]) };
}

function safeAssetName(rawName, mime, index, usedNames) {
  const fallbackExtension = IMAGE_MIME_EXTENSIONS[mime] || 'bin';
  const original = String(rawName || '').split(/[\\/]/).pop().split('?')[0];
  const cleaned = original.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  let stem = (cleaned.replace(/\.[a-zA-Z0-9]{1,8}$/, '').replace(/[.]+$/g, '') || `image-${index + 1}`);
  const reserved = new Set(['con', 'prn', 'aux', 'nul', 'clock$', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9']);
  if (reserved.has(stem.toLowerCase())) stem = `image-${stem}`;
  const extension = `.${fallbackExtension}`;
  const limit = 180 - new TextEncoder().encode(extension).length;
  while (new TextEncoder().encode(stem).length > limit) stem = stem.slice(0, Math.max(1, stem.length - 8));
  let candidate = `${stem}${extension}`;
  let serial = 2;
  const hasName = (name) => usedNames.has(name) || usedNames.has(name.toLowerCase());
  while (hasName(candidate)) {
    const suffix = `-${serial++}`;
    const stemLimit = 180 - new TextEncoder().encode(extension + suffix).length;
    const compactStem = stem.slice(0, Math.max(1, stemLimit));
    candidate = `${compactStem}${suffix}${extension}`;
  }
  usedNames.add(candidate);
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function exportStyles(settings = {}) {
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toUpperCase() : fallback;
  const width = Math.min(1440, Math.max(480, Number(settings.width) || DEFAULT_SETTINGS.width));
  const headingFont = EXPORT_FONT_STACKS[settings.headingFont] || EXPORT_FONT_STACKS[DEFAULT_SETTINGS.headingFont];
  const bodyFont = EXPORT_FONT_STACKS[settings.bodyFont] || EXPORT_FONT_STACKS[DEFAULT_SETTINGS.bodyFont];
  return EXPORT_STYLES
    .replace('--paper: #F3EBDD;', `--paper: ${color(settings.paper, DEFAULT_SETTINGS.paper)};`)
    .replace('--ink: #28251F;', `--ink: ${color(settings.ink, DEFAULT_SETTINGS.ink)};`)
    .replace('--accent: #C95B43;', `--accent: ${color(settings.accent, DEFAULT_SETTINGS.accent)};`)
    .replace('--page-width: 960px;', `--page-width: ${width}px;`)
    .replace('--heading-font: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;', `--heading-font: ${headingFont};`)
    .replace('--body-font: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;', `--body-font: ${bodyFont};`);
}

function buildExportFiles(project = state) {
  const source = project && typeof project === 'object' ? project : state;
  const usedNames = new Set();
  const assets = [];
  const blocks = (Array.isArray(source.blocks) ? source.blocks : []).map((block, index) => {
    const copy = { ...block };
    if (copy.type === 'image') {
      const image = parseImageDataUrl(copy.src);
      if (image) {
        const name = safeAssetName(copy.name, image.mime, index, usedNames);
        assets.push({ name: `assets/${name}`, data: image.bytes });
        copy.src = `assets/${name}`;
      }
    }
    return copy;
  });
  const exportProject = { ...source, blocks };
  const title = escapeHtml(String(source.title || 'static studio'));
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="${/^#[0-9a-f]{6}$/i.test(source.settings?.paper || '') ? source.settings.paper : DEFAULT_SETTINGS.paper}">
    <meta name="description" content="локальная статичная страница, собранная в static studio.">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body><main>${renderPreview(exportProject, { mount: false })}</main></body>
</html>
`;
  return {
    'index.html': html,
    'styles.css': exportStyles(source.settings),
    ...Object.fromEntries(assets.map((asset) => [asset.name, asset.data])),
  };
}

function exportZip(project = state) {
  try {
    const blob = buildZip(buildExportFiles(project));
    if (typeof document === 'undefined' || typeof URL === 'undefined') return blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'static-studio-export.zip';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    const hasExternalImages = (project.blocks || []).some((block) => block?.type === 'image' && block.src && !/^data:image\//i.test(block.src));
    setProjectStatus(hasExternalImages
      ? 'сайт скачан. картинки по внешним ссылкам требуют интернета.'
      : 'сайт скачан. распакуйте zip и откройте index.html.');
    return blob;
  } catch (error) {
    setProjectStatus(`не удалось скачать сайт: ${error.message}`, true);
    return false;
  }
}

function normalizeImportedProject(input, { allowDraftUrls = false } = {}) {
  if (input?.version !== undefined && input.version !== 1 && input.version !== PROJECT_VERSION) throw new Error(`неподдерживаемая версия проекта: ${input.version}.`);
  if (!input || typeof input !== 'object' || !Array.isArray(input.blocks) || input.blocks.length > MAX_BLOCKS) throw new Error(`файл проекта должен содержать не более ${MAX_BLOCKS} блоков.`);
  if (input.template !== undefined && (typeof input.template !== 'string' || !Object.hasOwn(templates, input.template))) throw new Error('файл содержит неизвестный шаблон.');
  const template = input.template === undefined ? 'note' : input.template;
  const settingsInput = input.settings && typeof input.settings === 'object' ? input.settings : {};
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key === 'width') {
      const width = Number(settingsInput[key]);
      if (Number.isFinite(width)) settings.width = Math.min(1440, Math.max(480, Math.round(width)));
    } else if (['paper', 'ink', 'accent'].includes(key)) {
      if (/^#[0-9a-f]{6}$/i.test(String(settingsInput[key] || ''))) settings[key] = String(settingsInput[key]).toUpperCase();
    } else if (typeof settingsInput[key] === 'string' && Object.hasOwn(FONT_STACKS, settingsInput[key])) settings[key] = settingsInput[key];
  }
  const usedIds = new Set();
  const blocks = input.blocks.map((raw) => {
    if (!raw || typeof raw !== 'object' || !Object.hasOwn(blockFactories, raw.type) || typeof blockFactories[raw.type] !== 'function') throw new Error('файл содержит неизвестный тип блока.');
    const factory = blockFactories[raw.type];
    let id = typeof raw.id === 'string' && raw.id && raw.id.length <= 120 ? raw.id : createId(raw.type);
    if (usedIds.has(id)) id = createId(raw.type);
    usedIds.add(id);
    const safe = factory({ id });
    for (const key of Object.keys(safe)) {
      if (key === 'id' || key === 'type') continue;
      if (typeof raw[key] === typeof safe[key]) {
        if (typeof raw[key] === 'string' && raw[key].length > (key === 'src' ? MAX_IMAGE_DATA_URL_LENGTH : MAX_TEXT_LENGTH)) throw new Error('файл содержит слишком длинное поле.');
        safe[key] = raw[key];
      }
    }
    if (safe.type === 'heading') safe.level = Math.min(3, Math.max(1, Number(safe.level) || 1));
    if (safe.type === 'image' && safe.src && !allowDraftUrls) {
      if (!safeHref(safe.src)) throw new Error('файл содержит небезопасный или неподдерживаемый адрес изображения.');
      if (/^data:/i.test(safe.src) && !parseImageDataUrl(safe.src)) throw new Error('файл содержит неподдерживаемый формат изображения.');
    }
    if (safe.type === 'link' && safe.url && !allowDraftUrls && !safeLinkHref(safe.url)) throw new Error('файл содержит небезопасный адрес ссылки.');
    return safe;
  });
  const selectedBlockId = typeof input.selectedBlockId === 'string' && usedIds.has(input.selectedBlockId) ? input.selectedBlockId : blocks[0]?.id || null;
  return { id: typeof input.id === 'string' && input.id.length <= 120 ? input.id : createId('project'), title: typeof input.title === 'string' ? input.title.slice(0, MAX_TITLE_LENGTH) : 'новая страница', template, settings, blocks, selectedBlockId };
}

function importProjectData(input) {
  const next = normalizeImportedProject(input);
  rememberMutation('импорт проекта', { force: true });
  Object.assign(state, next, { selectedBlockId: next.selectedBlockId || next.blocks[0]?.id || null });
  renderAll();
  markDirty();
  setProjectStatus('проект импортирован.');
  return true;
}

function applySettings() {
  if (typeof document === 'undefined') return;
  const settings = state.settings || DEFAULT_SETTINGS;
  const root = dom.previewMount;
  if (!root) return;
  const width = Math.min(1440, Math.max(480, Number(settings.width) || DEFAULT_SETTINGS.width));
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value).toUpperCase() : fallback;
  root.style.setProperty('--page-width', `${width}px`);
  root.style.setProperty('--paper', color(settings.paper, DEFAULT_SETTINGS.paper));
  root.style.setProperty('--ink', color(settings.ink, DEFAULT_SETTINGS.ink));
  root.style.setProperty('--accent', color(settings.accent, DEFAULT_SETTINGS.accent));
  root.style.setProperty('--heading-font', FONT_STACKS[settings.headingFont] || FONT_STACKS.serif);
  root.style.setProperty('--body-font', FONT_STACKS[settings.bodyFont] || FONT_STACKS.mono);
}

const PALETTES = Object.freeze({
  paper: { label: 'бумага', paper: '#FFFDF7', ink: '#292E2B', accent: '#315D4A' },
  light: { label: 'светлая', paper: '#FFFFFF', ink: '#252A32', accent: '#3659A1' },
  dark: { label: 'тёмная', paper: '#252A28', ink: '#F2F0E7', accent: '#B5D3A4' },
});

function applyPalette(name) {
  const palette = PALETTES[name];
  if (!palette) return false;
  rememberMutation('смена палитры', { force: true });
  Object.assign(state.settings, { paper: palette.paper, ink: palette.ink, accent: palette.accent });
  applySettings();
  syncSettingControls({ preserveActive: false });
  renderPreview(state);
  markDirty();
  return true;
}

function renderSettings() {
  if (!dom.settingsMount) return;
  const settings = state.settings || DEFAULT_SETTINGS;
  const widthOptions = WIDTH_PRESETS.map((width) => `<option value="${width}"${Number(settings.width) === width ? ' selected' : ''}>${width} px</option>`).join('');
  const fonts = [['serif', 'с засечками'], ['grotesk', 'гротеск'], ['system', 'системный'], ['mono', 'моноширинный']];
  const fontOptions = (value) => fonts.map(([key, label]) => `<option value="${key}"${value === key ? ' selected' : ''}>${label}</option>`).join('');
  dom.settingsMount.innerHTML = `
    <div class="setting-group"><h3>палитра</h3><div class="palette-options">${Object.entries(PALETTES).map(([key, palette]) => `<button class="palette-button" type="button" data-action="palette" data-palette="${key}" aria-pressed="${['paper', 'ink', 'accent'].every((field) => settings[field] === palette[field])}"><span class="palette-sample" style="background:${palette.paper};color:${palette.ink}">а<span style="background:${palette.accent}"></span></span>${palette.label}</button>`).join('')}</div></div>
    <div class="setting-group"><h3>цвета</h3>${[['paper', 'фон'], ['ink', 'текст'], ['accent', 'ссылки']].map(([key, label]) => `<label class="color-field" for="page-${key}"><span>${label}</span><span class="color-value" data-color-value="${key}">${settings[key].toLowerCase()}</span><input id="page-${key}" data-setting="${key}" type="color" value="${settings[key]}"></label>`).join('')}</div>
    <div class="setting-group"><h3>шрифты</h3><label class="field-label" for="page-heading-font">заголовки</label><select class="select-control" id="page-heading-font" data-setting="headingFont">${fontOptions(settings.headingFont)}</select><label class="field-label" for="page-body-font">основной текст</label><select class="select-control" id="page-body-font" data-setting="bodyFont">${fontOptions(settings.bodyFont)}</select></div>
    <div class="setting-group"><h3>ширина</h3><label class="visually-hidden" for="page-width-preset">ширина страницы</label><select class="select-control" id="page-width-preset" data-setting="widthPreset"><option value="">своя ширина</option>${widthOptions}</select><label class="field-label" for="page-width">своя ширина, px</label><input class="text-control" id="page-width" data-setting="width" type="number" min="480" max="1440" step="1" value="${settings.width}"></div>`;
  applySettings();
}

function syncSettingControls({ preserveActive = true } = {}) {
  if (!dom.settingsMount) return;
  const settings = state.settings;
  dom.settingsMount.querySelectorAll('[data-color-value]').forEach((label) => {
    label.textContent = (settings[label.dataset.colorValue] || '').toLowerCase();
  });
  dom.settingsMount.querySelectorAll('[data-setting]').forEach((control) => {
    if (preserveActive && document.activeElement === control) return;
    control.value = control.dataset.setting === 'widthPreset' ? (WIDTH_PRESETS.includes(settings.width) ? settings.width : '') : settings[control.dataset.setting];
  });
  dom.settingsMount.querySelectorAll('[data-palette]').forEach((button) => {
    const palette = PALETTES[button.dataset.palette];
    button.setAttribute('aria-pressed', String(['paper', 'ink', 'accent'].every((field) => settings[field] === palette[field])));
  });
}

function fieldLabel(label, html) {
  return `<label class="field-label">${escapeHtml(label)}${html}</label>`;
}

function inputField({ block, field, label, value, type = 'text', placeholder = '' }) {
  const input = `<input class="text-control editor-field" name="block-${escapeHtml(block.id)}-${escapeHtml(field)}" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}" type="${type}" value="${escapeHtml(value)}"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}>`;
  return fieldLabel(label, input);
}

function textareaField({ block, field, label, value, placeholder = '' }) {
  const textarea = `<textarea class="text-control editor-field" name="block-${escapeHtml(block.id)}-${escapeHtml(field)}" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}" rows="4"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}>${escapeHtml(value)}</textarea>`;
  return fieldLabel(label, textarea);
}

function selectField({ block, field, label, value, options }) {
  const optionsHtml = options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? ' selected' : ''}>${escapeHtml(optionLabel)}</option>`).join('');
  const select = `<select class="select-control editor-field" name="block-${escapeHtml(block.id)}-${escapeHtml(field)}" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}">${optionsHtml}</select>`;
  return fieldLabel(label, select);
}

const ICON_PATHS = Object.freeze({
  heading: '<path d="M5 5v14M19 5v14M5 12h14"/>',
  text: '<path d="M4 5h16M4 10h16M4 15h16M4 20h10"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
  link: '<path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(0 -1) scale(.95)"/>',
  divider: '<path d="M4 12h16"/>',
  'move-up': '<path d="m6 10 6-6 6 6M12 4v16"/>',
  'move-down': '<path d="m6 14 6 6 6-6M12 4v16"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  delete: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
});

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.text}</svg>`;
}

function renderComposition() {
  const label = typeof document !== 'undefined' ? document.querySelector('#template-name') : null;
  if (label) label.textContent = TEMPLATE_LABELS[state.template];
}

function actionButton(action, label, disabled = false) {
  return `<button class="icon-button block-action${action === 'delete' ? ' delete-action' : ''}" type="button" data-action="${action}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>${icon(action)}</button>`;
}

function blockSummary(block) {
  if (block.type === 'heading' || block.type === 'text') return String(block.content || '').split('\n')[0] || (block.type === 'heading' ? 'пустой заголовок' : 'пустой текст');
  if (block.type === 'link') return block.label || 'новая ссылка';
  if (block.type === 'image') return block.caption || block.name || 'новое изображение';
  return block.style === 'space' ? 'отступ' : 'тонкая линия';
}

function renderBlockList() {
  if (!dom.list) return;
  dom.list.innerHTML = state.blocks.map((block) => {
    const selected = block.id === state.selectedBlockId;
    const typeLabel = BLOCK_LABELS[block.type];
    return `<li class="block-item${selected ? ' is-selected' : ''}" data-block-id="${escapeHtml(block.id)}" draggable="true">
      <button class="block-select" type="button" data-action="select" data-block-id="${escapeHtml(block.id)}" data-focus-key="row:${escapeHtml(block.id)}" aria-pressed="${selected}" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown">
        <span class="block-type-icon">${icon(block.type)}</span><span class="block-row-copy"><span class="block-summary">${escapeHtml(blockSummary(block))}</span><span class="block-name">${typeLabel}</span></span><span class="block-grip" aria-hidden="true">⠿</span>
      </button></li>`;
  }).join('') || '<li class="blocks-empty">добавьте первый блок</li>';
  const count = document.querySelector('#block-count');
  if (count) count.textContent = state.blocks.length;
}

function renderBlockEditor() {
  if (!dom.editor) return;
  const block = getSelectedBlock();
  if (!block) {
    dom.editor.innerHTML = '';
    dom.editor.closest('.editor-section')?.setAttribute('hidden', '');
    return;
  }
  dom.editor.closest('.editor-section')?.removeAttribute('hidden');
  const index = state.blocks.indexOf(block);
  let html = `<div class="editor-block-heading" data-block-id="${escapeHtml(block.id)}"><h2>${BLOCK_LABELS[block.type]}</h2><div class="block-actions">${actionButton('move-up', 'переместить выше', index === 0)}${actionButton('move-down', 'переместить ниже', index === state.blocks.length - 1)}${actionButton('duplicate', 'сделать копию')}${actionButton('delete', 'удалить блок')}</div></div>`;
  if (block.type === 'heading') {
    html += textareaField({ block, field: 'content', label: 'текст заголовка', value: block.content, placeholder: 'введите заголовок' });
    html += selectField({ block, field: 'level', label: 'уровень', value: String(block.level || 1), options: [['1', 'крупный'], ['2', 'средний'], ['3', 'малый']] });
  } else if (block.type === 'text') {
    html += textareaField({ block, field: 'content', label: 'текст', value: block.content, placeholder: 'введите текст блока' });
  } else if (block.type === 'image') {
    html += `<button class="button button-quiet image-upload-button" type="button" data-action="upload-image" data-block-id="${escapeHtml(block.id)}">загрузить изображение</button>`;
    if (block.src) html += `<button class="button button-quiet image-clear-button" type="button" data-action="clear-image" data-block-id="${escapeHtml(block.id)}">убрать изображение</button>`;
    if (/^data:image\//i.test(block.src)) {
      html += `<p class="file-name">${escapeHtml(block.name || 'изображение с устройства')}</p>`;
    } else {
      html += inputField({ block, field: 'src', label: 'или ссылка на изображение', value: block.src, type: 'text', placeholder: 'https://example.com/image.jpg' });
    }
    html += inputField({ block, field: 'alt', label: 'описание', value: block.alt, placeholder: 'что изображено' });
    html += inputField({ block, field: 'caption', label: 'подпись', value: block.caption, placeholder: 'необязательно' });
  } else if (block.type === 'link') {
    html += inputField({ block, field: 'label', label: 'текст ссылки', value: block.label, placeholder: 'название ссылки' });
    html += inputField({ block, field: 'url', label: 'адрес', value: block.url, type: 'text', placeholder: 'https://example.com' });
  } else if (block.type === 'divider') {
    html += selectField({ block, field: 'style', label: 'разделитель', value: block.style || 'line', options: [['line', 'тонкая линия'], ['space', 'отступ']] });
  }
  dom.editor.innerHTML = html;
}

function renderAll(options = {}) {
  const focus = options.focus || rememberFocus();
  if (!state.selectedBlockId || !getBlock(state.selectedBlockId)) state.selectedBlockId = state.blocks[0]?.id || null;
  if (dom.title && document.activeElement !== dom.title) dom.title.value = state.title || '';
  renderComposition();
  renderBlockList();
  renderBlockEditor();
  renderSettings();
  renderPreview(state);
  updateHistoryButtons();
  restoreFocus(focus);
}

function moveBlock(id, direction) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return false;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= state.blocks.length) return false;
  commitMutation('перемещение блока', () => {
    [state.blocks[index], state.blocks[targetIndex]] = [state.blocks[targetIndex], state.blocks[index]];
  }, { force: true });
  state.selectedBlockId = id;
  renderAll({ focus: { focusKey: `row:${id}`, start: null, end: null } });
  setProjectStatus(`блок перемещён на позицию ${targetIndex + 1}.`);
  return true;
}

function newProject(templateId = 'note') {
  if (!Object.hasOwn(templates, templateId)) return false;
  rememberMutation('создание страницы', { force: true });
  const next = createDefaultProject(templateId);
  Object.assign(state, next, { selectedBlockId: next.blocks[0]?.id || null });
  renderAll();
  setPreviewMode(false);
  setEditorTab('content');
  markDirty();
  return true;
}

function addBlock(type) {
  if (state.blocks.length >= MAX_BLOCKS) {
    setProjectStatus(`нельзя добавить больше ${MAX_BLOCKS} блоков.`, true);
    return;
  }
  const factory = blockFactories[type] || createText;
  const block = factory();
  const selectedIndex = state.blocks.findIndex((item) => item.id === state.selectedBlockId);
  commitMutation('добавление блока', () => state.blocks.splice(selectedIndex < 0 ? state.blocks.length : selectedIndex + 1, 0, block), { force: true });
  state.selectedBlockId = block.id;
  renderAll({ focus: { focusKey: `${block.id}:${Object.keys(block).find((key) => key !== 'id' && key !== 'type') || 'content'}`, start: null, end: null } });
}

function duplicateBlock(id) {
  if (state.blocks.length >= MAX_BLOCKS) {
    setProjectStatus(`нельзя добавить больше ${MAX_BLOCKS} блоков.`, true);
    return;
  }
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  const original = state.blocks[index];
  const copy = { ...original, id: createId(original.type) };
  commitMutation('дублирование блока', () => state.blocks.splice(index + 1, 0, copy), { force: true });
  state.selectedBlockId = copy.id;
  renderAll({ focus: { focusKey: `row:${copy.id}`, start: null, end: null } });
}

function deleteBlock(id) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  commitMutation('удаление блока', () => state.blocks.splice(index, 1), { force: true });
  state.selectedBlockId = state.blocks[Math.min(index, state.blocks.length - 1)]?.id || null;
  renderAll();
  setProjectStatus('блок удалён. можно отменить.');
}

function updateBlockField(blockId, field, value) {
  const block = getBlock(blockId);
  if (!block || !(field in block)) return;
  const nextValue = field === 'level' ? Math.min(3, Math.max(1, Number(value) || 1)) : String(value ?? '').slice(0, field === 'content' ? MAX_TEXT_LENGTH : MAX_IMAGE_DATA_URL_LENGTH);
  if (block[field] === nextValue) return;
  const fieldKey = `${blockId}:${field}`;
  rememberMutation('редактирование блока', { fieldKey });
  block[field] = nextValue;
  updateBlockSummary(blockId);
  renderPreview(state);
  markDirty();
}

function updateBlockSummary(blockId) {
  const row = dom.list ? Array.from(dom.list.querySelectorAll('[data-block-id]')).find((item) => item.dataset.blockId === blockId) : null;
  const block = getBlock(blockId);
  const summary = row?.querySelector('.block-summary');
  if (summary && block) summary.textContent = blockSummary(block);
}

function handleClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget || !dom.list.contains(actionTarget)) return;
  const row = actionTarget.closest('[data-block-id]');
  if (!row) return;
  const id = row.dataset.blockId;
  const action = actionTarget.dataset.action;
  if (action === 'select') {
    state.selectedBlockId = id;
    renderAll({ focus: { focusKey: `row:${id}`, start: null, end: null } });
  } else if (action === 'move-up' || action === 'move-down') {
    moveBlock(id, action === 'move-up' ? 'up' : 'down');
  } else if (action === 'duplicate') {
    duplicateBlock(id);
  } else if (action === 'delete') {
    deleteBlock(id);
  }
}

function handleFieldInput(event) {
  const target = event.target.closest('.editor-field');
  if (!target || !dom.editor.contains(target)) return;
  updateBlockField(target.dataset.blockId, target.dataset.field, target.value);
}

function handleTitleInput(event) {
  if (!dom.title || event.target !== dom.title) return;
  const nextTitle = String(event.target.value || '').slice(0, MAX_TITLE_LENGTH);
  if (nextTitle === state.title) return;
  rememberMutation('изменение названия', { fieldKey: 'project:title' });
  state.title = nextTitle;
  markDirty();
}

function updateSetting(field, value) {
  if (!state.settings || !(field in state.settings)) return;
  const previous = state.settings[field];
  const fieldKey = `setting:${field}`;
  if (field === 'width') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const next = Math.min(1440, Math.max(480, Math.round(parsed)));
    if (next === previous) return;
    rememberMutation(`изменение настройки «${field}»`, { fieldKey });
    state.settings.width = next;
  } else if (['paper', 'ink', 'accent'].includes(field)) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    if (String(value).toUpperCase() === previous) return;
    rememberMutation(`изменение настройки «${field}»`, { fieldKey });
    state.settings[field] = value.toUpperCase();
  } else if (['headingFont', 'bodyFont'].includes(field) && FONT_STACKS[value]) {
    if (value === previous) return;
    rememberMutation(`изменение настройки «${field}»`, { fieldKey });
    state.settings[field] = value;
  }
  applySettings();
  syncSettingControls({ preserveActive: true });
  renderPreview(state);
  markDirty();
}

function handleSettingChange(event) {
  const target = event.target.closest('[data-setting]');
  if (!target || !dom.settingsMount.contains(target)) return;
  if (target.dataset.setting === 'width' && event.type === 'input') {
    const parsed = Number(target.value);
    if (Number.isFinite(parsed) && parsed >= 480 && parsed <= 1440) updateSetting('width', parsed);
    return;
  }
  if (target.dataset.setting === 'widthPreset') {
    if (target.value) updateSetting('width', target.value);
    return;
  }
  updateSetting(target.dataset.setting, target.value);
}

function setPreviewViewport(mode) {
  if (typeof document === 'undefined') return;
  const isMobile = mode === 'mobile';
  const frame = document.querySelector('#preview-mount');
  frame?.classList.toggle('is-mobile', isMobile);
  document.querySelectorAll('[data-preview-mode]').forEach((button) => {
    const active = button.dataset.previewMode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setPreviewMode(showPreview) {
  if (!dom.shell) return;
  dom.shell.classList.toggle('full-preview', showPreview);
  renderPreview(state);
  const toggle = document.querySelector('#mobile-preview-toggle');
  if (toggle) {
    toggle.textContent = showPreview ? 'редактор' : 'посмотреть';
    toggle.setAttribute('aria-pressed', String(showPreview));
  }
  if (showPreview) dom.previewMount?.querySelector('.page-preview')?.focus?.({ preventScroll: true });
  else toggle?.focus?.({ preventScroll: true });
}

function selectBlock(id, { focusField = false } = {}) {
  if (!getBlock(id)) return;
  state.selectedBlockId = id;
  setEditorTab('content');
  renderBlockList();
  renderBlockEditor();
  updatePreviewSelection();
  if (focusField) dom.editor?.querySelector('.editor-field, .image-upload-button')?.focus();
}

function setEditorTab(name) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-editor-tab]').forEach((tab) => {
    const active = tab.dataset.editorTab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !active;
  });
}

const TEMPLATE_DESCRIPTIONS = Object.freeze({
  note: 'для мыслей, текстов и записей',
  blank: 'начните с чистого листа',
  guide: 'шаги, материалы и полезные ссылки',
  portfolio: 'работы и немного о себе',
  poster: 'дата, место и подробности события',
});

function renderTemplateChoices() {
  const mount = document.querySelector('#template-grid');
  if (!mount) return;
  mount.innerHTML = ['note', 'blank', 'guide', 'portfolio', 'poster'].map((key) => `<button class="template-card template-${key}" type="button" data-action="choose-template" data-template="${key}"><span class="template-miniature" aria-hidden="true"><span class="mini-heading"></span><span class="mini-line"></span><span class="mini-line short"></span>${key === 'portfolio' || key === 'poster' ? '<span class="mini-image"></span>' : ''}</span><span class="template-name">${TEMPLATE_LABELS[key]}</span><span class="template-description">${TEMPLATE_DESCRIPTIONS[key]}</span></button>`).join('');
}

function openStarter() {
  document.querySelector('#new-page-warning').hidden = state.blocks.length === 0;
  showDialog('starter-dialog');
}

function showDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  const active = document.activeElement;
  const returnTo = active?.closest('#project-menu')?.querySelector('summary') || active;
  dialogFocus.set(dialog, returnTo);
  dialog.showModal();
}

function handleGlobalClick(event) {
  const target = event.target.closest('[data-action]');
  const action = target?.dataset.action;
  if (action) document.querySelector('#project-menu')?.removeAttribute('open');
  if (action === 'toggle-preview') {
    setPreviewMode(!dom.shell?.classList.contains('full-preview'));
  } else if (action === 'return-editor') {
    setPreviewMode(false);
  } else if (action === 'open-starter') {
    openStarter();
  } else if (action === 'open-help') {
    showDialog('help-dialog');
  } else if (action === 'choose-template') {
    newProject(target.dataset.template);
    dialogFocus.set(document.querySelector('#starter-dialog'), dom.title);
    document.querySelector('#starter-dialog')?.close();
    dom.title?.focus();
    dom.title?.select();
  } else if (action === 'add-first-block') {
    setPreviewMode(false);
    setEditorTab('content');
    addBlock('text');
  } else if (action === 'add-block') {
    document.querySelector('#add-menu')?.removeAttribute('open');
    addBlock(target.dataset.blockType);
  } else if (action === 'palette') {
    applyPalette(target.dataset.palette);
  } else if (['move-up', 'move-down', 'duplicate', 'delete'].includes(action) && dom.editor?.contains(target)) {
    const id = target.closest('[data-block-id]')?.dataset.blockId;
    if (action === 'move-up' || action === 'move-down') moveBlock(id, action === 'move-up' ? 'up' : 'down');
    else if (action === 'duplicate') duplicateBlock(id);
    else deleteBlock(id);
  } else if (action === 'upload-image') {
    const block = getSelectedBlock();
    if (block?.type === 'image') {
      if (dom.imageFile) dom.imageFile.dataset.blockId = block.id;
      dom.imageFile?.click();
    }
  } else if (action === 'clear-image') {
    const block = getSelectedBlock();
    if (block?.type === 'image') {
      rememberMutation('удаление изображения', { force: true });
      block.src = '';
      block.name = '';
      renderAll();
      markDirty();
    }
  }
  const previewBlock = event.target.closest('[data-preview-block-id]');
  if (previewBlock && !dom.shell?.classList.contains('full-preview')) {
    event.preventDefault();
    selectBlock(previewBlock.dataset.previewBlockId, { focusField: true });
  }
  if (!event.target.closest('#project-menu')) document.querySelector('#project-menu')?.removeAttribute('open');
  if (!event.target.closest('#add-menu')) document.querySelector('#add-menu')?.removeAttribute('open');
}

function handleImageFile(event) {
  const file = event.target.files?.[0];
  const block = getBlock(event.target.dataset.blockId) || getSelectedBlock();
  event.target.value = '';
  if (!file || !block || block.type !== 'image') return;
  if (!Object.hasOwn(IMAGE_MIME_EXTENSIONS, file.type)) return setProjectStatus('не удалось загрузить файл: выберите png, jpeg, gif, svg, webp или avif.', true);
  if (file.size > MAX_IMAGE_SIZE) return setProjectStatus('изображение слишком большое. максимум 10 мб.', true);
  const reader = new FileReader();
  reader.onerror = () => setProjectStatus('не удалось прочитать изображение.', true);
  reader.onload = () => {
    if (getBlock(block.id) !== block) {
      setProjectStatus('изображение не добавлено: блок уже изменён.', true);
      return;
    }
    rememberMutation('добавление изображения', { force: true });
    block.src = String(reader.result || '');
    block.name = file.name;
    if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, '');
    state.selectedBlockId = block.id;
    renderAll();
    markDirty();
    setProjectStatus(`изображение «${file.name}» добавлено.`);
  };
  reader.readAsDataURL(file);
}

function handlePreviewImageError(event) {
  const image = event.target.closest?.('img[data-image-block-id]');
  if (!image || !dom.previewMount?.contains(image)) return;
  const placeholder = document.createElement('div');
  placeholder.className = 'preview-image-placeholder is-error';
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', 'изображение не загрузилось');
  placeholder.innerHTML = '<span class="placeholder-cross" aria-hidden="true">!</span><span class="empty-hint">изображение не загрузилось</span>';
  image.replaceWith(placeholder);
  setProjectStatus('изображение не загрузилось. проверьте адрес или загрузите файл с устройства.', true);
}

function handleProjectFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > MAX_PROJECT_SIZE) {
    setProjectStatus('файл проекта слишком большой. максимум 15 мб.', true);
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => setProjectStatus('не удалось прочитать файл проекта.', true);
  reader.onload = () => {
    try {
      importProjectData(JSON.parse(String(reader.result || '')));
    } catch (error) {
      setProjectStatus(error instanceof SyntaxError ? 'файл проекта содержит некорректный json.' : `не удалось импортировать проект: ${error.message}`, true);
    }
  };
  reader.readAsText(file);
}

function handleKeydown(event) {
  if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  const row = event.target.closest('[data-block-id]');
  if (!row || !dom.list.contains(row)) return;
  event.preventDefault();
  moveBlock(row.dataset.blockId, event.key === 'ArrowUp' ? 'up' : 'down');
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    const openMenu = document.querySelector('#project-menu[open], #add-menu[open]');
    if (openMenu) {
      openMenu.removeAttribute('open');
      openMenu.querySelector('summary')?.focus();
    }
    return;
  }
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  const editable = event.target.matches?.('input, textarea, select, [contenteditable="true"]');
  if (editable) return;
  if (key === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo(); else undo();
  } else if (key === 'y') {
    event.preventDefault();
    redo();
  }
}

function handleDragStart(event) {
  const row = event.target.closest('[data-block-id]');
  if (!row || !dom.list.contains(row) || !event.dataTransfer) return;
  dragState = { id: row.dataset.blockId };
  row.classList.add('is-dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', row.dataset.blockId);
}

function clearDragState() {
  dom.list?.querySelectorAll('.is-dragging, .drop-target, .drop-after').forEach((row) => row.classList.remove('is-dragging', 'drop-target', 'drop-after'));
  dragState = null;
}

function handleDragEnd() {
  clearDragState();
}

function handleDrop(event) {
  const row = event.target.closest('[data-block-id]');
  if (!row || !dom.list.contains(row) || !event.dataTransfer) return;
  event.preventDefault();
  const fromId = event.dataTransfer.getData('text/plain');
  const fromIndex = state.blocks.findIndex((block) => block.id === fromId);
  const toIndex = state.blocks.findIndex((block) => block.id === row.dataset.blockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    clearDragState();
    return;
  }
  const rect = row.getBoundingClientRect();
  const after = event.clientY >= rect.top + rect.height / 2;
  const insertIndex = toIndex - (fromIndex < toIndex ? 1 : 0) + (after ? 1 : 0);
  if (insertIndex === fromIndex) { clearDragState(); return; }
  rememberMutation('перемещение блока', { force: true });
  const [moved] = state.blocks.splice(fromIndex, 1);
  state.blocks.splice(insertIndex, 0, moved);
  state.selectedBlockId = moved.id;
  markDirty();
  renderAll({ focus: { focusKey: `row:${moved.id}`, start: null, end: null } });
  clearDragState();
  setProjectStatus(`блок перемещён на позицию ${insertIndex + 1}.`);
}

function bindDom() {
  dom.title = document.querySelector('#project-title');
  dom.status = document.querySelector('#project-status');
  dom.saveState = document.querySelector('#save-state');
  dom.undoButton = document.querySelector('#undo-button');
  dom.redoButton = document.querySelector('#redo-button');
  dom.list = document.querySelector('#block-list');
  dom.editor = document.querySelector('#block-editor');
  dom.settingsMount = document.querySelector('#settings-mount');
  dom.previewMount = document.querySelector('#preview-mount');
  dom.previewStatus = document.querySelector('#preview-status');
  dom.shell = document.querySelector('.studio-shell');
  dom.imageFile = document.querySelector('#image-file');
  dom.projectFile = document.querySelector('#project-file');
  dom.exportButton = document.querySelector('#export-project');
  dom.zipExportButton = document.querySelector('#export-zip');
  dom.importButton = document.querySelector('#import-project');
  dom.title?.addEventListener('input', handleTitleInput);
  dom.undoButton?.addEventListener('click', undo);
  dom.redoButton?.addEventListener('click', redo);
  document.querySelectorAll('[data-preview-mode]').forEach((button) => button.addEventListener('click', () => setPreviewViewport(button.dataset.previewMode)));

  const addOptions = document.querySelector('#add-options');
  if (addOptions) addOptions.innerHTML = Object.entries(BLOCK_LABELS).map(([key, label]) => `<button type="button" data-action="add-block" data-block-type="${key}">${icon(key)}${label}</button>`).join('');
  document.querySelectorAll('[data-editor-tab]').forEach((tab) => {
    tab.addEventListener('click', () => setEditorTab(tab.dataset.editorTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'content' : event.key === 'End' ? 'design' : tab.dataset.editorTab === 'content' ? 'design' : 'content';
      setEditorTab(next);
      document.querySelector(`[data-editor-tab="${next}"]`)?.focus();
    });
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      const target = dialogFocus.get(dialog);
      if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  dom.list?.addEventListener('click', handleClick);
  dom.list?.addEventListener('keydown', handleKeydown);
  dom.list?.addEventListener('dragstart', handleDragStart);
  dom.list?.addEventListener('dragover', (event) => {
    const row = event.target.closest('[data-block-id]');
    if (!row || !dragState || row.dataset.blockId === dragState.id) return;
    event.preventDefault();
    dom.list.querySelectorAll('.drop-target, .drop-after').forEach((item) => item.classList.remove('drop-target', 'drop-after'));
    row.classList.add('drop-target');
    const rect = row.getBoundingClientRect();
    row.classList.toggle('drop-after', event.clientY >= rect.top + rect.height / 2);
  });
  dom.list?.addEventListener('drop', handleDrop);
  dom.list?.addEventListener('dragend', handleDragEnd);
  dom.editor?.addEventListener('input', handleFieldInput);
  dom.editor?.addEventListener('change', handleFieldInput);
  dom.settingsMount?.addEventListener('input', handleSettingChange);
  dom.settingsMount?.addEventListener('change', handleSettingChange);
  dom.imageFile?.addEventListener('change', handleImageFile);
  dom.projectFile?.addEventListener('change', handleProjectFile);
  dom.exportButton?.addEventListener('click', exportProject);
  dom.zipExportButton?.addEventListener('click', () => exportZip(state));
  dom.importButton?.addEventListener('click', () => {
    document.querySelector('#project-menu')?.removeAttribute('open');
    dom.projectFile?.click();
  });
  dom.exportButton?.addEventListener('click', () => document.querySelector('#project-menu')?.removeAttribute('open'));
  window.addEventListener('pagehide', saveToStorage);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleGlobalKeydown);
  dom.previewMount?.addEventListener('error', handlePreviewImageError, true);
}

function init() {
  if (typeof document === 'undefined' || initialized) return;
  initialized = true;
  bindDom();
  const restored = loadFromStorage();
  if (restored) Object.assign(state, restored);
  state.selectedBlockId = state.selectedBlockId || state.blocks[0]?.id || null;
  renderAll();
  renderTemplateChoices();
  if (restored && dom.saveState) dom.saveState.textContent = 'сохранено в браузере';
  if (!restored) {
    document.querySelector('#new-page-warning').hidden = true;
    document.querySelector('#starter-dialog')?.showModal();
  }
}

if (typeof document !== 'undefined') {
  init();
}

if (typeof window !== 'undefined') {
  window.StaticStudio = Object.freeze({
    DEFAULT_SETTINGS,
    BLOCK_LABELS,
    TEMPLATE_LABELS,
    createId,
    createHeading,
    createText,
    createImage,
    createLink,
    createDivider,
    blockFactories,
    templates,
    createDefaultProject,
    newProject,
    addBlock,
    applyPalette,
    state,
    safeHref,
    safeLinkHref,
    normalizeImportedProject,
    safeAssetName,
    renderPreview,
    exportProject,
    crc32,
    buildZip,
    buildExportFiles,
    exportZip,
    importProjectData,
    renderAll,
    moveBlock,
    undo,
    redo,
    setPreviewViewport,
    init,
  });
}
