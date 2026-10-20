import {
  LandmarkData,
  PlayerState,
  LightBullet,
  ShadowMist,
  TrappedCompanion,
  FreePhoton,
  BurstShockwave,
  AmbientParticle,
  EnemyFlame,
  GameLog,
} from '../types/game';
import { generateProceduralLandmarks } from './landmarks';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onTimeUpdate: (remainingSec: number) => void;
  onLuxUpdate: (lux: number) => void;
  onCompanionsUpdate: (count: number) => void;
  onLandmarkLit: (landmark: LandmarkData) => void;
  onBurstChargeUpdate: (chargeRatio: number, isReady: boolean) => void;
  onGameOver: (gameLog: GameLog) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Game Clock
  private totalDuration: number = 60; // 60 seconds
  private timeRemaining: number = 60;

  // Game World & Viewport
  private width: number = 390;
  private height: number = 720;
  private scrollY: number = 0;
  private scrollSpeed: number = 75; // px per second

  // Stats
  private totalLux: number = 0;
  private burstsUsed: number = 0;
  private bulletsFired: number = 0;
  private shadowsPurified: number = 0;
  public districtName: string = '';

  // Bottom Control States
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private isManualShooting: boolean = false;
  private buttonMoveSpeed: number = 320; // px/sec

  // Enemy Flame Spawning
  private enemyFlames: EnemyFlame[] = [];
  private flameSpawnTimer: number = 2.0;

  // Player State
  private player: PlayerState = {
    x: 195,
    y: 560,
    targetX: 195,
    targetY: 560,
    size: 14,
    glowRadius: 36,
    isCharging: false,
    chargeTime: 0,
    maxChargeTime: 700,
    canBurst: false,
    companionCount: 0,
  };

  // Trailing companions
  private companionTrails: Array<{ x: number; y: number; angle: number; dist: number }> = [];

  // Entities
  private bullets: LightBullet[] = [];
  private shadows: ShadowMist[] = [];
  private trappedCompanions: TrappedCompanion[] = [];
  private freePhotons: FreePhoton[] = [];
  private shockwaves: BurstShockwave[] = [];
  private ambientParticles: AmbientParticle[] = [];
  private landmarks: LandmarkData[] = [];

  // Auto-shoot timer
  private shootCooldown: number = 0;
  private shootInterval: number = 0.13; // 130ms

  // Touch control tracking on canvas
  private isPointerDown: boolean = false;
  private touchOffset: number = 60;

  // Next entity id
  private entityIdCounter: number = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');
    this.ctx = context;
    this.callbacks = callbacks;

    this.resizeCanvas();
    this.initAmbientParticles();
  }

  /**
   * Calculates optimal Y position for the player firefly based on canvas height.
   * Dynamically adapts to any screen aspect ratio (tall smartphone, standard, or compact):
   * Placed comfortably in the lower region to maximize upstream viewing/reaction distance,
   * while keeping safe clearance for the firefly's bioluminescent tail and companions.
   */
  public getOptimalPlayerY(): number {
    const bottomMargin = Math.max(52, Math.min(84, 46 + (this.height - 400) * 0.075));
    return Math.round(this.height - bottomMargin);
  }

  public resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 390;
    this.height = rect.height || 720;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    const optY = this.getOptimalPlayerY();
    this.player.y = optY;
    this.player.targetY = optY;
  }

  private initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
        speed: 20 + Math.random() * 30,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  public start() {
    this.reset();
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.startAmbientBgm();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopAmbientBgm();
  }

  public reset() {
    this.timeRemaining = this.totalDuration;
    this.totalLux = 0;
    this.burstsUsed = 0;
    this.bulletsFired = 0;
    this.shadowsPurified = 0;
    this.scrollY = 0;

    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isManualShooting = false;
    this.flameSpawnTimer = 2.0;

    const optY = this.getOptimalPlayerY();
    this.player.x = this.width / 2;
    this.player.y = optY;
    this.player.targetX = this.player.x;
    this.player.targetY = optY;
    this.player.companionCount = 0;
    this.player.isCharging = false;
    this.player.chargeTime = 0;
    this.companionTrails = [];

    this.bullets = [];
    this.shadows = [];
    this.enemyFlames = [];
    this.trappedCompanions = [];
    this.freePhotons = [];
    this.shockwaves = [];

    // Generate landmarks descending from the top
    const totalFlightDistance = this.totalDuration * this.scrollSpeed;
    const generated = generateProceduralLandmarks(totalFlightDistance);
    this.districtName = generated.districtName;
    this.landmarks = generated.landmarks;

    // Seed companions coming down from the top between landmarks
    const companionTriggers = [600, 1500, 2350, 3150, 3950];
    companionTriggers.forEach((trig) => {
      this.trappedCompanions.push({
        id: this.entityIdCounter++,
        x: (0.2 + Math.random() * 0.6) * this.width,
        y: -trig,
        health: 18,
        maxHealth: 18,
        pulsePhase: Math.random() * Math.PI * 2,
        rescued: false,
      });
    });

    this.callbacks.onTimeUpdate(this.timeRemaining);
    this.callbacks.onLuxUpdate(this.totalLux);
    this.callbacks.onCompanionsUpdate(0);
    this.callbacks.onBurstChargeUpdate(0, false);
  }

  // --- External Control Band Methods ---
  public setMovingLeft(active: boolean) {
    this.isMovingLeft = active;
  }

  public setMovingRight(active: boolean) {
    this.isMovingRight = active;
  }

  public setManualShooting(active: boolean) {
    this.isManualShooting = active;
    if (active) {
      this.fireLightBullets();
      this.shootCooldown = 0.08;
    }
  }

  public startChargingBurst() {
    this.player.isCharging = true;
    soundManager.init();
  }

  public releaseBurst() {
    if (this.player.chargeTime >= this.player.maxChargeTime * 0.35) {
      this.triggerBurst();
    }
    this.player.isCharging = false;
    this.player.chargeTime = 0;
    this.callbacks.onBurstChargeUpdate(0, false);
  }

  // --- Direct Canvas Pointer / Touch Handlers ---
  public handlePointerDown(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top - this.touchOffset;

    this.isPointerDown = true;
    const optY = this.getOptimalPlayerY();
    const minY = Math.max(90, this.height * 0.4);
    this.player.targetX = Math.max(30, Math.min(this.width - 30, x));
    this.player.targetY = Math.max(minY, Math.min(optY, y));

    soundManager.init();
  }

  public handlePointerMove(clientX: number, clientY: number) {
    if (!this.isPointerDown) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top - this.touchOffset;

    const optY = this.getOptimalPlayerY();
    const minY = Math.max(90, this.height * 0.4);
    this.player.targetX = Math.max(30, Math.min(this.width - 30, x));
    this.player.targetY = Math.max(minY, Math.min(optY, y));
  }

  public handlePointerUp() {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
  }

  public triggerBurst() {
    this.burstsUsed++;
    soundManager.playBurstRelease();

    const maxRad = 180 + this.player.companionCount * 30;
    this.shockwaves.push({
      x: this.player.x,
      y: this.player.y,
      radius: 10,
      maxRadius: maxRad,
      power: 70 + this.player.companionCount * 12,
      alpha: 1,
    });

    for (let p = 0; p < 25; p++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 160;
      this.freePhotons.push({
        id: this.entityIdCounter++,
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        luxValue: 30,
        color: '#fef08a',
        life: 1.6,
      });
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);

    if (!this.isRunning) return; // If game over happened during update

    this.render();

    if (this.timeRemaining <= 0) {
      this.endGame(false);
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Clock countdown
    this.timeRemaining -= dt;
    if (this.timeRemaining < 0) this.timeRemaining = 0;
    this.callbacks.onTimeUpdate(Math.ceil(this.timeRemaining));

    // World scrolling
    this.scrollY += this.scrollSpeed * dt;

    // 2. Control Band Movement (Left / Right)
    if (this.isMovingLeft) {
      this.player.targetX -= this.buttonMoveSpeed * dt;
    }
    if (this.isMovingRight) {
      this.player.targetX += this.buttonMoveSpeed * dt;
    }
    this.player.targetX = Math.max(30, Math.min(this.width - 30, this.player.targetX));

    // When not actively dragging, keep targetY at optimal Y height adapted to screen
    if (!this.isPointerDown) {
      this.player.targetY = this.getOptimalPlayerY();
    }

    // Smooth player interpolation
    const lerp = Math.min(1, dt * 16);
    this.player.x += (this.player.targetX - this.player.x) * lerp;
    this.player.y += (this.player.targetY - this.player.y) * lerp;

    // 3. Charging Burst
    if (this.player.isCharging) {
      this.player.chargeTime += dt * 1000;
      const ratio = Math.min(1, this.player.chargeTime / this.player.maxChargeTime);
      const ready = ratio >= 0.7;
      this.callbacks.onBurstChargeUpdate(ratio, ready);
      if (Math.random() < 0.25) {
        soundManager.playBurstCharge(ratio);
      }
    } else {
      this.player.chargeTime = 0;
    }

    // 4. Update companions orbiting/following player
    this.updateCompanions(dt);

    // 5. Shooting (Auto-shoot or rapid manual fire)
    this.shootCooldown -= dt;
    const currentInterval = this.isManualShooting ? 0.08 : this.shootInterval;
    if (this.shootCooldown <= 0) {
      this.shootCooldown = currentInterval;
      this.fireLightBullets();
    }

    // 6. Spawn shadows drifting from the TOP
    if (Math.random() < dt * 2.3) {
      this.spawnShadowMist();
    }

    // 7. Spawn Enemy Flames (Descending straight and diagonally from TOP)
    this.flameSpawnTimer -= dt;
    if (this.flameSpawnTimer <= 0) {
      this.spawnEnemyFlame();
      const progress = (this.totalDuration - this.timeRemaining) / this.totalDuration;
      // Flame interval gets slightly tighter as time progresses
      this.flameSpawnTimer = Math.max(0.85, 1.8 - progress * 0.95) + Math.random() * 0.35;
    }

    // 8. Update bullets (moving UPWARDS)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > this.width + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // 9. Update shadows (drifting DOWNWARDS from top)
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      const s = this.shadows[i];
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      s.rotation += s.rotSpeed * dt;

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        const dist = Math.hypot(b.x - s.x, b.y - s.y);
        if (dist < s.radius + b.size) {
          s.health -= b.power;
          this.bullets.splice(j, 1);

          if (s.health <= 0) {
            this.purifyShadow(s);
            this.shadows.splice(i, 1);
            break;
          }
        }
      }

      if (s.y > this.height + 60) {
        this.shadows.splice(i, 1);
      }
    }

    // 10. Update Enemy Flames & Collision with Player (INSTANT GAME OVER!)
    for (let i = this.enemyFlames.length - 1; i >= 0; i--) {
      const f = this.enemyFlames[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rotation += f.rotSpeed * dt;
      f.pulsePhase += dt * 8;

      // Hitbox check against player firefly
      const playerHitbox = 9;
      const flameHitbox = f.radius * 0.72;
      const dist = Math.hypot(this.player.x - f.x, this.player.y - f.y);

      if (dist < playerHitbox + flameHitbox) {
        // Direct hit by flame: Instant Game Over!
        this.handleHitByFlame(f);
        return;
      }

      if (f.y > this.height + 60 || f.x < -60 || f.x > this.width + 60) {
        this.enemyFlames.splice(i, 1);
      }
    }

    // 11. Update trapped companions (descending from TOP)
    for (let i = this.trappedCompanions.length - 1; i >= 0; i--) {
      const c = this.trappedCompanions[i];
      c.y += this.scrollSpeed * dt;
      c.pulsePhase += dt * 3;

      if (!c.rescued && c.y > -50 && c.y < this.height + 50) {
        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const b = this.bullets[j];
          const dist = Math.hypot(b.x - c.x, b.y - c.y);
          if (dist < 28) {
            c.health -= b.power;
            this.bullets.splice(j, 1);
            if (c.health <= 0) {
              c.rescued = true;
              this.rescueCompanion(c);
              break;
            }
          }
        }
      }

      if (c.y > this.height + 100) {
        this.trappedCompanions.splice(i, 1);
      }
    }

    // 12. Update Landmarks (descending from TOP)
    this.landmarks.forEach((landmark) => {
      const screenY = (this.scrollY - landmark.worldY) - 140;
      const screenX = landmark.xRatio * this.width;

      if (screenY > -180 && screenY < this.height + 200 && !landmark.isLit) {
        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const b = this.bullets[j];
          const dx = Math.abs(b.x - screenX);
          const dy = Math.abs(b.y - screenY);

          if (dx < landmark.width * 0.52 && dy < landmark.height * 0.52) {
            landmark.currentLight += b.power;
            this.bullets.splice(j, 1);
            this.addLux(15);

            if (landmark.currentLight >= landmark.requiredLight) {
              landmark.isLit = true;
              this.igniteLandmark(landmark, screenX, screenY);
            }
          }
        }
      }
    });

    // 13. Update Shockwaves (vaporizes flames defensively!)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += dt * 440;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      // Vaporize enemy flames in burst range!
      for (let fIdx = this.enemyFlames.length - 1; fIdx >= 0; fIdx--) {
        const f = this.enemyFlames[fIdx];
        if (Math.hypot(f.x - sw.x, f.y - sw.y) < sw.radius + f.radius) {
          for (let p = 0; p < 4; p++) {
            this.freePhotons.push({
              id: this.entityIdCounter++,
              x: f.x,
              y: f.y,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              luxValue: 15,
              color: '#fef08a',
              life: 1.0,
            });
          }
          this.enemyFlames.splice(fIdx, 1);
        }
      }

      // Purify shadows in burst range
      for (let sIdx = this.shadows.length - 1; sIdx >= 0; sIdx--) {
        const s = this.shadows[sIdx];
        const dist = Math.hypot(s.x - sw.x, s.y - sw.y);
        if (dist < sw.radius + s.radius) {
          s.health -= sw.power;
          if (s.health <= 0) {
            this.purifyShadow(s);
            this.shadows.splice(sIdx, 1);
          }
        }
      }

      // Hit trapped companions in radius
      this.trappedCompanions.forEach((c) => {
        if (!c.rescued && Math.hypot(c.x - sw.x, c.y - sw.y) < sw.radius + 25) {
          c.rescued = true;
          this.rescueCompanion(c);
        }
      });

      // Illuminate landmarks in radius
      this.landmarks.forEach((lm) => {
        if (!lm.isLit) {
          const lScreenY = (this.scrollY - lm.worldY) - 140;
          const lScreenX = lm.xRatio * this.width;
          if (Math.hypot(lScreenX - sw.x, lScreenY - sw.y) < sw.radius + 60) {
            lm.currentLight += sw.power * 0.85;
            this.addLux(60);
            if (lm.currentLight >= lm.requiredLight) {
              lm.isLit = true;
              this.igniteLandmark(lm, lScreenX, lScreenY);
            }
          }
        }
      });

      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 14. Update Free Photons (magnet towards player)
    for (let i = this.freePhotons.length - 1; i >= 0; i--) {
      const p = this.freePhotons[i];
      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 150) {
        const pull = (150 - dist) * 9 * dt;
        p.vx += (dx / dist) * pull;
        p.vy += (dy / dist) * pull;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;

      if (dist < 26) {
        this.addLux(p.luxValue);
        soundManager.playPhotonCollect();
        this.freePhotons.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || p.y > this.height + 40) {
        this.freePhotons.splice(i, 1);
      }
    }

    // 15. Ambient particles
    this.ambientParticles.forEach((p) => {
      p.y += p.speed * dt;
      p.swayPhase += dt * 2;
      p.x += Math.sin(p.swayPhase) * 0.6;
      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }
    });
  }

  private updateCompanions(dt: number) {
    const count = this.player.companionCount;
    while (this.companionTrails.length < count) {
      const idx = this.companionTrails.length;
      this.companionTrails.push({
        x: this.player.x,
        y: this.player.y,
        angle: (idx * Math.PI * 2) / Math.max(1, count),
        dist: 28 + Math.floor(idx / 3) * 12,
      });
    }

    this.companionTrails.forEach((comp, idx) => {
      comp.angle += dt * (2.0 + idx * 0.2);
      const targetX = this.player.x + Math.cos(comp.angle) * comp.dist;
      const targetY = this.player.y + Math.sin(comp.angle) * (comp.dist * 0.5) - 4;

      comp.x += (targetX - comp.x) * dt * 10;
      comp.y += (targetY - comp.y) * dt * 10;
    });
  }

  /**
   * Attack System:
   * "最初は、こちらから出す攻撃が１つづつだけ。キャラが増えるごとに広がりを出す。"
   * - 0 companions: Exactly 1 single centered beam forward.
   * - 1 companion: 2 beams.
   * - 2 companions: 3 beams (center + left + right).
   * - 3 companions: 4 beams spread.
   * - 4+ companions: Expansive radiant fan spray!
   */
  private fireLightBullets() {
    this.bulletsFired++;
    soundManager.playShoot();

    const companionCount = this.player.companionCount;

    if (companionCount === 0) {
      // 最初は攻撃が1つだけ（中央前方に1本）
      this.bullets.push({
        id: this.entityIdCounter++,
        x: this.player.x,
        y: this.player.y - 18,
        vx: 0,
        vy: -550,
        power: 12,
        size: 4.8,
        color: '#fef08a',
        life: 1.8,
      });
    } else if (companionCount === 1) {
      // 仲間1匹：メイン中央 + 仲間からの1本（計2本）
      this.bullets.push({
        id: this.entityIdCounter++,
        x: this.player.x,
        y: this.player.y - 18,
        vx: 0,
        vy: -550,
        power: 10,
        size: 4.5,
        color: '#fef08a',
        life: 1.8,
      });

      if (this.companionTrails[0]) {
        this.bullets.push({
          id: this.entityIdCounter++,
          x: this.companionTrails[0].x,
          y: this.companionTrails[0].y - 8,
          vx: 24,
          vy: -520,
          power: 8,
          size: 3.8,
          color: '#86efac',
          life: 1.6,
        });
      }
    } else {
      // 仲間2匹以上：キャラが増えるごとに広がりを出す！
      this.bullets.push({
        id: this.entityIdCounter++,
        x: this.player.x,
        y: this.player.y - 18,
        vx: 0,
        vy: -550,
        power: 10,
        size: 4.5,
        color: '#fef08a',
        life: 1.8,
      });

      this.companionTrails.forEach((comp, idx) => {
        const sign = idx % 2 === 0 ? -1 : 1;
        const tier = Math.floor(idx / 2) + 1;
        const angle = sign * (0.13 * tier); // ~7.5度、15度、22度と広がる扇状ビーム
        const speed = 520;

        this.bullets.push({
          id: this.entityIdCounter++,
          x: comp.x,
          y: comp.y - 8,
          vx: Math.sin(angle) * speed,
          vy: -Math.cos(angle) * speed,
          power: 7,
          size: 3.6,
          color: '#86efac',
          life: 1.6,
        });
      });
    }
  }

  private spawnShadowMist() {
    const radius = 16 + Math.random() * 22;
    const wispPoints: Array<{ angle: number; dist: number }> = [];
    for (let i = 0; i < 7; i++) {
      wispPoints.push({
        angle: (i * Math.PI * 2) / 7,
        dist: radius * (0.7 + Math.random() * 0.5),
      });
    }

    this.shadows.push({
      id: this.entityIdCounter++,
      x: 30 + Math.random() * (this.width - 60),
      y: -40,
      radius,
      health: 12 + Math.floor(radius * 0.5),
      maxHealth: 12 + Math.floor(radius * 0.5),
      vy: 55 + Math.random() * 55,
      vx: (Math.random() - 0.5) * 20,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      wispPoints,
    });
  }

  /**
   * Spawn enemy fire attacks descending straight and diagonally from the top.
   * "上や斜め上から敵の攻撃の炎がやってきて、これをよけていく。これにあたると、その場でゲームオーバー。"
   */
  private spawnEnemyFlame() {
    const x = 20 + Math.random() * (this.width - 40);
    const y = -35;

    let vx = 0;
    let vy = 140 + Math.random() * 50;

    // 65% chance to aim diagonally towards player's position
    if (Math.random() < 0.65) {
      const dx = this.player.x - x;
      const dy = this.player.y - y;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.28;
      const speed = 150 + Math.random() * 55;
      vx = Math.cos(angle) * speed;
      vy = Math.max(90, Math.sin(angle) * speed);
    } else {
      vx = (Math.random() - 0.5) * 45;
    }

    this.enemyFlames.push({
      id: this.entityIdCounter++,
      x,
      y,
      vx,
      vy,
      radius: 12 + Math.random() * 4,
      rotSpeed: (Math.random() - 0.5) * 3,
      rotation: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  /**
   * Player hit by enemy flame: Instant Game Over!
   */
  private handleHitByFlame(_flame: EnemyFlame) {
    soundManager.playDefeated();
    this.endGame(true);
  }

  private purifyShadow(shadow: ShadowMist) {
    this.shadowsPurified++;
    soundManager.playPurify();
    this.addLux(40);

    const photonCount = 3 + Math.floor(shadow.radius / 8);
    for (let i = 0; i < photonCount; i++) {
      const angle = (i * Math.PI * 2) / photonCount + (Math.random() - 0.5);
      const speed = 40 + Math.random() * 80;
      this.freePhotons.push({
        id: this.entityIdCounter++,
        x: shadow.x,
        y: shadow.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        luxValue: 20,
        color: '#a7f3d0',
        life: 2.2,
      });
    }
  }

  private rescueCompanion(companion: TrappedCompanion) {
    this.player.companionCount++;
    soundManager.playCompanionRescued();
    this.addLux(250);
    this.callbacks.onCompanionsUpdate(this.player.companionCount);

    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 90;
      this.freePhotons.push({
        id: this.entityIdCounter++,
        x: companion.x,
        y: companion.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        luxValue: 25,
        color: '#facc15',
        life: 1.8,
      });
    }
  }

  private igniteLandmark(landmark: LandmarkData, screenX: number, screenY: number) {
    soundManager.playLandmarkIgnited();
    this.addLux(1800);
    this.callbacks.onLandmarkLit(landmark);

    this.shockwaves.push({
      x: screenX,
      y: screenY,
      radius: 10,
      maxRadius: 240,
      power: 80,
      alpha: 1,
    });

    for (let i = 0; i < 20; i++) {
      const ang = (i * Math.PI * 2) / 20;
      this.freePhotons.push({
        id: this.entityIdCounter++,
        x: screenX + Math.cos(ang) * 40,
        y: screenY + Math.sin(ang) * 40,
        vx: Math.cos(ang) * 80,
        vy: Math.sin(ang) * 80,
        luxValue: 35,
        color: '#fde047',
        life: 2.5,
      });
    }
  }

  private addLux(amount: number) {
    const companionMultiplier = 1 + this.player.companionCount * 0.15;
    this.totalLux += Math.round(amount * companionMultiplier);
    this.callbacks.onLuxUpdate(this.totalLux);
  }

  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Dynamic Background based on Lux
    const luxProgress = Math.min(1, this.totalLux / 10000);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);

    if (luxProgress < 0.3) {
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.7, '#071322');
      bgGrad.addColorStop(1, '#0c1e30');
    } else if (luxProgress < 0.7) {
      bgGrad.addColorStop(0, '#0a0d24');
      bgGrad.addColorStop(0.4, '#1e1838');
      bgGrad.addColorStop(0.75, '#3b1c40');
      bgGrad.addColorStop(1, '#5c2a45');
    } else {
      bgGrad.addColorStop(0, '#081726');
      bgGrad.addColorStop(0.35, '#133e5c');
      bgGrad.addColorStop(0.7, '#435e76');
      bgGrad.addColorStop(0.9, '#c27d53');
      bgGrad.addColorStop(1, '#f59e0b');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Parallax Distant Skyline Silhouettes
    this.renderParallaxSkyline(luxProgress);

    // 3. Ambient Floating Micro-Photons
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    this.ambientParticles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Landmarks: DESCENDING FROM THE TOP!
    this.landmarks.forEach((landmark) => {
      const screenY = (this.scrollY - landmark.worldY) - 140;
      const screenX = landmark.xRatio * w;
      if (screenY > -200 && screenY < h + 200) {
        this.renderLandmark(landmark, screenX, screenY);
      }
    });

    // 5. Trapped Companions (descending from the top)
    this.trappedCompanions.forEach((c) => {
      if (!c.rescued && c.y > -50 && c.y < h + 50) {
        this.renderTrappedCompanion(c);
      }
    });

    // 6. Shadow Mists
    this.shadows.forEach((s) => {
      this.renderShadow(s);
    });

    // 7. Enemy Flames (Dangerous descending fire attacks to dodge!)
    this.enemyFlames.forEach((f) => {
      this.renderEnemyFlame(f);
    });

    // 8. Light Bullets
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.bullets.forEach((b) => {
      const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.size * 2.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 9. Shockwaves
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.shockwaves.forEach((sw) => {
      ctx.strokeStyle = `rgba(254, 240, 138, ${sw.alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(74, 222, 128, ${sw.alpha * 0.6})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // 10. Free Photons
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.freePhotons.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 11. Companion Fireflies
    this.companionTrails.forEach((comp) => {
      this.renderFirefly(comp.x, comp.y, 6, '#86efac', 'rgba(134, 239, 172, 0.7)', false);
    });

    // 12. Main Player Firefly
    const chargeRatio = Math.min(1, this.player.chargeTime / this.player.maxChargeTime);
    this.renderFirefly(
      this.player.x,
      this.player.y,
      this.player.size,
      '#ffffff',
      'rgba(250, 204, 21, 0.85)',
      true,
      this.player.isCharging,
      chargeRatio
    );
  }

  /**
   * Render Enemy Flames:
   * Dangerous dark violet-crimson fiery projectile with swirling tongues and bright core.
   */
  private renderEnemyFlame(f: EnemyFlame) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);

    const pulse = Math.sin(f.pulsePhase) * 2.5;
    const r = f.radius + pulse;

    // 1. Fiery outer demonic aura (screen mode)
    ctx.globalCompositeOperation = 'screen';
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.2);
    aura.addColorStop(0, 'rgba(254, 215, 170, 0.95)');
    aura.addColorStop(0.3, 'rgba(249, 115, 22, 0.85)');
    aura.addColorStop(0.65, 'rgba(239, 68, 68, 0.65)');
    aura.addColorStop(1, 'rgba(124, 58, 237, 0)');

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Starburst / flame tongues
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const dist = (i % 2 === 0 ? r : r * 0.52);
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Hot white core
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderParallaxSkyline(luxProgress: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const parallaxY = (this.scrollY * 0.3) % 400;
    ctx.fillStyle = luxProgress > 0.6 ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.7)';

    for (let i = 0; i < 6; i++) {
      const bx = (i * w) / 5;
      const bw = w / 6;
      const bh = 140 + (i % 3) * 60;
      const by = h - bh + (parallaxY * 0.2);
      ctx.fillRect(bx, by, bw, bh);

      if (luxProgress > 0.3) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
        for (let wy = by + 20; wy < h; wy += 22) {
          ctx.fillRect(bx + 8, wy, 4, 8);
          ctx.fillRect(bx + bw - 14, wy, 4, 8);
        }
        ctx.fillStyle = luxProgress > 0.6 ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.7)';
      }
    }
  }

  private renderLandmark(lm: LandmarkData, sx: number, sy: number) {
    const ctx = this.ctx;
    const halfW = lm.width / 2;
    const halfH = lm.height / 2;

    ctx.save();

    if (lm.isLit) {
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, lm.width * 0.8);
      glow.addColorStop(0, lm.accentGlow);
      glow.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, lm.width * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = lm.isLit ? 'rgba(15, 23, 42, 0.95)' : lm.baseColor;
    ctx.strokeStyle = lm.isLit ? lm.litColor : '#475569';
    ctx.lineWidth = lm.isLit ? 3 : 1.5;

    ctx.beginPath();
    if (lm.id.includes('wind')) {
      ctx.moveTo(sx - 16, sy + halfH);
      ctx.lineTo(sx - 6, sy - halfH + 20);
      ctx.lineTo(sx + 6, sy - halfH + 20);
      ctx.lineTo(sx + 16, sy + halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const rot = (performance.now() / 600);
      for (let b = 0; b < 3; b++) {
        const ang = rot + (b * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy - halfH + 20);
        ctx.lineTo(sx + Math.cos(ang) * 45, sy - halfH + 20 + Math.sin(ang) * 45);
        ctx.lineWidth = lm.isLit ? 4 : 2;
        ctx.stroke();
      }
    } else if (lm.id.includes('tree')) {
      ctx.arc(sx, sy - 15, halfW * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx - 12, sy + halfH);
      ctx.lineTo(sx - 5, sy - 10);
      ctx.lineTo(sx + 5, sy - 10);
      ctx.lineTo(sx + 12, sy + halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.roundRect(sx - halfW, sy - halfH, lm.width, lm.height, [16, 16, 4, 4]);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx, sy - halfH);
      ctx.lineTo(sx, sy - halfH - 25);
      ctx.stroke();
    }

    ctx.font = 'bold 12px "Zen Kaku Gothic New", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = lm.isLit ? '#ffffff' : '#94a3b8';
    ctx.fillText(lm.name, sx, sy + halfH + 18);

    if (!lm.isLit) {
      const barW = lm.width * 0.8;
      const barH = 5;
      const barX = sx - barW / 2;
      const barY = sy + halfH + 24;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(barX, barY, barW, barH);

      const ratio = Math.min(1, lm.currentLight / lm.requiredLight);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(barX, barY, barW * ratio, barH);
    } else {
      ctx.fillStyle = '#4ade80';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('✦ LIGHT RESTORED ✦', sx, sy + halfH + 30);
    }

    ctx.restore();
  }

  private renderTrappedCompanion(c: TrappedCompanion) {
    const ctx = this.ctx;
    ctx.save();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(30, 27, 75, 0.8)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const pulse = Math.sin(c.pulsePhase) * 4;
    const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 14 + pulse);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 14 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px "Zen Kaku Gothic New", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('仲間を救出', c.x, c.y + 36);

    ctx.restore();
  }

  private renderShadow(s: ShadowMist) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    ctx.fillStyle = 'rgba(15, 12, 28, 0.85)';
    ctx.strokeStyle = 'rgba(76, 29, 149, 0.6)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    s.wispPoints.forEach((pt, idx) => {
      const px = Math.cos(pt.angle) * pt.dist;
      const py = Math.sin(pt.angle) * pt.dist;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderFirefly(
    x: number,
    y: number,
    _baseSize: number,
    _coreColor: string,
    auraColor: string,
    isMain: boolean,
    isCharging: boolean = false,
    chargeRatio: number = 0
  ) {
    const ctx = this.ctx;
    ctx.save();

    const now = performance.now();
    const scale = isMain ? 1.0 : 0.52;

    // 1. Bioluminescent Breathing Glow
    const breathFreq = isCharging ? 0.014 : 0.005;
    const pulse = Math.sin(now * breathFreq) * 0.22 + 0.88;
    const haloRad = (isMain ? 36 : 20) * (isCharging ? 1 + chargeRatio * 0.8 : pulse);

    ctx.globalCompositeOperation = 'screen';
    const halo = ctx.createRadialGradient(x, y + 10 * scale, 2, x, y + 10 * scale, haloRad);
    halo.addColorStop(0, isCharging ? 'rgba(254, 240, 138, 0.95)' : auraColor);
    halo.addColorStop(0.35, 'rgba(163, 230, 53, 0.55)');
    halo.addColorStop(0.7, 'rgba(74, 222, 128, 0.25)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y + 10 * scale, haloRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    // 2. High-speed Fluttering Transparent Flight Wings
    const flapSpeed = now * 0.045;
    const flapAmp = Math.sin(flapSpeed) * (isMain ? 9 : 5);

    ctx.save();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(
      x - 13 * scale,
      y - 2 * scale,
      15 * scale,
      4.5 * scale + Math.abs(flapAmp) * 0.25,
      -Math.PI / 5 + flapAmp * 0.03,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
      x + 13 * scale,
      y - 2 * scale,
      15 * scale,
      4.5 * scale + Math.abs(flapAmp) * 0.25,
      Math.PI / 5 - flapAmp * 0.03,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Legs (6 fine legs)
    if (isMain) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(x + dir * 5, y - 8);
        ctx.lineTo(x + dir * 14, y - 16);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + dir * 6, y - 2);
        ctx.lineTo(x + dir * 16, y - 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + dir * 6, y + 6);
        ctx.lineTo(x + dir * 15, y + 12);
        ctx.stroke();
      });
    }

    // 4. Abdomen & Glowing Lantern
    const segY = y + 2 * scale;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(x, segY + 4 * scale, 6.5 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, segY + 9 * scale, 6 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Luminous Tail Lantern
    const lanternGrad = ctx.createRadialGradient(
      x,
      segY + 14 * scale,
      1,
      x,
      segY + 14 * scale,
      8 * scale
    );
    lanternGrad.addColorStop(0, '#ffffff');
    lanternGrad.addColorStop(0.4, '#fef08a');
    lanternGrad.addColorStop(0.8, '#a3e635');
    lanternGrad.addColorStop(1, '#4ade80');

    ctx.fillStyle = lanternGrad;
    ctx.beginPath();
    ctx.ellipse(x, segY + 14 * scale, 5.5 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Elytra (hard wing covers)
    const wingAngle = 0.16;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Left Elytron
    ctx.save();
    ctx.translate(x - 1 * scale, y - 4 * scale);
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.roundRect(-7 * scale, 0, 7 * scale, 17 * scale, [2 * scale, 0, 5 * scale, 6 * scale]);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(-1 * scale, 2 * scale);
    ctx.lineTo(-1 * scale, 15 * scale);
    ctx.stroke();
    ctx.restore();

    // Right Elytron
    ctx.save();
    ctx.translate(x + 1 * scale, y - 4 * scale);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.roundRect(0, 0, 7 * scale, 17 * scale, [0, 2 * scale, 6 * scale, 5 * scale]);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(1 * scale, 2 * scale);
    ctx.lineTo(1 * scale, 15 * scale);
    ctx.stroke();
    ctx.restore();

    // 6. Thorax / Pronotum - ICONIC RED SHIELD WITH BLACK MARK!
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(x, y - 7 * scale, 7.5 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(x, y - 7 * scale, 2.8 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Head, Eyes & Antennae
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(x, y - 13 * scale, 4 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(x - 3.8 * scale, y - 13 * scale, 1.3 * scale, 0, Math.PI * 2);
    ctx.arc(x + 3.8 * scale, y - 13 * scale, 1.3 * scale, 0, Math.PI * 2);
    ctx.fill();

    const sway = Math.sin(now * 0.006) * (isMain ? 2.5 : 1.5);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2 * scale;

    ctx.beginPath();
    ctx.moveTo(x - 2 * scale, y - 15 * scale);
    ctx.quadraticCurveTo(
      x - 8 * scale + sway,
      y - 22 * scale,
      x - 12 * scale + sway * 1.5,
      y - 26 * scale
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 2 * scale, y - 15 * scale);
    ctx.quadraticCurveTo(
      x + 8 * scale - sway,
      y - 22 * scale,
      x + 12 * scale - sway * 1.5,
      y - 26 * scale
    );
    ctx.stroke();

    ctx.restore();
  }

  private endGame(isDefeated: boolean = false) {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopAmbientBgm();

    let playstyle = '調和と探求の灯火手（Harmonious Restorer）';
    if (isDefeated) {
      playstyle = '暗闇に散った勇敢な光（Fallen Spark）';
    } else if (this.burstsUsed >= 6) {
      playstyle = '閃光のルミネセンスマスター（Burst Purifier）';
    } else if (this.player.companionCount >= 4) {
      playstyle = '光の群れを導く羊飼い（Companion Shepherd）';
    } else if (this.landmarks.filter((l) => l.isLit).length >= 4) {
      playstyle = '都市復元のアーキテクト（Landmark Restorer）';
    }

    const litLandmarks = this.landmarks.filter((l) => l.isLit);
    const unlitLandmarks = this.landmarks.filter((l) => !l.isLit);

    const elapsedSeconds = Math.round(this.totalDuration - this.timeRemaining);

    const gameLog: GameLog = {
      total_lux: this.totalLux,
      lit_landmarks: litLandmarks.map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category,
        description: l.description,
      })),
      unlit_landmarks: unlitLandmarks.map((l) => ({
        id: l.id,
        name: l.name,
      })),
      companions_rescued: this.player.companionCount,
      playstyle,
      bursts_used: this.burstsUsed,
      city_district: this.districtName,
      duration_seconds: elapsedSeconds,
      isDefeated,
    };

    this.callbacks.onGameOver(gameLog);
  }

  public getRawLandmarks(): LandmarkData[] {
    return this.landmarks;
  }
}
