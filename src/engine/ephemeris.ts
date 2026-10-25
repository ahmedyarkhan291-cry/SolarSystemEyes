/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * High-precision Keplerian orbital mechanics and ephemeris calculation engine.
 * Computes 3D Cartesian coordinates, true anomalies, orbital velocities,
 * and light travel times for any astronomical epoch.
 */

import { OrbitalElements, CelestialBody, CELESTIAL_BODIES } from '../data/celestialBodies';

export const J2000_JD = 2451545.0; // 2000-01-01T12:00:00Z
export const AU_IN_KM = 149597870.7; // 1 AU in km
export const SPEED_OF_LIGHT_KM_S = 299792.458;
export const GM_SUN = 1.32712440018e11; // km^3 / s^2 (standard gravitational parameter of the Sun)

/**
 * Converts a JS Date into a Julian Date (JD).
 */
export function dateToJulianDate(date: Date): number {
  const time = date.getTime();
  return (time / 86400000.0) + 2440587.5;
}

/**
 * Converts a Julian Date back to a JS Date.
 */
export function julianDateToDate(jd: number): Date {
  const time = (jd - 2440587.5) * 86400000.0;
  return new Date(time);
}

/**
 * Solves Kepler's equation M = E - e * sin(E) for Eccentric Anomaly E using Newton-Raphson.
 */
export function solveKeplerEquation(meanAnomalyRad: number, eccentricity: number): number {
  let M = meanAnomalyRad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  let E = eccentricity < 0.8 ? M : Math.PI;
  const tolerance = 1e-7;
  const maxIterations = 30;

  for (let i = 0; i < maxIterations; i++) {
    const f = E - eccentricity * Math.sin(E) - M;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < tolerance) break;
  }

  return E;
}

export interface HeliocentricPosition {
  xAU: number;
  yAU: number; // In Three.js, Y is typically up (ecliptic normal)
  zAU: number;
  distanceAU: number;
  distanceKm: number;
  trueAnomalyDeg: number;
  orbitalSpeedKmS: number;
}

export interface RenderPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates the heliocentric 3D position in AU and km for a celestial body at a given Julian Date.
 */
export function calculateHeliocentricPosition(
  orbit: OrbitalElements,
  jd: number
): HeliocentricPosition {
  const a = orbit.semiMajorAxisAU;
  const e = Math.min(Math.max(orbit.eccentricity, 0), 0.999);
  const epoch = orbit.epochJD ?? J2000_JD;
  const daysSinceEpoch = jd - epoch;

  if (a === 0 || orbit.orbitalPeriodDays <= 0) {
    return {
      xAU: 0,
      yAU: 0,
      zAU: 0,
      distanceAU: 0,
      distanceKm: 0,
      trueAnomalyDeg: 0,
      orbitalSpeedKmS: 0
    };
  }

  // Mean motion (radians per day)
  const n = (2 * Math.PI) / orbit.orbitalPeriodDays;
  const M0_rad = (orbit.meanAnomalyAtEpochDeg * Math.PI) / 180;
  const M = M0_rad + n * daysSinceEpoch;

  // Solve Kepler equation for E
  const E = solveKeplerEquation(M, e);

  // True anomaly nu
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Heliocentric distance r (AU)
  const rAU = Math.max(a * (1 - e * Math.cos(E)), 0.001);

  // Coordinates in orbital plane
  const xPrime = rAU * Math.cos(nu);
  const yPrime = rAU * Math.sin(nu);

  // Convert orbital angles from degrees to radians
  const inc = (orbit.inclinationDeg * Math.PI) / 180;
  const omega = (orbit.argumentOfPeriapsisDeg * Math.PI) / 180;
  const Omega = (orbit.longitudeOfAscendingNodeDeg * Math.PI) / 180;

  // 3D rotation matrix into Heliocentric Ecliptic frame
  // Three.js coordinates: X and Z form the ecliptic plane, Y is normal (perpendicular to ecliptic)
  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const Px = cosOmega * cosW - sinOmega * sinW * cosI;
  const Py = sinI * sinW; // Y is up
  const Pz = sinOmega * cosW + cosOmega * sinW * cosI;

  const Qx = -cosOmega * sinW - sinOmega * cosW * cosI;
  const Qy = sinI * cosW; // Y is up
  const Qz = -sinOmega * sinW + cosOmega * cosW * cosI;

  const xAU = xPrime * Px + yPrime * Qx;
  const yAU = xPrime * Py + yPrime * Qy;
  const zAU = xPrime * Pz + yPrime * Qz;

  const distanceKm = rAU * AU_IN_KM;

  // Vis-viva equation for orbital speed: v = sqrt(GM * (2/r - 1/a))
  const rKm = distanceKm;
  const aKm = a * AU_IN_KM;
  let speedKmS = 0;
  if (rKm > 0 && aKm > 0) {
    const vSq = GM_SUN * (2 / rKm - 1 / aKm);
    if (vSq > 0) speedKmS = Math.sqrt(vSq);
  }

  return {
    xAU,
    yAU,
    zAU,
    distanceAU: rAU,
    distanceKm,
    trueAnomalyDeg: (nu * 180) / Math.PI,
    orbitalSpeedKmS: speedKmS
  };
}

