import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Bell, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../convex/_generated/api";
import { cn } from "../lib/utils";

export function NotificationPanel() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const dbUser = useQuery(api.users.currentUser, user ? { clerkId: user.id } : "skip") as any;
  const notifications = useQuery(
    api.notifications.list,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as { _id: string; type: string; title: string; body?: string; read: boolean; createdAt: number }[] | undefined;
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as number | undefined;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!dbUser?._id) return null;

  const count = unreadCount ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-zinc-500 hover:text-white hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 rounded-xl transition-all"
        aria-label="Notifications"
      >
        <Bell size={15} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 w-[340px] max-h-[400px] rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden flex flex-col z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await markAllRead({ userId: dbUser._id });
                    } catch (_) {}
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[320px]">
              {!notifications ? (
                <div className="flex items-center justify-center py-8 text-zinc-500">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No notifications yet
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {notifications.map((n) => (
                    <li
                      key={n._id}
                      className={cn(
                        "px-4 py-3 flex gap-3 hover:bg-zinc-800/50 transition-colors",
                        !n.read && "bg-zinc-800/30"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await markRead({ notificationId: n._id });
                            } catch (_) {}
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 flex-shrink-0"
                          title="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
