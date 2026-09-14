import * as THREE from 'three';

interface SkidPoint {
  lx: number;
  ly: number;
  lz: number;
  rx: number;
  ry: number;
  rz: number;
}

interface FastSkidStrip {
  points: SkidPoint[];
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  posAttr: THREE.BufferAttribute;
  lastLx: number | null;
  lastLz: number | null;
}

export class SkidMarkManager {
  private scene: THREE.Scene;
  private strips: Map<string, FastSkidStrip> = new Map();
  private maxPoints = 28;
  private sharedMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sharedMat = new THREE.MeshBasicMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Records skid marks for a racer's rear tires
   */
  public addSkid(racerId: string, carX: number, carY: number, carZ: number, carRotY: number) {
    const fwdX = Math.sin(carRotY);
    const fwdZ = Math.cos(carRotY);
    const rightX = fwdZ;
    const rightZ = -fwdX;

    const rearDist = -0.85;
    const halfTrack = 0.72;
    const halfWidth = 0.11;

    const cX = carX + fwdX * rearDist;
    const cY = carY + 0.05;
    const cZ = carZ + fwdZ * rearDist;

    // Left wheel center
    const lX = cX - rightX * halfTrack;
    const lZ = cZ - rightZ * halfTrack;

    // Right wheel center
    const rX = cX + rightX * halfTrack;
    const rZ = cZ + rightZ * halfTrack;

    this.appendPoint(`${racerId}_l`, lX - rightX * halfWidth, cY, lZ - rightZ * halfWidth, lX + rightX * halfWidth, cY, lZ + rightZ * halfWidth);
    this.appendPoint(`${racerId}_r`, rX - rightX * halfWidth, cY, rZ - rightZ * halfWidth, rX + rightX * halfWidth, cY, rZ + rightZ * halfWidth);
  }

  public stopSkid(racerId: string) {
    const sL = this.strips.get(`${racerId}_l`);
    if (sL) {
      sL.lastLx = null;
      sL.lastLz = null;
    }
    const sR = this.strips.get(`${racerId}_r`);
    if (sR) {
      sR.lastLx = null;
      sR.lastLz = null;
    }
  }

  private appendPoint(key: string, lx: number, ly: number, lz: number, rx: number, ry: number, rz: number) {
    let strip = this.strips.get(key);
    if (!strip) {
      const geo = new THREE.BufferGeometry();
      const maxVerts = this.maxPoints * 2;
      const positions = new Float32Array(maxVerts * 3);
      const posAttr = new THREE.BufferAttribute(positions, 3);
      geo.setAttribute('position', posAttr);

      // Pre-populate fixed index buffer
      const maxQuads = this.maxPoints - 1;
      const indices = new Uint16Array(maxQuads * 6);
      for (let i = 0; i < maxQuads; i++) {
        const v = i * 2;
        const idx = i * 6;
        indices[idx] = v;
        indices[idx + 1] = v + 1;
        indices[idx + 2] = v + 2;
        indices[idx + 3] = v + 1;
        indices[idx + 4] = v + 3;
        indices[idx + 5] = v + 2;
      }
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.setDrawRange(0, 0);

      const mesh = new THREE.Mesh(geo, this.sharedMat);
      mesh.renderOrder = 1;
      this.scene.add(mesh);

      strip = {
        points: [],
        mesh,
        geo,
        posAttr,
        lastLx: null,
        lastLz: null,
      };
      this.strips.set(key, strip);
    }

    if (strip.lastLx !== null && strip.lastLz !== null) {
      const dx = strip.lastLx - lx;
      const dz = strip.lastLz - lz;
      if (dx * dx + dz * dz < 0.16) return; // Only add if moved at least 0.4m
    }

    strip.lastLx = lx;
    strip.lastLz = lz;

    strip.points.push({ lx, ly, lz, rx, ry, rz });
    if (strip.points.length > this.maxPoints) {
      strip.points.shift();
    }

    this.updateStripBuffer(strip);
  }

  private updateStripBuffer(strip: FastSkidStrip) {
    const count = strip.points.length;
    if (count < 2) {
      strip.geo.setDrawRange(0, 0);
      return;
    }

    const posArray = strip.posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const pt = strip.points[i];
      const base = i * 6;
      posArray[base] = pt.lx;
      posArray[base + 1] = pt.ly;
      posArray[base + 2] = pt.lz;
      posArray[base + 3] = pt.rx;
      posArray[base + 4] = pt.ry;
      posArray[base + 5] = pt.rz;
    }

    strip.posAttr.needsUpdate = true;
    strip.geo.setDrawRange(0, (count - 1) * 6);
  }

  public update(_dt: number) {
    // Gracefully fade out oldest points when full
    this.strips.forEach((strip) => {
      if (strip.points.length > 2 && Math.random() < 0.05) {
        strip.points.shift();
        this.updateStripBuffer(strip);
      }
    });
  }

  public clear() {
    this.strips.forEach((strip) => {
      this.scene.remove(strip.mesh);
      strip.geo.dispose();
    });
    this.strips.clear();
    this.sharedMat.dispose();
  }
}
