import React, { useMemo } from 'react';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Video, X, Wand2, Film, Settings2, Image as ImageIcon } from 'lucide-react';
import { AppNodeData, AppNode } from '../types';
import { VIDEO_MODELS, GROK_MODES, GROK_DURATIONS, GROK_ASPECT_RATIOS } from '../constants';
import modelsConfig from '../models_config.json';
import { cn } from '../lib/utils';

export const VideoNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const params = data.params || {};
  const currentModelId = params.model || 'veo-3.1-fast';
  const currentModel = VIDEO_MODELS.find(m => m.id === currentModelId) || VIDEO_MODELS[0];

  const config = (modelsConfig as any)[currentModel.type];
  const edges = useEdges();
  const nodes = useNodes() as AppNode[];

  const extractString = (val: any) => {
    if (!val) return null;
    const rawVal = Array.isArray(val) ? val[0] : val;
    if (typeof rawVal === 'string') return rawVal;
    if (typeof rawVal === 'object' && 'url' in rawVal && typeof rawVal.url === 'string') return rawVal.url;
    return null;
  };

  const firstFrame = useMemo(() => {
    const edge = edges.find(e => e.target === id && e.targetHandle === 'first-frame');
    if (!edge) return null;
    const sourceNode = nodes.find(n => n.id === edge.source);
    return extractString(sourceNode?.data?.value);
  }, [edges, nodes, id]);

  const lastFrame = useMemo(() => {
    const edge = edges.find(e => e.target === id && e.targetHandle === 'last-frame');
    if (!edge) return null;
    const sourceNode = nodes.find(n => n.id === edge.source);
    return extractString(sourceNode?.data?.value);
  }, [edges, nodes, id]);

  const refHistory = useMemo(() => {
    const edge = edges.find(e => e.target === id);
    if (!edge) return null;
    const sourceNode = nodes.find(n => n.id === edge.source);
    const val = sourceNode?.data?.value;
    if (typeof val === 'object' && val !== null && 'uuid' in val) {
      return (val as any).uuid as string;
    }
    return null;
  }, [edges, nodes, id]);

  const isGrok = currentModelId.startsWith('grok');

  const resolutions = Array.isArray(config.resolutions)
    ? config.resolutions
    : (config.resolutions[currentModelId] || []);

  const durations = Array.isArray(config.durations)
    ? config.durations
    : (config.durations[currentModelId] || []);

  const updateParams = (newParams: any) => {
    data.onUpdate?.(id, { params: { ...params, ...newParams } });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-80 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-purple-400">
          <Film size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Video Generation</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {refHistory && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 flex items-center gap-2 mb-2">
            <Settings2 size={12} className="text-purple-400" />
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Video Extension Mode Active</span>
          </div>
        )}

        {config.supports_image_input && (firstFrame || lastFrame) && (
          <div className="grid grid-cols-2 gap-2">
            {firstFrame && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-purple-500/30 bg-zinc-950">
                <img src={firstFrame} alt="Start Frame" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900/80 rounded text-[8px] font-black text-purple-400 uppercase tracking-widest">Start</div>
              </div>
            )}
            {lastFrame && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-purple-500/30 bg-zinc-950">
                <img src={lastFrame} alt="End Frame" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900/80 rounded text-[8px] font-black text-purple-400 uppercase tracking-widest">End</div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Motion Prompt
          </label>
          <textarea
            value={params.prompt || ''}
            onChange={(e) => {
              updateParams({ prompt: e.target.value });
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-colors custom-scrollbar resize-none overflow-y-auto"
            placeholder="Describe the movement..."
            rows={1}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Model
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={currentModelId}
              onChange={(e) => updateParams({ model: e.target.value })}
            >
              {VIDEO_MODELS.map(model => (
                <option key={model.id} value={model.id} disabled={model.status === 'Maintenance'}>
                  {model.name} {model.status && model.status !== 'Available' ? `(${model.status})` : ''} - {model.cost} Credits
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Resolution
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.resolution || resolutions[0]}
              onChange={(e) => updateParams({ resolution: e.target.value })}
            >
              {resolutions.map((res: string) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Duration
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.duration || durations[0]}
              onChange={(e) => updateParams({ duration: parseInt(e.target.value) })}
            >
              {(isGrok ? GROK_DURATIONS : durations).map((dur: number) => (
                <option key={dur} value={dur}>{dur}s</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Aspect Ratio
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.aspect_ratio || (isGrok ? 'landscape' : config.aspect_ratios[0])}
              onChange={(e) => updateParams({ aspect_ratio: e.target.value })}
            >
              {isGrok ? GROK_ASPECT_RATIOS.map(ar => (
                <option key={ar.id} value={ar.id}>{ar.label}</option>
              )) : config.aspect_ratios.map((ar: string) => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
          </div>
        </div>

        {isGrok && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Generation Mode
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.mode || 'custom'}
              onChange={(e) => updateParams({ mode: e.target.value })}
            >
              {GROK_MODES.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {config.modes && !isGrok && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Mode
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
              value={params.mode || config.modes[0]}
              onChange={(e) => updateParams({ mode: e.target.value })}
            >
              {config.modes.map((m: string) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => data.onGenerate?.(id)}
          disabled={data.isGenerating || currentModel.status === 'Maintenance'}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
        >
          {data.isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          {currentModel.status === 'Maintenance' ? 'Under Maintenance' : `Generate Video (${currentModel.cost} Credits)`}
        </button>
      </div>

      <div className="absolute -left-3 top-1/4 flex flex-col gap-8">
        {config.supports_image_input && (
          <>
            <div className="relative">
              <Handle type="target" position={Position.Left} id="first-frame" className="!bg-purple-500 !static" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Start</span>
            </div>
            <div className="relative">
              <Handle type="target" position={Position.Left} id="last-frame" className="!bg-purple-500 !static" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">End</span>
            </div>
          </>
        )}
        <div className="relative">
          <Handle type="target" position={Position.Left} id="text-input" className="!bg-blue-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Prompt</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  );
};
