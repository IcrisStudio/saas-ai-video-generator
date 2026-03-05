import { Node, Edge } from 'reactflow';

export type NodeType = 'upload' | 'imagination' | 'output' | 'text' | 'video' | 'enhancer' | 'geminigenText' | 'geminigenTTS' | 'aiModel' | 'extractFrame' | 'faceSwap';

export interface AppNodeData {
  label: string;
  type: NodeType;
  value?: string | string[] | { url: string; downloadUrl?: string; uuid?: string };
  isGenerating?: boolean;
  isSaved?: boolean; // Track if output is saved to Convex
  savedId?: string; // ID of the saved record in Convex
  params?: {
    prompt?: string;
    aspectRatio?: string;
    aspect_ratio?: string;
    model?: string;
    resolution?: string;
    duration?: number;
    mode?: string;
    upscaleFactor?: number;
    quality?: string;
    voiceId?: string;
    speed?: number;
    systemInstruction?: string;
    style?: string;
    outputFormat?: string;
    frameTime?: number;
  };
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: Partial<AppNodeData>) => void;
  onGenerate?: (id: string) => void;
  onPreview?: (url: string) => void;
}

export type AppNode = Node<AppNodeData>;
export type AppEdge = Edge;
