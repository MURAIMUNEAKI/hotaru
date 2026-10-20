import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Share2,
  RotateCcw,
  Building,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Check,
  Flame,
} from 'lucide-react';
import { GameLog, FutureReport, LandmarkData } from '../types/game';

interface EndingModalProps {
  gameLog: GameLog;
  rawLandmarks: LandmarkData[];
  onPlayAgain: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  gameLog,
  rawLandmarks,
  onPlayAgain,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'stats'>('report');
  const [report, setReport] = useState<FutureReport | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch future report from server Gemini endpoint
  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const res = await fetch('/api/generate-future-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameLog),
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setReport(json.data);
        }
      } catch (err) {
        console.error('Failed to generate report:', err);
      } finally {
        if (isMounted) setLoadingReport(false);
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [gameLog]);

  const handleShare = async () => {
    const title = report?.special_legacy_title || '光の導き手';
    const litNames = gameLog.lit_landmarks.map((l) => l.name).join('・') || '全域の灯火';
    const headline = report?.newspaper_headline || 'ホタルの光に導かれ再生した街';
    const policy = report?.policy_theme || '光と命の循環都市基本計画';

    const text = `【Hotaru 30年後未来特報レポート】
『${gameLog.city_district}』
称号: ${title}
獲得照度: ${gameLog.total_lux.toLocaleString()} Lux
点灯施設: ${litNames}
救出仲間: ${gameLog.companions_rescued}匹

■ ${headline}
政策テーマ: ${policy}

${report?.urban_report || ''}

#Hotaru #Gemini #地域政策`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-lg flex flex-col p-4 sm:p-6 text-white overflow-y-auto">
      {/* Header Result Summary */}
      <div className="text-center pt-2 pb-4">
        {gameLog.isDefeated ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs tracking-wider mb-2 font-mono">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> GAME OVER
            </div>
            <h2 className="text-2xl font-serif-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-300 to-yellow-200">
              暗闇の業火に呑まれました
            </h2>
            <p className="text-xs text-rose-300/80 mt-1">
              敵の炎に触れ光が消えてしまいました（飛行生存: {gameLog.duration_seconds}秒）
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs tracking-wider mb-2 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> FLIGHT COMPLETED
            </div>
            <h2 className="text-2xl font-serif-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-emerald-300">
              街に光が満ちました
            </h2>
            <p className="text-xs text-emerald-300/80 mt-1">
              60秒の飛行を完遂し、夜明けを呼び寄せました
            </p>
          </>
        )}

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-3xl font-mono font-bold text-amber-300">
            {gameLog.total_lux.toLocaleString()}
          </span>
          <span className="text-sm text-amber-200/80 font-mono">Lux</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          プレイスタイル: <span className="text-emerald-300 font-medium">{gameLog.playstyle}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-white/10 max-w-sm mx-auto mb-4 w-full">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'report'
              ? 'bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 text-yellow-300 border border-yellow-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>30年後未来特報・政策</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'stats'
              ? 'bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 text-yellow-300 border border-yellow-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>飛行ログ・点灯施設</span>
        </button>
      </div>

      {/* Tab 1: Gemini 30-Year Future Newspaper Chronicle & Policy Report */}
      {activeTab === 'report' && (
        <div className="flex-1 max-w-md mx-auto w-full space-y-4">
          {loadingReport ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              <p className="text-sm text-yellow-200/90 font-serif-title">
                Gemini 3.8 Flashが30年後の政策レポートを編纂中...
              </p>
              <p className="text-xs text-slate-400">
                照度と点灯施設から未来都市の歩みを生成しています
              </p>
            </div>
          ) : report ? (
            <div className="bg-slate-900/90 border border-yellow-500/20 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Newspaper Headline */}
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center justify-between text-[11px] text-amber-300/80 font-mono mb-1">
                  <span>{report.city_name} 新聞未来特報</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {report.year}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-serif-title font-bold text-white leading-snug">
                  {report.newspaper_headline}
                </h3>
                <p className="text-xs text-yellow-300 mt-1 italic font-sans-ui">
                  {report.sub_headline}
                </p>
              </div>

              {/* Player Title Badge */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
                <span className="text-[10px] text-yellow-400 tracking-wider font-mono block">
                  HISTORICAL TITLE
                </span>
                <span className="text-sm font-serif-title font-bold text-yellow-200">
                  {report.special_legacy_title}
                </span>
              </div>

              {/* Enacted Municipal Policies */}
              {report.policy_theme && (
                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                    <span className="text-[11px] font-bold text-emerald-300 font-sans-ui flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>施行された都市再生政策</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      {report.policy_theme}
                    </span>
                  </div>

                  {report.enacted_policies && report.enacted_policies.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {report.enacted_policies.map((pol, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-400/15 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-yellow-200 font-serif-title">
                              {pol.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                              {pol.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans-ui">
                            {pol.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Urban Report */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30年後の都市発展レポート</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-serif-title bg-slate-950/50 p-3.5 rounded-xl border border-white/5 whitespace-pre-wrap">
                  {report.urban_report}
                </p>
              </div>

              {/* Citizens Voice */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>住民と子どもたちの声</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-serif-title italic bg-slate-950/50 p-3.5 rounded-xl border border-white/5">
                  {report.citizens_voice}
                </p>
              </div>

              {/* Future Indices */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">クリーン電力自給率</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {report.future_indices.clean_energy_pct}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">星空・夜空の可視度</span>
                  <span className="text-sm font-bold text-sky-400 font-mono">
                    {report.future_indices.night_sky_clarity}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">生態系共生評価</span>
                  <span className="text-xs font-bold text-lime-400 font-mono">
                    {report.future_indices.biodiversity_score}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">市民幸福度指数</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {report.future_indices.citizen_wellbeing}%
                  </span>
                </div>
              </div>

              {/* Share report text button */}
              <div className="pt-2">
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
                  <span>{copied ? 'レポート全文をコピーしました！' : '政策レポートをコピー・シェア'}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Flight Stats & Lit Landmarks */}
      {activeTab === 'stats' && (
        <div className="flex-1 max-w-md mx-auto w-full space-y-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider">
              点灯させたランドマーク（{gameLog.lit_landmarks.length}箇所）
            </h3>
            {gameLog.lit_landmarks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                今回は施設を点灯できませんでした。次回は光を集中させてみましょう！
              </p>
            ) : (
              <div className="space-y-2">
                {gameLog.lit_landmarks.map((landmark) => (
                  <div
                    key={landmark.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">{landmark.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {landmark.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 block">救出した仲間のホタル</span>
              <span className="text-lg font-bold text-yellow-300 font-mono">
                {gameLog.companions_rescued} 匹
              </span>
            </div>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 block">集光バースト発動数</span>
              <span className="text-lg font-bold text-emerald-300 font-mono">
                {gameLog.bursts_used} 回
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Play Again Footer */}
      <div className="pt-4 max-w-md mx-auto w-full">
        <button
          onClick={onPlayAgain}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg ${
            gameLog.isDefeated
              ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 text-slate-950 shadow-rose-500/25 hover:shadow-rose-500/40'
              : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 text-slate-950 shadow-yellow-500/20 hover:shadow-yellow-500/30'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{gameLog.isDefeated ? 'もう一度挑戦する（リトライ）' : '新しい街へ旅立つ（もう一度遊ぶ）'}</span>
        </button>
      </div>
    </div>
  );
};
