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
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  window: {},
};
vm.createContext(context);
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
