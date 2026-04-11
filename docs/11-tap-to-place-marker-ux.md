# 11. Tap-to-place Marker UX

Цей refactor переводить додавання marker з ручного введення азимуту у візуальну взаємодію з мапою.

## Проблема

На мобільному вводити `Азимут 0-360` вручну незручно. У реальному сценарії рибалка хоче:

1. поставити базову точку;
2. ткнути в мапу там, куди летить закид;
3. отримати дистанцію і азимут автоматично;
4. швидко вибрати структуру дна;
5. зберегти.

## Tap-to-place flow

Mapbox click по пустій мапі викликає:

```ts
placeDraftMarker({ lng, lat });
```

Store рахує:

```ts
distance = geoService.calculateDistance(anchor, target);
azimuth = geoService.calculateBearing(anchor, target);
```

Після цього form draft отримує:

```ts
distanceMode: 'meters';
distance: '85.4';
azimuth: '120';
```

Форма автоматично відкривається в mobile bottom sheet.

## Turf math

`GeoService` використовує:

```ts
@turf/bearing
@turf/distance
@turf/destination
```

Bearing нормалізується у формат `0-360`:

```ts
(bearing + 360) % 360
```

## Two-way binding

Після tap-to-place marker не стає saved marker. Це лише draft.

Якщо користувач змінює дистанцію вручну, наприклад після виміру на кілочках, існуючий preview механізм перераховує координати:

```ts
destination(anchor, newDistance, currentAzimuth)
```

Тому draft marker “їде” ближче або далі по тому самому променю.

## Missing anchor toast

Якщо anchor не встановлений, tap по мапі не створює marker. Замість цього показується toast:

```txt
Please set your base point first.
```

Чому: без anchor неможливо порахувати ні дистанцію, ні азимут.

## Gesture safety

Ми використовуємо Mapbox `click`, а не `touchstart`. Це важливо:

- pan/drag мапи не створює marker;
- clear tap створює draft;
- click по existing marker відкриває edit mode;
- manual anchor placement має пріоритет над marker placement.
