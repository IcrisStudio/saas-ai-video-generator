import React, { useState, useCallback } from 'react';
import { Sparkles, Wand2, RefreshCw, Download } from 'lucide-react';
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
  });
  const [name, setName] = useState('My Model');
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
    const prompt = buildPrompt(parameters);
    onGenerate?.({
      parameters,
      prompt,
      name,
      baseImageUrl: selectedSample,
    });
  }, [parameters, onGenerate]);

  const getDisplayUrl = () => {
    const rawVal = Array.isArray(data.value) ? data.value[0] : data.value;
    if (typeof rawVal === 'object' && rawVal && 'url' in rawVal) {
      return rawVal.url;
    }
    return typeof rawVal === 'string' ? rawVal : null;
  };

  const displayUrl = getDisplayUrl();

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
          <div className="mt-4 flex items-center gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white w-64" placeholder="Model name" />
            <div className="text-xs text-zinc-400">Generation cost: <span className="font-bold text-amber-400">50 credits</span></div>
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

        {/* Control Section - Left Column, spans bottom */}
        <div className="col-span-1">
          <ModelControlSection
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onDelete={() => data.onDelete?.(id)}
            displayUrl={displayUrl}
          />
        </div>
      </div>
    </div>
  );
};

function buildPrompt(parameters: any): string {
  const {
    gender,
    age,
    ethnicity,
    pose,
    expression,
    style,
  } = parameters;

  return `Create a realistic portrait of a ${age} ${ethnicity} ${gender}, ${pose} pose with a ${expression} expression, in ${style} photography style, professional lighting, studio setting, sharp focus, detailed features`;
}
