import React, { useEffect, useRef } from 'react';
import { PowerUpType } from '../types';
import { POWER_UPS } from '../game/powerups';
import { soundManager } from '../audio/soundManager';
import { Volume2, VolumeX, Shield, Zap, Sparkles } from 'lucide-react';

interface HUDProps {
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
  isWrongWay?: boolean;
  currentLapTime?: number;
  bestLapTime?: number | null;
  driftCharge?: number;
  currentSurface?: string;
  surfaceName?: string;
  surfaceIcon?: string;
  combatEvents: string[];
  countdownText: string | number;
  minimapData: {
    curvePoints: { x: number; z: number }[];
    racers: {
      id: string;
      x: number;
      z: number;
      rotY?: number;
      color: string;
      isPlayer: boolean;
      position: number;
      name?: string;
    }[];
  } | null;
  onUseItem: () => void;
  onHonk: () => void;
  onLookBehindToggle?: (active: boolean) => void;
  onRespawn?: () => void;
  // Touch handlers
  onInputStart: (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => void;
  onInputEnd: (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => void;
}

const formatLapTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00.00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const HUD: React.FC<HUDProps> = ({
  speed,
  lap,
  totalLaps,
  position,
  totalRacers,
  currentItem,
  isDrifting,
  hasTurbo,
  hasShield,
  inSlipstream = false,
  isFinalLap = false,
  isLeader = false,
  blueThreat = false,
  isWrongWay = false,
  currentLapTime = 0,
  bestLapTime = null,
  driftCharge = 0,
  currentSurface,
  surfaceName,
  surfaceIcon,
  combatEvents,
  countdownText,
  minimapData,
  onUseItem,
  onHonk,
  onLookBehindToggle,
  onRespawn,
  onInputStart,
  onInputEnd,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackBgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cachedPointsRef = useRef<{ x: number; z: number }[] | null>(null);
  const cachedTransformRef = useRef<{
    toCanvasX: (worldX: number) => number;
    toCanvasY: (worldZ: number) => number;
  } | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [rouletteIcon, setRouletteIcon] = React.useState<string | null>(null);
  const [showFinalItem, setShowFinalItem] = React.useState(true);
  const prevItemRef = React.useRef<PowerUpType | null>(null);

  // Mario Kart-style item roulette when a new item is picked up
  useEffect(() => {
    if (currentItem && currentItem !== prevItemRef.current) {
      prevItemRef.current = currentItem;
      setShowFinalItem(false);
      const icons = Object.values(POWER_UPS).map(p => p.icon);
      let ticks = 0;
      const maxTicks = 14;
      const iv = setInterval(() => {
        setRouletteIcon(icons[Math.floor(Math.random() * icons.length)]);
        ticks++;
        if (ticks >= maxTicks) {
          clearInterval(iv);
          setRouletteIcon(null);
          setShowFinalItem(true);
        }
      }, 55);
      return () => clearInterval(iv);
    }
    if (!currentItem) {
      prevItemRef.current = null;
      setRouletteIcon(null);
      setShowFinalItem(true);
    }
  }, [currentItem]);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Draw 2D Top-Down Minimap Radar (optimized with cached static track background)
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !minimapData || minimapData.curvePoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Build or reuse cached static track background
    if (cachedPointsRef.current !== minimapData.curvePoints || !trackBgCanvasRef.current) {
      cachedPointsRef.current = minimapData.curvePoints;

      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext('2d');

      if (bgCtx) {
        // Dark glass background
        bgCtx.fillStyle = '#020617';
        bgCtx.fillRect(0, 0, width, height);

        // Concentric radar rings
        bgCtx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        bgCtx.arc(width / 2, height / 2, width * 0.42, 0, Math.PI * 2);
        bgCtx.stroke();
        bgCtx.beginPath();
        bgCtx.arc(width / 2, height / 2, width * 0.22, 0, Math.PI * 2);
        bgCtx.stroke();

        // Crosshairs
        bgCtx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
        bgCtx.beginPath();
        bgCtx.moveTo(width / 2, 6);
        bgCtx.lineTo(width / 2, height - 6);
        bgCtx.moveTo(6, height / 2);
        bgCtx.lineTo(width - 6, height / 2);
        bgCtx.stroke();

        // Find bounds of track points
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        minimapData.curvePoints.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z;
          if (p.z > maxZ) maxZ = p.z;
        });

        const padding = 20;
        const trackW = Math.max(10, maxX - minX);
        const trackH = Math.max(10, maxZ - minZ);
        const scale = Math.min((width - padding * 2) / trackW, (height - padding * 2) / trackH);

        const toCanvasX = (worldX: number) => width / 2 + (worldX - (minX + maxX) / 2) * scale;
        const toCanvasY = (worldZ: number) => height / 2 + (worldZ - (minZ + maxZ) / 2) * scale;
        cachedTransformRef.current = { toCanvasX, toCanvasY };

        // Outer glow
        bgCtx.beginPath();
        bgCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        bgCtx.lineWidth = 16;
        bgCtx.lineCap = 'round';
        bgCtx.lineJoin = 'round';
        minimapData.curvePoints.forEach((p, idx) => {
          const cx = toCanvasX(p.x);
          const cy = toCanvasY(p.z);
          if (idx === 0) bgCtx.moveTo(cx, cy);
          else bgCtx.lineTo(cx, cy);
        });
        bgCtx.closePath();
        bgCtx.stroke();

        // Track road base
        bgCtx.beginPath();
        bgCtx.strokeStyle = '#1e293b';
        bgCtx.lineWidth = 11;
        minimapData.curvePoints.forEach((p, idx) => {
          const cx = toCanvasX(p.x);
          const cy = toCanvasY(p.z);
          if (idx === 0) bgCtx.moveTo(cx, cy);
          else bgCtx.lineTo(cx, cy);
        });
        bgCtx.closePath();
        bgCtx.stroke();

        // Track road asphalt center
        bgCtx.beginPath();
        bgCtx.strokeStyle = '#475569';
        bgCtx.lineWidth = 6;
        minimapData.curvePoints.forEach((p, idx) => {
          const cx = toCanvasX(p.x);
          const cy = toCanvasY(p.z);
          if (idx === 0) bgCtx.moveTo(cx, cy);
          else bgCtx.lineTo(cx, cy);
        });
        bgCtx.closePath();
        bgCtx.stroke();

        // Dashed racing line
        bgCtx.save();
        bgCtx.setLineDash([3, 4]);
        bgCtx.beginPath();
        bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        bgCtx.lineWidth = 1.5;
        minimapData.curvePoints.forEach((p, idx) => {
          const cx = toCanvasX(p.x);
          const cy = toCanvasY(p.z);
          if (idx === 0) bgCtx.moveTo(cx, cy);
          else bgCtx.lineTo(cx, cy);
        });
        bgCtx.closePath();
        bgCtx.stroke();
        bgCtx.restore();

        // Start/finish checkered line marker
        const s0 = minimapData.curvePoints[0];
        const s1 = minimapData.curvePoints[1] || s0;
        const dx = s1.x - s0.x;
        const dz = s1.z - s0.z;
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;

        const startX = toCanvasX(s0.x);
        const startY = toCanvasY(s0.z);

        bgCtx.beginPath();
        bgCtx.strokeStyle = '#facc15';
        bgCtx.lineWidth = 3.5;
        bgCtx.moveTo(startX - nx * 7, startY - nz * 7);
        bgCtx.lineTo(startX + nx * 7, startY + nz * 7);
        bgCtx.stroke();
      }

      trackBgCanvasRef.current = bgCanvas;
    }

    // 2. Render frame: Blit cached background and draw racer blips
    ctx.clearRect(0, 0, width, height);
    if (trackBgCanvasRef.current) {
      ctx.drawImage(trackBgCanvasRef.current, 0, 0);
    }

    const transform = cachedTransformRef.current;
    if (!transform) return;

    // Draw AI racers first, then Player on top
    const rivals = minimapData.racers.filter(r => !r.isPlayer);
    const player = minimapData.racers.find(r => r.isPlayer);

    // Draw rivals
    rivals.forEach(r => {
      const rx = transform.toCanvasX(r.x);
      const ry = transform.toCanvasY(r.z);

      // Leader glow
      if (r.position === 1) {
        ctx.beginPath();
        ctx.arc(rx, ry, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.fill();
      }

      // Rival dot
      ctx.beginPath();
      ctx.arc(rx, ry, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = r.color || '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Position number inside rival dot
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${r.position}`, rx, ry);
    });

    // Draw Player
    if (player) {
      const px = transform.toCanvasX(player.x);
      const py = transform.toCanvasY(player.z);

      // Pulse ring
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      // Core player blip
      ctx.beginPath();
      ctx.arc(px, py, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#09090b';
      ctx.stroke();

      // Heading arrow
      const angle = (player.rotY || 0);
      const arrowLen = 11;
      const tipX = px + Math.sin(angle) * arrowLen;
      const tipY = py + Math.cos(angle) * arrowLen;

      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.moveTo(px, py);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Position text
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${player.position}`, px, py);
    }
  }, [minimapData]);

  // Position ordinal suffix & color
  const getPositionBadge = (pos: number) => {
    switch (pos) {
      case 1:
        return { text: '1ST', color: 'from-amber-400 to-yellow-600', border: 'border-yellow-300' };
      case 2:
        return { text: '2ND', color: 'from-slate-200 to-slate-400', border: 'border-slate-100' };
      case 3:
        return { text: '3RD', color: 'from-amber-600 to-amber-800', border: 'border-amber-500' };
      default:
        return { text: `${pos}TH`, color: 'from-blue-600 to-indigo-800', border: 'border-blue-400' };
    }
  };

  const posBadge = getPositionBadge(position);
  // isFinalLap comes from engine prop (also true on last lap)
  const showFinalLap = isFinalLap || lap === totalLaps;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      
      {/* Turbo Speed Effect Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${hasTurbo ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 speed-lines opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,182,212,0.15)_80%,rgba(6,182,212,0.4)_100%)]" />
      </div>

      {/* Top Bar: Standings, Lap, Minimap, Audio */}
      <div className="flex items-start justify-between w-full relative z-10">
        {/* Left: Position & Lap Counter */}
        <div className="flex items-center gap-3">
          {/* Position Badge */}
          <div
            className={`bg-gradient-to-b ${posBadge.color} ${posBadge.border} border-3 shadow-xl rounded-2xl px-4 py-2 text-center text-white transform -rotate-3 transition-transform`}
          >
            <div className="text-3xl md:text-5xl font-black font-['Titan_One',sans-serif] drop-shadow-md">
              {isLeader ? '👑' : ''}{posBadge.text}
            </div>
            <div className="text-[10px] md:text-xs font-bold text-slate-900/80 -mt-1 uppercase tracking-wider">
              / {totalRacers} SÕITJAT
            </div>
          </div>

          {/* Lap Counter */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-xl px-4 py-2 text-white shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RING</div>
            <div className="text-xl md:text-2xl font-black font-['Titan_One',sans-serif] text-sky-400">
              {lap} <span className="text-slate-500 text-base">/ {totalLaps}</span>
            </div>
            {showFinalLap && (
              <div className="text-[10px] font-black text-amber-400 animate-pulse uppercase">
                ⚡ VIIMANE RING!
              </div>
            )}
          </div>

          {/* Lap Timing Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-xl px-3 py-2 text-white shadow-lg hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AEG</div>
            <div className="text-sm md:text-base font-black font-mono text-amber-300">
              {formatLapTime(currentLapTime)}
            </div>
            {bestLapTime && (
              <div className="text-[9px] font-bold text-emerald-400 font-mono">
                ★ PARIM: {formatLapTime(bestLapTime)}
              </div>
            )}
          </div>

          {/* Current Terrain / Road Surface Badge */}
          {surfaceName && (
            <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-xl px-3 py-2 text-white shadow-lg hidden md:flex items-center gap-2 transition-all">
              <span className="text-xl drop-shadow-sm">{surfaceIcon || '🛣️'}</span>
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">PINNAS</div>
                <div className="text-xs font-black text-amber-300 capitalize">{surfaceName}</div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Wrong-Way Warning Banner */}
        {isWrongWay && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 border-4 border-yellow-300 px-6 py-3 rounded-2xl shadow-2xl animate-pulse text-center">
            <div className="text-2xl md:text-3xl font-black font-['Titan_One',sans-serif] text-white drop-shadow-md">
              ⚠️ VALE SUUND!
            </div>
            <div className="text-xs font-black text-yellow-200 mt-0.5">
              PÖÖRA AUTO RINGI VÕI VAJUTA [R] TAASTAMISEKS!
            </div>
          </div>
        )}

        {/* Center: Big Countdown / Final Lap flash banner */}
        {/* Blue rocket DANGER */}
        {blueThreat && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl bg-blue-600/95 border-4 border-cyan-300 text-white font-black text-lg md:text-2xl shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-pulse tracking-wider">
            ⚠️ SININE RAKETT!!!
          </div>
        )}

        {/* Final lap ribbon */}
        {showFinalLap && !countdownText && !blueThreat && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 border-2 border-yellow-300 text-white font-black text-sm md:text-base shadow-xl animate-pulse">
            🏁 VIIMANE RING
          </div>
        )}

