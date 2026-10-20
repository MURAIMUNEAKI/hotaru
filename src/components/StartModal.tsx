import React from 'react';
import { Sparkles, Zap, Users, Play, SunMedium } from 'lucide-react';

interface StartModalProps {
  onStartGame: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({ onStartGame }) => {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 text-white overflow-y-auto">
      {/* Top Brand */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs tracking-widest font-mono mb-4">
          EMOTIONAL VERTICAL SHOOTING
        </div>
        <h1 className="text-4xl font-serif-title font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-emerald-300 drop-shadow-md">
          Hotaru
        </h1>
        <p className="text-xs text-emerald-300/80 tracking-widest font-sans mt-1">
          ホタル ―― 闇を照らす光の記憶
        </p>
        <p className="text-sm text-slate-300 mt-4 leading-relaxed font-serif-title italic">
          「暗闇を照らせ。1分後に、君の街の未来が浮かび上がる。」
        </p>
      </div>

      {/* Guide Cards */}
      <div className="space-y-3 my-6">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 mt-0.5 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-200">上空から訪れる街の施設を選んで点灯</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              上から風力塔や水辺公園、巨樹タワーが降りてきます。左右に移動して光を注ぎ、眠る街の施設に灯りを灯しましょう。
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mt-0.5 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">下部ボタン帯 ＆ 光弾ミサイル・バースト</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              画面下の「◀ 左」「右 ▶」ボタンで直感操作。「ミサイル」ボタンで光弾を連射、「バースト」ボタンで広範囲の影を一掃します（画面スワイプやキーボード[A/D/Space/X]操作も可能）。
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 mt-0.5 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-sky-200">攻撃の進化 ＆ 迫る炎の回避</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              最初は1発ずつの直進光弾ですが、仲間を救うごとに放射状に攻撃範囲が広がります。上空や斜め上から降ってくる<span className="text-rose-400 font-bold">敵の炎に当たると即ゲームオーバー</span>となるため、左右にかわしましょう（バーストで消滅可能）！
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 mt-0.5 shrink-0">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-200">Geminiが紡ぐ30年後の街の未来</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              1分間の飛行終了時、あなたが灯した場所に応じて、毎回異なる30年後の街の政策レポートと未来都市アートが生成されます。
            </p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pb-4">
        <button
          onClick={onStartGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>光の旅をはじめる（60秒）</span>
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-2 font-mono">
          ※ 音声（アンビエントBGM・環境音）が出ます
        </p>
      </div>
    </div>
  );
};
