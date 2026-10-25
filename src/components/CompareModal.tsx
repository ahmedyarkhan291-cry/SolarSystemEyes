/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Scale Comparison Modal.
 * Side-by-side relative scale and volume comparison between celestial bodies.
 */

import React, { useState } from 'react';
import { X, Scale, ArrowRightLeft } from 'lucide-react';
import { CELESTIAL_LIST, CELESTIAL_BODIES, CelestialBody } from '../data/celestialBodies';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBodyId: string;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  initialBodyId
}) => {
  const [bodyAId, setBodyAId] = useState<string>(initialBodyId);
  const [bodyBId, setBodyBId] = useState<string>('earth');

  if (!isOpen) return null;

  const bodyA = CELESTIAL_BODIES[bodyAId] || CELESTIAL_BODIES['jupiter'];
  const bodyB = CELESTIAL_BODIES[bodyBId] || CELESTIAL_BODIES['earth'];

  // Calculate size ratios
  const radiusRatio = bodyA.radiusKm / (bodyB.radiusKm || 1);
  const volumeRatio = Math.pow(radiusRatio, 3);
  const gravityRatio = bodyA.gravityMps2 / (bodyB.gravityMps2 || 1);

  // Scaled pixel sizes for visual comparison circles (max radius 120px)
  const maxRadius = Math.max(bodyA.radiusKm, bodyB.radiusKm);
  const pixelRadiusA = Math.max(16, (bodyA.radiusKm / maxRadius) * 110);
  const pixelRadiusB = Math.max(16, (bodyB.radiusKm / maxRadius) * 110);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-950 border border-sky-900/60 rounded-2xl shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide font-tech uppercase">
              Scale & Physical Comparison
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Pickers */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div>
            <label className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">
              Body A
            </label>
            <select
              value={bodyAId}
              onChange={(e) => setBodyAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {CELESTIAL_LIST.filter(b => b.radiusKm > 0).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">
              Body B
            </label>
            <select
              value={bodyBId}
              onChange={(e) => setBodyBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {CELESTIAL_LIST.filter(b => b.radiusKm > 0).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Relative Scale Spheres */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 flex items-center justify-around min-h-[220px]">
          {/* Sphere A */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-full shadow-lg transition-all flex items-center justify-center font-bold text-xs"
              style={{
                width: `${pixelRadiusA * 2}px`,
                height: `${pixelRadiusA * 2}px`,
                backgroundColor: bodyA.baseColor,
                boxShadow: `0 0 25px ${bodyA.baseColor}44`
              }}
            />
            <span className="font-semibold text-xs text-white mt-1">{bodyA.name}</span>
            <span className="font-mono-num text-[11px] text-slate-400">{bodyA.radiusKm.toLocaleString()} km</span>
          </div>

          <div className="text-slate-600 font-mono text-sm font-bold">VS</div>

          {/* Sphere B */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-full shadow-lg transition-all flex items-center justify-center font-bold text-xs"
              style={{
                width: `${pixelRadiusB * 2}px`,
                height: `${pixelRadiusB * 2}px`,
                backgroundColor: bodyB.baseColor,
                boxShadow: `0 0 25px ${bodyB.baseColor}44`
              }}
            />
            <span className="font-semibold text-xs text-white mt-1">{bodyB.name}</span>
            <span className="font-mono-num text-[11px] text-slate-400">{bodyB.radiusKm.toLocaleString()} km</span>
          </div>
        </div>

        {/* Comparison Metrics Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 font-mono-num text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">Diameter Ratio</span>
            <span className="text-sky-300 font-bold text-sm">{radiusRatio.toFixed(2)}x</span>
            <span className="text-[10px] text-slate-500 block">Relative size</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">Volume Ratio</span>
            <span className="text-amber-300 font-bold text-sm">
              {volumeRatio > 1000 ? volumeRatio.toExponential(2) : volumeRatio.toFixed(1)}x
            </span>
            <span className="text-[10px] text-slate-500 block">Bodies fit inside</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider block mb-1">Surface Gravity</span>
            <span className="text-emerald-300 font-bold text-sm">{gravityRatio.toFixed(2)}x</span>
            <span className="text-[10px] text-slate-500 block">Relative weight</span>
          </div>
        </div>
      </div>
    </div>
  );
};
