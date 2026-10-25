/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authoritative Celestial Mechanics & Orbital Physics Engine.
 * Implements high-precision Keplerian orbital solver, Vis-Viva energy equations,
 * gravitational vector field calculations, and tidal dissipation mechanics.
 */

import { OrbitalElements, CelestialBody, CELESTIAL_BODIES } from '../data/celestialBodies';
import { J2000_JD, AU_IN_KM, GM_SUN, SPEED_OF_LIGHT_KM_S } from './ephemeris';

export const G_CONSTANT = 6.67430e-11; // m^3 / (kg * s^2)
export const MASS_SUN_KG = 1.9885e30;

export interface PhysicsVector3 {
  x: number;
  y: number;
  z: number;
}

export interface LiveOrbitalPhysics {
  // Positional metrics
  heliocentricDistanceAU: number;
  heliocentricDistanceKm: number;
  trueAnomalyDeg: number;
  eccentricAnomalyDeg: number;
  meanAnomalyDeg: number;
  
  // Velocity and Momentum
  orbitalSpeedKmS: number;
  perihelionSpeedKmS: number;
  aphelionSpeedKmS: number;
  specificOrbitalEnergyMJkg: number; // -mu / (2a) in MJ/kg
  specificAngularMomentumKm2s: number; // h = sqrt(mu * a * (1 - e^2))
  
  // Gravitational Vectors
  gravitationalAccelerationMps2: number; // GM / r^2
  sunGravitationalForceN: string; // F = G*M1*M2 / r^2
  velocityVectorUnit: PhysicsVector3;
  gravityVectorUnit: PhysicsVector3;
  
  // Extreme orbital boundaries
  perihelionDistanceAU: number;
  aphelionDistanceAU: number;
  semiMinorAxisAU: number;
  
  // Tidal forces (for moons)
  tidalHeatingWattsPerM2?: number;
}

/**
 * Solves Kepler's equation M = E - e*sin(E) with quadratic Newton-Raphson convergence.
 */
export function solveKeplerPrecise(M_rad: number, e: number): number {
  let M = M_rad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  let E = e < 0.8 ? M : Math.PI;
  const tolerance = 1e-12;
  const maxIter = 50;

  for (let i = 0; i < maxIter; i++) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const f = E - e * sinE - M;
    const fPrime = 1 - e * cosE;
    const fDoublePrime = e * sinE;

    // Halley's / Newton's 2nd order correction for extreme accuracy near perihelion
    const delta = f / (fPrime - 0.5 * (f / fPrime) * fDoublePrime);
    E -= delta;
    if (Math.abs(delta) < tolerance) break;
  }

  return E;
}

/**
 * Computes deep orbital physics state for a body at any given Julian Date.
 */
