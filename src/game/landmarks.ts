import { LandmarkData } from '../types/game';

export const DISTRICT_NAMES = [
  'ソラノモト新都心',
  '碧風リバーサイド特区',
  'ネオ・ミナト未来港区',
  '星見ヶ丘エコロポリス',
  'ミズホ・ウォーターフロント',
  '常若（トコワカ）セントラル',
  'ヒカリガ丘エコスマートシティ',
  '瑠璃ノ森バイオハイツ',
];

export const MASTER_LANDMARKS: Omit<LandmarkData, 'worldY' | 'currentLight' | 'isLit' | 'xRatio'>[] = [
  {
    id: 'wind_spiral',
    name: 'スパイラル風力発電塔',
    category: 'energy',
    description: '静穏な夜風を蓄電し、都市全体へクリーン電力を供給する螺旋タワー。',
    detail: '常時回転する柔らかな光の翼が、街の送電網を目覚めさせます。',
    width: 140,
    height: 180,
    requiredLight: 35,
    baseColor: '#1e293b',
    litColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.8)',
    iconName: 'Wind',
  },
  {
    id: 'river_park',
    name: '水辺の親水バイオパーク',
    category: 'nature',
    description: '清流と水生植物が都市の微気候を整える、安らぎのウォーターフロント。',
    detail: '水面に映るホタルの光が、失われていた水辺の生態系を呼び戻します。',
    width: 200,
    height: 130,
    requiredLight: 40,
    baseColor: '#132a24',
    litColor: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.85)',
    iconName: 'Trees',
  },
  {
    id: 'central_station',
    name: '光環セントラルステーション',
    category: 'transport',
    description: '街の各区を磁気浮上トレインで結ぶ、光のトランスポートハブ。',
    detail: '軌道アーチにイルミネーションが走り、人々の交流が再び始まります。',
    width: 220,
    height: 140,
    requiredLight: 45,
    baseColor: '#261f36',
    litColor: '#fbbf24',
    accentGlow: 'rgba(251, 191, 36, 0.85)',
    iconName: 'Train',
  },
  {
    id: 'sky_tree',
    name: '天空の巨樹タワー',
    category: 'nature',
    description: '垂直緑化と光合成遺伝子を備えた、そびえ立つバイオ・シンボルツリー。',
    detail: '枝葉に無数のバイオルミネセンスが宿り、都市の空気を浄化します。',
    width: 160,
    height: 210,
    requiredLight: 48,
    baseColor: '#17252a',
    litColor: '#a3e635',
    accentGlow: 'rgba(163, 230, 53, 0.85)',
    iconName: 'Sprout',
  },
  {
    id: 'observatory',
    name: '星辰（せいしん）天文台',
    category: 'science',
    description: '光害のない澄んだ夜空を見上げ、宇宙の響きを観測するドーム。',
    detail: '天球レンズが開口し、夜空の星座と地上の光が静かに交信します。',
    width: 150,
    height: 150,
    requiredLight: 35,
    baseColor: '#1e1b4b',
    litColor: '#c084fc',
    accentGlow: 'rgba(192, 132, 252, 0.85)',
    iconName: 'Sparkles',
  },
  {
    id: 'harbor_bridge',
    name: '湾岸ルミネセンス・ブリッジ',
    category: 'transport',
    description: '対岸の居住区と新産業エリアを繋ぐ、優美な斜張橋。',
    detail: '主塔から伸びる光ファイバーケーブルが虹色に輝き、海峡を照らします。',
    width: 240,
    height: 120,
    requiredLight: 40,
    baseColor: '#0f172a',
    litColor: '#22d3ee',
    accentGlow: 'rgba(34, 211, 238, 0.85)',
    iconName: 'Anchor',
  },
  {
    id: 'bio_dome',
    name: '常緑バイオドーム植物園',
    category: 'nature',
    description: '絶滅危惧種の草花と温室ホタルが共生する、透明なジオデシックドーム。',
    detail: 'ガラスドーム内から暖かな黄金色の灯火が溢れ出し、周囲を包みます。',
    width: 170,
    height: 140,
    requiredLight: 38,
    baseColor: '#064e3b',
    litColor: '#4ade80',
    accentGlow: 'rgba(74, 222, 128, 0.85)',
    iconName: 'Flower2',
  },
  {
    id: 'crystal_library',
    name: '結晶クラウド図書館',
    category: 'culture',
    description: '幾何学的なクリスタル構造を持つ、都市の記憶と叡智を収蔵するアーカイブ。',
    detail: 'ファサードの多面体がホログラム光を反射し、知識の光を放ちます。',
    width: 160,
    height: 160,
    requiredLight: 42,
    baseColor: '#312e81',
    litColor: '#f472b6',
    accentGlow: 'rgba(244, 114, 182, 0.85)',
    iconName: 'BookOpen',
  },
];

/**
 * Generate a procedural set of landmarks descending from the TOP of the screen.
 * Total flight duration is 60 seconds at scrollSpeed ~75px/sec.
 * Landmarks will enter from the top at spaced intervals so the player can look ahead,
 * choose which side to navigate to, and illuminate them.
 */
export function generateProceduralLandmarks(_totalFlightDistance: number): {
  districtName: string;
  landmarks: LandmarkData[];
} {
  const districtName = DISTRICT_NAMES[Math.floor(Math.random() * DISTRICT_NAMES.length)];
  
  // Shuffle landmarks and pick 5
  const shuffled = [...MASTER_LANDMARKS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 5);

  // Time triggers in pixels (scrollY):
  // scrollSpeed is ~75px/sec
  // 1st: t ~ 4s  (300px)
  // 2nd: t ~ 15s (1125px)
  // 3rd: t ~ 26s (1950px)
  // 4th: t ~ 37s (2775px)
  // 5th: t ~ 48s (3600px)
  const triggerDistances = [300, 1125, 1950, 2775, 3600];

  const landmarks: LandmarkData[] = picked.map((item, index) => {
    // Alternate sides (left: ~0.26, right: ~0.74, center: ~0.50)
    // Giving clear navigational choices!
    let side: number;
    if (index % 3 === 0) {
      side = 0.26 + (Math.random() * 0.08 - 0.04);
    } else if (index % 3 === 1) {
      side = 0.74 + (Math.random() * 0.08 - 0.04);
    } else {
      side = 0.50 + (Math.random() * 0.12 - 0.06);
    }

    const worldY = triggerDistances[index] + (Math.random() * 60 - 30);

    return {
      ...item,
      xRatio: side,
      worldY,
      currentLight: 0,
      isLit: false,
    };
  });

  return { districtName, landmarks };
}
