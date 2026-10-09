# Chebaturkin Style Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** привести Static Studio, экспортный пример, README и GitHub Pages к единому ясному голосу и визуальному стилю, не ломая локальный workflow.

**Architecture:** оставить vanilla HTML/CSS/JS и текущую модель состояния; обновить копирайт в источниках интерфейса и рендера, синхронно поправить экспортные стили и документацию, затем добавить статический Pages workflow. Проверки выполняются существующим Node test suite и локальным браузерным smoke-тестом.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node `node:test`, GitHub Actions Pages.

---

### Task 1: интерфейс и копирайт первого уровня

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] Обновить заголовок страницы, доступные названия, кнопки, подписи, шаблонные тексты и статусы так, чтобы обычные фразы начинались со строчной буквы и называли реальное действие.
- [ ] Перепроверить каждую строку рендера блока, импорта, экспорта, ошибок и пустых состояний; не менять технические ключи, URL и форматы файлов.
- [ ] Добавить `meta description`, `theme-color` и корректный fallback для названия проекта.

### Task 2: визуальная система и экспорт

**Files:**
- Modify: `styles.css`
- Modify: `app.js` (`EXPORT_STYLES`)
- Modify: `examples/export/styles.css`
- Modify: `examples/export/index.html`
- Modify: `examples/export/assets/placeholder.svg`

- [ ] Синхронизировать палитру, типографику, фокус, reduced motion и мобильную композицию.
- [ ] Уточнить визуальную иерархию редактора: меньше служебного шума, яснее preview и состояния.
- [ ] Переписать пример экспорта как самостоятельную короткую страницу с тем же голосом и корректными метаданными.

### Task 3: документация и публикация

**Files:**
- Modify: `README.md`
- Create: `.github/workflows/pages.yml`
- Create: `404.html`
- Create: `docs/copy-review/2026-10-09-static-studio-pass.md`

- [ ] Переписать README по сценарию читателя: что это, как попробовать, что сохраняется локально, как экспортировать и опубликовать.
- [ ] Добавить workflow GitHub Pages, который публикует корень репозитория без сборки.
- [ ] Добавить понятную 404-страницу в том же стиле.
- [ ] Зафиксировать краткий аудит «было → стало» и список ограничений.

### Task 4: проверка

**Files:**
- Modify: `tests/static-studio.test.js` only if a regression assertion is needed.

- [ ] Запустить `npm test`.
- [ ] Проверить, что в исходниках нет случайных служебных заглавных начал, битых ссылок или неясных кнопок.
- [ ] Поднять локальный HTTP-сервер и проверить корень, пример экспорта и 404 в Chromium на desktop/mobile, включая отсутствие ошибок в консоли.
- [ ] Проверить `git diff --check` и итоговый статус.
