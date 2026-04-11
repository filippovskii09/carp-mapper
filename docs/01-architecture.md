# 01. Архітектура проекту

CarpMapper побудований як feature-based React PWA. Це означає, що код групується не за технічним типом файлу, а за бізнес-фічами: мапа, маркери, геолокація.

## Структура

```txt
src/
├── components/      # Спільні UI-примітиви
├── config/          # Константи та env
├── features/        # Ізольовані функціональні модулі
│   ├── location/    # GPS та Anchor
│   ├── map/         # Mapbox rendering
│   └── markers/     # Marker form, list, validation
├── services/        # Чисті бізнес-сервіси
├── store/           # Zustand state
└── types/           # Домени TypeScript
```

## Чому feature-based краще за flat structure

Flat structure часто виглядає так:

```txt
src/
├── components/
├── hooks/
├── utils/
├── types/
└── store/
```

На старті це просто, але з ростом проекту виникає проблема: щоб зрозуміти фічу `markers`, треба стрибати між `components`, `hooks`, `utils`, `types`, `store`. Код фізично розкиданий.

Feature-based структура тримає пов'язаний код поруч:

```txt
features/markers/
├── components/AddMarkerForm.tsx
├── components/MarkerList.tsx
├── hooks/useAddMarkerForm.ts
└── markerSchema.ts
```

Чому це важливо:

- легше видалити або переписати фічу;
- менше випадкових залежностей між модулями;
- новий розробник швидше знаходить потрібну логіку;
- простіше масштабувати проект: наприклад, додати `features/catches` для щоденника улову.

## Clean Architecture у цьому проекті

Clean Architecture тут застосована прагматично, без зайвої абстракції.

Основна ідея: UI не повинен напряму містити бізнес-правила.

### Domain layer

Доменні типи лежать у `src/types/domain.ts`:

```ts
export interface FishingMarker {
  id: string;
  name: string;
  distance: number;
  azimuth: number;
  depth: number;
  structure: BottomStructure;
  coords: [number, number];
  timestamp: number;
}
```

Це мова проекту. Компоненти, store і сервіси говорять однаковими типами.

### Service layer

Геодезія винесена у `GeoService`:

```ts
geoService.calculateDestination(anchor, distance, azimuth);
```

Чому так: компонент форми не має знати, що всередині використовується Turf або формула Haversine. Якщо завтра ми замінимо бібліотеку, UI не зміниться.

### State layer

Zustand store відповідає за стан:

```ts
addMarker(markerDraft);
deleteMarker(id);
setAnchor(location);
```

Компоненти викликають дії, але не вирішують, як саме зберігати дані.

### UI layer

UI компоненти відповідають за відображення і user interaction:

```tsx
<AnchorControl />
<AddMarkerForm />
<MarkerList />
<MapCanvas />
```

Чому це чистіше: форма не керує Mapbox, Mapbox не знає про Zod, список маркерів не рахує координати.

## Принципи SOLID, які тут використані

### Single Responsibility Principle

Кожен модуль має одну причину для зміни:

- `GeoService.ts` змінюється, якщо змінюється геоматика;
- `markerSchema.ts` змінюється, якщо змінюються правила форми;
- `useMapbox.ts` змінюється, якщо змінюється інтеграція з Mapbox;
- `mapSlice.ts` змінюється, якщо змінюється модель стану.

### Dependency Direction

UI залежить від сервісів і store, але сервіси не залежать від UI.

Правильний напрямок:

```txt
UI -> hooks -> store/services -> domain types
```

Неправильний напрямок:

```txt
GeoService -> React component
```

Чому це важливо: бізнес-логіку можна тестувати окремо від React і Mapbox.

## Adapter mindset для мапи

Mapbox ізольований у `features/map`. Решта програми працює з доменними даними: `anchor`, `markers`, `coords`.

Це означає, що теоретично можна замінити Mapbox на Leaflet або Google Maps, не переписуючи форму додавання маркера чи Zustand store.

## Головний висновок

Feature-based структура з clean separation робить проект не просто робочим MVP, а базою, яку можна розвивати: журнал улову, декілька водойм, експорт точок, синхронізація, офлайн-пакети мап.
