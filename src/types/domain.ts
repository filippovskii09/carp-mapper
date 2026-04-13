export interface Location {
  lat: number;
  lng: number;
}

export type BottomStructure = 'mud' | 'sand' | 'gravel' | 'clay' | 'weed';

export type DistanceInputMode = 'meters' | 'wraps';

export type PressureTrend = 'falling' | 'rising' | 'steady';

export type ActivityImpact = 'positive' | 'negative' | 'neutral';

export type ActivityRating = 'Excellent' | 'Good' | 'Fair' | 'Tough';

export interface ActivityInsight {
  factor: string;
  impact: ActivityImpact;
  message: string;
}

export interface ActivityReport {
  score: number;
  rating: ActivityRating;
  recommendation: string;
  insights: ActivityInsight[];
}

export interface WeatherSnapshot {
  temperatureC: number;
  pressureHpa: number;
  pressureTrend: PressureTrend;
  pressureDelta12h: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  windDirection: string;
  cloudCoverPercent: number;
  rainMm: number;
  moonPhaseIcon: string;
  moonPhaseLabel: string;
  sunrise: string | null;
  sunset: string | null;
  activityBadge: string;
  activityReport: ActivityReport;
  timestamp: number;
}

export interface WrapDistance {
  wraps: number;
  remainderMeters: number;
  pegDistanceMeters: number;
}

export interface DistanceRecommendation {
  markerDistanceMeters: number;
  markerWraps: number;
  workRodDistanceMeters: number;
  workRodWraps: number;
  compensationMeters: number;
}

export interface FishingMarker {
  id: string;
  name: string;
  distance: number;
  distanceMode: DistanceInputMode;
  wrapDistance: WrapDistance | null;
  workRodDistance: number;
  workRodWraps: number | null;
  horizonMarker: string;
  azimuth: number;
  depth: number;
  structure: BottomStructure;
  weather: WeatherSnapshot | null;
  coords: [number, number];
  timestamp: number;
}

export interface MarkerDraft {
  name: string;
  distance: number;
  distanceMode: DistanceInputMode;
  wrapDistance: WrapDistance | null;
  workRodDistance: number;
  workRodWraps: number | null;
  horizonMarker: string;
  azimuth: number;
  depth: number;
  structure: BottomStructure;
}

export interface MarkerFormDraft {
  name: string;
  distanceMode: DistanceInputMode;
  distance: string;
  wraps: string;
  wrapRemainder: string;
  pegDistance: string;
  azimuth: string;
  depth: string;
  horizonMarker: string;
  structure: BottomStructure;
}

export interface MarkerPreview {
  coords: [number, number];
  distance: number;
  azimuth: number;
  depth: number;
  structure: BottomStructure;
}

export type MarkerEntityMap = Record<string, FishingMarker>;

export interface MapStore {
  anchor: Location | null;
  anchorAccuracy: number | null;
  isCalibratingAnchor: boolean;
  isPlacingAnchorManually: boolean;
  editingMarkerId: string | null;
  markerDraft: MarkerFormDraft;
  markerIds: string[];
  markersById: MarkerEntityMap;
  currentWeather: WeatherSnapshot | null;
  setAnchor: (loc: Location, accuracyMeters?: number | null) => void;
  setAnchorCalibrationState: (isCalibrating: boolean) => void;
  setManualAnchorPlacement: (isPlacing: boolean) => void;
  placeDraftMarker: (loc: Location) => void;
  setWeatherSnapshot: (weather: WeatherSnapshot | null) => void;
  setMarkerDraftField: <TField extends keyof MarkerFormDraft>(
    field: TField,
    value: MarkerFormDraft[TField]
  ) => void;
  resetMarkerDraft: () => void;
  selectMarkerForEditing: (id: string) => void;
  clearMarkerEditing: () => void;
  addMarker: (marker: MarkerDraft) => void;
  updateMarker: (id: string, marker: MarkerDraft) => void;
  deleteMarker: (id: string) => void;
}
