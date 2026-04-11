import { lazy, Suspense, useState } from 'react';
import { FishSymbol, List, MapPin, Plus } from 'lucide-react';
import { useI18n } from '@/config/i18n';
import { AnchorControl } from '@/features/location/components/AnchorControl';
import { AddMarkerForm } from '@/features/markers/components/AddMarkerForm';
import { MarkerList } from '@/features/markers/components/MarkerList';

type MobilePanel = 'anchor' | 'marker' | 'list';

const MapCanvas = lazy(() =>
  import('@/features/map/components/MapCanvas').then((module) => ({ default: module.MapCanvas }))
);

function AppHeader() {
  const t = useI18n();

  return (
    <header className="rounded-md border border-border bg-background/90 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2">
        <FishSymbol className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-semibold">{t.app.title}</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t.app.description}</p>
    </header>
  );
}

function MobilePanelContent({ activePanel }: { activePanel: MobilePanel }) {
  if (activePanel === 'anchor') {
    return <AnchorControl />;
  }

  if (activePanel === 'marker') {
    return <AddMarkerForm />;
  }

  return <MarkerList />;
}

export default function App() {
  const t = useI18n();
  const [activePanel, setActivePanel] = useState<MobilePanel>('anchor');
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const mobileTabs = [
    { id: 'anchor' as const, label: t.app.panels.anchor, icon: MapPin },
    { id: 'marker' as const, label: t.app.panels.marker, icon: Plus },
    { id: 'list' as const, label: t.app.panels.list, icon: List }
  ];

  return (
    <main className="app-shell relative overflow-hidden bg-background">
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <MapCanvas />
      </Suspense>

      <aside className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[26rem] overflow-y-auto p-4 md:block">
        <div className="pointer-events-auto grid gap-3">
          <AppHeader />
          <AnchorControl />
          <AddMarkerForm />
          <MarkerList />
        </div>
      </aside>

      <aside
        className={
          isSheetExpanded
            ? 'mobile-sheet mobile-sheet-expanded md:hidden'
            : 'mobile-sheet mobile-sheet-compact md:hidden'
        }
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
        <button
          className="mt-2 w-full rounded-md px-3 py-2 text-center text-sm font-medium text-muted-foreground"
          type="button"
          onClick={() => setIsSheetExpanded((current) => !current)}
          aria-expanded={isSheetExpanded}
          aria-label={isSheetExpanded ? t.app.sheet.collapse : t.app.sheet.expand}
        >
          {t.app.title}
        </button>

        <nav className="mt-2 grid grid-cols-3 gap-2" aria-label="Основні дії">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.id;

            return (
              <button
                key={tab.id}
                className={
                  isActive
                    ? 'mobile-tab mobile-tab-active'
                    : 'mobile-tab'
                }
                type="button"
                onClick={() => {
                  setActivePanel(tab.id);
                  setIsSheetExpanded(true);
                }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-3 overflow-y-auto pb-2">
          <MobilePanelContent activePanel={activePanel} />
        </div>
      </aside>
    </main>
  );
}
