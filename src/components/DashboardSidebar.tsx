import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import {
    LayoutDashboard,
    Video,
    Users,
    CreditCard,
    Library,
    Settings,
    Plus,
    Zap,
    Clock,
    Sparkles,
    ChevronRight
} from "lucide-react";
import logo from "../assets/images/logo-without-bg.png";

export function DashboardSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
    const createProject = useMutation(api.projects.createProject);
    const projects = useQuery(api.projects.list, dbUser ? { userId: dbUser._id } : "skip") as any[] | undefined;

    const handleNewProject = async () => {
        if (!dbUser) return;
        const plan = dbUser?.plan || "free";
        if (plan === "free" && projects && projects.length >= 1) {
            navigate("/pricing");
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

    const menuItems = [
        { icon: LayoutDashboard, label: "Projects", path: "/dashboard" },
        { icon: Video, label: "Templates", path: "/templates" },
        { icon: Clock, label: "History", path: "/history" },
        { icon: Zap, label: "AI Models", path: "/ai-models" },
        { icon: Users, label: "Community", path: "/community" },
        { icon: CreditCard, label: "Pricing", path: "/pricing" },
        { icon: Library, label: "Tool Library", path: "#" },
    ];

    const plan = dbUser?.plan || "free";
    const credits = dbUser?.credits ?? 0;

    return (
        <aside className="w-60 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">

            {/* Logo */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-sm font-semibold text-white tracking-tight">Lueminex</span>
            </div>

            {/* New Project Button */}
            <div className="p-4 pb-2">
                <button
                    onClick={handleNewProject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-medium text-sm hover:bg-zinc-200 transition-all"
                >
                    <Plus size={15} />
                    New Project
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
                <span className="px-3 text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-2">Menu</span>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => item.path !== '#' && navigate(item.path)}
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group w-full text-left
                                ${isActive
                                    ? 'bg-zinc-900/60 text-white border border-zinc-800'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                                }`}
                        >
                            <item.icon
                                size={15}
                                className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400 transition-colors'}
                            />
                            {item.label}
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 space-y-3 mt-auto">

                {/* Credits pill */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <Zap size={13} className="text-zinc-600" />
                        <span className="text-xs text-zinc-400 font-medium">{credits.toLocaleString()} credits</span>
                    </div>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 transition font-medium"
                    >
                        Top up
                    </button>
                </div>

                {/* Upgrade card — only for free users */}
                {plan === "free" && (
                    <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-zinc-500" />
                            <p className="text-xs font-medium text-white">Free plan</p>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Unlock unlimited projects, AI models, and priority generation.
                        </p>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="w-full py-2.5 bg-white text-black text-xs font-medium rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
                        >
                            Upgrade
                            <ChevronRight size={13} />
                        </button>
                    </div>
                )}

                {/* Settings */}
                <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-white hover:bg-zinc-900/40 rounded-xl transition-all text-sm font-medium"
                >
                    <Settings size={15} />
                    Settings
                </button>
            </div>
        </aside>
    );
}