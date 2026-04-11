import type { BottomStructure } from '@/types/domain';
import { uk } from '@/config/i18n/uk';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-v9';

export const DEFAULT_MAP_CENTER: [number, number] = [30.5234, 50.4501];

export const DEFAULT_MAP_ZOOM = 16;

export const STRUCTURE_LABELS: Record<BottomStructure, string> = {
  ...uk.bottomStructures
};

export const STRUCTURE_COLORS: Record<BottomStructure, string> = {
  mud: '#7a5133',
  sand: '#e1c75f',
  gravel: '#9da3a6',
  clay: '#b86b4b',
  weed: '#6fa35f'
};
