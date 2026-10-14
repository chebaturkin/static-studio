const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const context = {
  console,
  TextEncoder,
  TextDecoder,
  Blob,
  URL,
  setTimeout,
  clearTimeout,
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  window: {},
};
vm.createContext(context);
context.navigator = { languages: ['ru-RU'] };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8'), context, { filename: 'i18n.js' });
  vm.runInContext(source, context, { filename: 'app.js' });
const studio = context.window.StaticStudio;

test('exposes safe URL validation for links and images', () => {
  assert.equal(studio.safeHref('javascript:alert(1)'), '');
  assert.equal(studio.safeHref('http://example.com'), '');
  assert.equal(studio.safeHref('https://example.com/path'), 'https://example.com/path');
  assert.equal(studio.safeHref('#section'), '#section');
  assert.equal(studio.safeHref('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
  assert.equal(studio.safeHref('data:text/html;base64,AAAA'), '');
  assert.equal(studio.safeLinkHref('data:image/png;base64,AAAA'), '');
});

test('offers an empty page without sample blocks', () => {
  const project = studio.createDefaultProject('blank');
  assert.equal(project.template, 'blank');
  assert.equal(project.title, 'новая страница');
  assert.equal(project.blocks.length, 0);
});

test('starting a new page preserves the previous page in undo history', () => {
  studio.state.title = 'моя старая заметка';
  const previous = JSON.stringify(studio.state.blocks);
  studio.newProject('blank');
  assert.equal(studio.state.blocks.length, 0);
  assert.equal(studio.state.title, 'новая страница');
  assert.equal(studio.undo(), true);
  assert.equal(studio.state.title, 'моя старая заметка');
  assert.equal(JSON.stringify(studio.state.blocks), previous);
});

test('inserts a new block after the current block', () => {
  const first = studio.state.blocks[0];
  studio.state.selectedBlockId = first.id;
  studio.addBlock('text');
  assert.equal(studio.state.blocks[0].id, first.id);
  assert.equal(studio.state.blocks[1].id, studio.state.selectedBlockId);
  studio.undo();
});

test('export omits editor placeholders and block selection controls', () => {
  const files = studio.buildExportFiles({
    title: 'пустая заметка',
    template: 'note',
    settings: studio.DEFAULT_SETTINGS,
    blocks: [studio.createHeading({ content: '' }), studio.createText({ content: '' }), studio.createImage()],
  });
  assert.doesNotMatch(files['index.html'], /добавьте|изображение не добавлено|data-preview-block-id|tabindex/);
  assert.doesNotMatch(files['index.html'], /<h1|<figure/);
});

test('exported links and muted text follow the chosen palette', () => {
  const files = studio.buildExportFiles({
    title: 'заметка', template: 'note', blocks: [],
    settings: { ...studio.DEFAULT_SETTINGS, paper: '#FFFFFF', ink: '#112233', accent: '#006600' },
  });
  assert.match(files['styles.css'], /--accent: #006600/);
  assert.match(files['styles.css'], /--accent-strong: var\(--accent\)/);
  assert.match(files['styles.css'], /--muted-strong: color-mix\(in srgb, var\(--ink\)/);
  assert.match(files['index.html'], /name="theme-color" content="#FFFFFF"/);
});

test('recovers incomplete link drafts from browser storage without exporting unsafe URLs', () => {
  const raw = { template: 'note', blocks: [{ type: 'link', label: 'черновик', url: 'javascript:alert(1)' }] };
  assert.throws(() => studio.normalizeImportedProject(raw), /небезопасный/);
  const draft = studio.normalizeImportedProject(raw, { allowDraftUrls: true });
  assert.equal(draft.blocks[0].url, raw.blocks[0].url);
  assert.doesNotMatch(studio.buildExportFiles(draft)['index.html'], /javascript:|<a href/);
});

test('normalizes imported headings to the supported 1–3 levels', () => {
  const project = studio.normalizeImportedProject({
    template: 'note',
    blocks: [
      { type: 'heading', content: 'Too large', level: 6 },
      { type: 'heading', content: 'Too small', level: 0 },
    ],
  });
  assert.deepEqual(project.blocks.map((block) => block.level), [3, 1]);
});

test('rejects projects over the UI block limit', () => {
  assert.throws(() => studio.normalizeImportedProject({
    template: 'note',
    blocks: Array.from({ length: 101 }, () => ({ type: 'text', content: 'x' })),
  }), /100/);
});

test('sanitizes and deduplicates ZIP asset names across case-insensitive filesystems', () => {
  const used = new Set();
  const first = studio.safeAssetName(`${'a'.repeat(400)}.png`, 'image/png', 0, used);
  const second = studio.safeAssetName('A.png', 'image/png', 1, used);
  assert.ok(new TextEncoder().encode(first).length <= 180);
  assert.notEqual(first.toLowerCase(), second.toLowerCase());
  assert.doesNotMatch(first, /[\\/]/);
});

test('rejects ZIP names that exceed ZIP32 limits before writing an archive', () => {
  assert.throws(() => studio.buildZip({ [`${'x'.repeat(300)}.txt`]: 'ok' }), /name|255|unsafe/i);
});

test('exported page uses the project title and packages local image data', () => {
  const files = studio.buildExportFiles({
    title: 'Моя страница',
    template: 'note',
    settings: studio.DEFAULT_SETTINGS,
    blocks: [{ type: 'image', src: 'data:image/png;base64,AAAA', alt: 'Pixel', name: 'pixel.png', caption: '' }],
  });
  assert.match(files['index.html'], /<title>Моя страница<\/title>/);
  assert.ok(Object.keys(files).some((name) => name.startsWith('assets/')));
});
