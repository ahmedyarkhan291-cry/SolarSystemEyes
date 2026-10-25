/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Minimalist Transparent Celestial Info Box.
 * Focuses strictly on essential core data without clutter or blueish themes.
 * Ultra-sleek transparent frosted glass aesthetic with official NASA explore link.
 */

import React from 'react';
import { X, ExternalLink, Compass, Thermometer, Clock, Globe } from 'lucide-react';
import { CelestialBody } from '../data/celestialBodies';
import {
  dateToJulianDate,
  calculateHeliocentricPosition
} from '../engine/ephemeris';

interface TelemetryInfoPanelProps {
  body: CelestialBody;
  currentDate: Date;
  isOpen: boolean;
  onClose: () => void;
  onSelectBody?: (bodyId: string) => void;
}

export const TelemetryInfoPanel: React.FC<TelemetryInfoPanelProps> = ({
  body,
  currentDate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const jd = dateToJulianDate(currentDate);
  const liveHelioPos = calculateHeliocentricPosition(body.orbit, jd);

  const formatRotation = (hours: number) => {
    const absH = Math.abs(hours);
    if (absH === 0) return 'Synchronous';
    if (absH > 24) {
      return `${(absH / 24).toFixed(1)} Earth days`;
    }
    return `${absH.toFixed(1)} hours`;
  };

  return (
    <div className="absolute top-16 left-3 sm:left-6 z-30 w-[90vw] sm:w-[380px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white p-5 animate-in fade-in duration-200 select-none">
      
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase block">
            {body.category} · {body.type.replace('_', ' ')}
          </span>
          <h2 className="text-2xl font-light tracking-wide text-white mt-0.5">
            {body.displayName}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Core Summary */}
      <p className="text-xs text-slate-300 leading-relaxed font-normal my-3.5">
        {body.summary}
      </p>

      {/* Main Essential Stats Only */}
      <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-white/10 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>Sun Distance</span>
          </div>
          <span className="text-sm font-medium text-white block">
            {body.type === 'star' ? '0.00 AU' : `${liveHelioPos.distanceAU.toFixed(2)} AU`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>Mean Radius</span>
          </div>
          <span className="text-sm font-medium text-white block">
            {body.radiusKm.toLocaleString()} km
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Day Length</span>
          </div>
          <span className="text-sm font-medium text-white block truncate">
            {formatRotation(body.rotationPeriodHours)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">
            <Thermometer className="w-3 h-3 text-slate-400" />
            <span>Surface Temp</span>
          </div>
          <span className="text-sm font-medium text-white block">
            {body.meanTempC}°C
          </span>
        </div>
      </div>

      {/* Link to find out more on NASA's official website */}
      <a
        href={body.nasaCitationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3.5 w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer group"
      >
        <span>Explore Further on NASA.gov</span>
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
      </a>
    </div>
  );
};
