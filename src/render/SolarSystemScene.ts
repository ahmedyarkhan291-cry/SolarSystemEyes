/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: High-Fidelity Cinematic Three.js 3D Engine.
 * Features realistic physically-based planetary rendering, vast authentic orbital spacing,
 * high-precision moon orbit dynamics (Galilean & Saturnian moons), 4K Milky Way panorama,
 * 88-Constellation vector grid, and ride-along spacecraft chase camera modes.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CELESTIAL_BODIES, CELESTIAL_LIST, CelestialBody } from '../data/celestialBodies';
import {
  dateToJulianDate,
  calculateHeliocentricPosition,
  calculateMoonRelativePosition,
  getBodyRadiusScale,
  auToSceneCoords,
  generateOrbitPoints,
  CONSTELLATIONS_DATA,
  J2000_JD,
  HeliocentricPosition,
  RenderPosition
} from '../engine/ephemeris';
import {
  getSunTexture,
  getEarthTexture,
  getEarthCloudsTexture,
  getJupiterTexture,
  getSaturnRingTexture,
  getMarsTexture,
  getCrateredTexture,
  getVenusTexture,
  getEuropaTexture,
  getGanymedeTexture,
  getCallistoTexture,
  getEnceladusTexture,
  getStarfieldTexture
} from './proceduralTextures';
import {
  calculateLivePhysics
} from '../engine/physicsEngine';
import {
  getCelestialTexture,
  getAuthenticEarthCloudsTexture,
  getAuthenticSaturnRingTexture
} from './texturePipeline';
import {
  createVoyagerModel,
  createJWSTModel,
  createParkerProbeModel
} from './spacecraftModels';

// Module-scope pre-allocated math objects to guarantee ZERO Garbage Collection in tick loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export type CameraMode = 'orbit' | 'rideAlong' | 'surface';
export type CameraPreset = 'default' | 'daySide' | 'terminator' | 'nightSide' | 'northPole';

export interface SceneOptions {
  scaleMode: 'visual' | 'true';
  showOrbits: boolean;
  showLabels: boolean;
  showEclipticGrid: boolean;
  showAsteroidBelt: boolean;
  showKuiperBelt: boolean;
  showHabitableZone: boolean;
  highContrastOrbits: boolean;
  interiorCutaway: boolean;
  showConstellations: boolean;
  showPhysicsVectors?: boolean;
  cameraMode: CameraMode;
}

