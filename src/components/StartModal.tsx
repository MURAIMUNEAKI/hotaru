import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface StartModalProps {
  onStartGame: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({ onStartGame }) => {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/92 backdrop-blur-md flex flex-col justify-between items-center p-6 text-white text-center overflow-y-auto">
      {/* Top Catchphrase */}
      <div className="pt-4 sm:pt-6 w-full max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs tracking-widest font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> HOTARU
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif-title font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-emerald-300 leading-snug drop-shadow-sm">
          蛍の光で、
          <br />
          政策と地域を照らそう！
        </h1>
      </div>

      {/* Center Face Portrait */}
      <div className="my-auto py-4 flex flex-col items-center">
        <div className="relative group">
          {/* Bioluminescent soft glow halo behind face */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-yellow-400/30 via-emerald-400/20 to-sky-400/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />

          {/* Portrait Image */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-yellow-300/60 shadow-2xl shadow-yellow-500/25 ring-8 ring-white/10 bg-slate-900">
            <img
              src="/assets/aistudio/hotaru_82a5c69b.jpg"
              alt="蛍の光で、政策と地域を照らそう！"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top scale-105"
            />
          </div>
        </div>
      </div>

      {/* Bottom Game Start Button */}
      <div className="pb-4 w-full max-w-xs">
        <button
          onClick={onStartGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 text-slate-950 font-bold text-lg shadow-xl shadow-yellow-500/25 hover:shadow-yellow-500/40 active:scale-[0.98] transition flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>ゲームスタート</span>
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-2.5 font-mono">
          ※ 音声（BGM・効果音）が出ます
        </p>
      </div>
    </div>
  );
};
