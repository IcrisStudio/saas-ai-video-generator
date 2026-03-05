import React from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles, X, Wand2 } from 'lucide-react';
import { AppNodeData } from '../types';

export const EnhancerNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Prompt Enhancer</span>
        </div>
        <button onClick={() => data.onDelete?.(id)} className="text-zinc-600 hover:text-red-400">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
          Connect a text node to enhance it using Gemini AI for better image results.
        </p>

        <button
          onClick={() => data.onGenerate?.(id)}
          disabled={data.isGenerating}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
        >
          {data.isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          Enhance (5 Credits)
        </button>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
    </div>
  );
};
