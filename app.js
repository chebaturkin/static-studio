/* Static Studio: project state, starter compositions, and block editor. */

const BLOCK_LABELS = Object.freeze({
  heading: 'Заголовок',
  text: 'Текст',
  image: 'Изображение',
  link: 'Ссылка',
  divider: 'Разделитель',
});

const TEMPLATE_LABELS = Object.freeze({
  note: 'Заметка',
  portfolio: 'Портфолио',
  poster: 'Афиша',
  guide: 'Мини-справочник',
});

const DEFAULT_SETTINGS = Object.freeze({
  width: 960,
  paper: '#F3EBDD',
  ink: '#28251F',
  accent: '#C95B43',
  headingFont: 'serif',
  bodyFont: 'mono',
});

const FONT_STACKS = Object.freeze({
  serif: 'var(--serif)',
  mono: 'var(--mono)',
  system: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  grotesk: '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif',
});

const WIDTH_PRESETS = Object.freeze([640, 760, 960, 1200]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const PROJECT_VERSION = 1;
const MAX_PROJECT_SIZE = 15 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100000;
const MAX_IMAGE_DATA_URL_LENGTH = 15 * 1024 * 1024;

const EXPORT_STYLES = `:root {
  --paper: #F3EBDD;
  --ink: #28251F;
  --line: #CFC4B3;
  --muted: #84796C;
  --accent: #C95B43;
  --muted-strong: #655B51;
  --accent-strong: #A6402F;
  --page-width: 960px;
  --heading-font: "PT Serif", "Iowan Old Style", "Palatino Linotype", serif;
  --body-font: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}

* { box-sizing: border-box; }
html { min-width: 320px; background: var(--paper); }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: var(--body-font); font-size: 13px; line-height: 1.5; }
main { min-height: 100vh; padding: clamp(24px, 6vw, 72px); }
.page-preview { width: min(100%, var(--page-width)); max-width: 100%; min-height: 575px; margin: 0 auto; padding: clamp(30px, 5vw, 68px) clamp(23px, 6vw, 75px); background: var(--paper); }
.page-overline, .page-caption { color: var(--muted-strong); font-size: 10px; letter-spacing: .1em; }
.page-preview h1, .page-preview h2, .page-preview h3, .page-preview h4, .page-preview h5, .page-preview h6 { margin: 35px 0 24px; color: var(--ink); font-family: var(--heading-font); font-weight: 400; line-height: 1.04; }
.page-preview h1 { font-size: clamp(31px, 4.3vw, 56px); }
.page-preview h2 { font-size: clamp(26px, 3.5vw, 45px); }
.page-preview h3 { font-size: clamp(21px, 2.8vw, 34px); }
.preview-text { max-width: 465px; color: var(--muted-strong); font-family: var(--body-font); font-size: 16px; line-height: 1.55; }
.preview-rule { width: 100%; margin: 42px 0 23px; border: 0; border-top: 1px solid var(--line); }
.preview-image { margin: 40px 0 0; }
.preview-image img { display: block; width: 100%; max-height: 520px; object-fit: cover; border: 1px solid var(--line); }
.page-caption { margin-top: 9px; }
.preview-link { margin: 30px 0 0; font-family: var(--body-font); }
.preview-link a { color: var(--accent-strong); text-underline-offset: 4px; }
.preview-link.is-disabled { display: grid; gap: 6px; color: var(--muted); }
.preview-link small { letter-spacing: .04em; }
.preview-space { height: 42px; }
.preview-empty { margin-top: 35px; color: var(--muted-strong); font-family: var(--body-font); }
.empty-hint { color: var(--muted-strong); font-style: italic; }
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
  serif: '"PT Serif", "Iowan Old Style", "Palatino Linotype", serif',
  mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  system: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  grotesk: '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif',
});

let idCounter = 0;

export function createId(prefix = 'block') {
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

export function createHeading(overrides = {}) {
  return withId('heading', { content: 'Новая мысль', level: 1 }, overrides);
}

export function createText(overrides = {}) {
  return withId('text', { content: 'Напишите здесь несколько строк текста.' }, overrides);
}

export function createImage(overrides = {}) {
  return withId('image', { src: '', alt: '', name: '', caption: '' }, overrides);
}

export function createLink(overrides = {}) {
  return withId('link', { label: 'Открыть ссылку', url: 'https://example.com' }, overrides);
}

export function createDivider(overrides = {}) {
  return withId('divider', { style: 'line' }, overrides);
}

export const blockFactories = Object.freeze({ heading: createHeading, text: createText, image: createImage, link: createLink, divider: createDivider });

const templateFactories = Object.freeze({
  note: () => [
    createHeading({ content: 'Место для вашей\nследующей истории' }),
    createText({ content: 'Соберите страницу из небольших элементов. Здесь можно менять текст, добавлять изображения и находить свой ритм.' }),
    createDivider(),
    createText({ content: 'Хорошая страница начинается с ясной мысли. Дайте ей достаточно воздуха и оставьте только то, что помогает рассказать историю.' }),
    createImage({ caption: '01 — Подпись к изображению' }),
  ],
  portfolio: () => [
    createHeading({ content: 'Избранные работы' }),
    createText({ content: 'Короткий рассказ о том, как вы работаете и какие задачи любите решать.' }),
    createImage({ caption: '01 — Проект и его контекст' }),
    createLink({ label: 'Посмотреть все проекты', url: 'https://example.com/portfolio' }),
    createDivider(),
  ],
  poster: () => [
    createHeading({ content: 'Вечер\nтипографики' }),
    createText({ content: '18 октября · 19:00\nМесто встречи укажем здесь' }),
    createImage({ alt: 'Постер события', caption: 'Программа и детали' }),
    createLink({ label: 'Зарегистрироваться', url: 'https://example.com/register' }),
  ],
  guide: () => [
    createHeading({ content: 'Мини-справочник' }),
    createText({ content: 'Соберите здесь короткие инструкции, определения и полезные ссылки.' }),
    createDivider(),
    createHeading({ content: '01 — Начните с главного', level: 2 }),
    createText({ content: 'Один ясный абзац помогает читателю быстро найти нужный ответ.' }),
    createLink({ label: 'Открыть дополнительный материал', url: 'https://example.com/guide' }),
  ],
});

export const templates = Object.freeze(Object.keys(TEMPLATE_LABELS).reduce((result, key) => {
  result[key] = Object.freeze({
    id: key,
    label: TEMPLATE_LABELS[key],
    createBlocks: templateFactories[key],
  });
  return result;
}, {}));

export function createDefaultProject(template = 'note') {
  const templateId = templates[template] ? template : 'note';
  return {
    id: createId('project'),
    title: 'Без названия',
    template: templateId,
    settings: { ...DEFAULT_SETTINGS },
    blocks: templateFactories[templateId](),
  };
}

// The complete in-memory state is intentionally small and serializable.
export const state = {
  ...createDefaultProject('note'),
  selectedBlockId: null,
};

let initialized = false;

const dom = {
  composition: null,
  list: null,
  editor: null,
  addType: null,
  addButton: null,
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

function cloneBlocks(templateId) {
  return templateFactories[templateId]().map((block) => ({ ...block }));
}

function getBlock(id) {
  return state.blocks.find((block) => block.id === id) || null;
}

function getSelectedBlock() {
  return getBlock(state.selectedBlockId) || state.blocks[0] || null;
}

function rememberFocus() {
  const active = document.activeElement;
  if (!active || !dom.editor || !dom.editor.contains(active)) return null;
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
  const controls = dom.editor.querySelectorAll('[data-focus-key]');
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

function textHtml(value, emptyLabel) {
  const text = String(value ?? '');
  if (!text.trim()) return `<span class="empty-hint">${escapeHtml(emptyLabel)}</span>`;
  return escapeHtml(text).replace(/\r?\n/g, '<br>');
}

export function renderPreview(project = state, { mount = true } = {}) {
  const blocks = Array.isArray(project?.blocks) ? project.blocks : [];
  const template = TEMPLATE_LABELS[project?.template] || TEMPLATE_LABELS.note;
  const content = blocks.map((block) => {
    if (!block || !block.type) return '';
    if (block.type === 'heading') {
      const parsedLevel = Number.parseInt(block.level, 10);
      const level = Number.isFinite(parsedLevel) ? Math.min(6, Math.max(1, parsedLevel)) : 1;
      return `<h${level} class="preview-block preview-heading">${textHtml(block.content, 'Добавьте заголовок')}</h${level}>`;
    }
    if (block.type === 'text') {
      return `<p class="preview-block preview-text">${textHtml(block.content, 'Добавьте текст')}</p>`;
    }
    if (block.type === 'image') {
      const src = safeHref(block.src);
      const alt = String(block.alt ?? '').trim();
      const caption = String(block.caption ?? '').trim();
      const media = src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`
        : `<div class="preview-image-placeholder" role="img" aria-label="Изображение не добавлено"><span class="placeholder-cross" aria-hidden="true">✳</span><span class="empty-hint">Добавьте изображение</span></div>`;
      return `<figure class="preview-block preview-image">${media}${caption ? `<figcaption class="page-caption">${textHtml(caption, '')}</figcaption>` : ''}</figure>`;
    }
    if (block.type === 'link') {
      const href = safeHref(block.url);
      const label = textHtml(block.label, 'Добавьте текст ссылки');
      return href
        ? `<p class="preview-block preview-link"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`
        : `<p class="preview-block preview-link is-disabled"><span aria-disabled="true">${label}</span><small class="empty-hint">Укажите безопасный адрес</small></p>`;
    }
    if (block.type === 'divider') {
      return block.style === 'space'
        ? '<div class="preview-block preview-space" aria-hidden="true"></div>'
        : '<hr class="preview-block preview-rule">';
    }
    return '';
  }).join('');
  const html = `<article class="page-preview" tabindex="-1" data-template="${escapeHtml(project?.template || 'note')}">
    <p class="page-overline">${escapeHtml(template)} · STATIC STUDIO</p>
    ${content || '<p class="preview-empty">Добавьте блок в редакторе, чтобы увидеть его здесь.</p>'}
  </article>`;
  if (mount && dom.previewMount) dom.previewMount.innerHTML = html;
  if (mount && dom.previewStatus) dom.previewStatus.textContent = `Предпросмотр обновлён: ${blocks.length} ${blocks.length === 1 ? 'блок' : 'блоков'}.`;
  return html;
}

