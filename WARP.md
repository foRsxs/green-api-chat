# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Обзор проекта

React + TypeScript + Vite модуль чата для личного кабинета на базе GREEN-API.

**Стек:**
- React 18.2 + TypeScript 5.2
- Vite 5.2 (сборка и dev-сервер)
- Redux Toolkit 2.2 + RTK Query (управление состоянием)
- Ant Design 5.21 (UI-компоненты)
- i18next 23.12 (локализация: ru, en, he)
- React Router 6.22 (маршрутизация)
- SASS (стили)
- Nginx (production, Docker)

**Текущая версия:** 0.0.64 (см. package.json)
**Версия ассетов:** 0.0.67 (см. vite.config.ts и i18n.ts)

---

## Команды разработки

### Установка зависимостей
```bash
npm install
# или для чистой установки
npm ci
```

### Dev-сервер
```bash
npm run dev
```
Запускает Vite dev-сервер на http://localhost:5173

### Сборка для production
```bash
npm run build
```
- Сначала выполняет проверку типов (tsc)
- Затем собирает проект с помощью Vite
- Результат в каталоге `dist/`
- Ассеты складываются в `dist/assets_0.0.67/` с хешированными именами

### Preview сборки
```bash
npm run preview
```
Предпросмотр production-сборки локально

### Линтинг
```bash
npm run lint
```
**Важно:** команда в package.json указывает путь `vite-project`, который может не существовать.

Если команда падает, используйте напрямую:
```bash
npx eslint src --ext ts,tsx
```

### Проверка типов
```bash
npx tsc --noEmit
```
Проверяет TypeScript типы без генерации файлов.

### Тесты
Тестовый фреймворк не настроен (нет jest/vitest/cypress).

---

## Docker

### Сборка образа
```bash
docker build -t green-api-chat:local --build-arg DOCKER_TAG=0.0.67 .
```

### Запуск контейнера
```bash
docker run -p 8080:80 \
  -e VITE_APP_API_URL=https://console.green-api.com/api/v1/ \
  green-api-chat:local
```

**Как работает:**
1. Dockerfile собирает проект в Node-контейнере
2. Копирует dist/ в Nginx-образ
3. При старте `entrypoint.sh`:
   - Находит директорию `assets_*` в `/usr/share/nginx/html/`
   - Заменяет плейсхолдеры `__VITE_APP_API_URL__` на значения из env-переменных во всех .js файлах
4. Nginx обслуживает SPA с fallback на index.html (см. `.devops/build/conf.nginx`)

---

## Архитектура проекта

### Точка входа: `src/main.tsx`
- Создаёт Redux store (`setupStore()` из `store/index.ts`)
- Подключает RTK Query listeners (`setupListeners`)
- Инициализирует i18n (`./i18n`)
- Оборачивает приложение в `ErrorBoundary`
- Монтирует `<App />` в `#root`

### Корневой компонент: `src/App.tsx`
- Настраивает Ant Design через `ConfigProvider`:
  - Тема (темная/светлая) из Redux
  - Локаль (ru/en/he) из i18next
  - Направление текста (RTL для иврита)
- Запрашивает настройки профиля через RTK Query (`useGetProfileSettingsQuery`)
- Применяет CSS-классы темы к `document.documentElement`
- Рендерит `RouterProvider` с роутером

### Роутинг: `src/router/index.tsx`
- `createBrowserRouter` из React Router v6
- Базовый маршрут `/` → `Main` страница
- Неизвестные пути → редирект на `/`
- Константы маршрутов в `configs/router.config.ts`

### Страницы: `src/pages/`
- `main.page.tsx` — главная страница (авторизация инстанса или чат)

### Управление состоянием: Redux Toolkit

**Store:** `src/store/index.ts`

**Slices в `src/store/slices/`:**
- `chat.slice.ts` — текущий чат, контакты, сообщения
- `instances.slice.ts` — данные инстансов WhatsApp
- `message-menu.slice.ts` — состояние меню сообщений
- `qr-instruction.slice.ts` — состояние инструкции по QR
- `theme.slice.ts` — текущая тема (default/dark)
- `user.slice.ts` — данные пользователя (login, tokens, idUser)

### API-клиенты: RTK Query

