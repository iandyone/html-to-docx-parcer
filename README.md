# Docx from HTML

CLI-инструмент для извлечения HTML-фрагмента по CSS-селектору с веб-страницы и сохранения:

- исходного HTML выбранного узла в папку `html/`
- текста из этого DOM-поддерева в `.docx` в папку `docs/`

## Как это работает

1. Принимает `URL` и `CSS selector` (из аргументов или интерактивно).
2. Пробует загрузить страницу в `static`-режиме (`axios`).
3. Ищет элемент по селектору (`cheerio`).
4. Если не получилось найти элемент в статичном HTML, использует fallback через браузер (`playwright`).
5. Сохраняет:
   - `outerHTML` выбранного элемента в `html/<base-name>.html`
   - нормализованный текст из элемента в `docs/<base-name>.docx`

## Установка

Требования:

- Node.js 18+ (рекомендуется актуальная LTS версия)

Установка зависимостей:

```bash
npm install
```

Установка браузера для fallback режима:

```bash
npx playwright install chromium
```

## Запуск

### macOS / Linux (CLI)

Базовый запуск:

```bash
node src/index.js --url "https://example.com" --selector "h1"
```

С пользовательским именем файла:

```bash
node src/index.js --url "https://example.com" --selector ".article-content" --base-name "article-001"
```

Через npm script:

```bash
npm start -- --url "https://example.com" --selector "h1"
```

Интерактивный запуск:

```bash
node src/index.js
```

При интерактивном запуске:
- приложение спросит `URL`;
- затем спросит `CSS selector`;
- если селектор оставить пустым, будет использован `.document-content__text`.

### Windows (ярлык)

В проекте есть файл `launcher.bat`. Для запуска:

1. Дважды кликнуть по `launcher.bat`;
2. В открывшемся окне ввести URL;
3. Ввести селектор или нажать Enter для дефолтного `.document-content__text`.

## Параметры CLI

- `--url <url>` — URL страницы (опционален в интерактивном режиме)
- `--selector <selector>` — CSS-селектор (если не указан, используется дефолт в интерактивном режиме)
- `--base-name <name>` — опциональное имя выходных файлов (без расширения)

Если `--base-name` не передан, имя формируется автоматически (на основе домена и времени).

## Результаты работы

После успешного запуска создаются файлы:

- `html/<base-name>.html`
- `docs/<base-name>.docx`

Пример сообщения об успехе:

```text
Completed using static mode.
HTML saved to: /.../html/example-h1.html
DOCX saved to: /.../docs/example-h1.docx
```

## Коды завершения

- `0` — успех
- `1` — ошибка валидации аргументов
- `2` — ошибка загрузки страницы (fetch/network/browser fallback)
- `3` — элемент по селектору не найден
- `4` — ошибка сохранения файлов/генерации docx

## Структура проекта

```text
src/
  fetchers/
    staticFetcher.js
    browserFetcher.js
  extract/
    selectorExtractor.js
  output/
    saveHtml.js
    saveDocx.js
  utils/
    fileNames.js
  index.js
html/
docs/
```

## Замечания

- Для JS-heavy сайтов может понадобиться fallback через Playwright.
- В некоторых sandbox-окружениях браузерный запуск может быть ограничен системной политикой.