function setProjectStatus(message, isError = false) {
  if (!dom.previewStatus) return;
  dom.previewStatus.textContent = message;
  dom.previewStatus.dataset.status = isError ? 'error' : 'success';
}

function projectPayload() {
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

export function exportProject() {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
  const blob = new Blob([JSON.stringify(projectPayload(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'static-studio-project.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setProjectStatus('Проект экспортирован в static-studio-project.json.');
  return true;
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

export function crc32(input) {
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

export function buildZip(files) {
  const entries = zipEntries(files).map(({ name, data }) => {
    const normalizedName = String(name || '').replaceAll('\\', '/').replace(/^\/+/, '');
    if (!normalizedName || normalizedName.includes('../') || normalizedName === '..') throw new Error('ZIP entry has an unsafe name.');
    return { name: normalizedName, nameBytes: new TextEncoder().encode(normalizedName), data: asBytes(data) };
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
  }
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
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
  const match = /^(.*?)(?:\.([a-zA-Z0-9]{1,8}))?$/.exec(cleaned);
  let stem = (match?.[1] || '').replace(/[.]+$/g, '') || `image-${index + 1}`;
  let extension = match?.[2]?.toLowerCase() || fallbackExtension;
  if (!/^[a-z0-9]{1,8}$/.test(extension)) extension = fallbackExtension;
  let candidate = `${stem}.${extension}`;
  let serial = 2;
  while (usedNames.has(candidate)) candidate = `${stem}-${serial++}.${extension}`;
  usedNames.add(candidate);
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
    .replace('--heading-font: "PT Serif", "Iowan Old Style", "Palatino Linotype", serif;', `--heading-font: ${headingFont};`)
    .replace('--body-font: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;', `--body-font: ${bodyFont};`);
}

export function buildExportFiles(project = state) {
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
  const title = escapeHtml(String(source.title || 'Static Studio'));
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="${escapeHtml(source.settings?.paper || DEFAULT_SETTINGS.paper)}">
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

export function exportZip(project = state) {
  try {
    const blob = buildZip(buildExportFiles(project));
    if (typeof document === 'undefined' || typeof URL === 'undefined') return blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'static-studio-export.zip';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setProjectStatus('Страница экспортирована в static-studio-export.zip.');
    return blob;
  } catch (error) {
    setProjectStatus(`Не удалось экспортировать ZIP: ${error.message}`, true);
    return false;
  }
}

function normalizeImportedProject(input) {
  if (input?.version !== undefined && input.version !== PROJECT_VERSION) throw new Error(`Неподдерживаемая версия проекта: ${input.version}.`);
  if (!input || typeof input !== 'object' || !Array.isArray(input.blocks) || input.blocks.length > 100) throw new Error('Файл проекта должен содержать массив блоков.');
  if (input.template !== undefined && (typeof input.template !== 'string' || !Object.hasOwn(templates, input.template))) throw new Error('Файл содержит неизвестный шаблон.');
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
    if (!raw || typeof raw !== 'object' || !Object.hasOwn(blockFactories, raw.type) || typeof blockFactories[raw.type] !== 'function') throw new Error('Файл содержит неизвестный тип блока.');
    const factory = blockFactories[raw.type];
    let id = typeof raw.id === 'string' && raw.id && raw.id.length <= 120 ? raw.id : createId(raw.type);
    if (usedIds.has(id)) id = createId(raw.type);
    usedIds.add(id);
    const safe = factory({ id });
    for (const key of Object.keys(safe)) {
      if (key === 'id' || key === 'type') continue;
      if (typeof raw[key] === typeof safe[key]) {
        if (typeof raw[key] === 'string' && raw[key].length > (key === 'src' ? MAX_IMAGE_DATA_URL_LENGTH : MAX_TEXT_LENGTH)) throw new Error('Файл содержит слишком длинное поле.');
        safe[key] = raw[key];
      }
    }
    return safe;
  });
  const selectedBlockId = typeof input.selectedBlockId === 'string' && usedIds.has(input.selectedBlockId) ? input.selectedBlockId : blocks[0]?.id || null;
  return { id: typeof input.id === 'string' && input.id.length <= 120 ? input.id : createId('project'), title: typeof input.title === 'string' ? input.title.slice(0, MAX_TEXT_LENGTH) : 'Без названия', template, settings, blocks, selectedBlockId };
}

export function importProjectData(input) {
  const next = normalizeImportedProject(input);
  Object.assign(state, next, { selectedBlockId: next.selectedBlockId || next.blocks[0]?.id || null });
  renderAll();
  setProjectStatus('Проект импортирован.');
  return true;
}

function applySettings() {
  if (typeof document === 'undefined') return;
  const settings = state.settings || DEFAULT_SETTINGS;
  const root = document.documentElement;
  const width = Math.min(1440, Math.max(480, Number(settings.width) || DEFAULT_SETTINGS.width));
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value).toUpperCase() : fallback;
  root.style.setProperty('--page-width', `${width}px`);
  root.style.setProperty('--paper', color(settings.paper, DEFAULT_SETTINGS.paper));
  root.style.setProperty('--ink', color(settings.ink, DEFAULT_SETTINGS.ink));
  root.style.setProperty('--accent', color(settings.accent, DEFAULT_SETTINGS.accent));
  root.style.setProperty('--heading-font', FONT_STACKS[settings.headingFont] || FONT_STACKS.serif);
  root.style.setProperty('--body-font', FONT_STACKS[settings.bodyFont] || FONT_STACKS.mono);
}

function renderSettings() {
  if (!dom.settingsMount) return;
  const settings = state.settings || DEFAULT_SETTINGS;
  const widthOptions = WIDTH_PRESETS.map((width) => `<option value="${width}"${Number(settings.width) === width ? ' selected' : ''}>${width} px</option>`).join('');
  dom.settingsMount.innerHTML = `
    <label class="field-label" for="page-width-preset">Ширина страницы</label>
    <select class="select-control" id="page-width-preset" data-setting="widthPreset" aria-label="Предустановленная ширина страницы"><option value="">Своя ширина</option>${widthOptions}</select>
    <label class="field-label" for="page-width">Точная ширина, px</label>
    <input class="text-control compact-control" id="page-width" data-setting="width" type="number" min="480" max="1440" step="1" value="${escapeHtml(settings.width)}">
    <label class="field-label" for="page-paper">Цвет бумаги</label>
    <div class="color-field"><input id="page-paper" data-setting="paper" type="color" value="${escapeHtml(settings.paper)}"><span data-color-value="paper">${escapeHtml(settings.paper)}</span></div>
    <label class="field-label" for="page-ink">Цвет текста</label>
    <div class="color-field"><input id="page-ink" data-setting="ink" type="color" value="${escapeHtml(settings.ink)}"><span data-color-value="ink">${escapeHtml(settings.ink)}</span></div>
    <label class="field-label" for="page-accent">Акцентный цвет</label>
    <div class="color-field"><input id="page-accent" data-setting="accent" type="color" value="${escapeHtml(settings.accent)}"><span data-color-value="accent">${escapeHtml(settings.accent)}</span></div>
    <label class="field-label" for="page-heading-font">Шрифт заголовков</label>
    <select class="select-control" id="page-heading-font" data-setting="headingFont">
      <option value="serif"${settings.headingFont === 'serif' ? ' selected' : ''}>С засечками</option><option value="grotesk"${settings.headingFont === 'grotesk' ? ' selected' : ''}>Гротеск</option><option value="system"${settings.headingFont === 'system' ? ' selected' : ''}>Системный</option>
    </select>
    <label class="field-label" for="page-body-font">Шрифт текста</label>
    <select class="select-control" id="page-body-font" data-setting="bodyFont">
      <option value="mono"${settings.bodyFont === 'mono' ? ' selected' : ''}>Моноширинный</option><option value="grotesk"${settings.bodyFont === 'grotesk' ? ' selected' : ''}>Гротеск</option><option value="system"${settings.bodyFont === 'system' ? ' selected' : ''}>Системный</option>
    </select>`;
  applySettings();
}

function syncSettingControls({ preserveActive = true } = {}) {
  if (!dom.settingsMount) return;
  const settings = state.settings || DEFAULT_SETTINGS;
  dom.settingsMount.querySelectorAll('[data-color-value]').forEach((label) => {
    const value = settings[label.dataset.colorValue] || '';
    label.textContent = value;
  });
  const width = dom.settingsMount.querySelector('[data-setting="width"]');
  if (width && (!preserveActive || document.activeElement !== width)) width.value = settings.width;
  const preset = dom.settingsMount.querySelector('[data-setting="widthPreset"]');
  if (preset && !WIDTH_PRESETS.includes(Number(settings.width))) preset.value = '';
  dom.settingsMount.querySelectorAll('[data-setting="headingFont"], [data-setting="bodyFont"]').forEach((control) => {
    if (document.activeElement !== control) control.value = settings[control.dataset.setting];
  });
}

function fieldLabel(label, html) {
  return `<label class="field-label">${escapeHtml(label)}${html}</label>`;
}

function inputField({ block, field, label, value, type = 'text', placeholder = '' }) {
  const input = `<input class="text-control editor-field" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}" type="${type}" value="${escapeHtml(value)}"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}>`;
  return fieldLabel(label, input);
}

function textareaField({ block, field, label, value, placeholder = '' }) {
  const textarea = `<textarea class="text-control editor-field" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}" rows="4"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}>${escapeHtml(value)}</textarea>`;
  return fieldLabel(label, textarea);
}

function selectField({ block, field, label, value, options }) {
  const optionsHtml = options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? ' selected' : ''}>${escapeHtml(optionLabel)}</option>`).join('');
  const select = `<select class="select-control editor-field" data-block-id="${escapeHtml(block.id)}" data-field="${escapeHtml(field)}" data-focus-key="${escapeHtml(`${block.id}:${field}`)}">${optionsHtml}</select>`;
  return fieldLabel(label, select);
}

function renderComposition() {
  if (!dom.composition) return;
  dom.composition.innerHTML = Object.entries(TEMPLATE_LABELS)
    .map(([value, label]) => `<option value="${value}"${state.template === value ? ' selected' : ''}>${label}</option>`)
    .join('');
  dom.composition.value = state.template;
}

function actionButton(action, label, disabled = false) {
  return `<button class="icon-button block-action" type="button" data-action="${action}" aria-label="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>${action === 'move-up' ? '↑' : action === 'move-down' ? '↓' : action === 'duplicate' ? '＋' : '×'}</button>`;
}

function renderBlockList() {
  if (!dom.list) return;
  dom.list.innerHTML = state.blocks.map((block, index) => {
    const selected = block.id === state.selectedBlockId;
    const typeLabel = BLOCK_LABELS[block.type] || block.type;
    const title = block.type === 'heading' || block.type === 'text' ? String(block.content ?? '').split('\n')[0] : typeLabel;
    return `<li class="block-item${selected ? ' is-selected' : ''}" data-block-id="${escapeHtml(block.id)}" draggable="true" tabindex="0" aria-selected="${selected}">
      <button class="block-select" type="button" data-action="select" data-block-id="${escapeHtml(block.id)}" data-focus-key="row:${escapeHtml(block.id)}" aria-current="${selected ? 'true' : 'false'}">
        <span class="block-grip" aria-hidden="true">⠿</span><span class="block-number">${String(index + 1).padStart(2, '0')}</span><span class="block-name">${escapeHtml(typeLabel)}</span><span class="block-summary">${escapeHtml(title)}</span>
      </button>
      <div class="block-actions" aria-label="Действия блока">
        ${actionButton('move-up', `Переместить «${typeLabel}» выше`, index === 0)}
        ${actionButton('move-down', `Переместить «${typeLabel}» ниже`, index === state.blocks.length - 1)}
        ${actionButton('duplicate', `Дублировать «${typeLabel}»`)}
        ${actionButton('delete', `Удалить «${typeLabel}»`)}
      </div>
    </li>`;
  }).join('');
}

function renderBlockEditor() {
  if (!dom.editor) return;
  const block = getSelectedBlock();
  if (!block) {
    dom.editor.innerHTML = '<p class="field-label">Добавьте блок, чтобы начать редактирование.</p>';
    return;
  }
  let html = `<div class="editor-block-heading"><span class="field-label">Выбранный блок</span><strong>${escapeHtml(BLOCK_LABELS[block.type] || block.type)}</strong></div>`;
  if (block.type === 'heading') {
    html += textareaField({ block, field: 'content', label: 'Текст заголовка', value: block.content, placeholder: 'Введите заголовок' });
    html += selectField({ block, field: 'level', label: 'Уровень', value: String(block.level || 1), options: [['1', 'Крупный'], ['2', 'Средний'], ['3', 'Малый']] });
  } else if (block.type === 'text') {
    html += textareaField({ block, field: 'content', label: 'Текст', value: block.content, placeholder: 'Введите текст блока' });
  } else if (block.type === 'image') {
    html += `<button class="button button-quiet image-upload-button" type="button" data-action="upload-image" data-block-id="${escapeHtml(block.id)}">Загрузить изображение</button>`;
    html += inputField({ block, field: 'src', label: 'Адрес изображения', value: block.src, type: 'url', placeholder: 'https://…' });
    html += inputField({ block, field: 'name', label: 'Имя файла', value: block.name || '', placeholder: 'Необязательно' });
    html += inputField({ block, field: 'alt', label: 'Описание', value: block.alt, placeholder: 'Что изображено' });
    html += inputField({ block, field: 'caption', label: 'Подпись', value: block.caption, placeholder: 'Необязательно' });
  } else if (block.type === 'link') {
    html += inputField({ block, field: 'label', label: 'Текст ссылки', value: block.label, placeholder: 'Название ссылки' });
    html += inputField({ block, field: 'url', label: 'Адрес', value: block.url, type: 'url', placeholder: 'https://…' });
  } else if (block.type === 'divider') {
    html += selectField({ block, field: 'style', label: 'Вид линии', value: block.style || 'line', options: [['line', 'Тонкая линия'], ['space', 'Воздух']] });
  }
  dom.editor.innerHTML = html;
}

export function renderAll(options = {}) {
  const focus = options.focus || rememberFocus();
  if (!state.selectedBlockId || !getBlock(state.selectedBlockId)) state.selectedBlockId = state.blocks[0]?.id || null;
  renderComposition();
  renderBlockList();
  renderBlockEditor();
  renderSettings();
  renderPreview(state);
  restoreFocus(focus);
}

export function moveBlock(id, direction) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return false;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= state.blocks.length) return false;
  [state.blocks[index], state.blocks[targetIndex]] = [state.blocks[targetIndex], state.blocks[index]];
  state.selectedBlockId = id;
  renderAll({ focus: { focusKey: `row:${id}`, start: null, end: null } });
  return true;
}

function replaceTemplate(templateId) {
  if (!templates[templateId]) return;
  state.template = templateId;
  state.blocks = cloneBlocks(templateId);
  state.selectedBlockId = state.blocks[0]?.id || null;
  renderAll();
}

function addBlock(type) {
  const factory = blockFactories[type] || createText;
  const block = factory();
  state.blocks.push(block);
  state.selectedBlockId = block.id;
  renderAll({ focus: { focusKey: `${block.id}:${Object.keys(block).find((key) => key !== 'id' && key !== 'type') || 'content'}`, start: null, end: null } });
}

function duplicateBlock(id) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  const original = state.blocks[index];
  const copy = { ...original, id: createId(original.type) };
  state.blocks.splice(index + 1, 0, copy);
  state.selectedBlockId = copy.id;
  renderAll({ focus: { focusKey: `row:${copy.id}`, start: null, end: null } });
}

function deleteBlock(id) {
  const index = state.blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  state.blocks.splice(index, 1);
  state.selectedBlockId = state.blocks[Math.min(index, state.blocks.length - 1)]?.id || null;
  renderAll();
}

function updateBlockField(blockId, field, value) {
  const block = getBlock(blockId);
  if (!block || !(field in block)) return;
  block[field] = field === 'level' ? Number(value) || 1 : value;
  renderAll({ focus: { focusKey: `${blockId}:${field}`, start: document.activeElement?.selectionStart ?? null, end: document.activeElement?.selectionEnd ?? null } });
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

function updateSetting(field, value) {
  if (!state.settings || !(field in state.settings)) return;
  if (field === 'width') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    state.settings.width = Math.min(1440, Math.max(480, Math.round(parsed)));
  } else if (['paper', 'ink', 'accent'].includes(field)) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    state.settings[field] = value.toUpperCase();
  } else if (['headingFont', 'bodyFont'].includes(field) && FONT_STACKS[value]) {
    state.settings[field] = value;
  }
  applySettings();
  syncSettingControls({ preserveActive: false });
  renderPreview(state);
}

function handleSettingChange(event) {
  const target = event.target.closest('[data-setting]');
  if (!target || !dom.settingsMount.contains(target)) return;
  // Let number inputs be edited naturally; commit their clamped value on change/blur.
  if (target.dataset.setting === 'width' && event.type === 'input') return;
  if (target.dataset.setting === 'widthPreset') {
    if (target.value) updateSetting('width', target.value);
    return;
  }
  updateSetting(target.dataset.setting, target.value);
}

function setPreviewMode(showPreview) {
  if (!dom.shell) return;
  dom.shell.classList.toggle('full-preview', showPreview);
  const toggle = document.querySelector('#mobile-preview-toggle');
  if (toggle) {
    toggle.textContent = showPreview ? 'Редактор' : 'Предпросмотр';
    toggle.setAttribute('aria-pressed', String(showPreview));
  }
  if (showPreview) dom.previewMount?.querySelector('.page-preview')?.focus?.({ preventScroll: true });
}

function handleGlobalClick(event) {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'toggle-preview') {
    setPreviewMode(!dom.shell?.classList.contains('full-preview'));
  } else if (action === 'return-editor') {
    setPreviewMode(false);
  } else if (action === 'upload-image') {
    const block = getBlock(event.target.closest('[data-block-id]')?.dataset.blockId);
    if (block?.type === 'image') {
      if (dom.imageFile) dom.imageFile.dataset.blockId = block.id;
      dom.imageFile?.click();
    }
  }
}

