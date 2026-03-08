import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Sparkles,
  Zap,
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  X,
  CreditCard,
  Image as ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { unifiedGenerate } from "../services/geminigenService";
import { api } from "../../convex/_generated/api";

export function GTATemplate() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;

  const saveGeneration = useMutation(api.generations.save);
  const publishToCommunity = useMutation(api.community.publishGeneration);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) {
      toast.error("Please upload an image first.");
      return;
    }

    if (!dbUser) {
      toast.error("User not found.");
      return;
    }

    if (dbUser.credits < 5) {
      toast.error("You need at least 5 credits.");
      return;
    }

    setIsGenerating(true);

    try {
      const systemPrompt =
        "Transform this person into a GTA V loading screen style character. Use bold outlines, sunset tones, and stylized Rockstar portrait shading.";

      const { url } = await unifiedGenerate({
        userId: dbUser._id,
        type: "image",
        params: {
          prompt: systemPrompt,
          model: "nano-banana-pro",
          file_urls: [image]
        },
        cost: 5,
        onStore: saveGeneration,
      });

      if (url) {
        setResult(url);
        toast.success("GTA portrait generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">


      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-white">
          GTA Portrait Generator
        </h1>

        <p className="text-zinc-400 max-w-xl">
          Upload a portrait and transform it into stylized GTA V artwork
          inspired by Rockstar loading screen characters.
        </p>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-2 gap-10">

        {/* Upload Section */}
        <div className="space-y-6">

          <div className="relative border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6">

            {image ? (
              <div className="relative">

                <img
                  src={image}
                  className="rounded-xl w-full object-cover"
                />

                <button
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full hover:bg-red-500 transition"
                >
                  <X size={16} />
                </button>

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-xs rounded-lg flex items-center gap-2">
                  <Sparkles size={12} />
                  Image ready
                </div>

              </div>
            ) : (

              <label className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition">

                <Upload size={32} className="text-zinc-500 mb-4" />

                <p className="text-white font-medium">
                  Upload Portrait
                </p>

                <p className="text-zinc-500 text-sm mt-1">
                  PNG or JPG up to 10MB
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

              </label>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!image || isGenerating}
            className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition
            ${!image || isGenerating
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
                Generate (5 credits)
              </>
            )}

          </button>

        </div>

        {/* Result Section */}
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-6 flex items-center justify-center relative">

          {isGenerating && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-white" size={40} />
              <p className="text-zinc-400 text-sm">
                Creating your GTA portrait...
              </p>
            </div>
          )}

          {!isGenerating && result && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >

                <img
                  src={result}
                  className="rounded-xl w-full object-cover"
                />

                <div className="flex gap-3 mt-4">

                  <a
                    href={result}
                    download="gta-portrait.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    Download
                  </a>

                  <button
                    onClick={async () => {
                      if (!dbUser || !user) return;

                      try {
                        await publishToCommunity({
                          userId: dbUser._id,
                          userName: user.fullName || undefined,
                          userEmail: user.primaryEmailAddress?.emailAddress || "",
                          type: "image",
                          url: result,
                          prompt: "GTA Portrait",
                          model: "nano-banana-pro",
                          title: "GTA Portrait"
                        });

                        toast.success("Published!");
                      } catch (e: any) {
                        toast.error("Failed to publish");
                      }
                    }}
                    className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} />
                    Publish
                  </button>

                </div>

              </motion.div>
            </AnimatePresence>
          )}

          {!result && !isGenerating && (
            <div className="flex flex-col items-center text-center gap-3">
              <ImageIcon size={40} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">
                Your generated portrait will appear here
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Credits */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <CreditCard size={16} />
          {dbUser?.credits || 0} credits remaining
        </div>

        <button
          onClick={() => navigate("/pricing")}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Buy more credits
        </button>

      </div>

    </div>
  );
}