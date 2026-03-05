import React from 'react';
import { Handle, Position } from 'reactflow';
import { Type, X } from 'lucide-react';
import { AppNodeData } from '../types';

export const TextNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Type size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Text Input</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <textarea
        value={data.value || ''}
        onChange={(e) => {
          data.onUpdate?.(id, { value: e.target.value });
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
        }}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors custom-scrollbar resize-none overflow-y-auto"
        placeholder="Enter text context..."
        rows={1}
      />

      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  );
};
