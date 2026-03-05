import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function MediaGallery({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const generatedImages = (useQuery as any)("projects:listGeneratedImages", { projectId }) as any[];
  const generatedVideos = (useQuery as any)("projects:listGeneratedVideos", { projectId }) as any[];

  const allMedia = [
    ...(generatedImages?.map((img: any) => ({ ...img, type: 'image' })) || []),
    ...(generatedVideos?.map((vid: any) => ({ ...vid, type: 'video' })) || []),
  ].sort((a: any, b: any) => b.createdAt - a.createdAt);

  if (!allMedia.length) {
    return null;
  }

  const selectedMedia = allMedia[selectedIndex];

  return (
    <>
      {/* Gallery Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-2xl shadow-2xl transition-all active:scale-95 font-semibold"
        >
          <ImageIcon size={20} />
          <span>Saved Media ({allMedia.length})</span>
        </button>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Saved Media</h2>
                  <p className="text-sm text-zinc-400 mt-1">{allMedia.length} items saved in Convex database</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Main Viewer */}
                <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4 md:p-6">
                  <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-black">
                    {selectedMedia ? (
                      selectedMedia.type === 'image' ? (
                        <img
                          src={selectedMedia.imageUrl}
                          alt="Saved"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <video
                          src={selectedMedia.videoUrl}
                          controls
                          className="max-w-full max-h-full"
                          onError={(e) => {
                            const video = e.target as HTMLVideoElement;
                            console.warn('Video failed to load:', video.src);
                          }}
                        />
                      )
                    ) : (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin mx-auto mb-2" />
                        <p className="text-zinc-400">Loading...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail List */}
                <div className="w-full md:w-32 border-t md:border-t-0 md:border-l border-zinc-800 overflow-y-auto">
                  <div className="flex md:flex-col p-2 gap-2">
                    {allMedia.map((media: any, idx: number) => (
                      <button
                        key={`${media.type}-${media._id}`}
                        onClick={() => setSelectedIndex(idx)}
                        className={`relative flex-shrink-0 w-24 h-24 md:w-full md:h-24 rounded-xl overflow-hidden border-2 transition-all ${
                          idx === selectedIndex ? 'border-purple-500' : 'border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.imageUrl}
                            alt={`Thumbnail ${idx}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.className = 'w-full h-full bg-zinc-800 flex items-center justify-center';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Video size={16} className="text-zinc-500" />
                          </div>
                        )}
                        {idx === selectedIndex && (
                          <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-500 rounded-xl" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Footer */}
              {selectedMedia && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedMedia.type === 'image' ? (
                      <ImageIcon size={16} className="text-emerald-400" />
                    ) : (
                      <Video size={16} className="text-purple-400" />
                    )}
                    <span className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                      {selectedMedia.type === 'image' ? 'Image' : 'Video'}
                    </span>
                    {selectedMedia.model && (
                      <span className="text-xs text-zinc-500">• {selectedMedia.model}</span>
                    )}
                  </div>
                  {selectedMedia.title && (
                    <p className="text-sm text-zinc-300">{selectedMedia.title}</p>
                  )}
                  {selectedMedia.prompt && (
                    <p className="text-xs text-zinc-400 line-clamp-2">Prompt: {selectedMedia.prompt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
                    <span>Created {formatDistanceToNow(selectedMedia.createdAt)} ago</span>
                    <a
                      href={selectedMedia.type === 'image' ? selectedMedia.imageUrl : selectedMedia.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors underline"
                    >
                      Open Original
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
