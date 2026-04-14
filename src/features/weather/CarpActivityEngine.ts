import type { ActivityRating, ActivityReport, PressureTrend, Season, WeatherSnapshot } from '@/types/domain';

export interface ActivityInput {
  temperatureC: number;
  waterTempProxyC: number;
  waterTempDelta24h: number;
  pressureHpa: number;
  pressureTrend: PressureTrend;
  pressureDelta24h: number;
  pressureDelta48h: number;
  windDirection: string;
  windDirectionDegrees: number;
  windSpeedKmh: number;
  cloudCoverPercent: number;
  precipitationMm: number;
  moonPhaseAgeDays: number;
  season: Season;
  activeSolunarPeriod: 'major' | 'minor' | null;
  kpIndex: number;
  currentHour: number;
  markerAzimuth?: number;
}

interface BaseScoreResult {
  score: number;
  insights: ActivityReport['insights'];
}

interface MultiplierResult {
  value: number;
  insight: ActivityReport['insights'][number];
}

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

function getTemperatureBaseScore(temperatureC: number): BaseScoreResult {
  if (temperatureC >= 12 && temperatureC <= 18) {
    return {
      score: 100,
      insights: [
        {
          factor: 'Температура',
          impact: 'positive',
          message: `${temperatureC}°C: оптимальний діапазон для активного живлення (+100 базових балів)`
        }
      ]
    };
  }

  if (temperatureC > 18 && temperatureC <= 23) {
    return {
      score: 80,
      insights: [
        {
          factor: 'Температура',
          impact: 'positive',
          message: `${temperatureC}°C: тепла вода, короп активний, але кисень уже важливий (+80 базових балів)`
        }
      ]
    };
  }

  if (temperatureC >= 8 && temperatureC < 12) {
    return {
      score: 70,
      insights: [
        {
          factor: 'Температура',
          impact: 'neutral',
          message: `${temperatureC}°C: прохолодна, але робоча вода для коротких виходів (+70 базових балів)`
        }
      ]
    };
  }

  return {
    score: 30,
    insights: [
      {
        factor: 'Температура',
        impact: 'negative',
        message: `${temperatureC}°C: холодно або перегріто, метаболізм і живлення слабшають (+30 базових балів)`
      }
    ]
  };
}

function getPressureBonus(input: ActivityInput): BaseScoreResult {
  if (input.pressureDelta24h < -3) {
    return {
      score: 20,
      insights: [
        {
          factor: 'Тиск',
          impact: 'positive',
          message: `Тиск падає на ${Math.abs(input.pressureDelta24h)} hPa за 24 год: тригер донного харчування (+20)`
        }
      ]
    };
  }

  if (input.pressureDelta24h > 3) {
    return {
      score: -20,
      insights: [
        {
          factor: 'Тиск',
          impact: 'negative',
          message: `Тиск зростає на ${input.pressureDelta24h} hPa за 24 год: короп може піднятися в товщу води (-20)`
        }
      ]
    };
  }

  if (input.pressureHpa > 1020) {
    return {
      score: -20,
      insights: [
        {
          factor: 'Тиск',
          impact: 'negative',
          message: `Високий тиск ${input.pressureHpa} hPa: риба може триматися вище дна (-20)`
        }
      ]
    };
  }

  if (Math.abs(input.pressureDelta48h) < 2) {
    return {
      score: 10,
      insights: [
        {
          factor: 'Тиск',
          impact: 'positive',
          message: `Стабільний тиск за 48 год (${input.pressureDelta48h} hPa): риба тримає передбачуваний маршрут (+10)`
        }
      ]
    };
  }

  return {
    score: 0,
    insights: [
      {
        factor: 'Тиск',
        impact: 'neutral',
        message: `Тиск у перехідній фазі (${input.pressureDelta24h} hPa за 24 год): без сильного бонусу`
      }
    ]
  };
}

function calculateBaseScore(input: ActivityInput): BaseScoreResult {
  const temperature = getTemperatureBaseScore(input.waterTempProxyC);
  const pressure = getPressureBonus(input);

  return {
    score: clampScore(temperature.score + pressure.score),
    insights: [...temperature.insights, ...pressure.insights]
  };
}

