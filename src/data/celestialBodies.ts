/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authoritative celestial body and spacecraft data derived from NASA JPL Horizons,
 * NASA Planetary Fact Sheets, and NASA Exoplanet Archive.
 */

export type CelestialType = 'star' | 'planet' | 'dwarf_planet' | 'moon' | 'spacecraft' | 'comet' | 'asteroid' | 'exoplanet';

export interface OrbitalElements {
  semiMajorAxisAU: number; // a in Astronomical Units
  eccentricity: number;    // e (0 to 1)
  inclinationDeg: number;  // i in degrees
  longitudeOfAscendingNodeDeg: number; // Omega (capital Omega)
  argumentOfPeriapsisDeg: number;     // omega (lowercase omega)
  meanAnomalyAtEpochDeg: number;       // M0 at J2000 epoch (2000-01-01T12:00:00Z)
  orbitalPeriodDays: number;           // Orbital period in Earth days
  epochJD?: number;                    // Epoch in Julian Date (default J2000 = 2451545.0)
}

export interface InteriorLayer {
  name: string;
  depthKm: string;
  composition: string;
  color: string;
  description: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  displayName: string;
  type: CelestialType;
  category: 'Sun' | 'Inner Planets' | 'Gas Giants' | 'Ice Giants' | 'Dwarf Planets' | 'Moons' | 'Asteroids' | 'Comets' | 'Missions' | 'Exoplanets';
  parentBodyId?: string; // e.g., 'earth' for 'moon', 'jupiter' for 'io'
  
  // Physical parameters
  radiusKm: number;
  equatorialRadiusKm: number;
  massKg: string;
  massEarthRelative: number;
  gravityMps2: number;
  escapeVelocityKmS: number;
  densityGcm3: number;
  axialTiltDeg: number;
  rotationPeriodHours: number; // negative for retrograde
  meanTempC: number;
  albedo: number;
  
  // Visual representation
  visualRadiusScale: number; // scaled for 3D visibility
  baseColor: string;
  orbitColor: string;
  emissive?: boolean;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringsInnerRadiusScale?: number;
  ringsOuterRadiusScale?: number;
  
  // Science & Lore
  summary: string;
  atmosphereDescription: string;
  atmosphereComposition: { gas: string; percentage: number }[];
  explorationMissions: string[];
  interestingFacts: string[];
  interiorLayers: InteriorLayer[];
  nasaCitationUrl: string;
  
  // Orbital Elements
  orbit: OrbitalElements;
}

