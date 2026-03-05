import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Volume2, VolumeX, Sparkles, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import video1 from '../assets/videos/video-1.mp4';
import video2 from '../assets/videos/video-2.mp4';
import video3 from '../assets/videos/video-3.mp4';
import video4 from '../assets/videos/video-4.mp4';
import video5 from '../assets/videos/video-5.mp4';
import video6 from '../assets/videos/video-6.mp4';
import video7 from '../assets/videos/video-7.mp4';
import video8 from '../assets/videos/video-8.mp4';

const communityVideos = [
    { id: 1, src: video1, title: 'Sunset Timelapse', author: '@alex_creates', likes: '2.4k' },
    { id: 2, src: video2, title: 'Ocean Waves', author: '@nature_ai', likes: '1.8k' },
    { id: 3, src: video3, title: 'Forest Walk', author: '@green_vfx', likes: '5.2k' },
    { id: 4, src: video4, title: 'City Lights', author: '@urban_dreams', likes: '900' },
    { id: 5, src: video5, title: 'Space Nebula', author: '@astro_gen', likes: '12k' },
    { id: 6, src: video6, title: 'Rainy Street', author: '@moody_pixels', likes: '3.1k' },
    { id: 7, src: video7, title: 'Mountain Peak', author: '@summit_ai', likes: '4.5k' },
    { id: 8, src: video8, title: 'Cyberpunk Alley', author: '@neo_tokyo', likes: '8.8k' },
];

export function Community() {
    const navigate = useNavigate();
    const [activeVideo, setActiveVideo] = useState<any>(null);
    const [isListMuted, setIsListMuted] = useState<Record<number, boolean>>(
        communityVideos.reduce((acc, v) => ({ ...acc, [v.id]: true }), {})
    );

    const toggleMute = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setIsListMuted(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="min-h-screen bg-[#050508] pt-24 px-8 pb-12 relative overflow-y-auto overflow-x-hidden font-sans">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/4 w-full h-[600px] bg-purple-600/10 blur-[150px] rounded-full -z-10 animate-pulse" />

            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Sparkles size={14} /> Community Showcase
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Made with NanoBanana
                        </h1>
                        <p className="text-gray-400 mt-4 text-lg">Explore what creators are building using our AI video generation models.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Navigation size={18} className="rotate-[270deg]" /> Back to Home
                    </button>
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {communityVideos.map((video) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            onClick={() => setActiveVideo(video)}
                            className="group relative rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/5 bg-white/5 aspect-[3/4]"
                        >
                            <video
                                src={video.src}
                                autoPlay
                                loop
                                muted={isListMuted[video.id]}
                                playsInline
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 via-transparent to-transparent opacity-80" />

                            <button
                                onClick={(e) => toggleMute(e, video.id)}
                                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/90 hover:bg-white/20 transition-colors z-20"
                            >
                                {isListMuted[video.id] ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            <div className="absolute bottom-6 left-6 right-6 z-20">
                                <h3 className="text-white font-bold text-xl drop-shadow-md">{video.title}</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-purple-400 text-sm font-medium">{video.author}</span>
                                    <span className="text-gray-400 text-sm">{video.likes} likes</span>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/30 transform scale-90 group-hover:scale-100 transition-transform">
                                    <Play size={24} fill="white" className="ml-1 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Full Screen Video Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]/95 backdrop-blur-xl p-4 md:p-12"
                    >
                        <button
                            onClick={() => setActiveVideo(null)}
                            className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all z-50"
                        >
                            <X size={24} />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-6xl max-h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-[#050508]"
                        >
                            <video
                                src={activeVideo.src}
                                autoPlay
                                loop
                                controls
                                className="w-full h-full object-contain max-h-[85vh]"
                            />
                            <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                                <h2 className="text-white text-2xl font-bold">{activeVideo.title}</h2>
                                <p className="text-purple-400 font-medium">{activeVideo.author}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
