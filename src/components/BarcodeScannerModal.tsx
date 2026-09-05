import React, { useEffect, useState, useRef } from 'react';
import { X, Camera, AlertCircle, Check, FlipHorizontal, Flashlight, Keyboard } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// Emite um bipe sonoro de confirmação usando Web Audio API
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [useFacingMode, setUseFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    setCameraError(null);
    setIsStarting(true);
    setManualCode('');

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const elementId = 'barcode-scanner-viewport';

    // Delay slightly to ensure DOM element is mounted
    const timer = setTimeout(async () => {
      if (!isMountedRef.current) return;
      const el = document.getElementById(elementId);
      if (!el) return;

      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = scanner;

        const config = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.floor(minEdge * 0.85);
            const boxHeight = Math.floor(minEdge * 0.45);
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.333,
        };

        await scanner.start(
          { facingMode: useFacingMode },
          config,
          (decodedText) => {
            handleCodeSuccess(decodedText);
          },
          () => {
            // Frame scanned, no barcode found yet - silent
          }
        );

        if (isMountedRef.current) {
          setIsStarting(false);
          // Check if torch is supported
          try {
            const capabilities = scanner.getRunningTrackCapabilities();
            if (capabilities && (capabilities as any).torch) {
              setHasTorch(true);
            }
          } catch {
            // Ignore torch check error
          }
        }
      } catch (err: any) {
        console.warn('Erro ao inicializar câmera:', err);
        if (isMountedRef.current) {
          setIsStarting(false);
          const msg =
            err?.name === 'NotAllowedError'
              ? 'Permissão de acesso à câmera negada. Permita o uso da câmera no seu navegador ou digite o código manualmente.'
              : err?.name === 'NotFoundError'
              ? 'Nenhuma câmera detectada neste dispositivo. Você pode digitar ou colar o código de barras abaixo.'
              : 'Não foi possível iniciar a câmera. Digite o código de barras manualmente ou tente abrir o app em nova aba.';
          setCameraError(msg);
          setShowManualInput(true);
        }
      }
    }, 200);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen, useFacingMode]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      } catch {
        scannerRef.current = null;
      }
    }
  };

  const handleCodeSuccess = (code: string) => {
    const cleaned = code.trim();
    if (!cleaned) return;

    playBeep();
    try {
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch {}

    cleanupScanner();
    onDetected(cleaned);
    onClose();
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Falha ao alternar lanterna:', err);
    }
  };

  const handleToggleFacingMode = () => {
    cleanupScanner();
    setUseFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeSuccess(manualCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="barcode-scanner-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                Leitor de Código de Barras
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Aponte para o código para localizar ou cadastrar na lista e base
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar leitor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[300px] flex items-center justify-center overflow-hidden">
          <div id="barcode-scanner-viewport" className="w-full h-full min-h-[260px]" />

          {/* Scanner Overlay Guide (Crosshair / Laser effect) */}
          {!cameraError && !isStarting && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-32 sm:w-72 sm:h-36 border-2 border-blue-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500/5">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                {/* Animated red laser line */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                Posicione o código de barras no centro
              </span>
            </div>
          )}

          {/* Loading indicator */}
          {isStarting && !cameraError && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Iniciando câmera do dispositivo...</p>
            </div>
          )}

          {/* Error display */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Câmera indisponível</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Digitar código de barras
              </button>
            </div>
          )}

          {/* Floating Controls over camera */}
          {!cameraError && !isStarting && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                    isTorchOn
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-white hover:bg-slate-700/80'
                  }`}
                  title="Lanterna / Flash"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Alternar câmera frontal/traseira"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer with Manual Input Option */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 shrink-0">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-manual-barcode"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Digitar ou leitor USB / Bluetooth</span>
              </label>
              {showManualInput && (
                <span className="text-[10px] text-blue-400">Pressione Enter para confirmar</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-manual-barcode"
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 7891000100103"
                className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Usar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
