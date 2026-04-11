import { lazy, Suspense } from 'react';
import { FishSymbol } from 'lucide-react';
import { useI18n } from '@/config/i18n';
import { AnchorControl } from '@/features/location/components/AnchorControl';
import { AddMarkerForm } from '@/features/markers/components/AddMarkerForm';
import { MarkerList } from '@/features/markers/components/MarkerList';

const MapCanvas = lazy(() =>
  import('@/features/map/components/MapCanvas').then((module) => ({ default: module.MapCanvas }))
);

export default function App() {
  const t = useI18n();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <MapCanvas />
      </Suspense>

      <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-h-[92dvh] overflow-y-auto p-3 md:inset-y-0 md:left-0 md:right-auto md:w-[26rem] md:p-4">
        <div className="pointer-events-auto grid gap-3">
          <header className="rounded-md border border-border bg-background/90 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2">
              <FishSymbol className="h-5 w-5 text-primary" aria-hidden="true" />
              <h1 className="text-lg font-semibold">{t.app.title}</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.app.description}</p>
          </header>

          <AnchorControl />
          <AddMarkerForm />
          <MarkerList />
        </div>
      </aside>
    </main>
  );
}