        {countdownText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-6xl md:text-8xl font-black text-amber-400 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] font-['Titan_One',sans-serif] animate-bounce">
              {countdownText}
            </div>
          </div>
        )}

        {/* Right: Minimap Radar & Sound Mute */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="pointer-events-auto p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Heli sisse/välja"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
          </div>

          {/* Minimap radar container with header and legend */}
          <div className="bg-slate-950/90 backdrop-blur-md rounded-2xl p-2 border-2 border-slate-700 shadow-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 mb-1">
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                RADAR
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {position}/{totalRacers}
              </span>
            </div>

            <canvas
              ref={minimapCanvasRef}
              width={160}
              height={160}
              className="rounded-xl w-32 h-32 md:w-40 md:h-40 block"
            />

            {/* Radar Legend */}
            <div className="flex items-center justify-center gap-3 mt-1.5 pt-1 border-t border-slate-800 w-full text-[9px] font-bold">
              <span className="flex items-center gap-1 text-yellow-300">
                <span className="w-2 h-2 rounded-full bg-yellow-400 border border-slate-950 inline-block" />
                Sina ({position})
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500 border border-white inline-block" />
                Vastased
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP CENTER: Item roulette + held item */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 md:top-6 z-30 flex flex-col items-center">
        {currentItem ? (
          <button
            type="button"
            onClick={onUseItem}
            disabled={!!rouletteIcon}
            className={`pointer-events-auto group relative flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-4 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-[0_0_40px_rgba(251,191,36,0.45)] cursor-pointer ${
              rouletteIcon ? 'border-fuchsia-400 scale-110' : 'border-amber-300 animate-[pulse_2s_ease-in-out_infinite]'
            }`}
            title="Kasuta eseme (E)"
          >
            <span className="text-5xl md:text-6xl drop-shadow-lg leading-none select-none">
              {rouletteIcon || (showFinalItem ? (POWER_UPS[currentItem]?.icon || '🎁') : '❓')}
            </span>
            <span className="text-sm md:text-base font-black text-amber-300 tracking-wide uppercase min-h-[1.25rem]">
              {rouletteIcon ? '…' : (showFinalItem ? (POWER_UPS[currentItem]?.name || currentItem) : '')}
            </span>
            {!rouletteIcon && showFinalItem && (
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-200">
                [E] või klõpsa
              </span>
            )}
          </button>
        ) : null}
      </div>

      {/* Center Left: Live Combat Events Feed */}
      <div className="max-w-sm space-y-1.5 self-start">
        {combatEvents.slice(-3).map((evt, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 animate-fade-in"
          >
            <span>{evt}</span>
          </div>
        ))}
      </div>

      {/* Bottom Bar: Power-Up Slot, Speedometer, Mobile Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Power-up Item Slot */}
        <div className="flex items-center gap-3">
          <div
            onClick={onUseItem}
            className={`pointer-events-auto relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xl ${
              currentItem
                ? 'bg-gradient-to-br from-amber-400/90 to-yellow-600/90 border-yellow-200'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}
          >
            {currentItem ? (
              <>
                <span className="text-3xl md:text-4xl drop-shadow-md">
                  {POWER_UPS[currentItem]?.icon || '🎁'}
                </span>
                <span className="text-[10px] md:text-xs font-black text-slate-950 mt-1 uppercase">
                  {POWER_UPS[currentItem]?.name}
                </span>
                <span className="absolute -bottom-2 bg-slate-950 px-2 py-0.5 rounded text-[9px] font-bold text-amber-300 border border-amber-400">
                  [E / Klõpsa]
                </span>
              </>
            ) : (
              <span className="text-2xl opacity-30">❓</span>
            )}
          </div>

          {/* Active Buff Badges */}
          <div className="flex flex-col gap-1.5">
            {hasTurbo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-lg animate-bounce">
                <Zap className="w-3.5 h-3.5 fill-current" /> NITRO!
              </div>
            )}
            {inSlipstream && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs shadow-lg">
                💨 DRAFT
              </div>
            )}
            {hasShield && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500 text-white font-black text-xs shadow-lg animate-pulse">
                <Shield className="w-3.5 h-3.5 fill-current" /> KILP
              </div>
            )}
            {isDrifting && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-black text-xs shadow-lg transition-colors ${
                driftCharge === 3 ? 'bg-purple-700 ring-2 ring-purple-300' :
                driftCharge === 2 ? 'bg-amber-600 ring-2 ring-amber-300' :
                driftCharge === 1 ? 'bg-cyan-600 ring-2 ring-cyan-300' :
                'bg-red-600'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {driftCharge === 3 ? (
                  <span className="text-purple-200 animate-bounce">⚡ ULTRA TURBO!</span>
                ) : driftCharge === 2 ? (
                  <span className="text-amber-200 animate-pulse">🔥 SUPER TURBO!</span>
                ) : driftCharge === 1 ? (
                  <span className="text-cyan-200">✨ MINI-TURBO!</span>
                ) : (
                  <span>DRIFT...</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Keyboard Controls Pill Banner */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300 shadow-lg">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">W / ↑</span>
          <span>Gaas</span>
          <span className="text-slate-600">|</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">S / ↓</span>
          <span>Pidur</span>
          <span className="text-slate-600">|</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">A D / ← →</span>
          <span>Rooli</span>
          <span className="text-slate-600">|</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Tühik / Shift</span>
          <span>Drift</span>
          <span className="text-slate-600">|</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">E</span>
          <span>Ese</span>
        </div>

        {/* Speedometer, Horn, Respawn, Look Behind */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Action Buttons (Respawn & Look Behind) */}
          <div className="flex flex-col gap-2">
            {onRespawn && (
              <button
                onClick={onRespawn}
                className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md cursor-pointer text-[10px] font-bold transition-transform active:scale-95"
                title="Taasta auto rajale [R]"
              >
                🔄 [R] Taasta
              </button>
            )}
            {onLookBehindToggle && (
              <button
                onMouseDown={() => onLookBehindToggle(true)}
                onMouseUp={() => onLookBehindToggle(false)}
                onTouchStart={() => onLookBehindToggle(true)}
                onTouchEnd={() => onLookBehindToggle(false)}
                className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md cursor-pointer text-[10px] font-bold transition-transform active:scale-95"
                title="Vaata seljataha [C]"
              >
                👁️ [C] Taha
              </button>
            )}
          </div>

          <button
            onClick={onHonk}
            className="pointer-events-auto p-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs border-2 border-yellow-200 shadow-xl cursor-pointer transition-transform active:scale-95 flex flex-col items-center"
            title="Signaal / Honk [H]"
          >
            <span className="text-xl">📢</span>
            <span className="text-[10px] font-bold">[H] Tuut!</span>
          </button>

          {/* Speedometer Dial */}
          <div className="bg-slate-950/85 backdrop-blur-md border-3 border-slate-700/80 rounded-2xl p-3 md:p-4 text-center text-white shadow-2xl min-w-[110px]">
            <div className="text-3xl md:text-5xl font-black font-['Titan_One',sans-serif] text-amber-400">
              {speed}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KM / H</div>
            {/* Speed bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.min(100, (speed / 70) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* On-screen Touch Controls for Mobile/Tablets (visible on touch devices or small screens) */}
      <div className="pointer-events-auto md:hidden flex justify-between items-end mt-2 pb-2">
        {/* Left & Right Steering + Action buttons */}
        <div className="flex gap-2 items-center">
          <button
            onTouchStart={() => onInputStart('left')}
            onTouchEnd={() => onInputEnd('left')}
            onMouseDown={() => onInputStart('left')}
            onMouseUp={() => onInputEnd('left')}
            className="w-14 h-14 bg-slate-900/80 active:bg-amber-500 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onInputStart('right')}
            onTouchEnd={() => onInputEnd('right')}
            onMouseDown={() => onInputStart('right')}
            onMouseUp={() => onInputEnd('right')}
            className="w-14 h-14 bg-slate-900/80 active:bg-amber-500 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            ▶
          </button>
          {onRespawn && (
            <button
              onClick={onRespawn}
              className="w-10 h-10 bg-slate-900/90 active:bg-amber-600 border border-slate-700 rounded-xl flex items-center justify-center text-xs shadow-md"
              title="Taasta"
            >
              🔄
            </button>
          )}
        </div>

        {/* Gas, Brake, Drift, Rear View */}
        <div className="flex gap-2 items-center">
          {onLookBehindToggle && (
            <button
              onTouchStart={() => onLookBehindToggle(true)}
              onTouchEnd={() => onLookBehindToggle(false)}
              onMouseDown={() => onLookBehindToggle(true)}
              onMouseUp={() => onLookBehindToggle(false)}
              className="w-10 h-10 bg-slate-900/90 active:bg-sky-600 border border-slate-700 rounded-xl flex items-center justify-center text-xs shadow-md"
              title="Taha"
            >
              👁️
            </button>
          )}
          <button
            onTouchStart={() => onInputStart('drift')}
            onTouchEnd={() => onInputEnd('drift')}
            onMouseDown={() => onInputStart('drift')}
            onMouseUp={() => onInputEnd('drift')}
            className="w-12 h-12 bg-red-600/80 active:bg-red-500 border-2 border-red-400 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            DRIFT
          </button>
          <button
            onTouchStart={() => onInputStart('brake')}
            onTouchEnd={() => onInputEnd('brake')}
            onMouseDown={() => onInputStart('brake')}
            onMouseUp={() => onInputEnd('brake')}
            className="w-14 h-14 bg-slate-800/90 active:bg-rose-600 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            PIDUR
          </button>
          <button
            onTouchStart={() => onInputStart('throttle')}
            onTouchEnd={() => onInputEnd('throttle')}
            onMouseDown={() => onInputStart('throttle')}
            onMouseUp={() => onInputEnd('throttle')}
            className="w-14 h-14 bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            GAAS
          </button>
        </div>
      </div>
    </div>
  );
};
