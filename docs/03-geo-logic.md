# 03. Геологіка і математика

Серце CarpMapper — перетворення трьох значень у координати на мапі:

- anchor: де стоїть рибалка;
- distance: дистанція закиду в метрах;
- azimuth: напрямок закиду в градусах.

Логіка знаходиться у:

```txt
src/services/GeoService.ts
```

## Вхідні дані

Anchor:

```ts
const anchor = {
  lat: 50.4501,
  lng: 30.5234
};
```

Marker draft:

```ts
const distance = 85; // meters
const azimuth = 120; // degrees
```

Результат:

```ts
const coords = [lng, lat];
```

Mapbox очікує координати саме у форматі `[longitude, latitude]`, а не `[latitude, longitude]`.

## Чому це не проста геометрія на площині

Було б спокусливо думати так:

```txt
x = distance * cos(angle)
y = distance * sin(angle)
```

Але Земля не є плоскою системою координат. GPS працює з широтою і довготою на сфероїді. Навіть для 80-150 метрів краще використовувати геодезичні формули, бо:

- градуси latitude і longitude не мають однакової довжини;
- довжина одного градуса longitude залежить від latitude;
- Mapbox і GPS працюють у географічних координатах.

## turf.destination

Основний метод:

```ts
calculateDestination(anchor, distanceMeters, azimuthDegrees): [number, number] {
  const distanceKilometers = distanceMeters / 1000;
  const origin = point([anchor.lng, anchor.lat]);
  const result = destination(origin, distanceKilometers, azimuthDegrees, {
    units: 'kilometers'
  });

  return result.geometry.coordinates;
}
```

`@turf/destination` бере:

- початкову точку;
- дистанцію;
- bearing/azimuth;
- одиниці вимірювання;

і повертає фінальну GPS-координату.

## Чому метри треба конвертувати в кілометри

У формі користувач вводить дистанцію в метрах:

```txt
85
```

Для рибалки це природна одиниця: 85 метрів закиду.

Але Turf викликається так:

```ts
destination(origin, distanceKilometers, azimuthDegrees, {
  units: 'kilometers'
});
```

Тому:

```ts
const distanceKilometers = distanceMeters / 1000;
```

Якщо не зробити конвертацію, `85` буде прочитано як 85 км, і marker з'явиться далеко за межами водойми.

## Що таке azimuth

Azimuth — це напрямок у градусах:

```txt
0°   = північ
90°  = схід
180° = південь
270° = захід
360° = північ
```

Тобто `distance=85` і `azimuth=120` означає: від anchor пройти 85 метрів у напрямку 120 градусів.

## Формула destination

У `GeoService` також є метод `calculateDestinationByFormula`. Він показує математичну основу:

```ts
const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
```

Формули:

```txt
φ2 = asin(
  sin(φ1) * cos(δ) +
  cos(φ1) * sin(δ) * cos(θ)
)

λ2 = λ1 + atan2(
  sin(θ) * sin(δ) * cos(φ1),
  cos(δ) - sin(φ1) * sin(φ2)
)
```

Де:

- `φ` — latitude у радіанах;
- `λ` — longitude у радіанах;
- `θ` — bearing/azimuth у радіанах;
- `δ` — angular distance, тобто дистанція / радіус Землі.

Чому в коді є `toRadians` і `toDegrees`: JavaScript `Math.sin`, `Math.cos`, `Math.atan2` працюють з радіанами, а користувач вводить градуси.

## Haversine distance

Метод `calculateHaversineDistance` рахує реальну дистанцію між двома GPS-точками:

```ts
geoService.calculateHaversineDistance(anchor, target);
```

Навіщо це потрібно:

- можна перевірити, що marker справді приблизно на введеній дистанції;
- можна показувати measured distance у списку;
- корисно для майбутніх тестів точності.

## Чому GeoService singleton

```ts
export const geoService = GeoService.getInstance();
```

GeoService не має стану користувача. Це набір чистих операцій. Singleton тут потрібен не для магії, а щоб:

- не створювати новий service у кожному компоненті;
- мати одну точку входу для геоматематики;
- легко замінити реалізацію всередині.

## Головний висновок

CarpMapper не малює marker "на око". Він переводить реальний GPS anchor, дистанцію і azimuth у географічну координату, яку Mapbox може точно відобразити на супутниковій мапі.
