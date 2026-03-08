import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Volume2, VolumeX, Sparkles, Image as ImageIcon, Video, Layout, Heart, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

const FILTERS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'workflow', label: 'Workflows', icon: Layout },
];

export function Community() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activePost, setActivePost] = useState<any>(null);
  const [mutedVideos, setMutedVideos] = useState<Record<string, boolean>>({});

  const posts = useQuery(
    api.community.list,
    { type: activeFilter === 'all' ? undefined : activeFilter, limit: 100 }
  );
  const likePost = useMutation(api.community.like);

  const toggleMute = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMutedVideos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLike = (e: React.MouseEvent, post: { _id: string }) => {
    e.stopPropagation();
    likePost({ postId: post._id as any });
  };

  const filteredPosts = posts ?? [];
  const canPlayVideo = (p: any) => p.type === 'video';
  const canShowImage = (p: any) => p.type === 'image';
  const canShowWorkflow = (p: any) => p.type === 'workflow';

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-white">
          Community Showcase
        </h1>
        <p className="text-zinc-400 max-w-xl">
          Explore what creators are building — images, videos, and workflows made with Lyvrix.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                ${activeFilter === f.id
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'
                }`}
            >
              <Icon size={15} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filteredPosts.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-16 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Sparkles size={28} className="text-zinc-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No posts yet</h3>
            <p className="text-zinc-500 text-sm max-w-xs">
              Be the first to publish your generation to the community from History.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() => setActivePost(post)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer border border-zinc-800 bg-zinc-900/40 backdrop-blur aspect-[3/4] hover:border-zinc-600 transition-all"
            >
              {/* Media */}
              {canPlayVideo(post) && (
                <>
                  <video
                    src={post.url}
                    autoPlay
                    loop
                    muted={mutedVideos[post._id] !== false}
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => toggleMute(e, post._id)}
                    className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur rounded-full text-white hover:bg-red-500 transition z-20"
                  >
                    {mutedVideos[post._id] === false ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                </>
              )}
              {canShowImage(post) && (
                <img
                  src={post.url}
                  alt={post.title || post.prompt || 'Community post'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              {canShowWorkflow(post) && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-900">
                  <Layout size={40} className="text-zinc-700 mb-3" />
                  <h3 className="text-sm font-medium text-white line-clamp-2">{post.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">Workflow</p>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Bottom info — shown on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                  {post.title || post.prompt || 'Untitled'}
                </p>
                {post.prompt && (
                  <p className="text-zinc-400 text-[10px] line-clamp-2 mb-2">{post.prompt}</p>
                )}
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-emerald-400 text-[10px] font-medium border border-zinc-700">
                      {(post.userName || post.userEmail || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-emerald-400 text-xs truncate">
                      {post.userName || post.userEmail || 'Creator'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.model && (
                      <span className="text-zinc-500 text-[10px] truncate max-w-[80px]" title={post.model}>{post.model}</span>
                    )}
                    <span className="text-zinc-500 text-[10px] flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatTime(post.createdAt)}
                    </span>
                    <button
                      onClick={(e) => handleLike(e, post)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Heart size={12} />
                      <span className="text-xs">{post.likes ?? 0}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Play button on hover */}
              {(canPlayVideo(post) || canShowImage(post)) && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-zinc-700">
                    <Play size={18} fill="white" className="ml-0.5 text-white" />
                  </div>
                </div>
              )}

              {/* Default type badge */}
              <div className="absolute bottom-3 left-3 group-hover:opacity-0 transition-opacity z-10">
                <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur border border-zinc-800 rounded-xl flex items-center gap-1.5 text-[10px] text-zinc-400">
                  {post.type === 'video' && <Video size={11} />}
                  {post.type === 'image' && <ImageIcon size={11} />}
                  {post.type === 'workflow' && <Layout size={11} />}
                  <span className="capitalize">{post.type}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full Screen Modal */}
      <AnimatePresence>
        {activePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4 md:p-12"
            onClick={() => setActivePost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/80 backdrop-blur"
            >
              {/* Close */}
              <button
                onClick={() => setActivePost(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/60 rounded-full hover:bg-red-500 transition border border-zinc-800"
              >
                <X size={16} />
              </button>

              {/* Media */}
              {activePost.type === 'video' && (
                <video
                  src={activePost.url}
                  autoPlay loop controls
                  className="w-full object-contain max-h-[85vh]"
                />
              )}
              {activePost.type === 'image' && (
                <img
                  src={activePost.url}
                  alt={activePost.title || activePost.prompt}
                  className="w-full object-contain max-h-[85vh]"
                />
              )}
              {activePost.type === 'workflow' && (
                <div className="p-16 text-center">
                  <Layout size={48} className="text-zinc-700 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white">{activePost.title}</h2>
                  <p className="text-zinc-500 text-sm mt-2">
                    Shared by {activePost.userName || activePost.userEmail}
                  </p>
                </div>
              )}

              {/* Top info strip */}
              <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <p className="text-white text-sm font-medium">
                  {activePost.title || activePost.prompt || 'Community Post'}
                </p>
                {activePost.prompt && (
                  <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{activePost.prompt}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-emerald-400 text-[10px] border border-zinc-700">
                      {(activePost.userName || activePost.userEmail || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-emerald-400 text-xs">
                      {activePost.userName || activePost.userEmail || 'Creator'}
                    </span>
                  </div>
                  {activePost.model && (
                    <span className="text-zinc-500 text-xs">Model: {activePost.model}</span>
                  )}
                  <span className="text-zinc-500 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(activePost.createdAt).toLocaleString()}
                  </span>
                  <span className="text-zinc-500 text-xs">{activePost.likes ?? 0} likes</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}