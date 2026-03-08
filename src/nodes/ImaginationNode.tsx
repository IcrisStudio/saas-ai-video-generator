import React, { useMemo } from 'react';
import { Handle, Position, useEdges, useNodes, useReactFlow } from 'reactflow';
import { Sparkles, X, Wand2, Link2Off } from 'lucide-react';
import { AppNode, AppNodeData } from '../types';
import { cn } from '../lib/utils';
import { IMAGE_MODELS, IMAGE_STYLES, IMAGE_RESOLUTIONS, IMAGE_ASPECT_RATIOS, IMAGE_OUTPUT_FORMATS } from '../constants';

export const ImaginationNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const params = data.params || {};
  const edges = useEdges();
  const nodes = useNodes();
  const { setEdges } = useReactFlow();

  const currentModelId = params.model || 'nano-banana-pro';
  const currentModel = IMAGE_MODELS.find(m => m.id === currentModelId) || IMAGE_MODELS[0];

  const extractString = (val: any) => {
    if (!val) return null;
    const rawVal = Array.isArray(val) ? val[0] : val;
    if (typeof rawVal === 'string') return rawVal;
    if (typeof rawVal === 'object' && 'url' in rawVal && typeof rawVal.url === 'string') return rawVal.url;
    return null;
  };

  const connectedImages = useMemo(() => {
    const imageEdges = edges.filter(e => e.target === id && e.targetHandle === 'image-input');
    return imageEdges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source) as AppNode | undefined;
      return {
        edgeId: edge.id,
        value: extractString(sourceNode?.data?.value)
      };
    }).filter(item => item.value);
  }, [edges, nodes, id]);

  const handleDisconnectImage = (edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  };

  const updateParams = (newParams: any) => {
    data.onUpdate?.(id, { params: { ...params, ...newParams } });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-80 shadow-xl group/node relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Imagination</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Connected Reference Images */}
        {connectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {connectedImages.map((img) => (
              <div
                key={img.edgeId}
                className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30 bg-zinc-950 group/img cursor-zoom-in"
                onClick={() => data.onPreview?.(Array.isArray(img.value) ? img.value[0] : img.value)}
              >
                <img src={Array.isArray(img.value) ? img.value[0] : img.value} alt="Input" className="w-full h-full object-cover opacity-60 transition-opacity group-hover/img:opacity-100" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnectImage(img.edgeId);
                  }}
                  className="absolute top-1 right-1 p-1 bg-zinc-900/90 border border-zinc-700 rounded text-zinc-400 hover:text-red-400 transition-all opacity-0 group-hover/img:opacity-100 cursor-pointer"
                >
                  <Link2Off size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Prompt
          </label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-20"
            placeholder="Describe what you want to see..."
            value={params.prompt || ''}
            onChange={(e) => updateParams({ prompt: e.target.value })}
          />
        </div>

        {/* Model */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Model
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            value={currentModelId}
            onChange={(e) => updateParams({ model: e.target.value })}
          >
            {IMAGE_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Style
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            value={params.style || 'None'}
            onChange={(e) => updateParams({ style: e.target.value })}
          >
            {IMAGE_STYLES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio + Resolution row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Aspect Ratio
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={params.aspectRatio || '1:1'}
              onChange={(e) => updateParams({ aspectRatio: e.target.value })}
            >
              {IMAGE_ASPECT_RATIOS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Resolution
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={params.resolution || '1K'}
              onChange={(e) => updateParams({ resolution: e.target.value })}
            >
              {IMAGE_RESOLUTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output Format */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Output Format
          </label>
          <div className="flex gap-2">
            {IMAGE_OUTPUT_FORMATS.map(fmt => (
              <button
                key={fmt.value}
                onClick={() => updateParams({ outputFormat: fmt.value })}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                  (params.outputFormat || 'jpeg') === fmt.value
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity (number of generations, max 4) */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Number of images
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            value={Math.min(4, Math.max(1, Number(params.quantity) || 1))}
            onChange={(e) => updateParams({ quantity: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} image{n > 1 ? 's' : ''} ({(currentModel.cost * n)} credits)</option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
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
          Generate ({(currentModel.cost * (Math.min(4, Math.max(1, Number(params.quantity) || 1))))} Credits)
        </button>
      </div>

      <Handle type="target" position={Position.Left} id="image-input" className="!bg-emerald-500 !top-1/4" />
      <Handle type="target" position={Position.Left} id="text-input" className="!bg-blue-500 !top-3/4" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  );
};
