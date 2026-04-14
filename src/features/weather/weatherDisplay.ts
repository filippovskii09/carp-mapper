import type { ActivityImpact, ActivityRating, PressureTrend, WaterStatus } from '@/types/domain';

export function getTrendArrow(trend: PressureTrend): string {
  if (trend === 'falling') {
    return '↓';
  }

  if (trend === 'rising') {
    return '↑';
  }

  return '→';
}

export function getImpactIcon(impact: ActivityImpact): string {
  if (impact === 'positive') {
    return '🟢';
  }

  if (impact === 'negative') {
    return '🔴';
  }

  return '🟡';
}

export function getRatingLabel(rating: ActivityRating): string {
  if (rating === 'Excellent') {
    return 'Відмінно';
  }

  if (rating === 'Good') {
    return 'Добре';
  }

  if (rating === 'Fair') {
    return 'Середньо';
  }

  return 'Важко';
}

export function getWaterStatusLabel(status: WaterStatus): string {
  if (status === 'warming') {
    return 'Прогрівається';
  }

  if (status === 'cooling') {
    return 'Остигає';
  }

  if (status === 'overheated') {
    return 'Перегріта';
  }

  return 'Стабільна';
}
