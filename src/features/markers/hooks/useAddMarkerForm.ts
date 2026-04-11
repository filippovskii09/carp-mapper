import { useState } from 'react';
import { uk } from '@/config/i18n/uk';
import { markerSchema, type MarkerFormValues } from '@/features/markers/markerSchema';
import { useMapStore } from '@/store';
import type { MarkerDraft } from '@/types/domain';

type FieldErrors = Partial<Record<keyof MarkerFormValues, string>>;

interface UseAddMarkerFormResult {
  values: MarkerFormValues;
  errors: FieldErrors;
  updateField: <TField extends keyof MarkerFormValues>(
    field: TField,
    value: MarkerFormValues[TField]
  ) => void;
  submit: () => void;
  canSubmit: boolean;
  isEditing: boolean;
  cancelEditing: () => void;
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

    const result = markerSchema.safeParse(values);

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

  return { values, errors, updateField, submit, canSubmit, isEditing, cancelEditing };
}
