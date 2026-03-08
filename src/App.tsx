import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { useUser, SignUpButton } from "@clerk/clerk-react";
import { motion } from 'motion/react';
import { Sparkles, LayoutDashboard, CreditCard, User as UserIcon } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { DashboardNavbar } from './components/DashboardNavbar';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Pricing } from './pages/Pricing';
import { Flow } from './pages/Flow';
import { Landing } from './pages/Landing';
import { Templates } from './pages/Templates';
import { GTATemplate } from './templates/GTATemplate';
import { ProductPhotoTemplate } from './templates/ProductPhotoTemplate';
import { AIModelGenerator } from './pages/AIModelGenerator';
import { AIModelsList } from './pages/AIModelsList';
import { Community } from './pages/Community';
import { History } from './pages/History';

import { Toaster } from 'sonner';

function AppContent() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();



  if (!isLoaded) return null;

  const isWorkspace = window.location.pathname.startsWith('/workspace/');

  return (
    <div className="w-screen h-screen bg-zinc-950 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />

      {!isWorkspace && window.location.pathname !== '/' && !window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/templates') && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/dashboard" element={
          user ? (
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/templates" element={
          user ? (
            <DashboardLayout>
              <Templates />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/ai-models" element={
          user ? (
            <DashboardLayout>
              <AIModelsList />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />
        <Route path="/ai-models/create" element={
          user ? (
            <DashboardLayout>
              <AIModelGenerator />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/templates/gta-v" element={
          user ? (
            <DashboardLayout>
              <GTATemplate />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/templates/product-photo" element={
          user ? (
            <DashboardLayout>
              <ProductPhotoTemplate />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/workspace/:projectId" element={
          user ? (
            <ReactFlowProvider>
              <Flow />
            </ReactFlowProvider>
          ) : <Navigate to="/" />
        } />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/community" element={<Community />} />

      <Route path="/history" element={
          user ? (
            <DashboardLayout>
              <History />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />
        </Routes>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