function handleImageFile(event) {
  const file = event.target.files?.[0];
  const block = getBlock(event.target.dataset.blockId) || getSelectedBlock();
  event.target.value = '';
  if (!file || !block || block.type !== 'image') return;
  if (!file.type.startsWith('image/')) return setProjectStatus('Не удалось загрузить файл: выберите изображение.', true);
  if (file.size > MAX_IMAGE_SIZE) return setProjectStatus('Изображение слишком большое. Максимальный размер — 10 МБ.', true);
  const reader = new FileReader();
  reader.onerror = () => setProjectStatus('Не удалось прочитать изображение.', true);
  reader.onload = () => {
    block.src = String(reader.result || '');
    block.name = file.name;
    if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, '');
    state.selectedBlockId = block.id;
    renderAll();
    setProjectStatus(`Изображение «${file.name}» добавлено.`);
  };
  reader.readAsDataURL(file);
}

function handleProjectFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > MAX_PROJECT_SIZE) {
    setProjectStatus('Файл проекта слишком большой. Максимальный размер — 15 МБ.', true);
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => setProjectStatus('Не удалось прочитать файл проекта.', true);
  reader.onload = () => {
    try {
      importProjectData(JSON.parse(String(reader.result || '')));
    } catch (error) {
      setProjectStatus(error instanceof SyntaxError ? 'Файл проекта содержит некорректный JSON.' : `Не удалось импортировать проект: ${error.message}`, true);
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

function handleDragStart(event) {
  const row = event.target.closest('[data-block-id]');
  if (!row || !dom.list.contains(row) || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', row.dataset.blockId);
}

function handleDrop(event) {
  const row = event.target.closest('[data-block-id]');
  if (!row || !dom.list.contains(row) || !event.dataTransfer) return;
  event.preventDefault();
  const fromId = event.dataTransfer.getData('text/plain');
  const fromIndex = state.blocks.findIndex((block) => block.id === fromId);
  const toIndex = state.blocks.findIndex((block) => block.id === row.dataset.blockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  const [moved] = state.blocks.splice(fromIndex, 1);
  // Removing an earlier item shifts the later drop target one slot left.
  const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  state.blocks.splice(insertIndex, 0, moved);
  state.selectedBlockId = moved.id;
  renderAll({ focus: { focusKey: `row:${moved.id}`, start: null, end: null } });
}

function bindDom() {
  dom.composition = document.querySelector('#composition-select');
  dom.list = document.querySelector('#block-list');
  dom.editor = document.querySelector('#block-editor');
  dom.addType = document.querySelector('#add-block-type');
  dom.addButton = document.querySelector('#add-block');
  dom.settingsMount = document.querySelector('#settings-mount');
  dom.previewMount = document.querySelector('#preview-mount');
  dom.previewStatus = document.querySelector('#preview-status');
  dom.shell = document.querySelector('.studio-shell');
  dom.imageFile = document.querySelector('#image-file');
  dom.projectFile = document.querySelector('#project-file');
  dom.exportButton = document.querySelector('#export-project');
  dom.zipExportButton = document.querySelector('#export-zip');
  dom.importButton = document.querySelector('#import-project');

  if (dom.addButton && !dom.addType) {
    dom.addType = document.createElement('select');
    dom.addType.id = 'add-block-type';
    dom.addType.className = 'select-control add-block-type';
    dom.addType.setAttribute('aria-label', 'Тип нового блока');
    dom.addType.innerHTML = Object.entries(BLOCK_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    dom.addButton.parentElement.insertBefore(dom.addType, dom.addButton);
  }

  dom.composition?.addEventListener('change', (event) => replaceTemplate(event.target.value));
  dom.addButton?.addEventListener('click', () => addBlock(dom.addType?.value || 'text'));
  dom.list?.addEventListener('click', handleClick);
  dom.list?.addEventListener('keydown', handleKeydown);
  dom.list?.addEventListener('dragstart', handleDragStart);
  dom.list?.addEventListener('dragover', (event) => { if (event.target.closest('[data-block-id]')) event.preventDefault(); });
  dom.list?.addEventListener('drop', handleDrop);
  dom.editor?.addEventListener('input', handleFieldInput);
  dom.editor?.addEventListener('change', handleFieldInput);
  dom.settingsMount?.addEventListener('input', handleSettingChange);
  dom.settingsMount?.addEventListener('change', handleSettingChange);
  dom.imageFile?.addEventListener('change', handleImageFile);
  dom.projectFile?.addEventListener('change', handleProjectFile);
  dom.exportButton?.addEventListener('click', exportProject);
  dom.zipExportButton?.addEventListener('click', () => exportZip(state));
  dom.importButton?.addEventListener('click', () => dom.projectFile?.click());
  document.addEventListener('click', handleGlobalClick);
}

export function init() {
  if (typeof document === 'undefined' || initialized) return;
  initialized = true;
  bindDom();
  state.selectedBlockId = state.blocks[0]?.id || null;
  renderAll();
}

if (typeof document !== 'undefined') {
  init();
}

export { DEFAULT_SETTINGS, BLOCK_LABELS, TEMPLATE_LABELS };
