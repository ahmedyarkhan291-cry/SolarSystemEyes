/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Multi-component procedural 3D models for NASA spacecraft.
 * Follows 3-12 distinct part guidelines with contrasting PBR materials
 * (gold Kapton foil, white ceramic coatings, brushed metals, carbon composites).
 */

import * as THREE from 'three';

// Materials pool with high PBR fidelity
const goldFoilMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcc33,
  metalness: 0.9,
  roughness: 0.2,
});

const silverFoilMaterial = new THREE.MeshStandardMaterial({
  color: 0xdde5ed,
  metalness: 0.95,
  roughness: 0.15,
});

const carbonCompositeMaterial = new THREE.MeshStandardMaterial({
  color: 0x27272a,
  metalness: 0.3,
  roughness: 0.7,
});

const highGainDishMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  metalness: 0.1,
  roughness: 0.35,
});

const solarCellMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e3a8a,
  metalness: 0.8,
  roughness: 0.1,
});

const thrusterCopperMaterial = new THREE.MeshStandardMaterial({
  color: 0xb45309,
  metalness: 0.85,
  roughness: 0.35,
});

/**
 * Procedural Voyager 1 Model:
 * 1. 3.7m High-Gain Parabolic Reflector Dish
 * 2. Central sub-reflector tripod feed
 * 3. 10-sided main equipment bus electronics vault
 * 4. RTG Radioisotope Thermoelectric Generator power boom
 * 5. Three cylinder RTG heat units
 * 6. Science instrument scan platform
 * 7. 13-meter Magnetometer fiberglass boom
 * 8. Planetary Radio Astronomy whip antennas
 */
export function createVoyagerModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'spacecraft_voyager';

  // 1. High Gain Dish Antenna (Parabolic Lathe)
  const dishPoints: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = t * 1.8;
    const y = (r * r) * 0.18;
    dishPoints.push(new THREE.Vector2(r, y));
  }
  const dishGeo = new THREE.LatheGeometry(dishPoints, 24);
  const dishMesh = new THREE.Mesh(dishGeo, highGainDishMaterial);
  dishMesh.rotation.x = Math.PI; // pointing forward
  dishMesh.position.y = 0.5;
  group.add(dishMesh);

  // 2. Dish Sub-Reflector Feed Horn
  const feedGeo = new THREE.ConeGeometry(0.18, 0.45, 12);
  const feedMesh = new THREE.Mesh(feedGeo, silverFoilMaterial);
  feedMesh.position.y = 1.0;
  group.add(feedMesh);

  // 3. Central Equipment Bus (10-sided polygon cylinder)
  const busGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.55, 10);
  const busMesh = new THREE.Mesh(busGeo, goldFoilMaterial);
  busMesh.position.y = 0.15;
  group.add(busMesh);

  // 4. RTG Power Boom
  const rtgBoomGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
  const rtgBoom = new THREE.Mesh(rtgBoomGeo, carbonCompositeMaterial);
  rtgBoom.rotation.z = Math.PI / 2.8;
  rtgBoom.position.set(-1.0, 0.1, 0);
  group.add(rtgBoom);

  // 5. RTG Power Generators (3 canister array)
  for (let i = 0; i < 3; i++) {
    const canisterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12);
    const canister = new THREE.Mesh(canisterGeo, thrusterCopperMaterial);
    canister.position.set(-1.7 - i * 0.25, 0.5 + i * 0.12, 0);
    canister.rotation.z = Math.PI / 4;
    group.add(canister);
  }

  // 6. Science Scan Platform
  const scanPlatformGeo = new THREE.BoxGeometry(0.4, 0.35, 0.45);
  const scanPlatform = new THREE.Mesh(scanPlatformGeo, goldFoilMaterial);
  scanPlatform.position.set(1.2, 0.35, 0);
  group.add(scanPlatform);

  // 7. Long Magnetometer Boom
  const magBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.6, 6);
  const magBoom = new THREE.Mesh(magBoomGeo, silverFoilMaterial);
  magBoom.rotation.x = Math.PI / 2.2;
  magBoom.position.set(0, -0.2, 1.8);
  group.add(magBoom);

  // 8. Thruster clusters
  const thrusterGeo = new THREE.ConeGeometry(0.08, 0.18, 8);
  const thruster = new THREE.Mesh(thrusterGeo, thrusterCopperMaterial);
  thruster.rotation.x = Math.PI;
  thruster.position.set(0, -0.2, 0);
  group.add(thruster);

  group.scale.setScalar(0.4);
  return group;
}

/**
 * Procedural James Webb Space Telescope (JWST) Model:
 * 1. 5-Layer Kapton Diamond Sunshield
 * 2. Spacecraft Support Bus (warm side)
 * 3. Solar array wing
 * 4. Central Tower Assembly
 * 5. 18 Hexagonal Primary Mirror Segments (gold beryllium)
 * 6. Secondary Mirror Support Tripod
 * 7. Secondary Mirror Reflector
 * 8. Aft Deployable Flap
 */
