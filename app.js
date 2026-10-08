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
  return withId('image', { src: '', alt: '', caption: '' }, overrides);
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

const dom = {
  composition: null,
  list: null,
  editor: null,
  addType: null,
  addButton: null,
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
    const title = block.type === 'heading' || block.type === 'text' ? block.content.split('\n')[0] : typeLabel;
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
    html += inputField({ block, field: 'src', label: 'Адрес изображения', value: block.src, type: 'url', placeholder: 'https://…' });
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
  state.blocks.splice(toIndex, 0, moved);
  state.selectedBlockId = moved.id;
  renderAll({ focus: { focusKey: `row:${moved.id}`, start: null, end: null } });
}

function bindDom() {
  dom.composition = document.querySelector('#composition-select');
  dom.list = document.querySelector('#block-list');
  dom.editor = document.querySelector('#block-editor');
  dom.addType = document.querySelector('#add-block-type');
  dom.addButton = document.querySelector('#add-block');

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
}

export function init() {
  if (typeof document === 'undefined') return;
  bindDom();
  state.selectedBlockId = state.blocks[0]?.id || null;
  renderAll();
}

if (typeof document !== 'undefined') {
  init();
}

export { DEFAULT_SETTINGS, BLOCK_LABELS, TEMPLATE_LABELS };