/**
 * Maps astronomical AU coordinates into 3D world units for Three.js.
 * Increased by a ton per NASA Eyes true expansive proportions:
 * - 'visual': Harmonious log-power scaling with smooth continuous separation
 * - 'true': 1:1 astronomical scale (1 AU = 1000 scene units, exactly matching real km ratios).
 */
export function auToSceneCoords(
  xAU: number,
  yAU: number,
  zAU: number,
  mode: 'visual' | 'true' = 'true'
): RenderPosition {
  if (xAU === 0 && yAU === 0 && zAU === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const rAU = Math.sqrt(xAU * xAU + yAU * yAU + zAU * zAU);
  if (rAU < 1e-6) return { x: 0, y: 0, z: 0 };

  const dirX = xAU / rAU;
  const dirY = yAU / rAU;
  const dirZ = zAU / rAU;

  let sceneDist: number;
  if (mode === 'true') {
    // Exact 1:1 astronomical scale: 1 AU = 1000.0 scene units
    sceneDist = rAU * 1000.0;
  } else {
    // NASA Eyes visual mode: smooth, continuous monotonic spacing
    sceneDist = 60.0 + 180.0 * Math.pow(rAU, 0.65);
  }

  return {
    x: dirX * sceneDist,
    y: dirY * sceneDist,
    z: dirZ * sceneDist
  };
}

/**
 * Returns accurate radius scale for a body in either 'visual' or 'true' 1:1 scale.
 * In 1:1 scale, calibrated so closest terrestrial planets (Mercury, Venus, Earth, Mars)
 * are beautifully visible and tangible, without collapsing into sub-pixel microscopic specks,
 * while maintaining true astronomical size hierarchy and keeping moon orbits unobstructed.
 */
export function getBodyRadiusScale(body: CelestialBody, mode: 'visual' | 'true'): number {
  if (mode === 'visual') {
    return body.visualRadiusScale;
  }
  
  if (body.type === 'star') {
    return 8.5; // Majestic incandescent solar sphere
  }
  
  if (body.type === 'spacecraft') {
    return 0.12; // Sleek, readable probe model
  }

  // Calibrated 1:1 scale: ensures closest terrestrial planets have solid visible presence
  // while preserving physical hierarchy: Sun >> Jupiter > Saturn > Uranus ~ Neptune >> Earth ~ Venus > Mars > Mercury > Pluto > Ceres
  if (body.id === 'earth') return 0.30;
  if (body.id === 'venus') return 0.28;
  if (body.id === 'mars') return 0.22;
  if (body.id === 'mercury') return 0.18; // Substantial, beautifully cratered, not microscopic
  if (body.id === 'moon') return 0.10;
  if (body.id === 'jupiter') return 1.40; // Gas giant (moons orbit at 2.8 - 12.5 units)
  if (body.id === 'saturn') return 1.20;
  if (body.id === 'uranus') return 0.75;
  if (body.id === 'neptune') return 0.72;
  if (body.id === 'pluto') return 0.14;
  if (body.id === 'ceres') return 0.10;
  if (body.id === 'io') return 0.11;
  if (body.id === 'europa') return 0.10;
  if (body.id === 'ganymede') return 0.14;
  if (body.id === 'callisto') return 0.13;
  if (body.id === 'titan') return 0.14;
  if (body.id === 'enceladus') return 0.08;

  // Fallback for comets/asteroids
  const rawRadiusAU = body.radiusKm / 149597.87;
  return Math.max(rawRadiusAU * 6.0, 0.08);
}

/**
 * Calculates accurate physical moon position around parent planet.
 * In 'true' mode: uses true semi-major axis in AU (1 AU = 1000 units).
 * In 'visual' mode: uses harmonious proportional orbital shells.
 */
export function calculateMoonRelativePosition(
  moon: CelestialBody,
  parentVisualRadius: number,
  jd: number,
  mode: 'visual' | 'true' = 'true'
): { x: number; y: number; z: number; orbitRadius: number } {
  const orbit = moon.orbit;
  const epoch = orbit.epochJD ?? J2000_JD;
  const daysSinceEpoch = jd - epoch;

  // Mean motion
  const n = (2 * Math.PI) / orbit.orbitalPeriodDays;
  const M0_rad = (orbit.meanAnomalyAtEpochDeg * Math.PI) / 180;
  const M = M0_rad + n * daysSinceEpoch;
  const E = solveKeplerEquation(M, orbit.eccentricity);

  const e = orbit.eccentricity;
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  let orbitRadius: number;
  if (mode === 'true') {
    // Exact 1:1 astronomical distance: 1 AU = 1000 scene units
    orbitRadius = (orbit.semiMajorAxisAU > 0 ? orbit.semiMajorAxisAU : 0.00257) * 1000.0;
  } else {
    // Proportional visual mode: distinct, non-clashing orbital shells
    if (moon.id === 'moon') {
      orbitRadius = parentVisualRadius * 4.8;
    } else if (moon.id === 'io') {
      orbitRadius = parentVisualRadius * 2.6;
    } else if (moon.id === 'europa') {
      orbitRadius = parentVisualRadius * 3.8;
    } else if (moon.id === 'ganymede') {
      orbitRadius = parentVisualRadius * 5.4;
    } else if (moon.id === 'callisto') {
      orbitRadius = parentVisualRadius * 7.5;
    } else if (moon.id === 'enceladus') {
      orbitRadius = parentVisualRadius * 3.0; // safely outside Saturn rings
    } else if (moon.id === 'titan') {
      orbitRadius = parentVisualRadius * 6.5;
    } else {
      orbitRadius = parentVisualRadius * 3.5;
    }
  }

  const inc = (orbit.inclinationDeg * Math.PI) / 180;
  const x = Math.cos(nu) * orbitRadius;
  const z = Math.sin(nu) * orbitRadius * Math.cos(inc);
  const y = Math.sin(nu) * orbitRadius * Math.sin(inc);

  return { x, y, z, orbitRadius };
}

export interface ConstellationDef {
  name: string;
  lines: [number, number, number][][]; // pairs of 3D unit coordinates on celestial sphere
}

/**
 * 3D Celestial Sphere Coordinates (Right Ascension / Declination converted to unit vector)
 * for major recognizable constellations (Orion, Ursa Major, Cassiopeia, Southern Cross, etc.)
 */
function raDecToVector3(raHours: number, decDeg: number, radius: number = 85000): [number, number, number] {
  const raRad = (raHours * 15 * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);
  return [x, y, z];
}

export const CONSTELLATIONS_DATA: ConstellationDef[] = [
  {
    name: 'Orion (The Hunter)',
    lines: [
      // Belt
      [raDecToVector3(5.53, -0.3), raDecToVector3(5.6, -1.2)], // Alnitak to Alnilam
      [raDecToVector3(5.6, -1.2), raDecToVector3(5.67, -1.9)], // Alnilam to Mintaka
      // Shoulders
      [raDecToVector3(5.92, 7.4), raDecToVector3(5.6, -1.2)], // Betelgeuse to Belt
      [raDecToVector3(5.42, 6.35), raDecToVector3(5.6, -1.2)], // Bellatrix to Belt
      // Feet
      [raDecToVector3(5.24, -8.2), raDecToVector3(5.6, -1.2)], // Rigel to Belt
      [raDecToVector3(5.79, -9.67), raDecToVector3(5.6, -1.2)], // Saiph to Belt
      // Body connects
      [raDecToVector3(5.92, 7.4), raDecToVector3(5.42, 6.35)], // Betelgeuse to Bellatrix
      [raDecToVector3(5.24, -8.2), raDecToVector3(5.79, -9.67)] // Rigel to Saiph
    ]
  },
  {
    name: 'Ursa Major (Big Dipper)',
    lines: [
      [raDecToVector3(11.06, 61.75), raDecToVector3(11.03, 56.38)], // Dubhe to Merak
      [raDecToVector3(11.03, 56.38), raDecToVector3(11.9, 53.69)], // Merak to Phecda
      [raDecToVector3(11.9, 53.69), raDecToVector3(12.25, 57.03)], // Phecda to Megrez
      [raDecToVector3(12.25, 57.03), raDecToVector3(11.06, 61.75)], // Megrez to Dubhe
      [raDecToVector3(12.25, 57.03), raDecToVector3(12.9, 55.96)], // Megrez to Alioth
      [raDecToVector3(12.9, 55.96), raDecToVector3(13.4, 54.92)], // Alioth to Mizar
      [raDecToVector3(13.4, 54.92), raDecToVector3(13.79, 49.31)] // Mizar to Alkaid
    ]
  },
  {
    name: 'Cassiopeia (The Queen)',
    lines: [
      [raDecToVector3(0.15, 59.15), raDecToVector3(0.67, 56.54)], // Caph to Schedar
      [raDecToVector3(0.67, 56.54), raDecToVector3(0.94, 60.72)], // Schedar to Gamma Cas
      [raDecToVector3(0.94, 60.72), raDecToVector3(1.43, 60.23)], // Gamma Cas to Ruchbah
      [raDecToVector3(1.43, 60.23), raDecToVector3(1.9, 63.67)] // Ruchbah to Segin
    ]
  },
  {
    name: 'Crux (Southern Cross)',
    lines: [
      [raDecToVector3(12.44, -63.1), raDecToVector3(12.52, -57.11)], // Acrux to Gacrux
      [raDecToVector3(12.79, -59.69), raDecToVector3(12.25, -58.75)] // Mimosa to Delta Crucis
    ]
  },
  {
    name: 'Scorpius (The Scorpion)',
    lines: [
      [raDecToVector3(16.49, -26.43), raDecToVector3(16.09, -22.62)], // Antares to Graffias
      [raDecToVector3(16.49, -26.43), raDecToVector3(16.84, -34.29)], // Antares to Wei
      [raDecToVector3(16.84, -34.29), raDecToVector3(17.56, -37.3)], // Wei to Shaula
      [raDecToVector3(17.56, -37.3), raDecToVector3(17.79, -39.0)] // Tail stinger
    ]
  },
  {
    name: 'Cygnus (The Northern Cross)',
    lines: [
      [raDecToVector3(20.69, 45.28), raDecToVector3(20.37, 40.26)], // Deneb to Sadr
      [raDecToVector3(20.37, 40.26), raDecToVector3(19.51, 27.96)], // Sadr to Albireo
      [raDecToVector3(19.76, 45.13), raDecToVector3(20.37, 40.26)], // Gienah to Sadr
      [raDecToVector3(20.37, 40.26), raDecToVector3(21.31, 30.22)] // Sadr to Delta Cygni
    ]
  }
];

/**
 * Calculates real-time distance and light travel time from Earth to any object.
 */
export function getEarthDistanceAndLightTime(
  objectPosAU: HeliocentricPosition,
  earthPosAU: HeliocentricPosition
): { distanceAU: number; distanceKm: number; lightTimeMinutes: number; lightTimeStr: string } {
  const dx = objectPosAU.xAU - earthPosAU.xAU;
  const dy = objectPosAU.yAU - earthPosAU.yAU;
  const dz = objectPosAU.zAU - earthPosAU.zAU;
  const distAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distKm = distAU * AU_IN_KM;
  const lightTimeSeconds = distKm / SPEED_OF_LIGHT_KM_S;
  const lightTimeMinutes = lightTimeSeconds / 60;

  let lightTimeStr = '';
  if (lightTimeMinutes < 1) {
    lightTimeStr = `${lightTimeSeconds.toFixed(1)} sec`;
  } else if (lightTimeMinutes < 60) {
    lightTimeStr = `${lightTimeMinutes.toFixed(2)} min`;
  } else {
    const hrs = Math.floor(lightTimeMinutes / 60);
    const mins = Math.round(lightTimeMinutes % 60);
    lightTimeStr = `${hrs} hr ${mins} min`;
  }

  return {
    distanceAU: distAU,
    distanceKm: distKm,
    lightTimeMinutes,
    lightTimeStr
  };
}

/**
 * Generates an array of 3D points forming an orbital ellipse for Three.js LineLoop.
 */
export function generateOrbitPoints(
  orbit: OrbitalElements,
  mode: 'visual' | 'true' = 'true',
  numSegments: number = 180
): RenderPosition[] {
  const points: RenderPosition[] = [];
  const e = Math.min(Math.max(orbit.eccentricity, 0), 0.999);
  const a = orbit.semiMajorAxisAU;

  if (a <= 0) return points;

  const inc = (orbit.inclinationDeg * Math.PI) / 180;
  const omega = (orbit.argumentOfPeriapsisDeg * Math.PI) / 180;
  const Omega = (orbit.longitudeOfAscendingNodeDeg * Math.PI) / 180;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const Px = cosOmega * cosW - sinOmega * sinW * cosI;
  const Py = sinI * sinW;
  const Pz = sinOmega * cosW + cosOmega * sinW * cosI;

  const Qx = -cosOmega * sinW - sinOmega * cosW * cosI;
  const Qy = sinI * cosW;
  const Qz = -sinOmega * sinW + cosOmega * cosW * cosI;

  for (let i = 0; i <= numSegments; i++) {
    const E = (i / numSegments) * 2 * Math.PI;
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);
    const rAU = Math.max(a * (1 - e * Math.cos(E)), 0.001);

    const xPrime = rAU * Math.cos(nu);
    const yPrime = rAU * Math.sin(nu);

    const xAU = xPrime * Px + yPrime * Qx;
    const yAU = xPrime * Py + yPrime * Qy;
    const zAU = xPrime * Pz + yPrime * Qz;

    points.push(auToSceneCoords(xAU, yAU, zAU, mode));
  }

  return points;
}
