/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NASA Eyes on the Solar System: Top HUD Navigation & Visual Observatory Control Deck.
 * Transparent, modern, high-contrast aesthetic with rich visual controls.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sliders,
  X,
  Layers,
  Plus,
  Minus,
  Maximize,
  Volume2,
  VolumeX,
  HelpCircle,
  Ruler,
  Scale,
  Sparkles,
  Sun,
  Moon,
  Compass,
  Grid,
  Orbit,
  Tag,
  CircleDot,
  Radio,
  ArrowRight
} from 'lucide-react';
import { CELESTIAL_LIST, CelestialBody } from '../data/celestialBodies';
import { SceneOptions, CameraPreset } from '../render/SolarSystemScene';

interface HUDHeaderProps {
  currentDate: Date;
  selectedBody: CelestialBody;
  options: SceneOptions;
  onOptionsChange: (newOptions: Partial<SceneOptions>) => void;
  onSelectBody: (bodyId: string) => void;
  onSetCameraPreset: (preset: CameraPreset) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenHelp: () => void;
  onOpenTours: () => void;
  onOpenMeasure?: () => void;
  onOpenCompare?: () => void;
  onToggleInfoPanel: () => void;
  isInfoPanelOpen: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  selectedBody,
  options,
  onOptionsChange,
  onSelectBody,
  onSetCameraPreset,
  isAudioMuted,
  onToggleAudio,
  onOpenHelp,
  onOpenTours,
  onOpenMeasure,
  onOpenCompare,
  onToggleInfoPanel,
  isInfoPanelOpen,
  onZoomIn,
  onZoomOut
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRightDeckOpen, setIsRightDeckOpen] = useState(false);
  const [activeDeckTab, setActiveDeckTab] = useState<'layers' | 'camera' | 'tools'>('layers');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredBodies = searchQuery.trim() === ''
    ? CELESTIAL_LIST.slice(0, 12)
    : CELESTIAL_LIST.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <>
      {/* 1. Top HUD Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 pointer-events-none p-4 sm:p-6 flex items-start justify-between">
        
        {/* Top-Left: Spaced Active Target Title */}
        <div className="pointer-events-auto flex flex-col items-start select-none">
          <button
            onClick={onToggleInfoPanel}
            className="group text-left cursor-pointer transition-transform active:scale-95"
            title="Click to view info"
          >
            <h1 className="text-2xl sm:text-3xl font-light tracking-[0.25em] uppercase text-white group-hover:text-sky-300 transition-colors drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              {selectedBody.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                {selectedBody.category}
              </span>
              <span className="text-[10px] text-sky-400 tracking-wider">
                · {selectedBody.type.toUpperCase()}
              </span>
            </div>
          </button>
        </div>

        {/* Top-Right: Transparent, Modern Action Buttons (Download removed as requested) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 select-none">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer backdrop-blur-md shadow-sm"
            title="Search solar system"
          >
            <Search className="w-3.5 h-3.5 text-slate-300" />
            <span>Search</span>
          </button>

          {/* Observatory Controls Deck Button */}
          <button
            onClick={() => setIsRightDeckOpen(!isRightDeckOpen)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border backdrop-blur-md shadow-sm ${
              isRightDeckOpen
                ? 'bg-white/20 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                : 'text-white/90 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
            title="Open Observatory Control Deck"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
            <span>Observatory</span>
          </button>
        </div>
      </header>

      {/* 2. NASA Eyes-Style Right Vertical Toolbar (Exact match to Screenshot 1) */}
      <aside className="absolute right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex flex-col items-center gap-2 select-none">
        
        {/* Tile 1: (i) Info Panel Toggle */}
        <button
          onClick={onToggleInfoPanel}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border shadow-lg group ${
            isInfoPanelOpen
              ? 'bg-[#2b2f36] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
              : 'bg-[#18191c]/85 hover:bg-[#25282d] text-slate-300 hover:text-white border-[#2e3136]/80'
          }`}
          title="Telemetry & Target Info (i)"
          aria-label="Toggle Information Panel"
        >
          <svg className="w-[18px] h-[18px] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2.6" />
          </svg>
        </button>

        {/* Tile 2: Layers Icon (Toggles Visual Layers tab) */}
        <button
          onClick={() => {
            if (isRightDeckOpen && activeDeckTab === 'layers') {
              setIsRightDeckOpen(false);
            } else {
              setActiveDeckTab('layers');
              setIsRightDeckOpen(true);
            }
          }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border shadow-lg group ${
            isRightDeckOpen && activeDeckTab === 'layers'
              ? 'bg-[#2b2f36] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
              : 'bg-[#18191c]/85 hover:bg-[#25282d] text-slate-300 hover:text-white border-[#2e3136]/80'
          }`}
          title="Visual Layers (Orbits, Belts, Grids, Constellations)"
          aria-label="Visual Layers"
        >
          <svg className="w-[18px] h-[18px] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" fill="currentColor" fillOpacity="0.15" />
            <polyline points="2 12 12 17 22 12" />
            <polyline points="2 17 12 22 22 17" />
          </svg>
        </button>

        {/* Tile 3: Dual Zoom Container [ + / - ] */}
        <div className="w-9 h-[76px] rounded-lg bg-[#18191c]/85 border border-[#2e3136]/80 flex flex-col items-center justify-between py-1 shadow-lg overflow-hidden">
          <button
            onClick={onZoomIn}
            className="w-full flex-1 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-5 h-[1px] bg-white/15 my-0.5" />
          <button
            onClick={onZoomOut}
            className="w-full flex-1 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Tile 4: Lighting / Moon Phase Toggle */}
        <button
          onClick={() => {
            onOptionsChange({ highContrastOrbits: !options.highContrastOrbits });
          }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border shadow-lg group ${
            options.highContrastOrbits
              ? 'bg-[#2b2f36] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
              : 'bg-[#18191c]/85 hover:bg-[#25282d] text-slate-300 hover:text-white border-[#2e3136]/80'
          }`}
          title={`Lighting & Orbit Contrast (${options.highContrastOrbits ? 'High Contrast Active' : 'Natural Solar Active'})`}
          aria-label="Toggle Lighting / Contrast"
        >
          <svg className="w-[18px] h-[18px] transition-colors" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" fill="none">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3 A 9 9 0 0 0 12 21 Z" fill="currentColor" />
          </svg>
        </button>

        {/* Tile 5: Fullscreen Diagonal Expand Arrow */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#18191c]/85 hover:bg-[#25282d] text-slate-300 hover:text-white border border-[#2e3136]/80 transition-colors cursor-pointer shadow-lg group"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <svg className="w-[18px] h-[18px] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        {/* Tile 6: Equalizer Sliders (Observatory Deck & Tools) */}
        <button
          onClick={() => {
            if (isRightDeckOpen && activeDeckTab === 'tools') {
              setIsRightDeckOpen(false);
            } else {
              setActiveDeckTab('tools');
              setIsRightDeckOpen(true);
            }
          }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border shadow-lg group ${
            isRightDeckOpen && activeDeckTab === 'tools'
              ? 'bg-[#2b2f36] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
              : 'bg-[#18191c]/85 hover:bg-[#25282d] text-slate-300 hover:text-white border-[#2e3136]/80'
          }`}
          title="Observatory Deck & Science Tools"
          aria-label="Observatory Deck & Tools"
        >
          <svg className="w-[18px] h-[18px] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </aside>

      {/* 3. Highly Visual, Modern Transparent Observatory Desk */}
      {isRightDeckOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsRightDeckOpen(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 z-50 w-88 sm:w-96 bg-black/60 border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200 select-none">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase">
                  Visual Controls
                </span>
                <h3 className="text-xl font-light text-white tracking-wide mt-0.5">
                  Observatory Deck
                </h3>
              </div>
              <button
                onClick={() => setIsRightDeckOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Deck"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Deck Navigation Tabs */}
            <div className="flex border-b border-white/10 bg-black/20 px-5 gap-6 text-xs font-mono">
              <button
                onClick={() => setActiveDeckTab('layers')}
                className={`py-3 font-medium transition-colors border-b-2 cursor-pointer ${
                  activeDeckTab === 'layers'
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Layers
              </button>
              <button
                onClick={() => setActiveDeckTab('camera')}
                className={`py-3 font-medium transition-colors border-b-2 cursor-pointer ${
                  activeDeckTab === 'camera'
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Perspectives
              </button>
              <button
                onClick={() => setActiveDeckTab('tools')}
                className={`py-3 font-medium transition-colors border-b-2 cursor-pointer ${
                  activeDeckTab === 'tools'
                    ? 'border-white text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tools
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
              
              {/* Tab 1: Visual Layers */}
              {activeDeckTab === 'layers' && (
                <div className="space-y-6">
                  
                  {/* Visual Scale Proportion Cards */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                      Scale Proportions
                    </span>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* 1:1 True Scale Card */}
                      <button
                        onClick={() => onOptionsChange({ scaleMode: 'true' })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          options.scaleMode === 'true'
                            ? 'bg-white/15 border-white/40 shadow-lg'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">1:1 True</span>
                        </div>
                        <span className="font-medium text-white block text-xs">Astronomical</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Authentic distances</span>
                      </button>

                      {/* Visual Clarity Card */}
                      <button
                        onClick={() => onOptionsChange({ scaleMode: 'visual' })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          options.scaleMode === 'visual'
                            ? 'bg-white/15 border-white/40 shadow-lg'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Enhanced</span>
                        </div>
                        <span className="font-medium text-white block text-xs">Visual Clarity</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Distinguishable globes</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Celestial Overlays */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block mb-1">
                      Celestial Overlays
                    </span>

                    {/* Orbits Toggle */}
                    <div
                      onClick={() => onOptionsChange({ showOrbits: !options.showOrbits })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sky-400">
                          <Orbit className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Orbital Trajectories
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Keplerian paths (auto-fades near objects)
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showOrbits ? 'bg-sky-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showOrbits ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Celestial Labels */}
                    <div
                      onClick={() => onOptionsChange({ showLabels: !options.showLabels })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Celestial Markers & Labels
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Planetary & probe identification tags
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showLabels ? 'bg-sky-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showLabels ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Constellations */}
                    <div
                      onClick={() => onOptionsChange({ showConstellations: !options.showConstellations })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-purple-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Constellation Lines
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Stellar pattern vectors in deep space
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showConstellations ? 'bg-purple-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showConstellations ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Ecliptic Grid */}
                    <div
                      onClick={() => onOptionsChange({ showEclipticGrid: !options.showEclipticGrid })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400">
                          <Grid className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Ecliptic Plane Grid
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Astronomical coordinate reference plane
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showEclipticGrid ? 'bg-sky-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showEclipticGrid ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Main Asteroid Belt */}
                    <div
                      onClick={() => onOptionsChange({ showAsteroidBelt: !options.showAsteroidBelt })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                          <CircleDot className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Main Asteroid Belt
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Mars-Jupiter debris swarm & Ceres
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showAsteroidBelt ? 'bg-amber-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showAsteroidBelt ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Kuiper Belt */}
                    <div
                      onClick={() => onOptionsChange({ showKuiperBelt: !options.showKuiperBelt })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
                          <CircleDot className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Kuiper Belt (KBOs)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Outer icy boundary & Pluto
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showKuiperBelt ? 'bg-cyan-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showKuiperBelt ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Habitable Zone */}
                    <div
                      onClick={() => onOptionsChange({ showHabitableZone: !options.showHabitableZone })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Habitable Zone
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Liquid water orbital corridor
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showHabitableZone ? 'bg-emerald-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showHabitableZone ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Physics Vectors */}
                    <div
                      onClick={() => onOptionsChange({ showPhysicsVectors: !options.showPhysicsVectors })}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-300">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            Physics Force Vectors
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Velocity & gravitational attraction
                          </span>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${options.showPhysicsVectors ? 'bg-amber-500' : 'bg-white/15'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${options.showPhysicsVectors ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Perspectives & Camera Views */}
              {activeDeckTab === 'camera' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block mb-1">
                    Visual Camera Perspectives
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Daylight Hemisphere */}
                    <button
                      onClick={() => onSetCameraPreset('daySide')}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="text-white font-medium block text-xs group-hover:text-amber-300 transition-colors">
                        Daylight Side
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Sunlit hemisphere</span>
                    </button>

                    {/* Shadow Terminator */}
                    <button
                      onClick={() => onSetCameraPreset('terminator')}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-2">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-white font-medium block text-xs group-hover:text-sky-300 transition-colors">
                        Terminator Line
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Day/night boundary</span>
                    </button>

                    {/* Night Silhouette */}
                    <button
                      onClick={() => onSetCameraPreset('nightSide')}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="text-white font-medium block text-xs group-hover:text-indigo-300 transition-colors">
                        Dark Silhouette
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Eclipsed horizon</span>
                    </button>

                    {/* North Polar View */}
                    <button
                      onClick={() => onSetCameraPreset('northPole')}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                        <Grid className="w-4 h-4" />
                      </div>
                      <span className="text-white font-medium block text-xs group-hover:text-emerald-300 transition-colors">
                        North Polar
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Top-down view</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                      Flight Tracking Modes
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl font-mono text-[11px]">
                      <button
                        onClick={() => onOptionsChange({ cameraMode: 'orbit' })}
                        className={`py-2 rounded-lg transition-colors cursor-pointer ${options.cameraMode === 'orbit' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
                      >
                        Orbit
                      </button>
                      <button
                        onClick={() => onOptionsChange({ cameraMode: 'rideAlong' })}
                        className={`py-2 rounded-lg transition-colors cursor-pointer ${options.cameraMode === 'rideAlong' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
                      >
                        Chase
                      </button>
                      <button
                        onClick={() => onOptionsChange({ cameraMode: 'surface' })}
                        className={`py-2 rounded-lg transition-colors cursor-pointer ${options.cameraMode === 'surface' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
                      >
                        Surface
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Tools */}
              {activeDeckTab === 'tools' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block mb-1">
                    Exploration Tools
                  </span>

                  <button
                    onClick={() => {
                      onOpenTours();
                      setIsRightDeckOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-white group-hover:text-amber-300 transition-colors block">
                          Guided Space Expeditions
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Grand Tour, Artemis, Ocean Worlds
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>

                  {onOpenMeasure && (
                    <button
                      onClick={() => {
                        onOpenMeasure();
                        setIsRightDeckOpen(false);
                      }}
                      className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-sky-300 transition-colors block">
                            3D Distance Ruler
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Line-of-sight distance & light-time
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  )}

                  {onOpenCompare && (
                    <button
                      onClick={() => {
                        onOpenCompare();
                        setIsRightDeckOpen(false);
                      }}
                      className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white group-hover:text-purple-300 transition-colors block">
                            Scale Comparison Tool
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Compare planetary diameters side-by-side
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  )}

                  <button
                    onClick={onToggleAudio}
                    className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
                        {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <span className="font-medium text-white group-hover:text-white transition-colors block">
                          Cosmic Ambient Audio
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isAudioMuted ? 'Muted' : 'Synthesizer active'}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onOpenHelp();
                      setIsRightDeckOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-white group-hover:text-white transition-colors block">
                          Keyboard Shortcuts
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Press 'H' to hide/show HUD
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>NASA Eyes on the Solar System</span>
              <span className="text-white/60">Press 'H' to hide controls</span>
            </div>
          </div>
        </>
      )}

      {/* 4. Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-black/80 border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search planets, moons, asteroids, missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none placeholder-slate-500 font-sans"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
              {filteredBodies.map((body) => (
                <button
                  key={body.id}
                  onClick={() => {
                    onSelectBody(body.id);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-slate-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: body.baseColor || '#38bdf8' }}
                    />
                    <span className="font-medium text-sm text-white group-hover:text-sky-300 transition-colors">
                      {body.name}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{body.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {body.orbit.semiMajorAxisAU > 0 ? `${body.orbit.semiMajorAxisAU.toFixed(2)} AU` : 'Central Star'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
