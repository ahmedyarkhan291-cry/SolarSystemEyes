/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA-Grade Photorealistic Procedural Texture Generators.
 * Inspired directly by NASA SDO, Cassini, Juno, and Hubble imagery.
 * Zero external asset dependencies; 100% procedurally synthesized in code.
 */

import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function createBaseCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return [canvas, ctx];
}

function wrapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

// Deterministic fast noise functions
function pseudoNoise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number = 42): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = pseudoNoise(i, j, seed);
  const n10 = pseudoNoise(i + 1, j, seed);
  const n01 = pseudoNoise(i, j + 1, seed);
  const n11 = pseudoNoise(i + 1, j + 1, seed);

  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;

  return nx0 * (1 - sy) + nx1 * sy;
}

function fbm(x: number, y: number, octaves: number = 4, seed: number = 42): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let o = 0; o < octaves; o++) {
    value += smoothNoise(x * frequency, y * frequency, seed + o * 13) * amplitude;
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * NASA SDO Incandescent Photosphere:
 * Brilliant thermonuclear core, fine convective granulation cells, active sunspot groups with umbra/penumbra and magnetic plage faculae,
 * and realistic limb darkening.
 */
export function getSunTexture(): THREE.CanvasTexture {
  const cacheKey = 'sun_nasa_sdo_v7';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Active region sunspot groups (AIA 1700Å / HMI magnetogram)
  const sunspots = [
    { u: 0.28, v: 0.42, r: 0.022 },
    { u: 0.31, v: 0.45, r: 0.014 },
    { u: 0.62, v: 0.54, r: 0.025 },
    { u: 0.66, v: 0.56, r: 0.016 },
    { u: 0.48, v: 0.38, r: 0.018 },
    { u: 0.82, v: 0.46, r: 0.015 }
  ];

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    // Physically authentic limb darkening profile
    const limb = Math.pow(Math.max(0.001, cosLat), 0.55);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      // Photospheric granulation cells (1000 km convection cells)
      const g1 = fbm(u * 64, v * 64, 4, 101);
      const g2 = fbm(u * 140, v * 140, 3, 202);
      const cellPattern = g1 * 0.65 + g2 * 0.35;
      // High-contrast intergranular lanes (dark borders between hot rising bubbles)
      const granuleCell = Math.pow(cellPattern, 1.4);

      // Magnetic active network (chromospheric plages)
      const plageNoise = fbm(u * 20, v * 20, 4, 303);
      const plage = Math.pow(Math.max(0, plageNoise - 0.52) / 0.48, 1.8);

      // Blazing thermal spectrum:
      // Convection core: [255, 245, 200]
      // Granule surface: [255, 180, 40]
      // Intergranular lanes: [210, 85, 10]
      // Limb: [180, 50, 5]
      let r = 255 * (0.80 + 0.20 * limb);
      let g = (145 + granuleCell * 90) * (0.50 + 0.50 * limb) + plage * 90;
      let b = (20 + granuleCell * 60) * (0.30 + 0.70 * limb) + plage * 80;

      // Sunspot umbra and penumbra with magnetic filaments
      for (const spot of sunspots) {
        const du = Math.abs(u - spot.u);
        const dv = Math.abs(v - spot.v);
        const dist = Math.sqrt(du * du + dv * dv);

        if (dist < spot.r * 3.5) {
          if (dist < spot.r * 0.38) {
            // Umbra: deep black magnetic flux tube
            const factor = dist / (spot.r * 0.38);
            r = Math.floor(45 + factor * 35);
            g = Math.floor(15 + factor * 20);
            b = Math.floor(5 + factor * 10);
          } else if (dist < spot.r) {
            // Penumbra: striated magnetic field lines
            const p = (dist - spot.r * 0.38) / (spot.r * 0.62);
            r = Math.floor(85 + p * 130);
            g = Math.floor(40 + p * 95);
            b = Math.floor(10 + p * 30);
          } else {
            // Bright magnetic faculae halo around spot group
            const f = 1 - (dist - spot.r) / (spot.r * 2.5);
            r = Math.min(255, r + f * 70);
            g = Math.min(255, g + f * 60);
            b = Math.min(255, b + f * 50);
          }
        }
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Jupiter Texture (Juno / Cassini standard):
 * Accurate ammonia ice zones, reddish-brown equatorial belts with turbulence,
 * and the iconic Great Red Spot with inner eye and circulating vortex.
 */
export function getJupiterTexture(): THREE.CanvasTexture {
  const cacheKey = 'jupiter_juno_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Great Red Spot center in UV coordinates (~22° South)
  const grsU = 0.62;
  const grsV = 0.66;
  const grsRadiusU = 0.055;
  const grsRadiusV = 0.035;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      // Zonal atmospheric jet-streams
      const shear = Math.sin(v * 28) * 0.04 + Math.cos(v * 14) * 0.02;
      const turbulence = fbm((u + shear) * 20, v * 16, 4, 303);

      // Alternating equatorial and polar bands
      const bandWave = Math.sin(v * Math.PI * 16) * 0.5 + 0.5;
      const band = bandWave * 0.65 + turbulence * 0.35;

      // Creamy white ammonia zones vs warm brick-brown belts
      let r = 225 * band + 185 * (1 - band);
      let g = 160 * band + 145 * (1 - band);
      let b = 115 * band + 110 * (1 - band);

      // Great Red Spot vortex
      const du = (u - grsU) / grsRadiusU;
      const dv = (v - grsV) / grsRadiusV;
      const grsDist = Math.sqrt(du * du + dv * dv);

      if (grsDist < 1.15) {
        const factor = Math.max(0, 1 - grsDist);
        const angle = Math.atan2(dv, du);
        const swirl = Math.sin(angle * 4 + grsDist * 6) * 0.15;

        // Rich brick-crimson anticyclone color
        r = 215 + factor * 35 + swirl * 20;
        g = 65 + factor * 25 + swirl * 15;
        b = 40 + factor * 20 + swirl * 10;
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Earth Texture:
 * Deep ocean blues, realistic continental masses, lush vegetation, and polar caps.
 */
export function getEarthTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_nasa_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const lat = (y / 512 - 0.5) * Math.PI;
    const absLat = Math.abs(lat);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;

      const n = fbm(u * 6, v * 6, 5, 12);
      const detail = fbm(u * 24, v * 24, 3, 44);

      const idx = (y * 1024 + x) * 4;

      if (absLat > 1.25) {
        // Polar ice caps
        data[idx] = 245;
        data[idx + 1] = 250;
        data[idx + 2] = 255;
      } else if (n > 0.48) {
        // Continental landmasses
        const elevation = (n - 0.48) / 0.52;
        if (elevation > 0.6 || absLat > 0.95) {
          // Mountains and highlands (brown/beige rock)
          data[idx] = Math.floor(145 + elevation * 60);
          data[idx + 1] = Math.floor(130 + elevation * 45);
          data[idx + 2] = Math.floor(100 + elevation * 35);
        } else if (absLat < 0.4 && detail > 0.45) {
          // Tropical lush forest green
          data[idx] = Math.floor(35 + elevation * 25);
          data[idx + 1] = Math.floor(115 + elevation * 40);
          data[idx + 2] = 50;
        } else {
          // Temperate terrain
          data[idx] = Math.floor(80 + elevation * 60);
          data[idx + 1] = Math.floor(125 + elevation * 35);
          data[idx + 2] = 55;
        }
      } else {
        // Oceanic depths
        const depth = (0.48 - n) / 0.48;
        data[idx] = Math.floor(10 + (1 - depth) * 20);
        data[idx + 1] = Math.floor(60 + (1 - depth) * 55);
        data[idx + 2] = Math.floor(155 + (1 - depth) * 65);
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Earth Atmospheric Clouds
 */
export function getEarthCloudsTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_clouds_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;

      const swirl = Math.sin(u * 14 + v * 5) * 0.08;
      const c = fbm((u + swirl) * 8, v * 8, 4, 77);

      const idx = (y * 1024 + x) * 4;
      if (c > 0.5) {
        const alpha = Math.min(235, Math.floor((c - 0.5) / 0.3 * 235));
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = alpha;
      } else {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Mars Texture:
 * Rusty iron oxide terrain, Syrtis Major basalt, Valles Marineris, and polar ice caps.
 */
export function getMarsTexture(): THREE.CanvasTexture {
  const cacheKey = 'mars_usgs_mro_v5';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Major geographic landmark coordinates in equirectangular UV
  // Olympus Mons (~18°N, 226°E): u ~ 0.22, v ~ 0.40
  const olympusU = 0.22, olympusV = 0.40;
  // Syrtis Major Planum (~10°N, 290°E): u ~ 0.76, v ~ 0.44
  const syrtisU = 0.76, syrtisV = 0.44;
  // Hellas Planitia impact basin (~42°S, 70°E): u ~ 0.58, v ~ 0.73
  const hellasU = 0.58, hellasV = 0.73;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    const lat = (v - 0.5) * Math.PI;
    const absLat = Math.abs(lat);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      // Multi-frequency Martian geological terrain
      const macro = fbm(u * 7, v * 7, 4, 119);
      const meso = fbm(u * 22, v * 22, 4, 303);
      const micro = smoothNoise(u * 64, v * 64, 77);

      // Iron-oxide desert base tones (rich ochre, terracotta, and rust)
      let r = 188 + macro * 38 + meso * 15;
      let g = 88 + macro * 25 + meso * 10;
      let b = 48 + macro * 18 + meso * 8;

      // 1. Syrtis Major Planum & Sinus Meridiani (dark ancient basalt shields)
      const dSyrtis = Math.hypot((u - syrtisU) * 1.8, (v - syrtisV) * 2.2);
      if (dSyrtis < 0.16) {
        const factor = (0.16 - dSyrtis) / 0.16;
        r = Math.floor(r * (1 - factor * 0.52) + 68 * factor * 0.52);
        g = Math.floor(g * (1 - factor * 0.52) + 52 * factor * 0.52);
        b = Math.floor(b * (1 - factor * 0.52) + 45 * factor * 0.52);
      }

      // 2. Valles Marineris canyon system (equatorial rift valley between u = 0.26 and 0.44, v ~ 0.54)
      if (u > 0.26 && u < 0.45 && Math.abs(v - 0.53) < 0.045) {
        const canyonDist = Math.abs(v - 0.53) / 0.045;
        const canyonDepth = (1.0 - canyonDist) * (1.0 - Math.abs(u - 0.35) / 0.10);
        r = Math.floor(r * (1 - canyonDepth * 0.65) + 60 * canyonDepth * 0.65);
        g = Math.floor(g * (1 - canyonDepth * 0.65) + 38 * canyonDepth * 0.65);
        b = Math.floor(b * (1 - canyonDepth * 0.65) + 28 * canyonDepth * 0.65);
      }

      // 3. Olympus Mons shield volcano & Tharsis Montes
      const dOlympus = Math.hypot((u - olympusU) * 2.0, (v - olympusV) * 2.0);
      if (dOlympus < 0.055) {
        // High altitude caldera and lava apron
        r = Math.min(255, r + 25);
        g = Math.min(255, g + 18);
        b = Math.min(255, b + 12);
        if (dOlympus < 0.012) {
          // Central summit caldera
          r = 75; g = 45; b = 32;
        }
      }

      // 4. Hellas Planitia (bright reflective dust-filled basin)
      const dHellas = Math.hypot((u - hellasU) * 1.5, (v - hellasV) * 1.8);
      if (dHellas < 0.11) {
        const hFactor = (0.11 - dHellas) / 0.11;
        r = Math.min(255, Math.floor(r + hFactor * 32));
        g = Math.min(255, Math.floor(g + hFactor * 26));
        b = Math.min(255, Math.floor(b + hFactor * 22));
      }

      // 5. Distinct North and South Polar Ice Caps (pure CO2 / H2O ice with spiral troughs)
      if (absLat > 1.30) {
        const polarDist = (absLat - 1.30) / (Math.PI / 2 - 1.30);
        const spiral = Math.sin(u * Math.PI * 4 + polarDist * 6) * 0.12;
        if (polarDist + spiral > 0.15) {
          const capIntensity = Math.min(1.0, (polarDist + spiral - 0.15) / 0.45);
          r = Math.floor(r * (1 - capIntensity) + 248 * capIntensity);
          g = Math.floor(g * (1 - capIntensity) + 248 * capIntensity);
          b = Math.floor(b * (1 - capIntensity) + 255 * capIntensity);
        }
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r + micro * 4));
      data[idx + 1] = Math.min(255, Math.floor(g + micro * 4));
      data[idx + 2] = Math.min(255, Math.floor(b + micro * 3));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Saturn Rings Texture with authentic Cassini Division and Encke Gap
 */
export function getSaturnRingTexture(): THREE.CanvasTexture {
  const cacheKey = 'saturn_rings_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(512, 64);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);

  grad.addColorStop(0.0, 'rgba(150, 130, 100, 0.0)');
  grad.addColorStop(0.08, 'rgba(175, 150, 115, 0.35)'); // C Ring
  grad.addColorStop(0.24, 'rgba(220, 195, 155, 0.88)'); // B Ring (brightest)
  grad.addColorStop(0.56, 'rgba(235, 215, 175, 0.95)');
  grad.addColorStop(0.60, 'rgba(15, 15, 15, 0.04)'); // Cassini Division gap
  grad.addColorStop(0.66, 'rgba(15, 15, 15, 0.04)');
  grad.addColorStop(0.68, 'rgba(205, 185, 150, 0.82)'); // A Ring
  grad.addColorStop(0.85, 'rgba(195, 175, 140, 0.75)');
  grad.addColorStop(0.87, 'rgba(25, 25, 25, 0.08)'); // Encke Gap
  grad.addColorStop(0.89, 'rgba(190, 170, 135, 0.65)');
  grad.addColorStop(0.96, 'rgba(165, 145, 115, 0.25)');
  grad.addColorStop(1.0, 'rgba(140, 120, 95, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Saturn Atmosphere (Cassini / Voyager standard):
 * Subtle alternating golden-ochre and cream ammonia cloud belts,
 * equatorial jet stream turbulence, and pale north polar hexagonal cap.
 */
export function getSaturnTexture(): THREE.CanvasTexture {
  const cacheKey = 'saturn_cassini_v5';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    // lat from -PI/2 (south pole) to +PI/2 (north pole)
    const lat = (0.5 - v) * Math.PI;
    const absLat = Math.abs(lat);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      // Zonal atmospheric jet stream shearing
      const shear = Math.sin(v * 28 + u * 2.5) * 0.035;
      const b1 = fbm((u + shear) * 14, v * 12, 4, 188);
      const b2 = smoothNoise(u * 28, v * 28, 77);

      // Cassini authentic warm butterscotch & ivory base:
      // Cream zones: [242, 222, 180]
      // Amber belts: [214, 182, 134]
      let r = 224 + b1 * 20;
      let g = 196 + b1 * 18;
      let b = 150 + b1 * 22;

      // Equatorial zone: bright reflective ammonia haze
      if (absLat < 0.22) {
        r += 18;
        g += 16;
        b += 14;
      }
      // Temperate belts: subtle warm amber striations
      else if (absLat > 0.35 && absLat < 0.72) {
        const stripe = Math.sin(v * Math.PI * 18) * 0.5 + 0.5;
        r -= 10 + stripe * 12;
        g -= 14 + stripe * 14;
        b -= 20 + stripe * 16;
      }

      // North Polar Hexagon (Cassini discovery: 6-sided wave at 78° N)
      if (lat > 1.25) {
        const hexDist = (lat - 1.25) / (Math.PI / 2 - 1.25);
        // 6-sided wave pattern
        const hexAngle = u * Math.PI * 2 * 6;
        const hexShape = Math.cos(hexAngle) * 0.12;

        if (hexDist + hexShape > 0.45) {
          // Iconic deep cyan-teal and steel blue polar atmosphere
          const pFactor = Math.min(1.0, (hexDist - 0.45) / 0.55);
          r = Math.floor(r * (1 - pFactor) + 65 * pFactor);
          g = Math.floor(g * (1 - pFactor) + 125 * pFactor);
          b = Math.floor(b * (1 - pFactor) + 155 * pFactor);
        }
      }
      // South pole: soft muted amber-slate cap
      else if (lat < -1.25) {
        const sDist = (-lat - 1.25) / (Math.PI / 2 - 1.25);
        r -= Math.floor(25 * sDist);
        g -= Math.floor(22 * sDist);
        b -= Math.floor(15 * sDist);
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r + b2 * 6));
      data[idx + 1] = Math.min(255, Math.floor(g + b2 * 6));
      data[idx + 2] = Math.min(255, Math.floor(b + b2 * 5));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Uranus Atmosphere (Voyager 2 / Keck):
 * Pale cyan-aquamarine methane haze with subtle soft cloud bands.
 */
export function getUranusTexture(): THREE.CanvasTexture {
  const cacheKey = 'uranus_keck_v4';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    const lat = (v - 0.5) * Math.PI;
    const absLat = Math.abs(lat);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const band = fbm(u * 10, v * 8, 3, 501);

      // Pale cyan-aquamarine ([165, 215, 225] to [135, 195, 210])
      let r = 145 + band * 25;
      let g = 205 + band * 20;
      let b = 220 + band * 15;

      // Subtle polar collar brightening
      if (absLat > 1.0) {
        r += 18;
        g += 15;
        b += 10;
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Neptune Atmosphere (Voyager 2 / Hubble):
 * Intense deep azure blue with dark storm bands, Great Dark Spot,
 * and bright white methane cirrus cloud streaks (Scooter).
 */
export function getNeptuneTexture(): THREE.CanvasTexture {
  const cacheKey = 'neptune_voyager_v4';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Great Dark Spot center (around 22°S)
  const gdsU = 0.45;
  const gdsV = 0.62;
  const gdsR = 0.045;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const band = fbm(u * 12, v * 10, 4, 702);

      // Deep Azure blue
      let r = 35 + band * 25;
      let g = 85 + band * 35;
      let b = 210 + band * 30;

      // Great Dark Spot
      const du = Math.abs(u - gdsU);
      const dv = Math.abs(v - gdsV);
      const dist = Math.sqrt(du * du + dv * dv * 2.5);
      if (dist < gdsR) {
        const factor = dist / gdsR;
        r = Math.floor(r * (0.45 + factor * 0.55));
        g = Math.floor(g * (0.50 + factor * 0.50));
        b = Math.floor(b * (0.65 + factor * 0.35));
      }

      // Bright white cirrus companion cloud streaks (Scooter)
      const cirrus = fbm(u * 40, v * 4, 3, 903);
      if (cirrus > 0.62 && Math.abs(v - 0.55) < 0.15) {
        const streakAlpha = (cirrus - 0.62) / 0.38;
        r = Math.floor(r * (1 - streakAlpha) + 245 * streakAlpha);
        g = Math.floor(g * (1 - streakAlpha) + 250 * streakAlpha);
        b = Math.floor(b * (1 - streakAlpha) + 255 * streakAlpha);
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Titan Atmosphere (Cassini-Huygens):
 * Opaque golden-orange nitrogen/hydrocarbon photochemical smog,
 * with subtle polar darkening hood.
 */
export function getTitanTexture(): THREE.CanvasTexture {
  const cacheKey = 'titan_cassini_v4';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    const lat = (v - 0.5) * Math.PI;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const haze = fbm(u * 8, v * 6, 3, 411);

      // Dense golden-orange tholin haze
      let r = 230 + haze * 20;
      let g = 150 + haze * 20;
      let b = 50 + haze * 15;

      // North polar hood darkening
      if (lat > 0.8) {
        const polar = (lat - 0.8) / 0.77;
        r -= Math.floor(45 * polar);
        g -= Math.floor(35 * polar);
        b -= Math.floor(15 * polar);
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Pluto Surface (New Horizons LORRI / Ralph):
 * Iconic bright heart-shaped nitrogen ice sheet (Tombaugh Regio / Sputnik Planitia),
 * dark equatorial reddish-brown tholin belts (Cthulhu Macula), and cratered uplands.
 */
export function getPlutoTexture(): THREE.CanvasTexture {
  const cacheKey = 'pluto_new_horizons_v7';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // New Horizons Tombaugh Regio center (Heart)
  const heartU = 0.50;
  const heartV = 0.48;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      const terrain = fbm(u * 12, v * 12, 4, 303);
      const detail = fbm(u * 32, v * 32, 3, 404);

      // Base ancient bedrock: soft warm tan-grey [162, 138, 118]
      let r = 162 + terrain * 30 + detail * 10;
      let g = 138 + terrain * 25 + detail * 8;
      let b = 118 + terrain * 20 + detail * 6;

      // Equatorial dark tholin band: Cthulhu Macula ("The Whale")
      // Deep reddish-chocolate organic tholin molecules
      if (Math.abs(v - 0.60) < 0.18 && (u < 0.42 || u > 0.62)) {
        const tholinEdge = Math.min(1.0, (0.18 - Math.abs(v - 0.60)) / 0.06);
        const tR = 92 + detail * 25;
        const tG = 42 + detail * 18;
        const tB = 28 + detail * 12;
        r = Math.floor(r * (1 - tholinEdge) + tR * tholinEdge);
        g = Math.floor(g * (1 - tholinEdge) + tG * tholinEdge);
        b = Math.floor(b * (1 - tholinEdge) + tB * tholinEdge);
      }

      // Sputnik Planitia: Western heart lobe (vast nitrogen glacier)
      const spU = (u - (heartU - 0.05)) * 1.5;
      const spV = (v - heartV) * 1.4;
      const spDist = Math.sqrt(spU * spU + spV * spV);

      // Eastern heart lobe (Blériot Fossae / upland ice sheet)
      const elU = (u - (heartU + 0.08)) * 1.7;
      const elV = (v - (heartV - 0.02)) * 1.6;
      const elDist = Math.sqrt(elU * elU + elV * elV);

      if (spDist < 0.17 || elDist < 0.14) {
        // Bright glistening nitrogen & carbon monoxide ice sheet
        // Convection cell network (20-30 km polygonal cells with dark boundary troughs)
        const cellNoise = Math.sin(u * 80) * Math.sin(v * 80);
        const cellCenter = Math.pow(Math.max(0, cellNoise), 0.7) * 18;
        const trough = cellNoise < -0.2 ? -12 : 0;

        const iceBrightness = 246 + cellCenter + trough;
        r = Math.min(255, Math.floor(iceBrightness));
        g = Math.min(255, Math.floor(iceBrightness * 0.96));
        b = Math.min(255, Math.floor(iceBrightness * 0.90));
      }
      // Water-ice mountain chains (Hillary Montes & Norgay Montes) bordering Sputnik Planitia
      else if (spDist >= 0.17 && spDist < 0.22 && u < heartU) {
        // Towering 4 km rugged water-ice peaks
        const peakNoise = fbm(u * 64, v * 64, 4, 505);
        r = Math.min(255, Math.floor(205 + peakNoise * 45));
        g = Math.min(255, Math.floor(190 + peakNoise * 40));
        b = Math.min(255, Math.floor(180 + peakNoise * 40));
      }
      // Northern polar mantle (Lowell Regio): pale golden-tan methane frosts
      else if (v < 0.30) {
        const frost = (0.30 - v) / 0.30;
        r = Math.min(255, Math.floor(r * (1 - frost * 0.5) + 225 * frost * 0.5));
        g = Math.min(255, Math.floor(g * (1 - frost * 0.5) + 195 * frost * 0.5));
        b = Math.min(255, Math.floor(b * (1 - frost * 0.5) + 155 * frost * 0.5));
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Moon Surface (NASA LRO standard):
 * Accurate lunar maria (Oceanus Procellarum, Mare Imbrium, Mare Tranquillitatis),
 * rugged anorthosite highlands, and Tycho crater with bright radial ray systems.
 */
export function getMoonTexture(): THREE.CanvasTexture {
  const cacheKey = 'moon_lro_v4';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Major Maria centers on near side (u ~ 0.25 to 0.65, v ~ 0.3 to 0.6)
  const mariaCenters = [
    { u: 0.38, v: 0.38, r: 0.15 }, // Mare Imbrium
    { u: 0.30, v: 0.48, r: 0.18 }, // Oceanus Procellarum
    { u: 0.52, v: 0.44, r: 0.12 }, // Mare Serenitatis
    { u: 0.56, v: 0.52, r: 0.12 }, // Mare Tranquillitatis
    { u: 0.64, v: 0.48, r: 0.08 }  // Mare Crisium
  ];

  // Tycho crater (South) with rays
  const tychoU = 0.46;
  const tychoV = 0.72;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      const highlands = fbm(u * 16, v * 16, 4, 71);
      const craters = fbm(u * 48, v * 48, 3, 93);

      // Base highland tone (anorthositic grey-white)
      let val = 155 + highlands * 65 + craters * 35;

      // Check maria
      for (const m of mariaCenters) {
        const du = Math.abs(u - m.u);
        const dv = Math.abs(v - m.v);
        const dist = Math.sqrt(du * du + dv * dv);
        if (dist < m.r) {
          const factor = 1 - dist / m.r;
          val = val * (1 - factor * 0.55) + 65 * factor;
        }
      }

      // Tycho Crater Ray System
      const tdu = u - tychoU;
      const tdv = v - tychoV;
      const tDist = Math.sqrt(tdu * tdu + tdv * tdv);
      if (tDist < 0.28) {
        const rayAngle = Math.atan2(tdv, tdu);
        const rayNoise = Math.abs(Math.sin(rayAngle * 12 + tDist * 40));
        if (rayNoise > 0.75) {
          const rayIntensity = (rayNoise - 0.75) / 0.25 * (1 - tDist / 0.28);
          val = Math.min(255, val + rayIntensity * 70);
        }
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(val));
      data[idx + 1] = Math.min(255, Math.floor(val));
      data[idx + 2] = Math.min(255, Math.floor(val * 1.02)); // Subtle titanium lunar blue-grey
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Mercury Surface (MESSENGER MDIS standard):
 * - Dark graphite-rich crust (Low Reflectance Material, LRM)
 * - Immense Caloris Basin with smooth volcanic orange-tan plains and mountain rim
 * - Brilliant rayed impact craters (Kuiper & Debussy) with radiating white-blue rays
 * - Pyroclastic explosive volcanic vents with warm halos
 */
export function getMercuryTexture(): THREE.CanvasTexture {
  const cacheKey = 'mercury_messenger_v5';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Caloris Basin location (~1550 km wide)
  const calorisU = 0.52;
  const calorisV = 0.42;

  // Rayed craters: Kuiper and Debussy
  const rayCraters = [
    { u: 0.28, v: 0.58, r: 0.025, rays: 14, reach: 0.32 }, // Debussy
    { u: 0.78, v: 0.38, r: 0.020, rays: 10, reach: 0.25 }  // Kuiper
  ];

  for (let y = 0; y < 512; y++) {
    const v = y / 512;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      const graphiteCrust = fbm(u * 14, v * 14, 4, 155);
      const craters = fbm(u * 44, v * 44, 4, 255);
      const scarps = smoothNoise(u * 60, v * 12, 88);

      // Distinctive dark charcoal-brown graphite silicate base: [105, 95, 85]
      let r = 90 + graphiteCrust * 45 + craters * 30;
      let g = 80 + graphiteCrust * 40 + craters * 25;
      let b = 70 + graphiteCrust * 35 + craters * 20;

      // Caloris Basin interior: warm orange-tan smooth volcanic flood plains
      const du = (u - calorisU) * 1.2;
      const dv = (v - calorisV) * 1.2;
      const cDist = Math.sqrt(du * du + dv * dv);

      if (cDist < 0.18) {
        if (cDist < 0.14) {
          // Smooth volcanic flood plains (warm tan/orange tones)
          const f = 1 - cDist / 0.14;
          r = Math.floor(r * (1 - f * 0.75) + 165 * f * 0.75);
          g = Math.floor(g * (1 - f * 0.75) + 130 * f * 0.75);
          b = Math.floor(b * (1 - f * 0.75) + 95 * f * 0.75);
        } else {
          // Caloris Montes mountain ring (bright rugged peaks)
          const mFactor = Math.sin((cDist - 0.14) / 0.04 * Math.PI);
          r += mFactor * 35;
          g += mFactor * 30;
          b += mFactor * 25;
        }
      }

      // Bright rayed craters (Debussy / Kuiper)
      for (const rc of rayCraters) {
        const rdu = u - rc.u;
        const rdv = v - rc.v;
        const rDist = Math.sqrt(rdu * rdu + rdv * rdv);
        if (rDist < rc.reach) {
          const angle = Math.atan2(rdv, rdu);
          const ray = Math.abs(Math.sin(angle * rc.rays + rDist * 35));
          if (ray > 0.70 || rDist < rc.r) {
            const intensity = rDist < rc.r
              ? 1.0
              : ((ray - 0.70) / 0.30) * Math.pow(1 - rDist / rc.reach, 1.2);
            r = Math.min(255, r + intensity * 95);
            g = Math.min(255, g + intensity * 95);
            b = Math.min(255, b + intensity * 110); // icy bright impact ejecta
          }
        }
      }

      // Thrust scarps (Discovery Rupes)
      if (scarps > 0.75 && Math.abs(v - 0.55) < 0.25) {
        r += 20;
        g += 18;
        b += 15;
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Venus Atmosphere (Pioneer Venus / Akatsuki UV & Visible Standard):
 * Rich creamy ivory-gold sulfuric acid clouds, distinct super-rotating chevron (Y-feature),
 * delicate ultraviolet absorption striations, and double-eyed polar vortices.
 */
export function getVenusTexture(): THREE.CanvasTexture {
  const cacheKey = 'venus_akatsuki_v5';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    const lat = (v - 0.5) * Math.PI;
    const absLat = Math.abs(lat);

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      // Super-rotating chevron wave distortion:
      // Equatorial cloud speeds reach 360 km/h, creating the iconic Y-shaped cloud chevron
      const chevron = Math.abs(lat) * 0.35 * Math.cos(u * Math.PI * 2);
      const shearU = u + chevron + Math.sin(v * 22) * 0.035;

      const clouds = fbm(shearU * 14, v * 12, 4, 188);
      const striations = fbm(shearU * 38, v * 20, 3, 299);

      // Creamy butter-gold base [244, 226, 185]
      // Subtle ultraviolet absorption bands: delicate amber-ochre [212, 178, 126]
      let r = 230 + clouds * 25;
      let g = 195 + clouds * 35;
      let b = 135 + clouds * 40;

      // Equatorial UV absorption chevron feature
      if (absLat < 0.32) {
        const eqFactor = (1 - absLat / 0.32) * (0.6 + striations * 0.4);
        r -= 18 * eqFactor;
        g -= 26 * eqFactor;
        b -= 32 * eqFactor;
      }
      // Bright reflective polar collar (cold sulfuric acid haze)
      else if (absLat > 0.85 && absLat < 1.25) {
        r = Math.min(255, r + 22);
        g = Math.min(255, g + 24);
        b = Math.min(255, b + 28);
      }
      // Dark polar vortex core
      else if (absLat >= 1.25) {
        r -= 25;
        g -= 30;
        b -= 25;
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Photorealistic Ceres Texture (NASA Dawn standard):
 * Dark carbonaceous chondrite surface, Occator Crater with glowing sodium carbonate salt deposits (Cerealia Facula),
 * and Ahuna Mons cryovolcanic dome.
 */
export function getCeresTexture(): THREE.CanvasTexture {
  const cacheKey = 'ceres_dawn_v5';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  // Occator Crater center (~20°N)
  const occatorU = 0.65;
  const occatorV = 0.38;

  for (let y = 0; y < 512; y++) {
    const v = y / 512;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      const regolith = fbm(u * 16, v * 16, 4, 119);
      const craters = fbm(u * 48, v * 48, 4, 229);

      // Dark carbonaceous regolith: [85, 82, 80]
      let r = 70 + regolith * 35 + craters * 30;
      let g = 68 + regolith * 35 + craters * 28;
      let b = 66 + regolith * 35 + craters * 28;

      // Occator Crater: bright sodium carbonate salts (Cerealia and Vinalia Faculae)
      const du = Math.abs(u - occatorU);
      const dv = Math.abs(v - occatorV);
      const oDist = Math.sqrt(du * du + dv * dv);

      if (oDist < 0.055) {
        if (oDist < 0.016) {
          // Cerealia Facula: blinding bright white salt dome
          r = 250;
          g = 250;
          b = 255;
        } else if (oDist < 0.040) {
          // Crater floor with secondary salt spots (Vinalia Faculae)
          const saltDots = smoothNoise(u * 120, v * 120, 99);
          if (saltDots > 0.65) {
            r = 230;
            g = 230;
            b = 240;
          } else {
            r = 55;
            g = 53;
            b = 52;
          }
        }
      }

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.min(255, Math.floor(r));
      data[idx + 1] = Math.min(255, Math.floor(g));
      data[idx + 2] = Math.min(255, Math.floor(b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Io Volcanic Texture: Sulfur yellow, white SO2 frosts, and black caldera lakes
 */
export function getIoTexture(): THREE.CanvasTexture {
  const cacheKey = 'io_volcanic_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;

      const sulfur = fbm(u * 14, v * 14, 4, 111);
      const calderas = fbm(u * 28, v * 28, 3, 222);

      const idx = (y * 1024 + x) * 4;

      if (calderas < 0.22) {
        // Black molten lava caldera pit
        data[idx] = 40;
        data[idx + 1] = 25;
        data[idx + 2] = 20;
      } else if (sulfur > 0.6) {
        // Brilliant sulfur yellow
        data[idx] = 245;
        data[idx + 1] = 210;
        data[idx + 2] = 25;
      } else if (sulfur < 0.35) {
        // Reddish sulfur allotropes
        data[idx] = 215;
        data[idx + 1] = 95;
        data[idx + 2] = 30;
      } else {
        // Pale sulfur dioxide snow
        data[idx] = 235;
        data[idx + 1] = 230;
        data[idx + 2] = 195;
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Europa Ice Shell with reddish-brown fracture lineae
 */
export function getEuropaTexture(): THREE.CanvasTexture {
  const cacheKey = 'europa_ice_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;

      const ice = fbm(u * 12, v * 12, 4, 333);
      const crack1 = Math.abs(Math.sin((u * 45 + v * 30) + Math.cos(u * 25) * 2));
      const crack2 = Math.abs(Math.cos((u * 38 - v * 28) + Math.sin(v * 18) * 2));
      const isCrack = crack1 < 0.08 || crack2 < 0.08;

      const idx = (y * 1024 + x) * 4;
      if (isCrack) {
        // Hydrated mineral salts along fractures
        data[idx] = 185;
        data[idx + 1] = 95;
        data[idx + 2] = 70;
      } else {
        // Pristine ice
        const val = 235 + Math.floor(ice * 20);
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = Math.min(255, val + 5);
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * Cratered Basalt (Moon / Mercury / Ceres)
 */
export function getCrateredTexture(isMercury: boolean = false): THREE.CanvasTexture {
  const cacheKey = isMercury ? 'mercury_v3' : 'moon_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;

      const maria = fbm(u * 5, v * 5, 3, 19);
      const craters = fbm(u * 32, v * 32, 4, 77);

      const idx = (y * 1024 + x) * 4;
      let val: number;

      if (!isMercury && maria < 0.42) {
        val = 80 + craters * 35; // Lunar maria
      } else {
        val = 150 + craters * 75; // Highlands
      }

      if (isMercury) {
        data[idx] = Math.floor(val * 1.05);
        data[idx + 1] = Math.floor(val * 0.98);
        data[idx + 2] = Math.floor(val * 0.92);
      } else {
        data[idx] = Math.floor(val);
        data[idx + 1] = Math.floor(val);
        data[idx + 2] = Math.floor(val * 1.02);
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

export function getGanymedeTexture(): THREE.CanvasTexture {
  const cacheKey = 'ganymede_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;
      const bedrock = fbm(u * 8, v * 8, 4, 101);
      const grooves = Math.abs(Math.sin(u * 48 + Math.sin(v * 24) * 2));
      const isGroove = grooves < 0.28;

      const idx = (y * 1024 + x) * 4;
      const val = isGroove ? 165 + bedrock * 65 : 85 + bedrock * 45;
      data[idx] = Math.floor(val);
      data[idx + 1] = Math.floor(val * 1.02);
      data[idx + 2] = Math.floor(val * 1.08);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

export function getCallistoTexture(): THREE.CanvasTexture {
  const cacheKey = 'callisto_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;
      const v = y / 512;
      const noise = fbm(u * 14, v * 14, 4, 202);
      const craters = fbm(u * 42, v * 42, 3, 303);
      const val = Math.min(255, 75 + noise * 60 + craters * 40);

      const idx = (y * 1024 + x) * 4;
      data[idx] = Math.floor(val);
      data[idx + 1] = Math.floor(val * 0.96);
      data[idx + 2] = Math.floor(val * 0.94);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

export function getEnceladusTexture(): THREE.CanvasTexture {
  const cacheKey = 'enceladus_v3';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const [canvas, ctx] = createBaseCanvas(1024, 512);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 512);

  // Blue-tinted South Pole tiger stripes
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(350 + i * 80, 440);
    ctx.bezierCurveTo(390 + i * 80, 460, 420 + i * 80, 490, 450 + i * 80, 505);
    ctx.stroke();
  }

  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}

/**
 * CLEAN, MAJESTIC NASA DEEP SPACE PANORAMA (4096 x 2048):
 * Replaced the messy noise with:
 * 1. Deep velvety obsidian black space (`#010207`).
 * 2. Silky, subtle Milky Way dust band with soft astronomical gradient (zero noisy clutter).
 * 3. 7,500 crisp, pinpoint sub-pixel stars (sharp points of real astronomical colors: diamond white, ice-blue, pale gold, warm amber).
 */
export function getStarfieldTexture(): THREE.CanvasTexture {
  const cacheKey = 'starfield_clean_nasa_v4';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 4096;
  const height = 2048;
  const [canvas, ctx] = createBaseCanvas(width, height);

  // 1. Deep obsidian black cosmic void
  ctx.fillStyle = '#010207';
  ctx.fillRect(0, 0, width, height);

  // 2. Smooth, ethereal Milky Way dust band (gentle soft gradients)
  const mwBand = ctx.createLinearGradient(0, height * 0.25, width, height * 0.75);
  mwBand.addColorStop(0.0, 'rgba(5, 8, 20, 0.0)');
  mwBand.addColorStop(0.35, 'rgba(18, 25, 48, 0.25)');
  mwBand.addColorStop(0.48, 'rgba(45, 55, 95, 0.45)'); // Core stream
  mwBand.addColorStop(0.52, 'rgba(55, 50, 85, 0.42)');
  mwBand.addColorStop(0.65, 'rgba(18, 25, 48, 0.25)');
  mwBand.addColorStop(1.0, 'rgba(5, 8, 20, 0.0)');

  ctx.fillStyle = mwBand;
  ctx.fillRect(0, 0, width, height);

  // Soft Galactic Bulge glow (Sagittarius A* center)
  const coreGrad = ctx.createRadialGradient(width * 0.52, height * 0.52, 0, width * 0.52, height * 0.52, 380);
  coreGrad.addColorStop(0.0, 'rgba(195, 175, 140, 0.35)');
  coreGrad.addColorStop(0.4, 'rgba(120, 110, 140, 0.18)');
  coreGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(width * 0.52, height * 0.52, 380, 0, Math.PI * 2);
  ctx.fill();

  // 3. Crisp, pinpoint astronomical stars
  const starColors = [
    '#ffffff', '#ffffff', '#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#fdba74', '#fca5a5'
  ];

  let seed = 4242;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Render 7,500 pinpoint stars
  for (let i = 0; i < 7500; i++) {
    const x = rand() * width;
    const y = rand() * height;

    const rRoll = rand();
    let radius: number;
    let alpha: number;

    if (rRoll > 0.992) {
      // 1st Magnitude Landmark Stars (Sirius, Canopus, Vega)
      radius = 1.4 + rand() * 0.6;
      alpha = 0.95;
    } else if (rRoll > 0.94) {
      // 2nd / 3rd Magnitude
      radius = 0.9 + rand() * 0.4;
      alpha = 0.8;
    } else if (rRoll > 0.75) {
      // 4th Magnitude
      radius = 0.6 + rand() * 0.3;
      alpha = 0.6;
    } else {
      // Faint pinpoint background stars
      radius = 0.35 + rand() * 0.2;
      alpha = 0.35 + rand() * 0.35;
    }

    const color = starColors[Math.floor(rand() * starColors.length)];

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Delicate optical cross diffraction spike on very few landmark stars
    if (rRoll > 0.995) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      const spike = radius * 4.5;
      ctx.beginPath();
      ctx.moveTo(x - spike, y);
      ctx.lineTo(x + spike, y);
      ctx.moveTo(x, y - spike);
      ctx.lineTo(x, y + spike);
      ctx.stroke();
    }
    ctx.restore();
  }

  const tex = wrapTexture(canvas);
  textureCache.set(cacheKey, tex);
  return tex;
}
