/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System - Interactive 3D Simulator.
 * Complete feature parity with NASA's real-time WebGL application.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SolarSystemScene,
  SceneOptions
} from './render/SolarSystemScene';
import {
  CELESTIAL_BODIES,
  CelestialBody
} from './data/celestialBodies';
import { spaceAudio } from './audio/spaceAudio';
import { HUDHeader } from './components/HUDHeader';
import { TelemetryInfoPanel } from './components/TelemetryInfoPanel';
import { BottomControlDock } from './components/BottomControlDock';
import { MeasurementModal } from './components/MeasurementModal';
import { CompareModal } from './components/CompareModal';
import { ToursModal } from './components/ToursModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SolarSystemScene | null>(null);

  // Parse initial state from NASA Eyes URL hash format: #/<bodyId>?rate=<val>&time=<isoString>
  const parseInitialHash = () => {
    let initialBodyId = 'sun';
    let initialDate = new Date();
    let initialRate = 1;
    let initialPaused = false;

    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        const parts = hash.substring(2).split('?');
        const targetSlug = parts[0]?.toLowerCase().trim();
        if (targetSlug && CELESTIAL_BODIES[targetSlug]) {
          initialBodyId = targetSlug;
        }

        if (parts[1]) {
          const params = new URLSearchParams(parts[1]);
          const rateParam = params.get('rate');
          if (rateParam !== null) {
            const parsedRate = parseFloat(rateParam);
            if (parsedRate === 0) {
              initialPaused = true;
            } else if (!isNaN(parsedRate)) {
              initialRate = parsedRate;
            }
          }

          const timeParam = params.get('time');
          if (timeParam) {
            const parsedDate = new Date(timeParam);
            if (!isNaN(parsedDate.getTime())) {
              initialDate = parsedDate;
            }
          }
        }
      }
    } catch {
      // Fallback to defaults
    }

    return { initialBodyId, initialDate, initialRate, initialPaused };
  };

  const initial = parseInitialHash();

  const [selectedBodyId, setSelectedBodyId] = useState<string>(initial.initialBodyId);
  const [currentDate, setCurrentDate] = useState<Date>(initial.initialDate);
  const [isPaused, setIsPaused] = useState<boolean>(initial.initialPaused);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(initial.initialRate);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);

  // Modals state
  const [isMeasureOpen, setIsMeasureOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isToursOpen, setIsToursOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Scene visual layer options - starts at true 1:1 scale
  const [sceneOptions, setSceneOptions] = useState<SceneOptions>({
    scaleMode: 'true',
    showOrbits: true,
    showLabels: true,
    showEclipticGrid: false,
    showAsteroidBelt: true,
    showKuiperBelt: true,
    showHabitableZone: false,
    highContrastOrbits: false,
    interiorCutaway: false,
    showConstellations: false,
    showPhysicsVectors: true,
    cameraMode: 'orbit',
  });

  const selectedBody = CELESTIAL_BODIES[selectedBodyId] || CELESTIAL_BODIES['earth'];

  // Sync state to URL hash
  const updateUrlHash = useCallback((bodyId: string, date: Date, paused: boolean, rate: number) => {
    try {
      const rateVal = paused ? 0 : rate;
      const isoTime = date.toISOString();
      const newHash = `#/${bodyId}?rate=${rateVal}&time=${isoTime}`;
      window.history.replaceState(null, '', newHash);
    } catch {
      // ignore
    }
  }, []);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new SolarSystemScene(
      canvasMountRef.current,
      sceneOptions,
      (body) => {
        setSelectedBodyId(body.id);
        spaceAudio.playTelemetryPing();
      }
    );

    sceneRef.current = scene;

    // Apply initial date & rate
    scene.setTime(initial.initialDate);
    scene.setIsPaused(initial.initialPaused);
    scene.setTimeMultiplier(initial.initialRate);
    if (initial.initialBodyId && initial.initialBodyId !== 'sun' && initial.initialBodyId !== 'overview') {
      scene.focusOnBody(initial.initialBodyId, true);
    } else {
      scene.setOverviewCamera(true);
    }

    // Sync clock state periodically
    const clockInterval = setInterval(() => {
      if (sceneRef.current) {
        const d = sceneRef.current.getCurrentDate();
        setCurrentDate(new Date(d.getTime()));
      }
    }, 100);

    return () => {
      clearInterval(clockInterval);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Handle layer/options change
  const handleOptionsChange = (newOptions: Partial<SceneOptions>) => {
    setSceneOptions((prev) => {
      const updated = { ...prev, ...newOptions };
      sceneRef.current?.setOptions(updated);
      return updated;
    });
  };

  // Select a body
  const handleSelectBody = (bodyId: string) => {
    if (!CELESTIAL_BODIES[bodyId]) return;
    setSelectedBodyId(bodyId);
    sceneRef.current?.focusOnBody(bodyId);
    spaceAudio.playTelemetryPing();
    updateUrlHash(bodyId, currentDate, isPaused, timeMultiplier);
  };

  // Date scrubbing
  const handleSetDate = (date: Date) => {
    setCurrentDate(date);
    sceneRef.current?.setTime(date);
    spaceAudio.playWarpEffect();
    updateUrlHash(selectedBodyId, date, isPaused, timeMultiplier);
  };

  // Play / Pause toggle
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    sceneRef.current?.setIsPaused(nextPaused);
    updateUrlHash(selectedBodyId, currentDate, nextPaused, timeMultiplier);
  };

  // Time rate multiplier change
  const handleSetTimeMultiplier = (multiplier: number) => {
    setTimeMultiplier(multiplier);
    sceneRef.current?.setTimeMultiplier(multiplier);
    spaceAudio.playWarpEffect();
    updateUrlHash(selectedBodyId, currentDate, isPaused, multiplier);
  };

  // Audio mute toggle
  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    spaceAudio.setMuted(nextMuted);
    if (!nextMuted) {
      spaceAudio.playTelemetryPing();
    }
  };

  // Navigate to tour stop
  const handleNavigateToTourStop = (bodyId: string, dateStr: string) => {
    const date = new Date(dateStr);
    handleSelectBody(bodyId);
    if (!isNaN(date.getTime())) {
      handleSetDate(date);
    }
  };

  // 3D Measurement line updates
  const handleUpdate3DMeasurement = (bodyIdA: string, bodyIdB: string) => {
    sceneRef.current?.updateMeasurement(bodyIdA, bodyIdB);
  };

  const handleClear3DMeasurement = () => {
    sceneRef.current?.clearMeasurement();
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsHudVisible(prev => !prev);
      } else if (e.key === 'o' || e.key === 'O') {
        handleOptionsChange({ showOrbits: !sceneOptions.showOrbits });
      } else if (e.key === 'g' || e.key === 'G') {
        handleOptionsChange({ showEclipticGrid: !sceneOptions.showEclipticGrid });
      } else if (e.key === 'k' || e.key === 'K') {
        handleOptionsChange({ showConstellations: !sceneOptions.showConstellations });
      } else if (e.key === 'v' || e.key === 'V') {
        const nextMode = sceneOptions.cameraMode === 'orbit' ? 'rideAlong' : sceneOptions.cameraMode === 'rideAlong' ? 'surface' : 'orbit';
        handleOptionsChange({ cameraMode: nextMode });
      } else if (e.key === '1') {
        sceneRef.current?.setCameraPreset('daySide');
      } else if (e.key === '2') {
        sceneRef.current?.setCameraPreset('terminator');
      } else if (e.key === '3') {
        sceneRef.current?.setCameraPreset('nightSide');
      } else if (e.key === '4') {
        sceneRef.current?.setCameraPreset('northPole');
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMeasureOpen(prev => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCompareOpen(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setIsToursOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsMeasureOpen(false);
        setIsCompareOpen(false);
        setIsToursOpen(false);
        setIsHelpOpen(false);
        setIsInfoPanelOpen(false);
        handleClear3DMeasurement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, currentDate, selectedBodyId, timeMultiplier, sceneOptions]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated WebGL Canvas Mount Container (Zero React interference with render loop) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Primary HUD Controls (Toggled via 'H' key) */}
      <div className={`transition-opacity duration-300 ${isHudVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Top HUD Navigation & Status Header */}
        <HUDHeader
          currentDate={currentDate}
          selectedBody={selectedBody}
          options={sceneOptions}
          onOptionsChange={handleOptionsChange}
          onSelectBody={handleSelectBody}
          onSetCameraPreset={(preset) => sceneRef.current?.setCameraPreset(preset)}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenTours={() => setIsToursOpen(true)}
          onOpenMeasure={() => setIsMeasureOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          onToggleInfoPanel={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
          isInfoPanelOpen={isInfoPanelOpen}
          onZoomIn={() => sceneRef.current?.zoomIn()}
          onZoomOut={() => sceneRef.current?.zoomOut()}
        />

        {/* Minimalist Transparent Celestial Info Box */}
        <TelemetryInfoPanel
          body={selectedBody}
          currentDate={currentDate}
          isOpen={isInfoPanelOpen}
          onClose={() => setIsInfoPanelOpen(false)}
          onSelectBody={handleSelectBody}
        />

        {/* Ergonomic Collapsible Bottom Dock (Zero Viewport Occlusion) */}
        <BottomControlDock
          currentDate={currentDate}
          onSetDate={handleSetDate}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          timeMultiplier={timeMultiplier}
          onSetTimeMultiplier={handleSetTimeMultiplier}
          selectedBodyId={selectedBodyId}
          onSelectBody={handleSelectBody}
          options={sceneOptions}
          onOptionsChange={handleOptionsChange}
          onOpenMeasure={() => setIsMeasureOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          onOpenTours={() => setIsToursOpen(true)}
        />
      </div>

      {!isHudVisible && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono text-white/70 pointer-events-none animate-pulse">
          Controls Hidden · Press H to restore HUD
        </div>
      )}

      {/* Interplanetary Distance Measurement Tool Modal */}
      <MeasurementModal
        isOpen={isMeasureOpen}
        onClose={() => setIsMeasureOpen(false)}
        currentDate={currentDate}
        onUpdate3DLine={handleUpdate3DMeasurement}
        onClear3DLine={handleClear3DMeasurement}
      />

      {/* Side-by-Side Scale Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialBodyId={selectedBodyId}
      />

      {/* Guided Space Expeditions / Story Tours Modal */}
      <ToursModal
        isOpen={isToursOpen}
        onClose={() => setIsToursOpen(false)}
        onNavigateToTourStop={handleNavigateToTourStop}
      />

      {/* Keyboard Shortcuts & Help Modal */}
      <ShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