#### 1. App API (`src/services/app/`)
- baseUrl из `APP_API_URL` (configs/service.config.ts)
- Добавляет заголовки авторизации: `x-ga-user-id`, `x-ga-user-token`
- Обрабатывает 401 (очистка состояния, редирект)
- Эндпоинты настроек профиля и пр.

#### 2. GREEN-API (`src/services/green-api/`)
- Кастомный baseQuery
- Работа с методами GREEN-API (отправка/получение сообщений)
- Специальная логика для `lastMessages`: параллельный запрос `lastIncomingMessages` и `lastOutgoingMessages`, агрегация, сортировка
- Утилиты для обработки чатов в `src/utils/`

### Конфигурация: `src/configs/`

**`service.config.ts`:**
- `APP_API_URL` — берётся из `import.meta.env.VITE_APP_API_URL` или плейсхолдера `__VITE_APP_API_URL__`
- `APP_API_TOKEN` — публичный токен для console-API
- `QR_HTTP_HOST` — хост для генерации QR-кодов
- `localisation` — маппинг локалей для Ant Design (ru → ru_RU, en → en_US, he → he_IL)

**`router.config.ts`:**
- Константы маршрутов (`Routes`)
- Внешние ссылки
- `CONSOLE_URL` (определяется из `document.referrer`)

**`themes/`:**
- Токены тем для Ant Design
- Выбор темы через Redux (`theme.slice.ts`)

### Локализация: `src/i18n.ts`
- i18next + i18next-http-backend + LanguageDetector
- Переводы грузятся из `/locales_0.0.67/{{lng}}/translation.json`
- Определение языка:
  - localStorage (`i18nextLng`)
  - navigator (браузер)
  - query string (`?lng=...`)
  - cookie
- Кэширование переводов на 24 часа

### Компоненты: `src/components/`

Файловая структура по фичам:
- `UI/` — переиспользуемые UI-компоненты
- `full-chat/` — полноценный чат
- `mini-chat/` — мини-чат
- `forms/` — формы
- `modals/` — модальные окна
- `shared/` — общие компоненты
- `alerts/` — уведомления
- `carousel/` — карусели
- `instance-auth/` — авторизация инстанса
- `layouts/` — layout-компоненты
- `error-boundary.component.tsx` — граница ошибок

### Хуки: `src/hooks/`
Кастомные React-хуки для работы с Redux, API и пр.

### Утилиты: `src/utils/`
Вспомогательные функции (обработка чатов, сообщений, форматирование и т.д.)

### Типы: `src/types/`
TypeScript типы и интерфейсы

### Стили: `src/styles/`
Глобальные стили (SASS)

---

## Встраивание и авторизация

### 1. Через postMessage (для iframe)

Отправьте сообщение из родительского окна:

```typescript
iframeRef.current?.contentWindow?.postMessage(
  {
    type: 'init', // MessageEventTypeEnum.INIT
    payload: {
      login: string,
      apiTokenUser: string,
      idUser: string,
      idInstance: number,
      apiTokenInstance: string,
      apiUrl: string,
      mediaUrl: string,
      tariff: 'DEVELOPER' | 'BUSINESS' | 'BUSINESS_USD' | 'BUSINESS_KZT',
      locale?: 'ru' | 'en' | 'he',
      theme: 'default' | 'dark',
      platform: string, // 'web' | 'android' | 'ios'
      projectId: string,
      
      // Кастомизация (опционально)
      brandDescription?: string, // Приветствие на главной
      logo?: string, // URL логотипа
    },
  },
  CHAT_APP_URL
);
```

### 2. Через URL query-параметры

```
http://localhost:5173/?idInstance=123&apiTokenInstance=xxx&apiUrl=https://api.green-api.com&mediaUrl=https://media.green-api.com&lng=ru&dsc=Добро%20пожаловать&logo=https://example.com/logo.png&chatId=79001234567@c.us
```

**Обязательные параметры:**
- `idInstance` — ID инстанса
- `apiTokenInstance` — токен инстанса
- `apiUrl` — базовый URL API
- `mediaUrl` — URL для медиа

**Опциональные:**
- `lng` — язык (ru/en/he)
- `dsc` — описание на главной странице
- `logo` — URL логотипа
- `chatId` — ID чата (формат: `XXXXXXXXXXX@c.us`) для показа только одного чата

Подробнее см. `README.md`

---

## Версионирование ассетов

**Текущая версия:** `0.0.67`

