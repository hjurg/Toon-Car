import * as THREE from 'three';
import { RacerState, PlayerInput, Projectile, PowerUpType, TrackDefinition, CarDefinition, CarCustomization, SpeedClass } from '../types';
import { buildTrack, TrackData } from './tracks';
import { createToonCarMesh, CarMeshContainer, CAR_DEFINITIONS } from './cars';
import { updateRacerPhysics, resolveCarCarCollisions, updateProjectiles, applySlipstream, CollisionEvent } from './physics';
import { createAIControllers, computeAIInput, AIOpponentController } from './ai';
import { getRandomPowerUp, POWER_UPS, createRocketMesh, createBlueRocketMesh, createThundercloudMesh, createBananaMesh, createMineMesh, createShieldMesh, createVortexMesh, createFreezeRayMesh, createPlasmaMesh, createOilSlickMesh } from './powerups';
import { soundManager } from '../audio/soundManager';
import { ParticleSystem } from './particles';
import { SkidMarkManager } from './skidmarks';

// Pre-allocated static scratch vectors for zero-allocation per-frame engine updates
const _visFwd = new THREE.Vector3();
const _visRight = new THREE.Vector3();
const _visPos = new THREE.Vector3();
const _camFwd = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

export interface GameEngineCallbacks {
  onHUDUpdate: (data: {
    speed: number;
    lap: number;
    totalLaps: number;
    position: number;
    totalRacers: number;
    currentItem: PowerUpType | null;
    isDrifting: boolean;
    hasTurbo: boolean;
    hasShield: boolean;
    inSlipstream?: boolean;
    isFinalLap?: boolean;
    isLeader?: boolean;
    blueThreat?: boolean;
    isWrongWay: boolean;
    currentLapTime: number;
    bestLapTime: number | null;
    driftCharge: number;
    currentSurface?: string;
    surfaceName?: string;
    surfaceIcon?: string;
    minimapData?: {
      curvePoints: { x: number; z: number }[];
      racers: {
        id: string;
        x: number;
        z: number;
        rotY: number;
        color: string;
        isPlayer: boolean;
        position: number;
        name: string;
      }[];
    } | null;
  }) => void;
  onCombatEvent: (message: string) => void;
  onRaceFinished: (results: RacerState[]) => void;
  onCountdownTick: (value: string | number) => void;
  onProjectileSpawn?: (projectile: any) => void;
  onNetworkHit?: (hit: any) => void;
  onItemBoxTaken?: (data: any) => void;
}

