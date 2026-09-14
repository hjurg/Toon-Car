import * as THREE from 'three';
import { PowerUpType } from '../types';

export interface PowerUpInfo {
  type: PowerUpType;
  name: string;
  icon: string;
  description: string;
  rarityWeight: number; // Higher = more common when trailing behind
}

export const POWER_UPS: Record<PowerUpType, PowerUpInfo> = {
  rocket: {
    type: 'rocket',
    name: 'Punane Rakett',
    icon: '🚀',
    description: 'Jälitav rakett! Tulistab ettepoole ja võtab sihikule lähima vastase ees.',
    rarityWeight: 25,
  },
  blue_rocket: {
    type: 'blue_rocket',
    name: 'Sinine Tiibrakett',
    icon: '🔷',
    description: 'Legendaarne liidrijahtija! Lendab väsimatult seni, kuni tabab esikoha liidrit mega-plahvatusega!',
    rarityWeight: 15,
  },
  thundercloud: {
    type: 'thundercloud',
    name: 'Äikesepilv',
    icon: '⛈️',
    description: 'Varitseb teel! Kui vastane satub lähedale, jälitab teda 3.5 sekundit ja virutab äikeselöögi!',
    rarityWeight: 20,
  },
  banana: {
    type: 'banana',
    name: 'Banaanikoor',
    icon: '🍌',
    description: 'Libe lõks teel! Otsasõitja teeb kontrollimatu 360° spinni ja kaotab hoogu.',
    rarityWeight: 25,
  },
  star: {
    type: 'star',
    name: 'Super Täht',
    icon: '⭐',
    description: 'Täielik vikerkaare võitmatus! Annab ülikiiruse ja pühib kõik vastased teelt minema.',
    rarityWeight: 15,
  },
  mine: {
    type: 'mine',
    name: 'TNT Miin',
    icon: '💣',
    description: 'Viskab taha tiksuva pommi. Otsasõitja lendab spinniga õhku!',
    rarityWeight: 20,
  },
  shield: {
    type: 'shield',
    name: 'Mullkilp',
    icon: '🛡️',
    description: 'Kaitsev energiamull, mis neelab rünnakud ja tõukab vastaseid.',
    rarityWeight: 15,
  },
  turbo: {
    type: 'turbo',
    name: 'Super Nitro',
    icon: '⚡',
    description: 'Võimas kiirussööst ja leegid summutist!',
    rarityWeight: 25,
  },
  lightning: {
    type: 'lightning',
    name: 'Välk',
    icon: '🌩️',
    description: 'Lööb korraga kõiki vastaseid välguga ja aeglustab neid 3 sekundiks!',
    rarityWeight: 10,
  },
  anvil: {
    type: 'anvil',
    name: '10T Alasi',
    icon: '🔨',
    description: 'Kukutab liidrile pähe tohutu koomiksialasi!',
    rarityWeight: 10,
  },
  repair: {
    type: 'repair',
    name: 'Kiirparandus',
    icon: '🔧',
    description: 'Taastab auto stabiilsuse ja annab väikese lisakiirenduse.',
    rarityWeight: 15,
  },
  trio_rockets: {
    type: 'trio_rockets',
    name: '3x Raketti',
    icon: '🎯',
    description: 'Kolm kiiret raketti laiali lehvikuna vastaste rivi purustamiseks!',
    rarityWeight: 10,
  },
  vortex: {
    type: 'vortex',
    name: 'Must Auk (Vortex)',
    icon: '🌀',
    description: 'Gravitatsiooni singulaarsus! Tõmbab kõik lähedal olevad vastased (16m) oma tsentrisse pöörlema ja neelab nad lõksu!',
    rarityWeight: 20,
  },
  freezeray: {
    type: 'freezeray',
    name: 'Jääkülmuti (Cryo)',
    icon: '❄️',
    description: 'Kiire jääkristallkiir! Külmutab tabatud vastase auto 3 sekundiks libiseva jääkuubiku sisse!',
    rarityWeight: 22,
  },
  plasma_cannon: {
    type: 'plasma_cannon',
    name: 'Plasma Suurtükk',
    icon: '🔮',
    description: 'Võimas smaragd-roheline energiakuul! Tulistab ülikiirelt ettepoole ja läbistab järjest mitu vastast!',
    rarityWeight: 24,
  },
  oil_slick: {
    type: 'oil_slick',
    name: 'Õliloik',
    icon: '🛢️',
    description: 'Viskab teele libeda musta õliloigu! Otsasõitja teeb pöörase 720° topelt-spinni ja kaotab pidamise.',
    rarityWeight: 22,
  },
};

