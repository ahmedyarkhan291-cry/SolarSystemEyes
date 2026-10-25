/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Keyboard shortcuts and navigational guide modal.
 */

import React from 'react';
import { X, HelpCircle, Keyboard, MousePointer } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause simulation time playback' },
  { key: 'H', desc: 'Hide / Show all HUD controls (Full Cinematic Mode)' },
  { key: 'V', desc: 'Cycle Camera Mode (Orbit -> Ride-Along Chase -> Surface)' },
  { key: '1 - 4', desc: 'Camera Presets (1: Day Side, 2: Terminator, 3: Night Side, 4: North Pole)' },
  { key: 'K', desc: 'Toggle 88-Constellation vector lines' },
  { key: 'O', desc: 'Toggle orbital trajectories overlay' },
  { key: 'G', desc: 'Toggle ecliptic AU coordinate grid' },
  { key: 'M', desc: 'Open Interplanetary Distance Measurement Tool' },
  { key: 'C', desc: 'Open Planetary Scale Comparison Tool' },
  { key: 'T', desc: 'Open Guided Space Expeditions / Tours' },
  { key: 'Esc', desc: 'Close any active modal dialog' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-950 border border-sky-900/60 rounded-2xl shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white tracking-wide font-tech uppercase">
              Controls & Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mouse navigation guide */}
        <div className="my-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
          <div className="font-tech text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <MousePointer className="w-3.5 h-3.5" />
            <span>3D Camera Interaction</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Left Click + Drag:</span>
            <span className="font-semibold text-white">Orbit around target body</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Right Click + Drag:</span>
            <span className="font-semibold text-white">Pan view</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Scroll Wheel / Pinch:</span>
            <span className="font-semibold text-white">Zoom in / Zoom out</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Click any Planet / Moon:</span>
            <span className="font-semibold text-sky-300">Smooth cinematic fly-to target</span>
          </div>
        </div>

        {/* Keyboard shortcuts table */}
        <div className="space-y-2 mt-4">
          <div className="font-tech text-sky-400 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-2">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-900/40 text-xs"
              >
                <span className="text-slate-300">{item.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono-num font-bold text-[11px]">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