- `vite.config.ts`: задаёт каталог ассетов `assets_0.0.67` + случайный hash в именах файлов
- `src/i18n.ts`: переводы грузятся из `/locales_0.0.67/{{lng}}/translation.json`

**Для смены версии:**
1. Обновите `assetsDirectory` в `vite.config.ts`
2. Обновите путь `loadPath` в `src/i18n.ts`
3. Обновите `DOCKER_TAG` при сборке Docker-образа

---

## Переменные окружения

### Development (.env.development)
```bash
VITE_CONSOLE_APP_HOST=http://localhost:5173
VITE_APP_API_URL=https://console.test.greenapi.org/api/v1/
```

### Production (Docker)
Передаются через `-e` при запуске контейнера:
```bash
docker run -e VITE_APP_API_URL=https://console.green-api.com/api/v1/ ...
```

`entrypoint.sh` заменит `__VITE_APP_API_URL__` в собранных .js файлах.

---

## Code style

### ESLint
- Конфиг: `.eslintrc`
- Правила: TypeScript strict, React hooks, Prettier integration
- Сортировка импортов: react → external → internal/parent/sibling → styles
- Строгий запрет `any` (`@typescript-eslint/no-explicit-any: error`)

### Prettier
- Конфиг: `.prettierrc`
- Single quotes, semicolons, trailing commas (es5)
- 100 символов на строку
- 2 spaces для отступов

### TypeScript
- Конфиг: `tsconfig.json`
- Strict mode включён
- `baseUrl: './src'` для абсолютных импортов
- JSX: `react-jsx` (без импорта React)
- `noEmit: true` (только проверка типов, сборка через Vite)

---

## Важные заметки

1. **Линтинг:** если `npm run lint` падает из-за неверного пути `vite-project`, используйте:
   ```bash
   npx eslint src --ext ts,tsx
   ```

2. **Проверка типов:** перед коммитом запускайте `npx tsc --noEmit`

3. **Docker:** не забывайте актуализировать `DOCKER_TAG` при изменении версии ассетов

4. **Локализация:** при добавлении нового языка обновите:
   - `src/i18n.ts` (fallbackLng, detection)
   - `configs/service.config.ts` (localisation map)
   - Добавьте файлы переводов в `public/locales_0.0.67/{lng}/translation.json`

5. **Темы:** при добавлении новой темы:
   - Создайте файл в `configs/themes/`
   - Добавьте enum в `types/`
   - Обновите `App.tsx` (themesList)

6. **Коммиты:** проект не использует автоматических тестов — код-ревью и ручное тестирование обязательны

---

## Структура каталогов

```
green-api-chat/
├── .devops/
│   └── build/
│       └── conf.nginx         # Конфиг Nginx для Docker
├── public/                    # Статические файлы
│   └── locales_0.0.67/       # Переводы
├── src/
│   ├── assets/               # Изображения, шрифты и пр.
│   ├── components/           # React-компоненты
│   ├── configs/              # Конфигурационные файлы
│   ├── hooks/                # Кастомные хуки
│   ├── pages/                # Страницы
│   ├── router/               # Настройка роутинга
│   ├── services/             # RTK Query API
│   ├── store/                # Redux store и slices
│   ├── styles/               # Глобальные стили (SASS)
│   ├── types/                # TypeScript типы
│   ├── utils/                # Утилиты
│   ├── App.tsx               # Корневой компонент
│   ├── i18n.ts               # Настройка i18next
│   ├── main.tsx              # Точка входа
│   └── vite-env.d.ts         # Типы для Vite
├── .env                       # Env-переменные (не коммитится)
├── .env.development           # Dev env-переменные
├── .eslintrc                  # Конфиг ESLint
├── .prettierrc                # Конфиг Prettier
├── Dockerfile                 # Multi-stage сборка (Node + Nginx)
├── entrypoint.sh              # Скрипт подстановки env в Docker
├── package.json               # Зависимости и скрипты
├── tsconfig.json              # Конфиг TypeScript
├── vite.config.ts             # Конфиг Vite
├── README.md                  # Документация
└── WARP.md                    # Этот файл
```

---

## Полезные ссылки

- [GREEN-API Документация](https://green-api.com/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Ant Design](https://ant.design/)
- [React Router](https://reactrouter.com/)
- [i18next](https://www.i18next.com/)
