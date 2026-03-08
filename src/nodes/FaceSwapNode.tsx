import React, { useMemo } from 'react';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import { Wand2, X } from 'lucide-react';
import { AppNodeData, AppNode } from '../types';

export const FaceSwapNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const params = data.params || {};
  const edges = useEdges();
  const nodes = useNodes() as AppNode[];

  const extractString = (val: any): string => {
    if (!val) return '';
    const rawVal = Array.isArray(val) ? val[0] : val;
    if (typeof rawVal === 'string') return rawVal;
    if (typeof rawVal === 'object' && 'url' in rawVal && typeof rawVal.url === 'string') return rawVal.url;
    return '';
  };

  // Get model reference image (the body/pose to use as reference)
  const referenceEdge = useMemo(() => {
    return edges.find(e => e.target === id && e.targetHandle === 'reference-image');
  }, [edges, id]);

  const referenceImage = useMemo(() => {
    if (!referenceEdge) return null;
    const sourceNode = nodes.find(n => n.id === referenceEdge.source);
    return extractString(sourceNode?.data?.value);
  }, [referenceEdge, nodes]);

  // Get model face image (the face to be swapped in)
  const targetEdge = useMemo(() => {
    return edges.find(e => e.target === id && e.targetHandle === 'target-image');
  }, [edges, id]);

  const targetImage = useMemo(() => {
    if (!targetEdge) return null;
    const sourceNode = nodes.find(n => n.id === targetEdge.source);
    return extractString(sourceNode?.data?.value);
  }, [targetEdge, nodes]);

  const updateParams = (newParams: any) => {
    data.onUpdate?.(id, { params: { ...params, ...newParams } });
  };

  const canGenerate = referenceImage && targetImage;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-80 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-pink-400">
          <Wand2 size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Face Swap</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Reference & Target Images Preview */}
        {(referenceImage || targetImage) && (
          <div className="grid grid-cols-2 gap-2">
            {referenceImage && (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-pink-500/30 bg-zinc-950">
                <img
                  src={referenceImage}
                  alt="Model Reference"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900/80 rounded text-[8px] font-black text-pink-400 uppercase tracking-widest">
                  Reference
                </div>
              </div>
            )}
            {targetImage && (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-pink-500/30 bg-zinc-950">
                <img
                  src={targetImage}
                  alt="Model Face"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900/80 rounded text-[8px] font-black text-pink-400 uppercase tracking-widest">
                  Face
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Enhancement */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
            Additional Instructions
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
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-pink-500/50 transition-colors custom-scrollbar resize-none overflow-y-auto"
            placeholder="Add extra details for the face swap..."
            rows={1}
          />
          <p className="text-[8px] text-zinc-500 mt-1">
            Default: Swap the face from Reference onto the Target while preserving pose and outfit
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => data.onGenerate?.(id)}
          disabled={!canGenerate || data.isGenerating}
          className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg cursor-pointer"
        >
          {data.isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          {data.isGenerating ? 'Swapping...' : 'Generate Swap'}
        </button>

        {/* Status */}
        {!referenceImage && (
          <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded text-[9px] text-zinc-400">
            ⚠ Connect model reference image (body/pose)
          </div>
        )}
        {!targetImage && (
          <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded text-[9px] text-zinc-400">
            ⚠ Connect model face image (face to swap)
          </div>
        )}
      </div>

      <div className="absolute -left-3 top-1/3 flex flex-col gap-8">
        <div className="relative">
          <Handle type="target" position={Position.Left} id="reference-image" className="!bg-pink-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Reference</span>
        </div>
        <div className="relative">
          <Handle type="target" position={Position.Left} id="target-image" className="!bg-pink-500 !static" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 uppercase font-bold whitespace-nowrap">Face</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-pink-500" />
    </div>
  );
};
