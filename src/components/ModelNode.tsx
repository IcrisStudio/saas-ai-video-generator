import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { AIModelGenerator } from '../features/modelGeneration';
import { AppNodeData } from '../types';

interface ModelNodeProps {
  id: string;
  data: AppNodeData;
  isGenerating?: boolean;
}

export const ModelNode: React.FC<ModelNodeProps> = ({ 
  id, 
  data,
  isGenerating = false
}) => {
  const handleGenerate = useCallback((params: any) => {
    data.onGenerate?.(id, params);
  }, [id, data]);

  return (
    <div className="relative">
      <div className="nodrag bg-zinc-950/80 border border-purple-500/20 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 min-h-screen overflow-y-auto">
          <AIModelGenerator
            id={id}
            data={data}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  );
};
