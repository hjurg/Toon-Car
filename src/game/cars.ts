import * as THREE from 'three';
import { CarDefinition, CarCustomization } from '../types';

export const CAR_DEFINITIONS: CarDefinition[] = [
  {
    id: 'speedy_turbo',
    name: 'Speedy Turbo',
    driverName: 'Tommy Rocket',
    driverAvatar: '🚀',
    description: 'Sujuv ja välkkiire punane võidusõidukorv. Parim tippkiirus sirgetel!',
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
    type: 'speed',
    stats: {
      speed: 9,
      accel: 7,
      handling: 6,
      armor: 5,
    },
  },
  {
    id: 'buster_bull',
    name: 'Buster Bull',
    driverName: 'Bulldog Bob',
    driverAvatar: '🐂',
    description: 'Raske kollane jõumasin. Tõukab vastased teelt ja ei karda kokkupõrkeid!',
    primaryColor: '#eab308',
    secondaryColor: '#1e293b',
    type: 'heavy',
    stats: {
      speed: 6,
      accel: 6,
      handling: 5,
      armor: 10,
    },
  },
  {
    id: 'crazy_doc',
    name: 'Crazy Doc',
    driverName: 'Doc Wattson',
    driverAvatar: '⚡',
    description: 'Hullu teadlase elektriline retroauto. Kiirendab silmapilkselt ja kestab kaua!',
    primaryColor: '#06b6d4',
    secondaryColor: '#a855f7',
    type: 'tech',
    stats: {
      speed: 7,
      accel: 9,
      handling: 7,
      armor: 6,
    },
  },
  {
    id: 'kitten_cruiser',
    name: 'Kitten Cruiser',
    driverName: 'Mia Purr',
    driverAvatar: '🐱',
    description: 'Kassikõrvadega armas roosa rotster. Võtab kurve uskumatult täpselt ja libiseb ideaalselt!',
    primaryColor: '#ec4899',
    secondaryColor: '#fbcfe8',
    type: 'agile',
    stats: {
      speed: 7,
      accel: 8,
      handling: 10,
      armor: 4,
    },
  },
  {
    id: 'banana_bandit',
    name: 'Banana Bandit',
    driverName: 'Peel Pete',
    driverAvatar: '🍌',
    description: 'Lõbus banaanikujuline kollane hot-rod hiiglaslike leegitorudega!',
    primaryColor: '#facc15',
    secondaryColor: '#16a34a',
    type: 'wild',
    stats: {
      speed: 8,
      accel: 7,
      handling: 7,
      armor: 6,
    },
  },
  {
    id: 'police_donut',
    name: 'Police Donut',
    driverName: 'Officer Sarge',
    driverAvatar: '🚓',
    description: 'Vilkuvate sinipunaste tulukestega patrullauto. Rammib korda majja!',
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
    type: 'cop',
    stats: {
      speed: 7,
      accel: 7,
      handling: 8,
      armor: 8,
    },
  },
];

export interface CarMeshContainer {
  root: THREE.Group;
  bodyMesh: THREE.Mesh | THREE.Group;
  bodyGroup: THREE.Group;
  frontWheels: THREE.Group[];
  allWheels: THREE.Mesh[];
  driverHead: THREE.Group;
  exhaustLeft: THREE.Mesh;
  exhaustRight: THREE.Mesh;
  tailLightMat?: THREE.MeshStandardMaterial;
  sirenLight?: THREE.PointLight;
  sirenRed?: THREE.Mesh;
  sirenBlue?: THREE.Mesh;
}

/**
 * Creates a detailed, high-poly 3D cartoon arcade car with unique archetype bodies,
 * spoilers, animated wheels with brake calipers, glowing headlights, and driver.
 */
