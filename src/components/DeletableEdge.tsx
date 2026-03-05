import React from 'react';
import { getBezierPath, EdgeProps, useReactFlow } from 'reactflow';
import { X } from 'lucide-react';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <button
            className="flex items-center justify-center w-4 h-4 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-red-400 hover:border-red-500 transition-all shadow-lg cursor-pointer"
            onClick={onEdgeClick}
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
