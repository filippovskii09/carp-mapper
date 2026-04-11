import { z } from 'zod';
import { uk } from '@/config/i18n/uk';
import type { BottomStructure } from '@/types/domain';

export interface MarkerFormValues {
  name: string;
  distanceMode: 'meters' | 'wraps';
  distance: string;
  wraps: string;
  wrapRemainder: string;
  pegDistance: string;
  azimuth: string;
  depth: string;
  horizonMarker: string;
  structure: BottomStructure;
}

export const markerSchema = z.object({
  name: z.string().trim().max(48, uk.markerForm.errors.nameMax).optional(),
  distanceMode: z.enum(['meters', 'wraps']),
  distance: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.distanceNumber })
    .positive(uk.markerForm.errors.distancePositive)
    .max(1000, uk.markerForm.errors.distanceMax),
  wraps: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.wrapsNumber })
    .min(0, uk.markerForm.errors.wrapsMin)
    .max(300, uk.markerForm.errors.wrapsMax),
  wrapRemainder: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.wrapRemainderNumber })
    .min(0, uk.markerForm.errors.wrapRemainderMin),
  pegDistance: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.pegDistanceNumber })
    .positive(uk.markerForm.errors.pegDistancePositive),
  azimuth: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.azimuthNumber })
    .min(0, uk.markerForm.errors.azimuthMin)
    .max(360, uk.markerForm.errors.azimuthMax),
  depth: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.depthNumber })
    .min(0, uk.markerForm.errors.depthMin)
    .max(60, uk.markerForm.errors.depthMax),
  horizonMarker: z.string().trim().max(96).optional(),
  structure: z.enum(['mud', 'sand', 'gravel', 'clay', 'weed'])
});

export type ParsedMarkerFormValues = z.output<typeof markerSchema>;