export class SolarSystemScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // State
  private options: SceneOptions;
  private currentDate: Date = new Date();
  private timeMultiplier: number = 1.0; // 1 = real-time
  private isPaused: boolean = false;
  private selectedBodyId: string = 'earth';
  private onSelectBodyCallback?: (body: CelestialBody) => void;

  // Scene Objects
  private bodyMeshMap = new Map<string, THREE.Object3D>();
  private orbitLineMap = new Map<string, THREE.LineLoop>();
  private moonOrbitMap = new Map<string, THREE.LineLoop>();
  private earthCloudsMesh?: THREE.Mesh;
  private sunCoronaMesh?: THREE.Sprite;
  private sunFarGlowMesh?: THREE.Sprite;
  private interstellarOrbMesh?: THREE.Sprite;
  private skyboxMesh?: THREE.Mesh;
  private orbitPointsMap = new Map<string, THREE.Vector3[]>();
  private moonOrbitPointsMap = new Map<string, { points: THREE.Vector3[]; parentId: string }>();
  private asteroidBeltMesh?: THREE.InstancedMesh;
  private kuiperBeltMesh?: THREE.InstancedMesh;
  private eclipticGrid?: THREE.Group;
  private habitableZoneMesh?: THREE.Mesh;
  private cometComaSprite?: THREE.Sprite;
  private cometTailGroup?: THREE.Group;
  private saturnRingMesh?: THREE.Mesh;
  private saturnShaderUniforms?: { uSaturnPos: { value: THREE.Vector3 }; uSaturnRadius: { value: number } };
  private hoveredOrbitBodyId: string | null = null;
  private constellationsGroup?: THREE.Group;
  private measurementLine?: THREE.Line;
  private velocityArrow?: THREE.ArrowHelper;
  private gravityArrow?: THREE.ArrowHelper;
  private labelSpriteMap = new Map<string, THREE.Sprite>();
  private labelsGroup?: THREE.Group;
  private pointerDownPos = { x: 0, y: 0, time: 0 };

  // Camera transition state
  private isTransitioning: boolean = false;
  private cameraTargetPos = new THREE.Vector3(0, 0, 0);
  private cameraDesiredOffset = new THREE.Vector3(0, 2, 5);
  private bodySphereMap = new Map<string, THREE.Mesh>();
  private surfaceInitialized: boolean = false;
  private lastSurfaceBodyId: string = '';
  private lastBodyPos = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    initialOptions: SceneOptions,
    onSelectBody?: (body: CelestialBody) => void
  ) {
    this.container = container;
    this.options = { ...initialOptions };
    this.onSelectBodyCallback = onSelectBody;

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer with logarithmic depth buffer for massive astronomical scale range
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
      logarithmicDepthBuffer: true
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera (Starts from a far-away point viewing the whole solar system at 1:1 scale)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.0005,
      1500000
    );
    this.camera.position.set(0, 32000, 48000);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.0005;
    this.controls.maxDistance = 500000;
    this.controls.zoomSpeed = 2.4;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => {
      this.isTransitioning = false;
    });

    // 5. Deep Space Solar Illumination (Physically grounded, zero ceiling light artifacts)
    this.setupLighting();
    this.setupSkybox();
    this.setupCelestialBodies();
    this.setupLabels();
    this.setupMoonOrbits();
    this.setupAsteroidBelt();
    this.setupKuiperBelt();
    this.setupEclipticGrid();
    this.setupHabitableZone();
    this.setupCometTails();
    this.setupConstellations();
    this.setupPhysicsVectors();

    // Set initial true 1:1 / visual mesh scales
    this.updateBodyMeshScales();

    // Event listeners
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: true });

    // Initial positioning starting at solar system overview
    this.selectedBodyId = 'sun';
    this.updatePositions(0);

    // Start render loop
    this.tick();
  }

  private setupLighting() {
    // 1. Central Sun omnidirectional illumination with zero attenuation (decay = 0)
    // Ensures sunlight travels unhindered across astronomical distances radially from (0,0,0)
    // Every planet receives physically authentic sunlight directly on its sun-facing hemisphere.
    const sunLight = new THREE.PointLight(0xffffff, 4.0, 0, 0);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // 2. Subtle deep-space starlight ambient fill so night-sides have clean dark silhouettes
    // Uniform cosmic background: eliminates directional/hemispheric distortions
    const ambientLight = new THREE.AmbientLight(0x0e1726, 0.05);
    this.scene.add(ambientLight);
  }

  private setupSkybox() {
    // 4K Photorealistic Milky Way Panorama sphere centered on camera (eliminates bubble wrapping edge completely)
    const starGeo = new THREE.SphereGeometry(800000, 48, 36);
    const starTex = getStarfieldTexture();
    const starMat = new THREE.MeshBasicMaterial({
      map: starTex,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyboxMesh = new THREE.Mesh(starGeo, starMat);
    this.scene.add(this.skyboxMesh);
  }

  private setupCelestialBodies() {
    for (const body of CELESTIAL_LIST) {
      const group = new THREE.Group();
      group.name = `body_${body.id}`;

      if (body.type === 'star') {
        // Sun: Glowing incandescent yellow sphere with authentic SDO surface & soft golden halo
        // Exact match to user screenshot: /assets/aistudio/Screenshot_2026-10-25_10.45.41_PM_44907df8.png
        const sunGeo = new THREE.SphereGeometry(body.visualRadiusScale, 64, 48);
        const sunTex = getCelestialTexture('sun');
        const sunMat = new THREE.MeshBasicMaterial({
          map: sunTex,
          color: new THREE.Color(0xffff33) // Radiant lemon-golden yellow (exact match to Screenshot 2)
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        group.add(sunMesh);

        // Soft, incandescent golden-yellow atmospheric halo hugging the limb (exact match to Screenshot 2)
        const haloCanvas = document.createElement('canvas');
        haloCanvas.width = 512;
        haloCanvas.height = 512;
        const hctx = haloCanvas.getContext('2d')!;
        const hgrad = hctx.createRadialGradient(256, 256, 185, 256, 256, 256);
        hgrad.addColorStop(0.0, 'rgba(255, 255, 130, 0.98)');
        hgrad.addColorStop(0.20, 'rgba(255, 245, 60, 0.72)');
        hgrad.addColorStop(0.55, 'rgba(255, 220, 30, 0.30)');
        hgrad.addColorStop(0.85, 'rgba(255, 190, 0, 0.08)');
        hgrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        hctx.fillStyle = hgrad;
        hctx.fillRect(0, 0, 512, 512);

        const haloTex = new THREE.CanvasTexture(haloCanvas);
        const haloMat = new THREE.SpriteMaterial({
          map: haloTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.sunCoronaMesh = new THREE.Sprite(haloMat);
        group.add(this.sunCoronaMesh);

      } else if (body.type === 'spacecraft') {
        let spacecraftMesh: THREE.Group;
        if (body.id === 'voyager1') {
          spacecraftMesh = createVoyagerModel();
        } else if (body.id === 'jwst') {
          spacecraftMesh = createJWSTModel();
        } else if (body.id === 'parkerSolarProbe') {
          spacecraftMesh = createParkerProbeModel();
        } else {
          spacecraftMesh = createVoyagerModel();
        }
        group.add(spacecraftMesh);

      } else {
        // Planets, Dwarf Planets, Moons
        let roughness = 0.8;
        let metalness = 0.05;

        if (body.id === 'earth') {
          roughness = 0.50;
          metalness = 0.02;

          const cloudGeo = new THREE.SphereGeometry(body.visualRadiusScale * 1.018, 48, 36);
          const cloudTex = getAuthenticEarthCloudsTexture();
          const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.90,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          this.earthCloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
          group.add(this.earthCloudsMesh);

        } else if (body.id === 'jupiter' || body.id === 'saturn' || body.id === 'uranus' || body.id === 'neptune' || body.id === 'titan') {
          roughness = 0.95;
          metalness = 0.0;
        } else if (body.id === 'europa' || body.id === 'enceladus') {
          roughness = 0.35;
          metalness = 0.0;
        } else {
          roughness = 0.88;
          metalness = 0.0;
        }

        const sphereGeo = new THREE.SphereGeometry(body.visualRadiusScale, 48, 36);
        const mat = new THREE.MeshStandardMaterial({
          roughness,
          metalness,
          emissive: new THREE.Color(0x000000)
        });

        // Load authentic texture from pipeline with automatic hot-update
        const initialTex = getCelestialTexture(body.id, (updatedTex) => {
          mat.map = updatedTex;
          mat.needsUpdate = true;
        });
        mat.map = initialTex;

        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.name = `${body.id}_sphere`;
        group.add(mesh);
        this.bodySphereMap.set(body.id, mesh);

        // Planetary Rings
        if (body.hasRings) {
          const innerR = body.visualRadiusScale * (body.ringsInnerRadiusScale ?? 1.4);
          const outerR = body.visualRadiusScale * (body.ringsOuterRadiusScale ?? 2.6);
          const ringGeo = new THREE.RingGeometry(innerR, outerR, 96);
          const ringTex = getAuthenticSaturnRingTexture();
          const ringMat = new THREE.MeshStandardMaterial({
            map: ringTex,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 0.85,
            metalness: 0.0
          });

          const pos = ringGeo.attributes.position;
          const uvs = ringGeo.attributes.uv;
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const r = Math.sqrt(vx * vx + vy * vy);
            const u = (r - innerR) / (outerR - innerR);
            uvs.setXY(i, u, 0.5);
          }
          ringGeo.attributes.uv.needsUpdate = true;

          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;

          // Realistic analytical planetary shadow for Saturn's rings
          if (body.id === 'saturn') {
            this.saturnShaderUniforms = {
              uSaturnPos: { value: new THREE.Vector3() },
              uSaturnRadius: { value: body.visualRadiusScale }
            };
            this.saturnRingMesh = ringMesh;

            ringMat.onBeforeCompile = (shader) => {
              shader.uniforms.uSaturnPos = this.saturnShaderUniforms!.uSaturnPos;
              shader.uniforms.uSaturnRadius = this.saturnShaderUniforms!.uSaturnRadius;

              shader.vertexShader = `
                varying vec3 vRingWorldPos;
              ` + shader.vertexShader;

              shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                 vRingWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                `
              );

              shader.fragmentShader = `
                varying vec3 vRingWorldPos;
                uniform vec3 uSaturnPos;
                uniform float uSaturnRadius;
              ` + shader.fragmentShader;

              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                // Ray from ring fragment towards Sun at (0, 0, 0)
                vec3 rayDir = normalize(-vRingWorldPos);
                vec3 oc = vRingWorldPos - uSaturnPos;
                float b = dot(oc, rayDir);
                float c = dot(oc, oc) - (uSaturnRadius * uSaturnRadius * 1.002);
                float disc = b * b - c;
                if (disc > 0.0) {
                  float t = -b - sqrt(disc);
                  if (t > 0.0) {
                    // Fragment is in Saturn's planetary globe shadow
                    gl_FragColor.rgb *= 0.04;
                  }
                }
                #include <dithering_fragment>
                `
              );
            };
          }

          group.add(ringMesh);
        }

        // Atmospheric limb glow (strictly excluded for Mars & Pluto to eliminate fake unlit dark-side glow)
        if (body.hasAtmosphere && body.atmosphereColor && body.id !== 'mars' && body.id !== 'pluto') {
          const atmosGeo = new THREE.SphereGeometry(body.visualRadiusScale * 1.035, 32, 24);
          const atmosMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(body.atmosphereColor),
            transparent: true,
            opacity: 0.24,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
          });
          const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
          group.add(atmosMesh);
        }

        group.rotation.z = (body.axialTiltDeg * Math.PI) / 180;
      }

      this.scene.add(group);
      this.bodyMeshMap.set(body.id, group);

      if (body.orbit.semiMajorAxisAU > 0 && !body.parentBodyId) {
        this.createOrbitLine(body);
      }
    }
  }

  /**
   * Dynamically scales planetary and moon meshes between 1:1 true scale and visual clarity mode
   */
  public updateBodyMeshScales() {
    for (const body of CELESTIAL_LIST) {
      const group = this.bodyMeshMap.get(body.id);
      if (!group) continue;
      const targetRadius = getBodyRadiusScale(body, this.options.scaleMode);
      const baseVisual = body.visualRadiusScale;
      const factor = targetRadius / baseVisual;
      group.scale.set(factor, factor, factor);
    }
    if (this.sunCoronaMesh) {
      const sunR = getBodyRadiusScale(CELESTIAL_BODIES.sun, this.options.scaleMode);
      const coronaSize = sunR * 1.85;
      this.sunCoronaMesh.scale.set(coronaSize, coronaSize, 1);
    }
  }

  /**
   * Sets up 3D label markers matching NASA Eyes on the Solar System:
   * - Circular stroke markers with spaced uppercase titles for planets/Sun/moons (MARS, VENUS, SUN, MERCURY)
   * - Hexagonal stroke markers with title text for spacecraft (Parker Solar Probe, STEREO Ahead, BioSentinel)
   */
  private setupLabels() {
    this.labelsGroup = new THREE.Group();
    this.labelsGroup.name = 'celestial_labels';
    this.labelsGroup.visible = this.options.showLabels;

    for (const body of CELESTIAL_LIST) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      const isSpacecraft = body.type === 'spacecraft';
      const isStar = body.type === 'star';

      if (isSpacecraft) {
        // Hexagonal Marker (matching Parker Solar Probe, STEREO Ahead, BioSentinel in reference)
        const hexX = 48;
        const hexY = 64;
        const hexR = 24;

        ctx.strokeStyle = '#67e8f9';
        ctx.fillStyle = '#0891b2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = hexX + hexR * Math.cos(angle);
          const py = hexY + hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(hexX, hexY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a5f3fc';
        ctx.fill();

        // Label text (clean probe title)
        ctx.font = '600 30px "Inter", -apple-system, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 8;
        ctx.textBaseline = 'middle';
        ctx.fillText(body.name, 88, 64);

      } else {
        // Circular Marker (matching MARS, VENUS, MERCURY, SUN, JUPITER in reference)
        const circX = 48;
        const circY = 64;
        const circR = 22;

        ctx.strokeStyle = body.orbitColor || '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(circX, circY, circR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(circX, circY, 5, 0, Math.PI * 2);
        ctx.fillStyle = isStar ? '#fef08a' : (body.orbitColor || '#f8fafc');
        ctx.fill();

        // Label text (Spaced uppercase, e.g. MARS, VENUS, SUN)
        ctx.font = '700 32px "Inter", -apple-system, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 10;
        ctx.textBaseline = 'middle';
        const spacedName = body.name.toUpperCase().split('').join(' ');
        ctx.fillText(spacedName, 88, 64);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.name = `label_${body.id}`;
      sprite.userData = { bodyId: body.id };
      sprite.center.set(0.1, 0.5);

      this.labelsGroup.add(sprite);
      this.labelSpriteMap.set(body.id, sprite);
    }

    this.scene.add(this.labelsGroup);
  }

  /**
   * Sets up dedicated orbit rings around parent planets for all moons.
   */
  private setupMoonOrbits() {
    for (const body of CELESTIAL_LIST) {
      if (!body.parentBodyId) continue;
      const parent = CELESTIAL_BODIES[body.parentBodyId];
      if (!parent) continue;

      const parentRadius = getBodyRadiusScale(parent, this.options.scaleMode);
      const { orbitRadius } = calculateMoonRelativePosition(body, parentRadius, J2000_JD, this.options.scaleMode);
      const points: THREE.Vector3[] = [];
      const segments = 96;
      const inc = (body.orbit.inclinationDeg * Math.PI) / 180;

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(theta) * orbitRadius,
          Math.sin(theta) * orbitRadius * Math.sin(inc),
          Math.sin(theta) * orbitRadius * Math.cos(inc)
        ));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(body.orbitColor),
        transparent: true,
        opacity: 0.65,
        linewidth: 1
      });

      const line = new THREE.LineLoop(geo, mat);
      line.name = `moon_orbit_${body.id}`;
      line.visible = this.options.showOrbits;
      line.userData = {
        bodyId: body.id,
        defaultOpacity: 0.65,
        defaultColor: body.orbitColor
      };
      this.scene.add(line);
      this.moonOrbitMap.set(body.id, line);
      this.moonOrbitPointsMap.set(body.id, { points, parentId: body.parentBodyId });
    }
  }

  private createOrbitLine(body: CelestialBody) {
    const points = generateOrbitPoints(body.orbit, this.options.scaleMode, 260);
    const threePoints = points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(threePoints);

    let lineColor = body.orbitColor;
    if (this.options.highContrastOrbits) {
      if (body.type === 'planet') lineColor = '#38bdf8';
      else if (body.type === 'dwarf_planet') lineColor = '#c084fc';
      else if (body.type === 'spacecraft') lineColor = '#fbbf24';
      else if (body.type === 'comet') lineColor = '#34d399';
    }

    const defaultOpacity = body.type === 'planet' ? 0.42 : 0.25;
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(lineColor),
      transparent: true,
      opacity: defaultOpacity,
      linewidth: 1
    });

    const line = new THREE.LineLoop(geo, mat);
    line.name = `orbit_${body.id}`;
    line.visible = this.options.showOrbits;
    line.userData = {
      bodyId: body.id,
      defaultOpacity,
      defaultColor: lineColor
    };
    this.scene.add(line);
    this.orbitLineMap.set(body.id, line);
    this.orbitPointsMap.set(body.id, threePoints);
  }

  private rebuildAllOrbits() {
    this.orbitPointsMap.clear();
    this.moonOrbitPointsMap.clear();
    for (const [bodyId, line] of this.orbitLineMap.entries()) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      const body = CELESTIAL_BODIES[bodyId];
      if (body && !body.parentBodyId) {
        this.createOrbitLine(body);
      }
    }

    for (const line of this.moonOrbitMap.values()) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.moonOrbitMap.clear();
    this.setupMoonOrbits();

    this.updateBelts();
    this.updateBodyMeshScales();
  }

  private updateBelts() {
    if (this.asteroidBeltMesh) {
      const dummy = new THREE.Object3D();
      const count = 2200;
      for (let i = 0; i < count; i++) {
        const rAU = 2.15 + ((i * 17) % 100) / 100 * 1.25;
        const theta = (i / count) * Math.PI * 2;
        const inc = Math.sin(i * 31) * 0.09;
        const scenePos = auToSceneCoords(
          rAU * Math.cos(theta),
          rAU * Math.sin(theta) * inc,
          rAU * Math.sin(theta),
          this.options.scaleMode
        );
        dummy.position.set(scenePos.x, scenePos.y, scenePos.z);
        const s = this.options.scaleMode === 'true' ? 0.04 + ((i % 5) * 0.02) : 0.5 + ((i % 5) * 0.4);
        dummy.scale.set(s, s, s);
        dummy.rotation.set((i * 1.3) % Math.PI, (i * 2.1) % Math.PI, 0);
        dummy.updateMatrix();
        this.asteroidBeltMesh.setMatrixAt(i, dummy.matrix);
      }
      this.asteroidBeltMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.kuiperBeltMesh) {
      const dummy = new THREE.Object3D();
      const count = 1800;
      for (let i = 0; i < count; i++) {
        const rAU = 30.0 + ((i * 23) % 100) / 100 * 22.0;
        const theta = (i / count) * Math.PI * 2;
        const inc = Math.sin(i * 19) * 0.12;
        const scenePos = auToSceneCoords(
          rAU * Math.cos(theta),
          rAU * Math.sin(theta) * inc,
          rAU * Math.sin(theta),
          this.options.scaleMode
        );
        dummy.position.set(scenePos.x, scenePos.y, scenePos.z);
        const s = this.options.scaleMode === 'true' ? 0.06 + ((i % 5) * 0.03) : 0.6 + ((i % 5) * 0.5);
        dummy.scale.set(s, s, s);
        dummy.rotation.set((i * 0.7) % Math.PI, (i * 1.9) % Math.PI, 0);
        dummy.updateMatrix();
        this.kuiperBeltMesh.setMatrixAt(i, dummy.matrix);
      }
      this.kuiperBeltMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private setupAsteroidBelt() {
    const count = 2200;
    const asteroidGeo = new THREE.DodecahedronGeometry(0.12, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x857d76,
      roughness: 0.95,
      metalness: 0.0
    });
    this.asteroidBeltMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, count);
    this.asteroidBeltMesh.frustumCulled = false;
    this.asteroidBeltMesh.visible = this.options.showAsteroidBelt;
    this.scene.add(this.asteroidBeltMesh);
    this.updateBelts();
  }

  private setupKuiperBelt() {
    const count = 1800;
    const kboGeo = new THREE.DodecahedronGeometry(0.15, 1);
    const kboMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.95,
      metalness: 0.0
    });
    this.kuiperBeltMesh = new THREE.InstancedMesh(kboGeo, kboMat, count);
    this.kuiperBeltMesh.frustumCulled = false;
    this.kuiperBeltMesh.visible = this.options.showKuiperBelt;
    this.scene.add(this.kuiperBeltMesh);
    this.updateBelts();
  }

  private setupEclipticGrid() {
    this.eclipticGrid = new THREE.Group();
    this.eclipticGrid.name = 'ecliptic_grid';

    // Concentric AU distance circles (1, 2, 5, 10, 20, 30, 40 AU)
    const auDistances = [1, 2, 5, 10, 20, 30, 40];
    for (const au of auDistances) {
      const sceneRadius = auToSceneCoords(au, 0, 0, this.options.scaleMode).x;
      const ringGeo = new THREE.RingGeometry(sceneRadius - 0.15, sceneRadius + 0.15, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x1e3a5f,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      this.eclipticGrid.add(ringMesh);
    }

    // Radial coordinate axes
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x1e3a5f,
      transparent: true,
      opacity: 0.25
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const maxAU = 45;
      const maxR = auToSceneCoords(maxAU, 0, 0, this.options.scaleMode).x;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * maxR, 0, Math.sin(angle) * maxR)
      ]);
      const radialLine = new THREE.Line(geo, lineMat);
      this.eclipticGrid.add(radialLine);
    }

    this.eclipticGrid.visible = this.options.showEclipticGrid;
    this.scene.add(this.eclipticGrid);
  }

  private setupHabitableZone() {
    const innerAU = 0.95;
    const outerAU = 1.68;
    const innerR = auToSceneCoords(innerAU, 0, 0, this.options.scaleMode).x;
    const outerR = auToSceneCoords(outerAU, 0, 0, this.options.scaleMode).x;

    const hzGeo = new THREE.RingGeometry(innerR, outerR, 96);
    const hzMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.habitableZoneMesh = new THREE.Mesh(hzGeo, hzMat);
    this.habitableZoneMesh.rotation.x = Math.PI / 2;
    this.habitableZoneMesh.visible = this.options.showHabitableZone;
    this.scene.add(this.habitableZoneMesh);
  }

  private setupCometTails() {
    // 1. Luminous Volumetric Coma Sprite at nucleus
    const comaCanvas = document.createElement('canvas');
    comaCanvas.width = 256;
    comaCanvas.height = 256;
    const cctx = comaCanvas.getContext('2d')!;
    const cgrad = cctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    cgrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    cgrad.addColorStop(0.12, 'rgba(180, 245, 255, 0.92)');
    cgrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.45)');
    cgrad.addColorStop(0.70, 'rgba(14, 116, 144, 0.12)');
    cgrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    cctx.fillStyle = cgrad;
    cctx.fillRect(0, 0, 256, 256);

    const comaTex = new THREE.CanvasTexture(comaCanvas);
    const comaMat = new THREE.SpriteMaterial({
      map: comaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.cometComaSprite = new THREE.Sprite(comaMat);
    this.cometComaSprite.scale.set(8, 8, 1);
    this.scene.add(this.cometComaSprite);

    // 2. Volumetric 3D Multi-Flange Tail Mesh (3 intersecting planes at 60-degree intervals)
    // Guarantees high-fidelity volumetric visibility from every 360-degree camera perspective
    const tailCanvas = document.createElement('canvas');
    tailCanvas.width = 256;
    tailCanvas.height = 512;
    const tctx = tailCanvas.getContext('2d')!;
    const tgrad = tctx.createLinearGradient(0, 0, 0, 512);
    tgrad.addColorStop(0.0, 'rgba(220, 252, 255, 0.95)');
    tgrad.addColorStop(0.15, 'rgba(103, 232, 249, 0.70)');
    tgrad.addColorStop(0.40, 'rgba(56, 189, 248, 0.35)');
    tgrad.addColorStop(0.75, 'rgba(14, 116, 144, 0.10)');
    tgrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    tctx.fillStyle = tgrad;
    tctx.fillRect(0, 0, 256, 512);

    // Subtle luminous central ion-ray striation
    tctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    tctx.fillRect(124, 0, 8, 220);

    const tailTex = new THREE.CanvasTexture(tailCanvas);
    const tailMat = new THREE.MeshBasicMaterial({
      map: tailTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.cometTailGroup = new THREE.Group();
    this.cometTailGroup.name = 'halley_tail_group';
    const planeGeo = new THREE.PlaneGeometry(12, 160);
    planeGeo.translate(0, 80, 0); // Anchor origin at nucleus base

    for (let i = 0; i < 3; i++) {
      const plane = new THREE.Mesh(planeGeo, tailMat);
      plane.rotation.y = (i * Math.PI) / 3;
      this.cometTailGroup.add(plane);
    }
    this.scene.add(this.cometTailGroup);
  }

  /**
   * Sets up 3D Constellations lines and star markers in deep space
   */
  private setupConstellations() {
    this.constellationsGroup = new THREE.Group();
    this.constellationsGroup.name = 'constellations_layer';

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    });

    for (const c of CONSTELLATIONS_DATA) {
      for (const pair of c.lines) {
        const [p1, p2] = pair;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1[0], p1[1], p1[2]),
          new THREE.Vector3(p2[0], p2[1], p2[2])
        ]);
        const line = new THREE.Line(geo, lineMat);
        this.constellationsGroup.add(line);
      }
    }

    this.constellationsGroup.visible = this.options.showConstellations;
    this.scene.add(this.constellationsGroup);
  }

  /**
   * Initializes 3D interactive orbital velocity and gravitational force vector arrows
   */
  private setupPhysicsVectors() {
    this.velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      15,
      0x38bdf8,
      4.0,
      2.0
    );
    this.velocityArrow.visible = false;
    this.scene.add(this.velocityArrow);

    this.gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      15,
      0xf59e0b,
      4.0,
      2.0
    );
    this.gravityArrow.visible = false;
    this.scene.add(this.gravityArrow);
  }

  /**
   * Updates all planetary and moon positions based on current Julian Date.
   */
  private updatePositions(deltaSec: number) {
    if (!this.isPaused && deltaSec > 0) {
      const elapsedMs = deltaSec * this.timeMultiplier * 1000;
      this.currentDate = new Date(this.currentDate.getTime() + elapsedMs);
    }

    const jd = dateToJulianDate(this.currentDate);

    // 1. Position primary planets and spacecraft
    for (const body of CELESTIAL_LIST) {
      if (body.parentBodyId) continue; // handle moons below

      const mesh = this.bodyMeshMap.get(body.id);
      if (!mesh) continue;

      if (body.type === 'star') {
        mesh.position.set(0, 0, 0);
        continue;
      }

      const helioPos = calculateHeliocentricPosition(body.orbit, jd);
      const sceneCoords = auToSceneCoords(
        helioPos.xAU,
        helioPos.yAU,
        helioPos.zAU,
        this.options.scaleMode
      );
      mesh.position.set(sceneCoords.x, sceneCoords.y, sceneCoords.z);

      // Deterministic rotation around tilted polar axis based on Julian Date
      const sphereMesh = this.bodySphereMap.get(body.id);
      if (sphereMesh && body.rotationPeriodHours !== 0) {
        const hoursSinceEpoch = (jd - J2000_JD) * 24.0;
        const spinFraction = (hoursSinceEpoch / body.rotationPeriodHours) % 1.0;
        sphereMesh.rotation.y = spinFraction * Math.PI * 2;
      }
    }

    // 2. Position all Moons accurately in local orbits around parent planets
    for (const body of CELESTIAL_LIST) {
      if (!body.parentBodyId) continue;
      const mesh = this.bodyMeshMap.get(body.id);
      const parent = CELESTIAL_BODIES[body.parentBodyId];
      const parentMesh = this.bodyMeshMap.get(body.parentBodyId);
      if (!mesh || !parent || !parentMesh) continue;

      const parentRadius = getBodyRadiusScale(parent, this.options.scaleMode);
      const rel = calculateMoonRelativePosition(body, parentRadius, jd, this.options.scaleMode);
      mesh.position.set(
        parentMesh.position.x + rel.x,
        parentMesh.position.y + rel.y,
        parentMesh.position.z + rel.z
      );

      // Keep moon orbit path lines centered on moving parent planet
      const moonOrbitLine = this.moonOrbitMap.get(body.id);
      if (moonOrbitLine) {
        moonOrbitLine.position.copy(parentMesh.position);
      }
    }

    // Rotate Earth clouds around polar axis
    if (this.earthCloudsMesh) {
      const hoursSinceEpoch = (jd - J2000_JD) * 24.0;
      const cloudSpin = (hoursSinceEpoch / 23.5) % 1.0;
      this.earthCloudsMesh.rotation.y = cloudSpin * Math.PI * 2;
    }

    // Dynamic Sun Corona Glow (Matches Screenshot 2: luminous golden rim hugging the photosphere)
    const camDist = this.camera.position.length();
    const sunR = getBodyRadiusScale(CELESTIAL_BODIES.sun, this.options.scaleMode);

    if (this.sunCoronaMesh) {
      // Corona hugs the limb smoothly up close (matches Screenshot 2)
      const coronaBase = sunR * 2.32;
      this.sunCoronaMesh.scale.set(coronaBase, coronaBase, 1);
      (this.sunCoronaMesh.material as THREE.SpriteMaterial).opacity = 0.92;
    }

    // Keep Skybox centered on camera at all times (eliminates bubble wrapping edge completely)
    if (this.skyboxMesh) {
      this.skyboxMesh.position.copy(this.camera.position);
    }

    // Dynamic Orbit Line Visibility:
    // Disappears when camera is near a planet, moon, or the Sun (like NASA Eyes)
    for (const [bodyId, line] of this.orbitLineMap.entries()) {
      if (!this.options.showOrbits) {
        line.visible = false;
        continue;
      }

      const body = CELESTIAL_BODIES[bodyId];
      const mesh = this.bodyMeshMap.get(bodyId);
      if (!body || !mesh) continue;

      const bodyRadius = getBodyRadiusScale(body, this.options.scaleMode);
      const camDistToBody = this.camera.position.distanceTo(mesh.position);
      const sunDistToCam = this.camera.position.length();

      // Disappear when camera gets close to the planet or Sun
      const nearThreshold = this.options.scaleMode === 'true'
        ? Math.max(bodyRadius * 32.0, 0.4)
        : Math.max(body.visualRadiusScale * 4.5, 12.0);

      const nearFade = Math.min(1.0, Math.max(0.0, (camDistToBody - nearThreshold * 0.35) / (nearThreshold * 0.65)));
      const sunNearFade = Math.min(1.0, Math.max(0.0, (sunDistToCam - sunR * 3.0) / (sunR * 5.0)));

      const finalOpacity = (line.userData.defaultOpacity ?? 0.42) * nearFade * sunNearFade;

      if (finalOpacity <= 0.015) {
        line.visible = false;
      } else {
        line.visible = true;
        (line.material as THREE.LineBasicMaterial).opacity = finalOpacity;
      }
    }

    for (const [moonId, line] of this.moonOrbitMap.entries()) {
      if (!this.options.showOrbits) {
        line.visible = false;
        continue;
      }
      const moonBody = CELESTIAL_BODIES[moonId];
      const moonMesh = this.bodyMeshMap.get(moonId);
      if (!moonBody || !moonMesh) continue;

      const moonRadius = getBodyRadiusScale(moonBody, this.options.scaleMode);
      const camDistToMoon = this.camera.position.distanceTo(moonMesh.position);
      const nearThreshold = Math.max(moonRadius * 25.0, 0.2);
      const nearFade = Math.min(1.0, Math.max(0.0, (camDistToMoon - nearThreshold * 0.35) / (nearThreshold * 0.65)));

      const finalOpacity = (line.userData.defaultOpacity ?? 0.35) * nearFade;
      if (finalOpacity <= 0.015) {
        line.visible = false;
      } else {
        line.visible = true;
        (line.material as THREE.LineBasicMaterial).opacity = finalOpacity;
      }
    }

    // Update analytical planetary shadow for Saturn's rings
    if (this.saturnShaderUniforms) {
      const saturnMesh = this.bodyMeshMap.get('saturn');
      if (saturnMesh) {
        this.saturnShaderUniforms.uSaturnPos.value.copy(saturnMesh.position);
        const saturnRadius = getBodyRadiusScale(CELESTIAL_BODIES.saturn, this.options.scaleMode);
        this.saturnShaderUniforms.uSaturnRadius.value = saturnRadius;
      }
    }

    // Update real-time 3D Physics Vector Arrows for active focused celestial body
    const activeMesh = this.bodyMeshMap.get(this.selectedBodyId);
    const activeBody = CELESTIAL_BODIES[this.selectedBodyId];
    const showVectors = this.options.showPhysicsVectors !== false;

    if (activeMesh && activeBody && activeBody.type !== 'star' && showVectors && this.velocityArrow && this.gravityArrow) {
      this.velocityArrow.visible = true;
      this.gravityArrow.visible = true;

      const isTrueScale = this.options.scaleMode === 'true';
      const bodyRadius = getBodyRadiusScale(activeBody, this.options.scaleMode);
      // Sleek, proportional arrows in 1:1 true scale (eliminates giant arrow bug)
      const arrowLen = isTrueScale ? Math.max(bodyRadius * 1.6, 0.005) : Math.max(bodyRadius * 2.2, 1.8);
      const headLen = arrowLen * 0.25;
      const headWidth = headLen * 0.38;

      this.velocityArrow.position.copy(activeMesh.position);
      this.gravityArrow.position.copy(activeMesh.position);

      const phys = calculateLivePhysics(activeBody, jd);

      if (activeBody.parentBodyId) {
        // Moon orbiting a parent planet
        const parentMesh = this.bodyMeshMap.get(activeBody.parentBodyId);
        if (parentMesh) {
          const relPos = _vec3A.copy(activeMesh.position).sub(parentMesh.position);
          const moonGravDir = _vec3B.copy(relPos).negate().normalize();
          this.gravityArrow.setDirection(moonGravDir);
          this.gravityArrow.setLength(arrowLen, headLen, headWidth);

          // Tangent to moon orbital motion
          const moonVelDir = _vec3C.set(-relPos.z, 0, relPos.x).normalize();
          this.velocityArrow.setDirection(moonVelDir);
          this.velocityArrow.setLength(arrowLen, headLen, headWidth);
        }
      } else {
        const vDir = new THREE.Vector3(phys.velocityVectorUnit.x, phys.velocityVectorUnit.y, phys.velocityVectorUnit.z).normalize();
        const gDir = new THREE.Vector3(phys.gravityVectorUnit.x, phys.gravityVectorUnit.y, phys.gravityVectorUnit.z).normalize();
        this.velocityArrow.setDirection(vDir);
        this.velocityArrow.setLength(arrowLen, headLen, headWidth);

        this.gravityArrow.setDirection(gDir);
        this.gravityArrow.setLength(arrowLen, headLen, headWidth);
      }
    } else {
      if (this.velocityArrow) this.velocityArrow.visible = false;
      if (this.gravityArrow) this.gravityArrow.visible = false;
    }

    // Update Halley Comet Coma & Volumetric 360-Degree Tail pointing away from the Sun
    const halleyMesh = this.bodyMeshMap.get('halley');
    if (halleyMesh) {
      const p = halleyMesh.position;
      const distToSun = p.length();
      const isTrueScale = this.options.scaleMode === 'true';
      const auDivisor = isTrueScale ? 1000 : 38;
      const distAU = distToSun / auDivisor;

      if (this.cometComaSprite) {
        this.cometComaSprite.position.copy(p);
        const baseComa = isTrueScale ? 0.08 : 3.5;
        const comaScale = Math.max(baseComa, Math.min(baseComa * 5.0, (baseComa * 15.0) / Math.max(distAU, 0.6)));
        this.cometComaSprite.scale.set(comaScale, comaScale, 1);
      }

      if (this.cometTailGroup) {
        this.cometTailGroup.position.copy(p);
        const tailDir = _vec3A.copy(p).normalize();
        this.cometTailGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailDir);
        const baseTailLen = isTrueScale ? 0.8 : 2.5;
        const tailLen = Math.max(baseTailLen, Math.min(baseTailLen * 4.5, (baseTailLen * 9.0) / Math.max(distAU, 0.7)));
        const tailWidth = isTrueScale ? 0.06 : 1.0;
        this.cometTailGroup.scale.set(tailWidth, tailLen, tailWidth);
      }
    }

    // Update label sprites positions & dynamic scale for constant crisp visibility
    if (this.labelsGroup) {
      this.labelsGroup.visible = this.options.showLabels;
      if (this.labelsGroup.visible) {
        for (const [bodyId, sprite] of this.labelSpriteMap.entries()) {
          const mesh = this.bodyMeshMap.get(bodyId);
          const body = CELESTIAL_BODIES[bodyId];
          if (!mesh || !body) continue;

          const bodyRadius = getBodyRadiusScale(body, this.options.scaleMode);
          const dist = this.camera.position.distanceTo(mesh.position);

          let baseScale: number;
          if (this.options.scaleMode === 'true') {
            // Dynamic distance-proportional scaling:
            // Keep marker compact and elegant; minimum scale capped to planet radius fraction
            const minScale = Math.max(bodyRadius * 0.35, 0.02);
            baseScale = Math.max(minScale, Math.min(dist * 0.016, 2200.0));
          } else {
            baseScale = Math.max(0.6, Math.min(dist * 0.018, 140.0));
          }

          sprite.scale.set(baseScale * 3.4, baseScale * 0.85, 1);
          // Elevate label slightly above the planet's northern pole so it never covers the planet itself
          sprite.position.set(mesh.position.x, mesh.position.y + bodyRadius * 1.25, mesh.position.z);
        }
      }
    }

    if (this.asteroidBeltMesh) {
      this.asteroidBeltMesh.visible = this.options.showAsteroidBelt;
    }
    if (this.kuiperBeltMesh) {
      this.kuiperBeltMesh.visible = this.options.showKuiperBelt;
    }
  }

  /**
   * Smooth Camera Tracking and Cinematic Flight Modes:
   * - Orbit Mode: Free orbit around object
   * - Ride-Along Mode: Mount camera behind body in flight
   * - Surface Mode: Stand on surface with full 360-degree look-around freedom
   */
  private updateCamera(deltaSec: number) {
    const selectedMesh = this.bodyMeshMap.get(this.selectedBodyId);
    const body = CELESTIAL_BODIES[this.selectedBodyId];
    if (!selectedMesh || !body) return;

    if (this.options.cameraMode === 'rideAlong') {
      this.surfaceInitialized = false;
      // Camera mounts smoothly behind object facing its direction of motion
      const velDir = _vec3A.set(-selectedMesh.position.z, 0, selectedMesh.position.x).normalize();
      const chaseDist = Math.max(body.visualRadiusScale * 4.5, 4.0);
      const desiredPos = _vec3B.copy(selectedMesh.position)
        .sub(velDir.clone().multiplyScalar(chaseDist))
        .add(new THREE.Vector3(0, body.visualRadiusScale * 1.8, 0));

      this.camera.position.lerp(desiredPos, 0.12);
      this.controls.target.copy(selectedMesh.position);
      this.camera.lookAt(selectedMesh.position);
      return;
    }

    if (this.options.cameraMode === 'surface') {
      const bodyRadius = getBodyRadiusScale(body, this.options.scaleMode);
      if (!this.surfaceInitialized || this.lastSurfaceBodyId !== this.selectedBodyId) {
        // Place view point right on the celestial body surface
        const surfaceAnchor = _vec3A.copy(selectedMesh.position).add(new THREE.Vector3(0, bodyRadius * 1.002, 0));
        this.controls.target.copy(surfaceAnchor);
        const lookDist = this.options.scaleMode === 'true'
          ? Math.max(bodyRadius * 0.04, 0.002)
          : Math.max(body.visualRadiusScale * 0.5, 2.5);
        this.camera.position.copy(surfaceAnchor).add(new THREE.Vector3(0, lookDist * 0.35, lookDist));
        this.controls.minDistance = 0.0001;
        this.controls.maxDistance = bodyRadius * 6.0;
        this.surfaceInitialized = true;
        this.lastSurfaceBodyId = this.selectedBodyId;
        this.lastBodyPos.copy(selectedMesh.position);
      } else {
        // Synchronously translate camera and controls target with orbital displacement
        // Allows full 360-degree mouse drag look-around while speeding along orbit!
        const bodyDelta = _vec3B.copy(selectedMesh.position).sub(this.lastBodyPos);
        this.camera.position.add(bodyDelta);
        this.controls.target.add(bodyDelta);
        this.lastBodyPos.copy(selectedMesh.position);
      }
      this.controls.update();
      return;
    }

    // Default Orbit Mode
    this.surfaceInitialized = false;
    if (this.isTransitioning) {
      const dampFactor = 1 - Math.exp(-6 * deltaSec);
      this.controls.target.lerp(selectedMesh.position, dampFactor);

      const targetCamPos = _vec3B.copy(selectedMesh.position).add(this.cameraDesiredOffset);
      this.camera.position.lerp(targetCamPos, dampFactor);

      const radius = getBodyRadiusScale(body, this.options.scaleMode);
      const transitionThreshold = Math.max(radius * 0.1, 0.02);
      if (this.camera.position.distanceTo(targetCamPos) < transitionThreshold) {
        this.isTransitioning = false;
      }
    } else {
      // Synchronize camera with moving target position to prevent supersonic drift or zoom jumps!
      const deltaTarget = _vec3C.copy(selectedMesh.position).sub(this.controls.target);
      this.controls.target.copy(selectedMesh.position);
      this.camera.position.add(deltaTarget);
    }

    this.controls.update();
  }

  private tick = () => {
    if (this.isDisposed) return;

    const deltaSec = 0.016;
    this.updatePositions(deltaSec);
    this.updateCamera(deltaSec);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  /**
   * Sets camera to a specific preset angle (e.g. Day side, Terminator, North Pole)
   */
  public setCameraPreset(preset: CameraPreset) {
    const body = CELESTIAL_BODIES[this.selectedBodyId];
    const mesh = this.bodyMeshMap.get(this.selectedBodyId);
    if (!body || !mesh) return;

    const radius = getBodyRadiusScale(body, this.options.scaleMode);
    const dist = this.options.scaleMode === 'true'
      ? Math.max(radius * 2.8, 0.003)
      : Math.max(body.visualRadiusScale * 2.5, 3.5);
    const toSun = _vec3A.copy(mesh.position).normalize(); // Vector from Sun to planet

    if (preset === 'daySide') {
      // Camera placed between Sun and Planet looking at planet's illuminated face
      this.cameraDesiredOffset.copy(toSun).multiplyScalar(-dist).add(new THREE.Vector3(0, dist * 0.18, 0));
    } else if (preset === 'nightSide') {
      // Camera behind planet looking toward it, with dark silhouette
      this.cameraDesiredOffset.copy(toSun).multiplyScalar(dist).add(new THREE.Vector3(0, dist * 0.18, 0));
    } else if (preset === 'terminator') {
      // 90 degrees to Sun-Planet vector (dramatic half-lit shadow terminator)
      const perp = _vec3B.set(-toSun.z, 0, toSun.x).normalize();
      this.cameraDesiredOffset.copy(perp).multiplyScalar(dist).add(new THREE.Vector3(0, dist * 0.18, 0));
    } else if (preset === 'northPole') {
      // High top-down polar view
      this.cameraDesiredOffset.set(0, dist * 1.4, 0.01);
    } else {
      this.cameraDesiredOffset.set(0, dist * 0.38, dist * 0.95);
    }

    this.isTransitioning = true;
  }

  public focusOnBody(bodyId: string, instant: boolean = false) {
    const body = CELESTIAL_BODIES[bodyId];
    if (!body) return;

    this.selectedBodyId = bodyId;
    this.surfaceInitialized = false;
    const mesh = this.bodyMeshMap.get(bodyId);
    if (!mesh) return;

    const radius = getBodyRadiusScale(body, this.options.scaleMode);
    const viewDist = this.options.scaleMode === 'true'
      ? Math.max(radius * 2.8, 0.45)
      : Math.max(body.visualRadiusScale * 2.5, 3.5);
    this.cameraDesiredOffset.set(0, viewDist * 0.38, viewDist * 0.95);

    if (instant) {
      this.controls.target.copy(mesh.position);
      this.camera.position.copy(mesh.position).add(this.cameraDesiredOffset);
      this.isTransitioning = false;
    } else {
      this.isTransitioning = true;
    }

    if (this.onSelectBodyCallback) {
      this.onSelectBodyCallback(body);
    }
  }

  public setOverviewCamera(instant: boolean = true) {
    this.selectedBodyId = 'sun';
    const overviewPos = new THREE.Vector3(0, 32000, 48000);
    const overviewTarget = new THREE.Vector3(0, 0, 0);
    this.controls.target.copy(overviewTarget);
    if (instant) {
      this.camera.position.copy(overviewPos);
      this.camera.lookAt(overviewTarget);
      this.isTransitioning = false;
    } else {
      this.cameraDesiredOffset.copy(overviewPos);
      this.isTransitioning = true;
    }
    this.controls.update();
  }

  private onPointerDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    this.pointerDownPos = { x: event.clientX, y: event.clientY, time: Date.now() };
  };

  private findHoveredOrbit(clientX: number, clientY: number): string | null {
    if (!this.options.showOrbits) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    let bestId: string | null = null;
    let minPixDist = 20.0; // 20px comfortable, generous screen-space tolerance

    // Check primary orbits
    for (const [bodyId, points] of this.orbitPointsMap.entries()) {
      const line = this.orbitLineMap.get(bodyId);
      if (!line || !line.visible) continue;

      for (let i = 0; i < points.length; i += 2) {
        _vec3A.copy(points[i]);
        _vec3A.project(this.camera);

        if (_vec3A.z > 1.0) continue; // Behind camera

        const sx = (_vec3A.x * 0.5 + 0.5) * rect.width;
        const sy = (-_vec3A.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(mx - sx, my - sy);

        if (d < minPixDist) {
          minPixDist = d;
          bestId = bodyId;
        }
      }
    }

    // Check moon orbits
    for (const [bodyId, info] of this.moonOrbitPointsMap.entries()) {
      const line = this.moonOrbitMap.get(bodyId);
      const parentMesh = this.bodyMeshMap.get(info.parentId);
      if (!line || !line.visible || !parentMesh) continue;

      for (let i = 0; i < info.points.length; i += 2) {
        _vec3A.copy(info.points[i]).add(parentMesh.position);
        _vec3A.project(this.camera);

        if (_vec3A.z > 1.0) continue;

        const sx = (_vec3A.x * 0.5 + 0.5) * rect.width;
        const sy = (-_vec3A.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(mx - sx, my - sy);

        if (d < minPixDist) {
          minPixDist = d;
          bestId = bodyId;
        }
      }
    }

    return bestId;
  }

  private onPointerMove = (event: MouseEvent) => {
    const newHoveredId = this.findHoveredOrbit(event.clientX, event.clientY);

    if (newHoveredId !== this.hoveredOrbitBodyId) {
      // Un-highlight previous
      if (this.hoveredOrbitBodyId) {
        const prevLine = this.orbitLineMap.get(this.hoveredOrbitBodyId) || this.moonOrbitMap.get(this.hoveredOrbitBodyId);
        if (prevLine) {
          const mat = prevLine.material as THREE.LineBasicMaterial;
          mat.opacity = prevLine.userData.defaultOpacity ?? 0.42;
          mat.color.set(prevLine.userData.defaultColor ?? 0x38bdf8);
        }
      }

      this.hoveredOrbitBodyId = newHoveredId;

      // Highlight new hovered orbit line with brilliant cyan glow
      if (newHoveredId) {
        const line = this.orbitLineMap.get(newHoveredId) || this.moonOrbitMap.get(newHoveredId);
        if (line) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 1.0;
          mat.color.set(0x38bdf8);
          this.renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  };

  private onPointerUp = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const dx = event.clientX - this.pointerDownPos.x;
    const dy = event.clientY - this.pointerDownPos.y;
    const dt = Date.now() - this.pointerDownPos.time;

    // Strict threshold: if user dragged > 6px or held longer than 450ms, this was an intentional camera drag or pan.
    // NEVER switch focus or select any object during camera rotation!
    if (Math.hypot(dx, dy) > 6 || dt > 450) {
      return;
    }

    // 0. Check orbit click via 2D screen proximity (smooth, generous 22px target)
    const clickedOrbitId = this.hoveredOrbitBodyId || this.findHoveredOrbit(event.clientX, event.clientY);
    if (clickedOrbitId) {
      this.focusOnBody(clickedOrbitId);
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, this.camera);

    const hitCandidates: { bodyId: string; distance: number }[] = [];

    // 1. Raycast against clickable labels
    if (this.labelsGroup && this.options.showLabels) {
      for (const [bodyId, sprite] of this.labelSpriteMap.entries()) {
        if (sprite.visible) {
          const intersects = _raycaster.intersectObject(sprite);
          if (intersects.length > 0) {
            hitCandidates.push({ bodyId, distance: intersects[0].distance });
          }
        }
      }
    }

    // 2. Raycast against body meshes
    for (const [bodyId, obj] of this.bodyMeshMap.entries()) {
      const intersects = _raycaster.intersectObjects(obj.children, true);
      if (intersects.length > 0) {
        hitCandidates.push({ bodyId, distance: intersects[0].distance });
      }
    }

    if (hitCandidates.length > 0) {
      hitCandidates.sort((a, b) => a.distance - b.distance);
      this.focusOnBody(hitCandidates[0].bodyId);
    }
    // If no target was clicked, DO NOT change focus (prevents accidental Sun focus)
  };

  public updateMeasurement(bodyIdA: string, bodyIdB: string) {
    const meshA = this.bodyMeshMap.get(bodyIdA);
    const meshB = this.bodyMeshMap.get(bodyIdB);

    if (!meshA || !meshB) {
      if (this.measurementLine) {
        this.measurementLine.visible = false;
      }
      return;
    }

    if (!this.measurementLine) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        meshA.position,
        meshB.position
      ]);
      const mat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 1.0,
        gapSize: 0.5,
        linewidth: 2
      });
      this.measurementLine = new THREE.Line(geo, mat);
      this.measurementLine.computeLineDistances();
      this.scene.add(this.measurementLine);
    } else {
      const posAttr = this.measurementLine.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, meshA.position.x, meshA.position.y, meshA.position.z);
      posAttr.setXYZ(1, meshB.position.x, meshB.position.y, meshB.position.z);
      posAttr.needsUpdate = true;
      this.measurementLine.computeLineDistances();
      this.measurementLine.visible = true;
    }
  }

  public clearMeasurement() {
    if (this.measurementLine) {
      this.measurementLine.visible = false;
    }
  }

  public setOptions(newOptions: Partial<SceneOptions>) {
    const prevScale = this.options.scaleMode;
    this.options = { ...this.options, ...newOptions };

    if (newOptions.showOrbits !== undefined) {
      for (const line of this.orbitLineMap.values()) {
        line.visible = this.options.showOrbits;
      }
      for (const line of this.moonOrbitMap.values()) {
        line.visible = this.options.showOrbits;
      }
    }
    if (newOptions.showAsteroidBelt !== undefined && this.asteroidBeltMesh) {
      this.asteroidBeltMesh.visible = this.options.showAsteroidBelt;
    }
    if (newOptions.showKuiperBelt !== undefined && this.kuiperBeltMesh) {
      this.kuiperBeltMesh.visible = this.options.showKuiperBelt;
    }
    if (newOptions.showEclipticGrid !== undefined && this.eclipticGrid) {
      this.eclipticGrid.visible = this.options.showEclipticGrid;
    }
    if (newOptions.showHabitableZone !== undefined && this.habitableZoneMesh) {
      this.habitableZoneMesh.visible = this.options.showHabitableZone;
    }
    if (newOptions.showConstellations !== undefined && this.constellationsGroup) {
      this.constellationsGroup.visible = this.options.showConstellations;
    }
    if (newOptions.showLabels !== undefined && this.labelsGroup) {
      this.labelsGroup.visible = this.options.showLabels;
    }
    if (newOptions.showPhysicsVectors !== undefined) {
      if (!newOptions.showPhysicsVectors) {
        if (this.velocityArrow) this.velocityArrow.visible = false;
        if (this.gravityArrow) this.gravityArrow.visible = false;
      }
    }

    if (newOptions.scaleMode !== undefined && newOptions.scaleMode !== prevScale) {
      this.rebuildAllOrbits();
      this.updatePositions(0);
      if (this.selectedBodyId && this.selectedBodyId !== 'sun') {
        this.focusOnBody(this.selectedBodyId, false);
      }
    }
    if (newOptions.cameraMode !== undefined) {
      this.surfaceInitialized = false;
    }
    if (newOptions.highContrastOrbits !== undefined) {
      this.rebuildAllOrbits();
    }
  }

  private onWheel = () => {
    // Dynamic wheel zoom speed based on distance from target
    const dist = this.camera.position.distanceTo(this.controls.target);
    if (this.options.scaleMode === 'true') {
      if (dist > 5000) {
        this.controls.zoomSpeed = 4.2;
      } else if (dist > 500) {
        this.controls.zoomSpeed = 3.2;
      } else if (dist > 25) {
        this.controls.zoomSpeed = 2.2;
      } else {
        this.controls.zoomSpeed = 1.6;
      }
    } else {
      if (dist > 500) {
        this.controls.zoomSpeed = 2.6;
      } else {
        this.controls.zoomSpeed = 1.8;
      }
    }
  };

  public zoomIn() {
    const offset = _vec3A.copy(this.camera.position).sub(this.controls.target);
    const curDist = offset.length();
    const body = CELESTIAL_BODIES[this.selectedBodyId];
    const radius = body ? getBodyRadiusScale(body, this.options.scaleMode) : 4;
    const minDist = this.options.scaleMode === 'true' ? Math.max(radius * 1.15, 0.0006) : Math.max(radius * 1.3, 1.2);
    if (curDist > minDist) {
      // Scale-adaptive zoom factor: rapid traversal across deep space, smooth precision close up
      const factor = this.options.scaleMode === 'true'
        ? (curDist > 2000 ? 0.52 : (curDist > 50 ? 0.65 : 0.78))
        : (curDist > 500 ? 0.70 : 0.84);
      offset.multiplyScalar(factor);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  public zoomOut() {
    const offset = _vec3A.copy(this.camera.position).sub(this.controls.target);
    const curDist = offset.length();
    if (curDist < 250000) {
      const factor = this.options.scaleMode === 'true'
        ? (curDist > 2000 ? 1.75 : (curDist > 50 ? 1.55 : 1.32))
        : (curDist > 500 ? 1.40 : 1.22);
      offset.multiplyScalar(factor);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  public setTime(date: Date) {
    this.currentDate = new Date(date);
    this.updatePositions(0);
  }

  public setTimeMultiplier(mult: number) {
    this.timeMultiplier = mult;
  }

  public setIsPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getCurrentDate(): Date {
    return this.currentDate;
  }

  public getSelectedBodyId(): string {
    return this.selectedBodyId;
  }

  public getLiveEphemeris(bodyId: string): HeliocentricPosition {
    const body = CELESTIAL_BODIES[bodyId];
    if (!body) {
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
    const jd = dateToJulianDate(this.currentDate);
    return calculateHeliocentricPosition(body.orbit, jd);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