/**
 * Weighted random power-up picker based on current race position (Rubber-banding!)
 * Trailing racers (4th-6th) get game-changing items: Blue Rocket, Thundercloud, Vortex, Star, Red Rocket, Turbo.
 * Leader (1st) gets defensive items: Banana, Mine, Shield, Repair.
 */
export function getRandomPowerUp(position: number, totalRacers: number = 6): PowerUpType {
  const isLeader = position === 1;
  const isTrailing = position >= 4;

  const pool: { type: PowerUpType; weight: number }[] = [];

  if (isLeader) {
    pool.push({ type: 'oil_slick', weight: 32 });
    pool.push({ type: 'banana', weight: 30 });
    pool.push({ type: 'mine', weight: 25 });
    pool.push({ type: 'shield', weight: 20 });
    pool.push({ type: 'vortex', weight: 14 }); // Traps chasers behind!
    pool.push({ type: 'repair', weight: 14 });
    pool.push({ type: 'turbo', weight: 10 });
  } else if (isTrailing) {
    pool.push({ type: 'plasma_cannon', weight: 25 });
    pool.push({ type: 'blue_rocket', weight: 22 });
    pool.push({ type: 'vortex', weight: 20 });
    pool.push({ type: 'freezeray', weight: 20 });
    pool.push({ type: 'thundercloud', weight: 18 });
    pool.push({ type: 'star', weight: 18 });
    pool.push({ type: 'rocket', weight: 20 });
    pool.push({ type: 'turbo', weight: 16 });
    pool.push({ type: 'lightning', weight: 10 });
  } else {
    // Midpack (2nd - 3rd)
    pool.push({ type: 'plasma_cannon', weight: 24 });
    pool.push({ type: 'rocket', weight: 22 });
    pool.push({ type: 'freezeray', weight: 22 });
    pool.push({ type: 'oil_slick', weight: 18 });
    pool.push({ type: 'vortex', weight: 16 });
    pool.push({ type: 'thundercloud', weight: 16 });
    pool.push({ type: 'banana', weight: 14 });
    pool.push({ type: 'turbo', weight: 18 });
    pool.push({ type: 'shield', weight: 12 });
    pool.push({ type: 'mine', weight: 12 });
    pool.push({ type: 'blue_rocket', weight: 10 });
  }

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const item of pool) {
    if (rand < item.weight) {
      return item.type;
    }
    rand -= item.weight;
  }

  return 'turbo';
}

// Static shared geometries & materials for projectiles to prevent memory allocations and shader compile freezes
const rocketBodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 2.0, 10);
rocketBodyGeo.rotateX(Math.PI / 2);
const rocketBodyMat = new THREE.MeshStandardMaterial({
  color: 0xef4444,
  emissive: 0xdc2626,
  emissiveIntensity: 0.65,
  metalness: 0.35,
  roughness: 0.25,
});

const rocketNoseGeo = new THREE.ConeGeometry(0.38, 0.85, 10);
rocketNoseGeo.rotateX(Math.PI / 2);
const rocketNoseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

const rocketFinGeo = new THREE.BoxGeometry(1.1, 0.08, 0.45);
const rocketFinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

const rocketFlameGeo = new THREE.ConeGeometry(0.28, 0.7, 8);
rocketFlameGeo.rotateX(-Math.PI / 2);
const rocketFlameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

const mineSphereGeo = new THREE.SphereGeometry(0.45, 12, 12);
const mineBombMat = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.6,
});

const mineFuseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
const mineFuseMat = new THREE.MeshStandardMaterial({ color: 0x78350f });

const mineSparkGeo = new THREE.SphereGeometry(0.09, 6, 6);
const mineSparkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

const mineSpikeGeo = new THREE.ConeGeometry(0.12, 0.3, 6);
const mineSpikeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

// Blue Rocket assets
const blueRocketBodyMat = new THREE.MeshStandardMaterial({
  color: 0x0284c7,
  metalness: 0.5,
  roughness: 0.25,
});
const blueRocketNoseMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  emissive: 0x0284c7,
  emissiveIntensity: 0.8,
});
const blueRocketWingMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  metalness: 0.2,
  roughness: 0.3,
});
const blueRocketFlameMat = new THREE.MeshBasicMaterial({
  color: 0x06b6d4,
});

