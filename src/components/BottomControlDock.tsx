/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Bottom Control Dock.
 * Direct visual parity with NASA Eyes:
 * - Left: Glowing green • LIVE badge
 * - Center: Date (OCT 22, 2026), Rate (REAL RATE), Time (08:08:49 PM)
 * - Directly beneath: Interactive timeline scrubber with circular green thumb
 * - Expandable drawer for quick planet carousel, speed multipliers & historic epochs
 */

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FastForward,
  Rewind,
  Sparkles,
  Ruler,
  Scale
} from 'lucide-react';
import { CELESTIAL_LIST, CelestialBody } from '../data/celestialBodies';
import { SceneOptions } from '../render/SolarSystemScene';

interface BottomControlDockProps {
  currentDate: Date;
  onSetDate: (date: Date) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  timeMultiplier: number;
  onSetTimeMultiplier: (multiplier: number) => void;
  selectedBodyId: string;
  onSelectBody: (bodyId: string) => void;
  options: SceneOptions;
  onOptionsChange: (newOptions: Partial<SceneOptions>) => void;
  onOpenMeasure: () => void;
  onOpenCompare: () => void;
  onOpenTours: () => void;
}

const SPEED_PRESETS = [
  { label: 'Real Rate', value: 1 },
  { label: '100x', value: 100 },
  { label: '1 Day/s', value: 86400 },
  { label: '10 Days/s', value: 864000 },
  { label: '30 Days/s', value: 2592000 },
  { label: '1 Year/s', value: 31536000 },
];

const HISTORIC_BOOKMARKS = [
  { label: '1977 Voyager Launch', dateStr: '1977-09-05T00:00:00Z' },
  { label: '2015 Pluto Flyby', dateStr: '2015-07-14T11:49:00Z' },
  { label: '2026 Today', dateStr: '2026-10-22T08:08:49Z' },
  { label: '2049 Jupiter Alignment', dateStr: '2049-12-30T23:59:59Z' },
  { label: '2061 Halley Return', dateStr: '2061-07-28T12:00:00Z' },
];

