import React from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Zap, Plus, User } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function AIModelsList() {
  const { user } = useUser();
  const navigate = useNavigate();
  const models = useQuery(api.models.getModels) as { _id: string; name: string; imageUrl: string; parameters?: unknown }[] | undefined;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Zap size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Models</h1>
            <p className="text-sm text-zinc-500">Your generated models. Use them in workflows or create new variants.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/ai-models/create")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all"
        >
          <Plus size={18} />
          Create new
        </button>
      </div>

      {!models ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-zinc-500" />
          </div>
          <h2 className="text-lg font-medium text-white mb-2">No AI models yet</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">Create your first model to use in workflows and imagination nodes.</p>
          <button
            onClick={() => navigate("/ai-models/create")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
          >
            <Plus size={18} />
            Create AI Model
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {models.map((model) => (
            <motion.button
              key={model._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate("/ai-models/create")}
              className="group relative aspect-square border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all text-left"
            >
              <img
                src={model.imageUrl}
                alt={model.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-sm font-medium text-white truncate">{model.name}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
