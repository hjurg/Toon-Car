import * as THREE from 'three';
import { TrackDefinition } from '../types';

export const TRACK_DEFINITIONS: TrackDefinition[] = [
  {
    id: 'volcano_island',
    name: 'Kraatrisügavik (Abyssal Caldera GP)',
    theme: 'volcano',
    difficulty: 'Hard',
    description: 'Eksklusiivne vulkaanirada: Sügav magma-kanjon, +45m tsentraalne spiraaltõus, kitsas laavasild ja ohtlikud asfaldimurrud!',
    lengthMeters: 3800,
    lapsDefault: 3,
    skyColor: 0x450a0a,
    fogColor: 0x7f1d1d,
    groundColor: 0x18181b,
    trackColor: 0x27272a,
    curbColorA: 0xf97316,
    curbColorB: 0xef4444,
    points: [
      // 1. Basaltkanjoni stardisirge (madalal kraatri põhjas)
      [0, 0, -250],
      [0, 0, -100],
      [0, 0, 50],
      
      // 2. Magmakoobaste tehniline S-šikaan (kerge langus laavajärvele)
      [-40, -4.0, 150],
      [60, -6.0, 240],
      [-50, -8.0, 320],
      
      // 3. Tsentraalne hiiglaslik spiraaltõus ümber vulkaanikoonuse (+45m tippu)
      [100, -2.0, 420],
      [300, 12.0, 380],
      [420, 26.0, 200],
      [350, 38.0, 20],
      [220, 45.0, -80],
      
      // 4. Kitsas ja sirge laavasild otse üle kaldeera kraatri
      [100, 45.0, -90],
      [-100, 45.0, -90],
      [-200, 44.0, -70],
      
      // 5. Ülikiire vabalangusega allamäge sektsioon (tuhaväljadele)
      [-320, 30.0, 20],
      [-400, 12.0, 120],
      [-350, 2.0, 240],
      
      // 6. Fossiilse leviataani skeletialune lai Parabolica (drifti sektsioon)
      [-220, 0.0, 320],
      [-100, 0.0, 350],
      [-20, 0.0, 300],
      
      // 7. Geisrite ja basaltsammaste vaheline tagasitee kanjonisse
      [20, 0.0, 200],
      [-80, 0.0, 100],
      [-20, 0.0, -50],
      [0, 0.0, -150],
      [0, 0.0, -250]
    ],
  },
];

export interface ItemBoxPosition {
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  active: boolean;
  respawnTime: number;
}

export interface BoostPadPosition {
  x: number;
  y: number;
  z: number;
  rotY: number;
  mesh?: THREE.Group;
}

export interface CenterlinePoint {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  t: number;
}

export type RoadSurfaceType =
  | 'asphalt'
  | 'wood'
  | 'cobblestone'
  | 'sand'
  | 'dirt'
  | 'ice'
  | 'magma_rock'
  | 'glass'
  | 'cyber_grid';

export interface SurfaceSector {
  startT: number;
  endT: number;
  surface: RoadSurfaceType;
  name: string;
  icon: string;
}

export interface TrackInfo {
  closestPoint: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  distanceToCenter: number;
  signedDistance: number;
  t: number;
  closestIndex: number;
  isOffroad: boolean;
  isOnCurb: boolean;
  isWallHit: boolean;
  wallNormal: THREE.Vector3;
  wallDistance: number;
  surface: RoadSurfaceType;
  surfaceName: string;
  surfaceIcon: string;
  isShortcut: boolean;
}

export interface TrackData {
  id: string;
  curve: THREE.CatmullRomCurve3;
  trackWidth: number;
  checkpoints: THREE.Vector3[];
  centerlinePoints: CenterlinePoint[];
  getTrackInfo: (pos: THREE.Vector3, hintIdx?: number) => TrackInfo;
  getCenterlinePointAt: (t: number) => CenterlinePoint;
  itemBoxes: ItemBoxPosition[];
  boostPads: BoostPadPosition[];
  decorations: THREE.Group;
  trackMesh: THREE.Object3D;
  curbsMesh: THREE.Group;
  wallsMesh: THREE.Group;
  startArch: THREE.Group;
  theme: TrackDefinition['theme'];
  waterMesh?: THREE.Mesh;
  lighthouseBeam?: THREE.Mesh;
  animatedProps?: THREE.Object3D[];
}

/**
 * Returns distinct surface zones along each track for terrain variety
 */
export function getTrackSectors(theme: TrackDefinition['theme']): SurfaceSector[] {
  switch (theme) {
    case 'beach':
      return [
        { startT: 0.00, endT: 0.25, surface: 'asphalt', name: 'Rannatee', icon: '🛣️' },
        { startT: 0.25, endT: 0.44, surface: 'wood', name: 'Puidust Rippsild', icon: '🪵' },
        { startT: 0.44, endT: 0.62, surface: 'dirt', name: 'Merikoobas', icon: '🪨' },
        { startT: 0.62, endT: 0.82, surface: 'sand', name: 'Kuldrand', icon: '🏖️' },
        { startT: 0.82, endT: 1.00, surface: 'asphalt', name: 'Tuletorni Sirge', icon: '🛣️' },
      ];
    case 'spooky':
      return [
        { startT: 0.00, endT: 0.22, surface: 'cobblestone', name: 'Kalmistu Munakivitee', icon: '🪨' },
        { startT: 0.22, endT: 0.42, surface: 'asphalt', name: 'Lossi Sisehoov', icon: '🏰' },
        { startT: 0.42, endT: 0.60, surface: 'dirt', name: 'Lossikeldri Krüpt', icon: '🕯️' },
        { startT: 0.60, endT: 0.78, surface: 'wood', name: 'Vana Tõstesild', icon: '🪵' },
        { startT: 0.78, endT: 1.00, surface: 'cobblestone', name: 'Gooti Munakivisirge', icon: '🪨' },
      ];
    case 'cyber':
      return [
        { startT: 0.00, endT: 0.24, surface: 'asphalt', name: 'Kübermagistraal', icon: '⚡' },
        { startT: 0.24, endT: 0.44, surface: 'glass', name: 'Holo-Klaassild', icon: '💎' },
        { startT: 0.44, endT: 0.62, surface: 'cyber_grid', name: 'Laser-Hüpertunnel', icon: '🌀' },
        { startT: 0.62, endT: 0.82, surface: 'wood', name: 'Titaani Võrestik', icon: '⛓️' },
        { startT: 0.82, endT: 1.00, surface: 'asphalt', name: 'Neoonsirge', icon: '⚡' },
      ];
    case 'ice':
      return [
        { startT: 0.00, endT: 0.24, surface: 'dirt', name: 'Lumitee Pass', icon: '❄️' },
        { startT: 0.24, endT: 0.44, surface: 'ice', name: 'Libe Liustikujää', icon: '⛸️' },
        { startT: 0.44, endT: 0.62, surface: 'ice', name: 'Liustikukoobas', icon: '🧊' },
        { startT: 0.62, endT: 0.80, surface: 'wood', name: 'Külmunud Puutsild', icon: '🪵' },
        { startT: 0.80, endT: 1.00, surface: 'dirt', name: 'Suusalaskumise Sirge', icon: '❄️' },
      ];
    case 'volcano':
      return [
        { startT: 0.00, endT: 0.15, surface: 'asphalt', name: 'Basaltkanjoni Kiirtee', icon: '🌋' },
        { startT: 0.15, endT: 0.30, surface: 'dirt', name: 'Magmakoobaste Šikaan', icon: '🔥' },
        { startT: 0.30, endT: 0.50, surface: 'asphalt', name: 'Tsentraalne Spiraaltõus', icon: '🚀' },
        { startT: 0.50, endT: 0.65, surface: 'magma_rock', name: 'Kitsas Laavasild', icon: '☄️' },
        { startT: 0.65, endT: 0.75, surface: 'asphalt', name: 'Kiirlaskumine', icon: '🎢' },
        { startT: 0.75, endT: 0.85, surface: 'dirt', name: 'Leviataani Parabolica', icon: '🦴' },
        { startT: 0.85, endT: 1.00, surface: 'asphalt', name: 'Geisrite Finiš', icon: '🌋' },
      ];
    case 'sky':
      return [
        { startT: 0.00, endT: 0.24, surface: 'asphalt', name: 'Taevalinnaku Kiirtee', icon: '☁️' },
        { startT: 0.24, endT: 0.44, surface: 'glass', name: 'Läbipaistev Klaassild', icon: '💎' },
        { startT: 0.44, endT: 0.62, surface: 'glass', name: 'Pilve-Aerotunnel', icon: '🚀' },
        { startT: 0.62, endT: 0.82, surface: 'cyber_grid', name: 'Päikesepaneelide Sild', icon: '☀️' },
        { startT: 0.82, endT: 1.00, surface: 'asphalt', name: 'Pilvetippude Finiš', icon: '☁️' },
      ];
  }
}

/**
 * Creates procedural high-res asphalt racetrack texture with lane lines
 */
