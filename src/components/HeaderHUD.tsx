import React from 'react';
import { Volume2, VolumeX, Sparkles, Users, Zap, Clock } from 'lucide-react';

interface HeaderHUDProps {
  timeRemaining: number;
  totalLux: number;
  companionCount: number;
  burstChargeRatio: number;
  isBurstReady: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerBurst: () => void;
  districtName: string;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  timeRemaining,
  totalLux,
  companionCount,
  burstChargeRatio,
  isBurstReady,
  isMuted,
  onToggleMute,
  onTriggerBurst,
  districtName,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 inset-x-0 p-3 pointer-events-none z-20 flex flex-col gap-2">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white/90">
        {/* District and Time */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-mono text-sm font-bold tracking-wider text-yellow-300">
              {formatTime(timeRemaining)}
            </span>
          </div>
          {districtName && (
            <div className="hidden sm:flex bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs text-slate-300">
              {districtName}
            </div>
          )}
        </div>

        {/* Lux Meter & Mute button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30 flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono text-sm font-bold text-amber-300 tracking-wide">
              {totalLux.toLocaleString()} <span className="text-[10px] text-amber-200/80 font-normal">Lux</span>
            </span>
          </div>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
            title="音量切替"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Sub Bar: Companions and Burst meter */}
      <div className="flex items-center justify-between text-xs text-white/80">
        <div className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/20">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono font-medium text-emerald-300">仲間: {companionCount}匹</span>
        </div>

        {/* Luminescence Burst quick button / status */}
        <button
          onClick={onTriggerBurst}
          className={`pointer-events-auto px-3 py-1 rounded-full border flex items-center gap-1.5 font-sans-ui text-xs font-semibold transition active:scale-95 shadow-md ${
            isBurstReady || burstChargeRatio >= 0.5
              ? 'bg-gradient-to-r from-yellow-500 to-emerald-500 text-slate-950 border-white/40 shadow-emerald-500/30 animate-pulse'
              : 'bg-slate-900/70 border-white/10 text-slate-300 hover:border-yellow-400/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>集光バースト</span>
          <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden ml-0.5">
            <div
              className="h-full bg-yellow-400 transition-all duration-75"
              style={{ width: `${Math.round(burstChargeRatio * 100)}%` }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
