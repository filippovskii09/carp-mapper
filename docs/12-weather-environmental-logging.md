# 12. Weather and Environmental Logging

CarpMapper автоматично підтягує погодний контекст для базової точки через Open-Meteo.

## API

Використовується безключовий endpoint:

```txt
https://api.open-meteo.com/v1/forecast
```

Параметри:

```txt
current=temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation
hourly=temperature_2m,pressure_msl
daily=sunrise,sunset
past_days=3
forecast_hours=1
timezone=auto
```

`pressure_msl` використовується замість `surface_pressure`, щоб не отримувати похибку через висоту над рівнем моря. `temperature_2m` за 72 години потрібна для Water Temperature Proxy. `daily=sunrise,sunset` залишається підготовкою для ширшого Solunar-модуля.

Kp-index для геомагнітних бур зберігається у `WeatherSnapshot` як `kpIndex`. Значення береться з NOAA SWPC:

```txt
https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
```

Якщо NOAA недоступний, використовується offline-safe fallback `2`, щоб погодний snapshot не блокував збереження міток.

## Pressure trend

Поточний `pressure_msl` порівнюється з найближчими hourly значеннями 24 і 48 годин тому:

```ts
delta24h < -3 hPa -> falling
delta24h > 3 hPa -> rising
abs(delta48h) < 2 hPa -> steady
else -> довший 48h тренд
```

Чому так: короткий 24h імпульс показує різкий фронт, а 48h delta відсікає шум і дає стабільніший контекст.

## Water Temperature Proxy

Короп реагує на температуру води, а не на миттєву температуру повітря. Тому CarpMapper рахує WTP як weighted moving average за 72 години:

```txt
WTP = average(last 24h air temp) * 0.65 + average(previous 48h air temp) * 0.35
```

Також рахується `waterTempDelta24h`, щоб ловити різке охолодження водойми.

## Wind direction

Градуси переводяться у cardinal direction:

```txt
N, NE, E, SE, S, SW, W, NW
```

## Marker snapshot

Поточний weather snapshot зберігається в Zustand як transient state:

```ts
currentWeather: WeatherSnapshot | null
```

Коли користувач зберігає marker, store додає snapshot у marker:

```ts
const weather = get().currentWeather;

weather: weather ? { ...weather } : null
```

Чому так: погода має бути зафіксована саме на момент створення точки, а не перераховуватись заднім числом. `markersById` входить у `persist.partialize`, тому цей snapshot автоматично потрапляє в LocalStorage разом із міткою.

## Carp Activity Engine 5.0

`CarpActivityEngine` повертає не одну строку, а структурований report:

```ts
interface ActivityReport {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Tough';
  recommendation: string;
  blocker: string | null;
  insights: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    message: string;
  }[];
}
```

Перед звичайною формулою перевіряються біологічні блокери:

```txt
Hypoxia:
season = summer && WTP >25°C && wind <5 км/г -> score cap 15

Temperature shock:
season = spring/autumn && waterTempDelta24h < -4°C -> score cap 20
```

Якщо Hypoxia або Temperature Shock блокер активний, engine одразу повертає warning insights і не застосовує звичайні множники. Post-frontal lockjaw працює інакше: він не скасовує весь розрахунок, але обрізає максимум до 35%, щоб показати різкий післяфронтальний ступор.

У v5 додано depth context. Якщо конкретна мітка лежить на глибині `3+ м`, а поверхневий WTP показує різке похолодання восени або навесні, temperature-shock blocker не спрацьовує. Глибока точка отримує лише множник `x0.85`, бо глибша вода повільніше охолоджується і краще буферизує шок.

Після blocker-check використовується expert-system:

```txt
FinalScore = clamp(
  BaseScore *
  WindDirectionMultiplier *
  SpatialWindMultiplier *
  WindSpeedMultiplier *
  DepthThermalBufferMultiplier *
  LightMultiplier *
  MoonMultiplier *
  SolunarMultiplier *
  DiurnalOxygenMultiplier *
  GeomagneticMultiplier,
  0,
  100
)
```

### Base score

