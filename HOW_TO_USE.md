# Як користуватись CarpMapper

Цей файл пояснює дві речі:

1. Як розробнику налаштувати Mapbox token.
2. Як рибалці користуватись app на водоймі.

## 1. Налаштування Mapbox token

CarpMapper використовує Mapbox GL JS для супутникової мапи. Щоб Mapbox дозволив завантажувати style і tiles, потрібен public access token.

## Крок 1: Створи Mapbox token

1. Відкрий Mapbox account.
2. Перейди в Tokens.
3. Створи або скопіюй public token, який починається з:

```txt
pk.
```

Чому саме public token: frontend app працює в браузері, тому token буде видимий користувачу. Для браузера не можна використовувати secret token.

## Крок 2: Створи `.env`

У root директорії проекту є приклад:

```txt
.env.example
```

Створи файл:

```txt
.env
```

і додай:

```env
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

Чому назва починається з `VITE_`: Vite відкриває frontend-коду тільки env variables з таким префіксом.

## Крок 3: Перезапусти dev server

Якщо dev server уже працює, зупини його і запусти знову:

```bash
npm run dev
```

Чому треба restart: Vite читає `.env` під час старту dev server.

## 2. Як рибалці користуватись app

CarpMapper працює за принципом: спочатку фіксуємо точку, де стоїть рибалка, потім від неї будуємо rays за дистанцією і azimuth.

## Крок 1: Відкрий app біля водойми

Відкрий CarpMapper на телефоні або ноутбуці.

Для найкращої точності:

- увімкни GPS;
- дозволь браузеру доступ до location;
- стань біля rod-pod або точки, яку хочеш використовувати як базову.

Чому це важливо: всі markers рахуються від anchor. Якщо anchor неточний, всі rays теж будуть зміщені.

## Крок 2: Натисни `I am here`

Кнопка `I am here` бере поточну GPS позицію і зберігає її як anchor.

Технічно app робить:

```ts
const location = await getCurrentLocation();
setAnchor(location);
```

Чому це потрібно: anchor — це початок координат для всіх закидів.

Після цього app зберігає anchor у localStorage. Якщо перезавантажити сторінку, anchor не зникне.

## Крок 3: Введи перший marker

У формі `Add marker` заповни:

- `Name` — назва точки, наприклад `First shelf`;
- `Distance, m` — дистанція в метрах, наприклад `85`;
- `Azimuth` — напрямок у градусах, наприклад `120`;
- `Depth, m` — глибина, наприклад `3.2`;
- `Structure` — тип дна: mud, sand, gravel, clay або weed.

Приклад:

```txt
Distance: 85
Azimuth: 120
Depth: 3.2
Structure: Sand
```

Чому distance у метрах: рибалка міряє закид у метрах. App сам конвертує це для геоматематики.

## Крок 4: Натисни `Save marker`

Після збереження app:

1. Перевіряє форму через Zod.
2. Бере anchor зі store.
3. Рахує фінальні координати через `GeoService`.
4. Зберігає marker у Zustand store.
5. Persist middleware записує marker у localStorage.
6. Mapbox отримує оновлений GeoJSON і малює marker.

Спрощено:

```ts
coords = calculateDestination(anchor, distance, azimuth);
addMarker({ distance, azimuth, depth, structure, coords });
```

## Крок 5: Прочитай Ray на мапі

На мапі з'явиться:

- anchor point;
- marker point;
- line/ray від anchor до marker.

Ray показує напрямок закиду.

Чому ray корисний: ти бачиш не просто точку, а траєкторію від місця, де стоїш, до місця на водоймі.

## Крок 6: Додай ще точки

Повторюй:

```txt
distance + azimuth + depth + structure
```

Так поступово формується карта дна:

- де мул;
- де пісок;
- де гравій;
- де трава;
- де перепади глибини.

## Крок 7: Видали помилкову точку

У списку `Markers` натисни кнопку delete біля marker.

Чому delete працює швидко: markers зберігаються normalized, тобто по `id`. App не шукає складні вкладені структури.

## Offline behavior на водоймі

CarpMapper зберігає anchor і markers локально. Тому твої точки залишаються доступними без інтернету.

Що бажано зробити перед виїздом:

1. Відкрити app вдома з інтернетом.
2. Відкрити потрібну водойму на мапі.
3. Наблизити ділянки, де плануєш ловити.

Чому: Mapbox tiles можуть потрапити в browser cache тільки після перегляду. App shell і markers працюють offline, але нові супутникові tiles без інтернету можуть не завантажитись.

## Практичний сценарій першого Ray

1. Ставиш rod-pod.
2. Відкриваєш CarpMapper.
3. Натискаєш `I am here`.
4. Кидаєш маркером або міряєш дистанцію.
5. Вводиш `85` метрів.
6. Вводиш `120` градусів.
7. Обираєш `Sand`.
8. Вводиш глибину `3.2`.
9. Натискаєш `Save marker`.
10. Бачиш ray і marker на супутниковій мапі.

Головна ідея: CarpMapper перетворює твою польову інформацію — дистанцію, напрямок і структуру дна — у візуальну карту водойми.
