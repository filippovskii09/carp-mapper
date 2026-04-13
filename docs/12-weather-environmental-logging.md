# 12. Weather and Environmental Logging

CarpMapper автоматично підтягує погодний контекст для базової точки через Open-Meteo.

## API

Використовується безключовий endpoint:

```txt
https://api.open-meteo.com/v1/forecast
```

Параметри:

```txt
current=temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,rain
hourly=pressure_msl
daily=sunrise,sunset
past_hours=24
forecast_hours=1
timezone=auto
```

`pressure_msl` використовується замість `surface_pressure`, щоб не отримувати похибку через висоту над рівнем моря. `daily=sunrise,sunset` вже додано як підготовку для майбутнього Solunar-модуля.

## Pressure trend

Поточний `pressure_msl` порівнюється з найближчим hourly значенням 12 годин тому всередині 24-годинного історичного масиву:

```ts
current - past < -2 hPa -> falling
current - past > 2 hPa -> rising
else -> steady
```

Зміни в межах `2 hPa` вважаються `steady`, щоб не реагувати на погодний шум.

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

## Fish activity insight

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

Weighted formula:

```txt
TotalScore =
  0.30 * TemperatureScore +
  0.35 * PressureScore +
  0.25 * WindScore +
  0.10 * SkyScore
```

Rules:

```txt
Temperature:
12-18°C -> 100
8-12°C або 18-24°C -> 70
<8°C або >24°C -> 30

Pressure:
falling >2 hPa за 12h або <1012 hPa -> 100
1012-1018 hPa stable -> 70
rising >2 hPa або >1020 hPa -> 20

Wind:
S/SW/W -> 100
NW/SE -> 60
N/E/NE -> 20
10-25 км/г -> x1.2, capped at 100
<3 км/г -> x0.7

Sky:
clouds >60% -> 100
clouds 30-60% -> 70
clouds <30% -> 30
minor rain <2 мм/г -> +20 bonus
```

UI показує круговий score, український badge і розкривний `Розбір активності` з поясненням кожного фактора.

Це не “AI prediction”, а прозора польова підказка на базі common carp fishing heuristics.

## Moon phase

Forecast endpoint Open-Meteo не дає стабільної `moon_phase` змінної для цього набору даних, тому CarpMapper рахує фазу місяця локально з timestamp погодного snapshot. Це офлайн-сумісно і зберігається в marker payload:

```ts
moonPhaseIcon: '🌕'
moonPhaseLabel: 'Повня'
```

## Offline behavior

Якщо інтернету немає, marker все одно зберігається. `weather` буде `null`. Це відповідає offline-first принципу: логування точки важливіше за блокування через API.
