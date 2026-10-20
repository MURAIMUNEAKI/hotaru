export interface LandmarkData {
  id: string;
  name: string;
  category: 'energy' | 'nature' | 'transport' | 'culture' | 'science';
  description: string;
  detail: string;
  width: number;
  height: number;
  xRatio: number; // 0.1 to 0.9 relative to width
  worldY: number; // target altitude in the 60s journey
  requiredLight: number;
  currentLight: number;
  isLit: boolean;
  baseColor: string;
  litColor: string;
  accentGlow: string;
  iconName: string;
}

export interface PlayerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  glowRadius: number;
  isCharging: boolean;
  chargeTime: number; // ms
  maxChargeTime: number; // 800ms
  canBurst: boolean;
  companionCount: number;
}

export interface LightBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number;
  size: number;
  color: string;
  life: number;
}

export interface ShadowMist {
  id: number;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  vy: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  wispPoints: Array<{ angle: number; dist: number }>;
}

export interface TrappedCompanion {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  pulsePhase: number;
  rescued: boolean;
}

export interface FreePhoton {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  luxValue: number;
  color: string;
  life: number;
}

export interface BurstShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  power: number;
  alpha: number;
}

export interface AmbientParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  swayPhase: number;
}

export interface EnemyFlame {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotSpeed: number;
  rotation: number;
  pulsePhase: number;
}

export interface GameLog {
  total_lux: number;
  lit_landmarks: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  unlit_landmarks: Array<{
    id: string;
    name: string;
  }>;
  companions_rescued: number;
  playstyle: string;
  bursts_used: number;
  city_district: string;
  duration_seconds: number;
  isDefeated?: boolean;
}

export interface FutureReport {
  city_name: string;
  year: string;
  newspaper_headline: string;
  sub_headline: string;
  urban_report: string;
  citizens_voice: string;
  special_legacy_title: string;
  future_indices: {
    clean_energy_pct: number;
    biodiversity_score: string;
    night_sky_clarity: number;
    citizen_wellbeing: number;
  };
  visual_description: string;
}
