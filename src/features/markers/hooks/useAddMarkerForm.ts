import { useState } from 'react';
import { uk } from '@/config/i18n/uk';
import { markerSchema, type MarkerFormValues } from '@/features/markers/markerSchema';
import {
  calculateDistanceFromWraps,
  createDistanceRecommendation,
  getDefaultPegDistanceMeters
} from '@/services/DistanceService';
import { useMapStore } from '@/store';
import type { MarkerDraft, WrapDistance } from '@/types/domain';

type FieldErrors = Partial<Record<keyof MarkerFormValues, string>>;

interface UseAddMarkerFormResult {
  values: MarkerFormValues;
  errors: FieldErrors;
  recommendation: ReturnType<typeof createDistanceRecommendation> | null;
  updateField: <TField extends keyof MarkerFormValues>(
    field: TField,
    value: MarkerFormValues[TField]
  ) => void;
  submit: () => void;
  canSubmit: boolean;
  isEditing: boolean;
  cancelEditing: () => void;
}

function createSchemaInput(values: MarkerFormValues): MarkerFormValues {
  if (values.distanceMode === 'meters') {
    return {
      ...values,
      wraps: values.wraps || '0',
      wrapRemainder: values.wrapRemainder || '0',
      pegDistance: values.pegDistance || String(getDefaultPegDistanceMeters())
    };
  }

  const wrapDistance: WrapDistance = {
    wraps: Number(values.wraps),
    remainderMeters: Number(values.wrapRemainder || 0),
    pegDistanceMeters: Number(values.pegDistance || getDefaultPegDistanceMeters())
  };

  return {
    ...values,
    distance: String(calculateDistanceFromWraps(wrapDistance))
  };
}

export function useAddMarkerForm(): UseAddMarkerFormResult {
  const [errors, setErrors] = useState<FieldErrors>({});
  const anchor = useMapStore((state) => state.anchor);
  const editingMarkerId = useMapStore((state) => state.editingMarkerId);
  const values = useMapStore((state) => state.markerDraft);
  const markerCount = useMapStore((state) => state.markerIds.length);
  const addMarker = useMapStore((state) => state.addMarker);
  const updateMarker = useMapStore((state) => state.updateMarker);
  const setMarkerDraftField = useMapStore((state) => state.setMarkerDraftField);
  const resetMarkerDraft = useMapStore((state) => state.resetMarkerDraft);

  const canSubmit = Boolean(anchor);
  const isEditing = Boolean(editingMarkerId);
  const parsedForRecommendation = markerSchema.safeParse(createSchemaInput(values));
  const recommendation = parsedForRecommendation.success
    ? createDistanceRecommendation(
        parsedForRecommendation.data.distance,
        parsedForRecommendation.data.depth,
        parsedForRecommendation.data.pegDistance
      )
    : null;

  const updateField = <TField extends keyof MarkerFormValues>(
    field: TField,
    value: MarkerFormValues[TField]
  ): void => {
    setMarkerDraftField(field, value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (): void => {
    if (!anchor) {
      setErrors({ distance: uk.markerForm.errors.anchorRequired });
      return;
    }

    const result = markerSchema.safeParse(createSchemaInput(values));

    if (!result.success) {
      const nextErrors: FieldErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string' && field in values) {
          nextErrors[field as keyof MarkerFormValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    const marker: MarkerDraft = {
      name: result.data.name?.trim() || `${uk.markerForm.markerFallback} ${markerCount + 1}`,
      distance: result.data.distance,
      distanceMode: result.data.distanceMode,
      wrapDistance:
        result.data.distanceMode === 'wraps'
          ? {
              wraps: result.data.wraps,
              remainderMeters: result.data.wrapRemainder,
              pegDistanceMeters: result.data.pegDistance
            }
          : null,
      workRodDistance: createDistanceRecommendation(
        result.data.distance,
        result.data.depth,
        result.data.pegDistance
      ).workRodDistanceMeters,
      workRodWraps: createDistanceRecommendation(
        result.data.distance,
        result.data.depth,
        result.data.pegDistance
      ).workRodWraps,
      horizonMarker: result.data.horizonMarker?.trim() ?? '',
      azimuth: result.data.azimuth,
      depth: result.data.depth,
      structure: result.data.structure
    };

    if (editingMarkerId) {
      updateMarker(editingMarkerId, marker);
    } else {
      addMarker(marker);
    }

    resetMarkerDraft();
    setErrors({});
  };

  const cancelEditing = (): void => {
    resetMarkerDraft();
    setErrors({});
  };

  return {
    values,
    errors,
    recommendation,
    updateField,
    submit,
    canSubmit,
    isEditing,
    cancelEditing
  };
}
