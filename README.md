# CarpMapper

Offline-first React PWA for carp fishing marker mapping.

## Stack

- React + Vite + TypeScript
- Tailwind CSS with shadcn-style UI primitives
- Zustand persist middleware with LocalStorage
- Mapbox GL JS satellite map
- Turf destination calculation
- Zod validation
- vite-plugin-pwa

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set your Mapbox token:

   ```bash
   VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

## Notes

- The anchor point and markers persist in LocalStorage.
- Marker coordinates are stored as `[lng, lat]` for Mapbox.
- Map visuals use Mapbox sources and layers for anchor, markers, labels, and rays.
- The service worker caches app assets and attempts runtime caching for Mapbox styles and satellite tiles where Mapbox responses allow it.