export class ToonCarEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  private trackDef: TrackDefinition;
  private trackData!: TrackData;
  private totalLaps: number;

  public racers: RacerState[] = [];
  private carMeshes: Map<string, CarMeshContainer> = new Map();
  private shieldMeshes: Map<string, THREE.Mesh> = new Map();
  private shadowMeshes: Map<string, THREE.Mesh> = new Map();
  private speechSprites: Map<string, THREE.Sprite> = new Map();

  private projectiles: Projectile[] = [];
  private projectileMeshes: Map<string, THREE.Group> = new Map();

  private aiControllers: Map<string, AIOpponentController> = new Map();
  private callbacks: GameEngineCallbacks;

  // Visual FX & Environment
  private particles: ParticleSystem;
  private skidMarks: SkidMarkManager;
  private cloudsGroup?: THREE.Group;
  private cameraShake: number = 0;
  private fxThrottle: number = 0;
  /** Blocks item use briefly after pickup so Space/E hold won't instant-fire */
  private itemArmTimers: Map<string, number> = new Map();
  private posUpdateTimer: number = 0;
  private _blankInput: PlayerInput = { throttle: 0, brake: 0, steer: 0, drift: false, useItem: false, honk: false, lookBehind: false, respawn: false };
  private _aiScratchInput: PlayerInput = { throttle: 0, brake: 0, steer: 0, drift: false, useItem: false, honk: false, lookBehind: false, respawn: false };
  private _gamepadInput: PlayerInput = { throttle: 0, brake: 0, steer: 0, drift: false, useItem: false, honk: false, lookBehind: false, respawn: false };
  private hudTimer: number = 0;
  private currentCamLookTarget: THREE.Vector3 = new THREE.Vector3();
  private isFirstCamFrame: boolean = true;
  private cachedMinimapPoints: { x: number; z: number }[] | null = null;
  private cachedMinimapRacers: { id: string; x: number; z: number; color: string; isPlayer: boolean; position: number }[] = [];
  private cachedMinimapData: {
    curvePoints: { x: number; z: number }[];
    racers: { id: string; x: number; z: number; color: string; isPlayer: boolean; position: number }[];
  } = { curvePoints: [], racers: [] };

  // Local player input
  public localInput: PlayerInput = {
    throttle: 0,
    brake: 0,
    steer: 0,
    drift: false,
    useItem: false,
    honk: false,
    lookBehind: false,
    respawn: false,
  };

  public localPlayerId: string = 'player_1';
  public gameState: 'countdown' | 'racing' | 'finished' = 'countdown';
  private countdownTimer: number = 3.2;
  public userCustomization?: CarCustomization;
  public speedFactor: number = 1.0;
  public paused: boolean = false;
  private lastAnnouncedPosition: number = 0;
  private positionAnnounceCooldown: number = 0;
  private finalLapAnnounced: boolean = false;
  private nearMissCooldown: number = 0;
  private blueWarningCooldown: number = 0;
  private hitStreak: number = 0;
  private hitStreakTimer: number = 0;
  private physicsAccum: number = 0;
  private readonly fixedDt: number = 1 / 60;

  constructor(
    container: HTMLElement,
    trackDef: TrackDefinition,
    userCarId: string,
    userCarColor: string,
    totalLaps: number,
    callbacks: GameEngineCallbacks,
    customRacers?: { id: string; name: string; carId: string; color: string; isAI: boolean }[],
    userCustomization?: CarCustomization,
    speedClass?: SpeedClass,
    localPlayerId?: string
  ) {
    this.container = container;
    this.trackDef = trackDef;
    this.totalLaps = totalLaps;
    this.callbacks = callbacks;
    this.userCustomization = userCustomization;
    if (localPlayerId) {
      this.localPlayerId = localPlayerId;
    }
    if (speedClass === '50cc') {
      this.speedFactor = 0.85;
    } else if (speedClass === '150cc') {
      this.speedFactor = 1.18;
    } else {
      this.speedFactor = 1.0;
    }

    // 1. Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(trackDef.skyColor);
    this.scene.fog = new THREE.FogExp2(trackDef.fogColor, 0.0028);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1); // locked 1.0 — DPR>1 is a major stutter source on many GPUs
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);
    this.renderer.sortObjects = true;
    // Cheaper auto-clear path
    this.renderer.autoClear = true;

    // 2. Systems
    this.particles = new ParticleSystem(this.scene);
    this.skidMarks = new SkidMarkManager(this.scene);

    // 3. Lighting
    this.setupLighting();

    // 4. Track building
    this.setupTrack();

    // 5. Racers setup
    this.setupRacers(userCarId, userCarColor, customRacers);

    // 6. Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // 7. Pre-compile all WebGL shaders upfront (track, cars, particles, items, shields, rockets, mines)
    // This completely eliminates any synchronous shader compilation stutter when first picking up boxes or firing items!
    const warmupGroup = new THREE.Group();
    warmupGroup.visible = false;
    warmupGroup.add(createRocketMesh());
    warmupGroup.add(createMineMesh());
    warmupGroup.add(createShieldMesh());
    this.particles.getWarmupMeshes().forEach(m => warmupGroup.add(m));
    this.scene.add(warmupGroup);

    try {
      this.renderer.compile(this.scene, this.camera);
    } catch (_) {}

    this.scene.remove(warmupGroup);

    // Start audio
    soundManager.init();
    soundManager.startMusic();

    // Begin loop
    this.lastTime = performance.now();
    this.loop();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.25);
    sun.position.set(60, 100, 40);
    this.scene.add(sun);

    // Subtle blue hemisphere ground bounce
    const hemi = new THREE.HemisphereLight(0xffffff, this.trackDef.groundColor, 0.52);
    this.scene.add(hemi);

    // Rim light for rich 3D body reflections and depth definition
    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    rimLight.position.set(-70, 50, -50);
    this.scene.add(rimLight);
  }

  private setupTrack() {
    this.trackData = buildTrack(this.trackDef);

    // Ground terrain plane
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: this.trackDef.groundColor,
      roughness: 0.95,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.1;
    this.scene.add(ground);

    // Add track parts
    this.scene.add(this.trackData.trackMesh);
    this.scene.add(this.trackData.curbsMesh);
    this.scene.add(this.trackData.wallsMesh);
    this.scene.add(this.trackData.startArch);
    this.scene.add(this.trackData.decorations);
    if (this.trackData.waterMesh) {
      this.scene.add(this.trackData.waterMesh);
    }

    // Item boxes
    this.trackData.itemBoxes.forEach(box => {
      this.scene.add(box.mesh);
    });

    // Boost pad visual meshes (styled 3D chevron pads with side guide rails)
    this.trackData.boostPads.forEach(pad => {
      this.scene.add(pad.mesh);
    });

    // Fluffy cartoon clouds
    const cloudsGroup = new THREE.Group();
    const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const cGeo = new THREE.SphereGeometry(6 + Math.random() * 4, 7, 7);
        const puff = new THREE.Mesh(cGeo, cMat);
        puff.position.set((j - 1.5) * 5, Math.sin(j * 1.5) * 2, (Math.random() - 0.5) * 3);
        puff.scale.set(1.4, 0.7, 1);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 550, 70 + Math.random() * 25, (Math.random() - 0.5) * 550);
      cloudsGroup.add(cloud);
    }
    this.scene.add(cloudsGroup);
    this.cloudsGroup = cloudsGroup;
  }

  private setupRacers(
    userCarId: string,
    userCarColor: string,
    customRacers?: { id: string; name: string; carId: string; color: string; isAI: boolean }[]
  ) {
    const startPt = this.trackData.curve.getPointAt(0);
    const startTangent = this.trackData.curve.getTangentAt(0);
    const startRotY = Math.atan2(startTangent.x, startTangent.z);
    const right = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();
    const now = Date.now();
    const totalTrackLen = this.trackData.curve.getLength() || 700;
    const getGridSlot = (gridIndex: number) => {
      // Stagger cars evenly along the track curve behind start line (Pole position at 4.5m, then 11.5m, 18.5m, etc.)
      const distBehindStart = 4.5 + gridIndex * 7.0;
      const t = (1.0 - (distBehindStart / totalTrackLen) + 1.0) % 1.0;
      const pt = this.trackData.curve.getPointAt(t);
      const tangent = this.trackData.curve.getTangentAt(t).normalize();
      const upVec = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const side = (gridIndex % 2 === 0 ? -1 : 1) * 2.8;
      const pos = pt.clone().addScaledVector(right, side);
      const rotY = Math.atan2(tangent.x, tangent.z);
      return { pos, rotY };
    };

    if (customRacers && customRacers.length > 0) {
      customRacers.forEach((cr, i) => {
        const slot = getGridSlot(i);

        this.addRacer({
          id: cr.id,
          name: cr.name,
          carId: cr.carId,
          isAI: cr.isAI,
          color: cr.color,
          x: slot.pos.x,
          y: slot.pos.y + 0.1,
          z: slot.pos.z,
          rotY: slot.rotY,
          rotX: 0,
          rotZ: 0,
          speed: 0,
          steerAngle: 0,
          driftFactor: 0,
          isDrifting: false,
          driftChargeTime: 0,
          lap: 1,
          checkpointIndex: 0,
          totalDistance: 0,
          position: i + 1,
          finished: false,
          lapTimes: [],
          currentLapStartTime: now,
          bestLapTime: null,
          isWrongWay: false,
          currentItem: null,
          hasShield: false,
          shieldTimer: 0,
          turboTimer: 0,
          starTimer: 0,
          spinTimer: 0,
          frozenTimer: 0,
          wheelRot: 0,
          bounceOffset: 0,
        });
      });
    } else {
      // Singleplayer with 5 AI Opponents
      const aiDefs = CAR_DEFINITIONS.filter(c => c.id !== userCarId).slice(0, 5);
      const playerSlot = getGridSlot(0);

      // Add local player in Pole Position (Slot 0)
      this.addRacer({
        id: this.localPlayerId,
        name: 'Sina (You)',
        carId: userCarId,
        isAI: false,
        color: userCarColor,
        x: playerSlot.pos.x,
        y: playerSlot.pos.y + 0.1,
        z: playerSlot.pos.z,
        rotY: playerSlot.rotY,
        rotX: 0,
        rotZ: 0,
        speed: 0,
        steerAngle: 0,
        driftFactor: 0,
        isDrifting: false,
        driftChargeTime: 0,
        lap: 1,
        checkpointIndex: 0,
        totalDistance: 0,
        position: 1,
        finished: false,
        lapTimes: [],
        currentLapStartTime: now,
        bestLapTime: null,
        isWrongWay: false,
        currentItem: null,
        hasShield: false,
        shieldTimer: 0,
        turboTimer: 0,
        starTimer: 0,
        spinTimer: 0,
        frozenTimer: 0,
        wheelRot: 0,
        bounceOffset: 0,
      });

      // Add 5 AI bots in staggered grid slots 1 to 5
      aiDefs.forEach((aiCar, idx) => {
        const slot = getGridSlot(idx + 1);

        this.addRacer({
          id: `ai_${aiCar.id}`,
          name: aiCar.driverName,
          carId: aiCar.id,
          isAI: true,
          color: aiCar.primaryColor,
          x: slot.pos.x,
          y: slot.pos.y + 0.1,
          z: slot.pos.z,
          rotY: slot.rotY,
          rotX: 0,
          rotZ: 0,
          speed: 0,
          steerAngle: 0,
          driftFactor: 0,
          isDrifting: false,
          driftChargeTime: 0,
          lap: 1,
          checkpointIndex: 0,
          totalDistance: 0,
          position: idx + 2,
          finished: false,
          lapTimes: [],
          currentLapStartTime: now,
          bestLapTime: null,
          isWrongWay: false,
          currentItem: null,
          hasShield: false,
          shieldTimer: 0,
          turboTimer: 0,
          starTimer: 0,
          spinTimer: 0,
          frozenTimer: 0,
          wheelRot: 0,
          bounceOffset: 0,
        });
      });
    }

    const savedBest = localStorage.getItem(`best_lap_${this.trackData.id}`);
    if (savedBest) {
      const localRacer = this.racers.find(r => r.id === this.localPlayerId);
      if (localRacer) {
        localRacer.bestLapTime = parseFloat(savedBest);
      }
    }

    this.aiControllers = createAIControllers(this.racers);
  }

  private addRacer(state: RacerState) {
    this.racers.push(state);

    const carDef = CAR_DEFINITIONS.find(c => c.id === state.carId) || CAR_DEFINITIONS[0];
    const meshContainer = createToonCarMesh(
      carDef,
      state.color,
      state.id === this.localPlayerId ? this.userCustomization : undefined
    );
    meshContainer.root.position.set(state.x, state.y, state.z);
    meshContainer.root.rotation.y = state.rotY;

    this.scene.add(meshContainer.root);
    this.carMeshes.set(state.id, meshContainer);

    // Soft drop shadow — parented to car (no world-space y flicker / z-fight)
    const shadowGeo = new THREE.PlaneGeometry(2.2, 3.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0.07, 0);
    shadowMesh.renderOrder = -1;
    meshContainer.root.add(shadowMesh);
    this.shadowMeshes.set(state.id, shadowMesh);

    // Shield mesh
    const shield = createShieldMesh();
    shield.visible = false;
    meshContainer.root.add(shield);
    this.shieldMeshes.set(state.id, shield);
  }

  private pollGamepads(): boolean {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gpActive = false;
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        const btn = (idx: number) => gp.buttons[idx]?.pressed || false;
        
        this._gamepadInput.throttle = (btn(0) || btn(7)) ? 1 : 0; // A or RT
        this._gamepadInput.brake = (btn(1) || btn(6) || btn(2)) ? 1 : 0; // B or LT or X
        this._gamepadInput.drift = btn(2) || btn(6); // X or LT (drift/brake combo works nicely)
        
        let steer = gp.axes[0] || 0;
        if (Math.abs(steer) < 0.15) steer = 0;
        if (btn(14)) steer = -1; // D-pad left
        if (btn(15)) steer = 1;  // D-pad right
        this._gamepadInput.steer = steer;

        if (btn(3) || btn(5)) this._gamepadInput.useItem = true; // Y or RB
        else this._gamepadInput.useItem = false;

        this._gamepadInput.lookBehind = btn(4); // LB
        this._gamepadInput.respawn = btn(9); // Start

        if (btn(10) || btn(11)) this._gamepadInput.honk = true; // Stick clicks
        else this._gamepadInput.honk = false;

        gpActive = true;
        break; // Support 1st connected pad
      }
    }
    return gpActive;
  }

  // --- Main Game Loop ---
  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);

    this.pollGamepads();

    const now = performance.now();
    let frameDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameDt > 0.045) frameDt = 0.045; // clamp spiral on slow frames
    if (frameDt < 0.001) frameDt = 0.001;

    // Pause: freeze sim, keep rendering last frame state
    if (this.paused && this.gameState === 'racing') {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Direct synchronous frame simulation (prevents 60Hz discrete catch-up jitter on 30/45/75/120/144Hz screens)
    if (frameDt > 0.024) {
      const halfDt = frameDt * 0.5;
      this.simulate(halfDt, now);
      this.simulate(halfDt, now);
    } else {
      this.simulate(frameDt, now);
    }

    // Visual-only updates at display rate
    this.syncProjectileMeshes();
    this.updateVisualMeshes(frameDt);
    this.particles.update(frameDt);
    this.skidMarks.update(frameDt);
    this.updateCamera(frameDt);

    this.hudTimer += frameDt;
    if (this.hudTimer >= 0.05) {
      this.hudTimer = 0;
      this.pushHUD();
    }

    this.renderer.render(this.scene, this.camera);
  };

  /** One simulation tick (physics, AI, race rules) */
  private simulate(dt: number, now: number) {
    // 1. Countdown handler
    if (this.gameState === 'countdown') {
      const prevTimer = this.countdownTimer;
      this.countdownTimer -= dt;

      if (prevTimer >= 3.0 && this.countdownTimer < 3.0) {
        soundManager.playCountdown(false);
        this.callbacks.onCountdownTick(3);
      } else if (prevTimer >= 2.0 && this.countdownTimer < 2.0) {
        soundManager.playCountdown(false);
        this.callbacks.onCountdownTick(2);
      } else if (prevTimer >= 1.0 && this.countdownTimer < 1.0) {
        soundManager.playCountdown(false);
        this.callbacks.onCountdownTick(1);
      } else if (prevTimer > 0.0 && this.countdownTimer <= 0.0) {
        soundManager.playCountdown(true);
        this.callbacks.onCountdownTick('LÄKS!');
        this.gameState = 'racing';

        // Check for rocket start! If player is holding throttle (W/Up) as GO triggers
        const player = this.racers.find(r => r.id === this.localPlayerId);
        if (player && this.localInput.throttle > 0) {
          player.turboTimer = 1.8;
          player.speed = 46;
          soundManager.playTurbo();
          this.callbacks.onCombatEvent('🚀 TÄIUSLIK START! Nitro aktiveeritud!');
        }

        setTimeout(() => {
          this.callbacks.onCountdownTick('');
        }, 1200);
      }
    }

    // 2. Physics & Racer simulation (1:1 lockstep with display refresh)
    const canDrive = this.gameState === 'racing';

    // Count down item-arm locks
    this.itemArmTimers.forEach((t, id) => {
      const next = t - dt;
      if (next <= 0) this.itemArmTimers.delete(id);
      else this.itemArmTimers.set(id, next);
    });

    this.racers.forEach(racer => {
      let input: PlayerInput = this._blankInput;
      const isLocal = racer.id === this.localPlayerId;
      const isRemoteHuman = !racer.isAI && !isLocal;

      if (canDrive && !racer.finished) {
        if (isLocal) {
          // Merge Keyboard & Gamepad
          input = {
            throttle: Math.max(this.localInput.throttle, this._gamepadInput.throttle),
            brake: Math.max(this.localInput.brake, this._gamepadInput.brake),
            steer: Math.abs(this._gamepadInput.steer) > 0.1 ? this._gamepadInput.steer : this.localInput.steer,
            drift: this.localInput.drift || this._gamepadInput.drift,
            useItem: this.localInput.useItem || this._gamepadInput.useItem,
            honk: this.localInput.honk || this._gamepadInput.honk,
            lookBehind: this.localInput.lookBehind || this._gamepadInput.lookBehind,
            respawn: this.localInput.respawn || this._gamepadInput.respawn
          };

          if (input.useItem && racer.currentItem) {
            const arm = this.itemArmTimers.get(racer.id) || 0;
            if (arm <= 0) {
              this.firePowerUp(racer);
            }
            this.localInput.useItem = false;
            this._gamepadInput.useItem = false;
          }

          if (input.honk) {
            soundManager.playHonk();
            this.localInput.honk = false;
            this._gamepadInput.honk = false;
          }
        } else if (racer.isAI) {
          const ctrl = this.aiControllers.get(racer.id);
          if (ctrl) {
            input = computeAIInput(racer, ctrl, this.trackData, this.racers, dt, (rId) => {
              const r = this.racers.find(x => x.id === rId);
              if (r) this.firePowerUp(r);
            });
          }
        }
      }

      // Remote human players: network authority + coast + local hit reactions
      if (isRemoteHuman) {
        if (racer.spinTimer > 0) {
          racer.spinTimer -= dt;
          racer.rotY += Math.PI * 5 * dt;
          racer.speed = Math.max(0, racer.speed - 24 * dt);
        } else if (racer.frozenTimer > 0) {
          racer.frozenTimer -= dt;
          racer.speed *= 0.92;
        } else if (canDrive && !racer.finished && Math.abs(racer.speed) > 0.5) {
          const step = racer.speed * dt * 0.85;
          racer.x += Math.sin(racer.rotY) * step;
          racer.z += Math.cos(racer.rotY) * step;
        }
        return;
      }

      const oldLap = racer.lap;
      updateRacerPhysics(racer, input, this.trackData, dt, (event) => this.handleCollision(event), this.speedFactor);

      if (racer.id === this.localPlayerId && racer.lap > oldLap) {
        // Lap completed!
        const lastLapTime = racer.lapTimes[racer.lapTimes.length - 1];
        if (lastLapTime) {
          const key = `best_lap_${this.trackData.id}`;
          const stored = localStorage.getItem(key);
          const best = stored ? parseFloat(stored) : Infinity;
          if (lastLapTime < best) {
            localStorage.setItem(key, lastLapTime.toString());
            this.callbacks.onCombatEvent(`🏆 UUS PARIM RINGIAEG: ${lastLapTime.toFixed(2)}s`);
          }
        }
      }

      // Sound update for local player
      if (racer.id === this.localPlayerId) {
        soundManager.updateEngine(Math.abs(racer.speed) / 50, input.throttle > 0);
        if (racer.isDrifting) {
          soundManager.playDrift();
        }
      }

      // Check race finish
      if (racer.lap > this.totalLaps && !racer.finished) {
        racer.finished = true;
        racer.finishTime = Date.now();
        if (racer.id === this.localPlayerId) {
          soundManager.playWinFanfare();
          this.callbacks.onCombatEvent(
            racer.position === 1
              ? '🏆 VÕIT!!! Oled legendaarne!'
              : `🏁 Finiš! Koht #${racer.position}`
          );
          // Firework burst at finish
          for (let f = 0; f < 5; f++) {
            setTimeout(() => {
              this.particles.emitExplosion(
                racer.x + (Math.random() - 0.5) * 8,
                racer.y + 2 + Math.random() * 4,
                racer.z + (Math.random() - 0.5) * 8
              );
              this.particles.emitBoxBreak(racer.x, racer.y + 1, racer.z);
            }, f * 180);
          }
          this.cameraShake = 0.8;
        }

        // Check if all finished
        const allDone = this.racers.every(r => r.finished);
        if (allDone || racer.id === this.localPlayerId) {
          setTimeout(() => {
            this.callbacks.onRaceFinished(this.racers);
          }, 1500);
        }
      }
    });

    // Resolve Bumping Collisions between cars
    resolveCarCarCollisions(this.racers, dt, (event) => this.handleCollision(event));

    // Draft / slipstream boost
    if (canDrive) applySlipstream(this.racers, dt);

    // --- HYPE: final lap, near-miss, blue rocket warning ---
    this.nearMissCooldown = Math.max(0, this.nearMissCooldown - dt);
    this.blueWarningCooldown = Math.max(0, this.blueWarningCooldown - dt);
    this.hitStreakTimer = Math.max(0, this.hitStreakTimer - dt);
    if (this.hitStreakTimer <= 0) this.hitStreak = 0;

    const localPlayer = this.racers.find(r => r.id === this.localPlayerId);
    if (localPlayer && canDrive) {
      // FINAL LAP banner
      if (!this.finalLapAnnounced && localPlayer.lap === this.totalLaps && !localPlayer.finished) {
        this.finalLapAnnounced = true;
        soundManager.playCountdown(true);
        this.callbacks.onCombatEvent('🏁 VIIMANE RING!!!');
        this.callbacks.onCountdownTick('VIIMANE RING!');
        setTimeout(() => this.callbacks.onCountdownTick(''), 2200);
      }

      // Near-miss when blasting past a rival very close at speed
      if (this.nearMissCooldown <= 0 && localPlayer.speed > 18) {
        for (const other of this.racers) {
          if (other.id === localPlayer.id) continue;
          const d = Math.hypot(other.x - localPlayer.x, other.z - localPlayer.z);
          if (d > 2.2 && d < 4.2) {
            const rel = localPlayer.speed - other.speed;
            if (rel > 6) {
              this.nearMissCooldown = 3.5;
              this.callbacks.onCombatEvent('🔥 LÄHEDALT MÖÖDA!');
              this.cameraShake = Math.max(this.cameraShake, 0.25);
              break;
            }
          }
        }
      }

      // Blue rocket inbound warning
      if (this.blueWarningCooldown <= 0) {
        const threat = this.projectiles.find(
          p => p.active && p.type === 'blue_rocket' && p.targetId === this.localPlayerId
        );
        if (threat) {
          this.blueWarningCooldown = 2.2;
          this.callbacks.onCombatEvent('⚠️ SININE RAKETT TULEB SINU POOLE!!!');
          this.cameraShake = Math.max(this.cameraShake, 0.2);
        }
      }
    }


    // Update Projectiles (following track spline driving lanes)
    updateProjectiles(this.projectiles, this.racers, this.trackData, dt, (event) => this.handleCollision(event));

    // Calculate Race Standings (throttled — 6 cars, no need every frame)
    this.posUpdateTimer += dt;
    if (this.posUpdateTimer >= 0.12) {
      this.posUpdateTimer = 0;
      this.updateRacePositions();
      // Shout when local player gains/loses a place
      this.positionAnnounceCooldown = Math.max(0, this.positionAnnounceCooldown - 0.12);
      const local = this.racers.find(r => r.id === this.localPlayerId);
      if (local && this.gameState === 'racing' && this.positionAnnounceCooldown <= 0) {
        if (this.lastAnnouncedPosition === 0) {
          this.lastAnnouncedPosition = local.position;
        } else if (local.position < this.lastAnnouncedPosition) {
          this.callbacks.onCombatEvent(`⬆️ Möödusid! Nüüd ${local.position}. koht`);
          this.lastAnnouncedPosition = local.position;
          this.positionAnnounceCooldown = 2.5;
        } else if (local.position > this.lastAnnouncedPosition) {
          this.callbacks.onCombatEvent(`⬇️ Kaotasid koha — ${local.position}.`);
          this.lastAnnouncedPosition = local.position;
          this.positionAnnounceCooldown = 2.5;
        }
      }
    }

    // Item boxes respawn + light spin (sim rate)
    this.trackData.itemBoxes.forEach(box => {
      if (box.active) {
        box.mesh.rotation.y += dt * 1.8;
        // Avoid per-frame sine on Y — micro-stutter + matrix cost
      } else {
        box.mesh.visible = false;
        box.respawnTime -= dt;
        if (box.respawnTime <= 0) {
          box.active = true;
          box.mesh.visible = true;
          box.mesh.position.y = box.y;
        }
      }
    });

    // Cheap water bob at sim rate
    if (this.trackData.waterMesh) {
      this.trackData.waterMesh.position.y = -0.4 + Math.sin(now * 0.0018) * 0.12;
    }
    if (this.trackData.lighthouseBeam) {
      this.trackData.lighthouseBeam.rotation.y += dt * 0.9;
    }
  };

  private pushHUD() {
    const localRacer = this.racers.find(r => r.id === this.localPlayerId);
    if (!localRacer) return;
    const currentLapTime = localRacer.currentLapStartTime > 0
      ? (Date.now() - localRacer.currentLapStartTime) / 1000
      : 0;
    const driftCharge = (localRacer.driftChargeTime || 0) >= 2.6 ? 3 : ((localRacer.driftChargeTime || 0) >= 1.6 ? 2 : ((localRacer.driftChargeTime || 0) >= 0.75 ? 1 : 0));
    this.callbacks.onHUDUpdate({
      speed: Math.round(Math.abs(localRacer.speed) * 3.6),
      lap: Math.min(localRacer.lap, this.totalLaps),
      totalLaps: this.totalLaps,
      position: localRacer.position,
      totalRacers: this.racers.length,
      currentItem: localRacer.currentItem,
      isDrifting: localRacer.isDrifting,
      hasTurbo: localRacer.turboTimer > 0,
      hasShield: localRacer.hasShield,
      inSlipstream: !!(localRacer as any).inSlipstream,
      isFinalLap: localRacer.lap >= this.totalLaps && !localRacer.finished,
      isLeader: localRacer.position === 1,
      blueThreat: this.projectiles.some(p => p.active && p.type === 'blue_rocket' && p.targetId === this.localPlayerId),
      isWrongWay: !!localRacer.isWrongWay,
      currentLapTime,
      bestLapTime: localRacer.bestLapTime,
      driftCharge,
      currentSurface: localRacer.currentSurface,
      surfaceName: localRacer.surfaceName,
      surfaceIcon: localRacer.surfaceIcon,
      minimapData: this.getMinimapData(),
    });
  }

  private registerHitStreak() {
    this.hitStreak += 1;
    this.hitStreakTimer = 6;
    if (this.hitStreak === 2) this.callbacks.onCombatEvent('🔥 2x TABAMUS!');
    else if (this.hitStreak === 3) this.callbacks.onCombatEvent('⚡ 3x KOMBO!!!');
    else if (this.hitStreak >= 4) this.callbacks.onCombatEvent('💀 DESTROYER!!!');
  }

  private handleCollision(event: CollisionEvent) {
    if (event.type === 'car_bump') {
      soundManager.playBoing();
      this.particles.emitSparks(event.x, event.y + 0.3, event.z, 0xffd700, 5);
    } else if (event.type === 'wall_hit') {
      soundManager.playBump();
      this.particles.emitSparks(event.x, event.y + 0.3, event.z, 0xffffff, 6);
      if (event.racerId === this.localPlayerId) {
        this.cameraShake = Math.min(this.cameraShake + 0.1, 0.18);
      }
    } else if (event.type === 'item_box') {
      soundManager.playItemBox();
      this.particles.emitBoxBreak(event.x, event.y, event.z);
      const racer = this.racers.find(r => r.id === event.racerId);
      if (racer) {
        this.itemArmTimers.set(racer.id, 0.5);
        if (racer.isAI) {
          const ctrl = this.aiControllers.get(racer.id);
          if (ctrl) ctrl.itemCooldown = Math.max(ctrl.itemCooldown, 1.5);
        }
        if (racer.id === this.localPlayerId && racer.currentItem) {
          const info = POWER_UPS[racer.currentItem];
          const label = info ? `${info.icon} ${info.name}` : racer.currentItem;
          this.callbacks.onCombatEvent(`🎁 Said: ${label}!  →  vajuta E`);
        }
        // Multiplayer: hide this box for everyone
        if (racer.id === this.localPlayerId && this.callbacks.onItemBoxTaken) {
          this.callbacks.onItemBoxTaken({
            x: event.x,
            y: event.y,
            z: event.z,
            racerId: racer.id,
          });
        }
      }
    } else if (
      event.type === 'rocket_hit' ||
      event.type === 'blue_rocket_hit' ||
      event.type === 'thundercloud_strike' ||
      event.type === 'banana_hit' ||
      event.type === 'mine_hit' ||
      event.type === 'freezeray_hit' ||
      event.type === 'vortex_suck' ||
      event.type === 'plasma_hit' ||
      event.type === 'oil_slip'
    ) {
      if (event.type === 'banana_hit') {
        soundManager.playBoing();
        this.particles.emitSparks(event.x, event.y + 0.2, event.z, 0xfacc15, 6);
      } else if (event.type === 'thundercloud_strike') {
        soundManager.playExplosion();
        this.particles.emitLightning(event.x, event.y, event.z);
      } else if (event.type === 'freezeray_hit') {
        soundManager.playFreezeChime();
        this.particles.emitIceCrystals(event.x, event.y + 0.5, event.z);
      } else if (event.type === 'vortex_suck') {
        soundManager.playVortexHum();
        this.particles.emitVortexSwirl(event.x, event.y + 0.5, event.z);
      } else if (event.type === 'plasma_hit') {
        soundManager.playPlasmaShot();
        this.particles.emitPlasmaBurst(event.x, event.y + 0.4, event.z);
      } else if (event.type === 'oil_slip') {
        soundManager.playOilSlick();
        this.particles.emitOilSplatter(event.x, event.y + 0.2, event.z);
      } else {
        soundManager.playExplosion();
        this.particles.emitExplosion(event.x, event.y, event.z);
      }
      if (event.targetId === this.localPlayerId) {
        this.cameraShake = event.type === 'banana_hit' || event.type === 'oil_slip' ? 0.6 : (event.type === 'freezeray_hit' ? 0.75 : 1.0);
      }
      const attacker = this.racers.find(r => r.id === event.racerId);
      const target = this.racers.find(r => r.id === event.targetId);
      if (target) {
        const labels: Record<string, string> = {
          rocket_hit: `💥 ${(attacker && attacker.name) || 'Keegi'} tabas raketiga ${target.name}!`,
          blue_rocket_hit: `🔷 SININE RAKETT tabas ${target.name}!`,
          thundercloud_strike: `⛈️ ÄIKESELOÖK tabas ${target.name}!`,
          banana_hit: `🍌 ${target.name} libises banaanile!`,
          mine_hit: `💣 ${target.name} sõitis miinile otsa!`,
          freezeray_hit: `❄️ ${(attacker && attacker.name) || 'Keegi'} külmutas ${target.name} jääkamakasse!`,
          vortex_suck: `🌀 ${(attacker && attacker.name) || 'Keegi'} püüdis ${target.name} musta auku!`,
          plasma_hit: `🔮 ${(attacker && attacker.name) || 'Keegi'} tabas plasma-suurtükiga ${target.name}!`,
          oil_slip: `🛢️ ${target.name} libises õliloigule ja tegi 720° spinni!`,
        };
        this.callbacks.onCombatEvent(labels[event.type] || 'Tabamus!');
        if (attacker && attacker.id === this.localPlayerId) {
          try { this.registerHitStreak(); } catch (_) { /* ignore */ }
        }
      }
      // Broadcast hit so every client applies reaction (esp. target)
      if (event.targetId && this.callbacks.onNetworkHit) {
        const attackerId = event.racerId;
        // Prefer attacker client as authority; also allow if target is remote on our screen
        if (attackerId === this.localPlayerId || event.targetId !== this.localPlayerId) {
          this.callbacks.onNetworkHit({
            type: event.type,
            targetId: event.targetId,
            x: event.x,
            y: event.y,
            z: event.z,
          });
        }
      }
    } else if (event.type === 'boost_pad') {
      soundManager.playTurbo();
      const racer = this.racers.find(r => r.id === event.racerId);
      if (racer && racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('⚡ KIIRENDUSPADI! Nitro aktiveeritud!');
      }
    }
  }


  /** Snapshot of local car for multiplayer broadcast */
  public getLocalSyncState() {
    const r = this.racers.find(x => x.id === this.localPlayerId);
    if (!r) return null;
    // Inactive box indices — other clients hide the same boxes
    const inactiveBoxes: number[] = [];
    this.trackData.itemBoxes.forEach((b, i) => {
      if (!b.active) inactiveBoxes.push(i);
    });
    // Projectiles we own — continuous resync so one dropped packet doesn't hide them
    const myProjectiles = this.projectiles
      .filter(p => p.active && p.ownerId === this.localPlayerId)
      .map(p => ({
        id: p.id,
        type: p.type,
        ownerId: p.ownerId,
        x: p.x,
        y: p.y,
        z: p.z,
        vx: p.vx,
        vy: p.vy,
        vz: p.vz,
        life: p.life,
        targetId: p.targetId,
        state: p.state,
        timer: p.timer,
      }));
    return {
      id: r.id,
      x: r.x,
      y: r.y,
      z: r.z,
      rotY: r.rotY,
      speed: r.speed,
      steerAngle: r.steerAngle,
      isDrifting: r.isDrifting,
      lap: r.lap,
      position: r.position,
      checkpointIndex: r.checkpointIndex,
      totalDistance: r.totalDistance,
      turboTimer: r.turboTimer,
      hasShield: r.hasShield,
      currentItem: r.currentItem,
      finished: r.finished,
      spinTimer: r.spinTimer,
      frozenTimer: r.frozenTimer,
      starTimer: r.starTimer,
      trackT: r.trackT,
      centerlineIndex: r.centerlineIndex,
      inactiveBoxes,
      projectiles: myProjectiles,
    };
  }

  /** Apply another client's car state (with light smoothing) */
  public applyRemoteState(state: any) {
    if (!state || !state.id) return;
    if (state.id === this.localPlayerId) return;
    const r = this.racers.find(x => x.id === state.id);
    if (!r) return;

    // Snap if far, else lerp — avoids rubber-banding and frozen ghosts
    const dx = (state.x ?? r.x) - r.x;
    const dz = (state.z ?? r.z) - r.z;
    const dist = Math.hypot(dx, dz);
    // Smoother follow — less jitter at 30 Hz
    const alpha = dist > 18 ? 1 : dist > 6 ? 0.45 : 0.28;

    if (typeof state.x === 'number') r.x += (state.x - r.x) * alpha;
    if (typeof state.y === 'number') r.y += (state.y - r.y) * alpha;
    if (typeof state.z === 'number') r.z += (state.z - r.z) * alpha;
    if (typeof state.rotY === 'number') {
      let dYaw = state.rotY - r.rotY;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      r.rotY += dYaw * Math.min(1, alpha + 0.15);
    }
    if (typeof state.speed === 'number') r.speed = state.speed;
    if (typeof state.steerAngle === 'number') r.steerAngle = state.steerAngle;
    if (typeof state.isDrifting === 'boolean') r.isDrifting = state.isDrifting;
    if (typeof state.lap === 'number') r.lap = state.lap;
    if (typeof state.position === 'number') r.position = state.position;
    if (typeof state.checkpointIndex === 'number') r.checkpointIndex = state.checkpointIndex;
    if (typeof state.totalDistance === 'number') r.totalDistance = state.totalDistance;
    if (typeof state.turboTimer === 'number') r.turboTimer = state.turboTimer;
    if (typeof state.hasShield === 'boolean') r.hasShield = state.hasShield;
    if (state.currentItem !== undefined) r.currentItem = state.currentItem;
    if (typeof state.finished === 'boolean') r.finished = state.finished;
    if (typeof state.spinTimer === 'number') r.spinTimer = Math.max(r.spinTimer || 0, state.spinTimer);
    if (typeof state.frozenTimer === 'number') r.frozenTimer = Math.max(r.frozenTimer || 0, state.frozenTimer);
    if (typeof state.starTimer === 'number') r.starTimer = state.starTimer;
    if (typeof state.trackT === 'number') r.trackT = state.trackT;
    if (typeof state.centerlineIndex === 'number') r.centerlineIndex = state.centerlineIndex;

    // World: hide boxes the other player already took
    if (Array.isArray(state.inactiveBoxes)) {
      for (const idx of state.inactiveBoxes) {
        const box = this.trackData.itemBoxes[idx];
        if (box && box.active) {
          box.active = false;
          box.respawnTime = Math.max(box.respawnTime || 0, 7);
          box.mesh.visible = false;
        }
      }
    }
    // World: ensure their projectiles exist on our client
    if (Array.isArray(state.projectiles)) {
      for (const p of state.projectiles) {
        this.applyNetworkProjectile(p);
        // Update position of existing projectile owned by them
        const existing = this.projectiles.find(x => x.id === p.id);
        if (existing && existing.ownerId !== this.localPlayerId) {
          existing.x = p.x;
          existing.y = p.y;
          existing.z = p.z;
          existing.vx = p.vx ?? existing.vx;
          existing.vy = p.vy ?? existing.vy;
          existing.vz = p.vz ?? existing.vz;
          existing.life = p.life ?? existing.life;
          existing.state = p.state ?? existing.state;
          existing.timer = p.timer ?? existing.timer;
          existing.active = true;
        }
      }
    }
  }

  /** Spawn projectile/trap from another client */
  public applyItemBoxTaken(data: { x: number; y: number; z: number; racerId?: string }) {
    if (!data) return;
    let best: (typeof this.trackData.itemBoxes)[0] | null = null;
    let bestD = 8 * 8;
    for (const box of this.trackData.itemBoxes) {
      if (!box.active) continue;
      const d = (box.x - data.x) ** 2 + (box.z - data.z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = box;
      }
    }
    if (best) {
      best.active = false;
      best.respawnTime = 7;
      best.mesh.visible = false;
      this.particles.emitBoxBreak(best.x, best.y, best.z);
      soundManager.playItemBox();
    }
  }

  public applyNetworkHit(hit: { type: string; targetId: string; x?: number; y?: number; z?: number }) {
    if (!hit || !hit.targetId) return;
    const t = this.racers.find(r => r.id === hit.targetId);
    if (!t) return;
    if (t.starTimer > 0) return;
    if (t.hasShield) {
      t.hasShield = false;
      t.shieldTimer = 0;
      soundManager.playShield();
      return;
    }
    const isLocalVictim = hit.targetId === this.localPlayerId;
    if (hit.type === 'banana_hit') {
      t.spinTimer = Math.max(t.spinTimer, isLocalVictim ? 1.8 : 1.4);
      t.speed = Math.min(t.speed * 0.4, 18);
    } else if (hit.type === 'freezeray_hit') {
      t.frozenTimer = Math.max(t.frozenTimer || 0, isLocalVictim ? 3.5 : 2.5);
      t.spinTimer = Math.max(t.spinTimer, 0.8);
      t.speed = Math.min(t.speed * 0.3, 10);
      soundManager.playFreezeChime();
      if (hit.x !== undefined) {
        this.particles.emitIceCrystals(hit.x, hit.y || t.y + 0.5, hit.z || t.z);
      }
    } else if (hit.type === 'vortex_suck') {
      t.spinTimer = Math.max(t.spinTimer, isLocalVictim ? 2.4 : 1.8);
      t.speed *= 0.15;
      soundManager.playVortexHum();
      if (hit.x !== undefined) {
        this.particles.emitVortexSwirl(hit.x, hit.y || t.y + 0.5, hit.z || t.z);
      }
    } else if (hit.type === 'thundercloud_strike') {
      t.spinTimer = Math.max(t.spinTimer, 2.0);
      t.speed = Math.min(t.speed * 0.15, 10);
      t.frozenTimer = Math.max(t.frozenTimer || 0, 2.5);
    } else {
      // rocket / mine
      t.spinTimer = Math.max(t.spinTimer, isLocalVictim ? 2.4 : 2.0);
      t.speed = Math.min(t.speed * 0.08, 6);
    }
    if (isLocalVictim) {
      this.cameraShake = Math.max(this.cameraShake, 1.15);
      this.callbacks.onCombatEvent('💥 Sind tabati!');
      soundManager.playExplosion();
    }
    if (hit.x !== undefined) {
      this.particles.emitExplosion(hit.x, hit.y || t.y + 0.5, hit.z || t.z);
    }
  }

  public applyNetworkProjectile(p: any) {
    if (!p || !p.id) return;
    if (this.projectiles.some(x => x.id === p.id)) return;
    this.projectiles.push({
      id: p.id,
      type: p.type,
      ownerId: p.ownerId,
      x: p.x,
      y: p.y,
      z: p.z,
      vx: p.vx || 0,
      vy: p.vy || 0,
      vz: p.vz || 0,
      life: p.life ?? 10,
      active: true,
      targetId: p.targetId,
      state: p.state,
      timer: p.timer,
    });
    this.ensureProjectileMesh(this.projectiles[this.projectiles.length - 1]);
  }

  public firePowerUp(racer: RacerState) {
    if (!racer.currentItem) return;
    const arm = this.itemArmTimers.get(racer.id) || 0;
    if (arm > 0) return; // still locked after pickup (player + AI)
    const item = racer.currentItem;
    racer.currentItem = null;
    this.itemArmTimers.delete(racer.id);

    if (item === 'turbo') {
      racer.turboTimer = 3.5;
      racer.speed = Math.max(racer.speed + 20, 58);
      soundManager.playTurbo();
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🚀 SUPER NITRO KÄIVITATUD!');
      }
    } else if (item === 'shield') {
      racer.hasShield = true;
      racer.shieldTimer = 8.0;
      soundManager.playShield();
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🛡️ MULLKILP AKTIVEERITUD!');
      }
    } else if (item === 'repair') {
      racer.spinTimer = 0;
      racer.frozenTimer = 0;
      racer.speed += 8;
      soundManager.playTurbo();
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🔧 REMONT TEHTUD! Auto on jälle korras!');
      }
    } else if (item === 'lightning') {
      // Zap all rivals!
      soundManager.playExplosion();
      this.racers.forEach(r => {
        if (r.id !== racer.id) {
          if (r.starTimer > 0) return; // Super Star immunity
          if (r.hasShield) {
            // Shield pops
            r.hasShield = false;
            r.shieldTimer = 0;
            return;
          }
          // Full combat impact: spinout, speed slash, shrunk status & lost held item!
          r.spinTimer = Math.max(r.spinTimer || 0, 1.8);
          r.frozenTimer = Math.max(r.frozenTimer || 0, 4.5);
          r.speed = 0;
          r.currentItem = null;
          r.turboTimer = 0;
          r.driftChargeTime = 0;
        }
      });
      this.callbacks.onCombatEvent(`⚡ ${racer.name} lõi kõiki võistlejaid VÄLGUGA! 🌩️`);
      this.cameraShake = Math.max(this.cameraShake, 1.2);
      this.racers.forEach(r => {
        if (r.id !== racer.id) {
          this.particles.emitLightning(r.x, r.y, r.z);
        }
      });
    } else if (item === 'anvil') {
      // Squash leader!
      const leader = this.racers.find(r => r.position === 1 && r.id !== racer.id);
      if (leader) {
        if (leader.hasShield) {
          leader.hasShield = false;
          leader.shieldTimer = 0;
        } else {
          leader.spinTimer = 2.5;
          leader.speed = 0;
        }
        soundManager.playExplosion();
        this.callbacks.onCombatEvent(`🔨 10T ALASI kukkus liidrile (${leader.name}) pähe!`);
      }
    } else if (item === 'rocket') {
      soundManager.playRocketLaunch();
      // Nearest opponent roughly ahead (better position = lower position number)
      let target = this.racers
        .filter(r => r.id !== racer.id && r.position < racer.position && !r.finished)
        .sort((a, b) => {
          const da = (a.x - racer.x) ** 2 + (a.z - racer.z) ** 2;
          const db = (b.x - racer.x) ** 2 + (b.z - racer.z) ** 2;
          return da - db;
        })[0];
      if (!target) {
        target = this.racers
          .filter(r => r.id !== racer.id && !r.finished)
          .sort((a, b) => {
            const da = (a.x - racer.x) ** 2 + (a.z - racer.z) ** 2;
            const db = (b.x - racer.x) ** 2 + (b.z - racer.z) ** 2;
            return da - db;
          })[0];
      }

      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 1.1, racer.z).add(fwd.clone().multiplyScalar(2.8));

      this.projectiles.push({
        id: `rocket_${Date.now()}_${Math.random()}`,
        type: 'rocket',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: fwd.x * 55,
        vy: 0,
        vz: fwd.z * 55,
        targetId: target?.id,
        life: 4.2,
        active: true,
      });
    } else if (item === 'trio_rockets') {
      soundManager.playRocketLaunch();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

      [-0.3, 0, 0.3].forEach((angleOff, idx) => {
        const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOff);
        const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.6, racer.z)
          .add(fwd.clone().multiplyScalar(2.5))
          .add(right.clone().multiplyScalar((idx - 1) * 1.2));

        this.projectiles.push({
          id: `trio_${Date.now()}_${idx}`,
          type: 'rocket',
          ownerId: racer.id,
          x: spawnPos.x,
          y: spawnPos.y,
          z: spawnPos.z,
          vx: dir.x * 50,
          vy: 0,
          vz: dir.z * 50,
          life: 4.5,
          active: true,
        });
      });
    } else if (item === 'mine') {
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.4, racer.z).sub(fwd.clone().multiplyScalar(2.8));

      this.projectiles.push({
        id: `mine_${Date.now()}_${Math.random()}`,
        type: 'mine',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 25.0,
        active: true,
      });
    } else if (item === 'blue_rocket') {
      soundManager.playRocketLaunch();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 1.2, racer.z).add(fwd.clone().multiplyScalar(2.8));
      this.projectiles.push({
        id: `bluerocket_${Date.now()}_${Math.random()}`,
        type: 'blue_rocket',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: fwd.x * 70,
        vy: 0,
        vz: fwd.z * 70,
        life: 14.0,
        active: true,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🔷 SININE RAKETT teel liidri poole!');
      }
    } else if (item === 'thundercloud') {
      soundManager.playRocketLaunch();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      // Drop slightly behind so it sits on the track as a trap
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 2.0, racer.z).sub(fwd.clone().multiplyScalar(1.2));
      this.projectiles.push({
        id: `thunder_${Date.now()}_${Math.random()}`,
        type: 'thundercloud',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 60.0,
        active: true,
        state: 'idle',
        timer: 3.5,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('⛈️ ÄIKESEPILV ootab ohvreid!');
      }
    } else if (item === 'banana') {
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.25, racer.z).sub(fwd.clone().multiplyScalar(2.5));
      this.projectiles.push({
        id: `banana_${Date.now()}_${Math.random()}`,
        type: 'banana',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 30.0,
        active: true,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🍌 Banaan teele!');
      }
    } else if (item === 'star') {
      racer.starTimer = 7.0;
      racer.turboTimer = Math.max(racer.turboTimer, 7.0);
      racer.hasShield = true;
      racer.shieldTimer = 7.0;
      soundManager.playTurbo();
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('⭐ SUPER TÄHT! VÕITMATU — PÜHI NAD TEELT!');
        this.cameraShake = 0.35;
      }
    } else if (item === 'vortex') {
      soundManager.playVortexHum();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.45, racer.z).sub(fwd.clone().multiplyScalar(2.6));
      this.projectiles.push({
        id: `vortex_${Date.now()}_${Math.random()}`,
        type: 'vortex',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 9.5,
        active: true,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🌀 MUST AUK aktiveeritud! Tõmbab vastased keerisesse!');
      }
    } else if (item === 'freezeray') {
      soundManager.playFreezeChime();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.9, racer.z).add(fwd.clone().multiplyScalar(2.8));
      this.projectiles.push({
        id: `freezeray_${Date.now()}_${Math.random()}`,
        type: 'freezeray',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: fwd.x * 68,
        vy: 0,
        vz: fwd.z * 68,
        life: 4.2,
        active: true,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('❄️ JÄÄKÜLMUTI tulistatud! Külmuta konkurendid!');
      }
    } else if (item === 'plasma_cannon') {
      soundManager.playPlasmaShot();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.9, racer.z).add(fwd.clone().multiplyScalar(2.6));
      this.projectiles.push({
        id: `plasma_${Date.now()}_${Math.random()}`,
        type: 'plasma_cannon',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: fwd.x * 72,
        vy: 0,
        vz: fwd.z * 72,
        life: 3.5,
        active: true,
        hitIds: [],
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🔮 PLASMA SUURTÜKK tulistatud! Läbistav energialöök!');
      }
    } else if (item === 'oil_slick') {
      soundManager.playOilSlick();
      const fwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY)).normalize();
      const spawnPos = new THREE.Vector3(racer.x, racer.y + 0.08, racer.z).sub(fwd.clone().multiplyScalar(2.8));
      this.projectiles.push({
        id: `oil_${Date.now()}_${Math.random()}`,
        type: 'oil_slick',
        ownerId: racer.id,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 35.0,
        active: true,
      });
      if (racer.id === this.localPlayerId) {
        this.callbacks.onCombatEvent('🛢️ ÕLILOIK maha jäetud! Tagasõitjatele libe lõks!');
      }
    }

    // Spawn meshes immediately so rockets are visible the same frame
    for (const p of this.projectiles) {
      if (p.active) this.ensureProjectileMesh(p);
    }

    // Multiplayer: broadcast newest projectiles spawned by local player
    if (racer.id === this.localPlayerId && this.callbacks.onProjectileSpawn) {
      const mine = this.projectiles.filter(p => p.active && p.ownerId === racer.id);
      const p = mine[mine.length - 1];
      if (p) {
        this.callbacks.onProjectileSpawn({
          id: p.id,
          type: p.type,
          ownerId: p.ownerId,
          x: p.x,
          y: p.y,
          z: p.z,
          vx: p.vx,
          vy: p.vy,
          vz: p.vz,
          life: p.life,
          targetId: p.targetId,
          state: p.state,
          timer: p.timer,
        });
      }
    }
  }

  private ensureProjectileMesh(p: Projectile) {
    if (!p.active || this.projectileMeshes.has(p.id)) return;
    let mesh: THREE.Group;
    switch (p.type) {
      case 'blue_rocket': mesh = createBlueRocketMesh(); break;
      case 'thundercloud': mesh = createThundercloudMesh(); break;
      case 'banana': mesh = createBananaMesh(); break;
      case 'mine': mesh = createMineMesh(); break;
      case 'vortex': mesh = createVortexMesh(); break;
      case 'freezeray': mesh = createFreezeRayMesh(); break;
      case 'plasma_cannon': mesh = createPlasmaMesh(); break;
      case 'oil_slick': mesh = createOilSlickMesh(); break;
      default: mesh = createRocketMesh(); break;
    }
    mesh.position.set(p.x, p.y, p.z);
    mesh.frustumCulled = false; // never pop out of view mid-flight
    this.scene.add(mesh);
    this.projectileMeshes.set(p.id, mesh);
  }

  private syncProjectileMeshes() {
    this.projectiles.forEach(p => {
      if (p.active) this.ensureProjectileMesh(p);
    });

    this.projectileMeshes.forEach((mesh, id) => {
      const p = this.projectiles.find(x => x.id === id);
      if (p && p.active) {
        mesh.position.set(p.x, p.y, p.z);
        if (p.type === 'rocket' || p.type === 'blue_rocket') {
          mesh.rotation.y = Math.atan2(p.vx, p.vz);
          // Occasional exhaust so rockets stay readable in 3D
          if (Math.random() < 0.22) {
            this.particles.emitNitroFlame(
              p.x - Math.sin(mesh.rotation.y) * 1.2,
              p.y,
              p.z - Math.cos(mesh.rotation.y) * 1.2,
              mesh.rotation.y
            );
          }
        } else if (p.type === 'freezeray') {
          mesh.rotation.y = Math.atan2(p.vx, p.vz);
          mesh.rotation.z += 0.2;
          if (Math.random() < 0.35) {
            this.particles.emitIceCrystals(p.x, p.y, p.z);
          }
        } else if (p.type === 'vortex') {
          mesh.rotation.y += 0.08;
          mesh.scale.setScalar(1.0 + Math.sin(performance.now() * 0.007) * 0.12);
          if (Math.random() < 0.28) {
            this.particles.emitVortexSwirl(p.x, p.y + 0.2, p.z);
          }
        } else if (p.type === 'thundercloud') {
          mesh.rotation.y += 0.04;
          const s = p.state === 'chasing' ? 1.25 : 1.0;
          mesh.scale.setScalar(s + Math.sin(performance.now() * 0.006) * 0.08);
          if (p.state === 'idle') {
            mesh.position.y = p.y + Math.sin(performance.now() * 0.004) * 0.35;
          }
          if (p.state === 'chasing' && Math.random() < 0.35) {
            this.particles.emitCloudSparks(p.x, p.y, p.z);
          }
        } else if (p.type === 'plasma_cannon') {
          mesh.rotation.y = Math.atan2(p.vx, p.vz);
          mesh.rotation.z += 0.25;
          if (Math.random() < 0.4) {
            this.particles.emitPlasmaBurst(p.x, p.y, p.z);
          }
        } else if (p.type === 'oil_slick') {
          mesh.rotation.y += 0.005;
        } else {
          mesh.rotation.y += 0.04;
        }
      } else {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(id);
      }
    });

    if (this.projectiles.some(p => !p.active)) {
      this.projectiles = this.projectiles.filter(p => p.active);
    }
  }

  private updateVisualMeshes(dt: number) {
    this.fxThrottle += dt;
    const doFx = this.fxThrottle >= 0.07; // ~25 Hz particle FX max
    if (doFx) this.fxThrottle = 0;

    this.racers.forEach(racer => {
      const meshContainer = this.carMeshes.get(racer.id);
      if (!meshContainer) return;

      // Position & Scale (shrunk when shocked by lightning/frozen)
      meshContainer.root.position.set(racer.x, racer.y, racer.z);
      const isShocked = (racer.frozenTimer || 0) > 0;
      const targetScale = isShocked ? 0.68 : 1.0;
      meshContainer.root.scale.setScalar(targetScale);

      // Rotation (Pitch rotX on hills/braking, Yaw rotY, Roll rotZ in cornering/drifting)
      meshContainer.root.rotation.set(racer.rotX || 0, racer.rotY, racer.rotZ || 0);

      // Front wheels steering
      meshContainer.frontWheels.forEach(fw => {
        fw.rotation.y = racer.steerAngle;
      });

      // All wheels spin
      meshContainer.allWheels.forEach(w => {
        w.rotation.x = racer.wheelRot;
      });

      // Driver head steering reaction (no vertical bouncing)
      meshContainer.driverHead.rotation.z = -racer.steerAngle * 0.3;
      meshContainer.driverHead.position.y = 0.95;

      // Shadow is parented under car root — no per-frame world update (stops flicker)

      // Chassis dynamic lean & pitch
      meshContainer.bodyGroup.rotation.x = racer.rotX || 0;
      meshContainer.bodyGroup.rotation.z = -racer.steerAngle * 0.14;

      // Dynamic glowing brake lights
      if (meshContainer.tailLightMat) {
        const isBraking = racer.id === this.localPlayerId 
          ? (this.localInput.brake > 0.1 && racer.speed > 0) 
          : (racer.speed < 12);
        meshContainer.tailLightMat.emissiveIntensity = isBraking ? 2.8 : 0.8;
      }

      // Skidmarks & Drift sparks (throttled FX — main stutter source when every car drifts)
      if (racer.isDrifting) {
        // Skid geometry only for local player every frame; AI every other FX tick
        if (!racer.isAI) {
          this.skidMarks.addSkid(racer.id, racer.x, racer.y, racer.z, racer.rotY);
        }
        if (doFx) {
          const sparkLevel: 1 | 2 | 3 = (racer.driftChargeTime || 0) >= 2.6 ? 3 : ((racer.driftChargeTime || 0) >= 1.6 ? 2 : 1);
          _visFwd.set(Math.sin(racer.rotY), 0, Math.cos(racer.rotY));
          _visRight.set(_visFwd.z, 0, -_visFwd.x);

          const rLx = racer.x + _visFwd.x * -0.8 + _visRight.x * -0.75;
          const rLz = racer.z + _visFwd.z * -0.8 + _visRight.z * -0.75;
          // One side only — half the particles, still reads as drift
          this.particles.emitDriftSparks(rLx, racer.y, rLz, sparkLevel);
          if (!racer.isAI) {
            const rRx = racer.x + _visFwd.x * -0.8 + _visRight.x * 0.75;
            const rRz = racer.z + _visFwd.z * -0.8 + _visRight.z * 0.75;
            this.particles.emitDriftSparks(rRx, racer.y, rRz, sparkLevel);
          }
        }
      } else {
        this.skidMarks.stopSkid(racer.id);
      }

      // Nitro flames / exhaust (throttled)
      if (doFx && racer.turboTimer > 0) {
        _visFwd.set(Math.sin(racer.rotY), 0, Math.cos(racer.rotY));
        _visRight.set(_visFwd.z, 0, -_visFwd.x);
        const exY = racer.y + 0.45;
        const exLx = racer.x + _visFwd.x * -1.4 + _visRight.x * -0.45;
        const exLz = racer.z + _visFwd.z * -1.4 + _visRight.z * -0.45;
        this.particles.emitNitroFlame(exLx, exY, exLz, racer.rotY);
        if (!racer.isAI) {
          const exRx = racer.x + _visFwd.x * -1.4 + _visRight.x * 0.45;
          const exRz = racer.z + _visFwd.z * -1.4 + _visRight.z * 0.45;
          this.particles.emitNitroFlame(exRx, exY, exRz, racer.rotY);
        }
      } else if (doFx && !racer.isAI && Math.abs(racer.speed) > 12 && Math.random() < 0.12) {
        _visFwd.set(Math.sin(racer.rotY), 0, Math.cos(racer.rotY));
        const exPosX = racer.x + _visFwd.x * -1.4;
        const exPosY = racer.y + 0.35;
        const exPosZ = racer.z + _visFwd.z * -1.4;
        this.particles.emitExhaustSmoke(exPosX, exPosY, exPosZ, racer.rotY);
      }

      // Super star aura (throttled)
      if (doFx && racer.starTimer > 0) {
        this.particles.emitStarAura(racer.x, racer.y + 0.5, racer.z);
      }

      // Shock & Frozen electrical sparks (throttled)
      if (doFx && (racer.frozenTimer || 0) > 0) {
        this.particles.emitSparks(racer.x, racer.y + 0.4, racer.z, 0x38bdf8, 3);
        if (Math.random() < 0.4) {
          this.particles.emitIceCrystals(racer.x, racer.y + 0.5, racer.z);
        }
      }

      // Shield mesh visibility
      const shield = this.shieldMeshes.get(racer.id);
      if (shield) {
        shield.visible = racer.hasShield;
        if (shield.visible) {
          shield.rotation.y += dt * 3;
        }
      }
    });
  }

  private updateRacePositions() {
    // In-place sort to prevent creating new array garbage every frame
    this.racers.sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      if (a.checkpointIndex !== b.checkpointIndex) return b.checkpointIndex - a.checkpointIndex;
      return b.totalDistance - a.totalDistance;
    });

    for (let idx = 0; idx < this.racers.length; idx++) {
      this.racers[idx].position = idx + 1;
    }
  }

  private updateCamera(dt: number) {
    const player = this.racers.find(r => r.id === this.localPlayerId) || this.racers[0];
    if (!player) return;

    const isLookingBack = !!this.localInput.lookBehind;
    _camFwd.set(Math.sin(player.rotY), 0, Math.cos(player.rotY)).normalize();
    if (isLookingBack) {
      _camDir.copy(_camFwd);
    } else {
      _camDir.copy(_camFwd).negate();
    }
    const camDist = 7.5 + (player.turboTimer > 0 ? 1.4 : 0);
    const camHeight = 3.6;

    _targetCamPos.set(player.x, player.y + camHeight, player.z)
      .addScaledVector(_camDir, camDist);

    const lookAheadDist = isLookingBack ? -8 : 5.0;
    _camLookTarget.set(player.x, player.y + 1.25, player.z).addScaledVector(_camFwd, lookAheadDist);

    if (this.isFirstCamFrame) {
      this.camera.position.copy(_targetCamPos);
      this.currentCamLookTarget.copy(_camLookTarget);
      this.isFirstCamFrame = false;
    } else {
      // Softer follow — high alpha caused visible car/camera jerk on uneven frame times
      const camAlpha = Math.min(1.0, 1.0 - Math.exp(-6.2 * dt));
      this.camera.position.lerp(_targetCamPos, camAlpha);
      this.currentCamLookTarget.lerp(_camLookTarget, camAlpha);
    }

    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.currentCamLookTarget);

    // Camera shake — smooth sine, not random every frame (random caused constant micro-jerk)
    if (this.cameraShake > 0.001) {
      const s = this.cameraShake;
      const t = performance.now() * 0.045;
      this.camera.position.x += Math.sin(t * 1.7) * s * 0.22;
      this.camera.position.y += Math.cos(t * 2.1) * s * 0.12;
      this.camera.position.z += Math.sin(t * 1.3) * s * 0.22;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 3.2);
    }

    // FOV changes rarely — avoid updateProjectionMatrix every frame (GPU/CPU stutter source)
    const targetFOV = player.turboTimer > 0 ? 74 : (player.speed > 25 ? 68 : 64);
    const nextFov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, Math.min(1.0, dt * 2.5));
    if (Math.abs(nextFov - this.camera.fov) > 0.08) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public getMinimapData(): {
    curvePoints: { x: number; z: number }[];
    racers: {
      id: string;
      x: number;
      z: number;
      rotY: number;
      color: string;
      isPlayer: boolean;
      position: number;
      name: string;
    }[];
  } {
    if (!this.cachedMinimapPoints) {
      this.cachedMinimapPoints = this.trackData.checkpoints.map(cp => ({ x: cp.x, z: cp.z }));
    }
    return {
      curvePoints: this.cachedMinimapPoints,
      racers: this.racers.map(r => ({
        id: r.id,
        x: r.x,
        z: r.z,
        rotY: r.rotY || 0,
        color: r.color,
        isPlayer: r.id === this.localPlayerId,
        position: r.position,
        name: r.name,
      })),
    };
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    soundManager.stopMusic();

    this.particles.clear();
    this.skidMarks.clear();

    this.shadowMeshes.forEach(s => {
      this.scene.remove(s);
      s.geometry.dispose();
      (s.material as THREE.Material).dispose();
    });
    this.shadowMeshes.clear();

    if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
