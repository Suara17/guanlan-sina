export type StatusType = 'running' | 'idle' | 'error';

export interface Station {
  id: string;
  name: string;
  type: string;
  status: StatusType;
  cycleTime: number; // seconds
  position: number; // order in line
}

export interface WorkshopLine {
  id: string;
  name: string;
  type: string;
  status: StatusType;
  oee: number;
  currentOrder: string;
  stations: Station[];
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface Workshop {
  id: string;
  name: string;
  status: StatusType;
  lines: WorkshopLine[];
  gridPos: GridPosition;
}

export interface Factory {
  id: string;
  name: string;
  position: [number, number, number]; // Position in global map
  workshops: Workshop[];
  status: StatusType;
}

export type GLOBAL_DATA = Factory[];

// Mock Data Generator
export const generateMockData = (): GLOBAL_DATA => {
  const factoryLocations = [
    { name: 'Beijing Plant', pos: [-30, 0, 0] },
    { name: 'Tianjin Plant', pos: [0, 0, 0] },
    { name: 'Hangzhou Plant', pos: [30, 0, 0] }
  ];
  
  const workshopTypes = ['SMT Workshop', 'PCB Workshop', '3C Assembly'];
  const lineTypes = ['Standard Line', 'High-Speed Line', 'Flexible Line'];
  const stationTypes = [
    'Loader',
    'Printer',
    'SPI',
    'Pick & Place',
    'Reflow Oven',
    'AOI',
    'Unloader',
  ];

  return factoryLocations.map((loc, fIndex) => {
    const workshops: Workshop[] = [];
    
    for (let i = 0; i < 3; i++) {
      const lines: WorkshopLine[] = [];
      for (let j = 0; j < 3; j++) {
        const stations: Station[] = [];
        for (let k = 0; k < 7; k++) {
          stations.push({
            id: `s-${fIndex}-${i}-${j}-${k}`,
            name: `${stationTypes[k]} ${k + 1}`,
            type: stationTypes[k],
            status: Math.random() > 0.8 ? 'error' : Math.random() > 0.6 ? 'idle' : 'running',
            cycleTime: 30 + Math.random() * 10,
            position: k,
          });
        }
        lines.push({
          id: `l-${fIndex}-${i}-${j}`,
          name: `Line ${j + 1}`,
          type: lineTypes[i],
          status: stations.some((s) => s.status === 'error')
            ? 'error'
            : stations.some((s) => s.status === 'running')
            ? 'running'
            : 'idle',
          oee: 85 + Math.random() * 10,
          currentOrder: `ORD-${Math.floor(Math.random() * 10000)}`,
          stations,
        });
      }
      workshops.push({
        id: `w-${fIndex}-${i}`,
        name: workshopTypes[i],
        status: lines.some((l) => l.status === 'error')
          ? 'error'
          : lines.some((l) => l.status === 'running')
          ? 'running'
          : 'idle',
        lines,
        gridPos: { x: (i - 1) * 25, y: 0 }, // Centered grid: -25, 0, 25
      });
    }

    return {
      id: `f-${fIndex}`,
      name: loc.name,
      position: loc.pos as [number, number, number],
      workshops,
      status: workshops.some(w => w.status === 'error') ? 'error' : 'running'
    };
  });
};

export const MOCK_DATA = generateMockData();
