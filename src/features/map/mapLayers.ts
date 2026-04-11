import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification
} from 'mapbox-gl';

function structureColorExpression(): ExpressionSpecification {
  return [
    'match',
    ['get', 'structure'],
    'mud',
    '#7a5133',
    'sand',
    '#e1c75f',
    'gravel',
    '#9da3a6',
    'clay',
    '#b86b4b',
    'weed',
    '#6fa35f',
    '#f4efe1'
  ];
}

export const anchorLayer: CircleLayerSpecification = {
  id: 'anchor-layer',
  type: 'circle',
  source: 'anchor-source',
  paint: {
    'circle-radius': 10,
    'circle-color': '#f4efe1',
    'circle-stroke-color': '#11140f',
    'circle-stroke-width': 3
  }
};

export const anchorAccuracyLayer: FillLayerSpecification = {
  id: 'anchor-accuracy-layer',
  type: 'fill',
  source: 'anchor-accuracy-source',
  paint: {
    'fill-color': '#f4efe1',
    'fill-opacity': 0.16,
    'fill-outline-color': '#f4efe1'
  }
};

export const markerLayer: CircleLayerSpecification = {
  id: 'marker-layer',
  type: 'circle',
  source: 'marker-source',
  paint: {
    'circle-radius': 8,
    'circle-color': structureColorExpression(),
    'circle-stroke-color': '#11140f',
    'circle-stroke-width': 2
  }
};

export const markerLabelLayer: SymbolLayerSpecification = {
  id: 'marker-label-layer',
  type: 'symbol',
  source: 'marker-source',
  layout: {
    'text-field': ['get', 'label'],
    'text-offset': [0, 1.25],
    'text-size': 12,
    'text-anchor': 'top',
    'text-allow-overlap': false
  },
  paint: {
    'text-color': '#f4efe1',
    'text-halo-color': '#11140f',
    'text-halo-width': 1.5
  }
};

export const previewMarkerLayer: CircleLayerSpecification = {
  id: 'preview-marker-layer',
  type: 'circle',
  source: 'preview-marker-source',
  paint: {
    'circle-radius': 7,
    'circle-color': structureColorExpression(),
    'circle-opacity': 0.72,
    'circle-stroke-color': '#f4efe1',
    'circle-stroke-width': 2
  }
};

export const previewMarkerLabelLayer: SymbolLayerSpecification = {
  id: 'preview-marker-label-layer',
  type: 'symbol',
  source: 'preview-marker-source',
  layout: {
    'text-field': ['get', 'label'],
    'text-offset': [0, 1.25],
    'text-size': 12,
    'text-anchor': 'top',
    'text-allow-overlap': false
  },
  paint: {
    'text-color': '#f4efe1',
    'text-halo-color': '#11140f',
    'text-halo-width': 1.5,
    'text-opacity': 0.86
  }
};

export const rayLayer: LineLayerSpecification = {
  id: 'ray-layer',
  type: 'line',
  source: 'ray-source',
  paint: {
    'line-color': structureColorExpression(),
    'line-width': 3,
    'line-opacity': 0.55
  }
};

export const previewRayLayer: LineLayerSpecification = {
  id: 'preview-ray-layer',
  type: 'line',
  source: 'preview-ray-source',
  paint: {
    'line-color': structureColorExpression(),
    'line-width': 3,
    'line-opacity': 0.75,
    'line-dasharray': [1.2, 1.2]
  }
};
