import * as THREE from 'three';
import { RacerState, PlayerInput } from '../types';
import { TrackData } from './tracks';

const AI_TAUNTS = [
  "Söö mu tolmu! 💨",
  "Vaata ja õpi! 😎",
  "Puhas kiirus! ⚡",
  "Ei saa kätte! 😜",
  "Võta see! 🚀",
  "Hoia alt! 💥",
  "Ops, vabandust! 😈",
];

const AI_OUCHES = [
  "Ai kurja! 😵",
  "Kes selle siia pani?! 💣",
  "Küll ma sulle veel näitan! 😡",
  "Mu ilus värv! 💥",
  "Pöörab pea ringi! 💫",
];

export interface AIOpponentController {
  racerId: string;
  laneOffset: number; // -4.0 to +4.0 across track width
  targetLane: number;
  aggression: number;
  itemCooldown: number;
  tauntCooldown: number;
  reactionTimer: number;
}

export function createAIControllers(racers: RacerState[]): Map<string, AIOpponentController> {
  const map = new Map<string, AIOpponentController>();
  const aiRacers = racers.filter(r => r.isAI);

  aiRacers.forEach((r, idx) => {
    // Spread AI racers across distinct driving lines (-4.0, -1.5, 0, 1.5, 4.0)
    const laneOptions = [-3.8, -1.8, 0, 1.8, 3.8];
    const chosenLane = laneOptions[idx % laneOptions.length];

    map.set(r.id, {
      racerId: r.id,
      laneOffset: chosenLane,
      targetLane: chosenLane,
      aggression: 0.65 + Math.random() * 0.35,
      itemCooldown: 1.5 + Math.random() * 2.5,
      tauntCooldown: 6 + Math.random() * 8,
      reactionTimer: 0,
    });
  });

  return map;
}

// Static scratch vectors for zero heap garbage collection during AI updates
const _aiCarPos = new THREE.Vector3();
const _aiDesiredTarget = new THREE.Vector3();
const _aiToTarget = new THREE.Vector3();

/**
 * Calculates smooth, intelligent AI inputs (throttle, steer, drift, useItem, overtaking)
 */
