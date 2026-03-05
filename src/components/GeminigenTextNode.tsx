import React from 'react';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { MessageSquare, X, Wand2 } from 'lucide-react';
import { AppNode, AppNodeData } from '../types';
import { useMemo } from 'react';

export const GeminigenTextNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const params = data.params || {};
  const edges = useEdges();
  const nodes = useNodes();

  const connectedInputs = useMemo(() => {
    const inputs = edges.filter(e => e.target === id);
    return inputs.map(e => {
      const sourceNode = nodes.find(n => n.id === e.source) as AppNode | undefined;
      return { handle: e.targetHandle, type: sourceNode?.type, value: sourceNode?.data?.value };
    });
  }, [edges, nodes, id]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-80 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <MessageSquare size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Geminigen Text</span>
        </div>
        <button 
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            System Instruction
          </label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none h-16 resize-none"
            placeholder="You are a helpful assistant..."
            value={params.systemInstruction || ''}
            onChange={(e) => data.onUpdate?.(id, { params: { ...params, systemInstruction: e.target.value } })}
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Prompt
          </label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-24"
            placeholder="What would you like to ask?"
            value={params.prompt || ''}
            onChange={(e) => data.onUpdate?.(id, { params: { ...params, prompt: e.target.value } })}
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Model
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
            value={params.model || 'gemini-2.5-pro'}
            onChange={(e) => data.onUpdate?.(id, { params: { ...params, model: e.target.value } })}
          >
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          </select>
        </div>

        <button
          onClick={() => data.onGenerate?.(id)}
          disabled={data.isGenerating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
        >
          {data.isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          Generate Text
        </button>
      </div>

      <div className="absolute -left-3 top-1/4 flex flex-col gap-6">
        <div className="relative">
          <Handle type="target" position={Position.Left} id="image-input" className="!bg-blue-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Images</span>
        </div>
        <div className="relative">
          <Handle type="target" position={Position.Left} id="audio-input" className="!bg-amber-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Audio</span>
        </div>
        <div className="relative">
          <Handle type="target" position={Position.Left} id="video-input" className="!bg-purple-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Video</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  );
};