export function createJWSTModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'spacecraft_jwst';

  // 1. Sunshield (layered diamond shape)
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 2.4);
  shieldShape.lineTo(1.1, 0.4);
  shieldShape.lineTo(0.9, -2.1);
  shieldShape.lineTo(-0.9, -2.1);
  shieldShape.lineTo(-1.1, 0.4);
  shieldShape.closePath();

  const shieldGeo = new THREE.ShapeGeometry(shieldShape);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
    side: THREE.DoubleSide
  });
  const sunshield = new THREE.Mesh(shieldGeo, shieldMat);
  sunshield.rotation.x = Math.PI / 2;
  group.add(sunshield);

  // 2. Warm-side Spacecraft Bus underneath
  const busGeo = new THREE.BoxGeometry(0.6, 0.35, 0.7);
  const bus = new THREE.Mesh(busGeo, silverFoilMaterial);
  bus.position.set(0, -0.25, -0.5);
  group.add(bus);

  // 3. Solar Panel Wing
  const solarGeo = new THREE.BoxGeometry(1.2, 0.04, 0.45);
  const solarPanel = new THREE.Mesh(solarGeo, solarCellMaterial);
  solarPanel.position.set(0, -0.3, -1.3);
  group.add(solarPanel);

  // 4. Central Tower Assembly
  const towerGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.6, 8);
  const tower = new THREE.Mesh(towerGeo, carbonCompositeMaterial);
  tower.position.set(0, 0.3, 0);
  group.add(tower);

  // 5. Hexagonal Gold Primary Mirror Array
  const mirrorGroup = new THREE.Group();
  const hexRadius = 0.24;
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const hx = hexRadius * Math.cos(angle);
    const hy = hexRadius * Math.sin(angle);
    if (i === 0) hexShape.moveTo(hx, hy);
    else hexShape.lineTo(hx, hy);
  }
  hexShape.closePath();
  const hexGeo = new THREE.ShapeGeometry(hexShape);

  // 18 mirror segments in two rings around center
  const ringOffsets = [
    [1, 0], [0.5, 0.866], [-0.5, 0.866], [-1, 0], [-0.5, -0.866], [0.5, -0.866],
    [2, 0], [1.5, 0.866], [1, 1.732], [0, 1.732], [-1, 1.732], [-1.5, 0.866],
    [-2, 0], [-1.5, -0.866], [-1, -1.732], [0, -1.732], [1, -1.732], [1.5, -0.866]
  ];

  ringOffsets.forEach(([ox, oy]) => {
    const mirrorSegment = new THREE.Mesh(hexGeo, goldFoilMaterial);
    mirrorSegment.position.set(ox * 0.42, oy * 0.42, 0);
    mirrorGroup.add(mirrorSegment);
  });

  mirrorGroup.position.set(0, 0.7, 0);
  group.add(mirrorGroup);

  // 6. Secondary Mirror Tripod Struts
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const strutGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6);
    const strut = new THREE.Mesh(strutGeo, carbonCompositeMaterial);
    strut.position.set(Math.cos(angle) * 0.5, 1.25, Math.sin(angle) * 0.5);
    strut.lookAt(0, 1.7, 0);
    group.add(strut);
  }

  // 7. Secondary Mirror Reflector
  const secMirrorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12);
  const secMirror = new THREE.Mesh(secMirrorGeo, goldFoilMaterial);
  secMirror.position.set(0, 1.7, 0);
  secMirror.rotation.x = Math.PI / 2;
  group.add(secMirror);

  group.scale.setScalar(0.4);
  return group;
}

/**
 * Procedural Parker Solar Probe Model:
 * 1. Carbon-composite Thermal Protection System (TPS heat shield)
 * 2. Spacecraft body bus with gold multilayer insulation
 * 3. Actuated solar array wings angled backwards
 * 4. FIELDS electric antennas (high-temperature niobium alloy)
 * 5. Magnetometer boom and thrusters
 */
export function createParkerProbeModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'spacecraft_parker';

  // 1. Carbon Heat Shield (TPS)
  const shieldGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.12, 6);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Reflective white ceramic face facing the Sun
    roughness: 0.8,
    metalness: 0.1
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.x = Math.PI / 2;
  shield.position.z = 0.6;
  group.add(shield);

  // Back of heat shield (carbon graphite)
  const shieldBackGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.08, 6);
  const shieldBack = new THREE.Mesh(shieldBackGeo, carbonCompositeMaterial);
  shieldBack.rotation.x = Math.PI / 2;
  shieldBack.position.z = 0.5;
  group.add(shieldBack);

  // 2. Main Spacecraft Body
  const busGeo = new THREE.BoxGeometry(0.7, 0.6, 0.9);
  const bus = new THREE.Mesh(busGeo, goldFoilMaterial);
  bus.position.set(0, 0, 0);
  group.add(bus);

  // 3. Dual Solar Arrays (angled back to hide in the shield's shadow)
  const wingGeo = new THREE.BoxGeometry(0.8, 0.04, 0.4);
  const leftWing = new THREE.Mesh(wingGeo, solarCellMaterial);
  leftWing.position.set(-0.85, 0, -0.15);
  leftWing.rotation.y = 0.35;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, solarCellMaterial);
  rightWing.position.set(0.85, 0, -0.15);
  rightWing.rotation.y = -0.35;
  group.add(rightWing);

  // 4. FIELDS Whip Antennas extending past shield
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.8, 4);
    const ant = new THREE.Mesh(antGeo, thrusterCopperMaterial);
    ant.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0.4);
    ant.rotation.z = angle;
    ant.rotation.x = 0.3;
    group.add(ant);
  }

  // 5. Magnetometer Boom
  const boomGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6);
  const boom = new THREE.Mesh(boomGeo, carbonCompositeMaterial);
  boom.position.set(0, 0, -0.9);
  boom.rotation.x = Math.PI / 2;
  group.add(boom);

  group.scale.setScalar(0.4);
  return group;
}
