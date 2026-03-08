import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { CreditCard, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { NotificationPanel } from "./NotificationPanel";
import logo from "../assets/images/logo-without-bg.png";

export function DashboardNavbar() {
    const { user } = useUser();
    const navigate = useNavigate();
    const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;

    return (
        <nav className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">

            {/* Left: Logo + Search */}
            <div className="flex items-center gap-6">
                <div
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => navigate('/dashboard')}
                >
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-semibold text-white hidden md:block tracking-tight">
                        Lueminex
                    </span>
                </div>

                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-xl w-72 focus-within:border-zinc-600 transition-all">
                    <Search size={14} className="text-zinc-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600 w-full"
                    />
                </div>
            </div>

            {/* Right: Credits + Bell + User */}
            <div className="flex items-center gap-3">

                {/* Credits */}
                {dbUser && (
                    <div
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-all"
                        onClick={() => navigate('/pricing')}
                    >
                        <CreditCard size={13} className="text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-300">
                            {dbUser.credits?.toLocaleString()}
                        </span>
                    </div>
                )}

                <NotificationPanel />

                <div className="h-5 w-px bg-zinc-800" />

                {/* User */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-medium text-zinc-300">{user?.fullName}</span>
                        <span className="text-[10px] text-zinc-600 capitalize">{dbUser?.plan || 'free'} plan</span>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </nav>
    );
}