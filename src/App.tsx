import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { useUser, SignUpButton } from "@clerk/clerk-react";
import { motion } from 'motion/react';
import { Sparkles, LayoutDashboard, CreditCard, User as UserIcon } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Pricing } from './components/Pricing';
import { Flow } from './components/Flow';
import { Landing } from './components/Landing';
import { AIModelGenerator } from './components/AIModelGenerator';
import { Community } from './components/Community';

import { Toaster } from 'sonner';

function AppContent() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();



  if (!isLoaded) return null;

  const isWorkspace = window.location.pathname.startsWith('/workspace/');

  return (
    <div className="w-screen h-screen bg-zinc-950 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />
      {(!isWorkspace && window.location.pathname !== '/') && <Navbar />}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/dashboard" element={
            user ? <Dashboard /> : <Navigate to="/" />
          } />

          <Route path="/workspace/:projectId" element={
            user ? (
              <ReactFlowProvider>
                <Flow />
              </ReactFlowProvider>
            ) : <Navigate to="/" />
          } />

          <Route path="/ai-models/create" element={
            user ? <AIModelGenerator /> : <Navigate to="/" />
          } />

          <Route path="/pricing" element={<Pricing />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>

    </div>
  );
}

export default function App() {
  return <AppContent />;
}