export const CELESTIAL_BODIES: Record<string, CelestialBody> = {
  sun: {
    id: 'sun',
    name: 'Sun',
    displayName: 'The Sun (Sol)',
    type: 'star',
    category: 'Sun',
    radiusKm: 696340,
    equatorialRadiusKm: 696340,
    massKg: '1.989 × 10^30',
    massEarthRelative: 333000,
    gravityMps2: 274.0,
    escapeVelocityKmS: 617.7,
    densityGcm3: 1.41,
    axialTiltDeg: 7.25,
    rotationPeriodHours: 609.12, // ~25.4 days
    meanTempC: 5505, // surface temp
    albedo: 0.0,
    visualRadiusScale: 16.0,
    baseColor: '#ffd000',
    orbitColor: '#ffffff',
    emissive: true,
    hasAtmosphere: true,
    atmosphereColor: '#ffaa33',
    summary: 'The yellow dwarf star at the center of our Solar System, comprising 99.86% of the total mass of the system. Powered by nuclear fusion converting 600 million tons of hydrogen into helium every second.',
    atmosphereDescription: 'Photosphere, chromosphere, and the dynamic million-degree corona expanding outward as the solar wind.',
    atmosphereComposition: [
      { gas: 'Hydrogen (H₂)', percentage: 73.46 },
      { gas: 'Helium (He)', percentage: 24.85 },
      { gas: 'Oxygen (O)', percentage: 0.77 },
      { gas: 'Carbon (C)', percentage: 0.29 },
      { gas: 'Iron (Fe)', percentage: 0.16 }
    ],
    explorationMissions: ['SOHO', 'Parker Solar Probe', 'Solar Orbiter', 'STEREO', 'SDO'],
    interestingFacts: [
      'The core temperature exceeds 15 million degrees Celsius (27 million °F).',
      'It takes between 100,000 to 1,000,000 years for photons generated in the core to reach the surface.',
      'Parker Solar Probe is the fastest human-made object, flying directly through the solar corona.'
    ],
    interiorLayers: [
      { name: 'Core', depthKm: '0 - 175,000 km', composition: 'Dense plasma; proton-proton thermonuclear fusion', color: '#ffffff', description: 'Reaches 15.7 million Kelvin, generating virtually all of the Sun\'s thermal and radiative power.' },
      { name: 'Radiative Zone', depthKm: '175,000 - 490,000 km', composition: 'Hydrogen and helium ions emitting photons', color: '#ffb703', description: 'Energy slowly travels outward via continuous absorption and re-emission of photons.' },
      { name: 'Convective Zone', depthKm: '490,000 - 696,000 km', composition: 'Turbulent plasma convection cells', color: '#fb8500', description: 'Superheated buoyant plasma plumes carry energy to the surface and sink as they cool.' },
      { name: 'Photosphere & Corona', depthKm: 'Surface & Outer Halo', composition: 'Magnetized rarefied plasma', color: '#ffea00', description: 'The visible light surface giving rise to sunspots, prominences, and coronal mass ejections.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/sun/',
    orbit: {
      semiMajorAxisAU: 0,
      eccentricity: 0,
      inclinationDeg: 0,
      longitudeOfAscendingNodeDeg: 0,
      argumentOfPeriapsisDeg: 0,
      meanAnomalyAtEpochDeg: 0,
      orbitalPeriodDays: 1
    }
  },

  mercury: {
    id: 'mercury',
    name: 'Mercury',
    displayName: 'Mercury',
    type: 'planet',
    category: 'Inner Planets',
    radiusKm: 2439.7,
    equatorialRadiusKm: 2439.7,
    massKg: '3.3011 × 10^23',
    massEarthRelative: 0.0553,
    gravityMps2: 3.7,
    escapeVelocityKmS: 4.25,
    densityGcm3: 5.43,
    axialTiltDeg: 0.034,
    rotationPeriodHours: 1407.6, // 58.6 days
    meanTempC: 167,
    albedo: 0.106,
    visualRadiusScale: 2.2,
    baseColor: '#a1a1aa',
    orbitColor: '#94a3b8',
    hasAtmosphere: false,
    summary: 'The smallest planet and closest to the Sun. A scarred, cratered rocky world with an enormous metallic iron core making up about 85% of the planet\'s total radius.',
    atmosphereDescription: 'Extremely tenuous surface-bound exosphere composed of atoms blasted off the surface by solar wind and micrometeorites.',
    atmosphereComposition: [
      { gas: 'Oxygen (O₂)', percentage: 42.0 },
      { gas: 'Sodium (Na)', percentage: 29.0 },
      { gas: 'Hydrogen (H₂)', percentage: 22.0 },
      { gas: 'Helium (He)', percentage: 6.0 }
    ],
    explorationMissions: ['Mariner 10', 'MESSENGER', 'BepiColombo (en route)'],
    interestingFacts: [
      'Mercury has a 3:2 spin-orbit resonance: rotating 3 times for every 2 orbits around the Sun.',
      'Day temperatures reach 430°C while night drops to -180°C, the highest temperature variation in the Solar System.',
      'Permanently shadowed polar craters harbor ancient water ice deposits despite proximity to the Sun.'
    ],
    interiorLayers: [
      { name: 'Metallic Core', depthKm: '0 - 2,000 km', composition: 'Iron-nickel alloy (partially molten)', color: '#d97706', description: 'Unusually massive iron core comprising 85% of Mercury\'s planetary radius.' },
      { name: 'Silicate Mantle', depthKm: '2,000 - 2,400 km', composition: 'Dense magnesium and iron silicates', color: '#78716c', description: 'A relatively thin shell of rock compressed over the giant metallic core.' },
      { name: 'Crust', depthKm: '0 - 40 km', composition: 'Porous impact-brecciated silicate crust', color: '#a8a29e', description: 'Covered with lobate scarps (cliffs) formed as the planet cooled and shrank.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/mercury/',
    orbit: {
      semiMajorAxisAU: 0.387098,
      eccentricity: 0.205630,
      inclinationDeg: 7.005,
      longitudeOfAscendingNodeDeg: 48.331,
      argumentOfPeriapsisDeg: 29.124,
      meanAnomalyAtEpochDeg: 174.796,
      orbitalPeriodDays: 87.969
    }
  },

  venus: {
    id: 'venus',
    name: 'Venus',
    displayName: 'Venus',
    type: 'planet',
    category: 'Inner Planets',
    radiusKm: 6051.8,
    equatorialRadiusKm: 6051.8,
    massKg: '4.8675 × 10^24',
    massEarthRelative: 0.815,
    gravityMps2: 8.87,
    escapeVelocityKmS: 10.36,
    densityGcm3: 5.243,
    axialTiltDeg: 177.36, // retrograde
    rotationPeriodHours: -5832.5, // 243 days retrograde
    meanTempC: 464,
    albedo: 0.689,
    visualRadiusScale: 3.8,
    baseColor: '#e0af68',
    orbitColor: '#f59e0b',
    hasAtmosphere: true,
    atmosphereColor: '#fef08a',
    summary: 'Earth\'s twin in size and mass, but enveloped in a crushing 92-bar atmosphere of carbon dioxide and sulfuric acid clouds causing a runaway greenhouse effect hotter than Mercury.',
    atmosphereDescription: 'Dense supercritical CO₂ atmosphere with permanent clouds of concentrated sulfuric acid droplets circulating at hurricane speeds.',
    atmosphereComposition: [
      { gas: 'Carbon Dioxide (CO₂)', percentage: 96.5 },
      { gas: 'Nitrogen (N₂)', percentage: 3.5 },
      { gas: 'Sulfur Dioxide (SO₂)', percentage: 0.015 }
    ],
    explorationMissions: ['Venera 7-14', 'Magellan', 'Venus Express', 'Akatsuki', 'DAVINCI / VERITAS (future)'],
    interestingFacts: [
      'Rotates backwards (retrograde) compared to most planets; on Venus the Sun rises in the west and sets in the east.',
      'Surface atmospheric pressure is equal to being 900 meters deep in Earth\'s ocean.',
      'Venus has thousands of volcanoes, and recent radar data reveals active volcanism today.'
    ],
    interiorLayers: [
      { name: 'Metallic Core', depthKm: '0 - 3,200 km', composition: 'Iron and nickel (likely solid or sluggishly convective)', color: '#b45309', description: 'Generates no intrinsic dynamo magnetic field due to slow planetary rotation.' },
      { name: 'Rocky Mantle', depthKm: '3,200 - 5,950 km', composition: 'Silicate minerals resembling Earth\'s mantle', color: '#9a3412', description: 'Undergoes periodic catastrophic volcanic resurfacing events.' },
      { name: 'Basaltic Crust', depthKm: '0 - 50 km', composition: 'Dense basaltic lava plains and tessera terrain', color: '#ea580c', description: 'Heavily altered by high surface heat and sulfurous volcanic vapors.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/venus/',
    orbit: {
      semiMajorAxisAU: 0.723332,
      eccentricity: 0.006773,
      inclinationDeg: 3.39458,
      longitudeOfAscendingNodeDeg: 76.680,
      argumentOfPeriapsisDeg: 54.884,
      meanAnomalyAtEpochDeg: 50.115,
      orbitalPeriodDays: 224.701
    }
  },

  earth: {
    id: 'earth',
    name: 'Earth',
    displayName: 'Earth (Terra)',
    type: 'planet',
    category: 'Inner Planets',
    radiusKm: 6371.0,
    equatorialRadiusKm: 6378.1,
    massKg: '5.9724 × 10^24',
    massEarthRelative: 1.0,
    gravityMps2: 9.807,
    escapeVelocityKmS: 11.186,
    densityGcm3: 5.514,
    axialTiltDeg: 23.44,
    rotationPeriodHours: 23.934,
    meanTempC: 15,
    albedo: 0.306,
    visualRadiusScale: 4.0,
    baseColor: '#2563eb',
    orbitColor: '#38bdf8',
    hasAtmosphere: true,
    atmosphereColor: '#60a5fa',
    summary: 'Our home planet and the only known world harboring abundant liquid surface water, plate tectonics, an oxygen-rich atmosphere, and thriving carbon-based life.',
    atmosphereDescription: 'Dynamic nitrogen-oxygen atmosphere sustaining the global hydrological cycle and protecting against solar radiation.',
    atmosphereComposition: [
      { gas: 'Nitrogen (N₂)', percentage: 78.08 },
      { gas: 'Oxygen (O₂)', percentage: 20.95 },
      { gas: 'Argon (Ar)', percentage: 0.93 },
      { gas: 'Carbon Dioxide (CO₂)', percentage: 0.042 },
      { gas: 'Water Vapor (H₂O)', percentage: 1.0 }
    ],
    explorationMissions: ['Terra', 'Aqua', 'Landsat', 'ISS', 'Hubble', 'PACE', 'SWOT'],
    interestingFacts: [
      'Earth is the only planet not named after a Greek or Roman deity.',
      'The liquid outer core produces a powerful magnetosphere that deflects dangerous cosmic rays and solar particles.',
      'Plate tectonics recycles crust and regulates climate over millions of years.'
    ],
    interiorLayers: [
      { name: 'Inner Core', depthKm: '5,150 - 6,371 km', composition: 'Solid crystalline iron-nickel alloy', color: '#fef08a', description: 'Under intense 3.6 million atmospheres of pressure, hotter than the surface of the Sun.' },
      { name: 'Outer Core', depthKm: '2,890 - 5,150 km', composition: 'Liquid convective iron-nickel-sulfur', color: '#f59e0b', description: 'The churning motion of liquid metal produces Earth\'s geomagnetic shield via geodynamo.' },
      { name: 'Mantle (Upper & Lower)', depthKm: '35 - 2,890 km', composition: 'Viscoelastic peridotite and bridgmanite rock', color: '#b45309', description: 'Thermal convection drives continental drift, ocean trench subduction, and mountain building.' },
      { name: 'Crust', depthKm: '5 - 70 km', composition: 'Granitic continental & basaltic oceanic rock', color: '#16a34a', description: 'Thin surface shell supporting all oceans, continents, and biological ecosystems.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/earth/',
    orbit: {
      semiMajorAxisAU: 1.000000,
      eccentricity: 0.0167086,
      inclinationDeg: 0.00005,
      longitudeOfAscendingNodeDeg: -11.26064,
      argumentOfPeriapsisDeg: 114.20783,
      meanAnomalyAtEpochDeg: 358.617,
      orbitalPeriodDays: 365.256
    }
  },

  moon: {
    id: 'moon',
    name: 'Moon',
    displayName: 'The Moon (Luna)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'earth',
    radiusKm: 1737.4,
    equatorialRadiusKm: 1738.1,
    massKg: '7.342 × 10^22',
    massEarthRelative: 0.0123,
    gravityMps2: 1.62,
    escapeVelocityKmS: 2.38,
    densityGcm3: 3.344,
    axialTiltDeg: 6.68,
    rotationPeriodHours: 655.72, // 27.32 days tidally locked
    meanTempC: -20,
    albedo: 0.12,
    visualRadiusScale: 1.1,
    baseColor: '#cbd5e1',
    orbitColor: '#94a3b8',
    summary: 'Earth\'s only natural satellite. Formed ~4.5 billion years ago from the debris of a giant impact between proto-Earth and a Mars-sized planet named Theia.',
    atmosphereDescription: 'Virtually non-existent exosphere of helium, argon, and sodium atoms.',
    atmosphereComposition: [
      { gas: 'Helium (He)', percentage: 33.0 },
      { gas: 'Argon (Ar)', percentage: 33.0 },
      { gas: 'Neon (Ne)', percentage: 33.0 }
    ],
    explorationMissions: ['Apollo 11-17', 'LRO', 'Chang\'e 1-6', 'Artemis (ongoing)', 'Chandrayaan-3'],
    interestingFacts: [
      'Tidally locked to Earth: the same "near side" face always points toward Earth.',
      'The Moon stabilizes Earth\'s axial tilt, preventing wild climatic swings over millions of years.',
      'South Pole-Aitken basin craters contain deep ice traps shadowed for billions of years.'
    ],
    interiorLayers: [
      { name: 'Metallic Core', depthKm: '0 - 350 km', composition: 'Iron-rich small metallic core', color: '#eab308', description: 'Tiny core only ~20% of lunar radius.' },
      { name: 'Lithospheric Mantle', depthKm: '350 - 1,700 km', composition: 'Dense pyroxene and olivine rock', color: '#71717a', description: 'Rigid solid mantle with shallow moonquakes induced by Earth tides.' },
      { name: 'Anorthositic Crust', depthKm: '0 - 50 km', composition: 'Highland anorthosite rock & mare basalt plains', color: '#94a3b8', description: 'The bright highlands are ancient feldspar crystals that floated atop the lunar magma ocean.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/moon/',
    orbit: {
      semiMajorAxisAU: 0.00257,
      eccentricity: 0.0549,
      inclinationDeg: 5.145,
      longitudeOfAscendingNodeDeg: 125.08,
      argumentOfPeriapsisDeg: 318.15,
      meanAnomalyAtEpochDeg: 115.3654,
      orbitalPeriodDays: 27.32166
    }
  },

  mars: {
    id: 'mars',
    name: 'Mars',
    displayName: 'Mars',
    type: 'planet',
    category: 'Inner Planets',
    radiusKm: 3389.5,
    equatorialRadiusKm: 3396.2,
    massKg: '6.4171 × 10^23',
    massEarthRelative: 0.107,
    gravityMps2: 3.72,
    escapeVelocityKmS: 5.03,
    densityGcm3: 3.934,
    axialTiltDeg: 25.19,
    rotationPeriodHours: 24.623, // 1 sol
    meanTempC: -63,
    albedo: 0.170,
    visualRadiusScale: 2.6,
    baseColor: '#e06c43',
    orbitColor: '#ef4444',
    hasAtmosphere: true,
    atmosphereColor: '#fdba74',
    summary: 'The Red Planet, tinted by oxidized iron minerals on its surface. Host to Olympus Mons (the tallest volcano in the solar system) and Valles Marineris (a grand canyon spanning a quarter of the globe).',
    atmosphereDescription: 'Thin, low-pressure CO₂ atmosphere characterized by seasonal dust storms that can envelope the entire planet.',
    atmosphereComposition: [
      { gas: 'Carbon Dioxide (CO₂)', percentage: 95.32 },
      { gas: 'Nitrogen (N₂)', percentage: 2.6 },
      { gas: 'Argon (Ar)', percentage: 1.9 },
      { gas: 'Oxygen (O₂)', percentage: 0.13 }
    ],
    explorationMissions: ['Viking 1-2', 'Pathfinder', 'Spirit & Opportunity', 'Curiosity', 'Perseverance', 'Ingenuity Helicopter', 'MRO'],
    interestingFacts: [
      'Olympus Mons rises 21.9 km above datum, roughly 2.5 times Mount Everest\'s height.',
      'A Martian day ("sol") is 24 hours, 39 minutes, and 35 seconds, remarkably similar to Earth.',
      'Evidence from rovers proves ancient Mars possessed vast lakes, rivers, and organic molecules.'
    ],
    interiorLayers: [
      { name: 'Dense Core', depthKm: '0 - 1,830 km', composition: 'Iron-sulfur-nickel liquid core', color: '#ea580c', description: 'NASA InSight seismic data revealed Mars possesses a surprisingly large, liquid metallic core.' },
      { name: 'Silicate Mantle', depthKm: '1,830 - 3,340 km', composition: 'Iron-rich silicate rock (peridotite)', color: '#991b1b', description: 'Thick, non-convective mantle retaining remnant volcanic heat.' },
      { name: 'Crust', depthKm: '0 - 50 km', composition: 'Basaltic bedrock enriched in iron oxide', color: '#c2410c', description: 'Dichotomy between smooth northern lowlands and rugged, cratered southern highlands.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/mars/',
    orbit: {
      semiMajorAxisAU: 1.523662,
      eccentricity: 0.093412,
      inclinationDeg: 1.850,
      longitudeOfAscendingNodeDeg: 49.578,
      argumentOfPeriapsisDeg: 286.502,
      meanAnomalyAtEpochDeg: 19.373,
      orbitalPeriodDays: 686.980
    }
  },

  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    displayName: 'Jupiter (Jove)',
    type: 'planet',
    category: 'Gas Giants',
    radiusKm: 69911,
    equatorialRadiusKm: 71492,
    massKg: '1.8982 × 10^27',
    massEarthRelative: 317.8,
    gravityMps2: 24.79,
    escapeVelocityKmS: 59.5,
    densityGcm3: 1.326,
    axialTiltDeg: 3.13,
    rotationPeriodHours: 9.925, // shortest day
    meanTempC: -110,
    albedo: 0.538,
    visualRadiusScale: 12.0,
    baseColor: '#eab308',
    orbitColor: '#f59e0b',
    hasAtmosphere: true,
    atmosphereColor: '#fed7aa',
    hasRings: true,
    ringsInnerRadiusScale: 1.25,
    ringsOuterRadiusScale: 1.85,
    summary: 'The king of planets, more massive than all other Solar System planets combined. Famous for its vibrant banded cloud deck and the Great Red Spot—an anticyclonic storm raging for centuries.',
    atmosphereDescription: 'Thousands of kilometers of dynamic hydrogen-helium atmosphere whipped into counter-rotating jet streams with ammonia ice clouds.',
    atmosphereComposition: [
      { gas: 'Hydrogen (H₂)', percentage: 89.8 },
      { gas: 'Helium (He)', percentage: 10.2 },
      { gas: 'Methane (CH₄)', percentage: 0.3 },
      { gas: 'Ammonia (NH₃)', percentage: 0.026 }
    ],
    explorationMissions: ['Pioneer 10-11', 'Voyager 1-2', 'Galileo', 'Cassini', 'New Horizons', 'Juno (active)', 'JUICE (en route)', 'Europa Clipper'],
    interestingFacts: [
      'Rotates faster than any other planet, completing a full rotation in just 9 hours and 55 minutes.',
      'Possesses the strongest magnetic field of any planet, nearly 20,000 times stronger than Earth\'s.',
      'Has at least 95 recognized moons, including Ganymede (larger than the planet Mercury).'
    ],
    interiorLayers: [
      { name: 'Diffuse Heavy Element Core', depthKm: '0 - 15,000 km', composition: 'Dissolved rock and metallic ices', color: '#451a03', description: 'Juno gravity data discovered a "fuzzy" or dilute core mixed into the metallic mantle.' },
      { name: 'Metallic Liquid Hydrogen', depthKm: '15,000 - 55,000 km', composition: 'Electrically conducting liquid metallic hydrogen', color: '#d97706', description: 'Under extreme millions of atmospheres, hydrogen behaves like an electric liquid metal, driving Jupiter\'s colossal dynamo.' },
      { name: 'Molecular Liquid Hydrogen', depthKm: '55,000 - 68,000 km', composition: 'Supercritical liquid molecular hydrogen & helium', color: '#b45309', description: 'Helium rain precipitates out of hydrogen and drops towards the interior.' },
      { name: 'Visible Cloud Deck', depthKm: 'Outer 1,000 km', composition: 'Ammonia, ammonium hydrosulfide, and water clouds', color: '#f59e0b', description: 'The alternating light zones and dark belts with violent cyclones and anticyclones.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/jupiter/',
    orbit: {
      semiMajorAxisAU: 5.203363,
      eccentricity: 0.048393,
      inclinationDeg: 1.3053,
      longitudeOfAscendingNodeDeg: 100.556,
      argumentOfPeriapsisDeg: 273.867,
      meanAnomalyAtEpochDeg: 20.020,
      orbitalPeriodDays: 4332.589 // ~11.86 years
    }
  },

  saturn: {
    id: 'saturn',
    name: 'Saturn',
    displayName: 'Saturn (Cronus)',
    type: 'planet',
    category: 'Gas Giants',
    radiusKm: 58232,
    equatorialRadiusKm: 60268,
    massKg: '5.6834 × 10^26',
    massEarthRelative: 95.2,
    gravityMps2: 10.44,
    escapeVelocityKmS: 35.5,
    densityGcm3: 0.687, // less dense than water!
    axialTiltDeg: 26.73,
    rotationPeriodHours: 10.656,
    meanTempC: -140,
    albedo: 0.499,
    visualRadiusScale: 10.0,
    baseColor: '#fde047',
    orbitColor: '#eab308',
    hasAtmosphere: true,
    atmosphereColor: '#fef08a',
    hasRings: true,
    ringsInnerRadiusScale: 1.25,
    ringsOuterRadiusScale: 2.2,
    summary: 'The jewel of the solar system, encircled by a dazzling ring system of water ice particles. Saturn is so light that it would float in an ocean large enough to hold it.',
    atmosphereDescription: 'Pale golden atmosphere of hydrogen and helium, featuring a bizarre persistent hexagonal storm pattern spinning at its north pole.',
    atmosphereComposition: [
      { gas: 'Hydrogen (H₂)', percentage: 96.3 },
      { gas: 'Helium (He)', percentage: 3.25 },
      { gas: 'Methane (CH₄)', percentage: 0.45 }
    ],
    explorationMissions: ['Pioneer 11', 'Voyager 1-2', 'Cassini-Huygens', 'Dragonfly (future)'],
    interestingFacts: [
      'The rings span up to 282,000 km across, yet are astonishingly thin—often only 10 to 30 meters thick!',
      'Saturn has 146 recognized moons, led by Titan (with a dense nitrogen atmosphere and liquid methane lakes).',
      'The north polar vortex is a stable hexagonal jet stream spanning roughly 30,000 km across.'
    ],
    interiorLayers: [
      { name: 'Rock & Ice Core', depthKm: '0 - 12,000 km', composition: 'Silicate rocks and dense ice compounds', color: '#78350f', description: 'Core mass roughly 9 to 22 times Earth\'s mass.' },
      { name: 'Liquid Metallic Hydrogen', depthKm: '12,000 - 35,000 km', composition: 'Electrically conductive liquid metallic hydrogen', color: '#d97706', description: 'High-pressure conductive layer driving the planetary magnetic field.' },
      { name: 'Molecular Hydrogen & Helium', depthKm: '35,000 - 58,000 km', composition: 'Gaseous and liquid hydrogen with helium droplets', color: '#ca8a04', description: 'Helium rain releases gravitational energy as it sinks, warming the planet.' },
      { name: 'Atmosphere & Hexagon', depthKm: 'Outer 1,000 km', composition: 'Ammonia ice crystals and hydrocarbon haze', color: '#eab308', description: 'High-speed eastward equatorial jet streams reaching 1,800 km/h.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/saturn/',
    orbit: {
      semiMajorAxisAU: 9.537070,
      eccentricity: 0.054151,
      inclinationDeg: 2.484,
      longitudeOfAscendingNodeDeg: 113.715,
      argumentOfPeriapsisDeg: 339.392,
      meanAnomalyAtEpochDeg: 317.020,
      orbitalPeriodDays: 10759.22 // ~29.45 years
    }
  },

  uranus: {
    id: 'uranus',
    name: 'Uranus',
    displayName: 'Uranus',
    type: 'planet',
    category: 'Ice Giants',
    radiusKm: 25362,
    equatorialRadiusKm: 25559,
    massKg: '8.6810 × 10^25',
    massEarthRelative: 14.54,
    gravityMps2: 8.69,
    escapeVelocityKmS: 21.3,
    densityGcm3: 1.270,
    axialTiltDeg: 97.77, // rolls on its side!
    rotationPeriodHours: -17.24, // retrograde
    meanTempC: -195,
    albedo: 0.517,
    visualRadiusScale: 5.8,
    baseColor: '#67e8f9',
    orbitColor: '#06b6d4',
    hasAtmosphere: true,
    atmosphereColor: '#a5f3fc',
    hasRings: true,
    ringsInnerRadiusScale: 1.25,
    ringsOuterRadiusScale: 1.85,
    summary: 'The sideways ice giant. Uranus rotates almost completely on its side, rolling around the Sun with extreme 42-year seasons of continuous sunlight followed by 42 years of night.',
    atmosphereDescription: 'Coldest planetary atmosphere in the solar system, tinted pale cyan blue by methane absorption of red wavelengths.',
    atmosphereComposition: [
      { gas: 'Hydrogen (H₂)', percentage: 82.5 },
      { gas: 'Helium (He)', percentage: 15.2 },
      { gas: 'Methane (CH₄)', percentage: 2.3 }
    ],
    explorationMissions: ['Voyager 2 (1986 flyby)'],
    interestingFacts: [
      'The 98-degree axial tilt was likely caused by an ancient collision with an Earth-sized protoplanet.',
      'Unlike other giant planets, Uranus radiates very little internal heat into space.',
      'Surrounded by 13 distinct dark rings and 28 moons named after characters from Shakespeare and Alexander Pope.'
    ],
    interiorLayers: [
      { name: 'Rocky Core', depthKm: '0 - 5,000 km', composition: 'Iron, nickel, and silicate rock', color: '#164e63', description: 'Relatively small dense core under high pressure.' },
      { name: 'Icy Mantle', depthKm: '5,000 - 20,000 km', composition: 'Water, ammonia, and methane ices in superionic fluid state', color: '#0891b2', description: 'A hot, dense fluid slush of volatile molecules often called "water-ammonia oceans".' },
      { name: 'Hydrogen-Helium Atmosphere', depthKm: '20,000 - 25,300 km', composition: 'Hydrogen, helium, and methane clouds', color: '#22d3ee', description: 'Cold, featureless upper atmosphere with occasional methane storm systems.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/uranus/',
    orbit: {
      semiMajorAxisAU: 19.19126,
      eccentricity: 0.047168,
      inclinationDeg: 0.76986,
      longitudeOfAscendingNodeDeg: 74.22988,
      argumentOfPeriapsisDeg: 96.734,
      meanAnomalyAtEpochDeg: 142.955,
      orbitalPeriodDays: 30685.4 // ~84 years
    }
  },

  neptune: {
    id: 'neptune',
    name: 'Neptune',
    displayName: 'Neptune',
    type: 'planet',
    category: 'Ice Giants',
    radiusKm: 24622,
    equatorialRadiusKm: 24764,
    massKg: '1.0241 × 10^26',
    massEarthRelative: 17.15,
    gravityMps2: 11.15,
    escapeVelocityKmS: 23.5,
    densityGcm3: 1.638,
    axialTiltDeg: 28.32,
    rotationPeriodHours: 16.11,
    meanTempC: -201,
    albedo: 0.419,
    visualRadiusScale: 5.6,
    baseColor: '#2563eb',
    orbitColor: '#3b82f6',
    hasAtmosphere: true,
    atmosphereColor: '#60a5fa',
    hasRings: true,
    ringsInnerRadiusScale: 1.2,
    ringsOuterRadiusScale: 1.65,
    summary: 'The most distant major planet from the Sun. A vivid cobalt blue ice giant whipped by supersonic winds exceeding 2,100 km/h—the fastest atmospheric speeds measured in the Solar System.',
    atmosphereDescription: 'Vivid azure atmosphere with brilliant white high-altitude methane clouds and dark anticyclonic storms.',
    atmosphereComposition: [
      { gas: 'Hydrogen (H₂)', percentage: 80.0 },
      { gas: 'Helium (He)', percentage: 19.0 },
      { gas: 'Methane (CH₄)', percentage: 1.5 }
    ],
    explorationMissions: ['Voyager 2 (1989 flyby)'],
    interestingFacts: [
      'Winds on Neptune whip clouds along at over 2,100 km/h (1,300 mph), faster than the speed of sound on Earth.',
      'Triton, Neptune\'s largest moon, orbits backward (retrograde), indicating it was a captured Kuiper Belt object.',
      'Neptune was the first planet predicted mathematically by Urbain Le Verrier before ever being seen in a telescope.'
    ],
    interiorLayers: [
      { name: 'Silicate & Iron Core', depthKm: '0 - 5,500 km', composition: 'Iron, nickel, and silicates', color: '#1e3a8a', description: 'Dense terrestrial core with ~1.2 times Earth\'s mass.' },
      { name: 'Superionic Icy Mantle', depthKm: '5,500 - 21,000 km', composition: 'Superionic water, ammonia, methane slush ("diamond rain")', color: '#2563eb', description: 'Intense pressures may crystallize carbon into literal diamonds that sink through the mantle.' },
      { name: 'Upper Atmosphere', depthKm: '21,000 - 24,600 km', composition: 'Hydrogen, helium, and methane cirrus clouds', color: '#38bdf8', description: 'Driven by internal heat radiating 2.6 times more energy than received from the distant Sun.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/neptune/',
    orbit: {
      semiMajorAxisAU: 30.06896,
      eccentricity: 0.008586,
      inclinationDeg: 1.769,
      longitudeOfAscendingNodeDeg: 131.721,
      argumentOfPeriapsisDeg: 273.187,
      meanAnomalyAtEpochDeg: 260.247,
      orbitalPeriodDays: 60189.0 // ~164.8 years
    }
  },

  pluto: {
    id: 'pluto',
    name: 'Pluto',
    displayName: 'Pluto (134340 Pluto)',
    type: 'dwarf_planet',
    category: 'Dwarf Planets',
    radiusKm: 1188.3,
    equatorialRadiusKm: 1188.3,
    massKg: '1.303 × 10^22',
    massEarthRelative: 0.0022,
    gravityMps2: 0.62,
    escapeVelocityKmS: 1.21,
    densityGcm3: 1.854,
    axialTiltDeg: 122.53, // retrograde
    rotationPeriodHours: -153.29, // 6.38 days
    meanTempC: -230,
    albedo: 0.52,
    visualRadiusScale: 1.4,
    baseColor: '#f1f5f9',
    orbitColor: '#c084fc',
    hasAtmosphere: true,
    atmosphereColor: '#e9d5ff',
    summary: 'The famous dwarf planet in the Kuiper Belt. Up-close images from NASA\'s New Horizons probe revealed a geologically active world of towering water-ice mountains and the bright nitrogen-ice heart of Sputnik Planitia.',
    atmosphereDescription: 'Tenuous nitrogen atmosphere with blue haze layers that expands and collapses as Pluto travels along its eccentric orbit.',
    atmosphereComposition: [
      { gas: 'Nitrogen (N₂)', percentage: 99.0 },
      { gas: 'Methane (CH₄)', percentage: 0.5 },
      { gas: 'Carbon Monoxide (CO)', percentage: 0.5 }
    ],
    explorationMissions: ['New Horizons (historic 2015 flyby)'],
    interestingFacts: [
      'Pluto and its largest moon Charon orbit a common barycenter located outside Pluto itself (a true binary system).',
      'Sputnik Planitia is a vast glacier of nitrogen and carbon monoxide ice that actively churns by thermal convection.',
      'Pluto has an eccentric, tilted orbit that periodically brings it closer to the Sun than Neptune.'
    ],
    interiorLayers: [
      { name: 'Dense Rocky Core', depthKm: '0 - 850 km', composition: 'Silicate rocks and hydrated minerals', color: '#a855f7', description: 'Substantial rock core making up 70% of Pluto\'s mass.' },
      { name: 'Subsurface Liquid Ocean?', depthKm: '850 - 1,000 km', composition: 'Ammonia-rich liquid water ocean layer', color: '#6366f1', description: 'Evidence suggests an insulated liquid water ocean might persist beneath the ice shell.' },
      { name: 'Water Ice Crust & Nitrogen Glacier', depthKm: '1,000 - 1,188 km', composition: 'Rigid water-ice bedrock capped by volatile nitrogen ice', color: '#f8fafc', description: 'Hard water-ice mountains rising 3,500 meters above surrounding nitrogen plains.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/dwarf-planets/pluto/',
    orbit: {
      semiMajorAxisAU: 39.48168,
      eccentricity: 0.248807,
      inclinationDeg: 17.16,
      longitudeOfAscendingNodeDeg: 110.303,
      argumentOfPeriapsisDeg: 113.763,
      meanAnomalyAtEpochDeg: 14.53,
      orbitalPeriodDays: 90560 // ~248 years
    }
  },

  ceres: {
    id: 'ceres',
    name: 'Ceres',
    displayName: '1 Ceres',
    type: 'dwarf_planet',
    category: 'Dwarf Planets',
    radiusKm: 473,
    equatorialRadiusKm: 487,
    massKg: '9.38 × 10^20',
    massEarthRelative: 0.00015,
    gravityMps2: 0.28,
    escapeVelocityKmS: 0.51,
    densityGcm3: 2.16,
    axialTiltDeg: 4.0,
    rotationPeriodHours: 9.07,
    meanTempC: -105,
    albedo: 0.09,
    visualRadiusScale: 1.0,
    baseColor: '#71717a',
    orbitColor: '#a1a1aa',
    summary: 'The largest object in the Main Asteroid Belt, containing one third of the belt\'s total mass. NASA\'s Dawn mission discovered brilliant sodium carbonate salt deposits in Occator Crater and an icy, brine-rich crust.',
    atmosphereDescription: 'Transient water vapor exosphere produced when ice sublimates under sunlight.',
    atmosphereComposition: [
      { gas: 'Water vapor (H₂O)', percentage: 100 }
    ],
    explorationMissions: ['Dawn (orbited 2015-2018)'],
    interestingFacts: [
      'First asteroid discovered (by Giuseppe Piazzi on January 1, 1801).',
      'Ahuna Mons is a 4,000-meter-tall cryovolcano that erupted salty muddy brine.',
      'Ceres may have more water than all fresh water rivers and lakes on Earth combined.'
    ],
    interiorLayers: [
      { name: 'Rocky Silicate Core', depthKm: '0 - 350 km', composition: 'Hydrated silicates and carbonates', color: '#52525b', description: 'Partially differentiated core.' },
      { name: 'Ice & Salt Crust / Brine Reservoirs', depthKm: '350 - 473 km', composition: 'Water ice, phyllosilicates, and salt pockets', color: '#a1a1aa', description: 'Active cryo-magmatism leaves bright white sodium carbonate facets on crater floors.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/dwarf-planets/ceres/',
    orbit: {
      semiMajorAxisAU: 2.767,
      eccentricity: 0.0758,
      inclinationDeg: 10.59,
      longitudeOfAscendingNodeDeg: 80.329,
      argumentOfPeriapsisDeg: 73.597,
      meanAnomalyAtEpochDeg: 95.989,
      orbitalPeriodDays: 1682.0
    }
  },

  titan: {
    id: 'titan',
    name: 'Titan',
    displayName: 'Titan (Saturn VI)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'saturn',
    radiusKm: 2574.7,
    equatorialRadiusKm: 2574.7,
    massKg: '1.345 × 10^23',
    massEarthRelative: 0.0225,
    gravityMps2: 1.352,
    escapeVelocityKmS: 2.639,
    densityGcm3: 1.88,
    axialTiltDeg: 0.3,
    rotationPeriodHours: 382.68, // 15.94 days
    meanTempC: -179,
    albedo: 0.22,
    visualRadiusScale: 1.2,
    baseColor: '#fbbf24',
    orbitColor: '#f59e0b',
    hasAtmosphere: true,
    atmosphereColor: '#f59e0b',
    summary: 'Saturn\'s giant moon, larger than planet Mercury. The only moon in the Solar System with a thick atmosphere and standing bodies of liquid (lakes and seas of liquid methane and ethane).',
    atmosphereDescription: 'Dense orange nitrogen-methane photochemical smog 1.5 times denser than Earth\'s sea-level atmosphere.',
    atmosphereComposition: [
      { gas: 'Nitrogen (N₂)', percentage: 95.0 },
      { gas: 'Methane (CH₄)', percentage: 4.9 },
      { gas: 'Hydrogen (H₂)', percentage: 0.1 }
    ],
    explorationMissions: ['Voyager 1-2', 'Cassini-Huygens (landing 2005)', 'Dragonfly rotorcraft (future)'],
    interestingFacts: [
      'You could strap on artificial wings and fly through Titan\'s dense atmosphere with your own muscle power!',
      'Features a complete meteorological cycle of methane clouds, rainfall, rivers, and polar seas (Kraken Mare).',
      'Dragonfly mission will fly an 8-rotor drone across Titan\'s organic sand dunes in the 2030s.'
    ],
    interiorLayers: [
      { name: 'Silicate Core', depthKm: '0 - 1,800 km', composition: 'Silicate rock and iron', color: '#78350f', description: 'Central rocky foundation.' },
      { name: 'High-Pressure Ice & Subsurface Ocean', depthKm: '1,800 - 2,450 km', composition: 'Ammonia-water liquid ocean between high-pressure ice phases', color: '#0369a1', description: 'Deep salty ocean underlying the organic crust.' },
      { name: 'Water-Ice Crust & Methane Seas', depthKm: '2,450 - 2,575 km', composition: 'Rock-hard water ice bedrock carved by hydrocarbon rivers', color: '#f59e0b', description: 'Organic sand dunes and liquid methane seas.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/saturn/moons/titan/',
    orbit: {
      semiMajorAxisAU: 0.00817, // ~1,221,870 km from Saturn
      eccentricity: 0.0288,
      inclinationDeg: 0.348,
      longitudeOfAscendingNodeDeg: 168.8,
      argumentOfPeriapsisDeg: 180.0,
      meanAnomalyAtEpochDeg: 280.0,
      orbitalPeriodDays: 15.945
    }
  },

  io: {
    id: 'io',
    name: 'Io',
    displayName: 'Io (Jupiter I)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'jupiter',
    radiusKm: 1821.6,
    equatorialRadiusKm: 1821.6,
    massKg: '8.93 × 10^22',
    massEarthRelative: 0.015,
    gravityMps2: 1.796,
    escapeVelocityKmS: 2.56,
    densityGcm3: 3.528,
    axialTiltDeg: 0.0,
    rotationPeriodHours: 42.46, // 1.77 days
    meanTempC: -143,
    albedo: 0.63,
    visualRadiusScale: 0.9,
    baseColor: '#eab308',
    orbitColor: '#eab308',
    summary: 'The most volcanically active body in the Solar System. Locked in an orbital resonance with Europa and Ganymede, tidal friction drives over 400 active volcanoes spewing sulfur plumes hundreds of kilometers high.',
    atmosphereDescription: 'Tenuous sulfur dioxide atmosphere constantly replenished by volcanic eruptions.',
    atmosphereComposition: [
      { gas: 'Sulfur Dioxide (SO₂)', percentage: 90.0 },
      { gas: 'Sulfur Monoxide (SO)', percentage: 5.0 },
      { gas: 'Sodium (Na)', percentage: 3.0 }
    ],
    explorationMissions: ['Voyager 1-2', 'Galileo', 'Cassini', 'New Horizons', 'Juno (recent ultra-close flybys)'],
    interestingFacts: [
      'Io\'s volcanic plumes erupt at speeds of 1,000 m/s and reach altitudes over 500 km.',
      'Surface is continually resurfaced with sulfur compounds, resulting in its famous "pizza" appearance.',
      'Generates a 1-million-ampere electric current tube linking it directly to Jupiter\'s upper atmosphere.'
    ],
    interiorLayers: [
      { name: 'Metallic Core', depthKm: '0 - 900 km', composition: 'Iron and iron sulfide', color: '#b45309', description: 'Dense core accounting for 20% of mass.' },
      { name: 'Partially Molten Silicate Mantle', depthKm: '900 - 1,770 km', composition: 'Magma ocean / tidal heating mush', color: '#ef4444', description: 'Tidal friction continuously melts the mantle into vast reservoirs of basaltic magma.' },
      { name: 'Sulfur Crust', depthKm: '1,770 - 1,822 km', composition: 'Basalt lava and sulfur allotropes', color: '#eab308', description: 'Crust pierced by calderas and lakes of molten sulfur.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/jupiter/moons/io/',
    orbit: {
      semiMajorAxisAU: 0.00282, // ~421,700 km from Jupiter (5.9 R_jup)
      eccentricity: 0.0041,
      inclinationDeg: 0.05,
      longitudeOfAscendingNodeDeg: 0,
      argumentOfPeriapsisDeg: 0,
      meanAnomalyAtEpochDeg: 90,
      orbitalPeriodDays: 1.769
    }
  },

  europa: {
    id: 'europa',
    name: 'Europa',
    displayName: 'Europa (Jupiter II)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'jupiter',
    radiusKm: 1560.8,
    equatorialRadiusKm: 1560.8,
    massKg: '4.8 × 10^22',
    massEarthRelative: 0.008,
    gravityMps2: 1.315,
    escapeVelocityKmS: 2.025,
    densityGcm3: 3.013,
    axialTiltDeg: 0.1,
    rotationPeriodHours: 85.2, // 3.55 days
    meanTempC: -170,
    albedo: 0.67,
    visualRadiusScale: 0.85,
    baseColor: '#e2e8f0',
    orbitColor: '#38bdf8',
    summary: 'The premier target in the search for extraterrestrial habitability. Europa harbors a global liquid saltwater ocean containing more water than all Earth\'s oceans combined, concealed beneath an icy shell crisscrossed by reddish lineae fractures.',
    atmosphereDescription: 'Extremely thin oxygen exosphere produced by radiolysis of surface water ice.',
    atmosphereComposition: [
      { gas: 'Molecular Oxygen (O₂)', percentage: 100 }
    ],
    explorationMissions: ['Voyager 1-2', 'Galileo', 'New Horizons', 'Juno', 'Europa Clipper (launched Oct 2024)'],
    interestingFacts: [
      'The subsurface ocean is estimated to be 60 to 150 km deep beneath a 15 to 25 km ice crust.',
      'Tidal flexing from Jupiter keeps the interior warm through gravitational friction.',
      'Reddish lineae are rich in hydrated salts like magnesium sulfate, suggesting mineral-rich ocean water.'
    ],
    interiorLayers: [
      { name: 'Metallic Core', depthKm: '0 - 500 km', composition: 'Iron-nickel metallic core', color: '#ca8a04', description: 'Central metal core generating modest internal heat.' },
      { name: 'Silicate Mantle', depthKm: '500 - 1,400 km', composition: 'Rocky silicate mantle in contact with ocean floor', color: '#78716c', description: 'Direct contact with water allows hydrothermal vents, potential cradles of life.' },
      { name: 'Global Subsurface Ocean', depthKm: '1,400 - 1,540 km', composition: 'Liquid saltwater ocean (100 km deep)', color: '#0284c7', description: 'Vast reservoir with twice Earth\'s oceanic volume.' },
      { name: 'Ice Shell', depthKm: '1,540 - 1,560 km', composition: 'Water ice crust with tidal cracks', color: '#f1f5f9', description: 'Brittle exterior ice constantly fractured by orbital tidal flexing.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/jupiter/moons/europa/',
    orbit: {
      semiMajorAxisAU: 0.00448, // ~670,900 km from Jupiter (9.4 R_jup)
      eccentricity: 0.009,
      inclinationDeg: 0.47,
      longitudeOfAscendingNodeDeg: 219.1,
      argumentOfPeriapsisDeg: 66.3,
      meanAnomalyAtEpochDeg: 180.0,
      orbitalPeriodDays: 3.551
    }
  },

  ganymede: {
    id: 'ganymede',
    name: 'Ganymede',
    displayName: 'Ganymede (Jupiter III)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'jupiter',
    radiusKm: 2634.1,
    equatorialRadiusKm: 2634.1,
    massKg: '1.4819 × 10^23',
    massEarthRelative: 0.025,
    gravityMps2: 1.428,
    escapeVelocityKmS: 2.741,
    densityGcm3: 1.936,
    axialTiltDeg: 0.33,
    rotationPeriodHours: 171.7, // 7.15 days
    meanTempC: -163,
    albedo: 0.43,
    visualRadiusScale: 1.2,
    baseColor: '#94a3b8',
    orbitColor: '#a78bfa',
    summary: 'The largest moon in the Solar System, larger than planet Mercury and dwarf planet Pluto. It is the only known moon with its own intrinsic magnetic field generated by a liquid iron core.',
    atmosphereDescription: 'Tenuous molecular oxygen exosphere generated by solar radiation splitting water ice.',
    atmosphereComposition: [
      { gas: 'Oxygen (O₂)', percentage: 95.0 },
      { gas: 'Hydrogen (H₂)', percentage: 5.0 }
    ],
    explorationMissions: ['Pioneer 10', 'Voyager 1-2', 'Galileo', 'Juno', 'JUICE (scheduled orbit in 2034)'],
    interestingFacts: [
      'Has its own magnetic field, generating beautiful auroral ribbons near its north and south poles.',
      'Contains more water than all of Earth\'s oceans, layered between high-pressure ice phases.',
      'Surface shows stark contrast between dark cratered terrain and bright, grooved tectonic fractures.'
    ],
    interiorLayers: [
      { name: 'Liquid Iron Core', depthKm: '0 - 800 km', composition: 'Molten iron-nickel alloy', color: '#ea580c', description: 'Generates Ganymede\'s intrinsic magnetic shield.' },
      { name: 'Silicate Mantle', depthKm: '800 - 1,800 km', composition: 'Silicate rocky mantle', color: '#78716c', description: 'Rocky core surrounding the metallic dynamo.' },
      { name: 'Deep Subsurface Ocean & Ice Shell', depthKm: '1,800 - 2,634 km', composition: 'High-pressure ice VII sandwiches liquid saline water', color: '#38bdf8', description: 'Deep saltwater ocean capped by an icy grooved lithosphere.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/jupiter/moons/ganymede/',
    orbit: {
      semiMajorAxisAU: 0.00715, // ~1,070,400 km from Jupiter (15.0 R_jup)
      eccentricity: 0.0013,
      inclinationDeg: 0.20,
      longitudeOfAscendingNodeDeg: 63.5,
      argumentOfPeriapsisDeg: 192.4,
      meanAnomalyAtEpochDeg: 270.0,
      orbitalPeriodDays: 7.155
    }
  },

  callisto: {
    id: 'callisto',
    name: 'Callisto',
    displayName: 'Callisto (Jupiter IV)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'jupiter',
    radiusKm: 2410.3,
    equatorialRadiusKm: 2410.3,
    massKg: '1.0759 × 10^23',
    massEarthRelative: 0.018,
    gravityMps2: 1.235,
    escapeVelocityKmS: 2.440,
    densityGcm3: 1.834,
    axialTiltDeg: 0.0,
    rotationPeriodHours: 400.5, // 16.69 days
    meanTempC: -139,
    albedo: 0.22,
    visualRadiusScale: 1.1,
    baseColor: '#64748b',
    orbitColor: '#cbd5e1',
    summary: 'The outermost Galilean moon and the most heavily cratered object in the Solar System. Its surface is an ancient, dead ice-rock crust virtually unchanged for four billion years, featuring the colossal impact ring system of Valhalla.',
    atmosphereDescription: 'Very thin atmosphere of carbon dioxide and molecular oxygen.',
    atmosphereComposition: [
      { gas: 'Carbon Dioxide (CO₂)', percentage: 90.0 },
      { gas: 'Oxygen (O₂)', percentage: 10.0 }
    ],
    explorationMissions: ['Voyager 1-2', 'Galileo', 'Cassini flyby', 'New Horizons', 'JUICE (flybys)'],
    interestingFacts: [
      'Valhalla is the largest multi-ring impact basin known, spanning over 3,800 kilometers across.',
      'Experiences the lowest radiation levels of any Jovian moon, making it the safest candidate for a future human base.',
      'Partially differentiated: a relaxed mixture of rock and ice that never fully melted.'
    ],
    interiorLayers: [
      { name: 'Undifferentiated Rock-Ice Core', depthKm: '0 - 1,800 km', composition: 'Mixed silicates and ice phases', color: '#52525b', description: 'Sluggishly segregated core.' },
      { name: 'Possible Saline Ocean', depthKm: '1,800 - 2,150 km', composition: 'Subsurface liquid water with ammonia antifreeze', color: '#0284c7', description: 'Induction magnetic signal suggests a conductive salty ocean layer.' },
      { name: 'Ancient Cratered Crust', depthKm: '2,150 - 2,410 km', composition: 'Pitted dirty ice with frost rings', color: '#94a3b8', description: 'Saturated with craters and multi-ring impact basins.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/jupiter/moons/callisto/',
    orbit: {
      semiMajorAxisAU: 0.01258, // ~1,882,700 km from Jupiter (26.3 R_jup)
      eccentricity: 0.0074,
      inclinationDeg: 0.28,
      longitudeOfAscendingNodeDeg: 35.0,
      argumentOfPeriapsisDeg: 52.6,
      meanAnomalyAtEpochDeg: 45.0,
      orbitalPeriodDays: 16.689
    }
  },

  enceladus: {
    id: 'enceladus',
    name: 'Enceladus',
    displayName: 'Enceladus (Saturn II)',
    type: 'moon',
    category: 'Moons',
    parentBodyId: 'saturn',
    radiusKm: 252.1,
    equatorialRadiusKm: 252.1,
    massKg: '1.08 × 10^20',
    massEarthRelative: 0.000018,
    gravityMps2: 0.113,
    escapeVelocityKmS: 0.239,
    densityGcm3: 1.609,
    axialTiltDeg: 0.0,
    rotationPeriodHours: 32.88, // 1.37 days
    meanTempC: -198,
    albedo: 0.99, // highest albedo in the solar system!
    visualRadiusScale: 0.7,
    baseColor: '#f8fafc',
    orbitColor: '#38bdf8',
    summary: 'Saturn\'s dazzling ice geyser world. Enceladus reflects 99% of sunlight and possesses active hydrothermal vents at its south pole, spewing plumes of saltwater and complex organic molecules into Saturn\'s E-Ring.',
    atmosphereDescription: 'South polar vapor plume plume generating Saturn\'s E-ring.',
    atmosphereComposition: [
      { gas: 'Water vapor (H₂O)', percentage: 91.0 },
      { gas: 'Nitrogen (N₂)', percentage: 4.0 },
      { gas: 'Carbon Dioxide (CO₂)', percentage: 3.2 },
      { gas: 'Methane (CH₄)', percentage: 1.7 }
    ],
    explorationMissions: ['Voyager 1-2', 'Cassini-Huygens (multiple close plume flybys)'],
    interestingFacts: [
      'The "Tiger Stripes" fractures erupt over 200 kilograms of water vapor and ice crystals every second.',
      'Cassini flew directly through the plumes, detecting methane, hydrogen, and organic building blocks of life.',
      'Has the highest albedo of any body in the solar system, glistening like freshly fallen snow.'
    ],
    interiorLayers: [
      { name: 'Porous Silicate Core', depthKm: '0 - 180 km', composition: 'Hydrated porous silicates', color: '#71717a', description: 'Tidally warmed rock where hydrothermal water circulation occurs.' },
      { name: 'Global Subsurface Ocean', depthKm: '180 - 225 km', composition: 'Alkaline liquid saltwater (pH 9-11)', color: '#0ea5e9', description: 'Vast reservoir warmed by tidal friction and core serpentinization.' },
      { name: 'Ice Shell with Tiger Stripes', depthKm: '225 - 252 km', composition: 'Pure water ice crust thinned to 5 km at south pole', color: '#ffffff', description: 'Fissured by cryovolcanic vents venting ocean spray directly into space.' }
    ],
    nasaCitationUrl: 'https://science.nasa.gov/saturn/moons/enceladus/',
    orbit: {
      semiMajorAxisAU: 0.00159, // ~238,000 km from Saturn
      eccentricity: 0.0047,
      inclinationDeg: 0.009,
      longitudeOfAscendingNodeDeg: 0,
      argumentOfPeriapsisDeg: 0,
      meanAnomalyAtEpochDeg: 120,
      orbitalPeriodDays: 1.370
    }
  },

  // Spacecraft missions
  voyager1: {
    id: 'voyager1',
    name: 'Voyager 1',
    displayName: 'Voyager 1 (Interstellar Mission)',
    type: 'spacecraft',
    category: 'Missions',
    radiusKm: 4, // structural scale
    equatorialRadiusKm: 4,
    massKg: '825.5 kg',
    massEarthRelative: 0.0000000001,
    gravityMps2: 0,
    escapeVelocityKmS: 0,
    densityGcm3: 0.5,
    axialTiltDeg: 0,
    rotationPeriodHours: 0,
    meanTempC: -270,
    albedo: 0.5,
    visualRadiusScale: 0.5,
    baseColor: '#38bdf8',
    orbitColor: '#38bdf8',
    summary: 'Humanity\'s farthest explorer. Launched in 1977, Voyager 1 completed flybys of Jupiter and Saturn before crossing the heliopause into interstellar space in August 2012. Currently over 164 AU from Earth.',
    atmosphereDescription: 'Operating in interstellar space outside the solar bubble (heliosphere).',
    atmosphereComposition: [],
    explorationMissions: ['Jupiter (1979)', 'Saturn & Titan (1980)', 'Interstellar Mission (active)'],
    interestingFacts: [
      'Carries the Golden Record containing sounds, music, and images depicting life on Earth.',
      'Radio signals traveling at light speed take over 22.5 hours each way to reach Earth.',
      'Powered by radioisotope thermoelectric generators (RTGs) still sending scientific data after nearly 50 years.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/mission/voyager/',
    orbit: {
      semiMajorAxisAU: 140.0, // hyperbolic trajectory parameterized for visualization
      eccentricity: 0.35,
      inclinationDeg: 35.5,
      longitudeOfAscendingNodeDeg: 67.0,
      argumentOfPeriapsisDeg: 149.0,
      meanAnomalyAtEpochDeg: 110.0,
      orbitalPeriodDays: 120000
    }
  },

  jwst: {
    id: 'jwst',
    name: 'James Webb Space Telescope',
    displayName: 'James Webb Space Telescope (JWST)',
    type: 'spacecraft',
    category: 'Missions',
    radiusKm: 6.5,
    equatorialRadiusKm: 6.5,
    massKg: '6,161 kg',
    massEarthRelative: 0.000000001,
    gravityMps2: 0,
    escapeVelocityKmS: 0,
    densityGcm3: 0.5,
    axialTiltDeg: 0,
    rotationPeriodHours: 0,
    meanTempC: -233,
    albedo: 0.8,
    visualRadiusScale: 0.5,
    baseColor: '#fbbf24',
    orbitColor: '#f59e0b',
    summary: 'NASA\'s premier astrophysics observatory. Stationed at Sun-Earth Lagrange Point 2 (L2), Webb uses its 6.5-meter gold-beryllium primary mirror and infrared cameras to observe the first stars and galaxies formed after the Big Bang.',
    atmosphereDescription: 'Stationed at the cold Sun-Earth L2 halo orbit ~1.5 million km beyond Earth.',
    atmosphereComposition: [],
    explorationMissions: ['Early Universe Spectroscopy', 'Exoplanet Atmospheres', 'Solar System Deep Survey'],
    interestingFacts: [
      'Its five-layer tennis-court-sized sunshield blocks heat from the Sun, Earth, and Moon with SPF 1,000,000.',
      'The 18 hexagonal primary mirror segments are coated with a microscopic layer of pure gold only 100 nm thick.',
      'Operates at -233°C (-388°F) so thermal radiation does not blind its sensitive infrared detectors.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/mission/webb/',
    orbit: {
      semiMajorAxisAU: 1.010, // Orbiting L2 halo around Earth
      eccentricity: 0.0167,
      inclinationDeg: 0.05,
      longitudeOfAscendingNodeDeg: -11.26,
      argumentOfPeriapsisDeg: 114.2,
      meanAnomalyAtEpochDeg: 358.0,
      orbitalPeriodDays: 365.25
    }
  },

  parkerSolarProbe: {
    id: 'parkerSolarProbe',
    name: 'Parker Solar Probe',
    displayName: 'Parker Solar Probe (PSP)',
    type: 'spacecraft',
    category: 'Missions',
    radiusKm: 3,
    equatorialRadiusKm: 3,
    massKg: '685 kg',
    massEarthRelative: 0.0000000001,
    gravityMps2: 0,
    escapeVelocityKmS: 0,
    densityGcm3: 0.5,
    axialTiltDeg: 0,
    rotationPeriodHours: 0,
    meanTempC: 1370,
    albedo: 0.9,
    visualRadiusScale: 0.5,
    baseColor: '#ef4444',
    orbitColor: '#f97316',
    summary: 'NASA\'s historic mission to "touch the Sun". Flying through the outer corona, Parker uses gravity assists from Venus to dive within 6.1 million km of the solar surface at speeds reaching 692,000 km/h.',
    atmosphereDescription: 'Braving the multi-million-degree solar corona and supersonic solar wind.',
    atmosphereComposition: [],
    explorationMissions: ['Solar Corona Dynamics', 'Magnetic Switchbacks', 'Solar Energetic Particles'],
    interestingFacts: [
      'Protected by a 11.4 cm-thick carbon-composite thermal shield withstanding 1,400°C temperatures.',
      'The fastest object built by humans, traveling fast enough to fly from New York to Tokyo in under one minute.',
      'Discovered that the Sun\'s magnetic field lines kink back on themselves in S-shaped "switchbacks".'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/mission/parker-solar-probe/',
    orbit: {
      semiMajorAxisAU: 0.40,
      eccentricity: 0.88,
      inclinationDeg: 3.4,
      longitudeOfAscendingNodeDeg: 76.6,
      argumentOfPeriapsisDeg: 120.0,
      meanAnomalyAtEpochDeg: 45.0,
      orbitalPeriodDays: 88.0
    }
  },

  stereoAhead: {
    id: 'stereoAhead',
    name: 'STEREO Ahead',
    displayName: 'STEREO Ahead (Solar Observatory)',
    type: 'spacecraft',
    category: 'Missions',
    radiusKm: 2.0,
    equatorialRadiusKm: 2.0,
    massKg: '620 kg',
    massEarthRelative: 0.0000000001,
    gravityMps2: 0,
    escapeVelocityKmS: 0,
    densityGcm3: 0.5,
    axialTiltDeg: 0,
    rotationPeriodHours: 0,
    meanTempC: -50,
    albedo: 0.85,
    visualRadiusScale: 0.5,
    baseColor: '#38bdf8',
    orbitColor: '#0ea5e9',
    summary: 'NASA Solar Terrestrial Relations Observatory leading Earth in heliocentric orbit, providing revolutionary stereoscopic 3D views of coronal mass ejections and solar space weather.',
    atmosphereDescription: 'Interplanetary solar wind monitoring orbit leading Earth at 0.96 AU.',
    atmosphereComposition: [],
    explorationMissions: ['Coronal Mass Ejection Imaging', 'Solar Wind Heliospheric Imager', '3D Solar Magnetic Tomography'],
    interestingFacts: [
      'Orbits slightly inside Earth\'s orbit, causing it to pull ahead by ~22 degrees per year.',
      'Provided the first-ever simultaneous complete 360-degree views of the entire Sun along with STEREO Behind.',
      'Critical real-time early warning system for geomagnetic storms threatening Earth\'s power grid.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/mission/stereo/',
    orbit: {
      semiMajorAxisAU: 0.96,
      eccentricity: 0.005,
      inclinationDeg: 0.12,
      longitudeOfAscendingNodeDeg: 120.5,
      argumentOfPeriapsisDeg: 80.0,
      meanAnomalyAtEpochDeg: 195.0,
      orbitalPeriodDays: 347.0
    }
  },

  bioSentinel: {
    id: 'bioSentinel',
    name: 'BioSentinel',
    displayName: 'BioSentinel (CubeSat)',
    type: 'spacecraft',
    category: 'Missions',
    radiusKm: 1.5,
    equatorialRadiusKm: 1.5,
    massKg: '13.5 kg',
    massEarthRelative: 0.00000000001,
    gravityMps2: 0,
    escapeVelocityKmS: 0,
    densityGcm3: 0.8,
    axialTiltDeg: 0,
    rotationPeriodHours: 0,
    meanTempC: -30,
    albedo: 0.85,
    visualRadiusScale: 0.5,
    baseColor: '#c084fc',
    orbitColor: '#a855f7',
    summary: 'NASA Artemis 1 secondary payload: the first deep-space biological study beyond low Earth orbit in 50 years, using budding yeast to measure DNA damage response to cosmic radiation.',
    atmosphereDescription: 'Deep interplanetary heliocentric orbit beyond the Van Allen belts.',
    atmosphereComposition: [],
    explorationMissions: ['Deep Space Radiation Dosimetry', 'DNA Double-Strand Break Repair Assay'],
    interestingFacts: [
      'A 6U CubeSat weighing only 13.5 kg traveling millions of kilometers from Earth.',
      'Contains miniature microfluidic cards that rehydrate dried yeast cells in deep space.',
      'Essential precursor for biological risk mitigation for human astronaut Mars missions.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/mission/biosentinel/',
    orbit: {
      semiMajorAxisAU: 0.985,
      eccentricity: 0.08,
      inclinationDeg: 0.45,
      longitudeOfAscendingNodeDeg: 45.0,
      argumentOfPeriapsisDeg: 140.0,
      meanAnomalyAtEpochDeg: 310.0,
      orbitalPeriodDays: 358.0
    }
  },

  halley: {
    id: 'halley',
    name: 'Halley\'s Comet',
    displayName: '1P/Halley',
    type: 'comet',
    category: 'Comets',
    radiusKm: 5.5,
    equatorialRadiusKm: 8.0,
    massKg: '2.2 × 10^14',
    massEarthRelative: 0.00000000003,
    gravityMps2: 0.001,
    escapeVelocityKmS: 0.002,
    densityGcm3: 0.6,
    axialTiltDeg: 18.0,
    rotationPeriodHours: 52.8,
    meanTempC: -150,
    albedo: 0.04,
    visualRadiusScale: 0.6,
    baseColor: '#a7f3d0',
    orbitColor: '#10b981',
    summary: 'The most famous periodic comet in history. Observed since at least 240 BC, it returns every 75–76 years. Its nucleus is an irregular "dirty snowball" of ice, frozen carbon monoxide, and dark organic dust.',
    atmosphereDescription: 'Transient glowing coma and twin tails (ion and dust) spanning millions of kilometers.',
    atmosphereComposition: [
      { gas: 'Water vapor (H₂O)', percentage: 80.0 },
      { gas: 'Carbon Monoxide (CO)', percentage: 10.0 },
      { gas: 'Formaldehyde (H₂CO)', percentage: 3.0 }
    ],
    explorationMissions: ['Giotto (ESA 1986)', 'Vega 1 & 2', 'Suisei'],
    interestingFacts: [
      'Produces two annual meteor showers on Earth: the Eta Aquariids (May) and the Orionids (October).',
      'Next perihelion will occur in mid-2061.',
      'Its surface is pitch black with an albedo of just 0.04, darker than charcoal.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/solar-system/comets/1p-halley/',
    orbit: {
      semiMajorAxisAU: 17.834,
      eccentricity: 0.96714,
      inclinationDeg: 162.26, // retrograde
      longitudeOfAscendingNodeDeg: 58.42,
      argumentOfPeriapsisDeg: 111.33,
      meanAnomalyAtEpochDeg: 38.38,
      orbitalPeriodDays: 27500 // ~75.3 years
    }
  },

  oumuamua: {
    id: 'oumuamua',
    name: '\'Oumuamua',
    displayName: '1I/2017 U1 (\'Oumuamua)',
    type: 'asteroid',
    category: 'Asteroids',
    radiusKm: 0.2,
    equatorialRadiusKm: 0.4,
    massKg: '~4 × 10^7',
    massEarthRelative: 0.000000000001,
    gravityMps2: 0.0001,
    escapeVelocityKmS: 0.0002,
    densityGcm3: 2.0,
    axialTiltDeg: 0,
    rotationPeriodHours: 8.1,
    meanTempC: -200,
    albedo: 0.1,
    visualRadiusScale: 0.5,
    baseColor: '#f43f5e',
    orbitColor: '#fb7185',
    summary: 'The first interstellar object ever observed passing through our Solar System. Discovered in October 2017 by Pan-STARRS, this cigar-shaped wanderer originated from another star system.',
    atmosphereDescription: 'No detected dust coma, though it showed slight non-gravitational acceleration likely from outgassing molecular hydrogen.',
    atmosphereComposition: [],
    explorationMissions: ['Pan-STARRS', 'Hubble / Spitzer tracking'],
    interestingFacts: [
      'Hawaiian name meaning "scout" or "messenger from afar arriving first".',
      'Extremely elongated aspect ratio (~10:1), unlike almost any native solar system asteroid.',
      'Entered the solar system on an unbound hyperbolic trajectory at ~26.3 km/s.'
    ],
    interiorLayers: [],
    nasaCitationUrl: 'https://science.nasa.gov/solar-system/asteroids/1i-oumuamua/',
    orbit: {
      semiMajorAxisAU: -1.27, // hyperbolic
      eccentricity: 1.20,
      inclinationDeg: 122.7,
      longitudeOfAscendingNodeDeg: 24.6,
      argumentOfPeriapsisDeg: 241.8,
      meanAnomalyAtEpochDeg: 75.0,
      orbitalPeriodDays: 999999
    }
  },

  trappist1e: {
    id: 'trappist1e',
    name: 'TRAPPIST-1e',
    displayName: 'TRAPPIST-1e (Exoplanet)',
    type: 'exoplanet',
    category: 'Exoplanets',
    radiusKm: 5800,
    equatorialRadiusKm: 5800,
    massKg: '4.13 × 10^24',
    massEarthRelative: 0.692,
    gravityMps2: 9.12,
    escapeVelocityKmS: 9.7,
    densityGcm3: 5.65,
    axialTiltDeg: 0,
    rotationPeriodHours: 146.4, // tidally locked
    meanTempC: -22,
    albedo: 0.3,
    visualRadiusScale: 11.8,
    baseColor: '#0ea5e9',
    orbitColor: '#38bdf8',
    summary: 'An Earth-sized rocky exoplanet orbiting within the habitable zone of the ultra-cool red dwarf TRAPPIST-1, located 39 light-years away in Aquarius. One of the most promising candidates for liquid surface water outside our solar system.',
    atmosphereDescription: 'Subject of active JWST transmission spectroscopy observations to detect atmosphere and water signatures.',
    atmosphereComposition: [
      { gas: 'Target of JWST search (CO₂ / N₂ / H₂O)', percentage: 100 }
    ],
    explorationMissions: ['Spitzer', 'TRAPPIST telescope', 'JWST Cycle 1-3 Programs'],
    interestingFacts: [
      'Orbits its host star in just 6.1 days at a distance of 0.029 AU.',
      'Tidally locked with a permanent day side and night side, though ocean currents could distribute heat globally.',
      'All 7 TRAPPIST-1 planets are in near-resonant orbital harmony.'
    ],
    interiorLayers: [
      { name: 'Iron-Rich Core', depthKm: '0 - 2,800 km', composition: 'Iron-nickel core (~31% planet mass)', color: '#0369a1', description: 'Similar core-to-mantle fraction to Earth.' },
      { name: 'Silicate Mantle', depthKm: '2,800 - 5,600 km', composition: 'Silicate rocky mantle', color: '#0284c7', description: 'Subject to moderate tidal dissipation.' },
      { name: 'Volatile Crust / Ocean', depthKm: '5,600 - 5,800 km', composition: 'Basaltic crust with potential surface water ice / oceans', color: '#38bdf8', description: 'Potential temperate oceanic biome along the terminator zone.' }
    ],
    nasaCitationUrl: 'https://exoplanets.nasa.gov/eyes-on-exoplanets/#/planet/TRAPPIST-1_e/',
    orbit: {
      semiMajorAxisAU: 45.0, // displayed on interstellar perimeter
      eccentricity: 0.005,
      inclinationDeg: 89.8,
      longitudeOfAscendingNodeDeg: 0,
      argumentOfPeriapsisDeg: 0,
      meanAnomalyAtEpochDeg: 120,
      orbitalPeriodDays: 6.1
    }
  }
};

export const CELESTIAL_LIST: CelestialBody[] = Object.values(CELESTIAL_BODIES);

export const GUIDED_TOURS = [
  {
    id: 'grand-tour',
    title: 'The Grand Tour (Voyager Odyssey)',
    subtitle: 'Relive the historic planetary alignment that opened the outer solar system',
    stops: [
      { bodyId: 'earth', cameraDist: 5, date: '1977-09-05', narration: 'Voyager 1 launches from Cape Canaveral atop a Titan IIIE-Centaur rocket to begin humanity\'s greatest cosmic voyage.' },
      { bodyId: 'jupiter', cameraDist: 8, date: '1979-03-05', narration: 'Voyager makes its closest approach to Jupiter, discovering volcanic activity on Io and rings around the giant planet.' },
      { bodyId: 'saturn', cameraDist: 9, date: '1980-11-12', narration: 'Saturn\'s dazzling ring structure is revealed in microscopic detail along with the smog shroud of Titan.' },
      { bodyId: 'voyager1', cameraDist: 3, date: '2012-08-25', narration: 'Voyager 1 officially crosses the heliopause into interstellar space, carrying the Golden Record forever.' }
    ]
  },
  {
    id: 'ocean-worlds',
    title: 'Ocean Worlds: Search for Life',
    subtitle: 'Journey to the subterranean oceans of the outer moons',
    stops: [
      { bodyId: 'europa', cameraDist: 4, date: '2026-10-21', narration: 'Europa\'s ice shell conceals a global saltwater ocean twice the volume of Earth\'s, warmed by Jupiter\'s tidal pull.' },
      { bodyId: 'titan', cameraDist: 5, date: '2026-10-21', narration: 'Titan has a dense atmosphere and liquid methane lakes, with a water-ammonia ocean lurking in its depths.' },
      { bodyId: 'jupiter', cameraDist: 10, date: '2030-04-11', narration: 'Europa Clipper and JUICE will soon arrive to measure the depth and salinity of these Jovian alien oceans.' }
    ]
  },
  {
    id: 'inner-rocky',
    title: 'Terrestrial Worlds',
    subtitle: 'From the blazing fires of Mercury to the frozen rust of Mars',
    stops: [
      { bodyId: 'sun', cameraDist: 18, date: '2026-10-21', narration: 'The Sun\'s gravitational anchor powers all planetary weather, orbits, and evolution across 4.6 billion years.' },
      { bodyId: 'mercury', cameraDist: 4, date: '2026-10-21', narration: 'Mercury\'s huge iron core and 3:2 spin resonance create the highest temperature swings in the solar system.' },
      { bodyId: 'venus', cameraDist: 5, date: '2026-10-21', narration: 'Venus represents a runaway greenhouse climate: 464°C surface heat and crushing 92-bar carbon dioxide pressure.' },
      { bodyId: 'earth', cameraDist: 5, date: '2026-10-21', narration: 'Earth: the pale blue dot, uniquely shielded by its magnetic dynamo and enriched with liquid water.' },
      { bodyId: 'mars', cameraDist: 5, date: '2026-10-21', narration: 'Mars once ran with liquid rivers and lakes; rovers today hunt for fossil biosignatures in Jezero Crater.' }
    ]
  }
];
