# 05. Validation і TypeScript

CarpMapper використовує дві лінії захисту від помилок:

- TypeScript — перевіряє код під час розробки;
- Zod — перевіряє дані під час виконання.

Разом вони зменшують шанс записати некоректний marker у store.

## TypeScript: compile-time safety

Домени описані в:

```txt
src/types/domain.ts
```

Наприклад:

```ts
export type BottomStructure = 'mud' | 'sand' | 'gravel' | 'clay' | 'weed';
```

Це означає, що TypeScript не дозволить випадково записати:

```ts
structure: 'rocks'
```

бо такого значення немає у union type.

## Чому coords — це tuple

```ts
coords: [number, number];
```

Це не просто `number[]`. Tuple каже: тут має бути рівно два числа.

Чому це важливо: Mapbox очікує `[lng, lat]`. Якщо зробити `number[]`, TypeScript не захистить від масиву на 1 або 3 елементи.

## MarkerDraft vs FishingMarker

Користувач вводить draft:

```ts
export interface MarkerDraft {
  name: string;
  distance: number;
  azimuth: number;
  depth: number;
  structure: BottomStructure;
}
```

А store створює повний marker:

```ts
export interface FishingMarker extends MarkerDraft {
  id: string;
  coords: [number, number];
  timestamp: number;
}
```

Чому так: UI не має генерувати `id`, `coords`, `timestamp`. Це відповідальність state/business layer.

## Zod: runtime validation

Форма працює з user input. User input завжди небезпечний, бо:

- HTML input повертає рядки;
- користувач може ввести пусте значення;
- azimuth може бути `500`;
- distance може бути `-20`;
- depth може бути не числом.

Схема знаходиться у:

```txt
src/features/markers/markerSchema.ts
```

```ts
export const markerSchema = z.object({
  name: z.string().trim().max(48).optional(),
  distance: z.coerce.number().positive().max(1000),
  azimuth: z.coerce.number().min(0).max(360),
  depth: z.coerce.number().min(0).max(60),
  structure: z.enum(['mud', 'sand', 'gravel', 'clay', 'weed'])
});
```

## Чому z.coerce.number

HTML input навіть для `type="number"` повертає string:

```ts
event.target.value // "85", не 85
```

`z.coerce.number()` конвертує:

```txt
"85" -> 85
```

Чому це добре: форма може зберігати raw input як string, але business logic отримує number.

## Add Marker flow

Спрощений flow:

```ts
const result = markerSchema.safeParse(values);

if (!result.success) {
  showErrors(result.error);
  return;
}

addMarker({
  distance: result.data.distance,
  azimuth: result.data.azimuth,
  depth: result.data.depth,
  structure: result.data.structure
});
```

Чому `safeParse`, а не `parse`: `parse` кидає exception, а `safeParse` повертає контрольований результат.

Це краще для UI:

```ts
if (!result.success) {
  // показати помилки біля полів
}
```

## Як Zod запобігає сміттю у store

Без validation можна було б записати:

```ts
{
  distance: -100,
  azimuth: 999,
  depth: NaN,
  structure: 'banana'
}
```

Після цього:

- Turf може порахувати некоректну точку;
- Mapbox може отримати invalid coordinates;
- localStorage збереже погані дані;
- після reload app може ламатися знову.

Zod блокує це до виклику `addMarker`.

## TypeScript не замінює Zod

TypeScript перевіряє код, але не перевіряє реальні дані від користувача.

Наприклад:

```ts
const distance: number = Number(inputValue);
```

TypeScript бачить `number`, але runtime значення може бути:

```ts
NaN
```

Zod перевіряє саме runtime value.

## Головний висновок

TypeScript захищає розробника від неправильного коду. Zod захищає додаток від неправильних даних користувача. Для CarpMapper це критично, бо одна погана координата може зіпсувати persisted state і показати marker не там, де треба.
