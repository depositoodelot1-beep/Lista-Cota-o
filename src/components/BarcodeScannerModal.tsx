import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  AlertCircle,
  Check,
  FlipHorizontal,
  Flashlight,
  Keyboard,
  ZoomIn,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// Emite um bipe sonoro de confirmação usando Web Audio API
function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Silently ignore if audio is blocked by user interaction policy
  }
}

const ALL_BARCODE_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.PDF_417,
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [useFacingMode, setUseFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Torch & Zoom capabilities
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [zoomCapability, setZoomCapability] = useState<{ min: number; max: number; step: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);

  // Photo scan fallback state
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [tipMessage, setTipMessage] = useState('Aproxime a cerca de 15 a 20 cm com boa luz');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeDetectorLoopRef = useRef<number | null>(null);
  const hasDetectedRef = useRef(false);

  const cleanupScanner = useCallback(() => {
    if (nativeDetectorLoopRef.current) {
      cancelAnimationFrame(nativeDetectorLoopRef.current);
      nativeDetectorLoopRef.current = null;
    }

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
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
  }, []);

  const handleCodeSuccess = useCallback(
    (code: string) => {
      const cleaned = code.trim();
      if (!cleaned || hasDetectedRef.current) return;
      hasDetectedRef.current = true;

      playBeep();
      try {
        if (navigator.vibrate) {
          navigator.vibrate(120);
        }
      } catch {}

      cleanupScanner();
      onDetected(cleaned);
      onClose();
    },
    [cleanupScanner, onDetected, onClose]
  );

  // Start direct native BarcodeDetector loop if supported by browser for ultra-fast reading
  const startNativeBarcodeDetectorLoop = useCallback(() => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return;

    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({
        formats: [
          'ean_13',
          'ean_8',
          'code_128',
          'code_39',
          'code_93',
          'codabar',
          'upc_a',
          'upc_e',
          'itf',
          'qr_code',
          'data_matrix',
        ],
      });

      const checkFrame = async () => {
        if (!isMountedRef.current || hasDetectedRef.current) return;
        const video = document.querySelector('#barcode-scanner-viewport video') as HTMLVideoElement | null;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const detected = await detector.detect(video);
            if (detected && detected.length > 0 && detected[0].rawValue) {
              handleCodeSuccess(detected[0].rawValue);
              return;
            }
          } catch {
            // Ignore frame detection transient glitches
          }
        }
        nativeDetectorLoopRef.current = requestAnimationFrame(checkFrame);
      };

      nativeDetectorLoopRef.current = requestAnimationFrame(checkFrame);
    } catch {
      // BarcodeDetector instantiation failed, fallback to Html5Qrcode engine
    }
  }, [handleCodeSuccess]);

  // Main scanner initialization
  useEffect(() => {
    isMountedRef.current = true;
    hasDetectedRef.current = false;

    if (!isOpen) {
      cleanupScanner();
      return;
    }

    setCameraError(null);
    setIsStarting(true);
    setManualCode('');
    setFileScanError(null);
    setIsTorchOn(false);

    const elementId = 'barcode-scanner-viewport';

    // Delay slightly to ensure DOM element is ready
    const timer = setTimeout(async () => {
      if (!isMountedRef.current) return;
      const el = document.getElementById(elementId);
      if (!el) return;

      try {
        // Enumerate devices to allow camera lens switching
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (isMountedRef.current && cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        } catch {
          // Camera enumeration not critical
        }

        // Create Html5Qrcode instance with hardware acceleration enabled
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: ALL_BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
        scannerRef.current = scanner;

        // High frame rate and generous/unconstrained scanning area for maximum sensitivity
        const config: any = {
          fps: 20,
          disableFlip: false,
          videoConstraints: {
            facingMode: useFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // Continuous autofocus where supported
            advanced: [{ focusMode: 'continuous' } as any],
          },
        };

        const cameraChoice = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: useFacingMode };

        await scanner.start(
          cameraChoice,
          config,
          (decodedText) => {
            handleCodeSuccess(decodedText);
          },
          () => {
            // No barcode found in current frame
          }
        );

        if (isMountedRef.current) {
          setIsStarting(false);

          // Check hardware capabilities (Torch / Zoom)
          try {
            const capabilities: any = scanner.getRunningTrackCapabilities();
            if (capabilities) {
              if (capabilities.torch) {
                setHasTorch(true);
              }
              if (capabilities.zoom) {
                setZoomCapability({
                  min: capabilities.zoom.min || 1,
                  max: capabilities.zoom.max || 5,
                  step: capabilities.zoom.step || 0.5,
                });
                setCurrentZoom(capabilities.zoom.min || 1);
              }
            }
          } catch {
            // Capabilities check failed
          }

          // Launch parallel high-speed native BarcodeDetector loop if supported
          startNativeBarcodeDetectorLoop();
        }
      } catch (err: any) {
        console.warn('Erro ao inicializar câmera:', err);
        if (isMountedRef.current) {
          setIsStarting(false);
          const msg =
            err?.name === 'NotAllowedError'
              ? 'Permissão de câmera negada. Permita o uso da câmera nas permissões do navegador ou digite o código manualmente.'
              : err?.name === 'NotFoundError'
              ? 'Nenhuma câmera detectada. Você pode digitar o código ou enviar uma foto da embalagem.'
              : 'Não foi possível iniciar a câmera em modo contínuo. Você pode tirar uma foto do produto ou digitar o código abaixo.';
          setCameraError(msg);
          setShowManualInput(true);
        }
      }
    }, 250);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen, useFacingMode, selectedCameraId, cleanupScanner, handleCodeSuccess, startNativeBarcodeDetectorLoop]);

  // Handle Torch Toggle
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

  // Handle Zoom change
  const handleSetZoom = async (newZoom: number) => {
    if (!scannerRef.current || !zoomCapability) return;
    try {
      const clamped = Math.min(Math.max(newZoom, zoomCapability.min), zoomCapability.max);
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: clamped } as any],
      });
      setCurrentZoom(clamped);
      setTipMessage(`Zoom ${clamped.toFixed(1)}x ativado`);
    } catch (err) {
      console.warn('Falha ao aplicar zoom:', err);
    }
  };

  // Switch front/back camera
  const handleToggleFacingMode = () => {
    cleanupScanner();
    setSelectedCameraId(null);
    setUseFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Cycle through available rear cameras
  const handleCycleCamera = () => {
    if (availableCameras.length <= 1) {
      handleToggleFacingMode();
      return;
    }
    cleanupScanner();
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].id);
  };

  // Scan from photo taken or selected from gallery
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileScanError(null);

    try {
      // 1. Try native BarcodeDetector first if available (faster & recognizes 1D barcodes from full-res photos)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const detector = new BarcodeDetectorClass({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'codabar', 'upc_a', 'upc_e', 'itf', 'qr_code'],
          });
          const imgBitmap = await createImageBitmap(file);
          const results = await detector.detect(imgBitmap);
          if (results && results.length > 0 && results[0].rawValue) {
            setIsProcessingFile(false);
            handleCodeSuccess(results[0].rawValue);
            return;
          }
        } catch {
          // Fall back to Html5Qrcode scanFile
        }
      }

      // 2. Fall back to Html5Qrcode.scanFile
      let tempScanner = scannerRef.current;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode('barcode-scanner-viewport', {
          formatsToSupport: ALL_BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
      }

      const decoded = await tempScanner.scanFile(file, false);
      setIsProcessingFile(false);
      if (decoded) {
        handleCodeSuccess(decoded);
      } else {
        setFileScanError('Nenhum código legível encontrado na foto. Tente aproximar ou digite o número.');
      }
    } catch (err: any) {
      setIsProcessingFile(false);
      console.warn('Erro ao processar imagem:', err);
      setFileScanError('Não foi possível ler o código na foto. Certifique-se de que as barras estão nítidas e sem reflexo.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="barcode-scanner-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/25 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Leitor de Código de Barras
              </h2>
              <p className="text-[11px] text-slate-400">
                EAN-13, EAN-8, Code 128, QR Code e mais
              </p>
            </div>
          </div>
          <button
            id="btn-close-scanner"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar leitor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Tip / Helper bar */}
        <div className="bg-slate-800/80 px-4 py-1.5 border-b border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{tipMessage}</span>
          </div>
          {availableCameras.length > 1 && (
            <span className="text-[10px] text-blue-400 font-medium shrink-0 ml-2">
              {availableCameras.length} lentes detectadas
            </span>
          )}
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
          {/* Target element where Html5Qrcode injects video */}
          <div id="barcode-scanner-viewport" className="w-full h-full min-h-[280px]" />

          {/* Scanner Overlay Guide (Crosshair / Laser effect) */}
          {!cameraError && !isStarting && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Responsive Reticle */}
              <div className="w-[82%] max-w-[300px] h-36 sm:h-44 border-2 border-blue-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(59,130,246,0.35)] bg-blue-500/5">
                {/* High contrast corner brackets */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-3 border-l-3 border-blue-400 rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-3 border-r-3 border-blue-400 rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-3 border-l-3 border-blue-400 rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-3 border-r-3 border-blue-400 rounded-br-lg" />

                {/* Animated red scanning laser line */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
              </div>
              <span className="text-[11px] font-medium text-white bg-slate-900/85 px-3.5 py-1 rounded-full mt-3 backdrop-blur-md border border-slate-700/60 shadow-md">
                Centralize o código de barras
              </span>
            </div>
          )}

          {/* Loading indicator */}
          {isStarting && !cameraError && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Iniciando câmera em alta resolução...</p>
              <p className="text-[11px] text-slate-400">Ativando detecção automática de código de barras</p>
            </div>
          )}

          {/* Processing image from file overlay */}
          {isProcessingFile && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
              <div className="w-9 h-9 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white font-bold">Processando foto...</p>
              <p className="text-xs text-slate-300">Localizando código de barras na imagem</p>
            </div>
          )}

          {/* Error display */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center z-10">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Câmera indisponível</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar foto da embalagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Digitar código manualmente
                </button>
              </div>
            </div>
          )}

          {/* Floating Camera Controls Toolbar */}
          {!cameraError && !isStarting && (
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto z-10">
              {/* Left group: Zoom buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-lg">
                {zoomCapability ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSetZoom(1)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        currentZoom === 1 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Zoom normal"
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetZoom(Math.min(2, zoomCapability.max))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        currentZoom > 1.2 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Zoom 2x (ideal para códigos pequenos)"
                    >
                      2x
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTipMessage('Aproxime a câmera a 15cm do código');
                    }}
                    className="p-2 text-slate-300 hover:text-white rounded-xl"
                    title="Dica de foco"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right group: Torch, Camera Cycle, Photo capture */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-lg">
                {hasTorch && (
                  <button
                    id="btn-scanner-torch"
                    type="button"
                    onClick={handleToggleTorch}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Lanterna / Flash"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}

                {/* Alternar lente / câmera */}
                <button
                  id="btn-scanner-flip-camera"
                  type="button"
                  onClick={availableCameras.length > 1 ? handleCycleCamera : handleToggleFacingMode}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Alternar câmera / lente"
                >
                  {availableCameras.length > 1 ? <RefreshCw className="w-4 h-4" /> : <FlipHorizontal className="w-4 h-4" />}
                </button>

                {/* Tirar foto / Galeria (Foto nítida em alta resolução) */}
                <button
                  id="btn-scanner-photo"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-950/60 rounded-xl transition-colors cursor-pointer"
                  title="Tirar foto com a câmera do celular ou carregar foto"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Photo file input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
          aria-hidden="true"
        />

        {/* Error message from file scan */}
        {fileScanError && (
          <div className="p-2.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-300 text-xs px-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fileScanError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFileScanError(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick action buttons & Manual Input Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2.5">
          {/* Practical action bar */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Tirar foto ou selecionar foto da embalagem"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Tirar Foto / Galeria</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualInput((prev) => !prev)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Digitar</span>
            </button>
          </div>

          {/* Manual Input form */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                id="input-manual-barcode"
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Digitar código: Ex. 7891000100103"
                className="flex-1 px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                id="btn-submit-manual-barcode"
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Usar</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 px-1">
              Dica: Você também pode usar leitor de código de barras USB/Bluetooth ou colar o número diretamente.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
