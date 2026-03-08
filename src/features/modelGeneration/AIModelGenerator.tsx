import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Sparkles, Wand2, RefreshCw, Download, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { ModelParameterSection } from './ModelParameterSection';
import { ModelPreviewSection } from './ModelPreviewSection';
import { ModelControlSection } from './ModelControlSection';
import { AppNodeData } from '../../types';

interface ModelGeneratorProps {
  id: string;
  data: AppNodeData;
  isGenerating?: boolean;
  onGenerate?: (params: any) => void;
}

export const AIModelGenerator: React.FC<ModelGeneratorProps> = ({
  id,
  data,
  isGenerating = false,
  onGenerate,
}) => {
  const [parameters, setParameters] = useState({
    gender: 'female',
    age: 'young',
    ethnicity: 'asian',
    pose: 'frontal',
    expression: 'neutral',
    style: 'realistic',
    lighting: 'soft-studio',
    environment: 'studio',
    cameraStyle: 'portrait-85mm',
  });
  const [name, setName] = useState('My Model');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const savedModels = useQuery(api.models.getModels) as { _id: string; name: string; imageUrl: string; parameters?: Record<string, string> }[] | undefined;
  const saveModelMutation = useMutation(api.models.saveModel);

  const getDisplayUrl = () => {
    const rawVal = Array.isArray(data.value) ? data.value[0] : data.value;
    if (typeof rawVal === 'object' && rawVal && 'url' in rawVal) {
      return (rawVal as { url: string }).url;
    }
    return typeof rawVal === 'string' ? rawVal : null;
  };

  const displayUrl = getDisplayUrl();

  const handleSaveModel = useCallback(async () => {
    const url = displayUrl;
    if (!url || !name.trim()) {
      toast.error('Generate an image and set a name before saving.');
      return;
    }
    try {
      await saveModelMutation({
        name: name.trim(),
        imageUrl: url,
        parameters: { ...parameters, additionalPrompt: additionalPrompt.trim() },
      });
      toast.success(`Model "${name}" saved. You can import it from AI Models.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save model');
    }
  }, [name, displayUrl, parameters, additionalPrompt, saveModelMutation]);

  const handleLoadSavedModel = useCallback((model: { name: string; imageUrl: string; parameters?: Record<string, unknown> }) => {
    setName(model.name);
    if (model.parameters && typeof model.parameters === 'object') {
      const p = model.parameters as Record<string, string>;
      setParameters((prev) => ({ ...prev, ...p }));
    }
    setSelectedSample(model.imageUrl);
    toast.success(`Loaded "${model.name}"`);
  }, []);

  const sampleImages = [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=2',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3',
    'https://images.unsplash.com/photo-1549492429-35d6f6b31a03?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=4',
    'https://images.unsplash.com/photo-1531123414780-f4c8f8e2a9d4?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=5',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=6',
  ];
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const handleParameterChange = useCallback((key: string, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback(() => {
    const prompt = buildPrompt(parameters, additionalPrompt);
    onGenerate?.({
      parameters,
      prompt,
      name,
      baseImageUrl: selectedSample,
    });
  }, [parameters, additionalPrompt, name, selectedSample, onGenerate]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-3 gap-4 auto-rows-max">
        {/* Header spans full width */}
        <div className="col-span-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-purple-400" size={24} />
            <h2 className="text-2xl font-bold text-white">AI Model Generator</h2>
          </div>
          <p className="text-sm text-purple-200/70">Create realistic model portraits. Select a sample image to start, or replace with your own.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white w-64" placeholder="Model name" />
            <div className="text-xs text-zinc-400">Generation cost: <span className="font-bold text-amber-400">50 credits</span></div>
            {savedModels && savedModels.length > 0 && (
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-purple-400" />
                <select
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const m = savedModels.find((x) => x._id === id);
                    if (m) handleLoadSavedModel(m);
                  }}
                  className="bg-zinc-900 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white max-w-[180px]"
                  value=""
                >
                  <option value="">Import saved model</option>
                  {savedModels.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Parameters - Left Column (2 rows) */}
        <ModelParameterSection
          parameters={parameters}
          onParameterChange={handleParameterChange}
        />

        {/* Preview - Right Column (2 rows, taller) */}
        <div className="col-span-2 row-span-2">
          <ModelPreviewSection
            displayUrl={displayUrl}
            isGenerating={isGenerating}
            parameters={parameters}
          />
          <div className="mt-3">
            <div className="text-xs text-zinc-400 mb-2">Sample images (click to select; replaceable):</div>
            <div className="grid grid-cols-6 gap-2">
              {sampleImages.map((s) => (
                <button key={s} onClick={() => setSelectedSample(s)} className={`rounded overflow-hidden border ${selectedSample === s ? 'border-emerald-500' : 'border-zinc-800'}`}>
                  <img src={s} className="w-24 h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional additional prompt */}
        <div className="col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Additional prompt (optional)</label>
          <textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="Any extra details: clothing, mood, props, specific look..."
            className="w-full bg-zinc-900/60 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 min-h-[80px] resize-y focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>

        {/* Control Section - Left Column, spans bottom */}
        <div className="col-span-1">
          <ModelControlSection
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onDelete={() => data.onDelete?.(id)}
            displayUrl={displayUrl}
            onSaveModel={displayUrl ? handleSaveModel : undefined}
          />
        </div>
      </div>
    </div>
  );
};

function buildPrompt(parameters: any, additionalPrompt: string): string {
  const {
    gender,
    age,
    ethnicity,
    pose,
    expression,
    style,
    lighting = 'soft-studio',
    environment = 'studio',
    cameraStyle = 'portrait-85mm',
  } = parameters;

  const lightingDesc: Record<string, string> = {
    'soft-studio': 'soft key lighting with fill, professional studio setup',
    'dramatic': 'dramatic shadows and high contrast, rim lighting',
    'golden-hour': 'golden hour sunlight, warm tones, natural glow',
    'neon': 'neon and artificial lighting, vibrant colors',
    'natural': 'natural daylight, soft shadows, authentic look',
    'low-key': 'low key lighting, moody and cinematic',
  };
  const envDesc: Record<string, string> = {
    'studio': 'clean studio environment, neutral backdrop',
    'urban': 'urban setting, city background',
    'nature': 'natural outdoor environment',
    'indoor': 'interior space, indoor setting',
    'abstract': 'abstract or minimal background',
    'luxury': 'luxury setting, premium atmosphere',
  };
  const cameraDesc: Record<string, string> = {
    'portrait-85mm': '85mm lens, shallow depth of field, portrait composition',
    'shallow-dof': 'shallow depth of field, bokeh background',
    'macro': 'macro detail, sharp focus on features',
    'wide': 'wide shot, environmental context',
    'commercial': 'commercial product photography style, clean and professional',
    'cinematic': 'cinematic composition, film-like quality',
  };

  const base = `Ultra-realistic photograph of a ${age} ${ethnicity} ${gender}, ${pose} pose with a ${expression} expression. ${style} photography style. ${lightingDesc[lighting] || lighting}. Environment: ${envDesc[environment] || environment}. Captured with ${cameraDesc[cameraStyle] || cameraStyle}. Highly detailed textures, realistic skin pores, natural lighting reflections, professional composition, 4K resolution, photorealistic quality, sharp focus.`;
  const extra = additionalPrompt.trim();
  return extra ? `${base} ${extra}` : base;
}