function createAsphaltTexture(trackColor: number, theme: TrackDefinition['theme']): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const hexColor = '#' + trackColor.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Outer solid boundary lines
  const edgeColor = theme === 'cyber' ? '#06b6d4' : (theme === 'ice' ? '#bae6fd' : (theme === 'volcano' ? '#f97316' : (theme === 'sky' ? '#38bdf8' : '#ffffff')));
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(32, 512);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(512 - 32, 0);
  ctx.lineTo(512 - 32, 512);
  ctx.stroke();

  // Center dashed dividing line
  const centerColor = theme === 'cyber' ? '#f43f5e' : (theme === 'spooky' ? '#a855f7' : (theme === 'volcano' ? '#ef4444' : '#facc15'));
  ctx.strokeStyle = centerColor;
  ctx.lineWidth = 10;
  ctx.setLineDash([34, 30]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates rich wooden bridge planks texture
 */
function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 512, 512);

  const plankHeight = 32;
  for (let y = 0; y < 512; y += plankHeight) {
    const shade = (y / plankHeight) % 3;
    ctx.fillStyle = shade === 0 ? '#92400e' : (shade === 1 ? '#854d0e' : '#713f12');
    ctx.fillRect(0, y + 2, 512, plankHeight - 4);

    // Seam line
    ctx.fillStyle = '#291705';
    ctx.fillRect(0, y, 512, 3);

    // Grain
    ctx.strokeStyle = 'rgba(67, 20, 7, 0.4)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 3; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 6 + g * 8);
      ctx.bezierCurveTo(150, y + 4 + g * 8, 350, y + 8 + g * 8, 512, y + 6 + g * 8);
      ctx.stroke();
    }

    // Iron rivets
    ctx.fillStyle = '#1c1917';
    [40, 256, 472].forEach(rx => {
      ctx.beginPath();
      ctx.arc(rx, y + plankHeight / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates historic cobblestone paver road texture
 */
function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 28;
  const colW = 36;
  const stoneColors = ['#475569', '#64748b', '#334155', '#4b5563', '#374151'];

  for (let y = 0; y < 512; y += rowH) {
    const rowIdx = Math.floor(y / rowH);
    const offsetX = (rowIdx % 2) * (colW / 2);
    for (let x = -colW; x < 512 + colW; x += colW) {
      const col = stoneColors[Math.abs(Math.floor(x * 7 + y * 13)) % stoneColors.length];
      ctx.fillStyle = col;
      const stoneX = x + offsetX + 3;
      const stoneY = y + 3;
      const stoneW = colW - 6;
      const stoneH = rowH - 6;
      ctx.beginPath();
      ctx.rect(stoneX, stoneY, stoneW, stoneH);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(stoneX + 2, stoneY + 2, stoneW - 4, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 35);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates sunny beach sand road texture
 */
function createSandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#eab308';
  for (let y = 0; y < 512; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(120, y + 8, 380, y - 8, 512, y);
    ctx.lineTo(512, y + 4);
    ctx.bezierCurveTo(380, y - 4, 120, y + 12, 0, y + 4);
    ctx.fill();
  }

  // Tire track grooves
  ctx.fillStyle = 'rgba(161, 98, 7, 0.3)';
  for (let y = 0; y < 512; y += 8) {
    ctx.fillRect(100, y, 40, 4);
    ctx.fillRect(512 - 140, y, 40, 4);
  }

  // Shell flecks
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 45; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2.5, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates crystal blue ice surface texture
 */
function createIceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(1, '#0ea5e9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // White fracture lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let sx = Math.random() * 512;
    let sy = Math.random() * 512;
    ctx.moveTo(sx, sy);
    for (let k = 0; k < 4; k++) {
      sx += (Math.random() - 0.5) * 80;
      sy += (Math.random() - 0.5) * 80;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(80, 0, 25, 512);
  ctx.fillRect(340, 0, 35, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates cracked molten magma rock surface texture
 */
function createMagmaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 512, 512);

  // Molten lava fissures
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let mx = Math.random() * 512;
    let my = Math.random() * 512;
    ctx.moveTo(mx, my);
    for (let j = 0; j < 4; j++) {
      mx += (Math.random() - 0.5) * 110;
      my += (Math.random() - 0.5) * 110;
      ctx.lineTo(mx, my);
    }
    ctx.stroke();
  }

  // White-hot center
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let mx = Math.random() * 512;
    let my = Math.random() * 512;
    ctx.moveTo(mx, my);
    for (let j = 0; j < 3; j++) {
      mx += (Math.random() - 0.5) * 80;
      my += (Math.random() - 0.5) * 80;
      ctx.lineTo(mx, my);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 35);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates cyber futuristic glowing grid glass road texture
 */
function createCyberGlassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Pulsing chevrons
  ctx.fillStyle = '#ec4899';
  for (let y = 32; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(256, y);
    ctx.lineTo(276, y + 22);
    ctx.lineTo(266, y + 22);
    ctx.lineTo(256, y + 10);
    ctx.lineTo(246, y + 22);
    ctx.lineTo(236, y + 22);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates dirt gravel / cave trail road texture
 */
function createDirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 160; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 5, 3 + Math.random() * 5);
  }

  ctx.fillStyle = 'rgba(24, 9, 2, 0.4)';
  ctx.fillRect(80, 0, 65, 512);
  ctx.fillRect(512 - 145, 0, 65, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates natural road shoulder / verge texture
 */
function createShoulderTexture(theme: TrackDefinition['theme']): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseCol =
    theme === 'beach' ? '#ca8a04' :
    theme === 'spooky' ? '#1c1917' :
    theme === 'cyber' ? '#0f172a' :
    theme === 'ice' ? '#e0f2fe' :
    theme === 'volcano' ? '#27272a' : '#0369a1';

  ctx.fillStyle = baseCol;
  ctx.fillRect(0, 0, 128, 256);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < 120; i++) {
    ctx.fillRect(Math.random() * 128, Math.random() * 256, 3, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 50);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates alternating red/white or theme-colored curb rumble strip texture
 */
function createCurbTexture(colorA: number, colorB: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const hexA = '#' + colorA.toString(16).padStart(6, '0');
  const hexB = '#' + colorB.toString(16).padStart(6, '0');

  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = hexB;
  ctx.fillRect(0, 64, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 55);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates a start/finish checkered line texture
 */
function createStartLineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const tileSize = 32;
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 64; y += tileSize) {
      const isBlack = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
      ctx.fillStyle = isBlack ? '#18181b' : '#ffffff';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates high-contrast yellow & black warning chevron arrow texture
 */
function createChevronTexture(direction: 'left' | 'right'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // High-contrast yellow background
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 128);

  // Black chevron arrows
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 3; i++) {
    const startX = 40 + i * 75;
    ctx.beginPath();
    if (direction === 'right') {
      ctx.moveTo(startX, 15);
      ctx.lineTo(startX + 40, 64);
      ctx.lineTo(startX, 113);
      ctx.lineTo(startX + 22, 113);
      ctx.lineTo(startX + 62, 64);
      ctx.lineTo(startX + 22, 15);
    } else {
      ctx.moveTo(startX + 45, 15);
      ctx.lineTo(startX + 5, 64);
      ctx.lineTo(startX + 45, 113);
      ctx.lineTo(startX + 23, 113);
      ctx.lineTo(startX - 17, 64);
      ctx.lineTo(startX + 23, 15);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates high-contrast braking distance warning boards ("150m", "100m", "50m")
 */
function createDistanceSignTexture(distText: string, stripes: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // White reflective background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 128);

  // Red diagonal hazard stripes on the left
  ctx.fillStyle = '#ef4444';
  for (let s = 0; s < stripes; s++) {
    const sx = 20 + s * 24;
    ctx.beginPath();
    ctx.moveTo(sx, 120);
    ctx.lineTo(sx + 14, 8);
    ctx.lineTo(sx + 26, 8);
    ctx.lineTo(sx + 12, 120);
    ctx.closePath();
    ctx.fill();
  }

  // Black bold distance numerals
  ctx.fillStyle = '#09090b';
  ctx.font = '900 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(distText, 168, 64);

  // Dark border
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates dynamic high-contrast arcade sponsor graphic textures for trackside billboards
 */
function createBillboardTexture(
  title: string,
  subtitle: string,
  bgColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 256);

  // Angled dynamic racing stripes
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(95, 0);
  ctx.lineTo(35, 256);
  ctx.lineTo(0, 256);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(410, 0);
  ctx.lineTo(512, 0);
  ctx.lineTo(512, 95);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(360, 256);
  ctx.lineTo(512, 256);
  ctx.lineTo(470, 145);
  ctx.closePath();
  ctx.fill();

  // White crisp outer border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 244);

  // Inner accent line
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 476, 220);

  // Sponsor title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 10;
  ctx.fillText(title, 256, 100);

  // Subtitle / Slogan
  ctx.fillStyle = accentColor;
  ctx.font = '800 24px "Arial Black", sans-serif';
  ctx.shadowBlur = 4;
  ctx.fillText(subtitle, 256, 172);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/**
 * Creates 3D walk-through tunnel geometry with arches, portal entrances, ceiling details, and interior lighting
 */
function createTunnel(
  curve: THREE.CatmullRomCurve3,
  theme: TrackDefinition['theme'],
  trackWidth: number
): THREE.Group {
  const tunnelGroup = new THREE.Group();

  let startT = 0.44;
  let endT = 0.62;
  let wallColor = 0x573a24;
  let portalColor = 0x78350f;
  let lightColor = 0xf59e0b;
  const lightIntensity = 1.6;

  switch (theme) {
    case 'beach':
      startT = 0.44;
      endT = 0.62;
      wallColor = 0x78350f;
      portalColor = 0x92400e;
      lightColor = 0xf59e0b;
      break;
    case 'spooky':
      startT = 0.42;
      endT = 0.60;
      wallColor = 0x1e293b;
      portalColor = 0x0f172a;
      lightColor = 0x10b981;
      break;
    case 'cyber':
      startT = 0.44;
      endT = 0.62;
      wallColor = 0x090d16;
      portalColor = 0x06b6d4;
      lightColor = 0x06b6d4;
      break;
    case 'ice':
      startT = 0.44;
      endT = 0.62;
      wallColor = 0x0284c7;
      portalColor = 0x38bdf8;
      lightColor = 0x38bdf8;
      break;
    case 'volcano':
      startT = 0.15;
      endT = 0.30;
      wallColor = 0x18181b;
      portalColor = 0xef4444;
      lightColor = 0xf97316;
      break;
    case 'sky':
      startT = 0.44;
      endT = 0.62;
      wallColor = 0x0369a1;
      portalColor = 0x38bdf8;
      lightColor = 0xe0f2fe;
      break;
  }

  const upVec = new THREE.Vector3(0, 1, 0);
  const steps = 24;
  const tunnelWidth = trackWidth + 14.0;
  const tunnelHeight = 15.5;

  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const profileOffsets = [
    { x: -tunnelWidth * 0.5, y: 0 },
    { x: -tunnelWidth * 0.54, y: tunnelHeight * 0.45 },
    { x: -tunnelWidth * 0.35, y: tunnelHeight * 0.88 },
    { x: 0, y: tunnelHeight },
    { x: tunnelWidth * 0.35, y: tunnelHeight * 0.88 },
    { x: tunnelWidth * 0.54, y: tunnelHeight * 0.45 },
    { x: tunnelWidth * 0.5, y: 0 },
  ];
  const numProfilePts = profileOffsets.length;

  for (let s = 0; s <= steps; s++) {
    const t = startT + (endT - startT) * (s / steps);
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    const up = new THREE.Vector3().crossVectors(right, tangent).normalize();

    for (let p = 0; p < numProfilePts; p++) {
      const prof = profileOffsets[p];
      const vert = pt.clone()
        .addScaledVector(right, prof.x)
        .addScaledVector(up, prof.y);
      positions.push(vert.x, vert.y, vert.z);
      uvs.push(p / (numProfilePts - 1), (s / steps) * 10);
    }

    if (s < steps) {
      for (let p = 0; p < numProfilePts - 1; p++) {
        const i0 = s * numProfilePts + p;
        const i1 = i0 + 1;
        const i2 = (s + 1) * numProfilePts + p;
        const i3 = i2 + 1;
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    // Interior lights and ribs
    if (s > 0 && s < steps && s % 6 === 0) {
      const lightPos = pt.clone().addScaledVector(up, tunnelHeight * 0.88);
      const ptLight = new THREE.PointLight(lightColor, lightIntensity, 45, 1.2);
      ptLight.position.copy(lightPos);
      tunnelGroup.add(ptLight);

      const lampGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const lampMat = new THREE.MeshBasicMaterial({ color: lightColor });
      const lampMesh = new THREE.Mesh(lampGeo, lampMat);
      lampMesh.position.copy(lightPos);
      tunnelGroup.add(lampMesh);

      if (theme === 'cyber') {
        const neonBarGeo = new THREE.BoxGeometry(tunnelWidth * 0.8, 0.2, 0.4);
        const neonBarMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const neonBar = new THREE.Mesh(neonBarGeo, neonBarMat);
        neonBar.position.copy(pt).addScaledVector(up, tunnelHeight * 0.94);
        neonBar.rotation.y = Math.atan2(tangent.x, tangent.z);
        tunnelGroup.add(neonBar);
      } else if (theme === 'ice') {
        for (let ic = -2; ic <= 2; ic += 2) {
          const icicleGeo = new THREE.ConeGeometry(0.3, 1.6, 5);
          icicleGeo.rotateX(Math.PI);
          const icicleMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.1, metalness: 0.3 });
          const icicleMesh = new THREE.Mesh(icicleGeo, icicleMat);
          icicleMesh.position.copy(pt).addScaledVector(right, ic * 3.5).addScaledVector(up, tunnelHeight - 0.8);
          tunnelGroup.add(icicleMesh);
        }
      }
    }
  }

  const tunnelGeo = new THREE.BufferGeometry();
  tunnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  tunnelGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  tunnelGeo.setIndex(indices);
  tunnelGeo.computeVertexNormals();

  const tunnelMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: theme === 'ice' || theme === 'sky' ? 0.3 : 0.85,
    metalness: theme === 'cyber' || theme === 'sky' ? 0.4 : 0.1,
    side: THREE.DoubleSide,
  });
  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelMesh.castShadow = true;
  tunnelMesh.receiveShadow = true;
  tunnelGroup.add(tunnelMesh);

  // Entrance and Exit Architectural Portals (placed well outside the road)
  [startT, endT].forEach((portalT, pIdx) => {
    const pt = curve.getPointAt(portalT);
    const tangent = curve.getTangentAt(portalT).normalize();
    const rotY = Math.atan2(tangent.x, tangent.z);

    const portalFrame = new THREE.Group();
    portalFrame.position.copy(pt);
    portalFrame.rotation.y = rotY;

    const pillarGeo = new THREE.BoxGeometry(2.4, tunnelHeight + 2, 3.2);
    const pMat = new THREE.MeshStandardMaterial({ color: portalColor, roughness: 0.8, metalness: 0.2 });

    const pLeft = new THREE.Mesh(pillarGeo, pMat);
    pLeft.position.set(-tunnelWidth * 0.5 - 2.8, (tunnelHeight + 2) * 0.5, 0);
    portalFrame.add(pLeft);

    const pRight = new THREE.Mesh(pillarGeo, pMat);
    pRight.position.set(tunnelWidth * 0.5 + 2.8, (tunnelHeight + 2) * 0.5, 0);
    portalFrame.add(pRight);

    const beamGeo = new THREE.BoxGeometry(tunnelWidth + 8.4, 2.2, 3.6);
    const beam = new THREE.Mesh(beamGeo, pMat);
    beam.position.set(0, tunnelHeight + 1.8, 0);
    portalFrame.add(beam);

    if (theme === 'volcano' && pIdx === 0) {
      const skullGeo = new THREE.ConeGeometry(3.5, 6, 5);
      skullGeo.rotateX(Math.PI / 2);
      const skullMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
      const skull = new THREE.Mesh(skullGeo, skullMat);
      skull.position.set(0, tunnelHeight + 4.2, 0);
      portalFrame.add(skull);
    }

    tunnelGroup.add(portalFrame);
  });

  return tunnelGroup;
}

/**
 * Builds the complete 3D racing track with rich scenery, asphalt markings, dense centerline, and robust collision detection
 */
export function buildTrack(trackDef: TrackDefinition): TrackData {
  const vectors = trackDef.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors, true, 'centripetal', 0.5);

  // Bulletproof safety wrapper for curve sampling to prevent out-of-range t or NaN from crashing CatmullRomCurve3
  const origGetPointAt = curve.getPointAt.bind(curve);
  const origGetTangentAt = curve.getTangentAt.bind(curve);

  curve.getPointAt = (u: number, optionalTarget?: THREE.Vector3) => {
    if (isNaN(u) || !isFinite(u)) return origGetPointAt(0, optionalTarget);
    const safeU = Math.min(0.99999, Math.max(0, ((u % 1.0) + 1.0) % 1.0));
    return origGetPointAt(safeU, optionalTarget);
  };

  curve.getTangentAt = (u: number, optionalTarget?: THREE.Vector3) => {
    if (isNaN(u) || !isFinite(u)) return origGetTangentAt(0, optionalTarget);
    const safeU = Math.min(0.99999, Math.max(0, ((u % 1.0) + 1.0) % 1.0));
    return origGetTangentAt(safeU, optionalTarget);
  };

  // Generous roomy track width for exciting high-speed cartoon racing
  const trackWidth = 22.0;
  const halfW = trackWidth * 0.5;
  const curbW = 2.4;
  const shoulderW = 28.0;

  // Track surface sectors for dynamic terrain transitions
  const sectors = getTrackSectors(trackDef.theme);

  // Alternate shortcut corridors (dirt/sand/ice beside main asphalt)
  type ShortcutZone = {
    startT: number; endT: number; side: -1 | 0 | 1;
    extraWidth: number; surface: RoadSurfaceType; name: string; icon: string;
  };
  const shortcutZones: ShortcutZone[] = (() => {
    switch (trackDef.theme) {
      case 'beach':
        return [
          { startT: 0.12, endT: 0.28, side: -1, extraWidth: 32, surface: 'sand', name: 'Palmi-ranna Cut', icon: '🏖️' },
          { startT: 0.35, endT: 0.50, side: 1, extraWidth: 40, surface: 'wood', name: 'Lõunakai Pikendus', icon: '🪵' },
          { startT: 0.60, endT: 0.78, side: -1, extraWidth: 28, surface: 'sand', name: 'Rannikuliiva Lõige', icon: '🏖️' },
          { startT: 0.82, endT: 0.94, side: 1, extraWidth: 25, surface: 'asphalt', name: 'Hotelli Hoov Cut', icon: '🏨' },
        ];
      case 'spooky':
        return [
          { startT: 0.15, endT: 0.30, side: -1, extraWidth: 35, surface: 'dirt', name: 'Metsakalmistu Lõige', icon: '🪦' },
          { startT: 0.40, endT: 0.55, side: 1, extraWidth: 28, surface: 'wood', name: 'Nõiamaja Tõstesild', icon: '🕯️' },
          { startT: 0.65, endT: 0.82, side: -1, extraWidth: 40, surface: 'dirt', name: 'Kummitusmetsa Otsetee', icon: '🌲' },
        ];
      case 'cyber':
        return [
          { startT: 0.10, endT: 0.25, side: 1, extraWidth: 42, surface: 'cyber_grid', name: 'Holo-Kiirtee Cut', icon: '🌀' },
          { startT: 0.30, endT: 0.48, side: -1, extraWidth: 38, surface: 'glass', name: 'Pilvelõhkuja Katus', icon: '🏢' },
          { startT: 0.55, endT: 0.72, side: 1, extraWidth: 45, surface: 'cyber_grid', name: 'Alamlinna Metroo Cut', icon: '💎' },
          { startT: 0.78, endT: 0.92, side: -1, extraWidth: 30, surface: 'glass', name: 'Neoon-Allee', icon: '⚡' },
        ];
      case 'ice':
        return [
          { startT: 0.15, endT: 0.30, side: 1, extraWidth: 38, surface: 'ice', name: 'Liustikujää Kiirlõige', icon: '⛸️' },
          { startT: 0.38, endT: 0.55, side: -1, extraWidth: 32, surface: 'dirt', name: 'Lumine Männikoridor', icon: '❄️' },
          { startT: 0.65, endT: 0.85, side: 1, extraWidth: 45, surface: 'ice', name: 'Külmunud Jõe Cut', icon: '🌊' },
        ];
      case 'volcano':
        return [
          { startT: 0.20, endT: 0.28, side: -1, extraWidth: 35, surface: 'magma_rock', name: 'Laavajärve Lõiketee', icon: '🔥' },
          { startT: 0.35, endT: 0.45, side: 1, extraWidth: 28, surface: 'dirt', name: 'Spiraali Sisemine Cut', icon: '🌋' },
          { startT: 0.78, endT: 0.85, side: -1, extraWidth: 42, surface: 'magma_rock', name: 'Leviataani Saba Otsetee', icon: '🦴' },
        ];
      default:
        return [
          { startT: 0.15, endT: 0.30, side: -1, extraWidth: 35, surface: 'cyber_grid', name: 'Päikesepaneeli Hüpe', icon: '☀️' },
          { startT: 0.40, endT: 0.55, side: 1, extraWidth: 38, surface: 'glass', name: 'Klaasist Taevakoridor', icon: '💎' },
          { startT: 0.65, endT: 0.85, side: -1, extraWidth: 45, surface: 'cyber_grid', name: 'Pilveteki Lõige', icon: '☁️' },
        ];
    }
  })();


  // Build dense centerline (720 points along spline) for accurate physics on long multi-level tracks
  const denseCount = 320;
  const centerlinePoints: CenterlinePoint[] = [];
  const upVec = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < denseCount; i++) {
    const t = i / denseCount;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    centerlinePoints.push({
      point: pt,
      tangent,
      right,
      t,
    });
  }

  // Pre-allocated static temporary objects for high-performance zero-allocation track queries
  const _tmpSeg = new THREE.Vector3();
  const _tmpToPos = new THREE.Vector3();
  const _tmpCandidate = new THREE.Vector3();
  const _tmpToCar = new THREE.Vector3();
  const _resClosestPt = new THREE.Vector3();
  const _resTangent = new THREE.Vector3();
  const _resRight = new THREE.Vector3();
  const _resWallNormal = new THREE.Vector3();
  const _cachedTrackInfo: TrackInfo = {
    closestPoint: _resClosestPt,
    tangent: _resTangent,
    right: _resRight,
    distanceToCenter: 0,
    signedDistance: 0,
    t: 0,
    closestIndex: 0,
    isOffroad: false,
    isOnCurb: false,
    isWallHit: false,
    wallNormal: _resWallNormal,
    wallDistance: 14.0,
    surface: 'asphalt',
    surfaceName: 'Rannatee',
    surfaceIcon: '🛣️',
    isShortcut: false,
  };

  // Instant O(1) centerline point lookup without any spline arc calculation or allocations
  const getCenterlinePointAt = (t: number): CenterlinePoint => {
    const safeT = ((t % 1.0) + 1.0) % 1.0;
    const idx = Math.min(denseCount - 1, Math.max(0, Math.floor(safeT * denseCount)));
    return centerlinePoints[idx];
  };

  // High-accuracy continuous 3D multi-level track query helper (optimized with localized window search)
  const getTrackInfo = (pos: THREE.Vector3, hintIdx?: number): TrackInfo => {
    const pX = pos.x;
    const pY = pos.y;
    const pZ = pos.z;

    let bestDistSq = Infinity;
    let bestIdx = 0;

    // Fast-path: Check localized window around previous known position (only ~35 checks!)
    if (hintIdx !== undefined && hintIdx >= 0 && hintIdx < denseCount) {
      const windowStart = hintIdx - 12;
      const windowEnd = hintIdx + 24;
      for (let i = windowStart; i <= windowEnd; i++) {
        const idx = (i + denseCount) % denseCount;
        const cp = centerlinePoints[idx].point;
        const dx = cp.x - pX;
        const dy = cp.y - pY;
        const dz = cp.z - pZ;
        const dSq = dx * dx + dz * dz + dy * dy * 3.5;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = idx;
        }
      }
    }

    // Fallback: If no hint, or vehicle was teleported/respawned far away (> 35m)
    if (bestDistSq > 1225) {
      bestDistSq = Infinity;
      const step = 16;
      let coarseBestIdx = 0;
      for (let i = 0; i < denseCount; i += step) {
        const cp = centerlinePoints[i].point;
        const dx = cp.x - pX;
        const dy = cp.y - pY;
        const dz = cp.z - pZ;
        const dSq = dx * dx + dz * dz + dy * dy * 3.5;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          coarseBestIdx = i;
        }
      }

      bestIdx = coarseBestIdx;
      const startSearch = coarseBestIdx - step;
      const endSearch = coarseBestIdx + step;
      for (let i = startSearch; i <= endSearch; i++) {
        const idx = (i + denseCount) % denseCount;
        const cp = centerlinePoints[idx].point;
        const dx = cp.x - pX;
        const dy = cp.y - pY;
        const dz = cp.z - pZ;
        const dSq = dx * dx + dz * dz + dy * dy * 3.5;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = idx;
        }
      }
    }

    // 2. Project onto neighboring line segments for smooth sub-meter precision
    const prevIdx = (bestIdx - 1 + denseCount) % denseCount;
    const nextIdx = (bestIdx + 1) % denseCount;

    const testSegments = [
      [centerlinePoints[prevIdx], centerlinePoints[bestIdx]],
      [centerlinePoints[bestIdx], centerlinePoints[nextIdx]],
    ];

    _resClosestPt.copy(centerlinePoints[bestIdx].point);
    let bestSegmentDistSq = Infinity;
    _resTangent.copy(centerlinePoints[bestIdx].tangent);
    _resRight.copy(centerlinePoints[bestIdx].right);
    let finalT = centerlinePoints[bestIdx].t;

    for (let sIdx = 0; sIdx < 2; sIdx++) {
      const pA = testSegments[sIdx][0];
      const pB = testSegments[sIdx][1];
      _tmpSeg.subVectors(pB.point, pA.point);
      const segLenSq = _tmpSeg.lengthSq();
      if (segLenSq > 0.0001) {
        _tmpToPos.set(pX - pA.point.x, pY - pA.point.y, pZ - pA.point.z);
        const s = THREE.MathUtils.clamp(_tmpToPos.dot(_tmpSeg) / segLenSq, 0, 1);
        _tmpCandidate.copy(pA.point).addScaledVector(_tmpSeg, s);
        const cdx = _tmpCandidate.x - pX;
        const cdy = _tmpCandidate.y - pY;
        const cdz = _tmpCandidate.z - pZ;
        const cDistSq = cdx * cdx + cdz * cdz + cdy * cdy * 3.5;
        if (cDistSq < bestSegmentDistSq) {
          bestSegmentDistSq = cDistSq;
          _resClosestPt.copy(_tmpCandidate);
          _resTangent.lerpVectors(pA.tangent, pB.tangent, s).normalize();
          _resRight.lerpVectors(pA.right, pB.right, s).normalize();
          let diffT = pB.t - pA.t;
          while (diffT > 0.5) diffT -= 1.0;
          while (diffT < -0.5) diffT += 1.0;
          finalT = Math.min(0.99999, Math.max(0, ((pA.t + diffT * s) % 1.0 + 1.0) % 1.0));
        }
      }
    }

    const distToCenter = Math.hypot(pX - _resClosestPt.x, pZ - _resClosestPt.z);
    _tmpToCar.set(pX - _resClosestPt.x, 0, pZ - _resClosestPt.z);
    const signedDistance = _tmpToCar.dot(_resRight);
    _resWallNormal.copy(_resRight).multiplyScalar(signedDistance > 0 ? -1 : 1);

    // Zone boundaries (strict and impenetrable — vehicles cannot clip into walls or terrain)
    // road | curb | crash barrier rail
        let isElevatedBridge = _resClosestPt.y > 3.2;
    if (trackDef.theme === 'volcano') {
       isElevatedBridge = _resClosestPt.y > 42.0; // Only the main lava bridge at 45m
    }
        let isCliffEdge = (finalT > 0.08 && finalT < 0.28) || (finalT > 0.70 && finalT < 0.88);
    if (trackDef.theme === 'volcano') {
      isCliffEdge = (finalT > 0.30 && finalT < 0.50) || (finalT > 0.50 && finalT < 0.70); // Spiral climb and fast descent
    }

    
    // Tunnel bounds
    let inTunnel = false;
    if (trackDef.theme === 'beach' && finalT >= 0.44 && finalT <= 0.62) inTunnel = true;
    if (trackDef.theme === 'spooky' && finalT >= 0.42 && finalT <= 0.60) inTunnel = true;
    if (trackDef.theme === 'cyber' && finalT >= 0.44 && finalT <= 0.62) inTunnel = true;
    if (trackDef.theme === 'ice' && finalT >= 0.44 && finalT <= 0.62) inTunnel = true;
    if (trackDef.theme === 'volcano' && finalT >= 0.15 && finalT <= 0.30) inTunnel = true;

    let wallDist = halfW + curbW; // 13.4m boundary where crash barriers and tunnel walls are placed
    if (!isElevatedBridge && !isCliffEdge && !inTunnel) {
      wallDist += shoulderW - 2.0; // Allow off-road driving on the wide shoulder
    } else if (inTunnel) {
      wallDist = halfW + 7.0 - 0.5; // Tunnel visual width constraint
    }

    // Detect surface sector at current position along curve (zero closure allocation)
    let activeSector = sectors[0];
    for (let sIdx = 0; sIdx < sectors.length; sIdx++) {
      const s = sectors[sIdx];
      if (finalT >= s.startT && finalT < s.endT) {
        activeSector = s;
        break;
      }
    }
    let surface = activeSector.surface;
    let surfaceName = activeSector.name;
    let surfaceIcon = activeSector.icon;

    // --- Shortcuts: alternate corridors (dirt/sand/ice) beside the main road ---
    let isShortcut = false;
    for (let scIdx = 0; scIdx < shortcutZones.length; scIdx++) {
      const sc = shortcutZones[scIdx];
      if (finalT >= sc.startT && finalT < sc.endT) {
        const onSide =
          (sc.side > 0 && signedDistance > 0) ||
          (sc.side < 0 && signedDistance < 0) ||
          sc.side === 0;
        if (onSide) {
          wallDist = Math.max(wallDist, halfW + sc.extraWidth + 1.2);
          if (distToCenter > halfW && distToCenter <= halfW + sc.extraWidth) {
            // Treat as driveable shortcut surface (not a wall or offroad slowdown)
            surface = sc.surface;
            surfaceName = sc.name;
            surfaceIcon = sc.icon;
            isShortcut = true;
          }
        }
        break;
      }
    }

    let isOnCurb = !isShortcut && distToCenter > halfW && distToCenter <= halfW + curbW;
    let isOffroad = !isShortcut && distToCenter > halfW + curbW && distToCenter < wallDist;
    let isWallHit = distToCenter >= wallDist - 0.15;

    _cachedTrackInfo.distanceToCenter = distToCenter;
    _cachedTrackInfo.signedDistance = signedDistance;
    _cachedTrackInfo.t = finalT;
    _cachedTrackInfo.closestIndex = bestIdx;
    _cachedTrackInfo.isOffroad = isOffroad;
    _cachedTrackInfo.isOnCurb = isOnCurb;
    _cachedTrackInfo.isWallHit = isWallHit;
    _cachedTrackInfo.wallDistance = wallDist;
    _cachedTrackInfo.surface = surface;
    _cachedTrackInfo.surfaceName = surfaceName;
    _cachedTrackInfo.surfaceIcon = surfaceIcon;
    _cachedTrackInfo.isShortcut = isShortcut;

    return _cachedTrackInfo;
  };

  // 1. Generate Road Ribbon Geometry with multi-surface materials
  const segments = 200;
  const roadGeo = new THREE.BufferGeometry();
  const roadVertices: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const curbVerticesA: number[] = [];
  const curbIndicesA: number[] = [];
  const curbUvsA: number[] = [];

  const curbVerticesB: number[] = [];
  const curbIndicesB: number[] = [];
  const curbUvsB: number[] = [];

  // Natural wide shoulder geometry
  const shoulderVertices: number[] = [];
  const shoulderUvs: number[] = [];
  const shoulderIndices: number[] = [];

  const wallsGroup = new THREE.Group();
  const decorations = new THREE.Group();

  // Add 3D Tunnels only to subterranean / covered themes (cyber, ice, volcano)
  if (trackDef.theme === 'cyber' || trackDef.theme === 'ice' || trackDef.theme === 'volcano') {
    const tunnelGroup = createTunnel(curve, trackDef.theme, trackWidth);
    decorations.add(tunnelGroup);
  }

  // Shared geometry & material for elevated bridge pillars & safety railings
  const bridgePillarMat = new THREE.MeshStandardMaterial({
    color: trackDef.theme === 'cyber' ? 0x0f172a : (trackDef.theme === 'ice' ? 0x38bdf8 : (trackDef.theme === 'volcano' ? 0x18181b : (trackDef.theme === 'beach' ? 0x78350f : 0x334155))),
    roughness: 0.8,
    metalness: trackDef.theme === 'cyber' || trackDef.theme === 'sky' ? 0.7 : 0.2,
  });

  const bridgeRailingMat = new THREE.MeshStandardMaterial({
    color: trackDef.theme === 'cyber' ? 0x06b6d4 : (trackDef.theme === 'ice' ? 0xe0f2fe : (trackDef.theme === 'volcano' ? 0xf97316 : (trackDef.theme === 'sky' ? 0xfacc15 : 0x94a3b8))),
    roughness: 0.3,
    metalness: 0.6,
  });

  const barrierStripeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });

  const chevronMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 1.3,
    roughness: 0.2,
  });

  const surfaceToMatIdx: Record<RoadSurfaceType, number> = {
    asphalt: 0,
    wood: 1,
    cobblestone: 2,
    sand: 3,
    dirt: 4,
    ice: 5,
    magma_rock: 6,
    glass: 7,
    cyber_grid: 8,
  };

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) % 1;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();

    // Road vertices
    const leftPt = pt.clone().add(right.clone().multiplyScalar(-halfW));
    const rightPt = pt.clone().add(right.clone().multiplyScalar(halfW));

    roadVertices.push(leftPt.x, leftPt.y + 0.04, leftPt.z);
    roadVertices.push(rightPt.x, rightPt.y + 0.04, rightPt.z);

    const vCoord = (i / segments) * 60;
    roadUvs.push(0, vCoord);
    roadUvs.push(1, vCoord);

    if (i < segments) {
      const idx = i * 2;
      roadIndices.push(idx, idx + 1, idx + 2);
      roadIndices.push(idx + 1, idx + 3, idx + 2);

      // Assign material group based on surface sector for this segment
      const segT = (i + 0.5) / segments;
      const segSector = sectors.find(sec => segT >= sec.startT && segT < sec.endT) || sectors[0];
      const matIdx = surfaceToMatIdx[segSector.surface] ?? 0;
      roadGeo.addGroup(i * 6, 6, matIdx);
    }

    // Curbs on left and right edge
    const curbLeftOuter = leftPt.clone().add(right.clone().multiplyScalar(-curbW));
    const curbRightOuter = rightPt.clone().add(right.clone().multiplyScalar(curbW));

    // Left curb
    const cLIdx = i * 2;
    curbVerticesA.push(curbLeftOuter.x, curbLeftOuter.y + 0.14, curbLeftOuter.z);
    curbVerticesA.push(leftPt.x, leftPt.y + 0.08, leftPt.z);
    curbUvsA.push(0, vCoord);
    curbUvsA.push(1, vCoord);

    // Right curb
    curbVerticesB.push(rightPt.x, rightPt.y + 0.08, rightPt.z);
    curbVerticesB.push(curbRightOuter.x, curbRightOuter.y + 0.14, curbRightOuter.z);
    curbUvsB.push(0, vCoord);
    curbUvsB.push(1, vCoord);

    if (i < segments) {
      curbIndicesA.push(cLIdx, cLIdx + 1, cLIdx + 2);
      curbIndicesA.push(cLIdx + 1, cLIdx + 3, cLIdx + 2);

      curbIndicesB.push(cLIdx, cLIdx + 1, cLIdx + 2);
      curbIndicesB.push(cLIdx + 1, cLIdx + 3, cLIdx + 2);
    }

    // Natural wide shoulder geometry (left and right)
    const shLeftOuter = curbLeftOuter.clone().add(right.clone().multiplyScalar(-shoulderW));
    shLeftOuter.y -= 0.14;
    const shRightOuter = curbRightOuter.clone().add(right.clone().multiplyScalar(shoulderW));
    shRightOuter.y -= 0.14;

    const shIdx = i * 4;
    // Left shoulder vertices
    shoulderVertices.push(shLeftOuter.x, shLeftOuter.y, shLeftOuter.z);
    shoulderVertices.push(curbLeftOuter.x, curbLeftOuter.y + 0.06, curbLeftOuter.z);
    // Right shoulder vertices
    shoulderVertices.push(curbRightOuter.x, curbRightOuter.y + 0.06, curbRightOuter.z);
    shoulderVertices.push(shRightOuter.x, shRightOuter.y, shRightOuter.z);

    shoulderUvs.push(0, vCoord);
    shoulderUvs.push(1, vCoord);
    shoulderUvs.push(0, vCoord);
    shoulderUvs.push(1, vCoord);

    if (i < segments) {
      // Left shoulder quad
      shoulderIndices.push(shIdx, shIdx + 1, shIdx + 4);
      shoulderIndices.push(shIdx + 1, shIdx + 5, shIdx + 4);
      // Right shoulder quad
      shoulderIndices.push(shIdx + 2, shIdx + 3, shIdx + 6);
      shoulderIndices.push(shIdx + 3, shIdx + 7, shIdx + 6);
    }

    // High Multi-Level Bridge Pillars: When track is elevated (pt.y >= 7.0m), create structural viaduct pillars strictly underneath the road deck
    if (pt.y >= 7.0 && i % 8 === 0) {
      const pillarHeight = Math.max(1.0, pt.y - 1.2);
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(pt.x, pillarHeight * 0.5, pt.z);
      const rotY = Math.atan2(tangent.x, tangent.z);
      pillarGroup.rotation.y = rotY;

      // Twin structural support columns situated to the sides of the road
      const colDist = trackWidth * 0.5 + 1.8;
      [-colDist, colDist].forEach(sideX => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.6, pillarHeight, 8),
          bridgePillarMat
        );
        pillar.position.set(sideX, 0, 0);
        pillar.castShadow = true;
        pillarGroup.add(pillar);
      });

      // Horizontal cross-girder beam positioned strictly underneath the road deck
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(trackWidth + curbW * 2 + 2.4, 0.9, 2.2),
        bridgePillarMat
      );
      beam.position.y = pillarHeight * 0.5 - 0.45;
      pillarGroup.add(beam);

      decorations.add(pillarGroup);
    }
  }

  // 2. Checkpoints along spline for lap progress (48 checkpoints along larger track)
    const numCheckpoints = 48;
    const checkpoints: THREE.Vector3[] = [];
    for (let cpIdx = 0; cpIdx < numCheckpoints; cpIdx++) {
      const cpPt = curve.getPointAt(cpIdx / numCheckpoints);
      checkpoints.push(cpPt);
    }

  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  // Create individual surface materials
  const asphaltTex = createAsphaltTexture(trackDef.trackColor, trackDef.theme);
  const woodTex = createWoodTexture();
  const cobbleTex = createCobblestoneTexture();
  const sandTex = createSandTexture();
  const dirtTex = createDirtTexture();
  const iceTex = createIceTexture();
  const magmaTex = createMagmaTexture();
  const cyberGlassTex = createCyberGlassTexture();

  const asphaltMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.75, metalness: 0.1 });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0.15 });
  const cobbleMat = new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.9, metalness: 0.1 });
  const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.95, metalness: 0.05 });
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.92, metalness: 0.1 });
  const iceMat = new THREE.MeshStandardMaterial({ map: iceTex, roughness: 0.08, metalness: 0.5 });
  const magmaMat = new THREE.MeshStandardMaterial({ map: magmaTex, emissive: 0xd97706, emissiveIntensity: 0.6, roughness: 0.7, metalness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ map: cyberGlassTex, transparent: true, opacity: 0.88, roughness: 0.1, metalness: 0.6 });
  const cyberGridMat = new THREE.MeshStandardMaterial({ map: cyberGlassTex, emissive: 0x06b6d4, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.7 });

  const roadMaterials = [asphaltMat, woodMat, cobbleMat, sandMat, dirtMat, iceMat, magmaMat, glassMat, cyberGridMat];
  const trackMesh = new THREE.Mesh(roadGeo, roadMaterials);
  trackMesh.receiveShadow = true;

  // Curbs mesh with alternating curb rumble texture
  const curbGeoA = new THREE.BufferGeometry();
  curbGeoA.setAttribute('position', new THREE.Float32BufferAttribute(curbVerticesA, 3));
  curbGeoA.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvsA, 2));
  curbGeoA.setIndex(curbIndicesA);
  curbGeoA.computeVertexNormals();

  const curbGeoB = new THREE.BufferGeometry();
  curbGeoB.setAttribute('position', new THREE.Float32BufferAttribute(curbVerticesB, 3));
  curbGeoB.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvsB, 2));
  curbGeoB.setIndex(curbIndicesB);
  curbGeoB.computeVertexNormals();

  const curbTex = createCurbTexture(trackDef.curbColorA, trackDef.curbColorB);
  const curbMat = new THREE.MeshStandardMaterial({
    map: curbTex,
    roughness: 0.45,
    metalness: 0.15,
  });
  const curbMeshA = new THREE.Mesh(curbGeoA, curbMat);
  const curbMeshB = new THREE.Mesh(curbGeoB, curbMat);
  curbMeshA.receiveShadow = true;
  curbMeshB.receiveShadow = true;

  const curbsGroup = new THREE.Group();
  curbsGroup.add(curbMeshA);
  curbsGroup.add(curbMeshB);

  // Natural shoulder mesh
  const shoulderGeo = new THREE.BufferGeometry();
  shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderVertices, 3));
  shoulderGeo.setAttribute('uv', new THREE.Float32BufferAttribute(shoulderUvs, 2));
  shoulderGeo.setIndex(shoulderIndices);
  shoulderGeo.computeVertexNormals();

  const shoulderTex = createShoulderTexture(trackDef.theme);
  const shoulderMat = new THREE.MeshStandardMaterial({
    map: shoulderTex,
    roughness: 0.95,
    metalness: 0.05,
  });
  const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
  shoulderMesh.receiveShadow = true;
  decorations.add(shoulderMesh);

  // 3. Start / Finish Line Banner & Checkered Asphalt Strip
  const startArch = new THREE.Group();
  const startPt = curve.getPointAt(0);
  const startTangent = curve.getTangentAt(0).normalize();
  const startRight = new THREE.Vector3().crossVectors(startTangent, upVec).normalize();

  startArch.position.copy(startPt);
  const angle = Math.atan2(startTangent.x, startTangent.z);
  startArch.rotation.y = angle;

  // Checkered start/finish asphalt strip
  const startStripGeo = new THREE.PlaneGeometry(trackWidth, 3.2);
  const startStripTex = createStartLineTexture();
  const startStripMat = new THREE.MeshStandardMaterial({
    map: startStripTex,
    roughness: 0.5,
  });
  const startStrip = new THREE.Mesh(startStripGeo, startStripMat);
  startStrip.rotation.x = -Math.PI / 2;
  startStrip.position.set(0, 0.06, 0);
  startArch.add(startStrip);

  // Starting grid boxes on road behind the start line
  const gridBoxGeo = new THREE.PlaneGeometry(3.0, 4.5);
  const gridBoxMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const gBox = new THREE.Mesh(gridBoxGeo, gridBoxMat);
      const sideX = (col === 0 ? -1 : 1) * 3.4;
      const backZ = -(row * 7.5 + 4.5);
      gBox.rotation.x = -Math.PI / 2;
      gBox.position.set(sideX, 0.07, backZ);
      startArch.add(gBox);
    }
  }

  // Grand Start Gantry Overhead Arch (generous outer clearance)
  const gantryPillarDist = halfW + curbW + 3.5;
  const pillarGeo = new THREE.CylinderGeometry(0.55, 0.7, 10, 16);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.2 });
  const pL = new THREE.Mesh(pillarGeo, pillarMat);
  pL.position.set(-gantryPillarDist, 5, 0);
  pL.castShadow = true;
  startArch.add(pL);

  const pR = new THREE.Mesh(pillarGeo, pillarMat);
  pR.position.set(gantryPillarDist, 5, 0);
  pR.castShadow = true;
  startArch.add(pR);

  // Top overhead truss
  const trussGeo = new THREE.BoxGeometry(gantryPillarDist * 2 + 3.0, 1.4, 1.2);
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const truss = new THREE.Mesh(trussGeo, trussMat);
  truss.position.set(0, 9.8, 0);
  truss.castShadow = true;
  startArch.add(truss);

  // Start banner sign
  const bannerGeo = new THREE.BoxGeometry(trackWidth * 0.75, 1.8, 0.25);
  const bannerMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 9.8, 0.65);
  startArch.add(banner);

  // Traffic lights on arch (Red, Yellow, Green)
  [-1.5, 0, 1.5].forEach((offsetX, idx) => {
    const lightHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.4, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    lightHousing.position.set(offsetX * 2.2, 8.2, 0.6);

    const colors = [0xef4444, 0xeab308, 0x22c55e];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({
        color: colors[idx],
        emissive: colors[idx],
        emissiveIntensity: 0.8,
      })
    );
    bulb.position.set(0, 0, 0.22);
    lightHousing.add(bulb);
    startArch.add(lightHousing);
  });

  // 4. Item Boxes distributed across the long track (Shared geometries and materials for instant 60fps rendering)
  const itemBoxes: ItemBoxPosition[] = [];
  // More stations, only 2 boxes per row — cleaner pickups, fewer draw calls
  const itemStations = [0.06, 0.14, 0.23, 0.33, 0.43, 0.53, 0.63, 0.73, 0.83, 0.92];

  // Shared geometries and materials for all item boxes to prevent GPU state stalls and memory overhead
  const sharedCubeGeo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
  const sharedCubeMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  });
  const sharedGemGeo = new THREE.OctahedronGeometry(0.52, 0);
  const sharedGemMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 1.3,
    metalness: 0.85,
    roughness: 0.1,
  });
  const sharedStarGeo = new THREE.DodecahedronGeometry(0.12);
  const sharedStarMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  itemStations.forEach(t => {
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();

    // 3 boxes side-by-side (classic arcade). Pickup logic still grants only 1 item per car.
    [-3.2, 0, 3.2].forEach(offset => {
      const boxPos = pt.clone().add(right.clone().multiplyScalar(offset));
      boxPos.y = pt.y + 1.35;

      const boxGroup = new THREE.Group();
      boxGroup.position.copy(boxPos);

      const cube = new THREE.Mesh(sharedCubeGeo, sharedCubeMat);
      boxGroup.add(cube);

      const gem = new THREE.Mesh(sharedGemGeo, sharedGemMat);
      boxGroup.add(gem);

      for (let orb = 0; orb < 2; orb++) {
        const star = new THREE.Mesh(sharedStarGeo, sharedStarMat);
        const orbAngle = (orb / 2) * Math.PI * 2;
        star.position.set(Math.cos(orbAngle) * 0.95, 0, Math.sin(orbAngle) * 0.95);
        boxGroup.add(star);
      }

      itemBoxes.push({
        x: boxPos.x,
        y: boxPos.y,
        z: boxPos.z,
        mesh: boxGroup,
        active: true,
        respawnTime: 0,
      });
    });
  });

  // 5. Sleek Flush Speed Boost Pads on Road (Arcade racing style)
  const boostPads: BoostPadPosition[] = [];
  const boostStations = [0.10, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.93];

  boostStations.forEach(t => {
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const rotY = Math.atan2(tangent.x, tangent.z);

    const padGroup = new THREE.Group();
    padGroup.position.set(pt.x, pt.y + 0.04, pt.z);
    padGroup.rotation.y = rotY;

    // Dark metallic base strip embedded flush on the asphalt — narrow racing strip
    const padWidth = 3.6;
    const padLength = 4.2;
    const baseGeo = new THREE.PlaneGeometry(padWidth, padLength);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    padGroup.add(baseMesh);

    // Glowing Speed Chevron Stripes (Forward pointing arrows flush on the road)
    const chevronColor = trackDef.theme === 'cyber' ? 0x06b6d4 : (trackDef.theme === 'ice' ? 0x38bdf8 : (trackDef.theme === 'volcano' ? 0xf97316 : 0xfacc15));
    const chevronMat = new THREE.MeshBasicMaterial({ color: chevronColor });

    for (let c = -1; c <= 1; c++) {
      // 3 Forward-pointing animated-look chevron triangles
      const arrowGeo = new THREE.ConeGeometry(0.85, 1.2, 3);
      arrowGeo.rotateX(-Math.PI / 2);
      const arrowMesh = new THREE.Mesh(arrowGeo, chevronMat);
      arrowMesh.position.set(0, 0.02, c * 1.2);
      padGroup.add(arrowMesh);

      // Left & Right neon border strips
      [-padWidth * 0.46, padWidth * 0.46].forEach(sideX => {
        const sideStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(0.24, 0.9),
          chevronMat
        );
        sideStrip.rotation.x = -Math.PI / 2;
        sideStrip.position.set(sideX, 0.02, c * 1.2);
        padGroup.add(sideStrip);
      });
    }

    boostPads.push({
      x: pt.x,
      y: pt.y + 0.04,
      z: pt.z,
      rotY,
      mesh: padGroup,
    });
  });

  // Robust 3D clearance validator: verifies horizontal radius AND vertical height interval against ALL track sections
  const isTooCloseToTrack = (
    pos: THREE.Vector3,
    minDist: number = halfW + 6.0,
    objBottomY: number = pos.y - 1.5,
    objTopY: number = pos.y + 12.0
  ): boolean => {
    const minDistSq = minDist * minDist;
    for (let s = 0; s < denseCount; s++) {
      const samplePt = centerlinePoints[s].point;
      const dx = pos.x - samplePt.x;
      const dz = pos.z - samplePt.z;
      if (dx * dx + dz * dz < minDistSq) {
        // Vertical road envelope has safe clearance [-3.5m, +7.5m] around road surface
        const roadBottom = samplePt.y - 3.5;
        const roadTop = samplePt.y + 7.5;
        if (objTopY >= roadBottom && objBottomY <= roadTop) {
          return true; // Collides or encroaches on the road corridor!
        }
      }
    }
    return false;
  };

  // --- Grandstands with tiered bleachers, canopies, cheering toon spectators & billboards ---
  const addGrandstands = () => {
    const standCount = 8;
    const boxGeo = new THREE.BoxGeometry(15, 3.4, 6.5);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const stands = new THREE.InstancedMesh(boxGeo, seatMat, standCount);

    const roofGeo = new THREE.BoxGeometry(16, 0.4, 7.5);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, standCount);

    // Cheering Toon Spectators (1 draw call for all crowds across the entire track!)
    const spectatorHeadGeo = new THREE.SphereGeometry(0.42, 8, 8);
    const spectatorMat = new THREE.MeshLambertMaterial();
    const maxSpectators = standCount * 18;
    const spectatorMesh = new THREE.InstancedMesh(spectatorHeadGeo, spectatorMat, maxSpectators);
    const spectatorColors = [
      new THREE.Color(0xef4444),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0x10b981),
      new THREE.Color(0xf59e0b),
      new THREE.Color(0xec4899),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x06b6d4),
      new THREE.Color(0xf8fafc),
    ];

    const dummy = new THREE.Object3D();
    let placed = 0;
    let specIdx = 0;

    for (let i = 0; i < standCount * 3 && placed < standCount; i++) {
      const t = (0.08 + i * 0.11) % 1;
      const pt = centerlinePoints[Math.floor(t * denseCount) % denseCount];
      const side = placed % 2 === 0 ? 1 : -1;
      const pos = pt.point.clone().add(pt.right.clone().multiplyScalar(side * (halfW + 16.5)));
      if (isTooCloseToTrack(pos, halfW + 4.0, pt.point.y, pt.point.y + 9.0)) continue;

      dummy.position.set(pos.x, pt.point.y + 1.5, pos.z);
      dummy.lookAt(pt.point.x, pt.point.y + 1.5, pt.point.z);
      dummy.updateMatrix();
      stands.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(pos.x, pt.point.y + 6.2, pos.z);
      dummy.lookAt(pt.point.x, pt.point.y + 6.2, pt.point.z);
      dummy.rotateX(0.1);
      dummy.updateMatrix();
      roofs.setMatrixAt(placed, dummy.matrix);

      // Add two rows of toon spectators sitting on bleachers
      const forwardDir = new THREE.Vector3().subVectors(pt.point, pos).normalize();
      const rightDir = new THREE.Vector3().crossVectors(upVec, forwardDir).normalize();

      for (let row = 0; row < 2; row++) {
        for (let col = -4; col <= 4; col++) {
          if (specIdx < maxSpectators) {
            const specPos = pos.clone()
              .addScaledVector(rightDir, col * 1.5)
              .addScaledVector(forwardDir, (row - 0.5) * 1.8);
            specPos.y = pt.point.y + 3.4 + row * 1.2;

            dummy.position.copy(specPos);
            dummy.rotation.set(0, 0, 0);
            dummy.lookAt(pt.point.x, specPos.y, pt.point.z);
            dummy.scale.set(1, 1.2, 1);
            dummy.updateMatrix();
            spectatorMesh.setMatrixAt(specIdx, dummy.matrix);
            spectatorMesh.setColorAt(specIdx, spectatorColors[(specIdx * 5) % spectatorColors.length]);
            specIdx++;
          }
        }
      }

      placed++;
    }

    stands.instanceMatrix.needsUpdate = true;
    stands.receiveShadow = true;
    decorations.add(stands);

    roofs.instanceMatrix.needsUpdate = true;
    decorations.add(roofs);

    if (specIdx > 0) {
      spectatorMesh.instanceMatrix.needsUpdate = true;
      if (spectatorMesh.instanceColor) spectatorMesh.instanceColor.needsUpdate = true;
      decorations.add(spectatorMesh);
    }

    // 6 Custom High-Contrast Arcade Sponsor Billboards
    const billboardDefs = [
      { title: 'TURBO NITRO', subtitle: '★ 100% MAXIMUM BOOST ★', bg: '#0f172a', accent: '#f97316' },
      { title: 'BANANA MOTORS', subtitle: '★ SLIP & SLIDE RACING ★', bg: '#ca8a04', accent: '#fef08a' },
      { title: 'SUPER STAR', subtitle: '★ INVINCIBLE SPEEDWAY ★', bg: '#1e1b4b', accent: '#c084fc' },
      { title: 'CYBER GP', subtitle: '★ HYPERLINK OVERDRIVE ★', bg: '#083344', accent: '#06b6d4' },
      { title: 'DRIFT KINGDOM', subtitle: '★ APEX CORNERING TECH ★', bg: '#450a0a', accent: '#ef4444' },
      { title: 'LAVA BLASTERS', subtitle: '★ FEEL THE VOLCANIC HEAT ★', bg: '#292524', accent: '#eab308' },
    ];

    const bBoardGeo = new THREE.BoxGeometry(9.5, 4.0, 0.35);
    const bPostGeo = new THREE.CylinderGeometry(0.25, 0.32, 6, 8);
    const bPostMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });

    let bPlaced = 0;
    for (let i = 0; i < 18 && bPlaced < billboardDefs.length; i++) {
      const t = (0.13 + i * 0.14) % 1;
      const pt = centerlinePoints[Math.floor(t * denseCount) % denseCount];
      const side = bPlaced % 2 === 0 ? -1 : 1;
      const pos = pt.point.clone().add(pt.right.clone().multiplyScalar(side * (halfW + 12)));
      if (isTooCloseToTrack(pos, halfW + 4.0, pt.point.y, pt.point.y + 8.0)) continue;

      const bGroup = new THREE.Group();
      bGroup.position.set(pos.x, pt.point.y, pos.z);
      bGroup.lookAt(pt.point.x, pt.point.y, pt.point.z);

      // Support posts
      [-3.6, 3.6].forEach(px => {
        const post = new THREE.Mesh(bPostGeo, bPostMat);
        post.position.set(px, 3, 0);
        bGroup.add(post);
      });

      // Board with custom graphic canvas texture
      const bDef = billboardDefs[bPlaced];
      const bTex = createBillboardTexture(bDef.title, bDef.subtitle, bDef.bg, bDef.accent);
      const bMat = new THREE.MeshStandardMaterial({
        map: bTex,
        roughness: 0.4,
        metalness: 0.1,
      });
      const boardMesh = new THREE.Mesh(bBoardGeo, bMat);
      boardMesh.position.set(0, 5.2, 0);
      bGroup.add(boardMesh);

      decorations.add(bGroup);
      bPlaced++;
    }
  };
  addGrandstands();


  // 6. Rich Themed Scenery Props
  let waterMesh: THREE.Mesh | undefined;
  let lighthouseBeam: THREE.Mesh | undefined;
  const animatedProps: THREE.Object3D[] = [];

  if (trackDef.theme === 'beach') {
    // Large Animated Tropical Ocean
    const oceanGeo = new THREE.PlaneGeometry(3400, 3400, 24, 24);
    const oceanMat = new THREE.MeshLambertMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    waterMesh = new THREE.Mesh(oceanGeo, oceanMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -1.2;
    waterMesh.receiveShadow = true;
    decorations.add(waterMesh);

    // Shared materials (one shader program, many meshes) — keep detail, cut CPU/GPU state changes
    const palmTrunkMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const palmLeafMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const coconutMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const umbrellaPoleMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const chairMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
    const torchStickMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const torchFlameMat = new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.85 });
    const palmTrunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 7.5, 7);
    const coconutGeo = new THREE.SphereGeometry(0.28, 6, 6);
    const leafGeo = new THREE.ConeGeometry(2.4, 1.2, 5);
    const umbrellaPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6);
    const canopyGeo = new THREE.ConeGeometry(2.2, 1.2, 8);
    const chairGeo = new THREE.BoxGeometry(1.6, 0.4, 0.8);
    const torchStickGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.2, 6);
    const flameGeo = new THREE.ConeGeometry(0.35, 0.7, 6);

    // Palm trees, beach umbrellas, deck chairs, tiki torches, and a grand lighthouse
    for (let i = 0; i < 42; i++) {
      const t = (i / 42 + Math.sin(i * 99) * 0.015 + 1) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 5 + Math.random() * 26);

      const propPos = pt.clone().add(right.multiplyScalar(dist));
      propPos.y = Math.max(0, pt.y);

      if (isTooCloseToTrack(propPos, halfW + 4.5, propPos.y, propPos.y + 10.0)) {
        continue;
      }

      if (i % 3 === 0) {
        // Detailed Cartoon Palm Tree
        const tree = new THREE.Group();
        tree.position.copy(propPos);

        const trunk = new THREE.Mesh(palmTrunkGeo, palmTrunkMat);
        trunk.position.y = 3.75;
        trunk.rotation.z = side * 0.15;
        trunk.castShadow = true;
        tree.add(trunk);

        // Coconut bunch
        for (let c = 0; c < 3; c++) {
          const coconut = new THREE.Mesh(coconutGeo, coconutMat);
          coconut.position.set((c - 1) * 0.35, 7.2, 0.2);
          tree.add(coconut);
        }

        // Lush arched palm fronds
        for (let l = 0; l < 7; l++) {
          const leaf = new THREE.Mesh(leafGeo, palmLeafMat);
          leaf.position.set(0, 7.4, 0);
          leaf.rotation.y = (l / 7) * Math.PI * 2;
          leaf.rotation.z = 0.55;
          leaf.castShadow = true;
          tree.add(leaf);
        }
        decorations.add(tree);
      } else if (i % 3 === 1) {
        // Beach Umbrella & Deck Chair Set
        const beachSet = new THREE.Group();
        beachSet.position.copy(propPos);

        // Umbrella pole & canopy
        const pole = new THREE.Mesh(umbrellaPoleGeo, umbrellaPoleMat);
        pole.position.y = 1.75;
        beachSet.add(pole);

        const canopyColor = i % 2 === 0 ? 0xef4444 : 0x0284c7;
        const canopy = new THREE.Mesh(canopyGeo, new THREE.MeshLambertMaterial({ color: canopyColor }));
        canopy.position.y = 3.2;
        canopy.castShadow = true;
        beachSet.add(canopy);

        // Beach chair
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(1.0, 0.2, 0);
        chair.rotation.y = Math.random() * Math.PI;
        beachSet.add(chair);

        decorations.add(beachSet);
      } else {
        // Tiki Torch with glowing flame
        const torch = new THREE.Group();
        torch.position.copy(propPos);

        const stick = new THREE.Mesh(torchStickGeo, torchStickMat);
        stick.position.y = 1.6;
        torch.add(stick);

        const flame = new THREE.Mesh(flameGeo, torchFlameMat);
        flame.position.y = 3.3;
        torch.add(flame);

        decorations.add(torch);
      }
    }

    // Grand Cape Lighthouse with Sweeping Spotlight Beam
    const lighthouse = new THREE.Group();
    lighthouse.position.set(150, 0, -180);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 7.5, 26, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    base.position.y = 13;
    base.castShadow = true;
    lighthouse.add(base);

    // Red bands
    for (let b = 0; b < 2; b++) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(6.1 - b * 0.8, 6.7 - b * 0.8, 4.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      band.position.y = 8 + b * 9;
      lighthouse.add(band);
    }

    const lampDome = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 1.0,
      })
    );
    lampDome.position.y = 27;
    lighthouse.add(lampDome);

    // Sweeping translucent lighthouse beam
    const beamGeo = new THREE.ConeGeometry(14, 75, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 37.5);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    lighthouseBeam = new THREE.Mesh(beamGeo, beamMat);
    lighthouseBeam.position.set(150, 27, -180);
    decorations.add(lighthouseBeam);

    decorations.add(lighthouse);

    // Marina yachts & sailboats moored in bay
    const boatHullGeo = new THREE.BoxGeometry(4.2, 1.8, 11);
    const boatHullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.15, 13, 6);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 1.2, 0,
      0, 12.5, 0,
      0, 2.0, 5.0,
    ], 3));
    sailGeo.computeVertexNormals();
    const sailMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, side: THREE.DoubleSide });

    const boatSpots = [
      { x: 95, z: 320, rot: 0.5 },
      { x: 190, z: 360, rot: -0.7 },
      { x: 270, z: 335, rot: 1.1 },
    ];
    boatSpots.forEach(b => {
      const boat = new THREE.Group();
      boat.position.set(b.x, -0.2, b.z);
      boat.rotation.y = b.rot;

      const hull = new THREE.Mesh(boatHullGeo, boatHullMat);
      hull.position.y = 0.9;
      boat.add(hull);

      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 7.5;
      boat.add(mast);

      const sail = new THREE.Mesh(sailGeo, sailMat);
      boat.add(sail);

      decorations.add(boat);
    });

  } else if (trackDef.theme === 'spooky') {
    // Castle Gateway Towers spanning OVER track with stone gargoyles
    const gateGroup = new THREE.Group();
    const gateT = 0.45;
    const gatePt = curve.getPointAt(gateT);
    const gateTangent = curve.getTangentAt(gateT).normalize();
    const gateRight = new THREE.Vector3().crossVectors(gateTangent, upVec).normalize();
    gateGroup.position.copy(gatePt);
    gateGroup.rotation.y = Math.atan2(gateTangent.x, gateTangent.z);

    const gateClearance = halfW + curbW + 3.5;
    const towerGeo = new THREE.CylinderGeometry(2.6, 3.2, 18, 12);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const tLeft = new THREE.Mesh(towerGeo, stoneMat);
    tLeft.position.set(-gateClearance, 9, 0);
    gateGroup.add(tLeft);

    const tRight = new THREE.Mesh(towerGeo, stoneMat);
    tRight.position.set(gateClearance, 9, 0);
    gateGroup.add(tRight);

    // Stone Arch Bridge high overhead
    const bridgeGeo = new THREE.BoxGeometry(gateClearance * 2 + 5, 3.2, 4.5);
    const bridge = new THREE.Mesh(bridgeGeo, stoneMat);
    bridge.position.set(0, 15, 0);
    gateGroup.add(bridge);

    // Gargoyles perched atop the gateway towers
    const gargoyleGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const gargoyleLeft = new THREE.Mesh(gargoyleGeo, stoneMat);
    gargoyleLeft.position.set(-gateClearance, 19, 0);
    gateGroup.add(gargoyleLeft);

    const gargoyleRight = new THREE.Mesh(gargoyleGeo, stoneMat);
    gargoyleRight.position.set(gateClearance, 19, 0);
    gateGroup.add(gargoyleRight);

    decorations.add(gateGroup);

    const pumpkinMat = new THREE.MeshLambertMaterial({ color: 0xea580c, emissive: 0xc2410c, emissiveIntensity: 0.6 });
    const pumpkinGeo = new THREE.SphereGeometry(1.2, 10, 10);
    const tombMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const tombGeo = new THREE.BoxGeometry(1.4, 2.8, 0.45);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.6, 6);

    // Spooky Cemetery Props: Jack-o'-Lanterns, Tombstones, Crypts, Dead Trees
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 9 + Math.random() * 22);

      const propPos = pt.clone().add(right.multiplyScalar(dist));
      propPos.y = pt.y;

      if (isTooCloseToTrack(propPos, halfW + 5.0, propPos.y, propPos.y + 10.0)) {
        continue;
      }

      const propGroup = new THREE.Group();
      propGroup.position.copy(propPos);

      if (i % 3 === 0) {
        // Glowing Jack-o'-Lantern
        const pumpkin = new THREE.Mesh(pumpkinGeo, pumpkinMat);
        pumpkin.scale.set(1.3, 0.95, 1.3);
        pumpkin.position.y = 0.9;
        propGroup.add(pumpkin);

        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 1.8;
        propGroup.add(stem);
      } else if (i % 3 === 1) {
        // Weathered Tombstone / Cross
        const tomb = new THREE.Mesh(tombGeo, tombMat);
        tomb.position.y = 1.4;
        tomb.rotation.y = (Math.random() - 0.5) * 0.6;
        propGroup.add(tomb);
      } else {
        // Twisted Dead Tree
        const deadTree = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.7, 7, 7),
          new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 })
        );
        trunk.position.y = 3.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.4;
        deadTree.add(trunk);

        for (let b = 0; b < 3; b++) {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.25, 3.5, 5),
            new THREE.MeshStandardMaterial({ color: 0x18181b })
          );
          branch.position.set((b - 1) * 0.8, 5.5 + b * 0.6, 0);
          branch.rotation.z = (b - 1) * 0.7;
          deadTree.add(branch);
        }
        propGroup.add(deadTree);
      }

      decorations.add(propGroup);
    }

  } else if (trackDef.theme === 'cyber') {
    // Cyber Canyon: Neo-Tokyo Skyscrapers, Holographic Neon Billboards, and Overhead Cyber Arches
    for (let i = 0; i < 42; i++) {
      const t = (i / 42) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 12 + Math.random() * 26);

      const pPos = pt.clone().add(right.clone().multiplyScalar(dist));
      pPos.y = pt.y;

      const towerW = 5 + Math.random() * 4;
      const towerD = 5 + Math.random() * 4;
      const towerH = 24 + Math.random() * 32;

      if (!isTooCloseToTrack(pPos, halfW + 8.0, pPos.y, pPos.y + towerH + 8.0)) {
        const pGroup = new THREE.Group();
        pGroup.position.copy(pPos);

        // Skyscraper building with glowing neon window strips
        const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
        const towerMat = new THREE.MeshStandardMaterial({
          color: 0x050811,
          roughness: 0.3,
          metalness: 0.85,
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = towerH * 0.5;
        pGroup.add(tower);

        // Roof communication spire with blinking beacon
        const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 8, 6);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(0, towerH + 4, 0);
        pGroup.add(spire);

        const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const beaconColor = i % 2 === 0 ? 0xf43f5e : 0x06b6d4;
        const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, towerH + 8, 0);
        pGroup.add(beacon);

        // Large Emissive Holographic Billboard
        const signColor = i % 3 === 0 ? 0x06b6d4 : (i % 3 === 1 ? 0xf43f5e : 0xa855f7);
        const signW = 6.5;
        const signH = 3.8;
        const signGeo = new THREE.BoxGeometry(signW, signH, 0.4);
        const signMat = new THREE.MeshStandardMaterial({
          color: signColor,
          emissive: signColor,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, Math.min(towerH - 4, 22), towerD * 0.5 + 0.3);
        pGroup.add(sign);

        decorations.add(pGroup);
      }

      // Overhead Cyber Gantry Arch spanning safely over the road every 7th interval
      if (i % 7 === 0) {
        const archGroup = new THREE.Group();
        archGroup.position.copy(pt);
        archGroup.rotation.y = Math.atan2(tangent.x, tangent.z);

        const archClearance = halfW + curbW + 3.5;
        const archPillarGeo = new THREE.BoxGeometry(1.4, 12, 1.4);
        const archPillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.4 });
        
        const archP1 = new THREE.Mesh(archPillarGeo, archPillarMat);
        archP1.position.set(-archClearance, 6, 0);
        archGroup.add(archP1);

        const archP2 = new THREE.Mesh(archPillarGeo, archPillarMat);
        archP2.position.set(archClearance, 6, 0);
        archGroup.add(archP2);

        const archBeamGeo = new THREE.BoxGeometry(archClearance * 2 + 3.0, 1.2, 1.8);
        const archBeam = new THREE.Mesh(archBeamGeo, archPillarMat);
        archBeam.position.set(0, 12, 0);
        archGroup.add(archBeam);

        // Glowing Laser Header on beam
        const neonStripGeo = new THREE.BoxGeometry(archClearance * 2 + 1.0, 0.3, 0.2);
        const neonStripMat = new THREE.MeshBasicMaterial({ color: (i / 7) % 2 === 0 ? 0x06b6d4 : 0xf43f5e });
        const neonStrip = new THREE.Mesh(neonStripGeo, neonStripMat);
        neonStrip.position.set(0, 12, 0.95);
        archGroup.add(neonStrip);

        decorations.add(archGroup);
      }
    }

  } else if (trackDef.theme === 'ice') {
    // Frozen Peak: Snowy Mountain Pines, Snowmen with hats, and Crystalline Ice Arches
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 9 + Math.random() * 24);

      const propPos = pt.clone().add(right.multiplyScalar(dist));
      propPos.y = pt.y;

      if (isTooCloseToTrack(propPos, halfW + 5.0, propPos.y, propPos.y + 8.0)) {
        continue;
      }

      const propGroup = new THREE.Group();
      propGroup.position.copy(propPos);

      if (i % 3 === 0) {
        // Cute Snowman with top hat and carrot nose
        const snowman = new THREE.Group();
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

        const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), snowMat);
        b1.position.y = 1.1;
        b1.castShadow = true;
        snowman.add(b1);

        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), snowMat);
        b2.position.y = 2.7;
        b2.castShadow = true;
        snowman.add(b2);

        const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), snowMat);
        b3.position.y = 3.8;
        b3.castShadow = true;
        snowman.add(b3);

        // Carrot nose
        const carrot = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0xf97316 })
        );
        carrot.rotation.x = Math.PI / 2;
        carrot.position.set(0, 3.8, 0.65);
        snowman.add(carrot);

        // Top hat
        const hat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.55, 0.7, 10),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        hat.position.y = 4.5;
        snowman.add(hat);

        propGroup.add(snowman);
      } else if (i % 3 === 1) {
        // Multi-tiered Frosted Pine Tree with Snow Caps
        const pine = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.45, 2.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        trunk.position.y = 1.25;
        pine.add(trunk);

        const needleMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

        for (let tier = 0; tier < 3; tier++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - tier * 0.6, 2.2, 7), needleMat);
          cone.position.y = 2.8 + tier * 1.5;
          cone.castShadow = true;
          pine.add(cone);

          const snowRim = new THREE.Mesh(new THREE.ConeGeometry(1.8 - tier * 0.4, 0.7, 7), snowMat);
          snowRim.position.y = 3.6 + tier * 1.5;
          pine.add(snowRim);
        }
        propGroup.add(pine);
      } else {
        // Glowing Cyan Ice Crystal Cluster
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          roughness: 0.15,
          metalness: 0.4,
          transparent: true,
          opacity: 0.88,
        });

        for (let c = 0; c < 3; c++) {
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2 - c * 0.25, 0), crystalMat);
          crystal.scale.set(0.6, 2.6, 0.6);
          crystal.position.set((c - 1) * 0.8, 1.4, 0);
          crystal.rotation.set((c - 1) * 0.25, c * 0.6, 0);
          propGroup.add(crystal);
        }
      }

      decorations.add(propGroup);
    }
  } else if (trackDef.theme === 'volcano') {
    // 1. Glowing Molten Magma / Lava Lake below
    const lavaGeo = new THREE.PlaneGeometry(3400, 3400, 48, 48);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    waterMesh = new THREE.Mesh(lavaGeo, lavaMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -10.0;
    decorations.add(waterMesh);

    // 2. Prehistoric Giant Dinosaur Ribcage Archway in the Canyon (high clearance, zero overlap with tunnel)
    for (let r = 0; r < 6; r++) {
      const ribT = (0.72 + r * 0.018) % 1;
      const ribPt = curve.getPointAt(ribT);
      const ribTan = curve.getTangentAt(ribT).normalize();
      const ribRotY = Math.atan2(ribTan.x, ribTan.z);

      const ribGroup = new THREE.Group();
      ribGroup.position.set(ribPt.x, ribPt.y, ribPt.z);
      ribGroup.rotation.y = ribRotY;

      const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
      const archRib = new THREE.Mesh(new THREE.TorusGeometry(halfW + curbW + 6.5, 0.75, 8, 20, Math.PI), boneMat);
      archRib.position.y = 0.5;
      ribGroup.add(archRib);
      decorations.add(ribGroup);
    }

    // 3. Volcanic Props: Basalt columns, smoking lava rocks, and glowing amber crystals
    for (let i = 0; i < 36; i++) {
      const t = (i / 36) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 18 + Math.random() * 20);

      const pPos = pt.clone().add(right.multiplyScalar(dist));
      pPos.y = pt.y;

      const colHeight = 5 + Math.random() * 10;
      if (isTooCloseToTrack(pPos, halfW + 6.0, pPos.y, pPos.y + colHeight + 3.0)) {
        continue;
      }

      const pGroup = new THREE.Group();
      pGroup.position.copy(pPos);

      if (i % 3 === 0) {
        // Hexagonal Basalt Column
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.6, colHeight, 6),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
        );
        col.position.y = colHeight * 0.5;
        pGroup.add(col);

        // Glowing magma cap
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.4, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.9 })
        );
        cap.position.y = colHeight;
        pGroup.add(cap);
      } else if (i % 3 === 1) {
        // Glowing Amber Magma Crystal
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xd97706,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.5,
        });
        const cMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), crystalMat);
        cMesh.scale.set(0.7, 2.4, 0.7);
        cMesh.position.y = 1.6;
        pGroup.add(cMesh);
      } else {
        // Molten Lava Rock with cracked fissures
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.2, 1),
          new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 })
        );
        rock.position.y = 1.6;
        rock.scale.set(1.4, 0.9, 1.2);
        pGroup.add(rock);
      }

      decorations.add(pGroup);
    }

  } else if (trackDef.theme === 'sky') {
    // 1. Floating Fluffy White Cloud Sea below
    const cloudSeaGeo = new THREE.PlaneGeometry(3800, 3800, 48, 48);
    const cloudSeaMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdf4,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    waterMesh = new THREE.Mesh(cloudSeaGeo, cloudSeaMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -6.0;
    decorations.add(waterMesh);

    // 2. Futuristic Glass & Steel Sky Towers alongside elevated skyways
    for (let i = 0; i < 36; i++) {
      const t = (i / 40) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = side * (halfW + 14 + Math.random() * 24);

      const pPos = pt.clone().add(right.multiplyScalar(dist));
      pPos.y = pt.y - 12;

      const towerHeight = 35 + Math.random() * 30;
      if (isTooCloseToTrack(pPos, halfW + 8.0, pPos.y, pPos.y + towerHeight + 6.0)) {
        continue;
      }

      const pGroup = new THREE.Group();
      pGroup.position.copy(pPos);

      // Sleek Sky Spire
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 3.8, towerHeight, 8),
        new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.25,
          metalness: 0.8,
        })
      );
      tower.position.y = towerHeight * 0.5;
      pGroup.add(tower);

      // Cyan neon energy ring around tower
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.25, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.1 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = towerHeight * 0.75;
      pGroup.add(ring);

      decorations.add(pGroup);
    }
  }

  // 7. Start/Finish Grandstand with Cheering Crowds & Pennant Flags
  const grandstandGroup = new THREE.Group();
  const gsT = 0.98;
  const gsPt = curve.getPointAt(gsT);
  const gsTangent = curve.getTangentAt(gsT).normalize();
  const gsRight = new THREE.Vector3().crossVectors(gsTangent, upVec).normalize();
  const gsRotY = Math.atan2(gsTangent.x, gsTangent.z);

  grandstandGroup.position.copy(gsPt).add(gsRight.clone().multiplyScalar(halfW + curbW + 5.5));
  grandstandGroup.position.y = gsPt.y;
  grandstandGroup.rotation.y = gsRotY + Math.PI; // Face inward towards the track

  // Tiered Grandstand Structure
  const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const seatColors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899];

  // 3 Tiers of Bleachers
  for (let tier = 0; tier < 3; tier++) {
    const tierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.8, 2.2),
      standMat
    );
    tierMesh.position.set(0, 0.4 + tier * 0.9, -tier * 1.8);
    grandstandGroup.add(tierMesh);

    // Cheering Cartoon Spectators
    for (let s = -4; s <= 4; s++) {
      const spectator = new THREE.Group();
      spectator.position.set(s * 2.2 + (Math.random() - 0.5) * 0.4, 0.8 + tier * 0.9, -tier * 1.8);

      // Body (colorful shirt)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: seatColors[Math.abs(s + tier) % seatColors.length],
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.8, 8), bodyMat);
      body.position.y = 0.4;
      spectator.add(body);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfde047 })
      );
      head.position.y = 0.95;
      spectator.add(head);

      // Hat
      const hat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      hat.position.y = 1.15;
      spectator.add(hat);

      grandstandGroup.add(spectator);
    }
  }

  // Grandstand Canopy Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.3, 7.5),
    roofMat
  );
  roof.position.set(0, 4.8, -1.8);
  roof.rotation.x = 0.15;
  grandstandGroup.add(roof);

  // Roof Support Pillars
  [-11, 11].forEach(x => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 4.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    post.position.set(x, 2.4, 1.2);
    grandstandGroup.add(post);
  });

  // Fluttering Race Pennant Flags along the Straight
  for (let f = -3; f <= 3; f++) {
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
    );
    flagPole.position.set(f * 3.8, 3.25, 2.4);
    grandstandGroup.add(flagPole);

    const flagMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.4, 3),
      new THREE.MeshStandardMaterial({
        color: f % 2 === 0 ? 0xfacc15 : 0xef4444,
        side: THREE.DoubleSide,
      })
    );
    flagMesh.position.set(f * 3.8 + 0.6, 6.0, 2.4);
    flagMesh.rotation.z = -Math.PI / 2;
    grandstandGroup.add(flagMesh);
  }

  decorations.add(grandstandGroup);

  // 8. Turn Warning Chevrons & Skidmarks
  const leftChevronTex = createChevronTexture('left');
  const rightChevronTex = createChevronTexture('right');
  const chevronGeo = new THREE.PlaneGeometry(3.6, 1.8);
  const chevronSignMatL = new THREE.MeshStandardMaterial({ map: leftChevronTex, roughness: 0.3 });
  const chevronSignMatR = new THREE.MeshStandardMaterial({ map: rightChevronTex, roughness: 0.3 });

  const sampleCount = 60;
  for (let s = 0; s < sampleCount; s++) {
    const tA = s / sampleCount;
    const tB = ((s + 2) % sampleCount) / sampleCount;
    const ptA = curve.getPointAt(tA);
    const tanA = curve.getTangentAt(tA).normalize();
    const tanB = curve.getTangentAt(tB).normalize();
    const crossY = tanA.x * tanB.z - tanA.z * tanB.x;

    // Detect sharp corners
    if (Math.abs(crossY) > 0.05) {
      const rightA = new THREE.Vector3().crossVectors(tanA, upVec).normalize();
      const rotY = Math.atan2(tanA.x, tanA.z);

      // Outside of the turn gets the chevron arrow warning board (placed safely past the curbs)
      const isCurvingRight = crossY > 0;
      const outsideSide = isCurvingRight ? -1 : 1;
      const chevronPos = ptA.clone().add(rightA.clone().multiplyScalar(outsideSide * (halfW + curbW + 3.5)));
      chevronPos.y = ptA.y + 1.6;

      const signPost = new THREE.Group();
      signPost.position.copy(chevronPos);
      signPost.rotation.y = rotY + (outsideSide < 0 ? -0.2 : 0.2);

      // Post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x64748b })
      );
      post.position.y = -0.4;
      signPost.add(post);

      // Board
      const board = new THREE.Mesh(chevronGeo, isCurvingRight ? chevronSignMatR : chevronSignMatL);
      board.position.y = 0.6;
      signPost.add(board);

      decorations.add(signPost);

      // Real rubber tire skid marks on the asphalt apex (clean flush decals)
      const insideSide = -outsideSide;
      const skidGeo = new THREE.PlaneGeometry(0.75, 4.2);
      const skidMat = new THREE.MeshBasicMaterial({
        color: 0x09090b,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      const skid = new THREE.Mesh(skidGeo, skidMat);
      skid.rotation.x = -Math.PI / 2;
      skid.rotation.z = Math.PI / 2;
      const skidPos = ptA.clone().add(rightA.clone().multiplyScalar(insideSide * (halfW * 0.42)));
      skid.position.set(skidPos.x, ptA.y + 0.05, skidPos.z);
      decorations.add(skid);

      // Braking distance countdown warning boards (100m, 50m) safely offset
      const distBoardGeo = new THREE.PlaneGeometry(2.4, 1.3);
      const distTex100 = createDistanceSignTexture('100m', 2);
      const distTex50 = createDistanceSignTexture('50m', 1);

      [
        { dtFrac: -0.032, tex: distTex100 },
        { dtFrac: -0.016, tex: distTex50 },
      ].forEach(db => {
        const dbT = ((tA + db.dtFrac) % 1.0 + 1.0) % 1.0;
        const dbPt = curve.getPointAt(dbT);
        const dbTan = curve.getTangentAt(dbT).normalize();
        const dbRight = new THREE.Vector3().crossVectors(dbTan, upVec).normalize();
        const dbRotY = Math.atan2(dbTan.x, dbTan.z);

        const dbGroup = new THREE.Group();
        const dbPos = dbPt.clone().add(dbRight.clone().multiplyScalar(outsideSide * (halfW + curbW + 3.5)));
        dbGroup.position.set(dbPos.x, dbPt.y + 1.2, dbPos.z);
        dbGroup.rotation.y = dbRotY;

        const dbMesh = new THREE.Mesh(distBoardGeo, new THREE.MeshStandardMaterial({ map: db.tex, roughness: 0.3 }));
        dbGroup.add(dbMesh);

        const dbPost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        dbPost.position.y = -0.6;
        dbGroup.add(dbPost);

        decorations.add(dbGroup);
      });
    }
  }

  // 9. Majestic Sky Centerpieces (Theme Atmosphere)
  if (trackDef.theme === 'beach') {
    // 2 Floating Tropical Hot Air Balloons
    [
      { pos: new THREE.Vector3(80, 62, 100), colorA: 0xef4444, colorB: 0xfacc15 },
      { pos: new THREE.Vector3(-110, 75, -80), colorA: 0x0284c7, colorB: 0xf8fafc },
    ].forEach(balloon => {
      const bGroup = new THREE.Group();
      bGroup.position.copy(balloon.pos);

      // Balloon Envelope
      const envelope = new THREE.Mesh(
        new THREE.SphereGeometry(9, 16, 16),
        new THREE.MeshStandardMaterial({ color: balloon.colorA, roughness: 0.4 })
      );
      envelope.scale.set(1.0, 1.35, 1.0);
      bGroup.add(envelope);

      // Mid Stripe
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(8.9, 0.6, 8, 24),
        new THREE.MeshStandardMaterial({ color: balloon.colorB })
      );
      stripe.rotation.x = Math.PI / 2;
      bGroup.add(stripe);

      // Wicker Basket
      const basket = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 2.2, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      basket.position.y = -15;
      bGroup.add(basket);

      // Burner glow
      const burner = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.0 })
      );
      burner.position.y = -12.5;
      bGroup.add(burner);

      decorations.add(bGroup);
    });
  } else if (trackDef.theme === 'spooky') {
    // Giant Luminous Full Moon
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-60, 80, -220);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfef9c3,
        emissive: 0xfacc15,
        emissiveIntensity: 0.75,
        roughness: 0.8,
      })
    );
    moonGroup.add(moon);

    // Darker Crater Details on Moon Surface
    for (let c = 0; c < 5; c++) {
      const crater = new THREE.Mesh(
        new THREE.SphereGeometry(2.5 - c * 0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 })
      );
      const angle = c * 1.3;
      crater.position.set(Math.cos(angle) * 11, Math.sin(angle) * 8, 14);
      moonGroup.add(crater);
    }

    decorations.add(moonGroup);
  } else if (trackDef.theme === 'cyber') {
    // Floating Futuristic Holographic Sponsor Blimp
    const blimpGroup = new THREE.Group();
    blimpGroup.position.set(40, 70, 60);
    blimpGroup.rotation.y = 0.45;

    const hull = new THREE.Mesh(
      new THREE.SphereGeometry(14, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 })
    );
    hull.scale.set(1.0, 0.75, 2.8);
    blimpGroup.add(hull);

    // Glowing Neon Hologram Banner on Blimp
    const blimpSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 5, 28),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 1.0,
      })
    );
    blimpSign.position.set(14.2, 0, 0);
    blimpGroup.add(blimpSign);

    decorations.add(blimpGroup);
  } else if (trackDef.theme === 'ice') {
    // Giant Snowy Mountain Peaks along horizon
    const peakGeo = new THREE.ConeGeometry(95, 180, 8);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const snowCapGeo = new THREE.ConeGeometry(42, 75, 8);
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    for (let m = 0; m < 10; m++) {
      const angle = (m / 10) * Math.PI * 2;
      const dist = 680 + (m % 2) * 90;
      const mGroup = new THREE.Group();
      mGroup.position.set(Math.cos(angle) * dist, -5, Math.sin(angle) * dist);

      const mountain = new THREE.Mesh(peakGeo, rockMat);
      mountain.position.y = 90;
      mGroup.add(mountain);

      const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
      snowCap.position.y = 145;
      mGroup.add(snowCap);

      decorations.add(mGroup);
    }
  } else if (trackDef.theme === 'volcano') {
    // Giant Smoldering Volcano with glowing magma crater on horizon
    const vGroup = new THREE.Group();
    vGroup.position.set(250, -40, 150);

    const volcanoCone = new THREE.Mesh(
      new THREE.CylinderGeometry(90, 230, 240, 32),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 })
    );
    volcanoCone.position.y = 110;
    vGroup.add(volcanoCone);

    // Glowing bubbling magma crater at the peak
    const craterMagma = new THREE.Mesh(
      new THREE.CylinderGeometry(85, 85, 6, 32),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xd97706,
        emissiveIntensity: 1.2,
      })
    );
    craterMagma.position.y = 220;
    vGroup.add(craterMagma);

    decorations.add(vGroup);
  } else if (trackDef.theme === 'sky') {
    // Floating Solar Sky Station in the stratosphere
    const sGroup = new THREE.Group();
    sGroup.position.set(240, 120, -360);

    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.85 })
    );
    sGroup.add(hub);

    const solarRing = new THREE.Mesh(
      new THREE.TorusGeometry(40, 1.8, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.9 })
    );
    solarRing.rotation.x = Math.PI / 2.3;
    sGroup.add(solarRing);

    decorations.add(sGroup);
  }

  // 10. Spacious Natural Borders & Targeted Bridge Safety Barriers
  // Guard rails are placed only where necessary (elevated bridges & sharp precipices) so tracks feel open and scenic
  const railSegments = 160;
  for (let i = 0; i < railSegments; i += 2) {
    const t = i / railSegments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    const rotY = Math.atan2(tangent.x, tangent.z);

    // Only install safety crash barriers on high bridges or sharp cliff dropoffs
        let isElevatedBridge = pt.y > 3.2;
    if (trackDef.theme === 'volcano') {
       isElevatedBridge = pt.y > 42.0; // Only the main lava bridge at 45m
    }
        let isCliffEdge = (t > 0.08 && t < 0.28) || (t > 0.70 && t < 0.88);
    if (trackDef.theme === 'volcano') {
      isCliffEdge = (t > 0.30 && t < 0.50) || (t > 0.50 && t < 0.70); // Spiral climb and fast descent
    }

    if (isElevatedBridge || isCliffEdge) {
      const railGeo = new THREE.BoxGeometry(0.35, 1.1, 4.4);
      const railColor = trackDef.theme === 'cyber' ? 0x06b6d4 : (trackDef.theme === 'ice' ? 0x38bdf8 : (trackDef.theme === 'volcano' ? 0xf97316 : (trackDef.theme === 'sky' ? 0xfacc15 : 0x94a3b8)));
      const railMat = new THREE.MeshStandardMaterial({
        color: railColor,
        metalness: 0.6,
        roughness: 0.3,
      });

      // Left guard rail (placed with generous clearance at halfW + curbW + 1.2m)
      const leftWall = new THREE.Mesh(railGeo, railMat);
      leftWall.position.copy(pt).add(right.clone().multiplyScalar(-halfW - curbW - 2.0));
      leftWall.position.y += 0.55;
      leftWall.rotation.y = rotY;
      wallsGroup.add(leftWall);

      // Right guard rail
      const rightWall = new THREE.Mesh(railGeo, railMat);
      rightWall.position.copy(pt).add(right.clone().multiplyScalar(halfW + curbW + 1.2));
      rightWall.position.y += 0.55;
      rightWall.rotation.y = rotY;
      wallsGroup.add(rightWall);
    }
  }



  // Extra trackside detail: banner poles + rocks along the route (ground themes only for rocks)
  if (trackDef.theme !== 'sky') {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const flagMat = new THREE.MeshLambertMaterial({ color: trackDef.curbColorA });
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x57534e });
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 4.5, 6);
    const flagGeo = new THREE.BoxGeometry(1.8, 1.0, 0.08);
    const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
    for (let i = 0; i < 28; i++) {
      const t = (i + 0.5) / 20;
      const idx = Math.floor(t * denseCount) % denseCount;
      const cp = centerlinePoints[idx];
      const side = i % 2 === 0 ? 1 : -1;
      const base = cp.point.clone().add(cp.right.clone().multiplyScalar(side * (halfW + 5.5)));
      if (isTooCloseToTrack(base, halfW + 4.0, cp.point.y, cp.point.y + 5.0)) continue;
      if (i % 2 === 0) {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.copy(base);
        pole.position.y = cp.point.y + 2.2;
        decorations.add(pole);
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.copy(base);
        flag.position.y = cp.point.y + 4.0;
        flag.position.x += side * 0.9;
        decorations.add(flag);
      } else {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.copy(base);
        rock.position.y = cp.point.y + 0.4;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        decorations.add(rock);
      }
    }
  }

  // Visual shortcut path strips (non-asphalt alternate routes)
  {
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0xa16207 });
    const sandMat = new THREE.MeshLambertMaterial({ color: 0xfde68a });
    const iceMat = new THREE.MeshLambertMaterial({ color: 0xbae6fd });
    const magmaMat = new THREE.MeshLambertMaterial({ color: 0x7f1d1d });
    const cyberMat = new THREE.MeshLambertMaterial({ color: 0x083344 });
    const matFor = (s: string) => {
      if (s === 'sand') return sandMat;
      if (s === 'ice') return iceMat;
      if (s === 'magma_rock') return magmaMat;
      if (s === 'cyber_grid' || s === 'glass') return cyberMat;
      return dirtMat;
    };
    for (const sc of shortcutZones) {
      const samples = 14;
      for (let i = 0; i < samples; i++) {
        const t = sc.startT + (sc.endT - sc.startT) * (i / samples);
        const idx = Math.floor(t * denseCount) % denseCount;
        const cp = centerlinePoints[idx];
        const side = sc.side === 0 ? 1 : sc.side;

        const off = halfW + sc.extraWidth * 0.45;
        const stripPos = cp.point.clone().add(cp.right.clone().multiplyScalar(side * off));

        // Outer warning markers safely on outer perimeter
        if (i % 3 === 0) {
          const outerRailPos = cp.point.clone().add(cp.right.clone().multiplyScalar(side * (off + sc.extraWidth * 0.52)));
          const railPost = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 })
          );
          railPost.position.set(outerRailPos.x, cp.point.y + 0.6, outerRailPos.z);
          decorations.add(railPost);
        }

        // Dedicated Speed Boost Pad in the middle of each shortcut
        if (i === Math.floor(samples * 0.5)) {
          const padGroup = new THREE.Group();
          padGroup.position.set(stripPos.x, cp.point.y + 0.08, stripPos.z);
          padGroup.rotation.y = Math.atan2(cp.tangent.x, cp.tangent.z);

          const padGeo = new THREE.PlaneGeometry(2.8, 3.2);
          const padMat = new THREE.MeshStandardMaterial({
            color: 0xea580c,
            emissive: 0xc2410c,
            emissiveIntensity: 1.1,
            roughness: 0.2,
          });
          const padMesh = new THREE.Mesh(padGeo, padMat);
          padMesh.rotation.x = -Math.PI / 2;
          padGroup.add(padMesh);

          // Glowing speed chevron
          const scChevronGeo = new THREE.ConeGeometry(0.8, 1.2, 3);
          scChevronGeo.rotateX(-Math.PI / 2);
          const scChevronMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
          const scChevron = new THREE.Mesh(scChevronGeo, scChevronMat);
          scChevron.position.set(0, 0.02, 0);
          padGroup.add(scChevron);

          boostPads.push({
            x: stripPos.x,
            y: cp.point.y + 0.08,
            z: stripPos.z,
            rotY: Math.atan2(cp.tangent.x, cp.tangent.z),
            mesh: padGroup,
          });
          decorations.add(padGroup);

          // Dedicated Shortcut Secret Item Box
          const boxGroup = new THREE.Group();
          boxGroup.position.set(stripPos.x, cp.point.y + 1.4, stripPos.z);
          const cube = new THREE.Mesh(sharedCubeGeo, sharedCubeMat);
          boxGroup.add(cube);
          const gem = new THREE.Mesh(sharedGemGeo, sharedGemMat);
          boxGroup.add(gem);
          itemBoxes.push({
            x: stripPos.x,
            y: cp.point.y + 1.4,
            z: stripPos.z,
            mesh: boxGroup,
            active: true,
            respawnTime: 0,
          });
          decorations.add(boxGroup);
        }
      }
    }
  }

  // CODE PERF: static world — skip matrix updates every frame
  const freezeStatic = (root: THREE.Object3D) => {
    root.traverse((obj) => {
      obj.matrixAutoUpdate = false;
      obj.updateMatrix();
    });
  };
  freezeStatic(decorations);
  freezeStatic(wallsGroup);
  freezeStatic(startArch);
  if (trackMesh) freezeStatic(trackMesh);
  if (curbsGroup) freezeStatic(curbsGroup);

  // Re-enable matrix updates for animated pieces (item boxes, water, boost pads, lighthouse)
  itemBoxes.forEach((b) => {
    b.mesh.traverse((o) => { o.matrixAutoUpdate = true; });
  });
  boostPads.forEach((p) => {
    p.mesh.traverse((o) => { o.matrixAutoUpdate = true; });
  });
  if (waterMesh) {
    waterMesh.matrixAutoUpdate = true;
  }
  if (lighthouseBeam) {
    lighthouseBeam.matrixAutoUpdate = true;
  }

  return {
    id: trackDef.id,
    curve,
    trackWidth,
    checkpoints,
    centerlinePoints,
    getTrackInfo,
    getCenterlinePointAt,
    itemBoxes,
    boostPads,
    decorations,
    trackMesh,
    curbsMesh: curbsGroup,
    wallsMesh: wallsGroup,
    startArch,
    theme: trackDef.theme,
    waterMesh,
    lighthouseBeam,
    animatedProps,
  };
}
