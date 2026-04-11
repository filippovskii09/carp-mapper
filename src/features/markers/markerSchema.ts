import { z } from 'zod';
import { uk } from '@/config/i18n/uk';
import type { BottomStructure } from '@/types/domain';

export interface MarkerFormValues {
  name: string;
  distance: string;
  azimuth: string;
  depth: string;
  structure: BottomStructure;
}

export const markerSchema = z.object({
  name: z.string().trim().max(48, uk.markerForm.errors.nameMax).optional(),
  distance: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.distanceNumber })
    .positive(uk.markerForm.errors.distancePositive)
    .max(1000, uk.markerForm.errors.distanceMax),
  azimuth: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.azimuthNumber })
    .min(0, uk.markerForm.errors.azimuthMin)
    .max(360, uk.markerForm.errors.azimuthMax),
  depth: z.coerce
    .number({ invalid_type_error: uk.markerForm.errors.depthNumber })
    .min(0, uk.markerForm.errors.depthMin)
    .max(60, uk.markerForm.errors.depthMax),
  structure: z.enum(['mud', 'sand', 'gravel', 'clay', 'weed'])
});

export type ParsedMarkerFormValues = z.output<typeof markerSchema>;
