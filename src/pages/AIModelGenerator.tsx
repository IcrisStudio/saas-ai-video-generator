import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
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
  <div className="space-y-3">
    <label className="block text-xs text-zinc-500 font-medium">{label}</label>
    <div className={cn(
      "grid gap-2",
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
              "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium",
              isActive
                ? "bg-white text-black border-white"
                : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
            )}
          >
            {Icon && <Icon size={16} />}
            <span className="text-center leading-tight capitalize">{opt.label}</span>
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

  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
  const deductCredits = useMutation(api.credits.deduct);
  const saveModel = useMutation(api.models.saveModel);

  useEffect(() => {
    if (dbUser && (dbUser.plan || 'free') === 'free') {
      toast.error('AI Model creation requires Pro or Ultra plan.');
      navigate('/pricing');
    }
  }, [dbUser, navigate]);

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
      toast.error("You need at least 100 credits.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
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
      toast.error(error.message || "Generation failed.");
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
      toast.error(error.message || "Failed to save model.");
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'subject':
        return (
          <div className="space-y-8">
            {/* Gender */}
            <div className="space-y-3">
              <label className="block text-xs text-zinc-500 font-medium">Gender</label>
              <div className="flex gap-2">
                {['female', 'male', 'non-binary'].map(g => (
                  <button
                    key={g}
                    onClick={() => handleParamChange('subject', 'gender', g)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all",
                      params.subject.gender === g
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
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

            <div className="grid grid-cols-2 gap-6">
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
        const isBald = params.subject.hair_style === 'bald';
        return (
          <div className="space-y-8">
            <VisualSelector
              label="Hair Style"
              options={HAIR_STYLES}
              currentValue={params.subject.hair_style}
              onChange={(val) => {
                handleParamChange('subject', 'hair_style', val);
                if (val === 'bald') handleParamChange('subject', 'hair_color', 'Black');
              }}
              columns={3}
            />

            <VisualSelector
              label="Outfit Style"
              options={OUTFITS}
              currentValue={params.appearance.outfit}
              onChange={(val) => handleParamChange('appearance', 'outfit', val)}
              columns={3}
            />

            {!isBald && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-xs text-zinc-500 font-medium">Hair Color</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Brunette', 'Blonde', 'Black', 'Red', 'Silver', 'Blue', 'Pink', 'Green'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleParamChange('subject', 'hair_color', color)}
                        className={cn(
                          "py-2 rounded-lg border text-[10px] font-medium transition-all",
                          params.subject.hair_color === color
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/40 backdrop-blur text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-600"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs text-zinc-500 font-medium">Eye Color</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Brown', 'Blue', 'Green', 'Hazel', 'Grey', 'Amber'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleParamChange('subject', 'eye_color', color)}
                        className={cn(
                          "py-2 rounded-lg border text-[10px] font-medium transition-all",
                          params.subject.eye_color === color
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/40 backdrop-blur text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-600"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'environment':
        return (
          <div className="space-y-8">
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
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs text-zinc-500 font-medium">Camera Lens</label>
                <div className="grid grid-cols-2 gap-2">
                  {['85mm Portrait', '50mm Standard', '35mm Wide', 'Macro Detail'].map(lens => (
                    <button
                      key={lens}
                      onClick={() => handleParamChange('camera', 'lens', lens)}
                      className={cn(
                        "py-3 rounded-xl border text-xs font-medium transition-all",
                        params.camera.lens === lens
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                      )}
                    >
                      {lens}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs text-zinc-500 font-medium">Realism Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Photorealistic', 'Hyper-realistic', 'Cinematic', 'Artistic'].map(r => (
                    <button
                      key={r}
                      onClick={() => handleParamChange('render_style', 'realism_level', r.toLowerCase())}
                      className={cn(
                        "py-3 rounded-xl border text-xs font-medium transition-all",
                        params.render_style.realism_level === r.toLowerCase()
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-zinc-500 font-medium">Skin Detail</label>
              <div className="flex gap-2">
                {['Natural', 'Smooth', 'Textured', 'Ultra-Detailed'].map(detail => (
                  <button
                    key={detail}
                    onClick={() => handleParamChange('appearance', 'skin_texture', detail.toLowerCase())}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                      params.appearance.skin_texture === detail.toLowerCase()
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
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
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-white">
          AI Model Creator
        </h1>
        <p className="text-zinc-400 max-w-xl">
          Design your unique realistic AI model without prompting — configure every detail step by step.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-2 gap-10">

        {/* Left: Configuration */}
        <div className="space-y-6">

          {/* Step Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const isCompleted = currentStep > idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{step.label}</span>
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-950">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Step Content Card */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6 min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/40 backdrop-blur border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-medium"
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all",
                  isGenerating
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Generate (100 credits)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview & Save */}
        <div className="space-y-6">

          {/* Preview Card */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur overflow-hidden aspect-square relative flex items-center justify-center">
            {isGenerating && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-white" size={40} />
                <p className="text-zinc-400 text-sm">Synthesizing your model...</p>
              </div>
            )}

            {!isGenerating && generatedImage && (
              <AnimatePresence>
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={generatedImage}
                  alt="Generated Model"
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            )}

            {!isGenerating && !generatedImage && (
              <div className="flex flex-col items-center text-center gap-3">
                <User size={40} className="text-zinc-700" />
                <p className="text-zinc-500 text-sm">Your model preview will appear here</p>
              </div>
            )}
          </div>

          {/* Save Section */}
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-medium">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Give your model a name..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Save size={16} />
                Save to My Models
              </button>
            </motion.div>
          )}

          {/* Credit info */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Zap size={16} />
              {dbUser?.credits || 0} credits remaining
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition"
            >
              Buy more credits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}