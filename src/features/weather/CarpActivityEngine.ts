import type { ActivityImpact, ActivityRating, ActivityReport, PressureTrend } from '@/types/domain';

interface ActivityInput {
  temperatureC: number;
  pressureHpa: number;
  pressureTrend: PressureTrend;
  pressureDelta12h: number;
  windDirection: string;
  windSpeedKmh: number;
  cloudCoverPercent: number;
  rainMm: number;
}

interface FactorScore {
  score: number;
  impact: ActivityImpact;
  message: string;
}

const WEIGHTS = {
  temperature: 0.3,
  pressure: 0.35,
  wind: 0.25,
  sky: 0.1
} as const;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getRating(score: number): ActivityRating {
  if (score >= 80) {
    return 'Excellent';
  }

  if (score >= 65) {
    return 'Good';
  }

  if (score >= 45) {
    return 'Fair';
  }

  return 'Tough';
}

function scoreTemperature(temperatureC: number): FactorScore {
  if (temperatureC >= 12 && temperatureC <= 18) {
    return {
      score: 100,
      impact: 'positive',
      message: `${temperatureC}°C у найкращому діапазоні для стабільного харчування коропа`
    };
  }

  if ((temperatureC > 18 && temperatureC <= 24) || (temperatureC >= 8 && temperatureC < 12)) {
    return {
      score: 70,
      impact: 'neutral',
      message: `${temperatureC}°C дає робочі умови, але активність може бути хвилями`
    };
  }

  return {
    score: 30,
    impact: 'negative',
    message: `${temperatureC}°C поза комфортним діапазоном, риба може бути пасивною`
  };
}

function scorePressure(pressureHpa: number, trend: PressureTrend, delta12h: number): FactorScore {
  const isFallingHard = delta12h < -2;
  const isRisingHard = delta12h > 2;

  if (isFallingHard || (pressureHpa < 1012 && trend !== 'rising')) {
    return {
      score: 100,
      impact: 'positive',
      message: 'Падіння або низький тиск стимулює впевнене донне харчування'
    };
  }

  if (isRisingHard || pressureHpa > 1020) {
    return {
      score: 20,
      impact: 'negative',
      message: 'Високий або зростаючий тиск може підняти коропа у товщу води'
    };
  }

  if (pressureHpa >= 1012 && pressureHpa <= 1018) {
    return {
      score: 70,
      impact: 'neutral',
      message: 'Нормальний стабільний тиск дає передбачувані, але не пікові умови'
    };
  }

  return {
    score: 50,
    impact: 'neutral',
    message: 'Тиск у перехідній зоні, варто перевіряти кілька типів презентації'
  };
}

function scoreWind(windDirection: string, windSpeedKmh: number): FactorScore {
  let baseScore = 20;
  let impact: ActivityImpact = 'negative';
  let message = `${windDirection} вітер часто охолоджує сектор і знижує активність`;

  if (windDirection === 'S' || windDirection === 'SW' || windDirection === 'W') {
    baseScore = 100;
    impact = 'positive';
    message = `${windDirection} вітер (${windSpeedKmh} км/г) штовхає теплу, насичену киснем воду`;
  } else if (windDirection === 'NW' || windDirection === 'SE') {
    baseScore = 60;
    impact = 'neutral';
    message = `${windDirection} вітер (${windSpeedKmh} км/г) дає помірний ефект для сектору`;
  }

  if (windSpeedKmh >= 10 && windSpeedKmh <= 25) {
    return {
      score: clampScore(baseScore * 1.2),
      impact,
      message: `${message}; швидкість створює корисну хвилю`
    };
  }

  if (windSpeedKmh < 3) {
    return {
      score: clampScore(baseScore * 0.7),
      impact: impact === 'positive' ? 'neutral' : impact,
      message: `${message}; штиль робить рибу обережнішою`
    };
  }

  return { score: baseScore, impact, message };
}

function scoreSky(cloudCoverPercent: number, rainMm: number): FactorScore {
  let score = 30;
  let impact: ActivityImpact = 'negative';
  let message = 'Ясне небо робить рибу обережною на мілководді';

  if (cloudCoverPercent > 60) {
    score = 100;
    impact = 'positive';
    message = 'Хмарність понад 60% знижує світловий пресинг і додає впевненості рибі';
  } else if (cloudCoverPercent >= 30) {
    score = 70;
    impact = 'neutral';
    message = 'Помірна хмарність дає збалансовані умови для пошуку риби';
  }

  if (rainMm > 0 && rainMm < 2) {
    score = clampScore(score + 20);
    impact = 'positive';
    message = `${message}; слабкий дощ додає кисень і маскує шум`;
  }

  return { score, impact, message };
}

function getRecommendation(pressureScore: FactorScore): string {
  if (pressureScore.score <= 20) {
    return 'Високий тиск: короп може стояти в товщі води. Спробуйте Zig-Rig або середній горизонт.';
  }

  if (pressureScore.score >= 100) {
    return 'Низький тиск: короп імовірно впевнено харчується з дна. Фокус на гравій, глину або живий мул.';
  }

  return 'Умови змішані: почніть з донної точки, але тримайте запасний варіант у товщі води.';
}

export function calculateCarpActivity(input: ActivityInput): ActivityReport {
  const temperature = scoreTemperature(input.temperatureC);
  const pressure = scorePressure(input.pressureHpa, input.pressureTrend, input.pressureDelta12h);
  const wind = scoreWind(input.windDirection, input.windSpeedKmh);
  const sky = scoreSky(input.cloudCoverPercent, input.rainMm);
  const score = clampScore(
    temperature.score * WEIGHTS.temperature +
      pressure.score * WEIGHTS.pressure +
      wind.score * WEIGHTS.wind +
      sky.score * WEIGHTS.sky
  );

  return {
    score,
    rating: getRating(score),
    recommendation: getRecommendation(pressure),
    insights: [
      { factor: 'Температура', impact: temperature.impact, message: temperature.message },
      { factor: 'Тиск', impact: pressure.impact, message: pressure.message },
      { factor: 'Вітер', impact: wind.impact, message: wind.message },
      { factor: 'Небо', impact: sky.impact, message: sky.message }
    ]
  };
}

export function getActivityBadge(report: ActivityReport): string {
  if (report.rating === 'Excellent') {
    return `🔥 Висока активність (${report.score}%)`;
  }

  if (report.rating === 'Good') {
    return `🟢 Добрі умови (${report.score}%)`;
  }

  if (report.rating === 'Fair') {
    return `🟡 Середні умови (${report.score}%)`;
  }

  return `🔴 Важкі умови (${report.score}%)`;
}