```txt
Water Temperature Proxy:
12-18°C -> 100
18-23°C -> 80
8-12°C -> 70
<8°C або >24°C -> 30

Pressure:
delta24h < -3 hPa -> +20
abs(delta48h) < 2 hPa -> +10
delta24h > 3 hPa або pressure >1020 hPa -> -20
```

### Contextual multipliers

Wind:
S/SW/W -> x1.1
N/E/NE при WTP >22°C і вітрі 10-25 км/г -> x1.1
N/E/NE влітку без спеки -> x1.0
N/E/NE навесні, восени або взимку -> x0.8

Spatial wind:
без marker azimuth -> x1.0, розрахунок тільки для водойми в цілому
angleDiff <=45° між windDirectionDegrees і marker.azimuth -> x1.3, вітер в обличчя / прибійний берег
angleDiff >=135° -> x0.8, вітер у спину / підвітряний берег

Depth thermal buffer:
marker.depth >=3 м && spring/autumn && waterTempDelta24h <-4°C -> x0.85 замість temperature-shock blocker

Wind speed:
10-25 км/г -> x1.15
<5 км/г -> x0.9

Light:
clouds >60% або precipitation <2 мм -> x1.1
clouds <20% -> x0.85

Moon:
new moon +/- 2 дні -> x1.1
full moon +/- 2 дні -> x0.9

Solunar:
active Major window -> x1.25
active Minor window -> x1.15
daylight && clouds <30% && active Major -> x1.10 замість x1.25
daylight && clouds <30% && active Minor -> x1.05 замість x1.15

Diurnal oxygen:
summer && WTP >22°C && 04:00-08:00 -> x0.85, ранковий дефіцит кисню
summer && WTP >22°C && 04:00-08:00 && wind >12 км/г -> x1.0, нічний вітер перемішав воду
summer && WTP >22°C && 16:00-20:00 -> x1.15, максимум кисню після денного фотосинтезу

Geomagnetic:
Kp >=5 -> x0.6, сильна магнітна буря пригнічує орієнтацію і рух риби
```

UI показує круговий score, український badge, `Статус водойми`, `Тактичні вікна (Solunar)` і розкривний `Розбір активності` з поясненням кожного фактора. Повідомлення мають формат `+10%`, `-20%` або `0%`, щоб рибалка бачив, що саме підняло або знизило оцінку.

Це не “AI prediction”, а прозора польова підказка на базі common carp fishing heuristics.

## General vs marker-specific score

`CurrentConditionsWidget` показує загальну оцінку водойми. У цьому режимі engine не має азимуту закиду, тому просторовий множник нейтральний:

```txt
Розрахунок для водойми в цілому
```

Коли користувач натискає конкретну мітку на мапі, відкривається `MarkerActivityModal`. Він запускає `calculateMarkerActivity(weather, marker)` і порівнює вітер із напрямком закиду:

```ts
let angleDiff = Math.abs(windDirectionDegrees - marker.azimuth);
if (angleDiff > 180) angleDiff = 360 - angleDiff;
```

Чому так: метеорологічний напрям вітру означає, звідки вітер дме. Якщо мітка лежить у тому ж секторі, рибалка ловить у вітер, і хвиля несе природний корм у його точку. Якщо мітка у протилежному секторі, це вітер у спину, і риба частіше зміщується до іншого берега.

У v5 `calculateMarkerActivity` отримує всю мітку, а не тільки азимут:

```ts
calculateMarkerActivity(weather, marker)
```

Це потрібно для `marker.depth`. У modal додано секцію `Статус точки`, де показано глибину, азимут, WTP, зміну WTP за 24 години, вітер і Kp-index. Це пояснює користувачу, що score рахується для конкретної 3D-точки, а не тільки для погоди над озером.

## Moon phase

Forecast endpoint Open-Meteo не дає стабільної `moon_phase` змінної для цього набору даних, тому CarpMapper рахує фазу місяця локально з timestamp погодного snapshot. Це офлайн-сумісно і зберігається в marker payload:

```ts
moonPhaseIcon: '🌕'
moonPhaseLabel: 'Повня'
```

## Offline behavior

Якщо інтернету немає, marker все одно зберігається. `weather` буде `null`. Це відповідає offline-first принципу: логування точки важливіше за блокування через API.
