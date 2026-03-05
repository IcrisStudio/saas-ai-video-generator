import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds
} from 'reactflow';
import * as htmlToImage from 'html-to-image';
import { Upload, Type, Sparkles, Video, Save, ChevronLeft, Wand2, MousePointer2, Plus, Edit2, X, Zap, Coins, MessageSquare, Volume2, User, Film } from 'lucide-react';
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';

import { UploadNode } from './UploadNode';
import { ImaginationNode } from './ImaginationNode';
import { OutputNode } from './OutputNode';
import { TextNode } from './TextNode';
import { VideoNode } from './VideoNode';
import { EnhancerNode } from './EnhancerNode';
import { GeminigenTextNode } from './GeminigenTextNode';
import { GeminigenTTSNode } from './GeminigenTTSNode';
import { ModelNode } from './ModelNode';
import { ExtractFrameNode } from './ExtractFrameNode';
import { FaceSwapNode } from './FaceSwapNode';
import { MediaGallery } from './MediaGallery';
import DeletableEdge from './DeletableEdge';
import { AppNode, AppNodeData, NodeType } from '../types';
import { generateGeminigenImage, generateGeminigenVideo, generateGeminigenText, generateGeminigenTTS, generateAIModel, generateFaceSwap } from '../services/geminigenService';
import { downloadAndUploadToConvex } from '../services/storageService';
import { cn } from '../lib/utils';
import { VIDEO_MODELS, TTS_MODELS, IMAGE_MODELS } from '../constants';

// Memoized outside component to prevent React Flow warning about new object instances
const nodeTypes = {
  upload: UploadNode,
  imagination: ImaginationNode,
  output: OutputNode,
  text: TextNode,
  video: VideoNode,
  enhancer: EnhancerNode,
  geminigenText: GeminigenTextNode,
  geminigenTTS: GeminigenTTSNode,
  aiModel: ModelNode,
  extractFrame: ExtractFrameNode,
  faceSwap: FaceSwapNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const EDGE_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
];

