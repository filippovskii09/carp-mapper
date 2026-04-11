# 08. Mobile PWA Native UX

Цей документ описує mobile-first адаптацію CarpMapper під сценарій “додав на домашній екран і користуєшся як нативним app”.

## Проблема

Початковий MVP працював як PWA, але mobile UX був ближчий до responsive сайту:

- sidebar накладався на мапу як довга панель;
- iPhone safe-area не враховувався повністю;
- inputs могли збільшувати сторінку на iOS;
- не було app-like навігації між ключовими діями;
- browser scroll/bounce міг заважати взаємодії з мапою.

## App Shell

Root layout використовує спеціальний клас:

```tsx
<main className="app-shell relative overflow-hidden bg-background">
```

CSS:

```css
.app-shell {
  height: 100vh;
  height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

Чому `100dvh`: мобільні браузери мають динамічні address bars. `100vh` часто дає неправильну висоту на iOS Safari. `100dvh` краще відповідає реальній видимій області.

## Mobile Bottom Sheet

На desktop залишається sidebar. На mobile використовується bottom sheet з трьома вкладками:

```txt
Місце | Мітка | Список
```

Чому так:

- це ближче до native iOS/Android патерну;
- мапа лишається основним екраном;
- користувач швидко перемикається між anchor, marker form і списком;
- форма не займає весь екран постійно.

Collapsed state приховує контент і лишає тільки handle + tabs. Expanded state відкриває активну дію.

## Safe Area

Bottom sheet позиціонується з урахуванням iPhone notch/home indicator:

```css
bottom: max(0.75rem, env(safe-area-inset-bottom));
left: max(0.75rem, env(safe-area-inset-left));
right: max(0.75rem, env(safe-area-inset-right));
```

Чому це важливо: у standalone mode на iPhone нижній home indicator може перекривати кнопки, якщо не врахувати safe-area.

## Touch Targets

Buttons і form controls мають мінімальну висоту 44px+:

```css
min-h-11
```

Чому: Apple Human Interface Guidelines рекомендує touch targets близько 44pt. Це зменшує mis-taps на водоймі, коли користувач працює однією рукою.

## iOS Input Zoom Fix

iOS Safari збільшує сторінку, якщо input font-size менший за 16px.

Тому mobile inputs мають:

```css
input,
select,
textarea {
  font-size: 16px;
}
```

На desktop повертаємо компактний розмір через media query.

## Standalone Meta

`index.html` має iOS/PWA meta:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

Чому:

- `viewport-fit=cover` дозволяє app працювати в safe-area fullscreen;
- `apple-mobile-web-app-capable` вмикає standalone запуск з home screen;
- `black-translucent` дає більш native dark-map відчуття.

## Scroll and Overscroll Control

Body не має звичайного page scroll:

```css
html,
body,
#root {
  overflow: hidden;
  overscroll-behavior: none;
}
```

Scroll дозволений тільки всередині bottom sheet content.

Чому: мапа має ловити pan/pinch gestures, а не сторінка.

## Головний висновок

Native-like PWA — це не тільки manifest. Потрібні app shell, safe-area, touch targets, правильна viewport висота, контроль scroll і mobile navigation pattern. Після цих змін CarpMapper поводиться як встановлений польовий інструмент, а не як сайт у браузері.
