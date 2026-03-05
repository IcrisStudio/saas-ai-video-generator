import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Sparkles,
  Camera,
  Palette,
  Zap,
  ChevronRight,
  ChevronLeft,
  Save,
  RefreshCw,
  Check,
  Info,
  ArrowLeft,
  Globe,
  Scissors,
  Shirt,
  Sun,
  Moon,
  Cloud,
  Home,
  Building,
  Mountain,
  Star,
  Smile
} from 'lucide-react';
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAIModel } from '../services/geminigenService';
import { cn } from '../lib/utils';
import {
  ETHNICITIES,
  HAIR_STYLES,
  OUTFITS,
  LIGHTING_STYLES,
  BACKGROUNDS,
  EXPRESSIONS,
  AGE_RANGES
} from '../constants/aiModelOptions';

const STEPS = [
  { id: 'subject', label: 'Subject', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'environment', label: 'Environment', icon: Camera },
  { id: 'render', label: 'Render', icon: Sparkles },
];

const INITIAL_PARAMS = {
  subject: {
    gender: 'female',
    age_range: '20-28',
    ethnicity: 'caucasian',
    hair_color: 'Brunette',
    hair_style: 'long_wavy',
    eye_color: 'Brown',
    expression: 'natural_smile',
    pose: 'front-facing, straight posture',
    framing: 'passport-style head and shoulders portrait'
  },
  appearance: {
    skin_texture: 'natural skin texture, visible pores, light blemishes, realistic detail',
    makeup: 'minimal, natural look',
    outfit: 'casual_hoodie',
    accessories: 'subtle minimal jewelry (optional)'
  },
  lighting: {
    type: 'soft_studio',
    style: 'even facial lighting, no harsh shadows'
  },
  background: {
    color: 'clean white',
    style: 'minimal_studio'
  },
  camera: {
    quality: 'ultra-realistic',
    lens: '85mm portrait lens',
    focus: 'sharp focus on eyes',
    depth_of_field: 'shallow, soft background blur'
  },
  render_style: {
    realism_level: 'photorealistic',
    details: 'high skin detail, natural texture, realistic color grading'
  }
};

interface VisualSelectorProps {
  label: string;
  options: { id: string; label: string; icon?: any }[];
  currentValue: string;
  onChange: (value: string) => void;
  columns?: number;
}