// Thundercloud assets
const cloudPuffGeo = new THREE.SphereGeometry(0.55, 8, 8);
const cloudPuffDarkMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.9,
  metalness: 0.1,
});
const cloudPuffMidMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.8,
});
const lightningCoreGeo = new THREE.ConeGeometry(0.16, 0.45, 4);
const lightningCoreMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
});

// Banana peel assets
const bananaCurveGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.7, 8);
const bananaMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15,
  roughness: 0.4,
});
const bananaStemMat = new THREE.MeshStandardMaterial({
  color: 0x78350f,
  roughness: 0.7,
});
const bananaPeelGeo = new THREE.BoxGeometry(0.18, 0.04, 0.45);

const sharedShieldGeo = new THREE.SphereGeometry(1.6, 16, 16);
const sharedShieldMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  emissive: 0x0284c7,
  emissiveIntensity: 0.6,
  transparent: true,
  opacity: 0.4,
  roughness: 0.1,
  wireframe: false,
});

/**
 * 3D Projectile Mesh Generator (Uses pre-cached assets)
 */
export function createRocketMesh(): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(1.35);

  const body = new THREE.Mesh(rocketBodyGeo, rocketBodyMat);
  body.renderOrder = 5;
  group.add(body);

  const nose = new THREE.Mesh(rocketNoseGeo, rocketNoseMat);
  nose.position.z = 1.15;
  group.add(nose);

  const fin1 = new THREE.Mesh(rocketFinGeo, rocketFinMat);
  fin1.position.z = -0.55;
  group.add(fin1);

  const fin2 = new THREE.Mesh(rocketFinGeo, rocketFinMat);
  fin2.position.z = -0.55;
  fin2.rotation.z = Math.PI / 2;
  group.add(fin2);

  const flame = new THREE.Mesh(rocketFlameGeo, rocketFlameMat);
  flame.position.z = -1.05;
  group.add(flame);

  // Bright core so rocket never "disappears" against dark tracks
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  core.position.z = 0.2;
  group.add(core);

  return group;
}

export function createBlueRocketMesh(): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(1.55);

  // Vibrant Blue Body
  const body = new THREE.Mesh(rocketBodyGeo, blueRocketBodyMat);
  body.renderOrder = 5;
  group.add(body);

  // Glowing Cyan Nose
  const nose = new THREE.Mesh(rocketNoseGeo, blueRocketNoseMat);
  nose.position.z = 0.85;
  group.add(nose);

  // Aerodynamic swept wings
  const wingLeft = new THREE.Mesh(rocketFinGeo, blueRocketWingMat);
  wingLeft.position.set(-0.5, 0, -0.2);
  wingLeft.rotation.y = 0.3;
  group.add(wingLeft);

  const wingRight = new THREE.Mesh(rocketFinGeo, blueRocketWingMat);
  wingRight.position.set(0.5, 0, -0.2);
  wingRight.rotation.y = -0.3;
  group.add(wingRight);

  // Top fin
  const topFin = new THREE.Mesh(rocketFinGeo, blueRocketWingMat);
  topFin.position.set(0, 0.4, -0.3);
  topFin.rotation.z = Math.PI / 2;
  group.add(topFin);

  // Twin Cyan Thruster Flames
  const flame = new THREE.Mesh(rocketFlameGeo, blueRocketFlameMat);
  flame.position.z = -0.75;
  flame.scale.set(1.3, 1.3, 1.3);
  group.add(flame);

  return group;
}

export function createThundercloudMesh(): THREE.Group {
  const group = new THREE.Group();

  // Stylized cluster of dark storm cloud puffs
  const offsets = [
    { x: 0, y: 0.1, z: 0, s: 1.1, dark: true },
    { x: -0.45, y: -0.05, z: 0.2, s: 0.85, dark: false },
    { x: 0.45, y: 0.05, z: -0.15, s: 0.9, dark: true },
    { x: -0.2, y: 0.2, z: -0.3, s: 0.8, dark: false },
    { x: 0.3, y: -0.1, z: 0.35, s: 0.85, dark: false },
    { x: 0, y: 0.25, z: 0.1, s: 0.75, dark: true },
  ];

  offsets.forEach(o => {
    const puff = new THREE.Mesh(cloudPuffGeo, o.dark ? cloudPuffDarkMat : cloudPuffMidMat);
    puff.position.set(o.x, o.y, o.z);
    puff.scale.set(o.s, o.s * 0.75, o.s);
    group.add(puff);
  });

  // Hanging glowing electric zap bolt underneath
  const bolt1 = new THREE.Mesh(lightningCoreGeo, lightningCoreMat);
  bolt1.position.set(-0.15, -0.35, 0.05);
  bolt1.rotation.z = 0.3;
  group.add(bolt1);

  const bolt2 = new THREE.Mesh(lightningCoreGeo, lightningCoreMat);
  bolt2.position.set(0.15, -0.38, -0.05);
  bolt2.rotation.z = -0.25;
  group.add(bolt2);

  return group;
}

