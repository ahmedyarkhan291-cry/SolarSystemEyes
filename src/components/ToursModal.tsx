/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Interactive Guided Story Tours.
 * Multi-chapter narrated flybys with automated camera waypoints and historic epochs.
 */

import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Play, RotateCcw } from 'lucide-react';
import { GUIDED_TOURS, CELESTIAL_BODIES } from '../data/celestialBodies';

interface ToursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTourStop: (bodyId: string, dateStr: string) => void;
}

export const ToursModal: React.FC<ToursModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTourStop
}) => {
  const [selectedTourIndex, setSelectedTourIndex] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  if (!isOpen) return null;

  const currentTour = GUIDED_TOURS[selectedTourIndex];
  const currentStop = currentTour.stops[currentStopIndex];
  const targetBody = CELESTIAL_BODIES[currentStop.bodyId];

  const handleSelectTour = (idx: number) => {
    setSelectedTourIndex(idx);
    setCurrentStopIndex(0);
    const stop = GUIDED_TOURS[idx].stops[0];
    onNavigateToTourStop(stop.bodyId, stop.date);
  };

  const handleNextStop = () => {
    if (currentStopIndex < currentTour.stops.length - 1) {
      const nextIdx = currentStopIndex + 1;
      setCurrentStopIndex(nextIdx);
      const nextStop = currentTour.stops[nextIdx];
      onNavigateToTourStop(nextStop.bodyId, nextStop.date);
    }
  };

  const handlePrevStop = () => {
    if (currentStopIndex > 0) {
      const prevIdx = currentStopIndex - 1;
      setCurrentStopIndex(prevIdx);
      const prevStop = currentTour.stops[prevIdx];
      onNavigateToTourStop(prevStop.bodyId, prevStop.date);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-950 border border-indigo-900/60 rounded-2xl shadow-2xl p-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-wide font-tech uppercase">
              NASA Guided Space Expeditions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tour Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4">
          {GUIDED_TOURS.map((tour, idx) => (
            <button
              key={tour.id}
              onClick={() => handleSelectTour(idx)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTourIndex === idx
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-xs block text-white">{tour.title}</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tour.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Active Tour Stop Content Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono-num text-[10px] font-bold">
                STOP {currentStopIndex + 1} OF {currentTour.stops.length}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {targetBody?.displayName || currentStop.bodyId}
              </span>
            </div>
            <span className="text-xs font-mono-num text-amber-300 font-semibold">
              EPOCH: {currentStop.date}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed min-h-[64px]">
            {currentStop.narration}
          </p>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={handlePrevStop}
              disabled={currentStopIndex === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                currentStopIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Stop</span>
            </button>

            <button
              onClick={() => onNavigateToTourStop(currentStop.bodyId, currentStop.date)}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-Focus Camera</span>
            </button>

            <button
              onClick={handleNextStop}
              disabled={currentStopIndex === currentTour.stops.length - 1}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentStopIndex === currentTour.stops.length - 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              <span>Next Stop</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
