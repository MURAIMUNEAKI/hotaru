import { LandmarkData, FutureReport } from '../types/game';

/**
 * Procedurally renders a high-resolution concept art postcard of the illuminated Future City
 * reflecting the player's exact lit landmarks, Lux score, rescued companions, and dawn lighting.
 */
export function renderFutureCityPostcard(
  canvas: HTMLCanvasElement,
  options: {
    districtName: string;
    totalLux: number;
    litLandmarks: LandmarkData[];
    companionsRescued: number;
    report?: FutureReport;
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // 1. Sky Gradient based on Lux
  // Higher Lux gives warmer, more radiant sunrise & bioluminescent aurora
  const luxRatio = Math.min(1, options.totalLux / 10000);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  if (luxRatio > 0.7) {
    // Radiant golden-emerald sunrise
    skyGrad.addColorStop(0, '#061727');
    skyGrad.addColorStop(0.35, '#0b3954');
    skyGrad.addColorStop(0.65, '#1e5f74');
    skyGrad.addColorStop(0.85, '#f4a261');
    skyGrad.addColorStop(1, '#e76f51');
  } else if (luxRatio > 0.4) {
    // Soft violet twilight into rose
    skyGrad.addColorStop(0, '#0a0d24');
    skyGrad.addColorStop(0.4, '#241734');
    skyGrad.addColorStop(0.7, '#4a2545');
    skyGrad.addColorStop(0.9, '#a3506c');
    skyGrad.addColorStop(1, '#e29578');
  } else {
    // Deep mystic midnight with soft teal horizon
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(0.85, '#1e293b');
    skyGrad.addColorStop(1, '#334155');
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Stars and Aurora waves
  const starCount = Math.floor(60 + (1 - luxRatio) * 60);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 137.5) % w);
    const sy = ((i * 93.7) % (h * 0.55));
    const size = (i % 3 === 0) ? 2 : 1;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft Aurora Ribbon across the sky
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const auroraGrad = ctx.createLinearGradient(0, h * 0.15, w, h * 0.45);
  auroraGrad.addColorStop(0, 'rgba(74, 222, 128, 0)');
  auroraGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
  auroraGrad.addColorStop(0.7, 'rgba(192, 132, 252, 0.3)');
  auroraGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

  ctx.fillStyle = auroraGrad;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.35);
  ctx.bezierCurveTo(w * 0.3, h * 0.15, w * 0.7, h * 0.4, w, h * 0.25);
  ctx.lineTo(w, h * 0.5);
  ctx.bezierCurveTo(w * 0.65, h * 0.55, w * 0.3, h * 0.3, 0, h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Distant City Skyline Silhouettes
  const skylineY = h * 0.52;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  const buildingSeeds = [
    { x: 0.05, w: 0.08, h: 0.28 },
    { x: 0.15, w: 0.06, h: 0.35 },
    { x: 0.23, w: 0.09, h: 0.22 },
    { x: 0.35, w: 0.07, h: 0.42 },
    { x: 0.44, w: 0.11, h: 0.25 },
    { x: 0.58, w: 0.08, h: 0.38 },
    { x: 0.68, w: 0.07, h: 0.31 },
    { x: 0.77, w: 0.10, h: 0.45 },
    { x: 0.89, w: 0.08, h: 0.27 },
  ];

  buildingSeeds.forEach((b) => {
    const bx = b.x * w;
    const bw = b.w * w;
    const bh = b.h * h;
    const by = skylineY - bh;
    ctx.fillRect(bx, by, bw, bh);

    // Glowing window grids
    ctx.fillStyle = luxRatio > 0.4 ? 'rgba(254, 240, 138, 0.35)' : 'rgba(56, 189, 248, 0.25)';
    for (let wy = by + 12; wy < skylineY - 10; wy += 14) {
      for (let wx = bx + 6; wx < bx + bw - 6; wx += 10) {
        if ((wx + wy) % 3 !== 0) {
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  });

  // 4. Ground & Reflective River Canal
  const groundY = h * 0.66;
  const waterGrad = ctx.createLinearGradient(0, groundY, 0, h);
  waterGrad.addColorStop(0, '#091522');
  waterGrad.addColorStop(0.3, '#0e2b3d');
  waterGrad.addColorStop(1, '#06131c');

  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, groundY, w, h - groundY);

  // River water shimmering reflections
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let r = 0; r < 25; r++) {
    const ry = groundY + 15 + Math.random() * (h - groundY - 30);
    const rx = Math.random() * w;
    const rw = 20 + Math.random() * 80;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.fillRect(rx, ry, rw, 2);
  }
  ctx.restore();

  // 5. Draw the Lit Landmarks dynamically in the foreground/midground
  const litCount = options.litLandmarks.length;
  options.litLandmarks.forEach((landmark, idx) => {
    const posX = litCount === 1 ? w * 0.5 : w * 0.18 + (idx / Math.max(1, litCount - 1)) * (w * 0.64);
    const baseY = groundY + 10;

    ctx.save();
    // Radiant landmark glow
    const glowRad = ctx.createRadialGradient(posX, baseY - 80, 10, posX, baseY - 80, 140);
    glowRad.addColorStop(0, landmark.accentGlow);
    glowRad.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
    glowRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowRad;
    ctx.beginPath();
    ctx.arc(posX, baseY - 80, 140, 0, Math.PI * 2);
    ctx.fill();

    // Draw landmark architectural icon / structure
    ctx.strokeStyle = landmark.litColor;
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';

    if (landmark.id.includes('wind')) {
      // Wind Turbine Tower
      ctx.beginPath();
      ctx.moveTo(posX - 15, baseY);
      ctx.lineTo(posX - 6, baseY - 120);
      ctx.lineTo(posX + 6, baseY - 120);
      ctx.lineTo(posX + 15, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blades
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      for (let a = 0; a < 3; a++) {
        const ang = (a * (Math.PI * 2)) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(posX, baseY - 120);
        ctx.lineTo(posX + Math.cos(ang) * 45, baseY - 120 + Math.sin(ang) * 45);
        ctx.stroke();
      }
    } else if (landmark.id.includes('tree')) {
      // Sky Bio-Tree
      ctx.beginPath();
      ctx.arc(posX, baseY - 110, 50, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(163, 230, 53, 0.25)';
      ctx.fill();
      ctx.stroke();

      // Trunk
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.moveTo(posX - 14, baseY);
      ctx.quadraticCurveTo(posX - 8, baseY - 60, posX - 6, baseY - 110);
      ctx.lineTo(posX + 6, baseY - 110);
      ctx.quadraticCurveTo(posX + 8, baseY - 60, posX + 14, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (landmark.id.includes('dome') || landmark.id.includes('observatory')) {
      // Dome
      ctx.beginPath();
      ctx.arc(posX, baseY - 20, 55, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
      ctx.fill();
      ctx.stroke();

      // Geodesic ribs
      ctx.beginPath();
      ctx.arc(posX, baseY - 20, 35, Math.PI, 0);
      ctx.stroke();
    } else {
      // Modern High-tech Solarpunk Spire / Station
      ctx.beginPath();
      ctx.moveTo(posX - 35, baseY);
      ctx.lineTo(posX - 12, baseY - 140);
      ctx.lineTo(posX, baseY - 165);
      ctx.lineTo(posX + 12, baseY - 140);
      ctx.lineTo(posX + 35, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Beam shooting upwards
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(posX, baseY - 165);
      ctx.lineTo(posX, 20);
      ctx.stroke();
    }

    // Landmark Name Label on Postcard
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Zen Kaku Gothic New", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(landmark.name, posX, baseY + 20);

    ctx.restore();
  });

  // 6. Flying Swarm of Rescued Fireflies (Authentic Japanese Fireflies)
  const companionTotal = Math.max(3, options.companionsRescued);
  for (let c = 0; c < companionTotal; c++) {
    const cx = (w * 0.15) + ((c * 179 + 53) % (w * 0.7));
    const cy = (h * 0.22) + ((c * 113 + 37) % (h * 0.38));
    const fScale = 0.65;

    ctx.save();
    // Bioluminescent green-gold lantern halo
    ctx.globalCompositeOperation = 'screen';
    const cGlow = ctx.createRadialGradient(cx, cy + 6 * fScale, 1, cx, cy + 6 * fScale, 22 * fScale);
    cGlow.addColorStop(0, 'rgba(254, 240, 138, 1)');
    cGlow.addColorStop(0.35, 'rgba(163, 230, 53, 0.7)');
    cGlow.addColorStop(0.7, 'rgba(74, 222, 128, 0.3)');
    cGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(cx, cy + 6 * fScale, 22 * fScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    // Transparent flutter wings
    ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx - 10 * fScale, cy - 2 * fScale, 12 * fScale, 3.5 * fScale, -Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 10 * fScale, cy - 2 * fScale, 12 * fScale, 3.5 * fScale, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Abdomen & tail lantern
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3 * fScale, 4.5 * fScale, 4 * fScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright glowing lantern organ
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8 * fScale, 4 * fScale, 4.5 * fScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Elytra (dark wing cases)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx - 5 * fScale, cy - 3 * fScale, 4.5 * fScale, 11 * fScale, 2);
    ctx.roundRect(cx + 0.5 * fScale, cy - 3 * fScale, 4.5 * fScale, 11 * fScale, 2);
    ctx.fill();

    // Pronotum (Iconic red shield with black spot)
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 5 * fScale, 5.5 * fScale, 3.8 * fScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 5 * fScale, 2 * fScale, 2.4 * fScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 9 * fScale, 3 * fScale, 2.5 * fScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 7. Card Frame and Typography Header
  ctx.save();
  // Header Plate
  ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
  ctx.fillRect(0, 0, w, 76);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Top title
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HOTARU CHRONICLE 2056', 24, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px "Shippori Mincho", serif';
  ctx.fillText(`未来都市『${options.districtName}』の夜明け`, 24, 58);

  // Right Badge
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${options.totalLux.toLocaleString()} LUX`, w - 24, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "Zen Kaku Gothic New", sans-serif';
  ctx.fillText(`仲間 ${options.companionsRescued}匹 / 点灯 ${litCount}施設`, w - 24, 56);

  // Bottom Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px "Zen Kaku Gothic New", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    options.report?.special_legacy_title || '―― 暗闇を照らし、世界を救った光の記録 ――',
    w / 2,
    h - 18
  );
  ctx.restore();
}