export function createToonCarMesh(
  carDef: CarDefinition,
  colorOverride?: string,
  customization?: CarCustomization
): CarMeshContainer {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const mainColor = colorOverride || carDef.primaryColor;

  // Custom finish
  let bodyRoughness = 0.25;
  let bodyMetalness = 0.15;
  if (customization?.finish === 'metallic') {
    bodyRoughness = 0.18;
    bodyMetalness = 0.8;
  } else if (customization?.finish === 'matte') {
    bodyRoughness = 0.85;
    bodyMetalness = 0.05;
  }

  // Materials with physical clearcoat gloss
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mainColor),
    roughness: bodyRoughness,
    metalness: bodyMetalness,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
  });

  const secondaryMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(carDef.secondaryColor),
    roughness: 0.28,
    metalness: 0.2,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.4,
    metalness: 0.3,
  });

  const blackRubber = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
  });

  const brakeRotorMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.18,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
  });

  // Custom rims
  let rimColor = 0xf4f4f5;
  let rimMetalness = 0.75;
  let rimRoughness = 0.2;
  let rimEmissive: number | undefined = undefined;

  if (customization?.rimStyle === 'gold') {
    rimColor = 0xfbbf24;
    rimMetalness = 0.92;
    rimRoughness = 0.12;
  } else if (customization?.rimStyle === 'cyber') {
    rimColor = 0x06b6d4;
    rimMetalness = 0.6;
    rimRoughness = 0.2;
    rimEmissive = 0x06b6d4;
  } else if (customization?.rimStyle === 'monster') {
    rimColor = 0x18181b;
    rimMetalness = 0.3;
    rimRoughness = 0.75;
  }

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: rimMetalness,
    roughness: rimRoughness,
    ...(rimEmissive ? { emissive: rimEmissive, emissiveIntensity: 0.6 } : {}),
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcffafe,
    transmission: 0.78,
    opacity: 0.92,
    transparent: true,
    roughness: 0.05,
    ior: 1.48,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.95,
    roughness: 0.08,
  });

  // Underglow neon ground lighting
  if (customization?.underglow && customization.underglow !== 'none') {
    const ugColor = new THREE.Color(customization.underglow);
    const glowGeo = new THREE.PlaneGeometry(2.1, 2.9);
    const glowMat = new THREE.MeshBasicMaterial({
      color: ugColor,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.rotation.x = Math.PI / 2;
    glowPlane.position.y = 0.08;
    root.add(glowPlane);
  }

  // Primary chassis base mesh
  const isHeavy = carDef.type === 'heavy';
  const chassisWidth = isHeavy ? 1.85 : 1.65;
  const chassisHeight = isHeavy ? 0.55 : 0.46;
  const chassisLength = isHeavy ? 3.0 : 2.8;

  const chassisGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLength);
  const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
  chassis.position.y = isHeavy ? 0.62 : 0.48;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // Racing Center Stripes
  const stripeGeo = new THREE.PlaneGeometry(0.32, chassisLength - 0.1);
  const stripeMesh = new THREE.Mesh(stripeGeo, secondaryMaterial);
  stripeMesh.rotation.x = -Math.PI / 2;
  stripeMesh.position.set(0, (isHeavy ? 0.62 : 0.48) + chassisHeight * 0.5 + 0.01, 0);
  bodyGroup.add(stripeMesh);

  // Front hood slope
  const hoodGeo = new THREE.BoxGeometry(chassisWidth - 0.08, 0.26, 0.95);
  const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
  hood.position.set(0, (isHeavy ? 0.72 : 0.58), 0.95);
  hood.rotation.x = -0.15;
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Cabin / Cockpit Roof
  const cabinWidth = isHeavy ? 1.42 : 1.24;
  const cabinHeight = isHeavy ? 0.68 : 0.58;
  const cabinLength = isHeavy ? 1.35 : 1.45;
  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
  cabin.position.set(0, (isHeavy ? 1.08 : 0.88), isHeavy ? 0.05 : -0.15);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  // Windshield & Rear Windows
  const windshieldGeo = new THREE.BoxGeometry(cabinWidth + 0.02, cabinHeight * 0.88, 0.55);
  const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshield.position.set(0, (isHeavy ? 1.05 : 0.86), isHeavy ? 0.65 : 0.46);
  windshield.rotation.x = -Math.PI * 0.14;
  bodyGroup.add(windshield);

  const rearWinGeo = new THREE.BoxGeometry(cabinWidth + 0.02, cabinHeight * 0.82, 0.4);
  const rearWin = new THREE.Mesh(rearWinGeo, glassMaterial);
  rearWin.position.set(0, (isHeavy ? 1.05 : 0.88), isHeavy ? -0.55 : -0.78);
  rearWin.rotation.x = Math.PI * 0.12;
  bodyGroup.add(rearWin);

  // Side mirrors
  [-cabinWidth * 0.5 - 0.15, cabinWidth * 0.5 + 0.15].forEach((xPos, i) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.16), bodyMaterial);
    mirror.position.set(xPos, isHeavy ? 0.98 : 0.82, isHeavy ? 0.4 : 0.35);
    mirror.rotation.y = (i === 0 ? 1 : -1) * 0.15;
    bodyGroup.add(mirror);
  });

  // Front & Rear Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth + 0.1, 0.22, 0.25), chromeMaterial);
  frontBumper.position.set(0, isHeavy ? 0.44 : 0.32, 1.45);
  frontBumper.castShadow = true;
  bodyGroup.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth + 0.1, 0.22, 0.25), chromeMaterial);
  rearBumper.position.set(0, isHeavy ? 0.44 : 0.32, -1.45);
  rearBumper.castShadow = true;
  bodyGroup.add(rearBumper);

  // Front Radiator Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth * 0.7, 0.24, 0.15), darkTrimMaterial);
  grille.position.set(0, isHeavy ? 0.54 : 0.42, 1.43);
  bodyGroup.add(grille);

  // ARCHETYPE-SPECIFIC CUSTOM ACCESSORIES & RIGS
  let sirenLight: THREE.PointLight | undefined;
  let sirenRed: THREE.Mesh | undefined;
  let sirenBlue: THREE.Mesh | undefined;

  if (carDef.type === 'speed') {
    // Speedy Turbo: Front aero carbon splitter & bi-level GT racing wing
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.45), carbonMaterial);
    splitter.position.set(0, 0.2, 1.55);
    bodyGroup.add(splitter);

    // Aerodynamic side intake pods
    [-0.88, 0.88].forEach(xP => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.9), carbonMaterial);
      pod.position.set(xP, 0.46, 0.1);
      bodyGroup.add(pod);
    });

    // Bi-level racing wing
    const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.45), secondaryMaterial);
    wingUpper.position.set(0, 1.25, -1.3);
    wingUpper.castShadow = true;
    bodyGroup.add(wingUpper);

    [-0.6, 0.6].forEach(xP => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.55), chromeMaterial);
      stand.position.set(xP, 0.98, -1.3);
      bodyGroup.add(stand);
    });

    // Steering wheel visible inside cockpit
    const wheelGroup = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), darkTrimMaterial);
    wheelGroup.position.set(0, 0.82, 0.2);
    wheelGroup.rotation.x = -Math.PI * 0.22;
    bodyGroup.add(wheelGroup);

  } else if (carDef.type === 'heavy') {
    // Buster Bull: Chrome Supercharger blower on hood with triple red butterflies
    const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.65), chromeMaterial);
    blowerBase.position.set(0, 0.92, 0.75);
    blowerBase.castShadow = true;
    bodyGroup.add(blowerBase);

    // Red butterfly flaps inside scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.35), darkTrimMaterial);
    scoop.position.set(0, 1.08, 0.85);
    bodyGroup.add(scoop);
    [-0.12, 0, 0.12].forEach(xP => {
      const butterfly = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 8), brakeCaliperMat);
      butterfly.rotation.x = Math.PI / 2;
      butterfly.position.set(xP, 1.08, 0.98);
      bodyGroup.add(butterfly);
    });

    // Golden Bull Horns on the grille!
    [-0.65, 0.65].forEach((xP, i) => {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.65, 8),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 })
      );
      horn.position.set(xP, 0.72, 1.48);
      horn.rotation.z = (i === 0 ? 1 : -1) * 0.65;
      horn.rotation.x = 0.45;
      bodyGroup.add(horn);
    });

    // Dual vertical chrome exhaust smokestacks behind cab
    [-0.72, 0.72].forEach(xP => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.4, 12), chromeMaterial);
      stack.position.set(xP, 1.45, -0.65);
      bodyGroup.add(stack);

      // Angled tip
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), chromeMaterial);
      cap.position.set(xP, 2.15, -0.72);
      cap.rotation.x = -0.5;
      bodyGroup.add(cap);
    });

  } else if (carDef.type === 'tech') {
    // Crazy Doc: Delorean Flux Reactor and lightning rod antenna
    const reactorBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    reactorBox.position.set(0, 0.85, -1.0);
    bodyGroup.add(reactorBox);

    // Glowing cyan plasma core
    const plasmaTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.2 })
    );
    plasmaTube.rotation.z = Math.PI / 2;
    plasmaTube.position.set(0, 0.98, -1.0);
    bodyGroup.add(plasmaTube);

    // Lightning rod mast with glowing spark sphere
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.1, 8), chromeMaterial);
    antenna.position.set(0, 1.6, -0.4);
    bodyGroup.add(antenna);

    const sparkSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xc084fc, emissiveIntensity: 1.5 })
    );
    sparkSphere.position.set(0, 2.15, -0.4);
    bodyGroup.add(sparkSphere);

  } else if (carDef.type === 'agile') {
    // Kitten Cruiser: Arched cat ears on roof and wiggling cat tail antenna
    [-0.42, 0.42].forEach((xP, i) => {
      const outerEar = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.44, 4), bodyMaterial);
      outerEar.position.set(xP, 1.35, -0.1);
      outerEar.rotation.z = (i === 0 ? -1 : 1) * 0.28;
      bodyGroup.add(outerEar);

      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), secondaryMaterial);
      innerEar.position.set(xP, 1.35, -0.07);
      innerEar.rotation.z = (i === 0 ? -1 : 1) * 0.28;
      bodyGroup.add(innerEar);
    });

    // Cute cat tail antenna with golden bell on rear deck
    const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), secondaryMaterial);
    tailBase.position.set(0, 0.95, -1.2);
    tailBase.rotation.x = -0.6;
    bodyGroup.add(tailBase);

    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 })
    );
    bell.position.set(0, 1.25, -1.45);
    bodyGroup.add(bell);

  } else if (carDef.type === 'wild') {
    // Banana Bandit: Exposed V8 with 8 tall velocity stacks & zoomie side pipes
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.8), chromeMaterial);
    engineBlock.position.set(0, 0.88, 0.65);
    bodyGroup.add(engineBlock);

    // 8 intake velocity stacks
    for (let r = 0; r < 4; r++) {
      [-0.18, 0.18].forEach(xP => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.28, 8), chromeMaterial);
        stack.position.set(xP, 1.15, 0.4 + r * 0.18);
        bodyGroup.add(stack);
      });
    }

    // Zoomie angled side pipes
    [-0.88, 0.88].forEach((xP, i) => {
      for (let p = 0; p < 4; p++) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), chromeMaterial);
        pipe.position.set(xP, 0.42, 0.4 + p * 0.16);
        pipe.rotation.z = (i === 0 ? 1 : -1) * 0.55;
        pipe.rotation.y = 0.2;
        bodyGroup.add(pipe);
      }
    });

  } else if (carDef.type === 'cop') {
    // Police Donut: Heavy push-bar and authentic flashing Light Bar
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.15), darkTrimMaterial);
    pushBar.position.set(0, 0.42, 1.58);
    bodyGroup.add(pushBar);

    const lightBarFrame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.25), chromeMaterial);
    lightBarFrame.position.set(0, 1.24, -0.15);
    bodyGroup.add(lightBarFrame);

    sirenBlue = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb, emissiveIntensity: 1.2 })
    );
    sirenBlue.position.set(-0.32, 1.32, -0.15);
    bodyGroup.add(sirenBlue);

    sirenRed = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.4 })
    );
    sirenRed.position.set(0.32, 1.32, -0.15);
    bodyGroup.add(sirenRed);
  }

  // Cartoon Googly Headlights with Forward Projection Beams
  const lightGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.95,
    roughness: 0.1,
  });

  const lightY = isHeavy ? 0.65 : 0.52;
  const lightZ = isHeavy ? 1.48 : 1.38;
  const lightSpacing = (chassisWidth * 0.5) - 0.25;

  [-lightSpacing, lightSpacing].forEach((xPos) => {
    const eye = new THREE.Mesh(lightGeo, lightMat);
    eye.position.set(xPos, lightY, lightZ);
    eye.scale.set(1, 1, 0.7);
    bodyGroup.add(eye);

    // Dark pupil center
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshBasicMaterial({ color: 0x09090b }));
    pupil.position.set(xPos, lightY, lightZ + 0.14);
    bodyGroup.add(pupil);

    // Volumetric forward projection beam cone illuminating road ahead
    const beamGeo = new THREE.ConeGeometry(0.65, 4.2, 12);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef9c3,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(xPos, lightY, lightZ + 2.1);
    beam.rotation.x = Math.PI / 2;
    bodyGroup.add(beam);
  });

  // Glowing Rear Taillight Bars
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.95,
  });
  [-lightSpacing, lightSpacing].forEach((xPos) => {
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.12), tailMat);
    tailLight.position.set(xPos, lightY, -chassisLength * 0.5 - 0.02);
    bodyGroup.add(tailLight);
  });

  // Driver Head, Helmet & Visor Goggles
  const driverHead = new THREE.Group();
  driverHead.position.set(0, isHeavy ? 1.15 : 0.98, isHeavy ? 0.05 : -0.08);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.55 })
  );
  driverHead.add(headMesh);

  // Helmet with secondary color accent
  const helmetMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    secondaryMaterial
  );
  helmetMesh.position.y = 0.05;
  driverHead.add(helmetMesh);

  // Goggles with reflective chrome rim & cyan lens
  [-0.1, 0.1].forEach(xP => {
    const goggle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 16), chromeMaterial);
    goggle.position.set(xP, 0.06, 0.23);
    driverHead.add(goggle);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 })
    );
    lens.position.set(xP, 0.06, 0.24);
    driverHead.add(lens);
  });
  bodyGroup.add(driverHead);

  // 3D Wheels with detailed rims and visible brake calipers
  const wheelRadius = isHeavy ? 0.46 : 0.38;
  const wheelWidth = isHeavy ? 0.38 : 0.32;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 22);
  wheelGeo.rotateZ(Math.PI / 2);

  const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.56, wheelRadius * 0.56, wheelWidth + 0.03, 16);
  hubGeo.rotateZ(Math.PI / 2);

  const brakeRotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.44, wheelRadius * 0.44, 0.04, 16);
  brakeRotorGeo.rotateZ(Math.PI / 2);

  const frontWheels: THREE.Group[] = [];
  const allWheels: THREE.Mesh[] = [];

  const xWheelOffset = (chassisWidth * 0.5) + (wheelWidth * 0.5) - 0.02;
  const wheelPositions = [
    { x: -xWheelOffset, y: wheelRadius, z: 0.88, isFront: true },
    { x: xWheelOffset, y: wheelRadius, z: 0.88, isFront: true },
    { x: -xWheelOffset, y: wheelRadius, z: -0.88, isFront: false },
    { x: xWheelOffset, y: wheelRadius, z: -0.88, isFront: false },
  ];

  wheelPositions.forEach((pos) => {
    const tire = new THREE.Mesh(wheelGeo, blackRubber);
    tire.castShadow = true;

    // Rim hub
    const rim = new THREE.Mesh(hubGeo, rimMaterial);
    tire.add(rim);

    // 5 Rim Spokes
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(wheelWidth + 0.04, wheelRadius * 0.5, 0.06), rimMaterial);
      spoke.rotation.x = (s / 5) * Math.PI * 2;
      tire.add(spoke);
    }

    // Metallic brake rotor disc inside wheel
    const rotor = new THREE.Mesh(brakeRotorGeo, brakeRotorMat);
    rotor.position.x = pos.x > 0 ? -wheelWidth * 0.3 : wheelWidth * 0.3;
    tire.add(rotor);

    // Red brake caliper attached to wheel hub
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.12), brakeCaliperMat);
    caliper.position.set(pos.x > 0 ? -wheelWidth * 0.3 : wheelWidth * 0.3, wheelRadius * 0.28, 0);
    tire.add(caliper);

    if (pos.isFront) {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(pos.x, pos.y, pos.z);
      steerPivot.add(tire);
      root.add(steerPivot);
      frontWheels.push(steerPivot);
    } else {
      tire.position.set(pos.x, pos.y, pos.z);
      root.add(tire);
    }
    allWheels.push(tire);
  });

  // Dual Chrome Exhaust Tips with Interior Flame Core
  const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.4, 14);
  exhaustGeo.rotateX(Math.PI / 2);

  const flameCoreGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.25, 8);
  flameCoreGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const exY = isHeavy ? 0.48 : 0.38;
  const exZ = -chassisLength * 0.5 - 0.1;

  const exhaustLeft = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustLeft.position.set(-0.48, exY, exZ);
  const flameL = new THREE.Mesh(flameCoreGeo, flameMat);
  flameL.position.set(0, 0, 0.06);
  exhaustLeft.add(flameL);
  bodyGroup.add(exhaustLeft);

  const exhaustRight = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustRight.position.set(0.48, exY, exZ);
  const flameR = new THREE.Mesh(flameCoreGeo, flameMat);
  flameR.position.set(0, 0, 0.06);
  exhaustRight.add(flameR);
  bodyGroup.add(exhaustRight);

  return {
    root,
    bodyMesh: chassis,
    bodyGroup,
    frontWheels,
    allWheels,
    driverHead,
    exhaustLeft,
    exhaustRight,
    tailLightMat: tailMat,
    sirenLight,
    sirenRed,
    sirenBlue,
  };
}
