# 04. Mapbox і продуктивність

CarpMapper використовує Mapbox GL JS для супутникової мапи. Важливе рішення: markers і rays реалізовані через Mapbox Sources and Layers, а не через багато HTML markers.

Код знаходиться у:

```txt
src/features/map/hooks/useMapbox.ts
src/features/map/mapSources.ts
src/features/map/mapLayers.ts
```

## Що таке Source

Source — це дані для Mapbox.

Наприклад, markers перетворюються у GeoJSON:

```ts
{
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id: marker.id,
        structure: marker.structure
      }
    }
  ]
}
```

Source відповідає на питання: "що малювати?"

У проекті є:

- `anchor-source` — базова точка;
- `marker-source` — точки закиду;
- `ray-source` — лінії від anchor до marker.

## Що таке Layer

Layer відповідає на питання: "як малювати?"

Наприклад:

```ts
export const rayLayer = {
  id: 'ray-layer',
  type: 'line',
  source: 'ray-source',
  paint: {
    'line-width': 3,
    'line-opacity': 0.55
  }
};
```

Один і той самий Source можна відобразити різними Layers: circle, line, label.

## Чому не HTML markers

Mapbox дозволяє створювати HTML markers:

```ts
new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
```

Це зручно для 2-3 точок, але погано масштабується.

Проблеми HTML markers:

- кожен marker — DOM element;
- браузер має перераховувати layout;
- pan/zoom мапи змушує синхронізувати DOM з WebGL canvas;
- багато markers можуть створювати jank на мобільних пристроях;
- React може випадково втягнутись у зайві re-render цикли.

Для риболовного застосунку це важливо, бо телефон часто працює:

- на батареї;
- на сонці;
- з GPS;
- з мобільним інтернетом або без нього;
- на не найновішому hardware.

## Чому Sources and Layers швидші

Mapbox GL рендерить Layers через WebGL. Це означає, що:

- точки і лінії малюються GPU;
- pan/zoom обробляє Mapbox engine;
- React не перемальовує marker при кожному русі мапи;
- дані оновлюються пакетно через `source.setData`.

У проекті оновлення виглядає так:

```ts
source.setData(createMarkerSource(markers));
```

Чому це краще: ми передаємо Mapbox новий GeoJSON, а рендеринг лишається всередині Mapbox.

## WebGL і батарея

WebGL не завжди "дешевший", але для мап він правильніший:

- GPU спеціалізований для візуального рендерингу;
- Mapbox оптимізує тайли, символи, лінії і точки;
- DOM не роздувається сотнями елементів;
- менше main-thread роботи для браузера.

Практичний ефект: коли користувач рухає мапу, React sidebar не повинен re-renderитись через кожен кадр.

## Як проект зменшує re-renders

`MapCanvas` lazy-loaded:

```ts
const MapCanvas = lazy(() => import('@/features/map/components/MapCanvas'));
```

Чому: Mapbox GL великий, тому основний UI не має чекати завантаження всього map engine.

`MapCanvas` обгорнутий у `memo`:

```tsx
export const MapCanvas = memo(function MapCanvas() {
  // ...
});
```

Чому: це захист від зайвих перерендерів, якщо parent component зміниться.

Mapbox instance живе в `useRef`:

```ts
const mapRef = useRef<mapboxgl.Map | null>(null);
```

Чому: map instance не є React state. Якщо покласти його в `useState`, це могло б створювати зайві рендери.

## Layer styling by structure

Колір marker залежить від типу дна:

```ts
'circle-color': [
  'match',
  ['get', 'structure'],
  'mud', '#7a5133',
  'sand', '#e1c75f',
  'weed', '#6fa35f',
  '#f4efe1'
]
```

Це Mapbox expression. Чому це добре: колір обчислюється на стороні Mapbox renderer, а не в React loop.

## Головний висновок

Sources and Layers — це не просто "інший спосіб намалювати точки". Це архітектурне рішення, яке тримає мапу у високопродуктивному WebGL pipeline і не змушує React керувати кожним marker як DOM-елементом.
