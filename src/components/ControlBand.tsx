import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, Sparkles } from 'lucide-react';

interface ControlBandProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onFireMissileStart: () => void;
  onFireMissileEnd: () => void;
  onBurstStart: () => void;
  onBurstEnd: () => void;
  burstChargeRatio: number;
  isBurstReady: boolean;
}

export const ControlBand: React.FC<ControlBandProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onFireMissileStart,
  onFireMissileEnd,
  onBurstStart,
  onBurstEnd,
  burstChargeRatio,
  isBurstReady,
}) => {
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [missileActive, setMissileActive] = useState(false);
  const [burstActive, setBurstActive] = useState(false);

  // Keyboard controls listener
  const keysDownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      keysDownRef.current.add(key);

      if (key === 'arrowleft' || key === 'a') {
        setLeftActive(true);
        onMoveLeftStart();
      } else if (key === 'arrowright' || key === 'd') {
        setRightActive(true);
        onMoveRightStart();
      } else if (key === ' ' || key === 'z' || key === 'j') {
        setMissileActive(true);
        onFireMissileStart();
      } else if (key === 'x' || key === 'k') {
        setBurstActive(true);
        onBurstStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysDownRef.current.delete(key);

      if (key === 'arrowleft' || key === 'a') {
        setLeftActive(false);
        onMoveLeftEnd();
      } else if (key === 'arrowright' || key === 'd') {
        setRightActive(false);
        onMoveRightEnd();
      } else if (key === ' ' || key === 'z' || key === 'j') {
        setMissileActive(false);
        onFireMissileEnd();
      } else if (key === 'x' || key === 'k') {
        setBurstActive(false);
        onBurstEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    onMoveLeftStart,
    onMoveLeftEnd,
    onMoveRightStart,
    onMoveRightEnd,
    onFireMissileStart,
    onFireMissileEnd,
    onBurstStart,
    onBurstEnd,
  ]);

  return (
    <div className="w-full bg-slate-950/95 border-t border-white/10 px-3 py-2.5 flex items-center justify-between gap-2 select-none touch-none shadow-2xl backdrop-blur-md z-20">
      {/* Movement Buttons (Left / Right) */}
      <div className="flex items-center gap-2 flex-1 max-w-[180px]">
        {/* Left Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setLeftActive(true);
            onMoveLeftStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setLeftActive(false);
            onMoveLeftEnd();
          }}
          onPointerLeave={() => {
            if (leftActive) {
              setLeftActive(false);
              onMoveLeftEnd();
            }
          }}
          onPointerCancel={() => {
            if (leftActive) {
              setLeftActive(false);
              onMoveLeftEnd();
            }
          }}
          className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 border ${
            leftActive
              ? 'bg-gradient-to-b from-sky-500/40 to-sky-600/30 border-sky-400 text-sky-200 scale-95 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-white/15 text-slate-200 shadow-md active:scale-95'
          }`}
          aria-label="左へ移動"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold tracking-wider font-sans -mt-0.5">
            左 <span className="hidden sm:inline text-[9px] text-slate-400 font-mono">(A)</span>
          </span>
        </button>

        {/* Right Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setRightActive(true);
            onMoveRightStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setRightActive(false);
            onMoveRightEnd();
          }}
          onPointerLeave={() => {
            if (rightActive) {
              setRightActive(false);
              onMoveRightEnd();
            }
          }}
          onPointerCancel={() => {
            if (rightActive) {
              setRightActive(false);
              onMoveRightEnd();
            }
          }}
          className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 border ${
            rightActive
              ? 'bg-gradient-to-b from-sky-500/40 to-sky-600/30 border-sky-400 text-sky-200 scale-95 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-white/15 text-slate-200 shadow-md active:scale-95'
          }`}
          aria-label="右へ移動"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold tracking-wider font-sans -mt-0.5">
            右 <span className="hidden sm:inline text-[9px] text-slate-400 font-mono">(D)</span>
          </span>
        </button>
      </div>

      {/* Action Buttons (Missile & Burst) */}
      <div className="flex items-center gap-2 flex-1 max-w-[210px] justify-end">
        {/* Missile / Photon Shot Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setMissileActive(true);
            onFireMissileStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setMissileActive(false);
            onFireMissileEnd();
          }}
          onPointerLeave={() => {
            if (missileActive) {
              setMissileActive(false);
              onFireMissileEnd();
            }
          }}
          onPointerCancel={() => {
            if (missileActive) {
              setMissileActive(false);
              onFireMissileEnd();
            }
          }}
          className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 border ${
            missileActive
              ? 'bg-gradient-to-b from-yellow-400/40 to-amber-500/40 border-yellow-300 text-yellow-100 scale-95 shadow-[0_0_18px_rgba(250,204,21,0.6)]'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-yellow-500/30 text-yellow-300 shadow-md active:scale-95'
          }`}
          aria-label="光弾ミサイル連射"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="text-[10px] font-bold tracking-tight font-sans mt-0.5">
            ミサイル <span className="hidden sm:inline text-[9px] text-yellow-300/70 font-mono">(Space)</span>
          </span>
        </button>

        {/* Luminescence Burst Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setBurstActive(true);
            onBurstStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setBurstActive(false);
            onBurstEnd();
          }}
          onPointerLeave={() => {
            if (burstActive) {
              setBurstActive(false);
              onBurstEnd();
            }
          }}
          onPointerCancel={() => {
            if (burstActive) {
              setBurstActive(false);
              onBurstEnd();
            }
          }}
          className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 border relative overflow-hidden ${
            isBurstReady || burstChargeRatio >= 0.5
              ? 'bg-gradient-to-b from-emerald-500/40 to-lime-500/40 border-emerald-300 text-emerald-100 shadow-[0_0_18px_rgba(74,222,128,0.6)] animate-pulse'
              : burstActive
              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-emerald-500/25 text-emerald-300 shadow-md active:scale-95'
          }`}
          aria-label="集光バースト"
        >
          {/* Internal Progress fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-emerald-400/30 transition-all duration-75 pointer-events-none"
            style={{ height: `${Math.round(burstChargeRatio * 100)}%` }}
          />

          <Zap className="w-5 h-5 relative z-10 text-emerald-300" />
          <span className="text-[10px] font-bold tracking-tight font-sans relative z-10 mt-0.5">
            バースト <span className="hidden sm:inline text-[9px] text-emerald-300/70 font-mono">(X)</span>
          </span>
        </button>
      </div>
    </div>
  );
};