const MIN_DATE_MS = new Date('1970-01-01T00:00:00Z').getTime();
const MAX_DATE_MS = new Date('2070-01-01T00:00:00Z').getTime();

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  currentDate,
  onSetDate,
  isPaused,
  onTogglePause,
  timeMultiplier,
  onSetTimeMultiplier,
  selectedBodyId,
  onSelectBody,
  options,
  onOptionsChange,
  onOpenMeasure,
  onOpenCompare,
  onOpenTours,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const currentMs = currentDate.getTime();
  const rawProgress = Math.min(
    Math.max((currentMs - MIN_DATE_MS) / (MAX_DATE_MS - MIN_DATE_MS), 0),
    1
  );

  const activeProgress = isDragging ? dragProgress : rawProgress;

  const handleSliderDown = () => {
    setIsDragging(true);
    setDragProgress(rawProgress);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setDragProgress(fraction);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const newMs = MIN_DATE_MS + fraction * (MAX_DATE_MS - MIN_DATE_MS);
      onSetDate(new Date(newMs));
    });
  };

  const handleSliderUp = () => {
    setIsDragging(false);
    const newMs = MIN_DATE_MS + dragProgress * (MAX_DATE_MS - MIN_DATE_MS);
    onSetDate(new Date(newMs));
  };

  const stepDateDays = (days: number) => {
    const newDate = new Date(currentDate.getTime() + days * 86400000);
    onSetDate(newDate);
  };

  const handleJumpToNow = () => {
    onSetDate(new Date());
    onSetTimeMultiplier(1);
    if (isPaused) onTogglePause();
  };

  // Format Date: "OCT 22, 2026"
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase();

  // Format Time: "08:08:49 PM"
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Rate label
  let rateLabel = 'REAL RATE';
  if (isPaused) {
    rateLabel = 'PAUSED';
  } else if (Math.abs(timeMultiplier) === 1) {
    rateLabel = timeMultiplier < 0 ? 'REAL RATE (REV)' : 'REAL RATE';
  } else if (Math.abs(timeMultiplier) === 86400) {
    rateLabel = timeMultiplier < 0 ? '-1 DAY/S' : '1 DAY/S';
  } else if (Math.abs(timeMultiplier) === 864000) {
    rateLabel = timeMultiplier < 0 ? '-10 DAYS/S' : '10 DAYS/S';
  } else if (Math.abs(timeMultiplier) === 31536000) {
    rateLabel = timeMultiplier < 0 ? '-1 YR/S' : '1 YR/S';
  } else {
    rateLabel = `${timeMultiplier > 0 ? '' : '-'}${Math.abs(timeMultiplier).toLocaleString()}X`;
  }

  const cycleRate = () => {
    if (isPaused) {
      onTogglePause();
      onSetTimeMultiplier(1);
    } else if (timeMultiplier === 1) {
      onSetTimeMultiplier(86400); // 1 day/s
    } else if (timeMultiplier === 86400) {
      onSetTimeMultiplier(864000); // 10 days/s
    } else if (timeMultiplier === 864000) {
      onTogglePause();
    } else {
      onSetTimeMultiplier(1);
    }
  };

  const stopProp = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-4 sm:pb-6 flex flex-col items-center"
      onPointerDown={stopProp}
      onPointerMove={stopProp}
      onPointerUp={stopProp}
      onMouseDown={stopProp}
      onMouseMove={stopProp}
      onMouseUp={stopProp}
      onWheel={stopProp}
    >
      {/* Expanded Tools / Epochs Drawer */}
      {isExpanded && (
        <div className="pointer-events-auto mb-3 w-[92vw] max-w-2xl bg-slate-950/95 border border-sky-900/60 rounded-2xl shadow-2xl p-4 backdrop-blur-2xl text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-mono text-xs uppercase tracking-wider text-sky-400 font-semibold">
              Simulation Controls & Celestial Fleet
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Epoch Bookmarks */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-sky-400" />
              Epochs:
            </span>
            {HISTORIC_BOOKMARKS.map((bm, idx) => (
              <button
                key={idx}
                onClick={() => onSetDate(new Date(bm.dateStr))}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 font-mono text-[10px] whitespace-nowrap cursor-pointer transition-colors"
              >
                {bm.label}
              </button>
            ))}
          </div>

          {/* Speed Presets */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTogglePause}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>

              <button
                onClick={() => onSetTimeMultiplier(timeMultiplier * -1)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Reverse Time Flow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {SPEED_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSetTimeMultiplier(preset.value);
                    if (isPaused) onTogglePause();
                  }}
                  className={`px-2 py-1 rounded-md font-mono text-[10px] border transition-colors cursor-pointer ${
                    timeMultiplier === preset.value && !isPaused
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Planetary Fleet Carousel */}
          <div className="pt-1 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5">
              Quick Focus Jump
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {CELESTIAL_LIST.slice(0, 10).map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBody(b.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition-all cursor-pointer ${
                    selectedBodyId === b.id
                      ? 'bg-sky-500/30 border-sky-400 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: b.baseColor }}
                  />
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom HUD Bar (Matches Reference Screenshot) */}
      <div className="w-full px-6 sm:px-12 flex items-center justify-between">
        {/* Left: • LIVE Green Badge */}
        <button
          onClick={handleJumpToNow}
          className="pointer-events-auto flex items-center gap-2 group cursor-pointer select-none"
          title="Click to jump to live real-time"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
          <span className="text-emerald-400 font-bold text-sm tracking-[0.16em] uppercase drop-shadow-[0_0_12px_rgba(34,197,94,0.6)] group-hover:text-emerald-300">
            LIVE
          </span>
        </button>

        {/* Center: Date, Rate & Time */}
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-8 font-mono text-xs sm:text-sm select-none">
          <span className="text-slate-200 tracking-wider font-semibold">
            {formattedDate}
          </span>

          <button
            onClick={cycleRate}
            className="text-emerald-400 font-bold tracking-[0.15em] uppercase hover:text-emerald-300 cursor-pointer drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-colors"
            title="Click to toggle simulation rate"
          >
            {rateLabel}
          </button>

          <span className="text-slate-300 tracking-wider">
            {formattedTime}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="Toggle extra controls & key epochs"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Right placeholder to keep center balanced */}
        <div className="w-16 hidden sm:block" />
      </div>

      {/* Sleek, Smooth Scrubber Slider Track (Directly Beneath Time Readout) */}
      <div className="w-[92vw] max-w-3xl mt-2 pointer-events-auto select-none px-4 flex items-center gap-2 sm:gap-3">
        {/* Step 1 Day Back Button */}
        <button
          onClick={() => stepDateDays(-1)}
          className="text-slate-400 hover:text-emerald-400 p-1 rounded-full transition-colors cursor-pointer"
          title="Step 1 day backward"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1 flex items-center h-4">
          {/* Subtle background track */}
          <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
            {/* Glowing active fill up to current date */}
            <div
              className="h-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"
              style={{ width: `${activeProgress * 100}%` }}
            />
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.0001"
            value={activeProgress}
            onMouseDown={handleSliderDown}
            onTouchStart={handleSliderDown}
            onChange={handleSliderChange}
            onMouseUp={handleSliderUp}
            onTouchEnd={handleSliderUp}
            className="w-full h-4 opacity-0 z-10 cursor-pointer"
          />

          {/* Glowing Circular Scrubber Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_10px_#22c55e] pointer-events-none transition-transform active:scale-125"
            style={{ left: `${activeProgress * 100}%` }}
          />
        </div>

        {/* Step 1 Day Forward Button */}
        <button
          onClick={() => stepDateDays(1)}
          className="text-slate-400 hover:text-emerald-400 p-1 rounded-full transition-colors cursor-pointer"
          title="Step 1 day forward"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