export function computeAIInput(
  racer: RacerState,
  aiCtrl: AIOpponentController,
  track: TrackData,
  allRacers: RacerState[],
  dt: number,
  onUseItem?: (racerId: string) => void
): PlayerInput {
  aiCtrl.itemCooldown -= dt;
  aiCtrl.tauntCooldown -= dt;
  aiCtrl.reactionTimer -= dt;

  _aiCarPos.set(racer.x, racer.y, racer.z);

  // Fast O(1) track orientation lookup using racer's trackT or checkpointIndex
  const baseT = racer.trackT !== undefined && !isNaN(racer.trackT)
    ? racer.trackT
    : (racer.checkpointIndex / Math.max(1, track.checkpoints.length));

  const curCenterPt = track.getCenterlinePointAt(baseT);

  // 1. Check if car is pointing backwards or in wrong direction
  const trackTangent = curCenterPt.tangent;
  const trackHeading = Math.atan2(trackTangent.x, trackTangent.z);
  let headingDiff = trackHeading - racer.rotY;
  while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
  while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

  // If severely spun around (> 110 degrees), quickly steer towards track heading
  if (Math.abs(headingDiff) > 1.95 || racer.isWrongWay) {
    const recoverySteer = headingDiff > 0 ? 1.0 : -1.0;
    return {
      throttle: racer.speed < 12 ? 0.9 : 0.4,
      brake: racer.speed > 20 ? 0.3 : 0,
      steer: recoverySteer,
      drift: false,
      useItem: false,
      honk: false,
    };
  }

  // 2. Dynamic Lane & Overtaking Logic
  if (aiCtrl.reactionTimer <= 0) {
    aiCtrl.reactionTimer = 0.35 + Math.random() * 0.3;

    // Check if another racer is blocking directly ahead (within 9m)
    const carAhead = allRacers.find(other => {
      if (other.id === racer.id) return false;
      const dx = other.x - racer.x;
      const dz = other.z - racer.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 9.0) {
        const angle = Math.atan2(dx, dz);
        let diff = Math.abs(angle - racer.rotY);
        while (diff > Math.PI) diff = Math.PI * 2 - diff;
        return diff < 0.4;
      }
      return false;
    });

    if (carAhead) {
      // Switch lane to slipstream and overtake
      aiCtrl.targetLane = aiCtrl.laneOffset > 0 ? -2.6 : 2.6;
    }
  }

  // Smoothly blend lane offset
  aiCtrl.laneOffset = THREE.MathUtils.lerp(aiCtrl.laneOffset, aiCtrl.targetLane, dt * 2.8);

  // 3. Smooth Lookahead Point along Continuous Spline (O(1) instant indexing)
  // Scales with current vehicle speed (12m to 28m ahead)
  const lookaheadDist = THREE.MathUtils.clamp(racer.speed * 0.5 + 12, 12, 28);
  const totalLength = 2900; // Track arc length
  const lookaheadFraction = lookaheadDist / totalLength;
  const lookaheadT = ((baseT + lookaheadFraction) % 1.0 + 1.0) % 1.0;

  const targetPt = track.getCenterlinePointAt(lookaheadT);
  const targetTangent = targetPt.tangent;
  const targetRight = targetPt.right;

  // Offset along the track cross-section (stay safely inside road width)
  const safeLane = THREE.MathUtils.clamp(aiCtrl.laneOffset, -4.5, 4.5);
  _aiDesiredTarget.copy(targetPt.point).addScaledVector(targetRight, safeLane);

  // 4. Compute Steering Angle
  _aiToTarget.subVectors(_aiDesiredTarget, _aiCarPos);
  const targetAngle = Math.atan2(_aiToTarget.x, _aiToTarget.z);

  let angleDiff = targetAngle - racer.rotY;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Steer towards target: positive when target is right, negative when target is left
  const steer = THREE.MathUtils.clamp(angleDiff * 2.8, -1, 1);

  // 5. Corner Anticipation & Throttle / Drift Control
  // Look slightly further ahead to detect sharp turns before entering them
  const curveAheadT = ((lookaheadT + 0.04) % 1.0 + 1.0) % 1.0;
  const curveAheadPoint = track.getCenterlinePointAt(curveAheadT);
  const turnDot = targetTangent.dot(curveAheadPoint.tangent);
  const turnSharpness = Math.max(0, 1.0 - turnDot);

  let throttle = 1.0;
  let brake = 0.0;

  // Corner entry speed regulation
  if (turnSharpness > 0.07 && racer.speed > 17) {
    // Ease off throttle into curves to stay planted
    throttle = THREE.MathUtils.lerp(1.0, 0.5, (racer.speed - 17) / 7);
    if (racer.speed > 21) {
      brake = 0.25;
    }
  }

  // Drift through medium-to-sharp corners
  const isSharpTurn = (turnSharpness > 0.05 || Math.abs(angleDiff) > 0.28) && racer.speed > 11;
  const drift = isSharpTurn && (aiCtrl.aggression > 0.35 || Math.random() < 0.75);

  // 6. Intelligent Item Usage — hold briefly so player can see what AI got
  let useItem = false;
  if (racer.currentItem && aiCtrl.itemCooldown <= 0) {
    const item = racer.currentItem;

    if (item === 'turbo') {
      if (Math.abs(angleDiff) < 0.25) {
        useItem = true;
        aiCtrl.itemCooldown = 2.0;
      }
    } else if (item === 'rocket' || item === 'trio_rockets' || item === 'blue_rocket' || item === 'freezeray' || item === 'plasma_cannon') {
      const rivalAhead = allRacers.find(other => {
        if (other.id === racer.id) return false;
        const dx = other.x - racer.x;
        const dz = other.z - racer.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 6 && dist < (item === 'blue_rocket' ? 120 : (item === 'plasma_cannon' ? 70 : 55))) {
          const angleToRival = Math.atan2(dx, dz);
          let diff = Math.abs(angleToRival - racer.rotY);
          while (diff > Math.PI) diff = Math.PI * 2 - diff;
          return diff < (item === 'blue_rocket' ? 1.2 : (item === 'plasma_cannon' ? 0.65 : 0.55));
        }
        return false;
      });
      // Blue rocket / Plasma cannon: fire strategically
      if (rivalAhead || (item === 'blue_rocket' && racer.position > 1) || (item === 'plasma_cannon' && Math.random() < 0.5)) {
        useItem = true;
        aiCtrl.itemCooldown = 2.8;
        racer.speechText = item === 'blue_rocket' ? "Sinine rakett! 🔷" : (item === 'plasma_cannon' ? "Plasma löök! 🔮" : "Võta see! 🚀");
        racer.speechTimer = 2.0;
      }
    } else if (item === 'thundercloud' || item === 'vortex') {
      // Drop trap or deploy vortex when racers are clustered
      if (racer.position >= 2 || Math.random() < 0.45) {
        useItem = true;
        aiCtrl.itemCooldown = 3.5;
        racer.speechText = item === 'vortex' ? "Must auk! 🌀" : "Äike tuleb! ⛈️";
        racer.speechTimer = 2.0;
      }
    } else if (item === 'banana' || item === 'mine' || item === 'oil_slick') {
      const rivalBehind = allRacers.find(other => {
        if (other.id === racer.id) return false;
        return Math.hypot(other.x - racer.x, other.z - racer.z) < 22;
      });
      if (rivalBehind || Math.random() < 0.35) {
        useItem = true;
        aiCtrl.itemCooldown = 2.5;
        racer.speechText = item === 'oil_slick' ? "Õlilõks! 🛢️" : (item === 'banana' ? "Banaan! 🍌" : "Vaata ette! 💣");
        racer.speechTimer = 2.0;
      }
    } else if (item === 'shield' || item === 'star' || item === 'repair') {
      useItem = true;
      aiCtrl.itemCooldown = 3.5;
    } else if (item === 'lightning' || item === 'anvil') {
      if (racer.position > 1) {
        useItem = true;
        aiCtrl.itemCooldown = 4.0;
      }
    }
  }

  if (useItem && onUseItem) {
    onUseItem(racer.id);
  }

  // 7. Occasional Random Taunts
  if (aiCtrl.tauntCooldown <= 0 && !racer.speechText && Math.random() < 0.25) {
    aiCtrl.tauntCooldown = 12 + Math.random() * 10;
    racer.speechText = AI_TAUNTS[Math.floor(Math.random() * AI_TAUNTS.length)];
    racer.speechTimer = 2.2;
  }

  return {
    throttle,
    brake,
    steer,
    drift,
    useItem,
    honk: false,
  };
}
