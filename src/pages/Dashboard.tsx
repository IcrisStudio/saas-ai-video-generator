import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import {
  Plus, Trash2, Edit2, Clock, Sparkles, User as UserIcon,
  Wand2, ArrowRight, Zap, Image as ImageIcon, Video,
  CreditCard, Star, ChevronRight, Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
  const projects = useQuery(api.projects.list, dbUser ? { userId: dbUser._id } : "skip") as any[] | undefined;
  const aiModels = useQuery(api.models.getModels) as any[] | undefined;
  const history = useQuery(api.generations.list, dbUser ? { userId: dbUser._id } : "skip") as any[] | undefined;
  const createProject = useMutation(api.projects.createProject);
  const deleteProject = useMutation(api.projects.remove);
  const updateProject = useMutation(api.projects.updateProject);
  const deleteAIModel = useMutation(api.models.deleteModel);

  const handleRenameProject = async (e: React.MouseEvent, projectId: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt("Enter new project name:", currentName);
    if (newName && newName !== currentName) {
      await updateProject({ projectId, name: newName });
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProject({ projectId });
    }
  };

  const handleCreateProject = async () => {
    if (!dbUser) return;
    const plan = dbUser.plan || "free";
    if (plan === "free" && projects && projects.length >= 1) {
      toast.error("Free plan limited to 1 workspace. Upgrade to Pro for more.");
      return;
    }
    const id = await createProject({
      userId: dbUser._id,
      name: "New Project",
      description: "My latest creation",
      nodes: JSON.stringify([]),
      edges: JSON.stringify([]),
    });
    navigate(`/workspace/${id}`);
  };

  const onSelectProject = (id: string) => navigate(`/workspace/${id}`);

  const getWorkflowProfile = (nodesJson: string) => {
    try {
      const nodes = JSON.parse(nodesJson || "[]");
      const types = new Set<string>();
      nodes.forEach((n: any) => { if (n.type) types.add(n.type); });
      return Array.from(types);
    } catch { return []; }
  };

  const getProjectPreview = (nodesJson: string) => {
    try {
      const nodes = JSON.parse(nodesJson || "[]");
      const canvasNode = nodes.find((n: any) => {
        if (!n.data?.value) return false;
        const val = Array.isArray(n.data.value) ? n.data.value[0] : n.data.value;
        if (typeof val === 'string' && val.startsWith('data:image/png')) return true;
        if (typeof val === 'object' && val?.url?.startsWith('data:image/png')) return true;
        return false;
      });
      if (canvasNode) return canvasNode.data?.value;

      const imageNode = nodes.find((n: any) => {
        if (!n.data?.value) return false;
        const val = Array.isArray(n.data.value) ? n.data.value[0] : n.data.value;
        if (typeof val === 'string') return val.startsWith('data:image') || /\.(jpeg|jpg|png|webp|gif)/i.test(val);
        if (typeof val === 'object' && val?.url) {
          const url = val.url;
          return typeof url === 'string' && (url.startsWith('data:image') || /\.(jpeg|jpg|png|webp|gif)/i.test(url));
        }
        return false;
      });
      if (imageNode) return imageNode.data?.value;

      const videoNode = nodes.find((n: any) => {
        if (!n.data?.value) return false;
        const val = Array.isArray(n.data.value) ? n.data.value[0] : n.data.value;
        if (typeof val === 'string') return val.startsWith('https://') || /\.(mp4|webm)/i.test(val);
        if (typeof val === 'object' && val?.url) {
          const url = val.url;
          return typeof url === 'string' && (url.startsWith('https://') || /\.(mp4|webm)/i.test(url));
        }
        return false;
      });
      if (videoNode) return videoNode.data?.value;
      return null;
    } catch { return null; }
  };

  // Derived stats
  const totalGenerations = history?.length ?? 0;
  const imageCount = history?.filter(h => h.type === 'image').length ?? 0;
  const videoCount = history?.filter(h => h.type === 'video').length ?? 0;
  const credits = dbUser?.credits ?? 0;
  const plan = dbUser?.plan || "free";

  const recentGenerations = history?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-zinc-500 text-sm font-medium">Good to see you back</p>
          <h1 className="text-4xl font-semibold text-white">
            {user?.firstName || 'Creator'}<span className="text-zinc-600">'s workspace</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (plan === "free") { toast.error("AI Model creation requires Pro or Ultra."); navigate("/pricing"); }
              else navigate("/ai-models/create");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/40 backdrop-blur border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-all text-sm font-medium"
          >
            <UserIcon size={15} />
            AI Model
          </button>
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-medium"
          >
            <Plus size={15} />
            New Project
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Credits", value: credits.toLocaleString(), icon: CreditCard, sub: "remaining", action: () => navigate("/pricing"), actionLabel: "Top up" },
          { label: "Generations", value: totalGenerations, icon: Zap, sub: "total created", action: () => navigate("/history"), actionLabel: "View all" },
          { label: "Images", value: imageCount, icon: ImageIcon, sub: "generated", action: null, actionLabel: null },
          { label: "Videos", value: videoCount, icon: Video, sub: "generated", action: null, actionLabel: null },
        ].map(({ label, value, icon: Icon, sub, action, actionLabel }) => (
          <div
            key={label}
            className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">{label}</span>
              <Icon size={15} className="text-zinc-600" />
            </div>
            <p className="text-3xl font-semibold text-white">{value}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{sub}</span>
              {action && (
                <button onClick={action} className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                  {actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Plan Banner (free users only) ── */}
      {plan === "free" && (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Star size={16} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">You're on the Free plan</p>
              <p className="text-xs text-zinc-500">Upgrade to unlock unlimited projects, AI models & priority generation.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-medium shrink-0"
          >
            Upgrade
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── AI Models ── */}
      {aiModels && aiModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500">My AI Models</h2>
            <button
              onClick={() => navigate("/ai-models/create")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              <Plus size={12} /> Create new
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {aiModels.map((model) => (
              <motion.div
                key={model._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative aspect-square border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all"
              >
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="absolute bottom-2 left-2 right-2 text-[9px] font-medium text-white truncate">
                  {model.name}
                </p>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm("Delete this model?")) await deleteAIModel({ modelId: model._id });
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-zinc-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Generations ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">Recent generations</h2>
          {history !== undefined && recentGenerations.length > 0 && (
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Loading */}
        {history === undefined && (
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur h-32 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-zinc-600" />
          </div>
        )}

        {/* Empty */}
        {history !== undefined && recentGenerations.length === 0 && (
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur h-32 flex items-center justify-center">
            <p className="text-sm text-zinc-600">No generations yet</p>
          </div>
        )}

        {/* Grid */}
        {history !== undefined && recentGenerations.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentGenerations.map((gen) => (
              <motion.div
                key={gen._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate("/history")}
                className="group relative aspect-square border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-600 transition-all"
              >
                {gen.type === 'image' && (
                  <img
                    src={gen.url}
                    alt={gen.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {gen.type === 'video' && (
                  <video
                    src={gen.url}
                    className="w-full h-full object-cover"
                    muted loop
                    onMouseOver={e => e.currentTarget.play()}
                    onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  />
                )}
                {(gen.type === 'text' || gen.type === 'audio') && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    {gen.type === 'text' ? <Sparkles size={20} className="text-zinc-700" /> : <Zap size={20} className="text-zinc-700" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white truncate">{gen.prompt || gen.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Projects ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">Recent projects</h2>
          <button
            onClick={handleCreateProject}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
          >
            <Plus size={12} /> New project
          </button>
        </div>

        {/* Skeleton while loading */}
        {projects === undefined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-800/60" />
                <div className="p-5 space-y-3">
                  <div className="h-3.5 bg-zinc-800 rounded-lg w-2/3" />
                  <div className="h-2.5 bg-zinc-800/60 rounded-lg w-full" />
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-4 w-12 bg-zinc-800/60 rounded-md" />
                    <div className="h-4 w-10 bg-zinc-800/60 rounded-md" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                    <div className="h-2.5 w-20 bg-zinc-800/60 rounded" />
                    <div className="h-2.5 w-12 bg-zinc-800/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {projects !== undefined && projects.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-16 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Wand2 size={28} className="text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">No projects yet</h3>
              <p className="text-zinc-500 text-sm max-w-xs">Create your first project to start building visual workflows.</p>
            </div>
            <button
              onClick={handleCreateProject}
              className="px-6 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-medium"
            >
              Create project
            </button>
          </div>
        ) : projects !== undefined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const preview = project.previewUrl || getProjectPreview(project.nodes);
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur overflow-hidden hover:border-zinc-600 transition-all cursor-pointer"
                  onClick={(e) => handleRenameProject(e, project._id, project.name)}
                >
                  {/* Preview */}
                  <div
                    className="aspect-video bg-zinc-900 relative overflow-hidden"
                    onClick={(e) => { e.stopPropagation(); onSelectProject(project._id); }}
                  >
                    {preview ? (
                      (() => {
                        try {
                          const previewVal = Array.isArray(preview) ? preview[0] : preview;
                          const url = typeof previewVal === 'object' && previewVal?.url ? previewVal.url : previewVal;
                          if (!url) return null;
                          const isVideo = url.startsWith('data:video') || /\.(mp4|webm)/i.test(url);
                          return isVideo ? (
                            <video src={url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                          ) : (
                            <img src={url} alt={project.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                          );
                        } catch { return null; }
                      })()
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles size={32} className="text-zinc-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(e, project._id); }}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-zinc-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Open hint */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 text-[9px] text-zinc-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                      <Sparkles size={10} />
                      Click to open
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-zinc-200 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {project.description || "No description."}
                        </p>
                      </div>
                      <Edit2 size={13} className="text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-0.5 transition-colors" />
                    </div>

                    {/* Node type tags */}
                    {getWorkflowProfile(project.nodes).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getWorkflowProfile(project.nodes).slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-zinc-800 text-[9px] text-zinc-500 rounded-md capitalize"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatDistanceToNow(project.updatedAt)} ago
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectProject(project._id); }}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors font-medium"
                      >
                        Open <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Credits Footer ── */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <CreditCard size={16} />
          {credits.toLocaleString()} credits remaining
        </div>
        <button
          onClick={() => navigate("/pricing")}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition"
        >
          Buy more credits
        </button>
      </div>
    </div>
  );
}