function getBiologicalBlocker(input: ActivityInput): ActivityReport | null {
  if (input.season === 'summer' && input.waterTempProxyC > 25 && input.windSpeedKmh < 5) {
    return {
      score: 15,
      rating: 'Tough',
      recommendation: 'Критично низький рівень кисню. Донна ловля майже неефективна: шукайте поверхню, тінь, приплив кисню або нічне вікно.',
      blocker: 'hypoxia',
      insights: [
        {
          factor: 'Блокер',
          impact: 'negative',
          message: 'Критично низький рівень кисню. Риба в комі або на поверхні. Ловля на дні неефективна.'
        },
        {
          factor: 'Статус водойми',
          impact: 'negative',
          message: `WTP ${input.waterTempProxyC}°C і вітер ${input.windSpeedKmh} км/г: перегріта вода без хвилі не тримає кисень`
        }
      ]
    };
  }

  if (
    (input.season === 'autumn' || input.season === 'spring') &&
    input.waterTempDelta24h < -4
  ) {
    return {
      score: 20,
      rating: 'Tough',
      recommendation: 'Температурний шок. Зменшіть корм, шукайте найстабільніші глибші ділянки і короткі вікна активності.',
      blocker: 'temperature-shock',
      insights: [
        {
          factor: 'Блокер',
          impact: 'negative',
          message: 'Температурний шок. Риба заціпеніла через різке похолодання.'
        },
        {
          factor: 'Статус водойми',
          impact: 'negative',
          message: `WTP впала на ${Math.abs(input.waterTempDelta24h)}°C за 24 год: короп економить енергію`
        }
      ]
    };
  }

  return null;
}

