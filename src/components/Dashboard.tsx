import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Plus, Trash2, Edit2, Clock, Sparkles, User as UserIcon, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const dbUser = (useQuery as any)("users:currentUser", user ? { clerkId: user.id } : "skip") as any;
  const projects = (useQuery as any)("projects:list", dbUser ? { userId: dbUser._id } : "skip") as any[];
  const aiModels = (useQuery as any)("models:getModels") as any[];
  const createProject = (useMutation as any)("projects:createProject");
  const deleteProject = (useMutation as any)("projects:remove");
  const updateProject = (useMutation as any)("projects:updateProject");
  const deleteAIModel = (useMutation as any)("models:deleteModel");

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
    const id = await createProject({
      userId: dbUser._id,
      name: "New Project",
      description: "My latest creation",
      nodes: JSON.stringify([]),
      edges: JSON.stringify([]),
    });
    navigate(`/workspace/${id}`);
  };

  const onSelectProject = (id: string) => {
    navigate(`/workspace/${id}`);
  };

  const getProjectPreview = (nodesJson: string) => {
    try {
      const nodes = JSON.parse(nodesJson || "[]");
      // Try to find a canvas output first (drawing canvas), then image, then video
      const canvasNode = nodes.find((n: any) => {
        if (!n.data?.value) return false;
        const val = Array.isArray(n.data.value) ? n.data.value[0] : n.data.value;
        // Check if it's a canvas data URL or object
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
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-8 pb-12 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-1/4 w-full h-[600px] bg-purple-600/10 blur-[150px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-full h-[600px] bg-emerald-600/5 blur-[150px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">{user?.firstName || 'Creator'}</span>. <br />
              <span className="text-zinc-600">Ready to build?</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/ai-models/create')}
              className="px-6 py-3 flex items-center gap-2 bg-zinc-900 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-2xl border border-zinc-800 hover:border-emerald-500 active:scale-95 group cursor-pointer"
            >
              <UserIcon size={20} className="text-emerald-400 group-hover:text-white" />
              <span className="text-xs font-black uppercase tracking-widest">Create AI Model</span>
            </button>
            <button
              onClick={handleCreateProject}
              className="w-14 h-14 flex items-center justify-center bg-zinc-900 hover:bg-purple-600 text-white rounded-2xl transition-all shadow-2xl border border-zinc-800 hover:border-purple-500 active:scale-95 group cursor-pointer"
              title="Create New Project"
            >
              <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* AI Models Section */}
        {aiModels && aiModels.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <UserIcon size={20} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">My AI Models</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {aiModels.map((model) => (
                <motion.div
                  key={model._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all"
                >
                  <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{model.name}</p>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm("Delete this model?")) {
                        await deleteAIModel({ modelId: model._id });
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Wand2 size={20} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Recent Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.map((project) => {
              const preview = project.previewUrl || getProjectPreview(project.nodes);
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => handleRenameProject(e, project._id, project.name)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-purple-500/50 transition-all shadow-2xl cursor-pointer relative"
                >
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-[2rem] blur opacity-0 group-hover:opacity-20 transition duration-500" />

                  <div className="relative bg-zinc-900 h-full flex flex-col">
                    {/* Preview Area */}
                    <div
                      className="aspect-video bg-zinc-950 relative overflow-hidden cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project._id);
                      }}
                    >
                      {preview ? (
                        (() => {
                          try {
                            const previewVal = Array.isArray(preview) ? preview[0] : preview;
                            const url = typeof previewVal === 'object' && previewVal?.url ? previewVal.url : previewVal;
                            if (!url) return null;
                            const isVideo = url.startsWith('data:video') || /\.(mp4|webm)/i.test(url);
                            return isVideo ? (
                              <video src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                            ) : (
                              <img src={url} alt={project.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                            );
                          } catch (e) {
                            return null;
                          }
                        })()
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-800">
                          <Sparkles size={48} strokeWidth={1} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />

                      {/* Floating Actions */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(e, project._id);
                          }}
                          className="p-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl text-zinc-400 hover:text-red-400 transition-all shadow-xl cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Launch Badge */}
                      <div className="absolute bottom-4 left-4 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Click Image to Open</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                            {project.name}
                          </h3>
                          <Edit2 size={14} className="text-zinc-600 group-hover:text-purple-400" />
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-2 font-medium">
                          {project.description || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                          <Clock size={12} />
                          <span>{formatDistanceToNow(project.updatedAt)} ago</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(project._id);
                          }}
                          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-purple-600 group-hover:text-white transition-all cursor-pointer"
                          title="Open Workspace"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {projects?.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-700 shadow-inner">
                  <Sparkles size={40} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-zinc-400 text-xl font-black uppercase tracking-tight">No projects found</p>
                  <p className="text-zinc-600 font-medium">Create your first project to start building.</p>
                </div>
                <button
                  onClick={handleCreateProject}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-purple-600/20 active:scale-95"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
