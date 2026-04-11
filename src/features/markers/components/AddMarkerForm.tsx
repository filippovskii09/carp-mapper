import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { STRUCTURE_LABELS } from '@/config/constants';
import { useI18n } from '@/config/i18n';
import { useAddMarkerForm } from '@/features/markers/hooks/useAddMarkerForm';
import type { BottomStructure } from '@/types/domain';

const structures: BottomStructure[] = ['mud', 'sand', 'gravel', 'clay', 'weed'];

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}

export function AddMarkerForm() {
  const t = useI18n();
  const { values, errors, updateField, submit, canSubmit, isEditing, cancelEditing } =
    useAddMarkerForm();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submit();
  };

  return (
    <form
      className="rounded-md border border-border bg-background/88 p-4 shadow-xl backdrop-blur"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-sm font-semibold">
          {isEditing ? t.markerForm.editTitle : t.markerForm.addTitle}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t.markerForm.description}</p>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <Label htmlFor="marker-name">{t.markerForm.name}</Label>
          <Input
            id="marker-name"
            placeholder={t.markerForm.namePlaceholder}
            value={String(values.name ?? '')}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="marker-distance">{t.markerForm.distance}</Label>
            <Input
              id="marker-distance"
              inputMode="decimal"
              min={0}
              placeholder="85"
              type="number"
              value={String(values.distance ?? '')}
              onChange={(event) => updateField('distance', event.target.value)}
            />
            <FieldError message={errors.distance} />
          </div>

          <div>
            <Label htmlFor="marker-azimuth">{t.markerForm.azimuth}</Label>
            <Input
              id="marker-azimuth"
              inputMode="decimal"
              max={360}
              min={0}
              placeholder="120"
              type="number"
              value={String(values.azimuth ?? '')}
              onChange={(event) => updateField('azimuth', event.target.value)}
            />
            <FieldError message={errors.azimuth} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="marker-depth">{t.markerForm.depth}</Label>
            <Input
              id="marker-depth"
              inputMode="decimal"
              min={0}
              placeholder="3.2"
              step="0.1"
              type="number"
              value={String(values.depth ?? '')}
              onChange={(event) => updateField('depth', event.target.value)}
            />
            <FieldError message={errors.depth} />
          </div>

          <div>
            <Label htmlFor="marker-structure">{t.markerForm.structure}</Label>
            <Select
              id="marker-structure"
              value={String(values.structure)}
              onChange={(event) => updateField('structure', event.target.value as BottomStructure)}
            >
              {structures.map((structure) => (
                <option key={structure} value={structure}>
                  {STRUCTURE_LABELS[structure]}
                </option>
              ))}
            </Select>
            <FieldError message={errors.structure} />
          </div>
        </div>
      </div>

      <Button className="mt-4 w-full" type="submit" disabled={!canSubmit}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {isEditing ? t.markerForm.update : t.markerForm.save}
      </Button>
      {isEditing ? (
        <Button className="mt-2 w-full" type="button" variant="secondary" onClick={cancelEditing}>
          {t.markerForm.cancelEdit}
        </Button>
      ) : null}
    </form>
  );
}
