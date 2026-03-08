import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { Image as ImageIcon, X, Download, Loader2, Volume2, Sparkles, Clock, FileText, Video, Maximize2 } from 'lucide-react';
import { AppNodeData } from '../types';
import { cn } from '../lib/utils';

const GENERATION_STEPS = [
  'Synthesizing...',
  'Color Grading...',
  'Refining Details...',
  'Enhancing Textures...',
  'Finalizing...',
];
const ESTIMATED_TIME_MS = 120000;

// ── Image-only preview modal — portalled to document.body ─────────────────
const PreviewModal = ({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={onClose}
    >
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
        className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full hover:bg-red-500 transition border border-zinc-800"
        >
          <X size={15} />
        </button>
        <img
          src={url}
          alt="Preview"
          style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }}
          className="object-contain"
        />
      </div>
    </div>,
    document.body
  );
};

// ── Main node ──────────────────────────────────────────────────────────────
export const OutputNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  // Natural video pixel dimensions detected from the video element
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(null);

  // Manual resize via drag handle
  const [manualSize, setManualSize] = useState<{ w: number; h: number } | null>(null);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Preview modal
  const [preview, setPreview] = useState(false);

  const aspectRatio = data.params?.aspectRatio || '1:1';
  const mediaType = data.mediaType || 'image';

  // ── Generation timer ──
  useEffect(() => {
    if (data.isGenerating) {
      setGenerationStartTime(Date.now());
      const stepInterval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
      }, 2000);
      const timeInterval = setInterval(() => {
        setElapsedTime(Date.now() - generationStartTime!);
      }, 1000);
      return () => { clearInterval(stepInterval); clearInterval(timeInterval); };
    } else {
      setStepIndex(0); setElapsedTime(0); setGenerationStartTime(null);
    }
  }, [data.isGenerating, generationStartTime]);

  // Reset manual/detected size when new media arrives
  useEffect(() => { setManualSize(null); setVideoSize(null); }, [data.value]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const rawValue = Array.isArray(data.value) ? data.value[0] : data.value;
  const displayValue =
    rawValue && typeof rawValue === 'object' && 'url' in rawValue && typeof rawValue.url === 'string'
      ? rawValue.url
      : typeof rawValue === 'string' ? rawValue : null;

  // ── Default width from aspectRatio param ──
  const defaultWidth = () => {
    if (mediaType === 'audio' || mediaType === 'text') return 320;
    switch (aspectRatio) {
      case '9:16': return 220;
      case '3:4':  return 250;
      case '16:9': return 320;
      case '4:3':  return 300;
      default:     return 280;
    }
  };

  // Compute pixel container size
  const getContainerSize = (): { w: number; h: number } => {
    const w = manualSize?.w ?? defaultWidth();

    if (mediaType === 'audio') return { w, h: manualSize?.h ?? 128 };
    if (mediaType === 'text')  return { w, h: manualSize?.h ?? 192 };

    // Use detected natural video ratio if available
    if (videoSize) {
      const ratio = videoSize.h / videoSize.w;
      return { w, h: manualSize?.h ?? Math.round(w * ratio) };
    }

    // Fall back to aspectRatio param
    const parts = aspectRatio.split(':').map(Number);
    const [aw, ah] = parts.length === 2 && !parts.some(isNaN) ? parts : [1, 1];
    return { w, h: manualSize?.h ?? Math.round(w * ah / aw) };
  };

  // ── Resize drag handler ──
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { w, h } = getContainerSize();
    resizingRef.current = true;
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w, h };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.x;
      const dy = ev.clientY - resizeStartRef.current.y;
      setManualSize({
        w: Math.max(160, resizeStartRef.current.w + dx),
        h: Math.max(80,  resizeStartRef.current.h + dy),
      });
    };
    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [aspectRatio, mediaType, videoSize, manualSize]);

  const handleDownload = () => {
    if (!data.value) return;
    const valObj = Array.isArray(data.value) ? data.value[0] : data.value;
    const url =
      valObj && typeof valObj === 'object' && 'downloadUrl' in valObj && valObj.downloadUrl ? valObj.downloadUrl :
      valObj && typeof valObj === 'object' && 'url' in valObj && valObj.url ? valObj.url : valObj;
    const link = document.createElement('a');
    link.href = typeof url === 'string' ? url : '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const us = typeof url === 'string' ? url : '';
    const isAudio = us.startsWith('data:audio') || us.endsWith('.mp3') || us.endsWith('.wav');
    const isVideo = us.startsWith('data:video') || us.endsWith('.mp4');
    link.download = `lyvrix-${Date.now()}.${isAudio ? 'mp3' : isVideo ? 'mp4' : 'png'}`;
    link.click();
  };

  const mediaIcon = () => {
    if (mediaType === 'audio') return <Volume2 size={13} className="text-zinc-400" />;
    if (mediaType === 'video') return <Video size={13} className="text-zinc-400" />;
    if (mediaType === 'text')  return <FileText size={13} className="text-zinc-400" />;
    return <ImageIcon size={13} className="text-zinc-400" />;
  };

  const mediaLabel = () => {
    if (videoSize) return `Video · ${videoSize.w}×${videoSize.h}`;
    if (mediaType === 'audio') return 'Audio';
    if (mediaType === 'video') return `Video · ${aspectRatio}`;
    if (mediaType === 'text')  return 'Text';
    return `Image · ${aspectRatio}`;
  };

  const { w: cw, h: ch } = getContainerSize();

  return (
    <>
      {preview && displayValue && mediaType !== 'video' && (
        <PreviewModal
          url={displayValue}
          onClose={() => setPreview(false)}
        />
      )}

      <div
        className="border border-zinc-400 rounded-2xl bg-zinc-900/40 backdrop-blur shadow-xl overflow-visible group/node relative select-none"
        style={{ width: cw }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {mediaIcon()}
            <span className="text-xs text-zinc-400 font-medium">{mediaLabel()}</span>
            {data.isSaved && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded-full ml-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-[9px] text-zinc-400 font-medium">Saved</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {displayValue && !data.isGenerating && (
              <>
                {mediaType !== 'video' && (
                  <button
                    onClick={() => setPreview(true)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all"
                    title="Expand"
                  >
                    <Maximize2 size={13} />
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all"
                  title="Download"
                >
                  <Download size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => data.onDelete?.(id)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-red-500/20 transition-all"
              title="Delete"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ── Media area ── */}
        <div
          className={cn(
            "w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center rounded-b-2xl",
            data.isGenerating && 'border-t border-emerald-500/10'
          )}
          style={{ height: ch }}
        >
          {data.isGenerating ? (
            <div className="flex flex-col items-center gap-4 p-6">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" strokeWidth={1.5} />
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-xs text-zinc-400 font-medium">{GENERATION_STEPS[stepIndex]}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <Clock size={10} />
                  <span>{formatTime(elapsedTime)} / ~{formatTime(ESTIMATED_TIME_MS)}</span>
                </div>
                <div className="w-28 h-0.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-zinc-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min((elapsedTime / ESTIMATED_TIME_MS) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : displayValue ? (
            mediaType === 'audio' ? (
              <div className="p-5 w-full flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Volume2 size={18} className="text-zinc-500" />
                </div>
                <audio src={displayValue} controls className="w-full h-8" />
              </div>
            ) : mediaType === 'video' ? (
              <video
                src={displayValue}
                controls
                loop
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setVideoSize({ w: v.videoWidth, h: v.videoHeight });
                }}
              />
            ) : mediaType === 'text' ? (
              <div className="p-4 text-xs text-zinc-400 font-mono leading-relaxed overflow-y-auto max-h-full w-full">
                {displayValue}
              </div>
            ) : (
              <img
                src={displayValue}
                alt="Generated"
                className="w-full h-full object-cover cursor-zoom-in group-hover/node:scale-[1.02] transition-transform duration-500"
                onClick={() => setPreview(true)}
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-700 p-6">
              <Sparkles size={24} strokeWidth={1.5} />
              <span className="text-[10px] text-zinc-600 font-medium">Ready to generate</span>
            </div>
          )}
        </div>

        {/* ── Resize grip — bottom-right, appears on node hover ── */}
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 group-hover/node:opacity-100 transition-opacity flex items-end justify-end p-1 z-20"
          title="Drag to resize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-zinc-500">
            <line x1="11" y1="2"  x2="2"  y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="11" y1="6"  x2="6"  y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="11" y1="10" x2="10" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        <Handle type="target" position={Position.Left} className="!bg-zinc-600 !border-zinc-500 !w-2.5 !h-2.5" />
        <Handle type="source" position={Position.Right} className="!bg-zinc-600 !border-zinc-500 !w-2.5 !h-2.5" />
      </div>
    </>
  );
};