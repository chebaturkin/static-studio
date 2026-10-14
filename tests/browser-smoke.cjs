// Optional browser checks: start a static server, then run with Playwright installed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'static-studio-qa-'));
  const url = process.env.STUDIO_URL || 'http://127.0.0.1:4184/';
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  const click = selector => page.locator(selector).click();
  const add = async type => {
    await click('#add-menu summary');
    await click(`[data-action="add-block"][data-block-type="${type}"]`);
  };
  try {
    await page.goto(url);
    await page.locator('#starter-dialog[open]').waitFor();
    assert.equal(await page.locator('.template-card').count(), 5);
    await click('[data-action="choose-template"][data-template="note"]');
    await page.locator('#project-title').fill('заметка для проверки');
    await page.locator('[data-field="content"]').fill('короткая заметка');
    assert.equal(await page.locator('.preview-heading').textContent(), 'короткая заметка');

    // Clicking the preview opens the corresponding fields, while clean preview follows links.
    await click('.preview-text');
    await page.locator('[data-field="content"]').fill('сначала текст, потом детали.');
    const selected = await page.evaluate(() => window.StaticStudio.state.selectedBlockId);
    assert.equal(await page.locator('.block-item.is-selected').getAttribute('data-block-id'), selected);
    await add('link');
    await page.locator('[data-field="label"]').fill('полезная ссылка');
    await page.locator('[data-field="url"]').fill('https://example.com');
    await page.locator('[data-field="url"]').fill('http://unfinished.example');
    await page.waitForFunction(() => document.querySelector('#save-state').textContent === 'сохранено в браузере');
    await page.reload();
    assert.equal(await page.locator('#starter-dialog[open]').count(), 0);
    assert.equal(await page.locator('#project-title').inputValue(), 'заметка для проверки');
    assert.equal(await page.locator('[data-field="url"]').inputValue(), 'http://unfinished.example');
    assert.equal(await page.locator('.preview-link a').count(), 0);
    await page.locator('[data-field="url"]').fill('https://example.com');
    assert.equal(await page.locator('.block-item').count(), 3);
    await click('#block-editor [data-action="duplicate"]');
    assert.equal(await page.locator('.block-item').count(), 4);
    await click('#block-editor [data-action="delete"]');
    assert.equal(await page.locator('.block-item').count(), 3);
    await click('#undo-button');
    assert.equal(await page.locator('.block-item').count(), 4);
    await click('#redo-button');
    assert.equal(await page.locator('.block-item').count(), 3);
    const beforeMove = await page.evaluate(() => window.StaticStudio.state.blocks.map(b => b.id));
    await click('#block-editor [data-action="move-up"]');
    assert.deepEqual(await page.evaluate(() => window.StaticStudio.state.blocks.map(b => b.id)), [beforeMove[0], beforeMove[2], beforeMove[1]]);
    await click('#undo-button');
    await page.locator('.block-item').last().locator('button').focus();
    await page.keyboard.press('Alt+ArrowUp');
    assert.deepEqual(await page.evaluate(() => window.StaticStudio.state.blocks.map(b => b.id)), [beforeMove[0], beforeMove[2], beforeMove[1]]);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.focusKey), `row:${beforeMove[2]}`);
    await click('#undo-button');
    await page.locator('.block-item').first().dragTo(page.locator('.block-item').last(), { targetPosition: { x: 100, y: 50 } });
    assert.equal(await page.evaluate(() => window.StaticStudio.state.blocks.at(-1).id), beforeMove[0]);
    await click('#undo-button');

    // Design changes belong to the page, and exported styles use the same colors.
    const uiColor = await page.locator('.topbar').evaluate(el => getComputedStyle(el).backgroundColor);
    await click('#design-tab');
    await page.locator('[data-palette="dark"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.palette), 'dark');
    assert.equal(await page.locator('.topbar').evaluate(el => getComputedStyle(el).backgroundColor), uiColor);
    assert.equal(await page.locator('.page-preview').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(37, 42, 40)');
    assert.equal(await page.locator('.preview-link a').evaluate(el => getComputedStyle(el).color), 'rgb(181, 211, 164)');
    await page.locator('#page-body-font').selectOption('serif');
    assert.match(await page.locator('.preview-text').evaluate(el => getComputedStyle(el).fontFamily), /serif/);
    await page.locator('#page-width-preset').selectOption('640');
    assert.equal(await page.locator('#page-width').inputValue(), '640');
    await page.locator('#page-width').fill('800');
    await page.locator('#page-width').blur();
    assert.equal(await page.locator('#page-width-preset').inputValue(), '');
    await click('#content-tab');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#design-tab').getAttribute('aria-selected'), 'true');
    await click('#content-tab');

    // Uploaded image bytes survive a JSON round trip and are included in the ZIP.
    await add('image');
    await click('#mobile-preview-toggle');
    assert.equal(await page.locator('.preview-image-placeholder').count(), 0);
    await click('#mobile-preview-toggle');
    await page.locator('#image-file').evaluate((el) => { el.dataset.blockId = window.StaticStudio.state.selectedBlockId; });
    await page.locator('#image-file').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8YkAAAAASUVORK5CYII=', 'base64') });
    await page.locator('.file-name').waitFor();
    await page.locator('[data-field="caption"]').fill('картинка с устройства');
    assert.equal(await page.locator('[data-field="src"]').count(), 0);
    const savedTitle = await page.locator('#project-title').inputValue();
    const jsonDownload = page.waitForEvent('download');
    await click('#project-menu summary');
    await click('#export-project');
    const json = await jsonDownload;
    const jsonPath = path.join(output, 'project.json');
    await json.saveAs(jsonPath);
    const project = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    assert.equal(project.title, savedTitle);
    assert.ok(project.blocks.some(b => b.type === 'image' && b.src.startsWith('data:')));
    await click('#project-menu summary');
    await click('#project-menu [data-action="open-starter"]');
    await click('[data-action="choose-template"][data-template="blank"]');
    assert.equal(await page.locator('.block-item').count(), 0);
    await click('#undo-button');
    assert.equal(await page.locator('#project-title').inputValue(), savedTitle);
    await page.locator('#project-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await page.locator('#project-status[data-status="error"]').waitFor();
    assert.equal(await page.locator('#project-title').inputValue(), savedTitle);
    await page.locator('#project-file').setInputFiles(jsonPath);
    await page.locator('#project-status[data-status="success"]').waitFor();
    assert.equal(await page.locator('#project-title').inputValue(), savedTitle);
    const zipDownload = page.waitForEvent('download');
    await click('#export-zip');
    const zip = await zipDownload;
    await zip.saveAs(path.join(output, 'site.zip'));
    assert.ok((await fs.stat(path.join(output, 'site.zip'))).size > 1000);
    await page.waitForFunction(() => document.querySelector('#save-state').textContent === 'сохранено в браузере');
    await page.reload();
    assert.equal(await page.locator('#starter-dialog[open]').count(), 0);
    assert.equal(await page.locator('#project-title').inputValue(), savedTitle);

    // Every header action remains inside the viewport at each requested size.
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, buttons: [...document.querySelectorAll('.topbar .button')].filter(e => e.getClientRects().length).map(e => ({ left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right })) }));
      assert.ok(layout.scrollWidth <= width, `horizontal overflow at ${width}: ${layout.scrollWidth}`);
      for (const button of layout.buttons) assert.ok(button.left >= 0 && button.right <= width, `button outside viewport at ${width}`);
      await click('#mobile-preview-toggle');
      assert.equal(await page.locator('.studio-shell.full-preview').count(), 1);
      await click('[data-preview-mode="mobile"]');
      assert.equal(await page.locator('#preview-mount.is-mobile').count(), 1);
      await page.screenshot({ path: path.join(output, `preview-${width}.png`), fullPage: true });
      await click('#mobile-preview-toggle');
      if (width < 761) assert.equal(await page.locator('.editor-rail').isVisible(), true);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await click('#project-menu summary');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-menu[open]').count(), 0);
    await click('.help-button');
    await page.locator('#help-dialog[open]').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#help-dialog[open]').count(), 0);
    await click('#project-menu summary');
    await click('#project-menu [data-action="open-help"]');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement.matches('#project-menu summary'));

    // Persistent save failure must be visible instead of claiming success.
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('storage unavailable', 'QuotaExceededError'); }; });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(url);
    await blockedPage.locator('[data-action="choose-template"][data-template="note"]').click();
    await blockedPage.locator('#save-state[data-status="error"]').waitFor();
    assert.match(await blockedPage.locator('#project-status').textContent(), /сохранить проект/);
    await blocked.close();

    assert.deepEqual(errors, []);
    console.log(`browser checks passed; artifacts: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