export function createBananaMesh(): THREE.Group {
  const group = new THREE.Group();

  // Central banana core
  const core = new THREE.Mesh(bananaCurveGeo, bananaMat);
  core.rotation.x = Math.PI / 2;
  core.position.y = 0.15;
  group.add(core);

  // Brown stem tip
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.2, 6), bananaStemMat);
  stem.position.set(0, 0.15, 0.42);
  stem.rotation.x = Math.PI / 2;
  group.add(stem);

  // Peels spread out flat on tarmac
  [-0.7, 0.7, 2.3].forEach(angle => {
    const peel = new THREE.Mesh(bananaPeelGeo, bananaMat);
    peel.position.set(Math.cos(angle) * 0.25, 0.03, Math.sin(angle) * 0.25);
    peel.rotation.y = angle;
    group.add(peel);
  });

  return group;
}

export function createMineMesh(): THREE.Group {
  const group = new THREE.Group();

  const bomb = new THREE.Mesh(mineSphereGeo, mineBombMat);
  group.add(bomb);

  const fuse = new THREE.Mesh(mineFuseGeo, mineFuseMat);
  fuse.position.y = 0.5;
  group.add(fuse);

  const spark = new THREE.Mesh(mineSparkGeo, mineSparkMat);
  spark.position.y = 0.65;
  group.add(spark);

  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  angles.forEach(a => {
    const s = new THREE.Mesh(mineSpikeGeo, mineSpikeMat);
    s.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
    s.rotation.z = -Math.PI / 2;
    s.rotation.y = a;
    group.add(s);
  });

  return group;
}

export function createShieldMesh(): THREE.Mesh {
  return new THREE.Mesh(sharedShieldGeo, sharedShieldMat);
}

// Vortex assets
const vortexCoreGeo = new THREE.SphereGeometry(0.55, 12, 12);
const vortexCoreMat = new THREE.MeshStandardMaterial({
  color: 0x0f051d,
  emissive: 0x581c87,
  emissiveIntensity: 0.9,
  roughness: 0.2,
});

const vortexDiskGeo = new THREE.TorusGeometry(1.4, 0.28, 8, 24);
vortexDiskGeo.rotateX(Math.PI / 2);
const vortexDiskMat = new THREE.MeshStandardMaterial({
  color: 0xa855f7,
  emissive: 0x9333ea,
  emissiveIntensity: 1.4,
  roughness: 0.1,
  transparent: true,
  opacity: 0.88,
});

const vortexRingOuterGeo = new THREE.TorusGeometry(2.1, 0.12, 6, 24);
vortexRingOuterGeo.rotateX(Math.PI / 2);
const vortexRingOuterMat = new THREE.MeshStandardMaterial({
  color: 0xc084fc,
  emissive: 0xa855f7,
  emissiveIntensity: 1.2,
  transparent: true,
  opacity: 0.75,
});

export function createVortexMesh(): THREE.Group {
  const group = new THREE.Group();

  // Dark central singularity
  const core = new THREE.Mesh(vortexCoreGeo, vortexCoreMat);
  core.position.y = 0.6;
  group.add(core);

  // Swirling accretion disk
  const disk = new THREE.Mesh(vortexDiskGeo, vortexDiskMat);
  disk.position.y = 0.55;
  group.add(disk);

  // Outer gravity ripple ring
  const ring = new THREE.Mesh(vortexRingOuterGeo, vortexRingOuterMat);
  ring.position.y = 0.5;
  group.add(ring);

  // Orbiting dark gravity shards
  const shardGeo = new THREE.OctahedronGeometry(0.2, 0);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xd8b4fe,
    emissive: 0x7e22ce,
    emissiveIntensity: 1.1,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const shard = new THREE.Mesh(shardGeo, shardMat);
    shard.position.set(Math.cos(angle) * 1.05, 0.6, Math.sin(angle) * 1.05);
    group.add(shard);
  }

  return group;
}

