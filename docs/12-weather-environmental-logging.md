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
hourly=pressure_msl
daily=sunrise,sunset
past_hours=48
forecast_hours=1
timezone=auto
```

`pressure_msl` використовується замість `surface_pressure`, щоб не отримувати похибку через висоту над рівнем моря. `daily=sunrise,sunset` вже додано як підготовку для майбутнього Solunar-модуля.

## Pressure trend

Поточний `pressure_msl` порівнюється з найближчими hourly значеннями 24 і 48 годин тому:

```ts
delta24h < -3 hPa -> falling
delta24h > 3 hPa -> rising
abs(delta48h) < 2 hPa -> steady
else -> довший 48h тренд
```

Чому так: короткий 24h імпульс показує різкий фронт, а 48h delta відсікає шум і дає стабільніший контекст.

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

## Carp Activity Engine 2.0

`CarpActivityEngine` повертає не одну строку, а структурований report:

```ts
interface ActivityReport {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Tough';
  recommendation: string;
  insights: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    message: string;
  }[];
}
```

Стара лінійна формула замінена на expert-system:

```txt
FinalScore = clamp(
  BaseScore *
  WindDirectionMultiplier *
  WindSpeedMultiplier *
  LightMultiplier *
  MoonMultiplier,
  0,
  100
)
```

### Base score

```txt
Temperature:
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
N/E/NE влітку при temperature >20°C -> x1.05
N/E/NE влітку без спеки -> x1.0
N/E/NE навесні, восени або взимку -> x0.8

Wind speed:
10-25 км/г -> x1.15
<5 км/г -> x0.9

Light:
clouds >60% або precipitation <2 мм -> x1.1
clouds <20% -> x0.85

Moon:
new moon +/- 2 дні -> x1.1
full moon +/- 2 дні -> x0.9
```

UI показує круговий score, український badge і розкривний `Розбір активності` з поясненням кожного фактора. Повідомлення мають формат `+10%`, `-20%` або `0%`, щоб рибалка бачив, що саме підняло або знизило оцінку.

Це не “AI prediction”, а прозора польова підказка на базі common carp fishing heuristics.

## Moon phase

Forecast endpoint Open-Meteo не дає стабільної `moon_phase` змінної для цього набору даних, тому CarpMapper рахує фазу місяця локально з timestamp погодного snapshot. Це офлайн-сумісно і зберігається в marker payload:

```ts
moonPhaseIcon: '🌕'
moonPhaseLabel: 'Повня'
```

## Offline behavior

Якщо інтернету немає, marker все одно зберігається. `weather` буде `null`. Це відповідає offline-first принципу: логування точки важливіше за блокування через API.
