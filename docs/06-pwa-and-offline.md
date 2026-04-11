# 06. PWA і offline behavior

CarpMapper налаштований як Progressive Web App через `vite-plugin-pwa`.

Конфігурація знаходиться у:

```txt
vite.config.ts
```

## Що таке Service Worker

Service Worker — це JavaScript worker, який браузер запускає окремо від сторінки. Він може перехоплювати network requests і відповідати з cache.

Спрощено:

```txt
App request -> Service Worker -> Cache або Network
```

Чому це потрібно: якщо рибалка на озері без інтернету, app shell може завантажитись із кешу.

## Як Service Worker підключається

У `src/main.tsx`:

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
```

Це реєструє Service Worker, який генерує `vite-plugin-pwa` під час production build.

## Що кешується автоматично

Workbox precache кешує build assets:

```ts
globPatterns: ['**/*.{js,css,html,svg,png,ico}']
```

Це означає:

- `index.html`;
- JavaScript bundles;
- CSS;
- app icon;
- PWA manifest;
- service worker support files.

Практичний результат: інтерфейс app може відкриватись повторно без інтернету після першого успішного завантаження.

## Що кешується для Mapbox

У runtime caching налаштовані:

```ts
runtimeCaching: [
  {
    urlPattern: /^https:\/\/api\.mapbox\.com\/styles\/v1\/mapbox\/satellite-v9.*/i,
    handler: 'StaleWhileRevalidate'
  },
  {
    urlPattern: /^https:\/\/api\.mapbox\.com\/v4\/mapbox\.satellite\/.*/i,
    handler: 'CacheFirst'
  }
]
```

### Mapbox style

Style кешується через `StaleWhileRevalidate`.

Як це працює:

1. Якщо style є в cache, Service Worker швидко віддає його.
2. Паралельно пробує взяти свіжу версію з network.
3. Якщо network працює, cache оновлюється.

Чому так: style може змінюватися, але для користувача важлива швидкість відкриття.

### Mapbox satellite tiles

Satellite tiles кешуються через `CacheFirst`.

Як це працює:

1. Service Worker шукає tile в cache.
2. Якщо tile є, він віддається без network.
3. Якщо tile немає, робиться network request.

Чому так: тайли важкі, і повторне відкриття тієї ж водойми має бути швидшим.

## Важливе обмеження Mapbox offline

Browser Service Worker не гарантує повноцінний offline режим для всіх Mapbox tiles.

Причини:

- Mapbox API може мати cache-control обмеження;
- не всі запити можуть бути кешовані однаково;
- тайли з'являються в cache тільки після того, як користувач уже переглянув цю ділянку;
- Mapbox terms/API можуть обмежувати offline tile storage.

Тобто app shell працює offline, persisted markers працюють offline, але супутникова мапа offline залежить від того, чи були потрібні тайли вже завантажені і чи дозволив браузер їх кешувати.

## Що точно працює без інтернету

Після першого завантаження:

- UI app;
- localStorage state;
- anchor, якщо вже був збережений;
- markers;
- список точок;
- геоматематика;
- видалення markers;
- додавання markers, якщо GPS доступний.

GPS не потребує інтернету напряму, але на деяких телефонах перший fix може бути повільнішим без assisted GPS.

## Що може не працювати без інтернету

- нові Mapbox tiles, які раніше не відкривались;
- Mapbox style, якщо він не був кешований;
- перше відкриття app після install, якщо assets ще не були precached;
- геолокація, якщо браузер/пристрій не може отримати позицію.

## Чому localStorage важливий для offline-first

Markers зберігаються через Zustand persist у `localStorage`, а не на сервері.

Чому це правильно для MVP:

- немає залежності від backend;
- точки доступні без мережі;
- швидке збереження;
- простіше тестувати.

## Головний висновок

PWA робить CarpMapper usable на водоймі: інтерфейс і точки зберігаються локально, а мапа намагається повторно використовувати вже завантажені Mapbox ресурси. Це offline-first для app data, але не повний guaranteed offline для всіх супутникових тайлів.
