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
import { useMutation, useQuery, useAction } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';

import { UploadNode } from '../nodes/UploadNode';
import { ImaginationNode } from '../nodes/ImaginationNode';
import { OutputNode } from '../nodes/OutputNode';
import { TextNode } from '../nodes/TextNode';
import { VideoNode } from '../nodes/VideoNode';
import { EnhancerNode } from '../nodes/EnhancerNode';
import { GeminigenTextNode } from '../nodes/GeminigenTextNode';
import { GeminigenTTSNode } from '../nodes/GeminigenTTSNode';
import { ModelNode } from '../nodes/ModelNode';
import { ExtractFrameNode } from '../nodes/ExtractFrameNode';
import { FaceSwapNode } from '../nodes/FaceSwapNode';
import { MediaGallery } from '../components/MediaGallery';
import { FlowNavbar } from '../components/FlowNavbar';
import { WorkspaceChatPanel } from '../components/WorkspaceChatPanel';
import DeletableEdge from '../nodes/DeletableEdge';
import { AppNode, AppNodeData, NodeType } from '../types';
import { generateGeminigenImage, generateGeminigenVideo, generateGeminigenText, generateGeminigenTTS, generateAIModel, generateFaceSwap, unifiedGenerate } from '../services/geminigenService';
import { clientFetchAndUploadToR2, uploadWorkflowToR2, uploadWorkflowPreviewToR2 } from '../services/storageService';
import { api } from "../../convex/_generated/api";
import { cn } from '../lib/utils';
import { VIDEO_MODELS, TTS_MODELS, IMAGE_MODELS } from '../constants';
import { PROMPT_ENGINEER_SYSTEM } from '../constants/promptEngineerPrompt';

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
  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
  const project = useQuery(api.projects.get, projectId ? { projectId: projectId as any } : "skip") as any;
  const updateProject = useMutation(api.projects.updateProject);
  const updatePreview = useMutation(api.projects.updatePreview);
  const deleteStorageFile = useMutation(api.projects.deleteStorageFile);
  const saveGeneration = useMutation(api.generations.save);
  const saveImage = useMutation(api.projects.saveImage);
  const saveVideo = useMutation(api.projects.saveVideo);
  const useChatCreditsMutation = useMutation(api.users.useChatCredits);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  // Load project data (nodes/edges via proxy to avoid R2 CORS; or inline fallback)
  useEffect(() => {
    if (!project) return;
    const loadData = async () => {
      try {
        let nodesArray: unknown[] | null = null;
        let edgesArray: unknown[] | null = null;
        const isFullUrl = (u: string) => typeof u === "string" && u.startsWith("http") && u.includes("/");
        const fetchOpts: RequestInit = { cache: "no-store" }; // avoid 304 with empty body
        const fetchUrl = (url: string) =>
          url.includes("r2.dev") || url.includes("r2.cloudflarestorage")
            ? fetch(`/api/proxy-workflow?url=${encodeURIComponent(url)}`, fetchOpts)
            : fetch(url, fetchOpts);

        const parseJsonArray = (text: string): unknown[] | null => {
          const trimmed = text?.trim();
          if (!trimmed) return null;
          try {
            const parsed = JSON.parse(trimmed) as unknown;
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        };

        if (project.nodesUrl && isFullUrl(project.nodesUrl)) {
          try {
            const res = await fetchUrl(project.nodesUrl);
            if (res.ok) {
              const text = await res.text();
              const parsed = parseJsonArray(text);
              if (parsed) nodesArray = parsed;
            }
          } catch (_) {}
        }
        if (!nodesArray && project.nodes) {
          const parsed = parseJsonArray(project.nodes);
          if (parsed) nodesArray = parsed;
        }

        if (project.edgesUrl && isFullUrl(project.edgesUrl)) {
          try {
            const res = await fetchUrl(project.edgesUrl);
            if (res.ok) {
              const text = await res.text();
              const parsed = parseJsonArray(text);
              if (parsed) edgesArray = parsed;
            }
          } catch (_) {}
        }
        if (!edgesArray && project.edges) {
          const parsed = parseJsonArray(project.edges);
          if (parsed) edgesArray = parsed;
        }

        if (nodesArray) setNodes(nodesArray as any);
        else setNodes([]);
        if (edgesArray) setEdges(edgesArray as any);
        else setEdges([]);
        setIsLoading(false);
        setTimeout(() => setHasUnsavedChanges(false), 100);
      } catch (e) {
        console.error("Failed to load project data", e);
        setIsLoading(false);
        setNodes([]);
        setEdges([]);
      }
    };
    loadData();
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

    try {
      const updatePayload: any = { projectId: project._id };

      // Collect and save all generated images and videos from output nodes (avoid duplicates)
      const generatedMedia = { images: 0, videos: 0 };
      const savedNodeIds: string[] = [];

      for (const node of flow.nodes) {
        if (node.type !== 'output' || !node.data?.value || node.data?.isSaved) continue;
        const val = node.data.value;
        const url = typeof val === 'string' ? val : (typeof val === 'object' && val?.url ? val.url : null);
        if (!url || !url.startsWith('https://')) continue;

        let storageUrl = url;
        let storageId: string | undefined;
        const isAlreadyStored = url.includes('r2.dev') || url.includes('r2.cloudflarestorage');
        if (!isAlreadyStored) {
          try {
            const uploaded = await clientFetchAndUploadToR2(url);
            storageUrl = uploaded.url;
            storageId = uploaded.storageId;
          } catch (e) {
            console.warn('Failed to upload media for node:', node.id, e);
            continue;
          }
        }

        try {
          if (url.includes('.mp4') || url.startsWith('data:video')) {
            generatedMedia.videos++;
            await saveVideo({
              projectId: project._id,
              videoUrl: storageUrl,
              videoStorageId: storageId || undefined,
              nodeId: node.id,
              title: `Generated video - ${new Date().toLocaleString()}`,
              prompt: node.data.params?.prompt || '',
              model: node.data.params?.model || ''
            });
          } else {
            generatedMedia.images++;
            await saveImage({
              projectId: project._id,
              imageUrl: storageUrl,
              imageStorageId: storageId || undefined,
              nodeId: node.id,
              title: `Generated image - ${new Date().toLocaleString()}`,
              prompt: node.data.params?.prompt || '',
              model: node.data.params?.model || ''
            });
          }
          savedNodeIds.push(node.id);
        } catch (e) {
          console.warn('Failed to save to DB for node:', node.id, e);
        }
      }

      // Mark saved nodes in state to prevent duplicate saves on next save
      if (savedNodeIds.length > 0) {
        setNodes((nds) =>
          nds.map((n) =>
            savedNodeIds.includes(n.id)
              ? { ...n, data: { ...n.data, isSaved: true } }
              : n
          )
        );
      }

      // Preview: upload to R2 with fixed key (overwrites old preview, no duplicate storage)
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
            const blob = await (await fetch(dataUrl)).blob();
            const previewUrl = await uploadWorkflowPreviewToR2(project._id, blob);
            await updatePreview({ projectId: project._id, storageId: previewUrl });
          } catch (captureErr) {
            console.warn('Could not capture preview (external images present):', captureErr);
          }
        }
      } catch (previewErr) {
        console.warn('Preview capture failed:', previewErr);
      }

      const finalNodes = flow.nodes.map((n) =>
        savedNodeIds.includes(n.id) ? { ...n, data: { ...n.data, isSaved: true } } : n
      );
      const finalNodesStr = JSON.stringify(finalNodes);

      // 1. Upload new workflow to R2 (fixed key per project = overwrites previous, no duplicate)
      const { nodesUrl, edgesUrl } = await uploadWorkflowToR2(
        project._id,
        finalNodesStr,
        edgesStr
      );
      updatePayload.nodesStorageId = nodesUrl;
      updatePayload.edgesStorageId = edgesUrl;
      updatePayload.nodes = "";
      updatePayload.edges = "";

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
  }, [project, reactFlowInstance, updateProject, updatePreview, saveImage, saveVideo, setNodes]);

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
      const costPerImage = imageModel ? imageModel.cost : 5;
      const quantity = Math.min(4, Math.max(1, Number(node.data.params?.quantity) || 1));
      cost = costPerImage * quantity;
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

    const outputCount = node.type === 'imagination'
      ? Math.min(4, Math.max(1, Number(node.data.params?.quantity) || 1))
      : 1;
    const costPerCall = outputCount > 1 ? cost / outputCount : cost;
    const ts = Date.now();
    const outputNodeIds: string[] = Array.from({ length: outputCount }, (_, i) =>
      outputCount === 1 ? `output-${ts}` : `output-${ts}-${i}`
    );

    const newOutputNodes: AppNode[] = outputNodeIds.map((id, i) => ({
      id,
      type: 'output' as const,
      position: { x: node.position.x + 400 + i * 140, y: node.position.y },
      data: {
        label: 'Output',
        type: 'output',
        isGenerating: true,
        params: { aspectRatio: node.data.params?.aspectRatio || '1:1' },
        onDelete: onDeleteNode,
        onUpdate: onUpdateNode,
      },
    }));

    setNodes((nds) => [...nds, ...newOutputNodes]);
    setEdges((eds) => {
      let next = eds;
      for (const outId of outputNodeIds) {
        next = addEdge({
          id: `e-${nodeId}-${outId}`,
          source: nodeId,
          target: outId,
          type: 'deletable',
          style: { stroke: EDGE_COLORS[0], strokeWidth: 2 }
        }, next);
      }
      return next;
    });

    try {
      let type: "image" | "video" | "text" | "audio" = "image";
      let params: any = {};

      if (node.type === 'video') {
        type = "video";
        const videoRefs = [...referenceImages];
        if (firstFrame) videoRefs.unshift(firstFrame);
        if (lastFrame) videoRefs.push(lastFrame);
        params = {
          prompt: finalPrompt,
          model: node.data.params?.model || 'veo-3.1-fast',
          aspect_ratio: node.data.params?.aspect_ratio,
          resolution: node.data.params?.resolution,
          duration: node.data.params?.duration,
          mode: node.data.params?.mode,
          ref_images: videoRefs,
          ref_history: refHistory
        };
      } else if (node.type === 'enhancer') {
        type = "text";
        params = {
          prompt: `Enhance this prompt for AI generation: ${extraPrompt || node.data.params?.prompt || ''}`,
          model: 'gemini-2.5-pro',
        };
      } else if (node.type === 'geminigenText') {
        type = "text";
        params = {
          prompt: finalPrompt,
          model: node.data.params?.model || 'gemini-2.5-pro',
          system_instruction: node.data.params?.systemInstruction,
        };
      } else if (node.type === 'geminigenTTS') {
        type = "audio";
        params = {
          text: finalPrompt,
          model: node.data.params?.model || 'tts-1',
          voice: node.data.params?.voiceId || 'OA001',
        };
      } else if (node.type === 'faceSwap') {
        if (referenceImages.length < 2) {
          throw new Error("Face swap requires two images: a reference face and a target body");
        }
        type = "image";
        params = {
          prompt: `Realistic face swap between ${referenceImages[0]} and ${referenceImages[1]}. ${node.data.params?.prompt || ''}`,
          model: "nano-banana-pro",
          file_urls: [referenceImages[0], referenceImages[1]]
        };
      } else if (node.type === 'aiModel') {
        type = "image";
        const fileUrls = [...referenceImages];
        if (node.data.params?.baseImageUrl) fileUrls.push(node.data.params.baseImageUrl);
        params = {
          prompt: finalPrompt,
          model: model || 'nano-banana-pro',
          aspect_ratio: node.data.params?.aspectRatio,
          style: node.data.params?.style,
          resolution: node.data.params?.resolution,
          output_format: node.data.params?.outputFormat,
          file_urls: fileUrls
        };
      } else {
        type = "image";
        params = {
          prompt: finalPrompt,
          model: model || 'nano-banana-pro',
          aspect_ratio: node.data.params?.aspectRatio,
          style: node.data.params?.style,
          resolution: node.data.params?.resolution,
          output_format: node.data.params?.outputFormat,
          file_urls: referenceImages
        };
      }

      if (outputCount === 1) {
        const { url: finalUrl, storageId } = await unifiedGenerate({
          userId: dbUser._id,
          type,
          params,
          cost: costPerCall,
          onStore: saveGeneration,
        });
        onUpdateNode(outputNodeIds[0], { value: finalUrl, isGenerating: false, isSaved: true, storageId, mediaType: type });
        toast.success("Generation Complete & Saved!");
      } else {
        const results = await Promise.all(
          Array.from({ length: outputCount }, () =>
            unifiedGenerate({
              userId: dbUser._id,
              type,
              params,
              cost: costPerCall,
              onStore: saveGeneration,
            })
          )
        );
        results.forEach((result, i) => {
          onUpdateNode(outputNodeIds[i], {
            value: result.url,
            isGenerating: false,
            isSaved: true,
            storageId: result.storageId,
            mediaType: type,
          });
        });
        toast.success(`${outputCount} images generated & saved!`);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      outputNodeIds.forEach((id) => onDeleteNode(id));
      toast.error("Generation Failed", {
        description: error.message || "Something went wrong. Please try again."
      });
    } finally {
      onUpdateNode(nodeId, { isGenerating: false });
    }
  }, [nodes, edges, dbUser, onDeleteNode, onUpdateNode, setNodes, setEdges, saveGeneration]);

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

  const workspaceSystemPrompt = useMemo(() => {
    const nodeList = nodes
      .filter((n) => n.type !== "output")
      .map((n) => {
        const d = n.data as AppNodeData;
        const prompt = d.params?.prompt ? ` prompt: "${String(d.params.prompt).slice(0, 80)}..."` : "";
        return `- ${n.type} (id: ${n.id})${prompt}`;
      })
      .join("\n");
    const edgeList = edges.map((e) => `  ${e.source} -> ${e.target}`).join("\n");
    return `${PROMPT_ENGINEER_SYSTEM}

WORKSPACE CONTEXT (for node suggestions and copy-paste prompts):
Current workspace:
Nodes:
${nodeList || "(none)"}
Edges:
${edgeList || "(none)"}

When the user asks to add a node (e.g. "I want the model to wear this dress"), reply with your enhanced prompt in friendly text, then add exactly one JSON line at the end with no other text on that line:
- suggestedAction: "add_node"
- nodeType: one of upload, imagination, text, video, enhancer
- prompt: your full detailed prompt (for imagination) or empty for upload
- connectToNodeId: node id to connect FROM if relevant

Example: {"suggestedAction":"add_node","nodeType":"imagination","prompt":"Ultra-realistic photograph of a model wearing a red dress, standing in a studio, soft key lighting, 85mm lens, shallow depth of field, 4K photorealistic","connectToNodeId":"upload-123"}

When the user only wants to enhance a prompt (no new node), output the enhanced prompt in a clear block they can copy. Do not add the JSON line in that case.`;
  }, [nodes, edges]);

  const selectedNodeSummary = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const d = node.data as AppNodeData;
    const prompt = d.params?.prompt ? `Current prompt: ${String(d.params.prompt)}` : "No prompt set.";
    return `Node id: ${node.id}, type: ${node.type}. ${prompt}`;
  }, [selectedNodeId, nodes]);

  const handleApproveSuggestion = useCallback(
    (action: { suggestedAction: string; nodeType?: string; prompt?: string; connectToNodeId?: string }) => {
      if (action.suggestedAction !== "add_node" || !action.nodeType) return;
      const type = action.nodeType as NodeType;
      const validTypes: NodeType[] = ["upload", "imagination", "output", "text", "video", "enhancer", "geminigenText", "geminigenTTS", "aiModel", "extractFrame", "faceSwap"];
      if (!validTypes.includes(type)) return;

      const sourceId = action.connectToNodeId && nodes.some((n) => n.id === action.connectToNodeId) ? action.connectToNodeId : null;
      let position = { x: 400, y: 200 };
      if (sourceId) {
        const source = nodes.find((n) => n.id === sourceId);
        if (source) position = { x: source.position.x + 320, y: source.position.y };
      }
      const newId = `${type}-${Date.now()}`;
      const newNode: AppNode = {
        id: newId,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          type,
          params: action.prompt ? { prompt: action.prompt } : undefined,
          onDelete: onDeleteNode,
          onUpdate: onUpdateNode,
          onGenerate: handleGenerate,
          onPreview: (url: string) => setPreviewImage(url),
        },
      };
      setNodes((nds) => [...nds, newNode]);
      if (sourceId) {
        setEdges((eds) =>
          addEdge(
            {
              id: `e-${sourceId}-${newId}`,
              source: sourceId,
              target: newId,
              type: "deletable",
              style: { stroke: EDGE_COLORS[0], strokeWidth: 2 },
            },
            eds
          )
        );
      }
      setHasUnsavedChanges(true);
      toast.success(`Added ${type} node${action.prompt ? " with suggested prompt" : ""}`);
    },
    [nodes, onDeleteNode, onUpdateNode, handleGenerate, setNodes, setEdges]
  );

  const handleApplyPromptToNode = useCallback(
    (nodeId: string, prompt: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      onUpdateNode(nodeId, {
        params: { ...(node.data?.params || {}), prompt },
      });
      setHasUnsavedChanges(true);
      toast.success("Prompt applied to node");
    },
    [nodes, onUpdateNode]
  );

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
      {isSaving && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-6 py-8 rounded-2xl bg-zinc-900/90 border border-zinc-700 shadow-2xl">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-white font-semibold">Saving your workflow</p>
            <p className="text-zinc-400 text-sm">Syncing to cloud...</p>
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
        onSelectionChange={({ nodes: selected }) => {
          const id = selected.length === 1 ? selected[0].id : null;
          setSelectedNodeId(id);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#52525b" gap={40} size={2} variant="dots" />
        <Controls />

        <FlowNavbar
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={saveWorkflow}
          onAddNode={(type) => addNode(type as NodeType)}
          dbUser={dbUser}
        />
      </ReactFlow>

      <WorkspaceChatPanel
        systemPrompt={workspaceSystemPrompt}
        selectedNodeSummary={selectedNodeSummary}
        selectedNodeId={selectedNodeId}
        onApproveSuggestion={handleApproveSuggestion}
        onApplyPromptToNode={handleApplyPromptToNode}
        dbUser={dbUser}
        useChatCredits={useChatCreditsMutation}
        onCreditsUsed={(freeUsed, creditsUsed, freeRemaining) => {
          if (freeUsed) {
            toast.info(`Free message (${freeRemaining} free left)`);
          } else if (creditsUsed > 0) {
            toast.info(`${creditsUsed} credit${creditsUsed === 1 ? "" : "s"} used for this response`);
          }
        }}
      />

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
