import type { BottomStructure } from '@/types/domain';

export const uk = {
  app: {
    title: 'КарповийМапер',
    description:
      'Зафіксуй род-под, введи дистанцію та азимут закиду і тримай сітку водойми під рукою.'
  },
  anchor: {
    title: 'Базова точка (род-под)',
    description: 'Початок координат для кожного променя закиду.',
    setCurrent: 'Я тут (GPS)',
    setManual: 'Вказати на мапі',
    cancelManual: 'Скасувати вибір',
    empty: 'Базову точку ще не збережено.',
    calibrating: 'Калібрування...',
    manualPlacement: 'Клікни на точне місце род-пода на супутниковій мапі.',
    calibrationHint: 'Перетягни точку на супутниковій мапі до реального місця род-пода.',
    errors: {
      permissionDenied: 'Доступ до геолокації заборонено.',
      unavailable: 'Геолокація зараз недоступна.',
      timeout: 'Запит геолокації перевищив час очікування.',
      unsupported: 'Цей браузер не підтримує геолокацію.',
      unknown: 'Не вдалося отримати поточну геолокацію.'
    }
  },
  markerForm: {
    addTitle: 'Додати мітку',
    editTitle: 'Редагувати мітку',
    description: 'Дистанція, азимут, глибина та структура дна.',
    name: 'Назва',
    namePlaceholder: 'Бровка з бойлами',
    distance: 'Дистанція, м',
    azimuth: 'Азимут',
    depth: 'Глибина, м',
    structure: 'Структура дна',
    save: 'Зберегти мітку',
    update: 'Оновити мітку',
    cancelEdit: 'Скасувати редагування',
    markerFallback: 'Мітка',
    errors: {
      anchorRequired: 'Спочатку встанови базову точку.',
      nameMax: 'Назва має містити не більше 48 символів.',
      distanceNumber: 'Дистанція має бути числом.',
      distancePositive: 'Дистанція має бути більшою за 0.',
      distanceMax: 'Дистанція має бути не більше 1000 метрів.',
      azimuthNumber: 'Азимут має бути числом.',
      azimuthMin: 'Азимут має бути не менше 0.',
      azimuthMax: 'Азимут має бути не більше 360.',
      depthNumber: 'Глибина має бути числом.',
      depthMin: 'Глибина не може бути відʼємною.',
      depthMax: 'Глибина має бути не більше 60 метрів.'
    }
  },
  markers: {
    title: 'Мітки',
    empty: 'Міток ще немає.',
    savedPoints: (count: number) => `${count} збережених точок`,
    deleteLabel: (name: string) => `Видалити ${name}`
  },
  map: {
    tokenRequiredTitle: 'Потрібен Mapbox token',
    tokenRequiredDescription:
      'Додай VITE_MAPBOX_TOKEN у локальне середовище і перезапусти dev server.',
    ariaLabel: 'Супутникова мапа рибальських міток',
    markerLabel: (depth: number, structure: string) => `Глиб: ${depth}м | ${structure}`
  },
  bottomStructures: {
    mud: 'Мул',
    sand: 'Пісок',
    gravel: 'Гравій',
    clay: 'Глина',
    weed: 'Трава'
  } satisfies Record<BottomStructure, string>
};
