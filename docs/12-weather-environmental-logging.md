# 12. Weather and Environmental Logging

CarpMapper автоматично підтягує погодний контекст для базової точки через Open-Meteo.

## API

Використовується безключовий endpoint:

```txt
https://api.open-meteo.com/v1/forecast
```

Параметри:

```txt
current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover
hourly=surface_pressure
past_hours=12
forecast_hours=1
timezone=auto
```

## Pressure trend

Поточний тиск порівнюється з тиском 12 годин тому:

```ts
current < past -> falling
current > past -> rising
else -> steady
```

Малий шум до `0.5 hPa` вважається `steady`.

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
weather: get().currentWeather
```

Чому так: погода має бути зафіксована саме на момент створення точки, а не перераховуватись заднім числом.

## Fish activity insight

Простий rule-based helper:

```txt
pressure < 1012 && falling -> High Activity
pressure > 1020 && rising -> Low Activity
S/SW wind -> Good Wind Direction
```

Це не “AI prediction”, а прозора польова підказка на базі common carp fishing heuristics.

## Offline behavior

Якщо інтернету немає, marker все одно зберігається. `weather` буде `null`. Це відповідає offline-first принципу: логування точки важливіше за блокування через API.
