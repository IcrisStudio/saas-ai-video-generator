import React from 'react';
import { Handle, Position } from 'reactflow';
import { Volume2, X, Wand2 } from 'lucide-react';
import { AppNodeData } from '../types';
import { TTS_MODELS } from '../constants';

export const GeminigenTTSNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const params = data.params || {};
  const currentModelId = params.model || 'geminigen-tts';
  const currentModel = TTS_MODELS.find(m => m.id === currentModelId) || TTS_MODELS[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-72 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Volume2 size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Text To Speech</span>
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
            Select Model
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
            value={currentModelId}
            onChange={(e) => {
              const newModel = TTS_MODELS.find(m => m.id === e.target.value);
              data.onUpdate?.(id, { 
                params: { 
                  ...params, 
                  model: e.target.value,
                  voiceId: newModel?.voices[0].id 
                } 
              });
            }}
          >
            {TTS_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Input Text
          </label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-colors resize-none h-20"
            placeholder="What should I say?"
            value={params.prompt || ''}
            onChange={(e) => data.onUpdate?.(id, { params: { ...params, prompt: e.target.value } })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Voice
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.voiceId || currentModel.voices[0].id}
              onChange={(e) => data.onUpdate?.(id, { params: { ...params, voiceId: e.target.value } })}
            >
              {currentModel.voices.map(voice => (
                <option key={voice.id} value={voice.id}>{voice.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Speed
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="2"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.speed || 1}
              onChange={(e) => data.onUpdate?.(id, { params: { ...params, speed: parseFloat(e.target.value) } })}
            />
          </div>
        </div>

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
          Generate Audio ({currentModel.cost} Credits)
        </button>
      </div>

      <Handle type="target" position={Position.Left} id="text-input" className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
    </div>
  );
};
