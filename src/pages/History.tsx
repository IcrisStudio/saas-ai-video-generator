import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import {
    Clock,
    Image as ImageIcon,
    Video,
    Type,
    Mic,
    Download,
    Share2,
    Search,
    Calendar,
    Zap,
    X,
    Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function History() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
    const history = useQuery(api.generations.list, dbUser ? { userId: dbUser._id } : "skip");
    const publishToCommunity = useMutation(api.community.publishGeneration);

    const filteredHistory = history
        ? history.filter((item) => {
            if (filterType && item.type !== filterType) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match =
                    (item.prompt || "").toLowerCase().includes(q) ||
                    (item.model || "").toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        })
        : [];

    const handlePublish = async (item: any) => {
        if (!dbUser || !user) return;
        try {
            await publishToCommunity({
                userId: dbUser._id,
                userName: user.fullName || undefined,
                userEmail: user.primaryEmailAddress?.emailAddress || "",
                generationId: item._id,
                type: item.type,
                url: item.url,
                storageId: item.storageId,
                prompt: item.prompt,
                model: item.model,
                title: item.prompt?.slice(0, 60) || "Generation",
            });
            toast.success("Published to community!");
            setSelectedItem(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to publish");
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "image": return <ImageIcon size={14} />;
            case "video": return <Video size={14} />;
            case "text": return <Type size={14} />;
            case "audio": return <Mic size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="min-h-screen max-w-6xl mx-auto px-6 py-4 space-y-10">

            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-semibold text-white">
                    Generation History
                </h1>
                <p className="text-zinc-400 max-w-xl">
                    Browse, preview, and share every creative piece you've generated.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                {/* Search */}
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl w-full sm:w-72 focus-within:border-zinc-600 transition-all">
                    <Search size={15} className="text-zinc-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search prompts or models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600 w-full"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")}>
                            <X size={14} className="text-zinc-500 hover:text-white transition" />
                        </button>
                    )}
                </div>

                {/* Type Filters */}
                <div className="flex items-center gap-2">
                    {["image", "video", "audio", "text"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilterType(filterType === t ? null : t)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                                ${filterType === t
                                    ? "bg-white text-black border-white"
                                    : "bg-zinc-900/40 backdrop-blur text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                                }`}
                        >
                            {getTypeIcon(t)}
                            <span className="capitalize">{t}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {!history ? (
                /* Skeleton */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="aspect-[3/4] bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredHistory.length === 0 ? (
                /* Empty State */
                <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-16 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Zap size={28} className="text-zinc-700" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">
                            {history.length === 0 ? "No generations yet" : "No matches found"}
                        </h3>
                        <p className="text-zinc-500 text-sm max-w-xs">
                            {history.length === 0
                                ? "Start creating images or videos to build your creative archive."
                                : "Try a different filter or search term."}
                        </p>
                    </div>
                    {history.length === 0 && (
                        <button
                            onClick={() => navigate("/templates")}
                            className="px-6 py-3 bg-white text-black rounded-xl font-medium text-sm hover:bg-zinc-200 transition-all"
                        >
                            Browse Templates
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredHistory.map((item, i) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedItem(item)}
                            className="group relative aspect-[3/4] bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-600 transition-all"
                        >
                            {/* Media */}
                            {item.type === "image" && (
                                <img
                                    src={item.url}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    alt={item.prompt || "Generated"}
                                />
                            )}
                            {item.type === "video" && (
                                <video
                                    src={item.url}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loop muted playsInline
                                    onMouseOver={(e) => e.currentTarget.play()}
                                    onMouseOut={(e) => e.currentTarget.pause()}
                                />
                            )}
                            {item.type === "audio" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/80 p-4">
                                    <Mic size={32} className="text-zinc-500" />
                                    <audio src={item.url} className="max-w-full" />
                                </div>
                            )}
                            {item.type === "text" && (
                                <div className="absolute inset-0 p-5 flex flex-col justify-center bg-zinc-900">
                                    <p className="text-sm text-zinc-300 font-medium line-clamp-5 leading-relaxed mb-3">
                                        {item.prompt || "Generated text"}
                                    </p>
                                    <span className="text-xs text-emerald-400">Click to view →</span>
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="px-2 py-1 bg-black/60 backdrop-blur rounded-lg flex items-center gap-1.5 text-[10px] font-medium text-white">
                                        {getTypeIcon(item.type)}
                                        <span className="capitalize">{item.type}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                        <Calendar size={9} />
                                        {format(item.createdAt, "MMM d")}
                                    </span>
                                </div>
                                <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                                    {item.prompt || "No prompt"}
                                </p>
                            </div>

                            {/* Default badge (no hover) */}
                            <div className="absolute bottom-3 left-3 group-hover:opacity-0 transition-opacity">
                                <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur border border-zinc-800 rounded-xl flex items-center gap-1.5 text-[10px] text-zinc-400">
                                    {getTypeIcon(item.type)}
                                </div>
                            </div>

                            {/* Play icon top-right on hover */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-zinc-700">
                                    <Play size={12} className="text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4 md:p-12"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/80 backdrop-blur flex flex-col"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 z-20 p-2 bg-black/60 rounded-full hover:bg-red-500 transition border border-zinc-800"
                            >
                                <X size={16} />
                            </button>

                            {/* Media */}
                            <div className="flex-1 min-h-0 flex items-center justify-center p-6">
                                {selectedItem.type === "image" && (
                                    <img
                                        src={selectedItem.url}
                                        alt={selectedItem.prompt}
                                        className="max-w-full max-h-[65vh] object-contain rounded-xl"
                                    />
                                )}
                                {selectedItem.type === "video" && (
                                    <video
                                        src={selectedItem.url}
                                        autoPlay loop controls playsInline
                                        className="max-w-full max-h-[65vh] rounded-xl"
                                    />
                                )}
                                {selectedItem.type === "audio" && (
                                    <div className="w-full max-w-md">
                                        <audio src={selectedItem.url} controls className="w-full" />
                                    </div>
                                )}
                                {selectedItem.type === "text" && (
                                    <a
                                        href={selectedItem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 transition"
                                    >
                                        Open generated text →
                                    </a>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-white font-medium line-clamp-1">
                                        {selectedItem.prompt || "Generation"}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            {getTypeIcon(selectedItem.type)}
                                            <span className="capitalize">{selectedItem.type}</span>
                                        </span>
                                        <span>{selectedItem.model}</span>
                                        <span>{format(selectedItem.createdAt, "MMM d, h:mm a")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <a
                                        href={selectedItem.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center gap-2 transition"
                                    >
                                        <Download size={14} />
                                        Download
                                    </a>
                                    <button
                                        onClick={() => handlePublish(selectedItem)}
                                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm flex items-center gap-2 transition"
                                    >
                                        <Share2 size={14} />
                                        Publish
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}