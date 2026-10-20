import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface GenerateReportPayload {
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
  duration_seconds?: number;
  isDefeated?: boolean;
}

// Generate future city report based on game logs
app.post('/api/generate-future-report', async (req, res) => {
  const {
    total_lux,
    lit_landmarks,
    unlit_landmarks,
    companions_rescued,
    playstyle,
    bursts_used,
    city_district,
    duration_seconds = 60,
    isDefeated = false,
  }: GenerateReportPayload = req.body;

  const litNames = lit_landmarks.map((l) => l.name).join('、') || '市街地全般の微光';
  const unlitNames = unlit_landmarks.map((l) => l.name).join('、') || 'なし（全施設点灯）';

  const defeatedNote = isDefeated
    ? `※なお、ホタルは激しい暗闇の業火に触れ、${duration_seconds}秒間の飛行の末に散ってしまいました。しかし、それまでに灯した光と救った仲間たちの記憶は市民たちの胸に生き続けています。志半ばで消えた勇敢な光を称えつつ、灯された施設を基点に制定された追悼と復元の政策をレポートにしてください。`
    : `※ホタルは60秒間の飛行を完遂し、街に希望の夜明けをもたらしました。`;

  // System instruction for the Gemini storytelling focused on policy & municipal futures
  const prompt = `
あなたは2056年（30年後）の未来都市「${city_district}」の都市記録編纂者および未来新聞のチーフエディターです。
プレイヤーが灯した光（照度: ${total_lux} Lux、飛行時間: ${duration_seconds}秒）、救出した仲間のホタル数（${companions_rescued}匹）、
点灯させた重要施設（${litNames}）、未点灯の施設（${unlitNames}）、プレイスタイル（${playstyle}）、発動した集光バースト回数（${bursts_used}回）のログをもとに、
「この街が30年後にどのような未来都市に発展したか」の【政策特報レポート】と住民の声を執筆してください。
${defeatedNote}

重要ルール:
1. プレイヤーが点灯させた具体的な施設（例: 風力発電、水辺の親水公園、天空の樹木タワーなど）および施設カテゴリー（エネルギー、自然共生、交通、文化、科学技術）に直結した【具体的な政策・条例（政策テーマおよび施行された3つの個別政策）】を明確に定めてください。
   - 点灯された施設によって推進された政策が大きく変わります。
   - 例: 太陽光や風力なら『持続可能エネルギー地域自給政策』、水辺や公園なら『親水エコロジー保全政策』、駅やモビリティなら『ゼロエミッション交通特区政策』、科学や文化なら『次世代バイオ知能・共育推進政策』など。
2. 照度（Lux）や救出したホタル数（コミュニティの絆）によって街の明るさや市民幸福度、政策の達成度が変わります。
3. 日本語で情緒豊かに、どこか温かく希望に満ちた文体で書いてください。毎回プレイ結果に応じてユニークな都市ビジョンと政策成果を描いてください。
4. 必ず指定のJSON形式で出力してください。
`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an imaginative future urban policy chronicle writer. Always respond with strict valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city_name: { type: Type.STRING, description: '未来都市の名称' },
              year: { type: Type.STRING, description: '年（例: 2056年（30年後））' },
              newspaper_headline: { type: Type.STRING, description: '特報の新聞大見出し' },
              sub_headline: { type: Type.STRING, description: 'サブキャッチコピー' },
              policy_theme: { type: Type.STRING, description: '施行された中核政策テーマ（例:『水と光のゼロカーボン共生特区推進基本計画』）' },
              enacted_policies: {
                type: Type.ARRAY,
                description: '点灯施設や成果に基づいて制定された3つの具体的政策',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: '政策・条例の名称' },
                    category: { type: Type.STRING, description: '分野（エネルギー/自然/交通/文化/福祉など）' },
                    summary: { type: Type.STRING, description: '政策の具体的内容と市民への恩恵（60〜90文字）' },
                  },
                  required: ['title', 'category', 'summary'],
                },
              },
              urban_report: {
                type: Type.STRING,
                description: '30年後の街の復元・政策・発展のレポート本文（約250〜350文字）',
              },
              citizens_voice: {
                type: Type.STRING,
                description: '住民や研究者、子どもからの感謝のメッセージ（約100〜150文字）',
              },
              special_legacy_title: {
                type: Type.STRING,
                description: 'プレイヤーに授けられた歴史的称号（例:「水と光の調和をもたらした導師」）',
              },
              future_indices: {
                type: Type.OBJECT,
                properties: {
                  clean_energy_pct: { type: Type.NUMBER, description: 'クリーンエネルギー自給率(0-100)' },
                  biodiversity_score: { type: Type.STRING, description: '生態系共生評価（例: S+級「光華の森」）' },
                  night_sky_clarity: { type: Type.NUMBER, description: '夜空と星の可視度(0-100)' },
                  citizen_wellbeing: { type: Type.NUMBER, description: '市民幸福度指数(0-100)' },
                },
                required: [
                  'clean_energy_pct',
                  'biodiversity_score',
                  'night_sky_clarity',
                  'citizen_wellbeing',
                ],
              },
              visual_description: {
                type: Type.STRING,
                description: '光に包まれた未来都市の美しい情景描写（100文字程度）',
              },
            },
            required: [
              'city_name',
              'year',
              'newspaper_headline',
              'sub_headline',
              'policy_theme',
              'enacted_policies',
              'urban_report',
              'citizens_voice',
              'special_legacy_title',
              'future_indices',
              'visual_description',
            ],
          },
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);
      return res.json({ success: true, data: parsedData });
    }
  } catch (err) {
    console.warn('Gemini generation fallback used due to error or missing key:', err);
  }

  // Graceful dynamic procedural fallback if Gemini API is unavailable or errors
  const energyPct = Math.min(99, Math.max(50, Math.floor(total_lux / 120) + companions_rescued * 2));
  const clarityPct = Math.min(98, Math.max(60, 70 + Math.floor(companions_rescued * 2.5)));
  const wellbeingPct = Math.min(100, Math.max(65, 80 + lit_landmarks.length * 4));

  const litCount = lit_landmarks.length;
  const headline =
    litCount >= 4
      ? `【特報】闇を破る光芒が結実――『${city_district}』が世界屈指のルミネッセンス・エコ都市へ`
      : isDefeated
      ? `【追悼と継承】暗闇に挑んだ光の軌跡――『${city_district}』が誓う復興政策特報`
      : `【未来史録】ホタルの光に導かれ再生した街――『${city_district}』30年の歩み`;

  // Dynamically tailor enacted policies based on the lit landmarks
  const dynamicPolicies = [];
  const litCategories = new Set(lit_landmarks.map((l) => l.category));

  if (litCategories.has('energy') || total_lux > 6000) {
    dynamicPolicies.push({
      title: '自立分散型ルミネッセンス電力供給条例',
      category: 'エネルギー',
      summary: '点灯された発電施設を基軸に、全戸へ100%再生可能エネルギーを無料供給する送電網が完成。',
    });
  } else {
    dynamicPolicies.push({
      title: '常若の微光保全・省エネルギー協定',
      category: 'エネルギー',
      summary: '残された光を効率的に循環させ、夜間の無駄な消費をゼロにする市民共同管理制度を確立。',
    });
  }

  if (litCategories.has('nature') || companions_rescued >= 3) {
    dynamicPolicies.push({
      title: 'ホタル回廊・水辺ビオトープ再生政策',
      category: '環境・共生',
      summary: `${companions_rescued}匹の仲間たちが導いた清流再生により、絶滅危惧種を含む動植物が都市中心部へ帰還。`,
    });
  } else {
    dynamicPolicies.push({
      title: '都市緑化と光害ゼロ景観憲章',
      category: '環境・共生',
      summary: '暗闇の美しさと柔らかな夜間照明の調和を守り、夜空の星々を街中から見上げる景観区を制定。',
    });
  }

  if (litCategories.has('transport') || litCategories.has('science') || litCount >= 3) {
    dynamicPolicies.push({
      title: '光磁気リニア・空中歩廊スマート交通網',
      category: 'モビリティ・知能',
      summary: '主要拠点をシームレスに結ぶ完全自動運転のクリーン交通網を敷設し、歩行者天国を全域拡大。',
    });
  } else {
    dynamicPolicies.push({
      title: '地域支え合いコミュニティ復興ファンド',
      category: '市民福祉',
      summary: '暗闇に立ち向かった住民たちの連帯を元に、次世代を担う子どもたちの学びと交流の場を助成。',
    });
  }

  const fallbackReport = {
    city_name: `${city_district}・光華スマートシティ`,
    year: '2056年（30年後）',
    newspaper_headline: headline,
    sub_headline: `照度 ${total_lux.toLocaleString()} Luxの記憶が生んだ、人と自然が優しく共鳴する夜明け`,
    policy_theme: `『${city_district}・光と命の循環都市基本計画』`,
    enacted_policies: dynamicPolicies,
    urban_report: `30年前のあの日、漆黒の夜空を舞った光の軌跡は、都市再生のシンボルとなりました。点灯された【${litNames}】を核として、持続可能なバイオエネルギー網と光合成型建築群が整備。救出された${companions_rescued}匹のホタル達は都市河川と空中庭園に豊かな生態系を築き、かつての暗雲は完全に浄化され、世界初となる『暗闇と光が美しく調和する共生特区』として国際的な栄誉に輝いています。`,
    citizens_voice: `「あの日、空に走ったあたたかな光を今でも覚えています。子どもたちは毎晩、ビルを包む光の木々の下で笑顔を交わしています。あの光が、私たちの未来を守ってくれたのです。」――都市環境保全協議会・住民代表`,
    special_legacy_title:
      total_lux > 8000
        ? '『常若の夜明けを齎せし光の守護星』'
        : '『都市の心に灯を点した碧き導き手』',
    future_indices: {
      clean_energy_pct: energyPct,
      biodiversity_score: companions_rescued >= 5 ? 'S+級「光環のサンクチュアリ」' : 'A級「共生緑地」',
      night_sky_clarity: clarityPct,
      citizen_wellbeing: wellbeingPct,
    },
    visual_description: `群青の夜明け空に、エメラルドと黄金の光を湛えた高層タワー群と清らかな水路が広がり、無数のホタルの光が空を舞う幻想的な未来都市。`,
  };

  return res.json({ success: true, data: fallbackReport });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Hotaru server running on http://localhost:${port}`);
  });
}

startServer();
