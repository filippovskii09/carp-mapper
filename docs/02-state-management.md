# 02. State Management

У CarpMapper стан зберігається через Zustand. Це легка бібліотека для глобального state management без boilerplate, який часто з'являється в Redux.

Основний store знаходиться у:

```txt
src/store/index.ts
src/store/slices/mapSlice.ts
```

## Які дані зберігаються

Store тримає:

```ts
interface MapStore {
  anchor: Location | null;
  markerIds: string[];
  markersById: Record<string, FishingMarker>;
  setAnchor: (loc: Location) => void;
  addMarker: (marker: MarkerDraft) => void;
  deleteMarker: (id: string) => void;
}
```

Тут є два головні домени:

- `anchor` — точка, де стоїть рибалка;
- `markers` — точки на водоймі, обчислені від anchor.

## Чому Zustand

Zustand добре підходить для цього MVP, бо:

- мінімальний boilerplate;
- компоненти можуть підписуватись тільки на потрібну частину state;
- є готовий `persist` middleware;
- добре працює з TypeScript;
- не потребує Provider навколо всього app.

Приклад селектора:

```ts
const anchor = useMapStore((state) => state.anchor);
```

Чому це важливо: компонент перерендериться тільки коли зміниться `anchor`, а не весь store.

## Slice pattern

Slice pattern означає, що store можна збирати з окремих частин.

Зараз є один slice:

```ts
export const createMapSlice = (set, get) => ({
  anchor: null,
  markerIds: [],
  markersById: {},
  setAnchor: (loc) => set({ anchor: loc }),
  addMarker: (draft) => { /* ... */ },
  deleteMarker: (id) => { /* ... */ }
});
```

Чому це потрібно, якщо проект маленький: ми готуємо структуру до росту.

Наприклад, пізніше можна додати:

```txt
store/slices/mapSlice.ts
store/slices/catchLogSlice.ts
store/slices/lakesSlice.ts
store/slices/settingsSlice.ts
```

Тоді store стане композицією:

```ts
createMapSlice(...args),
createCatchLogSlice(...args),
createSettingsSlice(...args)
```

Чому це краще: нова бізнес-зона не змушує переписувати один великий "god store".

## Persist middleware

`persist` автоматично зберігає частину store у `localStorage`.

```ts
export const useMapStore = create<MapStore>()(
  persist(
    (...args) => ({
      ...createMapSlice(...args)
    }),
    {
      name: 'carpmapper-map-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        anchor: state.anchor,
        markerIds: state.markerIds,
        markersById: state.markersById
      })
    }
  )
);
```

Як це працює:

1. Користувач ставить anchor або додає marker.
2. Zustand оновлює in-memory state.
3. `persist` серіалізує вибрану частину state в JSON.
4. JSON записується у `localStorage`.
5. Після reload сторінки Zustand читає JSON назад і відновлює state.

Чому це важливо для рибалки: точки не зникають після перезавантаження або втрати інтернету.

## Що таке partialize

`partialize` визначає, що саме зберігати:

```ts
partialize: (state) => ({
  anchor: state.anchor,
  markerIds: state.markerIds,
  markersById: state.markersById
})
```

Ми не зберігаємо functions (`addMarker`, `deleteMarker`), бо функції не серіалізуються в JSON. Зберігаємо тільки дані.

## Data normalization

Замість масиву:

```ts
markers: FishingMarker[]
```

проект використовує:

```ts
markerIds: string[];
markersById: Record<string, FishingMarker>;
```

Це називається normalized state.

Приклад:

```ts
markerIds: ['a1', 'b2'];
markersById: {
  a1: { id: 'a1', name: 'Shelf', /* ... */ },
  b2: { id: 'b2', name: 'Weed edge', /* ... */ }
}
```

Чому це краще:

- швидке видалення по `id`;
- немає дублювання об'єктів;
- простіше оновлювати один marker;
- легше додавати майбутні relations, наприклад `lakeId` або `sessionId`.

## Селектор selectMarkers

UI часто хоче масив, тому є селектор:

```ts
export function selectMarkers(state: MapStore): FishingMarker[] {
  return state.markerIds.map((id) => state.markersById[id]).filter(Boolean);
}
```

Чому store normalized, а UI отримує array: це компроміс між ефективним зберіганням і зручним рендерингом.

## Головний висновок

Zustand тут використаний не просто як глобальна змінна. Він задає контрольовану модель даних: actions змінюють state, persist зберігає state, normalized structure готує проект до росту.