export function Flow() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const dbUser = (useQuery as any)("users:currentUser", user ? { clerkId: user.id } : "skip") as any;
  const project = (useQuery as any)("projects:get", { projectId: projectId as any }) as any;
  const updateProject = (useMutation as any)("projects:updateProject");
  const updatePreview = (useMutation as any)("projects:updatePreview");
  const generateUploadUrl = (useMutation as any)("projects:generateUploadUrl");
  const deductCredits = (useMutation as any)("credits:deduct");
  const saveVideo = (useMutation as any)("projects:saveVideo");
  const saveImage = (useMutation as any)("projects:saveImage");
  const uploadFile = (useMutation as any)("projects:uploadFile");
  const saveAiModel = (useMutation as any)("projects:saveAiModel");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null);
  const reactFlowInstance = useReactFlow();

  // Load project data
  useEffect(() => {
    if (project) {
      const loadData = async () => {
        try {
          let nodesData = project.nodes;
          let edgesData = project.edges;

          if (project.nodesUrl) {
            const res = await fetch(project.nodesUrl);
            nodesData = await res.text();
          }
          if (project.edgesUrl) {
            const res = await fetch(project.edgesUrl);
            edgesData = await res.text();
          }

          if (nodesData) setNodes(JSON.parse(nodesData));
          if (edgesData) setEdges(JSON.parse(edgesData));
          setIsLoading(false);
          // Reset unsaved changes after initial load
          setTimeout(() => setHasUnsavedChanges(false), 100);
        } catch (e) {
          console.error("Failed to parse project data", e);
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [project, setNodes, setEdges]);

  // Track unsaved changes
  const onNodesChangeWithTracking = useCallback((changes: any) => {
    onNodesChange(changes);
    if (changes.some((c: any) => c.type !== 'select')) {
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange]);

  const onEdgesChangeWithTracking = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.some((c: any) => c.type !== 'select')) {
      setHasUnsavedChanges(true);
    }
  }, [onEdgesChange]);

  const saveWorkflow = useCallback(async () => {
    if (!project) return;
    setIsSaving(true);
    const flow = reactFlowInstance.toObject();
    const nodesStr = JSON.stringify(flow.nodes);
    const edgesStr = JSON.stringify(flow.edges);

    const STORAGE_THRESHOLD = 800 * 1024; // 800KB threshold for storage

    let nodesStorageId = project.nodesStorageId;
    let edgesStorageId = project.edgesStorageId;

    const uploadToStorage = async (data: string) => {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      });
      const { storageId } = await result.json();
      return storageId;
    };

    try {
      const updatePayload: any = { projectId: project._id };

      // Collect and save all generated images and videos from output nodes
      const generatedMedia = { images: 0, videos: 0 };
      const savePromises: Promise<any>[] = [];

      flow.nodes.forEach((node: any) => {
        if (node.type === 'output' && node.data?.value && !node.data?.isSaved) {
          const val = node.data.value;
          const url = typeof val === 'string' ? val : (typeof val === 'object' && val?.url ? val.url : null);

          if (url && url.startsWith('https://')) {
            if (url.includes('.mp4') || url.startsWith('data:video')) {
              generatedMedia.videos++;
              // Save video: download & upload then save
              savePromises.push((async () => {
                try {
                  const uploaded = await downloadAndUploadToConvex(url, uploadFile, project._id);
                  const storageUrl = uploaded?.url || url;
                  const storageId = uploaded?.storageId || undefined;
                  return await saveVideo({
                    projectId,
                    videoUrl: storageUrl,
                    videoStorageId: storageId,
                    nodeId: node.id,
                    title: `Generated video - ${new Date().toLocaleString()}`,
                    prompt: node.data.params?.prompt || '',
                    model: node.data.params?.model || ''
                  });
                } catch (e) {
                  console.warn('Failed to save video:', e);
                }
              })());
            } else {
              generatedMedia.images++;
              // Save image: download & upload then save
              savePromises.push((async () => {
                try {
                  const uploaded = await downloadAndUploadToConvex(url, uploadFile, project._id);
                  const storageUrl = uploaded?.url || url;
                  const storageId = uploaded?.storageId || undefined;
                  return await saveImage({
                    projectId,
                    imageUrl: storageUrl,
                    imageStorageId: storageId,
                    nodeId: node.id,
                    title: `Generated image - ${new Date().toLocaleString()}`,
                    prompt: node.data.params?.prompt || '',
                    model: node.data.params?.model || ''
                  });
                } catch (e) {
                  console.warn('Failed to save image:', e);
                }
              })());
            }
          }
        }
      });

      // Await all save operations (fire in parallel)
      await Promise.all(savePromises);

      // Take a screenshot for preview
      try {
        const nodesBounds = getNodesBounds(flow.nodes);
        const viewport = getViewportForBounds(nodesBounds, 1200, 630, 0.5, 2.0, 0.1);

        const captureElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (captureElement) {
          try {
            const dataUrl = await htmlToImage.toJpeg(captureElement, {
              backgroundColor: '#000',
              width: 1200,
              height: 630,
              style: {
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              },
            });

            const storageId = await uploadToStorage(dataUrl);
            await updatePreview({ projectId: project._id, storageId });
          } catch (captureErr) {
            // Gracefully handle CORS/tainted canvas errors from external images
            console.warn('Could not capture preview (external images present):', captureErr);
            // Continue saving without updating preview
          }
        }
      } catch (previewErr) {
        console.warn('Preview capture failed:', previewErr);
      }

      if (nodesStr.length > STORAGE_THRESHOLD) {
        nodesStorageId = await uploadToStorage(nodesStr);
        updatePayload.nodesStorageId = nodesStorageId;
        updatePayload.nodes = ""; // Clear direct field
      } else {
        updatePayload.nodes = nodesStr;
      }

      if (edgesStr.length > STORAGE_THRESHOLD) {
        edgesStorageId = await uploadToStorage(edgesStr);
        updatePayload.edgesStorageId = edgesStorageId;
        updatePayload.edges = ""; // Clear direct field
      } else {
        updatePayload.edges = edgesStr;
      }

      await updateProject(updatePayload);
      setHasUnsavedChanges(false);

      const mediaMessage = generatedMedia.images > 0 || generatedMedia.videos > 0
        ? ` Saved ${generatedMedia.images} ${generatedMedia.images === 1 ? 'image' : 'images'} and ${generatedMedia.videos} ${generatedMedia.videos === 1 ? 'video' : 'videos'} to database.`
        : '';

      toast.success('Workspace Saved!', {
        description: 'Your changes are now synced to the cloud.' + mediaMessage,
      });
    } catch (error) {
      console.error("Failed to save workflow", error);
      toast.error("Failed to save workspace");
    } finally {
      setIsSaving(false);
    }
  }, [project, reactFlowInstance, updateProject, updatePreview, generateUploadUrl, saveImage, saveVideo]);

  const onConnect = useCallback(
    (params: Connection) => {
      const color = EDGE_COLORS[Math.floor(Math.random() * EDGE_COLORS.length)];
      setEdges((eds) => addEdge({
        ...params,
        type: 'deletable',
        style: { stroke: color, strokeWidth: 2 }
      }, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges]
  );

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onUpdateNode = useCallback((id: string, data: Partial<AppNodeData>) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, ...data } } : node));
    if (!data.isGenerating) {
      setHasUnsavedChanges(true);
    }
  }, [setNodes]);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setHasUnsavedChanges(true);
  }, [setNodes, setEdges]);

  const handleGenerate = useCallback(async (nodeId: string, extraParams?: any) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !dbUser) return;

    // Merge extra parameters from components like AIModelGenerator
    if (extraParams) {
      const mergedParams = {
        ...node.data.params,
        ...(extraParams.parameters || {}),
        ...(extraParams.baseImageUrl ? { baseImageUrl: extraParams.baseImageUrl } : {}),
        ...(extraParams.name ? { modelName: extraParams.name } : {}),
        prompt: extraParams.prompt || node.data.params?.prompt,
      };
      node.data = { ...node.data, params: mergedParams };
    }

    // Plan-based restrictions
    const userPlan = dbUser.plan || 'free';
    if (userPlan === 'free') {
      const restrictedModels = ['pro', 'ultra', 'veo'];
      const currentModel = node.data.params?.model || '';
      if (restrictedModels.some(m => currentModel.includes(m))) {
        toast.error("Premium Model Restricted", {
          description: "Free users can only access Flash models. Upgrade to Pro to unlock everything!"
        });
        return;
      }
    }

    const incomingEdges = edges.filter((e) => e.target === nodeId);
    const referenceImages: string[] = [];
    let firstFrame: string | undefined;
    let lastFrame: string | undefined;
    let extraPrompt: string = '';
    let refHistory: string | undefined;

    incomingEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source) as AppNode | undefined;
      const val = sourceNode?.data?.value;
      if (!sourceNode || !val) return;

      const extractString = (v: any): string => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && 'url' in v && typeof v.url === 'string') return v.url;
        return '';
      };

      const rawVal = Array.isArray(val) ? val[0] : val;
      const singleVal = extractString(rawVal);
      if (!singleVal) return;

      const isImage = (v: string) => v.startsWith('data:image') || v.match(/\.(jpeg|jpg|png|webp|gif)/i);
      const isVideo = (v: string) => v.startsWith('https://') || v.startsWith('data:video') || v.match(/\.(mp4|webm)/i);
      const isText = (v: string) => !isImage(v) && !isVideo(v);

      if (edge.targetHandle === 'first-frame') {
        firstFrame = singleVal;
      } else if (edge.targetHandle === 'last-frame') {
        lastFrame = singleVal;
      } else if (edge.targetHandle === 'text-input') {
        extraPrompt += ` ${Array.isArray(val) ? val.map(extractString).join(' ') : singleVal}`;
      } else if (edge.targetHandle === 'image-input') {
        if (Array.isArray(val)) referenceImages.push(...val.map(extractString).filter(Boolean));
        else referenceImages.push(singleVal);
      } else if (edge.targetHandle === 'inspiration-input') {
        firstFrame = singleVal;
      } else if (edge.targetHandle === 'face-input') {
        lastFrame = singleVal;
      } else if (edge.targetHandle === 'reference-image') {
        // Face swap: reference face
        referenceImages[0] = singleVal;
      } else if (edge.targetHandle === 'target-image') {
        // Face swap: target body
        referenceImages[1] = singleVal;
      } else if (edge.targetHandle === 'video-input') {
        // Extract frame: video input
        firstFrame = singleVal;
      } else {
        if (sourceNode.type === 'text') {
          extraPrompt += ` ${singleVal}`;
        } else if (sourceNode.type === 'upload' || sourceNode.type === 'aiModel') {
          if (Array.isArray(val)) referenceImages.push(...val.map(extractString).filter(Boolean));
          else referenceImages.push(singleVal);
        } else if (sourceNode.type === 'output') {
          if (isText(singleVal)) {
            extraPrompt += ` ${singleVal}`;
          } else {
            if (Array.isArray(val)) referenceImages.push(...val.map(extractString).filter(Boolean));
            else referenceImages.push(singleVal);

            // Extract history UUID for extensions
            const rawVal = Array.isArray(val) ? val[0] : val;
            if (typeof rawVal === 'object' && rawVal && 'uuid' in rawVal) {
              refHistory = (rawVal as any).uuid;
            }
          }
        }
      }
    });

    const finalPrompt = `${node.data.params?.prompt || ''} ${extraPrompt}`.trim();
    const model = node.data.params?.model || '';

    // Calculate cost before calling API
    let cost = 0;
    if (node.type === 'video') {
      const videoModel = VIDEO_MODELS.find(m => m.id === model);
      cost = videoModel ? videoModel.cost : 50;
    } else if (node.type === 'enhancer') {
      cost = 5;
    } else if (node.type === 'geminigenText') {
      cost = 5;
    } else if (node.type === 'geminigenTTS') {
      const currentModelId = node.data.params?.model || 'geminigen-tts';
      const ttsModel = TTS_MODELS.find(m => m.id === currentModelId);
      cost = ttsModel ? ttsModel.cost : 10;
    } else if (node.type === 'aiModel') {
      cost = 50;
    } else if (node.type === 'imagination') {
      const imageModel = IMAGE_MODELS.find(m => m.id === model);
      cost = imageModel ? imageModel.cost : 5;
    } else if (node.type === 'faceSwap') {
      cost = 25; // Face swap premium feature
    } else if (node.type === 'extractFrame') {
      cost = 0; // Free operation
    } else {
      cost = 15;
    }

    if (dbUser.credits < cost) {
      toast.error("Insufficient Credits", {
        description: `This operation requires ${cost} credits. You have ${dbUser.credits}.`
      });
      return;
    }

    onUpdateNode(nodeId, { isGenerating: true });

    const outputNodeId = `output-${Date.now()}`;
    const newOutputNode: AppNode = {
      id: outputNodeId,
      type: 'output',
      position: { x: node.position.x + 400, y: node.position.y },
      data: {
        label: 'Output',
        type: 'output',
        isGenerating: true,
        params: { aspectRatio: node.data.params?.aspectRatio || '1:1' },
        onDelete: onDeleteNode,
        onUpdate: onUpdateNode,
      },
    };

    setNodes((nds) => [...nds, newOutputNode]);
    setEdges((eds) => addEdge({
      id: `e-${nodeId}-${outputNodeId}`,
      source: nodeId,
      target: outputNodeId,
      type: 'deletable',
      style: { stroke: EDGE_COLORS[0], strokeWidth: 2 }
    }, eds));

    try {
      let resultUrl: string | { url: string; downloadUrl?: string } = '';

      if (node.type === 'video') {
        const videoRefs = [...referenceImages];
        if (firstFrame) videoRefs.unshift(firstFrame);
        if (lastFrame) videoRefs.push(lastFrame);

        resultUrl = await generateGeminigenVideo({
          prompt: finalPrompt,
          model: node.data.params?.model || 'veo-3.1-fast',
          aspect_ratio: node.data.params?.aspect_ratio,
          resolution: node.data.params?.resolution,
          duration: node.data.params?.duration,
          mode: node.data.params?.mode,
          ref_images: videoRefs,
          ref_history: refHistory
        });
      } else if (node.type === 'enhancer') {
        const enhanced = await generateGeminigenText({
          prompt: `Enhance this prompt for AI generation: ${extraPrompt || node.data.params?.prompt || ''}`,
          model: 'gemini-2.5-pro',
        });
        onUpdateNode(outputNodeId, { value: enhanced, isGenerating: false });
        onUpdateNode(nodeId, { isGenerating: false });
        await deductCredits({ userId: dbUser._id, amount: 5 });
        return;
      } else if (node.type === 'geminigenText') {
        resultUrl = await generateGeminigenText({
          prompt: finalPrompt,
          model: node.data.params?.model || 'gemini-2.5-pro',
          system_instruction: node.data.params?.systemInstruction,
        });
      } else if (node.type === 'geminigenTTS') {
        resultUrl = await generateGeminigenTTS({
          text: finalPrompt,
          model: node.data.params?.model || 'tts-1',
          voice: node.data.params?.voiceId || 'OA001',
        });
      } else if (node.type === 'aiModel') {
        // AI Model uses the same API as imagination node but with custom prompt
        const fileUrls = [...referenceImages];
        if (node.data.params?.baseImageUrl) fileUrls.push(node.data.params.baseImageUrl);
        resultUrl = await generateGeminigenImage({
          prompt: finalPrompt,
          model: model || 'nano-banana-pro',
          aspect_ratio: node.data.params?.aspectRatio,
          style: node.data.params?.style,
          resolution: node.data.params?.resolution,
          output_format: node.data.params?.outputFormat,
          file_urls: fileUrls
        });
      } else if (node.type === 'faceSwap') {
        // For face swap: referenceImages[0] is face, referenceImages[1] is body
        if (referenceImages.length < 2) {
          throw new Error("Face swap requires two images: a reference face and a target body");
        }
        resultUrl = await generateFaceSwap(
          referenceImages[0],
          referenceImages[1],
          node.data.params?.prompt || ''
        );
      } else if (node.type === 'extractFrame') {
        // Extract Frame doesn't need to create an output node - it updates itself
        onDeleteNode(outputNodeId);
        toast.info("Frame extraction complete");
        onUpdateNode(nodeId, { isGenerating: false });
        return;
      } else {
        resultUrl = await generateGeminigenImage({
          prompt: finalPrompt,
          model: model || 'nano-banana-pro',
          aspect_ratio: node.data.params?.aspectRatio,
          style: node.data.params?.style,
          resolution: node.data.params?.resolution,
          output_format: node.data.params?.outputFormat,
          file_urls: referenceImages
        });
      }

      onUpdateNode(outputNodeId, { value: resultUrl, isGenerating: false });

      // Save to Convex based on node type (download authenticated asset, upload to Convex storage)
      try {
        const url = typeof resultUrl === 'object' && resultUrl?.url ? resultUrl.url :
          typeof resultUrl === 'string' ? resultUrl : null;

        if (url && url.startsWith('https://')) {
          // Download and re-upload to Convex storage so we own a persistent copy
          const uploaded = await downloadAndUploadToConvex(url, uploadFile, projectId as string);
          const storageUrl = uploaded?.url || url;
          const storageId = uploaded?.storageId || null;

          if (node.type === 'video') {
            // Save video with storage id when available
            const savedId = await saveVideo({
              projectId,
              videoUrl: storageUrl,
              videoStorageId: storageId || undefined,
              nodeId: outputNodeId,
              title: `Generated video - ${new Date().toLocaleString()}`,
              prompt: finalPrompt,
              model: node.data.params?.model
            });
            onUpdateNode(outputNodeId, { isSaved: true, savedId });
            toast.success("Video saved to Convex database!");
          } else if (node.type === 'imagination' || node.type === 'aiModel' || node.type === 'faceSwap') {
            // Save image with storage id when available
            const savedId = await saveImage({
              projectId,
              imageUrl: storageUrl,
              imageStorageId: storageId || undefined,
              nodeId: outputNodeId,
              title: `Generated image - ${new Date().toLocaleString()}`,
              prompt: finalPrompt,
              model
            });
            onUpdateNode(outputNodeId, { isSaved: true, savedId });
            toast.success("Image saved to Convex database!");
          }
        }
      } catch (e) {
        console.warn('Failed to save output to Convex:', e);
        // Don't fail the generation if saving fails
      }

      await deductCredits({ userId: dbUser._id, amount: cost });
      toast.success("Generation Complete!");
    } catch (error: any) {
      console.error('Generation failed:', error);
      onDeleteNode(outputNodeId);
      toast.error("Generation Failed", {
        description: error.message || "Something went wrong. Please try again."
      });
    } finally {
      onUpdateNode(nodeId, { isGenerating: false });
    }
  }, [nodes, edges, dbUser, onDeleteNode, onUpdateNode, setNodes, setEdges, deductCredits, projectId, saveVideo, saveImage]);

  const addNode = useCallback((type: NodeType, x?: number, y?: number) => {
    const id = `${type}-${Date.now()}`;

    let position;
    if (x !== undefined && y !== undefined) {
      position = reactFlowInstance.screenToFlowPosition({ x, y });
    } else {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      position = reactFlowInstance.screenToFlowPosition({ x: centerX, y: centerY });
    }

    const newNode: AppNode = {
      id,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        onDelete: onDeleteNode,
        onUpdate: onUpdateNode,
        onGenerate: handleGenerate,
        onPreview: (url: string) => setPreviewImage(url),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
    setMenu(null);
  }, [onDeleteNode, onUpdateNode, handleGenerate, reactFlowInstance, setNodes]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: { ...node.data, onDelete: onDeleteNode, onUpdate: onUpdateNode, onGenerate: handleGenerate, onPreview: (url: string) => setPreviewImage(url) },
    }));
  }, [nodes, onDeleteNode, onUpdateNode, handleGenerate]);

  const handleRename = async () => {
    if (!project) return;
    const newName = prompt("Enter new project name:", project.name);
    if (newName && newName !== project.name) {
      await updateProject({ projectId: project._id, name: newName });
      toast.success("Project renamed!");
    }
  };

  return (
    <div className="w-full h-full relative" onContextMenu={onContextMenu}>
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-400 font-bold animate-pulse">Loading Workspace...</p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChangeWithTracking}
        onEdgesChange={onEdgesChangeWithTracking}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#52525b" gap={40} size={2} variant="dots" />
        <Controls />

        <Panel position="top-left" className="!m-0 w-full">
          <div className="flex items-center justify-between bg-zinc-900/95 backdrop-blur-2xl border-b border-zinc-800/50 px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all group"
                title="Back to Dashboard"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <div className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                  {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-0.5">
                  <button onClick={() => addNode('upload')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <Upload size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Upload</span>
                  </button>
                  <button onClick={() => addNode('text')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <Type size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Text</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-zinc-800 mx-1" />

                <div className="flex items-center gap-0.5">
                  <button onClick={() => addNode('imagination')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <Sparkles size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Imagine</span>
                  </button>
                  <button onClick={() => addNode('video')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-purple-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <Video size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Video</span>
                  </button>
                  <button onClick={() => addNode('enhancer')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <Wand2 size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Enhance</span>
                  </button>
                  <button onClick={() => addNode('aiModel')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]">
                    <User size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tight">Model</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-zinc-800 mx-1" />

                <button
                  onClick={saveWorkflow}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={cn(
                    "p-2 rounded-lg transition-all flex flex-col items-center gap-1 px-3 group cursor-pointer min-w-[50px]",
                    hasUnsavedChanges
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
                      : "bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 opacity-50 cursor-not-allowed"
                  )}
                  title={hasUnsavedChanges ? "Save all changes and media to database" : "No unsaved changes"}
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span className="text-[8px] font-black uppercase tracking-tight">{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>

              {dbUser && (
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                  <Coins size={14} className="text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-amber-500 leading-none">{dbUser.credits}</span>
                    <span className="text-[7px] text-amber-500/60 font-bold uppercase tracking-widest">Credits</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {previewImage && (
        <div
          className="fixed inset-0 z-[2000] bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-4xl h-full max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center relative">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-zinc-950/50 hover:bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center text-white transition-all shadow-xl cursor-pointer z-10"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {menu && (
        <div
          className="fixed z-[1000] bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl min-w-[180px] backdrop-blur-xl"
          style={{ top: menu.y, left: menu.x }}
        >
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 border-b border-zinc-800 mb-1">
            Add Node
          </div>
          <button onClick={() => addNode('upload', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Upload size={16} /> Upload
          </button>
          <button onClick={() => addNode('text', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Type size={16} /> Text
          </button>
          <button onClick={() => addNode('imagination', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Sparkles size={16} /> Imagine
          </button>
          <button onClick={() => addNode('video', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Video size={16} /> Video
          </button>
          <button onClick={() => addNode('geminigenText', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-xl transition-all">
            <MessageSquare size={16} /> Geminigen Text
          </button>
          <button onClick={() => addNode('geminigenTTS', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Volume2 size={16} /> Text To Speech
          </button>
          <button onClick={() => addNode('enhancer', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Wand2 size={16} /> Enhance
          </button>
          <button onClick={() => addNode('extractFrame', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Film size={16} /> Extract Frame
          </button>
          <button onClick={() => addNode('faceSwap', menu.x, menu.y)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded-xl transition-all">
            <Wand2 size={16} /> Face Swap
          </button>
        </div>
      )}

      <MediaGallery projectId={projectId} />
    </div>
  );
}
