import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  scaleSpeed: number;
  life: number;
  maxLife: number;
  initialScale: number;
  baseOpacity: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleGroup: THREE.Group;
  private activeParticles: Particle[] = [];
  private particlePool: THREE.Mesh[] = [];

  // Pre-instantiated shared geometries
  private sparkGeo: THREE.SphereGeometry;
  private starGeo: THREE.BufferGeometry;
  private smokeGeo: THREE.SphereGeometry;
  private flameGeo: THREE.ConeGeometry;

  // Pre-instantiated shared materials (avoids WebGL shader thrashing & GC stalls)
  private smokeMat: THREE.MeshBasicMaterial;
  private flameCyanMat: THREE.MeshBasicMaterial;
  private flameOrangeMat: THREE.MeshBasicMaterial;
  private sparkYellowMat: THREE.MeshBasicMaterial;
  private sparkOrangeMat: THREE.MeshBasicMaterial;
  private sparkBlueMat: THREE.MeshBasicMaterial;
  private sparkPurpleMat: THREE.MeshBasicMaterial;
  private sparkGreenMat: THREE.MeshBasicMaterial;
  private oilDarkMat: THREE.MeshBasicMaterial;
  private starMats: THREE.MeshBasicMaterial[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.sparkGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.smokeGeo = new THREE.SphereGeometry(0.22, 6, 6);
    this.flameGeo = new THREE.ConeGeometry(0.2, 0.6, 6);
    this.flameGeo.rotateX(Math.PI / 2);

    // Create a 5-pointed cartoon comic star geometry
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = 0.28;
    const innerR = 0.12;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (points * 2)) * Math.PI * 2;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    this.starGeo = new THREE.ShapeGeometry(starShape);

    // Shared materials with fixed depth settings
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.flameCyanMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.flameOrangeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.sparkYellowMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    this.sparkOrangeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    this.sparkBlueMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.sparkPurpleMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.sparkGreenMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.oilDarkMat = new THREE.MeshBasicMaterial({
      color: 0x09090b,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.starMats = [0xfacc15, 0xef4444, 0xf97316, 0xffffff, 0xa855f7].map(
      (c) =>
        new THREE.MeshBasicMaterial({
          color: c,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        })
    );

    // Pre-populate particle pool with initial meshes to eliminate allocations during gameplay
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.smokeMat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particlePool.push(mesh);
    }
  }

  public getWarmupMeshes(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [
      new THREE.Mesh(this.sparkGeo, this.sparkYellowMat),
      new THREE.Mesh(this.smokeGeo, this.smokeMat),
      new THREE.Mesh(this.flameGeo, this.flameOrangeMat),
      new THREE.Mesh(this.flameGeo, this.flameCyanMat),
    ];
    this.starMats.forEach(m => list.push(new THREE.Mesh(this.starGeo, m)));
    return list;
  }

  private acquireMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    let mesh: THREE.Mesh;
    if (this.particlePool.length > 0) {
      mesh = this.particlePool.pop()!;
      mesh.geometry = geometry;
      mesh.material = material;
      mesh.visible = true;
    } else {
      mesh = new THREE.Mesh(geometry, material);
      this.particleGroup.add(mesh);
    }
    return mesh;
  }

  private releaseMesh(mesh: THREE.Mesh) {
    mesh.visible = false;
    if (this.particlePool.length < 250) {
      this.particlePool.push(mesh);
    }
  }

  /**
   * Spawns exhaust smoke puff
   */
  public emitExhaustSmoke(x: number, y: number, z: number, carRotY: number) {
    if (this.activeParticles.length > 80) return;
    const mesh = this.acquireMesh(this.smokeGeo, this.smokeMat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.1,
      y + (Math.random() - 0.5) * 0.05,
      z + (Math.random() - 0.5) * 0.1
    );

    const fwdX = Math.sin(carRotY);
    const fwdZ = Math.cos(carRotY);

    this.activeParticles.push({
      mesh,
      vx: -fwdX * 1.5 + (Math.random() - 0.5) * 0.6,
      vy: 0.5 + Math.random() * 0.4,
      vz: -fwdZ * 1.5 + (Math.random() - 0.5) * 0.6,
      rotSpeed: (Math.random() - 0.5) * 2,
      scaleSpeed: 1.5,
      life: 0.45,
      maxLife: 0.45,
      initialScale: 1.0,
      baseOpacity: 0.55,
    });
  }

  /**
   * Spawns nitro boost flame jet
   */
  public emitNitroFlame(x: number, y: number, z: number, carRotY: number) {
    if (this.activeParticles.length > 80) return;
    const isCyan = Math.random() > 0.35;
    const mat = isCyan ? this.flameCyanMat : this.flameOrangeMat;
    const mesh = this.acquireMesh(this.flameGeo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = carRotY;

    const fwdX = Math.sin(carRotY);
    const fwdZ = Math.cos(carRotY);

    this.activeParticles.push({
      mesh,
      vx: -fwdX * 6 + (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.3,
      vz: -fwdZ * 6 + (Math.random() - 0.5) * 0.6,
      rotSpeed: 0,
      scaleSpeed: 0.7,
      life: 0.18,
      maxLife: 0.18,
      initialScale: 1.0,
      baseOpacity: 0.85,
    });
  }

  /**
   * Spawns drift sparks (yellow, orange, blue, or purple based on tier)
   */
  public emitDriftSparks(x: number, y: number, z: number, level: 1 | 2 | 3) {
    if (this.activeParticles.length > 80) return;
    const count = 1;
    for (let i = 0; i < count; i++) {
      const mat =
        level === 3
          ? this.sparkPurpleMat
          : level === 2
          ? (Math.random() > 0.5 ? this.sparkOrangeMat : this.sparkYellowMat)
          : this.sparkBlueMat;

      const mesh = this.acquireMesh(this.sparkGeo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.2,
        y + 0.1,
        z + (Math.random() - 0.5) * 0.2
      );

      this.activeParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 3.5,
        vy: 1.4 + Math.random() * 2.2,
        vz: (Math.random() - 0.5) * 3.5,
        rotSpeed: (Math.random() - 0.5) * 5,
        scaleSpeed: -0.5,
        life: 0.3,
        maxLife: 0.3,
        initialScale: 0.9,
        baseOpacity: 0.9,
      });
    }
  }

  /**
   * Spawns bump / collision sparks
   */
  public emitSparks(x: number, y: number, z: number, colorHex: number = 0xffd700, count: number = 6) {
    for (let i = 0; i < Math.min(count, 8); i++) {
      const mat = Math.random() > 0.5 ? this.sparkYellowMat : this.sparkOrangeMat;
      const mesh = this.acquireMesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4;

      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 1.2 + Math.random() * 2.5,
        vz: Math.sin(angle) * speed,
        rotSpeed: 0,
        scaleSpeed: -0.4,
        life: 0.28,
        maxLife: 0.28,
        initialScale: 1.0,
        baseOpacity: 0.9,
      });
    }
  }

  /**
   * Spawns explosion burst of comic stars & smoke clouds
   */
  public emitExplosion(x: number, y: number, z: number) {
    // Stars
    for (let i = 0; i < 12; i++) {
      const mat = this.starMats[i % this.starMats.length];
      const mesh = this.acquireMesh(this.starGeo, mat);
      mesh.position.set(x, y + 0.5, z);

      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 5 + Math.random() * 6;

      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 4,
        vz: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * 8,
        scaleSpeed: -0.6,
        life: 0.45,
        maxLife: 0.45,
        initialScale: 1.2,
        baseOpacity: 0.95,
      });
    }

    // Accompanying smoke puffs
    for (let i = 0; i < 6; i++) {
      const mesh = this.acquireMesh(this.smokeGeo, this.smokeMat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.8,
        y + 0.4 + Math.random() * 0.5,
        z + (Math.random() - 0.5) * 0.8
      );

      this.activeParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 3,
        rotSpeed: (Math.random() - 0.5) * 2,
        scaleSpeed: 2.2,
        life: 0.6,
        maxLife: 0.6,
        initialScale: 1.4,
        baseOpacity: 0.6,
      });
    }
  }

  /**
   * Spawns massive blue rocket explosion
   */
  public emitBlueExplosion(x: number, y: number, z: number) {
    // Glowing cyan and blue stars
    for (let i = 0; i < 24; i++) {
      const isBlue = i % 2 === 0;
      const mat = isBlue ? this.sparkBlueMat : this.flameCyanMat;
      const mesh = this.acquireMesh(this.starGeo, mat);
      mesh.position.set(x, y + 0.8, z);

      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 7 + Math.random() * 9;

      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 6,
        vz: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * 10,
        scaleSpeed: -0.5,
        life: 0.65,
        maxLife: 0.65,
        initialScale: 1.8,
        baseOpacity: 1.0,
      });
    }

    // Dense smoke ring
    for (let i = 0; i < 12; i++) {
      const mesh = this.acquireMesh(this.smokeGeo, this.smokeMat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 1.5,
        y + 0.5 + Math.random() * 0.8,
        z + (Math.random() - 0.5) * 1.5
      );

      this.activeParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 5,
        vy: 2 + Math.random() * 3,
        vz: (Math.random() - 0.5) * 5,
        rotSpeed: (Math.random() - 0.5) * 3,
        scaleSpeed: 2.8,
        life: 0.75,
        maxLife: 0.75,
        initialScale: 1.8,
        baseOpacity: 0.7,
      });
    }
  }

  /**
   * Spawns vertical lightning bolt and electric ground shockwave
   */
  public emitLightning(x: number, y: number, z: number) {
    // Vertical electric spark column (cloud to ground)
    for (let step = 0; step < 10; step++) {
      const mat = step % 2 === 0 ? this.sparkBlueMat : this.sparkPurpleMat;
      const mesh = this.acquireMesh(this.sparkGeo, mat);
      const boltY = y + (step * 0.35);
      const jitterX = (Math.random() - 0.5) * 0.4;
      const jitterZ = (Math.random() - 0.5) * 0.4;
      mesh.position.set(x + jitterX, boltY, z + jitterZ);

      this.activeParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
        rotSpeed: 0,
        scaleSpeed: 0.8,
        life: 0.35,
        maxLife: 0.35,
        initialScale: 1.5,
        baseOpacity: 1.0,
      });
    }

    // Ground spark burst
    for (let i = 0; i < 14; i++) {
      const mat = i % 2 === 0 ? this.sparkPurpleMat : this.flameCyanMat;
      const mesh = this.acquireMesh(this.sparkGeo, mat);
      mesh.position.set(x, y + 0.2, z);
      const a = (i / 14) * Math.PI * 2;
      const spd = 4 + Math.random() * 5;

      this.activeParticles.push({
        mesh,
        vx: Math.cos(a) * spd,
        vy: 1.5 + Math.random() * 3.5,
        vz: Math.sin(a) * spd,
        rotSpeed: 0,
        scaleSpeed: -0.5,
        life: 0.4,
        maxLife: 0.4,
        initialScale: 1.2,
        baseOpacity: 0.95,
      });
    }
  }

  /**
   * Spawns ominous rain/electric sparks under active thundercloud
   */
  public emitCloudSparks(x: number, y: number, z: number) {
    if (this.activeParticles.length > 80) return;
    const mat = Math.random() > 0.5 ? this.sparkPurpleMat : this.flameCyanMat;
    const mesh = this.acquireMesh(this.sparkGeo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.7,
      y - 0.2,
      z + (Math.random() - 0.5) * 0.7
    );

    this.activeParticles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -2.5 - Math.random() * 2.0,
      vz: (Math.random() - 0.5) * 0.8,
      rotSpeed: 0,
      scaleSpeed: -0.4,
      life: 0.22,
      maxLife: 0.22,
      initialScale: 0.8,
      baseOpacity: 0.9,
    });
  }

  /**
   * Spawns rainbow sparkle trail for Super Star invincibility
   */
  public emitStarAura(x: number, y: number, z: number) {
    if (this.activeParticles.length > 80) return;
    const mat = this.starMats[Math.floor(Math.random() * this.starMats.length)];
    const mesh = this.acquireMesh(this.starGeo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.8,
      y + 0.3 + Math.random() * 0.6,
      z + (Math.random() - 0.5) * 0.8
    );

    this.activeParticles.push({
      mesh,
      vx: (Math.random() - 0.5) * 2,
      vy: 1.5 + Math.random() * 2,
      vz: (Math.random() - 0.5) * 2,
      rotSpeed: (Math.random() - 0.5) * 6,
      scaleSpeed: -0.5,
      life: 0.3,
      maxLife: 0.3,
      initialScale: 1.0,
      baseOpacity: 0.95,
    });
  }

  /**
   * Spawns item box shatter celebration particles
   */
  public emitBoxBreak(x: number, y: number, z: number) {
    for (let i = 0; i < 10; i++) {
      const mat = this.starMats[i % this.starMats.length];
      const mesh = this.acquireMesh(this.starGeo, mat);
      mesh.position.set(x, y + 0.5, z);
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 3.5 + Math.random() * 3.5;

      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.5 + Math.random() * 2.5,
        vz: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * 6,
        scaleSpeed: -0.4,
        life: 0.4,
        maxLife: 0.4,
        initialScale: 0.8,
        baseOpacity: 0.95,
      });
    }
  }

  public emitIceCrystals(x: number, y: number, z: number) {
    for (let i = 0; i < 14; i++) {
      const mesh = this.acquireMesh(this.starGeo, this.sparkBlueMat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 1.5,
        y + 0.3 + Math.random() * 1.2,
        z + (Math.random() - 0.5) * 1.5
      );
      const angle = Math.random() * Math.PI * 2;
      const spd = 2.0 + Math.random() * 4.0;
      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: 1.5 + Math.random() * 3.0,
        vz: Math.sin(angle) * spd,
        rotSpeed: (Math.random() - 0.5) * 8,
        scaleSpeed: -0.5,
        life: 0.65,
        maxLife: 0.65,
        initialScale: 1.2,
        baseOpacity: 0.95,
      });
    }
  }

  public emitVortexSwirl(x: number, y: number, z: number) {
    for (let i = 0; i < 8; i++) {
      const mesh = this.acquireMesh(this.sparkGeo, this.sparkPurpleMat);
      const angle = (i / 8) * Math.PI * 2;
      const r = 2.2 + Math.random() * 1.5;
      mesh.position.set(x + Math.cos(angle) * r, y + 0.4, z + Math.sin(angle) * r);
      // Inward swirl velocity
      const inwardSpeed = 4.5;
      const tangSpeed = 5.0;
      this.activeParticles.push({
        mesh,
        vx: -Math.cos(angle) * inwardSpeed - Math.sin(angle) * tangSpeed,
        vy: 1.2 + Math.random() * 1.5,
        vz: -Math.sin(angle) * inwardSpeed + Math.cos(angle) * tangSpeed,
        rotSpeed: 10,
        scaleSpeed: -0.6,
        life: 0.45,
        maxLife: 0.45,
        initialScale: 1.4,
        baseOpacity: 0.9,
      });
    }
  }

  public emitPlasmaBurst(x: number, y: number, z: number) {
    for (let i = 0; i < 14; i++) {
      const mat = i % 2 === 0 ? this.sparkGreenMat : this.flameCyanMat;
      const mesh = this.acquireMesh(this.sparkGeo, mat);
      mesh.position.set(x, y + 0.35, z);
      const angle = (i / 14) * Math.PI * 2;
      const spd = 6.0 + Math.random() * 5.0;
      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: 2.0 + Math.random() * 4.0,
        vz: Math.sin(angle) * spd,
        rotSpeed: (Math.random() - 0.5) * 12,
        scaleSpeed: -0.6,
        life: 0.65,
        maxLife: 0.65,
        initialScale: 1.6,
        baseOpacity: 0.95,
      });
    }
  }

  public emitOilSplatter(x: number, y: number, z: number) {
    for (let i = 0; i < 12; i++) {
      const mat = i % 3 === 0 ? this.sparkPurpleMat : this.oilDarkMat;
      const mesh = this.acquireMesh(this.sparkGeo, mat);
      mesh.position.set(x, y + 0.2, z);
      const angle = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 4.0;
      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: 1.8 + Math.random() * 2.5,
        vz: Math.sin(angle) * spd,
        rotSpeed: (Math.random() - 0.5) * 6,
        scaleSpeed: -0.4,
        life: 0.75,
        maxLife: 0.75,
        initialScale: 1.5,
        baseOpacity: 0.95,
      });
    }
  }

  /**
   * Updates all active particles smoothly (compacts array in-place with zero allocations)
   */
  public update(dt: number) {
    let aliveCount = 0;

    for (let i = 0; i < this.activeParticles.length; i++) {
      const p = this.activeParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.releaseMesh(p.mesh);
      } else {
        // Move
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        // Apply slight gravity
        p.vy -= 8.5 * dt * 0.6;

        // Rotate
        p.mesh.rotation.y += p.rotSpeed * dt;
        p.mesh.rotation.z += p.rotSpeed * dt;

        // Scale
        const lifeRatio = p.life / p.maxLife;
        const currentScale = Math.max(0.01, p.initialScale * (1 + (1 - lifeRatio) * p.scaleSpeed));
        p.mesh.scale.set(currentScale, currentScale, currentScale);

        this.activeParticles[aliveCount++] = p;
      }
    }

    this.activeParticles.length = aliveCount;
  }

  public clear() {
    for (let i = 0; i < this.activeParticles.length; i++) {
      this.releaseMesh(this.activeParticles[i].mesh);
    }
    this.activeParticles = [];
  }

  public destroy() {
    this.clear();
    this.scene.remove(this.particleGroup);
    this.sparkGeo.dispose();
    this.smokeGeo.dispose();
    this.flameGeo.dispose();
    this.starGeo.dispose();
  }
}
