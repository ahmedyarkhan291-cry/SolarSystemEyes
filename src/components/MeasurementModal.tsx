/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Distance & Light Travel Telemetry Modal.
 * Computes exact distances, relative velocities, and light ping times
 * between any two celestial bodies or spacecraft.
 */

import React, { useState, useEffect } from 'react';
import { X, Ruler, ArrowRightLeft, Radio, Zap } from 'lucide-react';
import { CELESTIAL_LIST, CELESTIAL_BODIES, CelestialBody } from '../data/celestialBodies';
import {
  dateToJulianDate,
  calculateHeliocentricPosition,
  AU_IN_KM,
  SPEED_OF_LIGHT_KM_S
} from '../engine/ephemeris';

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onUpdate3DLine: (bodyIdA: string, bodyIdB: string) => void;
  onClear3DLine: () => void;
}

export const MeasurementModal: React.FC<MeasurementModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onUpdate3DLine,
  onClear3DLine
}) => {
  const [bodyAId, setBodyAId] = useState<string>('earth');
  const [bodyBId, setBodyBId] = useState<string>('mars');

  useEffect(() => {
    if (isOpen) {
      onUpdate3DLine(bodyAId, bodyBId);
    } else {
      onClear3DLine();
    }
  }, [isOpen, bodyAId, bodyBId, currentDate]);

  if (!isOpen) return null;

  const bodyA = CELESTIAL_BODIES[bodyAId] || CELESTIAL_BODIES['earth'];
  const bodyB = CELESTIAL_BODIES[bodyBId] || CELESTIAL_BODIES['mars'];

  const jd = dateToJulianDate(currentDate);
  const posA = calculateHeliocentricPosition(bodyA.orbit, jd);
  const posB = calculateHeliocentricPosition(bodyB.orbit, jd);

  const dxAU = posA.xAU - posB.xAU;
  const dyAU = posA.yAU - posB.yAU;
  const dzAU = posA.zAU - posB.zAU;
  const distanceAU = Math.sqrt(dxAU * dxAU + dyAU * dyAU + dzAU * dzAU);
  const distanceKm = distanceAU * AU_IN_KM;
  const distanceMiles = distanceKm * 0.621371;

  const lightTimeSeconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  const lightTimeMinutes = lightTimeSeconds / 60;
  const lightTimeHours = lightTimeMinutes / 60;

  // Format light time
  let lightTimeStr = '';
  if (lightTimeMinutes < 1) {
    lightTimeStr = `${lightTimeSeconds.toFixed(2)} seconds`;
  } else if (lightTimeMinutes < 60) {
    lightTimeStr = `${lightTimeMinutes.toFixed(2)} minutes`;
  } else {
    lightTimeStr = `${lightTimeHours.toFixed(2)} hours (${lightTimeMinutes.toFixed(0)} min)`;
  }

  // Relative orbital velocity difference
  const relativeVelocity = Math.abs(posA.orbitalSpeedKmS - posB.orbitalSpeedKmS);

  const handleSwap = () => {
    setBodyAId(bodyBId);
    setBodyBId(bodyAId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-950 border border-sky-900/60 rounded-2xl shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white tracking-wide font-tech uppercase">
              Interplanetary Distance Telemetry
            </h3>
          </div>
          <button
            onClick={() => {
              onClear3DLine();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Selector Row */}
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3 my-4">
          <div>
            <label className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">
              Origin (Body A)
            </label>
            <select
              value={bodyAId}
              onChange={(e) => setBodyAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {CELESTIAL_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-2 mt-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Swap Origin and Target"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">
              Target (Body B)
            </label>
            <select
              value={bodyBId}
              onChange={(e) => setBodyBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {CELESTIAL_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Distance Metrics Display */}
        <div className="space-y-3 font-mono-num text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Astronomical Units</span>
            <span className="text-sky-300 text-lg font-bold">{distanceAU.toFixed(4)} AU</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Distance in Kilometers</span>
            <span className="text-slate-200 font-semibold">{distanceKm.toLocaleString('en-US', { maximumFractionDigits: 0 })} km</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Distance in Miles</span>
            <span className="text-slate-200 font-semibold">{distanceMiles.toLocaleString('en-US', { maximumFractionDigits: 0 })} mi</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              One-Way Light Time (OWLT)
            </span>
            <span className="text-amber-300 font-bold">{lightTimeStr}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Round-Trip Radio Delay (RTLT)
            </span>
            <span className="text-emerald-300 font-bold">{(lightTimeMinutes * 2).toFixed(2)} min</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Differential Velocity</span>
            <span className="text-slate-300 font-semibold">{relativeVelocity.toFixed(2)} km/s</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 italic">
            * 3D laser telemetry vector is actively rendered in the scene between {bodyA.name} and {bodyB.name}.
          </p>
        </div>
      </div>
    </div>
  );
};
