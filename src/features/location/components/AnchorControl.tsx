import { Crosshair, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/config/i18n';
import { useGeolocation } from '@/features/location/hooks/useGeolocation';
import { useMapStore } from '@/store';

function formatCoord(value: number): string {
  return value.toFixed(6);
}

export function AnchorControl() {
  const t = useI18n();
  const anchor = useMapStore((state) => state.anchor);
  const isCalibratingAnchor = useMapStore((state) => state.isCalibratingAnchor);
  const isPlacingAnchorManually = useMapStore((state) => state.isPlacingAnchorManually);
  const setAnchor = useMapStore((state) => state.setAnchor);
  const setManualAnchorPlacement = useMapStore((state) => state.setManualAnchorPlacement);
  const { error, isLoading, getCurrentLocation } = useGeolocation();

  const handleSetAnchor = async (): Promise<void> => {
    const location = await getCurrentLocation();
    setAnchor(location);
  };

  return (
    <section className="rounded-md border border-border bg-background/88 p-4 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t.anchor.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.anchor.description}</p>
        </div>
        <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <Button className="mt-4 w-full" onClick={handleSetAnchor} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Crosshair className="h-4 w-4" aria-hidden="true" />
        )}
        {t.anchor.setCurrent}
      </Button>
      <Button
        className="mt-2 w-full"
        type="button"
        variant={isPlacingAnchorManually ? 'secondary' : 'default'}
        onClick={() => setManualAnchorPlacement(!isPlacingAnchorManually)}
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {isPlacingAnchorManually ? t.anchor.cancelManual : t.anchor.setManual}
      </Button>

      {anchor ? (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p className="break-words">
            {formatCoord(anchor.lat)}, {formatCoord(anchor.lng)}
          </p>
          <p className={isCalibratingAnchor || isPlacingAnchorManually ? 'text-primary' : ''}>
            {isPlacingAnchorManually
              ? t.anchor.manualPlacement
              : isCalibratingAnchor
                ? t.anchor.calibrating
                : t.anchor.calibrationHint}
          </p>
        </div>
      ) : (
        <p className={isPlacingAnchorManually ? 'mt-3 text-xs text-primary' : 'mt-3 text-xs text-muted-foreground'}>
          {isPlacingAnchorManually ? t.anchor.manualPlacement : t.anchor.empty}
        </p>
      )}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
