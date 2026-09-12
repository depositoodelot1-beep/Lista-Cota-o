import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Maximize2, Minimize2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ScreenSizeIndicatorProps {
  viewMode: 'frame' | 'full';
  onToggleViewMode: (mode: 'frame' | 'full') => void;
}

export const ScreenSizeIndicator: React.FC<ScreenSizeIndicatorProps> = ({
  viewMode,
  onToggleViewMode,
}) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        dpr: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const getBreakpoint = (width: number) => {
    if (width < 640) return { name: 'xs', label: 'Mobile (< 640px)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (width < 768) return { name: 'sm', label: 'Mobile grande (≥ 640px)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (width < 1024) return { name: 'md', label: 'Tablet (≥ 768px)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (width < 1280) return { name: 'lg', label: 'Notebook / Desktop (≥ 1024px)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (width < 1536) return { name: 'xl', label: 'Desktop grande (≥ 1280px)', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    return { name: '2xl', label: 'Ultra-wide (≥ 1536px)', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' };
  };

  const bp = getBreakpoint(dimensions.width);
  const isLandscape = dimensions.width > dimensions.height;

  if (isDismissed) {
    return (
      <button
        id="btn-reopen-screen-size"
        type="button"
        onClick={() => setIsDismissed(false)}
        className="fixed top-2 right-2 z-50 bg-slate-900/85 text-white hover:bg-slate-900 px-2.5 py-1.5 rounded-full shadow-lg text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer border border-slate-700/50"
        title="Ver Current screen size"
      >
        <Monitor className="w-3.5 h-3.5 text-blue-400" />
        <span>{dimensions.width}×{dimensions.height}</span>
      </button>
    );
  }

  return (
    <div
      id="current-screen-size-indicator"
      className="fixed top-2 right-2 sm:right-4 z-50 font-sans select-none"
    >
      <div className="bg-slate-900/90 text-white rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md overflow-hidden transition-all duration-200">
        {/* Main Bar */}
        <div className="px-3 py-1.5 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300 text-[11px] tracking-tight">
              Current screen size:
            </span>
            <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700 text-[11px]">
              {dimensions.width} × {dimensions.height} px
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${bp.color}`}>
              {bp.name}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-1 border-l border-slate-700 pl-1.5">
            {/* Toggle view mode: full screen vs mobile frame */}
            <button
              type="button"
              onClick={() => onToggleViewMode(viewMode === 'frame' ? 'full' : 'frame')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={viewMode === 'frame' ? 'Mudar para Tela Cheia (100%)' : 'Mudar para Moldura Celular (430px)'}
            >
              {viewMode === 'frame' ? (
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Expand / Collapse Details */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'Recolher detalhes' : 'Ver mais detalhes da tela'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Minimizar indicador"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Detailed Expanded Drawer */}
        {isExpanded && (
          <div className="p-3.5 pt-2 border-t border-slate-800 bg-slate-950/60 text-slate-200 text-xs space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Viewport (Janela)</span>
                <span className="font-mono font-bold text-white">{dimensions.width}px × {dimensions.height}px</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Display Físico</span>
                <span className="font-mono font-bold text-white">{dimensions.screenWidth}px × {dimensions.screenHeight}px</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Orientação</span>
                <span className="font-medium text-slate-200">{isLandscape ? 'Paisagem (Horizontal)' : 'Retrato (Vertical)'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Pixel Ratio (DPR)</span>
                <span className="font-mono font-bold text-slate-200">{dimensions.dpr.toFixed(1)}x</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Breakpoint:</span>
              <span className="font-medium text-blue-300">{bp.label}</span>
            </div>

            {/* Layout switch controls */}
            <div className="pt-2 border-t border-slate-800">
              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                Modo de Visualização do App:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleViewMode('frame')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'frame'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Moldura Celular (430px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleViewMode('full')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'full'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Tela Cheia (100%)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