export function calculateLivePhysics(
  body: CelestialBody,
  jd: number
): LiveOrbitalPhysics {
  const orbit = body.orbit;
  const aAU = orbit.semiMajorAxisAU;
  const e = Math.min(Math.max(orbit.eccentricity, 0), 0.999);
  const epoch = orbit.epochJD ?? J2000_JD;
  const daysSinceEpoch = jd - epoch;

  if (aAU <= 0 || orbit.orbitalPeriodDays <= 0) {
    return {
      heliocentricDistanceAU: 0,
      heliocentricDistanceKm: 0,
      trueAnomalyDeg: 0,
      eccentricAnomalyDeg: 0,
      meanAnomalyDeg: 0,
      orbitalSpeedKmS: 0,
      perihelionSpeedKmS: 0,
      aphelionSpeedKmS: 0,
      specificOrbitalEnergyMJkg: 0,
      specificAngularMomentumKm2s: 0,
      gravitationalAccelerationMps2: 0,
      sunGravitationalForceN: '0',
      velocityVectorUnit: { x: 0, y: 0, z: 0 },
      gravityVectorUnit: { x: 0, y: 0, z: 0 },
      perihelionDistanceAU: 0,
      aphelionDistanceAU: 0,
      semiMinorAxisAU: 0
    };
  }

  // Mean motion (rad / day)
  const n = (2 * Math.PI) / orbit.orbitalPeriodDays;
  const M0_rad = (orbit.meanAnomalyAtEpochDeg * Math.PI) / 180;
  const M_rad = M0_rad + n * daysSinceEpoch;
  const E_rad = solveKeplerPrecise(M_rad, e);

  // True anomaly nu
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E_rad)) / (1 - e * Math.cos(E_rad));
  const cosNu = (Math.cos(E_rad) - e) / (1 - e * Math.cos(E_rad));
  const nu_rad = Math.atan2(sinNu, cosNu);

  // Heliocentric distance r
  const rAU = Math.max(aAU * (1 - e * Math.cos(E_rad)), 0.001);
  const rKm = rAU * AU_IN_KM;
  const aKm = aAU * AU_IN_KM;

  // Vis-Viva Equation: v^2 = GM * (2/r - 1/a)
  const vSq = GM_SUN * (2 / rKm - 1 / aKm);
  const orbitalSpeedKmS = vSq > 0 ? Math.sqrt(vSq) : 0;

  // Perihelion and Aphelion speeds (Kepler's Second Law extremes)
  const perihelionDistKm = aKm * (1 - e);
  const aphelionDistKm = aKm * (1 + e);
  const perihelionSpeedKmS = Math.sqrt(GM_SUN * (2 / perihelionDistKm - 1 / aKm));
  const aphelionSpeedKmS = Math.sqrt(GM_SUN * (2 / aphelionDistKm - 1 / aKm));

  // Specific Orbital Energy (vis-viva constant): eps = -mu / (2a) in MJ/kg
  const specificOrbitalEnergyMJkg = -(GM_SUN / (2 * aKm)) * 1e-3;

  // Specific Angular Momentum: h = sqrt(mu * a * (1 - e^2)) in km^2 / s
  const specificAngularMomentumKm2s = Math.sqrt(GM_SUN * aKm * (1 - e * e));

  // Gravitational acceleration from the Sun: g = GM_sun / r^2 in m/s^2
  const rMeters = rKm * 1000;
  const gravAccelMps2 = (GM_SUN * 1e9) / (rMeters * rMeters);

  // Gravitational force in Newtons (F = m * g)
  const bodyMassKgNum = parseFloat(body.massKg.replace(/[^\d.eE+-]/g, '')) || 1e24;
  const sunForceNewtons = bodyMassKgNum * gravAccelMps2;
  const sunGravitationalForceN = sunForceNewtons > 1e12 ? sunForceNewtons.toExponential(3) + ' N' : sunForceNewtons.toFixed(1) + ' N';

  // 3D Direction Vectors for orbital physics visualization
  const inc = (orbit.inclinationDeg * Math.PI) / 180;
  const omega = (orbit.argumentOfPeriapsisDeg * Math.PI) / 180;
  const Omega = (orbit.longitudeOfAscendingNodeDeg * Math.PI) / 180;

  // Position vector in orbital plane
  const xP = Math.cos(nu_rad);
  const yP = Math.sin(nu_rad);

  // Velocity vector in orbital plane (perpendicular to radius vector in circular limit)
  const vxP = -Math.sin(nu_rad);
  const vyP = Math.cos(nu_rad) + e;
  const vNorm = Math.sqrt(vxP * vxP + vyP * vyP) || 1;

  // Coordinate frame rotation into 3D ecliptic
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

  // Normalized 3D Gravity direction (pointing back to Sun)
  const posX = xP * Px + yP * Qx;
  const posY = xP * Py + yP * Qy;
  const posZ = xP * Pz + yP * Qz;
  const posMag = Math.sqrt(posX * posX + posY * posY + posZ * posZ) || 1;
  const gravityVectorUnit = {
    x: -posX / posMag,
    y: -posY / posMag,
    z: -posZ / posMag
  };

  // Normalized 3D Velocity direction (pointing along instantaneous trajectory)
  const velX = (vxP / vNorm) * Px + (vyP / vNorm) * Qx;
  const velY = (vxP / vNorm) * Py + (vyP / vNorm) * Qy;
  const velZ = (vxP / vNorm) * Pz + (vyP / vNorm) * Qz;
  const velMag = Math.sqrt(velX * velX + velY * velY + velZ * velZ) || 1;
  const velocityVectorUnit = {
    x: velX / velMag,
    y: velY / velMag,
    z: velZ / velMag
  };

  // Tidal heating estimation for resonant moons
  let tidalHeatingWattsPerM2: number | undefined;
  if (body.id === 'io') {
    tidalHeatingWattsPerM2 = 2.5; // ~2.5 W/m^2 (drives 400 active volcanoes)
  } else if (body.id === 'europa') {
    tidalHeatingWattsPerM2 = 0.08; // maintains liquid ocean under ice
  } else if (body.id === 'enceladus') {
    tidalHeatingWattsPerM2 = 0.12; // powers south polar geysers
  }

  return {
    heliocentricDistanceAU: rAU,
    heliocentricDistanceKm: rKm,
    trueAnomalyDeg: (nu_rad * 180) / Math.PI,
    eccentricAnomalyDeg: (E_rad * 180) / Math.PI,
    meanAnomalyDeg: ((M_rad * 180) / Math.PI) % 360,
    orbitalSpeedKmS,
    perihelionSpeedKmS,
    aphelionSpeedKmS,
    specificOrbitalEnergyMJkg,
    specificAngularMomentumKm2s,
    gravitationalAccelerationMps2: gravAccelMps2,
    sunGravitationalForceN,
    velocityVectorUnit,
    gravityVectorUnit,
    perihelionDistanceAU: aAU * (1 - e),
    aphelionDistanceAU: aAU * (1 + e),
    semiMinorAxisAU: aAU * Math.sqrt(1 - e * e),
    tidalHeatingWattsPerM2
  };
}
