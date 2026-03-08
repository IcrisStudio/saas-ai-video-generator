import React, { useState } from 'react';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Film, X, Wand2, Download, Image as ImageIcon } from 'lucide-react';
import { AppNodeData, AppNode } from '../types';

export const ExtractFrameNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const [frameTime, setFrameTime] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const edges = useEdges();
  const nodes = useNodes() as AppNode[];
  const params = data.params || {};

  const extractString = (val: any): string => {
    if (!val) return '';
    const rawVal = Array.isArray(val) ? val[0] : val;
    if (typeof rawVal === 'string') return rawVal;
    if (typeof rawVal === 'object' && 'url' in rawVal && typeof rawVal.url === 'string') return rawVal.url;
    return '';
  };

  // Get connected video
  const inputEdge = edges.find(e => e.target === id && e.targetHandle === 'video-input');
  const inputVideo = inputEdge ? extractString(nodes.find(n => n.id === inputEdge.source)?.data?.value) : null;

  const handleExtractFrame = async () => {
    if (!inputVideo) return;

    setIsExtracting(true);
    try {
      // Create a video element to extract frame
      const video = document.createElement('video');
      video.src = inputVideo;
      video.crossOrigin = 'anonymous';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        // Clamp frame time to valid duration
        const timeToCapture = Math.min(frameTime, duration - 0.1);
        video.currentTime = timeToCapture;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const frameDataUrl = canvas.toDataURL('image/png');
          
          // Update the node value with extracted frame
          data.onUpdate?.(id, {
            value: frameDataUrl,
            params: { ...params, frameTime }
          });
        }
        setIsExtracting(false);
      };

      video.onerror = () => {
        console.error('Failed to load video for frame extraction');
        setIsExtracting(false);
      };

      // Trigger load
      if (video.src) {
        // For data URLs, we need to handle them differently
        if (!inputVideo.startsWith('data:')) {
          video.load();
        }
      }
    } catch (error) {
      console.error('Frame extraction error:', error);
      setIsExtracting(false);
    }
  };

  const previewFrame = Array.isArray(data.value) ? data.value[0] : data.value;
  const isPreviewImage = previewFrame && (typeof previewFrame === 'string' && previewFrame.startsWith('data:image'));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-80 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Film size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Extract Frame</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Preview */}
        {isPreviewImage && (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-blue-500/30 bg-zinc-950">
            <img
              src={previewFrame}
              alt="Extracted Frame"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900/80 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest">
              Frame @ {frameTime}s
            </div>
          </div>
        )}

        {/* Frame Time Input */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Time (seconds)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={frameTime}
            onChange={(e) => setFrameTime(parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors"
            placeholder="0"
          />
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtractFrame}
          disabled={!inputVideo || isExtracting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
        >
          {isExtracting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ImageIcon size={16} />
          )}
          {isExtracting ? 'Extracting...' : 'Extract Frame'}
        </button>

        {previewFrame && (
          <button
            onClick={() => {
              const url = typeof previewFrame === 'string' ? previewFrame : previewFrame?.url || '';
              const link = document.createElement('a');
              link.href = url;
              link.download = `frame-${frameTime}s-${Date.now()}.png`;
              link.click();
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg py-2 flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer"
          >
            <Download size={14} />
            Download Frame
          </button>
        )}
      </div>

      <div className="absolute -left-3 top-1/4 flex flex-col gap-2">
        <div className="relative">
          <Handle type="target" position={Position.Left} id="video-input" className="!bg-blue-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Video</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  );
};
