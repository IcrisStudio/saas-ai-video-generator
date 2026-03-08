import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ModelParameterSectionProps {
  parameters: Record<string, string>;
  onParameterChange: (key: string, value: string) => void;
}

const parameterOptions = {
  gender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
  ],
  age: [
    { value: 'child', label: 'Child (5-12)' },
    { value: 'young', label: 'Young (13-25)' },
    { value: 'adult', label: 'Adult (26-40)' },
    { value: 'mature', label: 'Mature (41-60)' },
    { value: 'elder', label: 'Elder (60+)' },
  ],
  ethnicity: [
    { value: 'african', label: 'African' },
    { value: 'asian', label: 'Asian' },
    { value: 'caucasian', label: 'Caucasian' },
    { value: 'hispanic', label: 'Hispanic' },
    { value: 'middle-eastern', label: 'Middle Eastern' },
    { value: 'mixed', label: 'Mixed' },
  ],
  pose: [
    { value: 'frontal', label: 'Frontal' },
    { value: '3/4', label: '3/4 Profile' },
    { value: 'side', label: 'Side Profile' },
    { value: 'looking-down', label: 'Looking Down' },
    { value: 'looking-up', label: 'Looking Up' },
  ],
  expression: [
    { value: 'neutral', label: 'Neutral' },
    { value: 'happy', label: 'Happy' },
    { value: 'serious', label: 'Serious' },
    { value: 'sad', label: 'Sad' },
    { value: 'surprised', label: 'Surprised' },
    { value: 'angry', label: 'Angry' },
  ],
  style: [
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'illustrated', label: 'Illustrated' },
    { value: 'anime', label: 'Anime' },
  ],
  lighting: [
    { value: 'soft-studio', label: 'Soft studio' },
    { value: 'dramatic', label: 'Dramatic shadows' },
    { value: 'golden-hour', label: 'Golden hour' },
    { value: 'neon', label: 'Neon / artificial' },
    { value: 'natural', label: 'Natural daylight' },
    { value: 'low-key', label: 'Low key' },
  ],
  environment: [
    { value: 'studio', label: 'Studio' },
    { value: 'urban', label: 'Urban' },
    { value: 'nature', label: 'Nature' },
    { value: 'indoor', label: 'Indoor' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'luxury', label: 'Luxury' },
  ],
  cameraStyle: [
    { value: 'portrait-85mm', label: '85mm portrait' },
    { value: 'shallow-dof', label: 'Shallow DOF' },
    { value: 'macro', label: 'Macro' },
    { value: 'wide', label: 'Wide shot' },
    { value: 'commercial', label: 'Product commercial' },
    { value: 'cinematic', label: 'Cinematic' },
  ],
};

export const ModelParameterSection: React.FC<ModelParameterSectionProps> = ({
  parameters,
  onParameterChange,
}) => {
  const renderParameterGroup = (key: string, label: string) => (
    <div key={key} className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-purple-300">
        {label}
      </label>
      <div className="relative">
        <select
          value={parameters[key]}
          onChange={(e) => onParameterChange(key, e.target.value)}
          className="w-full bg-zinc-900/60 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white appearance-none cursor-pointer hover:border-purple-500/50 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
        >
          {parameterOptions[key as keyof typeof parameterOptions]?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" size={14} />
      </div>
    </div>
  );

  return (
    <div className="col-span-1 row-span-2 bg-zinc-900/40 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm space-y-4 h-fit">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
        Parameters
      </h3>

      <div className="space-y-4">
        {renderParameterGroup('gender', 'Gender')}
        {renderParameterGroup('age', 'Age Range')}
        {renderParameterGroup('ethnicity', 'Ethnicity')}
        {renderParameterGroup('pose', 'Pose')}
        {renderParameterGroup('expression', 'Expression')}
        {renderParameterGroup('style', 'Style')}
        {renderParameterGroup('lighting', 'Lighting')}
        {renderParameterGroup('environment', 'Environment')}
        {renderParameterGroup('cameraStyle', 'Camera')}
      </div>
    </div>
  );
};
