/**
 * ArenaAI 2026 - Interactive Stadium Map Data & Configuration
 * Provides coordinates, labels, capacities, and live telemetry for stadium areas.
 */

export const STADIUM_SECTORS = [
  { id: 'sec101', name: 'Sector 101', type: 'Lower Bowl', angleStart: 0, angleEnd: 30, crowdDensity: 45, restroomWait: 2, concessionWait: 5, accessible: true },
  { id: 'sec102', name: 'Sector 102', type: 'Lower Bowl', angleStart: 30, angleEnd: 60, crowdDensity: 75, restroomWait: 6, concessionWait: 12, accessible: true },
  { id: 'sec103', name: 'Sector 103 (First Aid)', type: 'Lower Bowl (East)', angleStart: 60, angleEnd: 90, crowdDensity: 88, restroomWait: 11, concessionWait: 18, accessible: true, notes: 'First Aid Post A' },
  { id: 'sec104', name: 'Sector 104', type: 'Lower Bowl', angleStart: 90, angleEnd: 120, crowdDensity: 92, restroomWait: 15, concessionWait: 22, accessible: false, notes: 'Concession congestion near Gate A' },
  { id: 'sec105', name: 'Sector 105', type: 'Lower Bowl', angleStart: 120, angleEnd: 150, crowdDensity: 60, restroomWait: 4, concessionWait: 8, accessible: true },
  { id: 'sec106', name: 'Sector 106', type: 'Lower Bowl', angleStart: 150, angleEnd: 180, crowdDensity: 40, restroomWait: 2, concessionWait: 4, accessible: true },
  { id: 'sec107', name: 'Sector 107', type: 'Lower Bowl', angleStart: 180, angleEnd: 210, crowdDensity: 55, restroomWait: 3, concessionWait: 7, accessible: true },
  { id: 'sec108', name: 'Sector 108', type: 'Lower Bowl', angleStart: 210, angleEnd: 240, crowdDensity: 82, restroomWait: 9, concessionWait: 15, accessible: true, notes: 'Close to Gate C elevator' },
  { id: 'sec109', name: 'Sector 109', type: 'Lower Bowl', angleStart: 240, angleEnd: 270, crowdDensity: 30, restroomWait: 1, concessionWait: 3, accessible: true },
  { id: 'sec110', name: 'Sector 110', type: 'Lower Bowl', angleStart: 270, angleEnd: 300, crowdDensity: 35, restroomWait: 2, concessionWait: 4, accessible: true },
  { id: 'sec111', name: 'Sector 111', type: 'Lower Bowl', angleStart: 300, angleEnd: 330, crowdDensity: 70, restroomWait: 5, concessionWait: 10, accessible: true },
  { id: 'sec112', name: 'Sector 112 (Green Hub)', type: 'Lower Bowl (North)', angleStart: 330, angleEnd: 360, crowdDensity: 80, restroomWait: 8, concessionWait: 14, accessible: true, notes: 'Main Green Waste Sorting Center' }
];

export const GATES = [
  { id: 'gateA', name: 'Gate A (Metro Access)', x: 380, y: 200, status: 'CONGESTED', waitTime: 18, type: 'public-transit', accessible: true },
  { id: 'gateB', name: 'Gate B (Bus Shuttle Plaza)', x: 300, y: 360, status: 'NORMAL', waitTime: 3, type: 'shuttle-bus', accessible: true },
  { id: 'gateC', name: 'Gate C (Accessibility Hub)', x: 100, y: 320, status: 'NORMAL', waitTime: 2, type: 'step-free-elevator', accessible: true },
  { id: 'gateD', name: 'Gate D (VIP Entry)', x: 50, y: 200, status: 'NORMAL', waitTime: 1, type: 'vip', accessible: true },
  { id: 'gateE', name: 'Gate E (Parking Lot)', x: 100, y: 80, status: 'NORMAL', waitTime: 4, type: 'parking', accessible: false },
  { id: 'gateF', name: 'Gate F (Rideshare Dropoff)', x: 300, y: 40, status: 'NORMAL', waitTime: 5, type: 'rideshare', accessible: true }
];

export const ELEVATORS_FIRST_AID = [
  { id: 'elev1', name: 'Elevator 1 (Gate C)', x: 120, y: 270, type: 'elevator', status: 'ACTIVE', desc: 'Provides direct access to Sector 107-109 wheelchair platforms.' },
  { id: 'elev2', name: 'Elevator 2 (Gate A)', x: 350, y: 230, type: 'elevator', status: 'CONGESTED', desc: 'Concourse level elevator. High queue during exit rushes.' },
  { id: 'aid1', name: 'First Aid (Sector 103)', x: 280, y: 280, type: 'firstaid', status: 'ACTIVE', desc: 'Fully staffed medical center, equipped for hydration recovery.' },
  { id: 'aid2', name: 'First Aid (Sector 215)', x: 140, y: 110, type: 'firstaid', status: 'ACTIVE', desc: 'Upper tier first-aid satellite post.' }
];

export const TRANSPORT_STATUS = {
  metro: { line1: 'Running every 2 mins - High crowd at station entrance.', line2: 'Running every 4 mins - Normal capacity.' },
  shuttles: { downtown: '5 min boarding delay. Shuttles departing continuously from Gate B.', airport: 'Normal boarding. Gate B.' },
  rideshare: { zone4: 'High demand - Average wait time 12 mins. Walking path via Gate F.' }
};

/**
 * Maps density percentage to colors conforming to AA accessibility contrast guidelines
 * Green (safe): #00a85a (on dark indigo)
 * Amber (moderate): #f59e0b
 * Red (congested): #ef4444
 */
export function getDensityColor(density) {
  if (density < 50) return '#00a85a'; // Green
  if (density < 80) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

/**
 * Calculates SVG arc coordinates for sectors (donut chart style rendering)
 */
export function describeSectorArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  const startRad = ((startAngle - 90) * Math.PI) / 180.0;
  const endRad = ((endAngle - 90) * Math.PI) / 180.0;

  const xInnerStart = x + innerRadius * Math.cos(startRad);
  const yInnerStart = y + innerRadius * Math.sin(startRad);
  const xInnerEnd = x + innerRadius * Math.cos(endRad);
  const yInnerEnd = y + innerRadius * Math.sin(endRad);

  const xOuterStart = x + outerRadius * Math.cos(startRad);
  const yOuterStart = y + outerRadius * Math.sin(startRad);
  const xOuterEnd = x + outerRadius * Math.cos(endRad);
  const yOuterEnd = y + outerRadius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${xOuterStart} ${yOuterStart}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${xOuterEnd} ${yOuterEnd}`,
    `L ${xInnerEnd} ${yInnerEnd}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${xInnerStart} ${yInnerStart}`,
    `Z`
  ].join(' ');
}