function getWindDirectionMultiplier(input: ActivityInput): MultiplierResult {
  const warmWind = input.windDirection === 'S' || input.windDirection === 'SW' || input.windDirection === 'W';
  const coldWind = input.windDirection === 'N' || input.windDirection === 'E' || input.windDirection === 'NE';

  if (warmWind) {
    return {
      value: 1.1,
      insight: {
        factor: 'Напрям вітру',
        impact: 'positive',
        message: `${input.windDirection} вітер приносить теплішу, кисневу воду (+10%)`
      }
    };
  }

  if (coldWind && input.waterTempProxyC > 22 && input.windSpeedKmh >= 10 && input.windSpeedKmh <= 25) {
    return {
      value: 1.1,
      insight: {
        factor: 'Напрям вітру',
        impact: 'positive',
        message: `${input.windDirection} вітер охолоджує перегріту воду і вносить кисень (+10%)`
      }
    };
  }

  if (coldWind && input.season === 'summer') {
    return {
      value: 1,
      insight: {
        factor: 'Напрям вітру',
        impact: 'neutral',
        message: `${input.windDirection} вітер влітку без спеки не дає сильного ефекту (0%)`
      }
    };
  }

  if (coldWind && (input.season === 'spring' || input.season === 'winter' || input.season === 'autumn')) {
    return {
      value: 0.8,
      insight: {
        factor: 'Напрям вітру',
        impact: 'negative',
        message: `${input.windDirection} вітер у прохолодний сезон зупиняє прогрів води і гасить живлення (-20%)`
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Напрям вітру',
      impact: 'neutral',
      message: `${input.windDirection} вітер без сильного сезонного ефекту (0%)`
    }
  };
}

function getSpatialWindMultiplier(input: ActivityInput): MultiplierResult {
  if (input.markerAzimuth === undefined) {
    return {
      value: 1,
      insight: {
        factor: 'Простір',
        impact: 'neutral',
        message: 'Розрахунок для водойми в цілому: оберіть конкретну мітку, щоб оцінити вітер відносно закиду (0%)'
      }
    };
  }

  const normalizedAzimuth = ((input.markerAzimuth % 360) + 360) % 360;
  let angleDiff = Math.abs(input.windDirectionDegrees - normalizedAzimuth);

  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }

  if (angleDiff <= 45) {
    return {
      value: 1.3,
      insight: {
        factor: 'Вектор закиду',
        impact: 'positive',
        message: 'Вітер в обличчя (Прибійний берег). Хвиля несе природний корм прямо на вашу точку (+30%).'
      }
    };
  }

  if (angleDiff >= 135) {
    return {
      value: 0.8,
      insight: {
        factor: 'Вектор закиду',
        impact: 'negative',
        message: 'Вітер у спину. Риба швидше за все відійшла за вітром до протилежного берега (-20%).'
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Вектор закиду',
      impact: 'neutral',
      message: `Боковий вітер відносно закиду (${Math.round(angleDiff)}°): без сильного просторового множника (0%)`
    }
  };
}

function getWindSpeedMultiplier(windSpeedKmh: number): MultiplierResult {
  if (windSpeedKmh >= 10 && windSpeedKmh <= 25) {
    return {
      value: 1.15,
      insight: {
        factor: 'Сила вітру',
        impact: 'positive',
        message: `${windSpeedKmh} км/г створює правильну хвилю та додає кисень (+15%)`
      }
    };
  }

  if (windSpeedKmh < 5) {
    return {
      value: 0.9,
      insight: {
        factor: 'Сила вітру',
        impact: 'negative',
        message: `${windSpeedKmh} км/г: штиль робить рибу обережнішою (-10%)`
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Сила вітру',
      impact: 'neutral',
      message: `${windSpeedKmh} км/г: робоча швидкість без додаткового множника (0%)`
    }
  };
}

function getDiurnalOxygenMultiplier(input: ActivityInput): MultiplierResult {
  if (input.season !== 'summer' || input.waterTempProxyC <= 22) {
    return {
      value: 1,
      insight: {
        factor: 'Кисень',
        impact: 'neutral',
        message: 'Добовий кисневий цикл не є критичним для поточної температури води (0%)'
      }
    };
  }

  if (input.currentHour >= 4 && input.currentHour < 8) {
    return {
      value: 0.85,
      insight: {
        factor: 'Кисень',
        impact: 'negative',
        message: 'Ранковий дефіцит кисню. Водорості за ніч спожили кисень, активність риби низька.'
      }
    };
  }

  if (input.currentHour >= 16 && input.currentHour < 20) {
    return {
      value: 1.15,
      insight: {
        factor: 'Кисень',
        impact: 'positive',
        message: 'Максимум кисню. Завдяки денному фотосинтезу вода збагачена киснем, риба активізується.'
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Кисень',
      impact: 'neutral',
      message: 'Тепла вода потребує контролю кисню, але зараз не пікове ранкове або вечірнє вікно (0%)'
    }
  };
}

function getGeomagneticMultiplier(kpIndex: number): MultiplierResult {
  if (kpIndex >= 5) {
    return {
      value: 0.6,
      insight: {
        factor: 'Магнітна буря',
        impact: 'negative',
        message: 'Сильна магнітна буря (Kp >= 5). У риби збита орієнтація, харчова активність пригнічена.'
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Магнітне поле',
      impact: 'neutral',
      message: `Kp ${kpIndex}: геомагнітний фон без сильного впливу на орієнтацію риби (0%)`
    }
  };
}

function getLightMultiplier(cloudCoverPercent: number, precipitationMm: number): MultiplierResult {
  if (cloudCoverPercent > 60 || (precipitationMm > 0 && precipitationMm < 2)) {
    return {
      value: 1.1,
      insight: {
        factor: 'Світло',
        impact: 'positive',
        message: `Хмарність ${cloudCoverPercent}% або слабкі опади ${precipitationMm} мм знижують видимість (+10%)`
      }
    };
  }

  if (cloudCoverPercent < 20) {
    return {
      value: 0.85,
      insight: {
        factor: 'Світло',
        impact: 'negative',
        message: `Ясне небо (${cloudCoverPercent}%) робить рибу обережною на мілководді (-15%)`
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Світло',
      impact: 'neutral',
      message: `Хмарність ${cloudCoverPercent}% дає нейтральне освітлення (0%)`
    }
  };
}

function getMoonMultiplier(moonPhaseAgeDays: number): MultiplierResult {
  const isNewMoonWindow = moonPhaseAgeDays <= 2 || moonPhaseAgeDays >= 27.53;
  const isFullMoonWindow = Math.abs(moonPhaseAgeDays - 14.77) <= 2;

  if (isNewMoonWindow) {
    return {
      value: 1.1,
      insight: {
        factor: 'Місяць',
        impact: 'positive',
        message: 'Новий місяць: темна ніч додає впевненості нічному харчуванню (+10%)'
      }
    };
  }

  if (isFullMoonWindow) {
    return {
      value: 0.9,
      insight: {
        factor: 'Місяць',
        impact: 'negative',
        message: 'Повня: яскраві ночі можуть робити рибу обережнішою (-10%)'
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Місяць',
      impact: 'neutral',
      message: 'Фаза місяця без сильного множника для поточних умов (0%)'
    }
  };
}

function getSolunarMultiplier(activeSolunarPeriod: 'major' | 'minor' | null): MultiplierResult {
  if (activeSolunarPeriod === 'major') {
    return {
      value: 1.25,
      insight: {
        factor: 'Solunar',
        impact: 'positive',
        message: 'Активне Major-вікно: місячний пік може різко підсилити короткий вихід (+25%)'
      }
    };
  }

  if (activeSolunarPeriod === 'minor') {
    return {
      value: 1.15,
      insight: {
        factor: 'Solunar',
        impact: 'positive',
        message: 'Активне Minor-вікно: короткий період підвищеної активності (+15%)'
      }
    };
  }

  return {
    value: 1,
    insight: {
      factor: 'Solunar',
      impact: 'neutral',
      message: 'Зараз поза Major/Minor вікном, Solunar не підсилює оцінку (0%)'
    }
  };
}

function getRecommendation(input: ActivityInput): string {
  if (input.pressureDelta48h > 5 && input.pressureHpa > 1018) {
    return 'Післяфронтальний шок: різке зростання тиску після шторму. Зменшіть корм і шукайте короткі виходи біля укриттів.';
  }

  if (input.pressureHpa > 1020 || input.pressureTrend === 'rising') {
    return 'Високий тиск: риба піднімається в товщу води. Спробуйте Zig-Rig або ловіть на мілководді.';
  }

  if (input.season === 'summer' && input.waterTempProxyC > 24) {
    return 'Вода перегріта, низький рівень кисню. Шукайте рибу в тіні дерев, водоростях або ловіть вночі.';
  }

  if (input.pressureTrend === 'falling' && input.pressureHpa < 1012) {
    return 'Тиск падає! Ідеальний час для донного харчування. Фокус на гравій та мул, використовуйте донні монтажі.';
  }

  if (input.windSpeedKmh > 15 && (input.windDirection === 'S' || input.windDirection === 'SW')) {
    return 'Сильний теплий вітер! Риба буде рухатися за вітром до берега. Ловіть на прибійному березі.';
  }

  return 'Стабільні умови. Шукайте природні маршрути риби: бровки, переходи з мулу на тверде дно.';
}

export function calculateCarpActivity(input: ActivityInput): ActivityReport {
  const blocker = getBiologicalBlocker(input);

  if (blocker) {
    return blocker;
  }

  const baseScore = calculateBaseScore(input);
  const multipliers = [
    getWindDirectionMultiplier(input),
    getSpatialWindMultiplier(input),
    getWindSpeedMultiplier(input.windSpeedKmh),
    getLightMultiplier(input.cloudCoverPercent, input.precipitationMm),
    getMoonMultiplier(input.moonPhaseAgeDays),
    getSolunarMultiplier(input.activeSolunarPeriod),
    getDiurnalOxygenMultiplier(input),
    getGeomagneticMultiplier(input.kpIndex)
  ];
  const multiplier = multipliers.reduce((total, item) => total * item.value, 1);
  const uncappedScore = clampScore(baseScore.score * multiplier);
  const isPostFrontalLockjaw = input.pressureDelta48h > 5 && input.pressureHpa > 1018;
  const score = isPostFrontalLockjaw ? Math.min(uncappedScore, 35) : uncappedScore;
  const postFrontalInsight: ActivityReport['insights'][number] | null = isPostFrontalLockjaw
    ? {
        factor: 'Фронт',
        impact: 'negative',
        message: 'Післяфронтальний шок. Різке зростання тиску після шторму. Риба в стані ступору (Lockjaw).'
      }
    : null;

  return {
    score,
    rating: getRating(score),
    recommendation: getRecommendation(input),
    blocker: isPostFrontalLockjaw ? 'post-frontal-lockjaw' : null,
    insights: [
      ...baseScore.insights,
      ...multipliers.map((item) => item.insight),
      ...(postFrontalInsight ? [postFrontalInsight] : [])
    ]
  };
}

export function calculateMarkerActivity(weather: WeatherSnapshot, markerAzimuth: number): ActivityReport {
  return calculateCarpActivity({
    temperatureC: weather.temperatureC,
    waterTempProxyC: weather.waterTempProxyC,
    waterTempDelta24h: weather.waterTempDelta24h,
    pressureHpa: weather.pressureHpa,
    pressureTrend: weather.pressureTrend,
    pressureDelta24h: weather.pressureDelta24h,
    pressureDelta48h: weather.pressureDelta48h,
    windDirection: weather.windDirection,
    windDirectionDegrees: weather.windDirectionDegrees,
    windSpeedKmh: weather.windSpeedKmh,
    cloudCoverPercent: weather.cloudCoverPercent,
    precipitationMm: weather.precipitationMm,
    moonPhaseAgeDays: weather.moonPhaseAgeDays,
    season: weather.season,
    activeSolunarPeriod: weather.activeSolunarPeriod,
    kpIndex: weather.kpIndex,
    currentHour: new Date(weather.timestamp).getHours(),
    markerAzimuth
  });
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
