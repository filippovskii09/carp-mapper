# 07. Localization, Calibration and Marker UX

Цей документ описує нові патерни після UX overhaul: українська локалізація, ручне калібрування anchor, live preview ray і редагування marker через клік на мапі.

## Українська локалізація

Тексти UI винесені в словник:

```txt
src/config/i18n/uk.ts
src/config/i18n/index.ts
```

Компоненти не тримають hardcoded strings:

```tsx
const t = useI18n();

<Button>{t.anchor.setCurrent}</Button>
```

Чому так:

- UI легше перекладати;
- тексти не розкидані по компонентах;
- доменні терміни залишаються послідовними: `Базова точка`, `Азимут`, `Структура дна`;
- пізніше можна додати `en`, `pl` або `de` без переписування компонентів.

Поки що `useI18n` повертає статичний український словник. Це навмисно легкий підхід для MVP:

```ts
export function useI18n() {
  return uk;
}
```

Якщо знадобиться runtime language switch, цей hook можна розширити через context або Zustand settings slice.

## Mapbox localization

Mapbox отримує українську локалізацію у двох рівнях.

Перший рівень — labels у style:

```ts
map.setLayoutProperty(layer.id, 'text-field', [
  'coalesce',
  ['get', 'name_uk'],
  ['get', 'name:uk'],
  ['get', 'name']
]);
```

Чому `coalesce`: не всі Mapbox tiles мають українську назву. Якщо `name_uk` або `name:uk` немає, мапа fallback-иться на `name`.

Другий рівень — UI controls:

```ts
locale: {
  'NavigationControl.ZoomIn': 'Збільшити',
  'NavigationControl.ZoomOut': 'Зменшити'
}
```

Чому це best-effort: `satellite-v9` може мати обмежену кількість label layers, бо це супутниковий стиль. App не ламається, якщо частина labels не має української локалі.

## Ручне встановлення і калібрування Anchor

GPS може давати drift на кілька метрів. Для риболовлі це критично: якщо rod-pod на пірсі, а GPS показав точку у воді, всі markers будуть зміщені.

Тому app підтримує два ручні сценарії:

- `Вказати на мапі` — користувач клікає точне місце род-пода на супутниковій мапі;
- drag existing anchor — користувач перетягує вже встановлену базову точку.

### Manual placement flow

1. Користувач натискає `Вказати на мапі`.
2. Store вмикає transient state `isPlacingAnchorManually`.
3. Mapbox змінює cursor на `crosshair`.
4. Наступний клік по мапі записує `event.lngLat` як anchor.
5. Store автоматично вимикає manual placement mode.

Чому це краще за GPS-only: користувач може прив'язати anchor до візуального орієнтира на satellite image навіть тоді, коли GPS hardware показує неточну позицію.

### Drag calibration flow

Drag flow:

1. Користувач натискає `Я тут (GPS)`.
2. Store зберігає GPS anchor.
3. Mapbox показує anchor як draggable circle layer.
4. Користувач перетягує anchor до візуального орієнтира на satellite image.
5. На `mouseup` або `touchend` новий anchor записується у Zustand.
6. Persist middleware зберігає нову точку у LocalStorage.

Ключовий принцип: під час drag ми не оновлюємо React state на кожному кадрі. Тимчасове положення оновлюється напряму через Mapbox source:

```ts
setSourceData(map, 'anchor-source', createAnchorSource(nextLocation));
```

А store оновлюється тільки в кінці:

```ts
onAnchorChange(lastDragLocation);
```

Чому так:

- drag залишається плавним;
- React sidebar не re-renderиться на кожному mousemove;
- saved domain state змінюється тільки після підтвердженої дії користувача.

## Recalculate markers on anchor change

Marker зберігає не тільки абсолютні координати, а й вихідні domain values:

```ts
distance: number;
azimuth: number;
coords: [number, number];
```

Коли anchor змінюється, store перераховує всі absolute coords:

```ts
markersById: recalculateMarkers(loc, state.markersById)
```

Чому це правильно: `distance` і `azimuth` — це стабільна рибальська інформація, а `coords` залежать від базової точки. Якщо базову точку відкалібрували, markers мають автоматично переїхати.

## Live Preview Ray

Форма marker тепер синхронізована з мапою через transient store state:

```ts
markerDraft: {
  distance: string;
  azimuth: string;
  depth: string;
  structure: BottomStructure;
}
```

MapCanvas читає draft і будує preview:

```ts
const preview = useMarkerPreview();
```

Якщо `distance` і `azimuth` валідні, Mapbox отримує два preview sources:

```txt
preview-ray-source
preview-marker-source
```

Preview ray має dashed style:

```ts
'line-dasharray': [1.2, 1.2]
```

Чому це корисно: рибалка бачить майбутню точку ще до збереження. Це зменшує помилки при введенні азимуту або дистанції.

## Map-to-form editing

Клік по існуючій мітці на мапі переводить форму в edit mode:

```ts
map.on('click', 'marker-layer', (event) => {
  const markerId = event.features?.[0]?.properties?.id;
  onMarkerSelect(markerId);
});
```

Store заповнює form draft з marker:

```ts
selectMarkerForEditing(id);
```

Після цього кнопка змінюється:

```txt
Зберегти мітку -> Оновити мітку
```

Чому форма живе в store, а не локально в component state:

- MapCanvas і AddMarkerForm є sibling components;
- map click має змінити форму;
- preview ray має читати ті самі значення, які вводить користувач;
- transient state не потрапляє в LocalStorage завдяки `partialize`.

## Persisted vs transient state

У LocalStorage зберігаються тільки domain data:

```ts
partialize: (state) => ({
  anchor: state.anchor,
  markerIds: state.markerIds,
  markersById: state.markersById
})
```

Не зберігаються:

- `markerDraft`;
- `editingMarkerId`;
- `isCalibratingAnchor`.

Чому: після reload користувач має бачити збережені точки, але не випадково залишатись у режимі редагування або калібрування.

## Головний висновок

Новий UX зберігає clean architecture: Mapbox відповідає за високопродуктивне малювання, Zustand — за синхронізацію стану, GeoService — за координати, i18n словник — за мову. Компоненти залишаються тонкими і не беруть на себе чужу відповідальність.