// Freeze Ray / Cryo projectile assets
const freezeCoreGeo = new THREE.OctahedronGeometry(0.48, 0);
const freezeCoreMat = new THREE.MeshStandardMaterial({
  color: 0xbae6fd,
  emissive: 0x0284c7,
  emissiveIntensity: 1.3,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.92,
});

const freezeSpikeGeo = new THREE.ConeGeometry(0.18, 0.65, 5);
freezeSpikeGeo.rotateX(Math.PI / 2);
const freezeSpikeMat = new THREE.MeshStandardMaterial({
  color: 0xe0f2fe,
  emissive: 0x38bdf8,
  emissiveIntensity: 0.8,
});

export function createFreezeRayMesh(): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(1.3);

  // Central ice diamond crystal
  const core = new THREE.Mesh(freezeCoreGeo, freezeCoreMat);
  core.scale.set(1.0, 1.0, 1.8);
  group.add(core);

  // 4 forward icy spikes
  [-0.25, 0.25].forEach(x => {
    [-0.25, 0.25].forEach(y => {
      const spike = new THREE.Mesh(freezeSpikeGeo, freezeSpikeMat);
      spike.position.set(x, y, 0.3);
      group.add(spike);
    });
  });

  return group;
}

// Plasma Cannon assets
const plasmaCoreGeo = new THREE.SphereGeometry(0.55, 16, 16);
const plasmaCoreMat = new THREE.MeshStandardMaterial({
  color: 0x10b981,
  emissive: 0x059669,
  emissiveIntensity: 1.8,
  roughness: 0.1,
  metalness: 0.2,
});

const plasmaRingGeo = new THREE.TorusGeometry(0.85, 0.08, 8, 20);
const plasmaRingMat = new THREE.MeshBasicMaterial({
  color: 0x34d399,
  transparent: true,
  opacity: 0.85,
});

const plasmaSpikeGeo = new THREE.ConeGeometry(0.12, 0.55, 6);
plasmaSpikeGeo.rotateX(Math.PI / 2);
const plasmaSpikeMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });

export function createPlasmaMesh(): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(1.4);

  const core = new THREE.Mesh(plasmaCoreGeo, plasmaCoreMat);
  group.add(core);

  // Outer orbital energy rings
  const ring1 = new THREE.Mesh(plasmaRingGeo, plasmaRingMat);
  ring1.rotation.x = Math.PI / 3;
  group.add(ring1);

  const ring2 = new THREE.Mesh(plasmaRingGeo, plasmaRingMat);
  ring2.rotation.y = Math.PI / 3;
  group.add(ring2);

  // Forward plasma dart spikes
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spike = new THREE.Mesh(plasmaSpikeGeo, plasmaSpikeMat);
    spike.position.set(Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0.5);
    group.add(spike);
  }

  return group;
}

// Oil Slick assets
const oilPuddleGeo = new THREE.CylinderGeometry(1.65, 1.8, 0.04, 24);
const oilPuddleMat = new THREE.MeshStandardMaterial({
  color: 0x09090b,
  roughness: 0.08,
  metalness: 0.85,
  emissive: 0x1e1b4b,
  emissiveIntensity: 0.35,
});

const oilDropletGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.05, 12);

export function createOilSlickMesh(): THREE.Group {
  const group = new THREE.Group();

  // Central main glossy puddle
  const mainPuddle = new THREE.Mesh(oilPuddleGeo, oilPuddleMat);
  mainPuddle.position.y = 0.03;
  group.add(mainPuddle);

  // Iridescent rainbow shimmer ring
  const sheenGeo = new THREE.RingGeometry(0.4, 1.45, 20);
  sheenGeo.rotateX(-Math.PI / 2);
  const sheenMat = new THREE.MeshBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const sheen = new THREE.Mesh(sheenGeo, sheenMat);
  sheen.position.y = 0.055;
  group.add(sheen);

  // Peripheral splatter droplets
  const dropletAngles = [0.4, 1.6, 2.7, 3.8, 5.1];
  dropletAngles.forEach((angle, idx) => {
    const dist = 1.6 + (idx % 3) * 0.35;
    const drop = new THREE.Mesh(oilDropletGeo, oilPuddleMat);
    drop.position.set(Math.cos(angle) * dist, 0.03, Math.sin(angle) * dist);
    const dropScale = 0.6 + (idx % 2) * 0.4;
    drop.scale.set(dropScale, 1, dropScale);
    group.add(drop);
  });

  return group;
}

