/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { soundManager } from './audio/soundManager';
import { HeaderHUD } from './components/HeaderHUD';
import { ControlBand } from './components/ControlBand';
import { StartModal } from './components/StartModal';
import { EndingModal } from './components/EndingModal';
import { GameLog, LandmarkData } from './types/game';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'ending'>('start');
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [totalLux, setTotalLux] = useState<number>(0);
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [burstChargeRatio, setBurstChargeRatio] = useState<number>(0);
  const [isBurstReady, setIsBurstReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [districtName, setDistrictName] = useState<string>('');

  const [gameLog, setGameLog] = useState<GameLog | null>(null);
  const [rawLandmarks, setRawLandmarks] = useState<LandmarkData[]>([]);

  // Initialize engine once canvas mounts
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onTimeUpdate: (sec) => setTimeRemaining(sec),
      onLuxUpdate: (lux) => setTotalLux(lux),
      onCompanionsUpdate: (count) => setCompanionCount(count),
      onLandmarkLit: (_landmark) => {
        // Updated through engine
      },
      onBurstChargeUpdate: (ratio, ready) => {
        setBurstChargeRatio(ratio);
        setIsBurstReady(ready);
      },
      onGameOver: (log) => {
        setGameLog(log);
        if (engineRef.current) {
          setRawLandmarks(engineRef.current.getRawLandmarks());
        }
        setGameState('ending');
      },
    });

    engineRef.current = engine;

    const handleResize = () => {
      engine.resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, []);

  const handleStartGame = () => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.start();
      setDistrictName(engineRef.current.districtName || '');
    }
    setGameState('playing');
  };

  const handlePlayAgain = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setDistrictName(engineRef.current.districtName || '');
    }
    setGameState('playing');
  };

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTriggerBurst = useCallback(() => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.triggerBurst();
    }
  }, [gameState]);

  // Touch and pointer handlers for the canvas direct touch
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || !engineRef.current) return;
    engineRef.current.handlePointerDown(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || !engineRef.current) return;
    engineRef.current.handlePointerMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || !engineRef.current) return;
    engineRef.current.handlePointerUp();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 select-none touch-none">
      {/* Smartphone Frame Container */}
      <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[860px] sm:max-h-[92vh] bg-slate-900 sm:rounded-[36px] overflow-hidden shadow-2xl sm:border sm:border-white/10 flex flex-col justify-between">
        {/* In-game Top HUD */}
        {gameState === 'playing' && (
          <HeaderHUD
            timeRemaining={timeRemaining}
            totalLux={totalLux}
            companionCount={companionCount}
            burstChargeRatio={burstChargeRatio}
            isBurstReady={isBurstReady}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onTriggerBurst={handleTriggerBurst}
            districtName={districtName}
          />
        )}

        {/* Main Game Viewport Canvas */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full cursor-crosshair block touch-none"
          />
        </div>

        {/* Dedicated Bottom Control Band */}
        {gameState === 'playing' && (
          <ControlBand
            onMoveLeftStart={() => engineRef.current?.setMovingLeft(true)}
            onMoveLeftEnd={() => engineRef.current?.setMovingLeft(false)}
            onMoveRightStart={() => engineRef.current?.setMovingRight(true)}
            onMoveRightEnd={() => engineRef.current?.setMovingRight(false)}
            onFireMissileStart={() => engineRef.current?.setManualShooting(true)}
            onFireMissileEnd={() => engineRef.current?.setManualShooting(false)}
            onBurstStart={() => engineRef.current?.startChargingBurst()}
            onBurstEnd={() => engineRef.current?.releaseBurst()}
            burstChargeRatio={burstChargeRatio}
            isBurstReady={isBurstReady}
          />
        )}

        {/* Start Screen Modal */}
        {gameState === 'start' && <StartModal onStartGame={handleStartGame} />}

        {/* Ending Screen Modal */}
        {gameState === 'ending' && gameLog && (
          <EndingModal
            gameLog={gameLog}
            rawLandmarks={rawLandmarks}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  );
}
