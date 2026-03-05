import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Image as ImageIcon, X, Download, Loader2, Volume2, Sparkles, Clock, Database } from 'lucide-react';
import { AppNodeData } from '../types';
import { cn } from '../lib/utils';

const GENERATION_STEPS = [
  'Synthesizing...',
  'Color Grading...',
  'Refining Details...',
  'Enhancing Textures...',
  'Finalizing...',
];
const ESTIMATED_TIME_MS = 120000; // 2 minutes

export const OutputNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const aspectRatio = data.params?.aspectRatio || '1:1';

  useEffect(() => {
    if (data.isGenerating) {
      setGenerationStartTime(Date.now());
      const stepInterval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
      }, 2000);
      const timeInterval = setInterval(() => {
        setElapsedTime(Date.now() - generationStartTime!);
      }, 1000);
      return () => {
        clearInterval(stepInterval);
        clearInterval(timeInterval);
      };
    } else {
      setStepIndex(0);
      setElapsedTime(0);
      setGenerationStartTime(null);
    }
  }, [data.isGenerating, generationStartTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      default: return 'aspect-square';
    }
  };

  const handleDownload = () => {
    if (!data.value) return;

    // Support both simple string and new { url, downloadUrl } object format
    const valObj = Array.isArray(data.value) ? data.value[0] : data.value;
    const url = valObj && typeof valObj === 'object' && 'downloadUrl' in valObj && valObj.downloadUrl ? valObj.downloadUrl :
      valObj && typeof valObj === 'object' && 'url' in valObj && valObj.url ? valObj.url :
        valObj;

    const link = document.createElement('a');
    // Ensure we only assign a string to href (fallback to empty string to keep TS happy)
    link.href = typeof url === 'string' ? url : '';

    // Explicitly target _blank so it downloads instead of replacing page
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Only attempt string methods on actual strings
    const urlString = typeof url === 'string' ? url : '';
    const isAudio = urlString.startsWith('data:audio') || urlString.endsWith('.mp3') || urlString.endsWith('.wav');
    const isVideo = urlString.startsWith('data:video') || urlString.endsWith('.mp4');
    const extension = isAudio ? 'mp3' : isVideo ? 'mp4' : 'png';
    link.download = `nexus-mind-gen-${Date.now()}.${extension}`;
    link.click();
  };

  const rawValue = Array.isArray(data.value) ? data.value[0] : data.value;
  const displayValue = rawValue && typeof rawValue === 'object' && 'url' in rawValue && typeof rawValue.url === 'string'
    ? rawValue.url
    : typeof rawValue === 'string' ? rawValue : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-72 shadow-2xl relative group/node overflow-hidden">
      {/* Subtle animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-zinc-400">
            {displayValue?.startsWith('data:audio') ? (
              <Volume2 size={16} className="text-amber-400" />
            ) : (
              <ImageIcon size={16} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider">Output</span>
            {data.isSaved && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-md shadow-lg shadow-emerald-500/10">
                <Database size={13} className="text-emerald-400" />
                <span className="text-[8px] text-emerald-300 font-bold uppercase tracking-wider">Saved</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {displayValue && !data.isGenerating && (
              <button
                onClick={handleDownload}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <Download size={14} />
              </button>
            )}
            <button
              onClick={() => data.onDelete?.(id)}
              className="text-zinc-600 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className={cn(
          "rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center relative group transition-all duration-500",
          !displayValue?.startsWith('data:audio') ? getAspectRatioClass() : "h-32",
          data.isGenerating && "border-emerald-500/30"
        )}>
        {data.isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin relative z-10" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-emerald-500 uppercase tracking-[0.2em] font-black">
                  {GENERATION_STEPS[stepIndex]}
                </span>
                <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono">
                  <Clock size={12} className="text-emerald-500" />
                  <span>{formatTime(elapsedTime)} / ~{formatTime(ESTIMATED_TIME_MS)}</span>
                </div>
                <div className="w-28 h-0.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min((elapsedTime / ESTIMATED_TIME_MS) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : displayValue ? (
            (displayValue.startsWith('data:image') || /\.(jpeg|jpg|png|webp|gif)(\?|$)/i.test(displayValue)) ? (
              <img
                src={displayValue}
                alt="Generated"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => data.onPreview?.(displayValue)}
              />
            ) : (displayValue.startsWith('data:audio') || /\.(mp3|wav|ogg)(\?|$)/i.test(displayValue)) ? (
              <div className="p-4 w-full flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Volume2 size={24} />
                </div>
                <audio
                  src={displayValue}
                  controls
                  className="w-full h-8"
                />
              </div>
            ) : (displayValue.startsWith('https://') || displayValue.startsWith('data:video') || /\.(mp4|webm)(\?|$)/i.test(displayValue)) ? (
              <video
                src={displayValue}
                controls
                className="w-full h-full object-contain"
                loop
              />
            ) : (
              <div className="p-4 text-xs text-zinc-300 font-mono leading-relaxed overflow-y-auto max-h-full w-full">
                {displayValue}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-700">
              <Sparkles size={32} strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Ready</span>
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-emerald-500" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  );
};
