import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Sparkles,
  Zap,
  Loader2,
  X,
  CreditCard,
  Image as ImageIcon,
  User,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { unifiedGenerate } from "../services/geminigenService";
import { api } from "../../convex/_generated/api";

const COST = 5;

export function ProductPhotoTemplate() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [includeModel, setIncludeModel] = useState(false);
  const [additionalIdeas, setAdditionalIdeas] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
  const saveGeneration = useMutation(api.generations.save);
  const addNotification = useMutation(api.notifications.add);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProductImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error("Please upload a product image first.");
      return;
    }
    if (!dbUser) {
      toast.error("User not found.");
      return;
    }
    if (dbUser.credits < COST) {
      toast.error(`You need at least ${COST} credits.`);
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const basePrompt = includeModel
      ? "Professional product photography with a model wearing or holding the product. Clean studio lighting, high-end e-commerce style, sharp focus on the product."
      : "Professional product photography, product only on clean neutral background. Studio lighting, high-end e-commerce, sharp focus.";
    const prompt = additionalIdeas.trim()
      ? `${basePrompt} ${additionalIdeas.trim()}`
      : basePrompt;

    try {
      const { url } = await unifiedGenerate({
        userId: dbUser._id,
        type: "image",
        params: {
          prompt,
          model: "nano-banana-pro",
          file_urls: [productImage],
        },
        cost: COST,
        onStore: saveGeneration,
      });

      if (url) {
        setResult(url);
        toast.success("Product photo generated! Saved to History.");
        if (dbUser._id) {
          try {
            await addNotification({
              userId: dbUser._id,
              type: "generation_complete",
              title: "Product photo ready",
              body: "Your generation is in History.",
              metadata: { url },
            });
          } catch (_) {}
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-white">
          Product Photo Shot
        </h1>
        <p className="text-zinc-400 max-w-xl">
          Upload your product image, choose whether to include a model, add any extra ideas, and generate a pro product shot. No need to write prompts — we craft it for you.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6 space-y-6">
            {productImage ? (
              <div className="relative">
                <img
                  src={productImage}
                  alt="Product"
                  className="rounded-xl w-full object-cover max-h-[320px]"
                />
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full hover:bg-red-500 transition"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-xs rounded-lg flex items-center gap-2 text-emerald-400">
                  <Sparkles size={12} /> Product image ready
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-[280px] border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition">
                <Upload size={32} className="text-zinc-500 mb-4" />
                <p className="text-white font-medium">Upload product image</p>
                <p className="text-zinc-500 text-sm mt-1">PNG or JPG, up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageUpload}
                  className="hidden"
                />
              </label>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="checkbox"
                aria-checked={includeModel}
                onClick={() => setIncludeModel((v) => !v)}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition ${
                  includeModel ? "bg-emerald-600 border-emerald-500" : "bg-zinc-800 border-zinc-700"
                }`}
              >
                {includeModel && <Check size={18} className="text-white" />}
              </button>
              <div className="flex items-center gap-2 text-white">
                <User size={18} className="text-zinc-400" />
                <span>Include model (person) in the shot</span>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Additional ideas (optional)
              </label>
              <textarea
                value={additionalIdeas}
                onChange={(e) => setAdditionalIdeas(e.target.value)}
                placeholder="e.g. summer vibe, wooden background, gold accents..."
                className="w-full h-24 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!productImage || isGenerating}
            className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition ${
              !productImage || isGenerating
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate ({COST} credits)
              </>
            )}
          </button>

          {result && (
            <p className="text-center text-sm text-zinc-400">
              Saved to History. You can leave this page — your generation is stored.
            </p>
          )}
        </div>

        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6 flex items-center justify-center min-h-[360px]">
          {isGenerating && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-white" size={40} />
              <p className="text-zinc-400 text-sm">Creating your product photo...</p>
              <p className="text-zinc-500 text-xs">You can leave; it will appear in History when ready.</p>
            </div>
          )}

          <AnimatePresence>
            {!isGenerating && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <img
                  src={result}
                  alt="Generated product photo"
                  className="rounded-xl w-full object-cover"
                />
                <a
                  href={result}
                  download="product-photo.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-center flex items-center justify-center gap-2"
                >
                  Download
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !isGenerating && (
            <div className="flex flex-col items-center text-center gap-3">
              <ImageIcon size={40} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">Your generated product photo will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <CreditCard size={16} />
          {dbUser?.credits ?? 0} credits remaining
        </div>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Buy more credits
        </button>
      </div>
    </div>
  );
}
