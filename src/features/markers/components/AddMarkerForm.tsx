import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STRUCTURE_LABELS } from '@/config/constants';
import { useI18n } from '@/config/i18n';
import { useAddMarkerForm } from '@/features/markers/hooks/useAddMarkerForm';
import { SUBSTRATE_ADVICE } from '@/features/markers/substrateAdvice';
import type { BottomStructure } from '@/types/domain';

const structures: BottomStructure[] = ['mud', 'sand', 'gravel', 'clay', 'weed'];

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}

export function AddMarkerForm() {
  const t = useI18n();
  const { values, errors, recommendation, updateField, submit, canSubmit, isEditing, cancelEditing } =
    useAddMarkerForm();
  const selectedAdvice = SUBSTRATE_ADVICE[values.structure];

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

        <div>
          <Label>{t.markerForm.distanceMode}</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              className={values.distanceMode === 'meters' ? 'mobile-tab mobile-tab-active' : 'mobile-tab'}
              type="button"
              onClick={() => updateField('distanceMode', 'meters')}
            >
              {t.markerForm.metersMode}
            </button>
            <button
              className={values.distanceMode === 'wraps' ? 'mobile-tab mobile-tab-active' : 'mobile-tab'}
              type="button"
              onClick={() => updateField('distanceMode', 'wraps')}
            >
              {t.markerForm.wrapsMode}
            </button>
          </div>
        </div>

        {values.distanceMode === 'meters' ? (
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
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="marker-wraps">{t.markerForm.wraps}</Label>
                <Input
                  id="marker-wraps"
                  inputMode="decimal"
                  min={0}
                  placeholder="22"
                  type="number"
                  value={String(values.wraps ?? '')}
                  onChange={(event) => updateField('wraps', event.target.value)}
                />
                <FieldError message={errors.wraps} />
              </div>

              <div>
                <Label htmlFor="marker-wrap-remainder">{t.markerForm.wrapRemainder}</Label>
                <Input
                  id="marker-wrap-remainder"
                  inputMode="decimal"
                  min={0}
                  placeholder="1"
                  type="number"
                  value={String(values.wrapRemainder ?? '')}
                  onChange={(event) => updateField('wrapRemainder', event.target.value)}
                />
                <FieldError message={errors.wrapRemainder} />
              </div>

              <div>
                <Label htmlFor="marker-peg-distance">{t.markerForm.pegDistance}</Label>
                <Input
                  id="marker-peg-distance"
                  inputMode="decimal"
                  min={0}
                  placeholder="3.6"
                  step="0.1"
                  type="number"
                  value={String(values.pegDistance ?? '')}
                  onChange={(event) => updateField('pegDistance', event.target.value)}
                />
                <FieldError message={errors.pegDistance} />
              </div>
            </div>

            <div>
              <Label htmlFor="marker-azimuth-wraps">{t.markerForm.azimuth}</Label>
              <Input
                id="marker-azimuth-wraps"
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
        )}

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
            <Label htmlFor="marker-horizon">{t.markerForm.horizonMarker}</Label>
            <Input
              id="marker-horizon"
              placeholder={t.markerForm.horizonPlaceholder}
              value={String(values.horizonMarker ?? '')}
              onChange={(event) => updateField('horizonMarker', event.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>{t.markerForm.structure}</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {structures.map((structure) => (
              <button
                key={structure}
                className={
                  values.structure === structure
                    ? 'substrate-button substrate-button-active'
                    : 'substrate-button'
                }
                type="button"
                onClick={() => updateField('structure', structure)}
              >
                {STRUCTURE_LABELS[structure]}
              </button>
            ))}
          </div>
          <FieldError message={errors.structure} />
        </div>

        <div className="rounded-md border border-border bg-muted/45 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{t.markerForm.tacticalHint}</p>
          <p className="mt-2">
            <span className="text-foreground">{t.markerForm.tactileCue}:</span>{' '}
            {selectedAdvice.tactileCue}
          </p>
          <p className="mt-1">
            <span className="text-foreground">{t.markerForm.rigAdvice}:</span> {selectedAdvice.rig}
          </p>
          <p className="mt-1">
            <span className="text-foreground">{t.markerForm.feedingAdvice}:</span>{' '}
            {selectedAdvice.feeding}
          </p>
        </div>

        {recommendation ? (
          <div className="rounded-md border border-primary/50 bg-primary/10 p-3 text-xs text-foreground">
            <p>
              {t.markerForm.wrapSummary(
                recommendation.markerDistanceMeters,
                recommendation.markerWraps
              )}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t.markerForm.compensationSummary(
                recommendation.compensationMeters,
                recommendation.workRodDistanceMeters,
                recommendation.workRodWraps
              )}
            </p>
          </div>
        ) : null}
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