const VisualSelector = ({ label, options, currentValue, onChange, columns = 3 }: VisualSelectorProps) => (
  <div className="space-y-4">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</label>
    <div className={cn(
      "grid gap-3",
      columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4"
    )}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentValue === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all relative group",
              isActive
                ? "bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-600/5"
                : "bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            {Icon && <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "text-purple-400")} />}
            <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{opt.label}</span>
            {isActive && (
              <motion.div
                layoutId={`active-${label}`}
                className="absolute inset-0 border-2 border-purple-500 rounded-2xl pointer-events-none"
              />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export function AIModelGenerator() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [params, setParams] = useState(INITIAL_PARAMS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');

  const dbUser = (useQuery as any)("users:currentUser", user ? { clerkId: user.id } : "skip") as any;
  const deductCredits = (useMutation as any)("credits:deduct");
  const saveModel = (useMutation as any)("models:saveModel");

  const handleParamChange = (section: string, field: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
  };

  const handleGenerate = async () => {
    if (!dbUser) return;
    if (dbUser.credits < 100) {
      toast.error("Insufficient Credits", {
        description: "Model generation costs 100 credits."
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Map IDs back to descriptive strings for the prompt
      const promptParams = {
        ...params,
        subject: {
          ...params.subject,
          ethnicity: ETHNICITIES.find(e => e.id === params.subject.ethnicity)?.label || params.subject.ethnicity,
          hair_style: HAIR_STYLES.find(h => h.id === params.subject.hair_style)?.label || params.subject.hair_style,
          expression: EXPRESSIONS.find(e => e.id === params.subject.expression)?.label || params.subject.expression,
        },
        appearance: {
          ...params.appearance,
          outfit: OUTFITS.find(o => o.id === params.appearance.outfit)?.label || params.appearance.outfit,
        },
        lighting: {
          ...params.lighting,
          type: LIGHTING_STYLES.find(l => l.id === params.lighting.type)?.label || params.lighting.type,
        },
        background: {
          ...params.background,
          style: BACKGROUNDS.find(b => b.id === params.background.style)?.label || params.background.style,
        }
      };

      const imageUrl = await generateAIModel(promptParams);
      setGeneratedImage(imageUrl);
      toast.success("Model generated successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Generation failed", { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage || !modelName) {
      toast.error("Please enter a name for your model.");
      return;
    }

    try {
      await deductCredits({ userId: dbUser._id, amount: 100 });
      await saveModel({
        name: modelName,
        imageUrl: generatedImage,
        parameters: params
      });
      toast.success("Model saved to your library!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error("Failed to save model", { description: error.message });
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'subject':
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gender</label>
              <div className="flex gap-2">
                {['female', 'male', 'non-binary'].map(g => (
                  <button
                    key={g}
                    onClick={() => handleParamChange('subject', 'gender', g)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      params.subject.gender === g
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <VisualSelector
              label="Ethnicity"
              options={ETHNICITIES}
              currentValue={params.subject.ethnicity}
              onChange={(val) => handleParamChange('subject', 'ethnicity', val)}
              columns={3}
            />

            <div className="grid grid-cols-2 gap-8">
              <VisualSelector
                label="Age Range"
                options={AGE_RANGES}
                currentValue={params.subject.age_range}
                onChange={(val) => handleParamChange('subject', 'age_range', val)}
                columns={2}
              />
              <VisualSelector
                label="Expression"
                options={EXPRESSIONS}
                currentValue={params.subject.expression}
                onChange={(val) => handleParamChange('subject', 'expression', val)}
                columns={2}
              />
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-10">
            <VisualSelector
              label="Hair Style"
              options={HAIR_STYLES}
              currentValue={params.subject.hair_style}
              onChange={(val) => handleParamChange('subject', 'hair_style', val)}
              columns={3}
            />

            <VisualSelector
              label="Outfit Style"
              options={OUTFITS}
              currentValue={params.appearance.outfit}
              onChange={(val) => handleParamChange('appearance', 'outfit', val)}
              columns={3}
            />

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Hair Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Brunette', 'Blonde', 'Black', 'Red', 'Silver', 'Blue', 'Pink', 'Green'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleParamChange('subject', 'hair_color', color)}
                      className={cn(
                        "py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                        params.subject.hair_color === color
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Eye Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Brown', 'Blue', 'Green', 'Hazel', 'Grey', 'Amber'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleParamChange('subject', 'eye_color', color)}
                      className={cn(
                        "py-2 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                        params.subject.eye_color === color
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'environment':
        return (
          <div className="space-y-10">
            <VisualSelector
              label="Lighting Atmosphere"
              options={LIGHTING_STYLES}
              currentValue={params.lighting.type}
              onChange={(val) => handleParamChange('lighting', 'type', val)}
              columns={3}
            />

            <VisualSelector
              label="Environment / Background"
              options={BACKGROUNDS}
              currentValue={params.background.style}
              onChange={(val) => handleParamChange('background', 'style', val)}
              columns={3}
            />
          </div>
        );
      case 'render':
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Camera Lens</label>
                <div className="grid grid-cols-2 gap-2">
                  {['85mm Portrait', '50mm Standard', '35mm Wide', 'Macro Detail'].map(lens => (
                    <button
                      key={lens}
                      onClick={() => handleParamChange('camera', 'lens', lens)}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        params.camera.lens === lens
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {lens}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Realism Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Photorealistic', 'Hyper-realistic', 'Cinematic', 'Artistic'].map(r => (
                    <button
                      key={r}
                      onClick={() => handleParamChange('render_style', 'realism_level', r.toLowerCase())}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        params.render_style.realism_level === r.toLowerCase()
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Skin Detail</label>
              <div className="flex gap-2">
                {['Natural', 'Smooth', 'Textured', 'Ultra-Detailed'].map(detail => (
                  <button
                    key={detail}
                    onClick={() => handleParamChange('appearance', 'skin_texture', detail.toLowerCase())}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      params.appearance.skin_texture === detail.toLowerCase()
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {detail}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-8 pb-12 relative overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">AI Model Creator</h1>
            <p className="text-zinc-500 text-sm font-medium">Design your unique realistic AI model without prompting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Configuration */}
          <div className="lg:col-span-7 space-y-8">
            {/* Steps Navigation */}
            <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all relative group",
                      isActive ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Icon size={16} className={cn(isActive && "text-purple-400")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
                        <Check size={8} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Previous</span>
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
                >
                  <span className="text-xs font-black uppercase tracking-widest">Next Step</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-600/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  Generate Model (100 Credits)
                </button>
              )}
            </div>
          </div>

          {/* Right: Preview & Save */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative group">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 backdrop-blur-sm z-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                      <RefreshCw size={48} className="text-purple-500 animate-spin relative z-10" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Synthesizing Model</p>
                      <p className="text-[10px] text-zinc-500 font-medium">This usually takes 10-20 seconds</p>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <motion.img
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={generatedImage}
                    alt="Generated Model"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-800">
                    <User size={80} strokeWidth={0.5} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Preview will appear here</p>
                  </div>
                )}

                {/* Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Info size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-wider">Passport Style</p>
                      <p className="text-[8px] text-zinc-500 uppercase font-bold">85mm Portrait Lens • 1K Resolution</p>
                    </div>
                  </div>
                </div>
              </div>

              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Model Name</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Give your model a name..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Save size={18} />
                    Add to My Models
                  </button>
                </motion.div>
              )}

              <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">Credit Usage</p>
                    <p className="text-[10px] text-zinc-500 font-medium">100 credits per successful generation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
