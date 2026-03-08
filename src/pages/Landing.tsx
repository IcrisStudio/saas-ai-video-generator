import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Play, CheckCircle2, X, Zap, Image as ImageIcon, Video, Wand2, Volume2, VolumeX } from 'lucide-react';
import { SignUpButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';
import workflowBanner from '../assets/images/landing-page-workflow-banner.png';
import logo from '../assets/images/logo-without-bg.png';

import video1 from '../assets/videos/video-1.mp4';
import video2 from '../assets/videos/video-2.mp4';
import video3 from '../assets/videos/video-3.mp4';
import video4 from '../assets/videos/video-4.mp4';
import video5 from '../assets/videos/video-5.mp4';
import video6 from '../assets/videos/video-6.mp4';
import video7 from '../assets/videos/video-7.mp4';
import video8 from '../assets/videos/video-8.mp4';

// ─── Provider Logos (SVG icons inline) ───────────────────────────────────────

function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function XAIIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SoraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── Animated Blob ─────────────────────────────────────────────────────────

function AnimatedBlob({ className, delay = 0, duration = 20, style = {} }: { className: string, delay?: number, duration?: number, style?: any }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[80px] opacity-30 ${className}`}
      animate={{
        x: [0, 60, -40, 20, 0],
        y: [0, -50, 30, -20, 0],
        scale: [1, 1.2, 0.9, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Floating Provider Badge ─────────────────────────────────────────────────

function FloatingBadge({ icon, label, color, x, y, delay, size = "md" }) {
  return (
    <motion.div
      className="absolute z-20 flex items-center gap-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 cursor-default select-none"
      style={{ left: x, top: y, padding: size === "sm" ? "8px 14px" : "10px 18px" }}
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{
        opacity: 1, scale: 1, y: 0,
        translateY: [0, -8, 0],
      }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5 },
        translateY: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className={`${size === "sm" ? "w-5 h-5" : "w-6 h-6"} ${color}`}>{icon}</div>
      <span className={`font-semibold text-gray-800 ${size === "sm" ? "text-xs" : "text-sm"}`}>{label}</span>
    </motion.div>
  );
}

// ─── Sample Generated Video Cards ─────────────────────────────────────────────

const sampleCreations = [
  {
    video: video1,
    label: "Sunset timelapse",
    model: "VEO 3.1",
    duration: "8s",
    emoji: "🌅",
  },
  {
    video: video2,
    label: "Ocean waves",
    model: "Sora Pro",
    duration: "5s",
    emoji: "🌊",
  },
  {
    video: video3,
    label: "Forest walk",
    model: "VEO 2",
    duration: "6s",
    emoji: "🌲",
  },
  {
    video: video4,
    label: "City lights",
    model: "Grok 3",
    duration: "7s",
    emoji: "🏙️",
  },
  {
    video: video5,
    label: "Space nebula",
    model: "Sora",
    duration: "10s",
    emoji: "🌌",
  },
  {
    video: video6,
    label: "Rainy street",
    model: "VEO 3.1",
    duration: "6s",
    emoji: "🌧️",
  },
  {
    video: video7,
    label: "Mountain peak",
    model: "Sora Pro",
    duration: "9s",
    emoji: "⛰️",
  },
  {
    video: video8,
    label: "Cyberpunk alley",
    model: "Grok 3",
    duration: "5s",
    emoji: "🚀",
  },
];

// ─── Video Card ────────────────────────────────────────────────────────────

function VideoCard({ item, index, key }: { item: any, index: number, key?: any }) {
  const [hovered, setHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('/community')}
      className="relative rounded-3xl overflow-hidden cursor-pointer flex-shrink-0 shadow-lg group border border-white/10"
      style={{ width: 280, height: 400 }}
    >
      <video
        src={item.video}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

      {/* Mute/Unmute Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white/90 hover:bg-white/20 transition-colors z-20"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <div className="absolute top-4 left-4 text-3xl drop-shadow-lg">{item.emoji}</div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        animate={{ opacity: hovered ? 1 : 0 }}
      >
        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/30 transform scale-90 group-hover:scale-100 transition-transform">
          <Play size={20} fill="white" className="ml-1 text-white" />
        </div>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
        <p className="text-white font-bold text-lg leading-tight mb-2 drop-shadow-md">{item.label}</p>
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/10 backdrop-blur-md rounded-lg text-white/90 border border-white/10">{item.model}</span>
          <span className="text-white/70 text-sm font-medium">{item.duration}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Landing ──────────────────────────────────────────────────────────

export function Landing() {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#050508",
        color: "#ffffff",
      }}
    >      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: "rgba(5,5,8,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logo} alt="Lueminex" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight" style={{ color: "#ffffff" }}>Lueminex</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">How it works</button>
          <button onClick={() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Community</button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Pricing</button>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Dashboard
            </button>
          ) : (
            <SignUpButton mode="modal">
              <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                Get started - it's free
              </button>
            </SignUpButton>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">

        {/* Workflow Banner Background with Fade */}
        <div className="absolute inset-0 z-0">
          <img
            src={workflowBanner}
            alt="Workflow Preview"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-full object-cover lg:w-[120%] lg:max-w-none opacity-40 lg:opacity-70"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 60%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 60%)",
            }}
          />
          {/* Extra dark overlay for text contrast on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/60 to-transparent z-10" />
        </div>

        {/* Animated background blobs - keeping them subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatedBlob className="w-[600px] h-[600px] top-[-300px] left-[-200px] opacity-20" delay={0} duration={18}
            style={{ background: "radial-gradient(circle, #a78bfa, #c4b5fd)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT: Text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
              style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <Sparkles size={12} />
              AI Made Simple for Everyone
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#ffffff" }}
            >
              Transform Your Imagination<br />
              <span style={{ background: "linear-gradient(135deg, #a78bfa 0%, #6366f1 40%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Into Reality with AI
              </span><br />
              Effortlessly.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg leading-relaxed max-w-md"
              style={{ color: "#9ca3af" }}
            >
              No prompting skills needed. Create stunning videos, images, and more with AI at affordable prices. From ideas to reality in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {user ? (
                <button onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 30px rgba(99,102,241,0.35)" }}>
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 30px rgba(99,102,241,0.35)" }}>
                    Get started - it's free <ArrowRight size={18} />
                  </button>
                </SignUpButton>
              )}
              <span className="text-sm text-gray-400 font-medium">50 free credits · No credit card</span>
            </motion.div>

            {/* Supported by */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-3 flex-wrap pt-2"
            >
              <span className="text-xs text-gray-400 font-medium">Powered by</span>
              {[
                { icon: <OpenAIIcon />, label: "OpenAI", color: "#fff" },
                { icon: <GoogleIcon />, label: "Google", color: "#4285F4" },
                { icon: <XAIIcon />, label: "Grok", color: "#fff" },
                { icon: <SoraIcon />, label: "Sora", color: "#6366f1" },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#d1d5db", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                >
                  <span className="w-4 h-4" style={{ color: p.color }}>{p.icon}</span>
                  {p.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Image focus area (empty, since background image handles it) */}
          <div className="relative h-[400px] lg:h-[600px] pointer-events-none">
            {/* This side is intentionally left empty to showcase the workflow image background */}
          </div>
        </div>
      </section>

      {/* ── Workflow Showcase ────────────────────────────────────────────── */}
      <section id="features" className="relative py-32 px-8 overflow-hidden" style={{ background: "#050508" }}>

        {/* Deep space / dark theme background with purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(139, 92, 246, 0.5) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">

          {/* Header Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-6 max-w-4xl"
          >
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide border shadow-xl"
              style={{ background: "rgba(139, 92, 246, 0.1)", color: "#d8b4fe", borderColor: "rgba(139, 92, 246, 0.2)" }}>
              <span className="text-xl">🚀</span> I just want you to put this as a section in my website
            </div>

            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6" style={{ letterSpacing: "-0.03em" }}>
              Meet <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #f9fafb 0%, #a78bfa 100%)" }}>Lyvrix Workflow</span>
            </h2>

            <p className="text-xl md:text-2xl leading-relaxed text-gray-400 max-w-2xl mx-auto font-medium">
              Turn anything into nodes, connections, videos, and more. A complete workspace designed for pure creative flow.
            </p>
          </motion.div>

          {/* Workflow Image with Feathered Edges */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-full relative mt-8 flex justify-center"
          >
            {/* Ambient Backlight behind the image */}
            <div className="absolute inset-0 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Image Container */}
            <div className="relative w-full max-w-7xl">
              <img
                src={workflowBanner}
                alt="Workspace Workflow"
                className="w-full h-auto object-contain relative z-10 opacity-90 transition-opacity duration-500 hover:opacity-100"
                style={{
                  // Feathering the edges to make it stand out and blend beautifully
                  maskImage: "radial-gradient(ellipse 95% 95% at 50% 50%, black 70%, transparent 100%)",
                  WebkitMaskImage: "radial-gradient(ellipse 95% 95% at 50% 50%, black 70%, transparent 100%)",
                }}
              />

              {/* Overlay gradient to perfectly blend the bottom into the #050508 background */}
              <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none z-20"
                style={{ background: "linear-gradient(to bottom, transparent 0%, #050508 100%)" }} />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-8 relative" style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.5) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-4"
          >
            <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#34d399" }}>How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: "#ffffff", letterSpacing: "-0.025em" }}>
              From idea to video<br />in three easy steps.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Type your idea",
                desc: "Add an Imagination Node and write anything — even one sentence. Our AI expands it into a studio-quality prompt automatically.",
                color: "#818cf8",
                bg: "rgba(99,102,241,0.03)",
                icon: <Wand2 size={24} />,
              },
              {
                num: "02",
                title: "Pick your image",
                desc: "Four stunning images generate instantly. Select your favourite, then drag it into a Video Node with a single click.",
                color: "#34d399",
                bg: "rgba(16,185,129,0.03)",
                icon: <ImageIcon size={24} />,
              },
              {
                num: "03",
                title: "Get your video",
                desc: "Write a motion description, hit generate. Your video renders at a fraction of competitors' cost — no re-uploading ever.",
                color: "#fbbf24",
                bg: "rgba(245,158,11,0.03)",
                icon: <Video size={24} />,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl p-8 space-y-5"
                style={{ background: step.bg, border: `1px solid ${step.color}33`, backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: step.color + "15", color: step.color }}>
                    {step.icon}
                  </div>
                  <span className="text-5xl font-black" style={{ color: step.color + "20", letterSpacing: "-0.04em" }}>{step.num}</span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Creations ──────────────────────────────────────────── */}
      <section id="community" className="py-24 overflow-hidden" style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#a78bfa" }}>Community</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: "#ffffff", letterSpacing: "-0.025em" }}>
              Created by real people,<br />just like you.
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              No experience needed. Here's what our users made in their first session.
            </p>
          </motion.div>
        </div>

        {/* Infinite scroll strip */}
        <div className="relative">
          <motion.div
            className="flex gap-5 px-8"
            animate={{ x: [0, -((200 + 20) * sampleCreations.length / 2)] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ width: "max-content" }}
          >
            {[...sampleCreations, ...sampleCreations, ...sampleCreations].map((item, i) => (
              <VideoCard key={i} item={item} index={i % sampleCreations.length} />
            ))}
          </motion.div>
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24"
            style={{ background: "linear-gradient(to right, #050508, transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24"
            style={{ background: "linear-gradient(to left, #050508, transparent)" }} />
        </div>

        {/* CTA below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 30px rgba(99,102,241,0.3)" }}>
              Start creating <ArrowRight size={18} />
            </button>
          ) : (
            <SignUpButton mode="modal">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 30px rgba(99,102,241,0.3)" }}>
                Get started - it's free <ArrowRight size={18} />
              </button>
            </SignUpButton>
          )}
        </motion.div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-8" style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#a78bfa" }}>Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: "#ffffff", letterSpacing: "-0.025em" }}>
              Everything they charge<br />hundreds for. We didn't.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Competitors */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] p-8 space-y-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-200">The alternatives</h3>
                <p className="text-gray-500 mt-1 text-sm">Separate subscriptions. Separate complexity.</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: "OpenAI (Sora)", note: "ChatGPT Plus or Pro", price: "$20–$200/mo" },
                  { name: "Google VEO 3", note: "AI Ultra required", price: "$249.99/mo" },
                  { name: "Grok / xAI", note: "SuperGrok plan", price: "$30/mo" },
                  { name: "Prompt engineering", note: "To get good results", price: "$50–$150" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3 pb-4 border-b border-gray-800 last:border-0">
                    <X size={16} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-300">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.note}</p>
                    </div>
                    <span className="font-bold text-sm text-gray-400 whitespace-nowrap">{c.price}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-4 flex justify-between items-center"
                style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400">Total monthly</p>
                  <p className="text-sm text-red-300">just to access all models</p>
                </div>
                <span className="text-2xl font-black text-red-400">$299+</span>
              </div>
            </motion.div>

            {/* NanoBanana */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] p-8 space-y-8 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(30, 27, 75, 0.4), rgba(45, 27, 105, 0.1))",
                border: "2px solid rgba(139,92,246,0.5)",
                boxShadow: "0 20px 60px rgba(139,92,246,0.15)",
                backdropFilter: "blur(12px)"
              }}
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd" }}>
                  <Sparkles size={11} /> Lyvrix Pro
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "#ffffff" }}>All models. One place.</h3>
                <p className="text-gray-400 mt-1">First 50 credits are absolutely free.</p>
              </div>

              <ul className="space-y-3">
                {[
                  "VEO 3.1 Fast & Full Quality",
                  "Sora & Sora Pro",
                  "Grok 3 by xAI",
                  "Prompt Enhancer AI",
                  "Node-based visual studio",
                  "Face Swap & Scene Extend",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    <CheckCircle2 size={17} style={{ color: "#a78bfa", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-purple-500/20 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: "#c4b5fd" }}>Free</div>
                    <div className="text-sm text-gray-400 mt-0.5">50 credits to start.</div>
                  </div>
                </div>
                {user ? (
                  <button onClick={() => navigate('/dashboard')} className="w-full py-3.5 rounded-xl text-white font-semibold transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", boxShadow: "0 6px 20px rgba(124,58,237,0.3)" }}>
                    Go to Dashboard
                  </button>
                ) : (
                  <SignUpButton mode="modal">
                    <button className="w-full py-3.5 rounded-xl text-white font-semibold transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", boxShadow: "0 6px 20px rgba(124,58,237,0.3)" }}>
                      Get started - it's free
                    </button>
                  </SignUpButton>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 relative overflow-hidden" style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <AnimatedBlob className="w-[500px] h-[500px] top-1/2 left-1/4 -translate-y-1/2 opacity-20"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} duration={15} />
        <AnimatedBlob className="w-[400px] h-[400px] top-1/2 right-1/4 -translate-y-1/2 opacity-20"
          style={{ background: "radial-gradient(circle, #34d399, transparent)" }} delay={5} duration={18} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-8"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.03em" }}>
            Your imagination<br />was always enough.
          </h2>
          <p className="text-xl text-white/60 font-medium">
            Now you have the tools to match it.
          </p>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-indigo-900 text-base transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #e0e7ff, #fff)", boxShadow: "0 8px 30px rgba(255,255,255,0.2)" }}>
              Go to Dashboard <ArrowRight size={18} />
            </button>
          ) : (
            <SignUpButton mode="modal">
              <button className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-indigo-900 text-base transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #e0e7ff, #fff)", boxShadow: "0 8px 30px rgba(255,255,255,0.2)" }}>
                Get started - it's free <ArrowRight size={18} />
              </button>
            </SignUpButton>
          )}
          <p className="text-white/30 text-sm">50 free credits · No credit card required</p>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-16 px-8" style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Lueminex" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg tracking-tight text-white">Lueminex</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Transform your imagination into reality with AI. No prompting skills needed. Just creativity.
            </p>
          </div>
          <div className="flex gap-16 flex-wrap">
            {[
              { title: "Product", links: ["How It Works", "Features", "Pricing"] },
              { title: "Resources", links: ["Documentation", "Templates", "Blog"] },
              { title: "Company", links: ["About", "Support", "Privacy"] },
            ].map((col, i) => (
              <div key={i} className="space-y-4">
                <h6 className="text-xs font-bold uppercase tracking-widest text-gray-400">{col.title}</h6>
                <ul className="space-y-3 text-sm text-gray-500">
                  {col.links.map((l, j) => (
                    <li key={j}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p>© 2025 Lueminex. All rights reserved. | lueminex.com</p>
          <p>Made to bring imagination to creativity 🌍</p>
        </div>
      </footer>
    </div>
  );
}