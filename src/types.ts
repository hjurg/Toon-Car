

export type PowerUpType = 
  | 'rocket'          // Punane rakett: lühem distants, ajab taga lähimat vastast eespool
  | 'blue_rocket'     // Sinine rakett: lendab seni kuni 1. koha vastase kätte saab ja teeb mega-plahvatuse
  | 'thundercloud'    // Äikesepilv: seisab paigal teel, vastase lähedal hakkab teda taga ajama ja lööb välguga
  | 'vortex'          // Gravitatsiooni Keeris / Must Auk: tõmbab lähedal autod kokku ja tekitab spinout
  | 'freezeray'       // Jääkülmuti: külmutab tabatud vastase jääkuubiku sisse libisema
  | 'banana'          // Banaanikoor: libe lõks teel, mis teeb 360-kraadise spinni
  | 'star'            // Super Täht: vikerkaare võitmatus, ülikiirus ja vastaste minema pühkimine
  | 'mine'            // TNT plahvatuslik pomm
  | 'shield'          // Kaitsev mullkilp
  | 'turbo'           // Super Nitro kiirendus
  | 'lightning'       // Välk kõigile vastastele
  | 'anvil'           // 10T Alasi
  | 'repair'          // Kiirparandus
  | 'trio_rockets'    // 3x raketti
  | 'plasma_cannon'   // Plasma Suurtükk: läbistav ülikiire smaragdroheline plasmaenergia kuul
  | 'oil_slick';      // Õliloik: ülilibe must loik teel, tekitab 720° topeltspinni ja juhitavuse kaotuse

export interface CarStats {
  speed: number;        // Top speed factor (1-10)
  accel: number;        // Acceleration factor (1-10)
  handling: number;     // Turning and drift control (1-10)
  armor: number;        // Weight & ramming resilience (1-10)
}

export interface CarDefinition {
  id: string;
  name: string;
  driverName: string;
  driverAvatar: string; // Emoji / Icon
  description: string;
  primaryColor: string;
  secondaryColor: string;
  stats: CarStats;
  type: 'speed' | 'heavy' | 'tech' | 'agile' | 'wild' | 'cop';
}

export interface TrackCheckpoint {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface TrackDefinition {
  id: string;
  name: string;
  theme: 'beach' | 'spooky' | 'cyber' | 'ice' | 'volcano' | 'sky';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  lengthMeters: number;
  lapsDefault: number;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  trackColor: number;
  curbColorA: number;
  curbColorB: number;
  points: [number, number, number][]; // 3D spline control points
}

export type GameMode = 'single' | 'cup' | 'timetrial';
export type SpeedClass = '50cc' | '100cc' | '150cc';

export type UnderglowColor = 'none' | '#06b6d4' | '#22c55e' | '#ec4899' | '#eab308' | '#a855f7';
export type RimStyle = 'sport' | 'monster' | 'gold' | 'cyber';
export type FinishType = 'gloss' | 'metallic' | 'matte';

export interface CarCustomization {
  underglow: UnderglowColor;
  rimStyle: RimStyle;
  finish: FinishType;
}

export interface CupStanding {
  racerId: string;
  name: string;
  carId: string;
  points: number;
  stageWins: number;
}

export interface Projectile {
  id: string;
  type: 'rocket' | 'blue_rocket' | 'thundercloud' | 'banana' | 'mine' | 'anvil' | 'vortex' | 'freezeray' | 'plasma_cannon' | 'oil_slick';
  ownerId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetId?: string;
  life: number;
  active: boolean;
  state?: 'idle' | 'chasing' | 'striking';
  timer?: number;
  rotY?: number;
  scale?: number;
  hitIds?: string[];
  trackT?: number;
  lateralOffset?: number;
}

export interface PlayerInput {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steer: number;    // -1 (left) to 1 (right)
  drift: boolean;
  useItem: boolean;
  honk: boolean;
  lookBehind?: boolean;
  respawn?: boolean;
}

export interface RacerState {
  id: string;
  name: string;
  carId: string;
  isAI: boolean;
  color: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotX: number;
  rotZ: number;
  speed: number;
  steerAngle: number;
  driftFactor: number;
  isDrifting: boolean;
  driftChargeTime: number;
  
  // Race status
  lap: number;
  checkpointIndex: number;
  totalDistance: number;
  position: number;
  finished: boolean;
  finishTime?: number;
  lapTimes: number[];
  currentLapStartTime: number;
  bestLapTime: number | null;
  isWrongWay?: boolean;
  
  // Powerups & statuses
  currentItem: PowerUpType | null;
  hasShield: boolean;
  shieldTimer: number;
  turboTimer: number;
  starTimer: number;
  spinTimer: number;
  frozenTimer: number;
  itemBoxCooldown?: number;
  
  // Visual/Animation
  wheelRot: number;
  bounceOffset: number;
  speechText?: string;
  speechTimer?: number;
  
  // Surface information
  currentSurface?: string;
  surfaceName?: string;
  surfaceIcon?: string;
  trackT?: number;
  centerlineIndex?: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  carId: string;
  color: string;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  trackId: string;
  laps: number;
  maxPlayers: number;
  players: RoomPlayer[];
  state: 'waiting' | 'starting' | 'racing' | 'finished';
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  controls: 'keyboard' | 'touch';
  graphicsQuality: 'high' | 'medium';
}
