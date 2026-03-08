import React from 'react';
import { Panel } from 'reactflow';
import { Upload, Type, Sparkles, Video, Save, ChevronLeft, Wand2, Coins, MessageSquare, Volume2, User, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import logo from '../assets/images/logo-without-bg.png';

interface FlowNavbarProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onAddNode: (type: string) => void;
  dbUser: any;
}

export const FlowNavbar: React.FC<FlowNavbarProps> = ({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onAddNode,
  dbUser,
}) => {
  const navigate = useNavigate();

  return (
    <Panel position="top-left" className="!m-0 w-full">
      <div className="flex items-center justify-between bg-zinc-900/95 backdrop-blur-2xl border-b border-zinc-800/50 px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all group"
            title="Back to Dashboard"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <img src={logo} alt="Lueminex" className="w-6 h-6 object-contain" />
            <span className="text-xs font-bold text-white tracking-wider">Lueminex</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 rounded-xl border border-zinc-800/50 ml-auto">
            <div className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => onAddNode('upload')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Upload image or video"
              >
                <Upload size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Upload</span>
              </button>
              <button 
                onClick={() => onAddNode('text')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Add text node"
              >
                <Type size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Text</span>
              </button>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => onAddNode('imagination')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Generate image from prompt"
              >
                <Sparkles size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Imagine</span>
              </button>
              <button 
                onClick={() => onAddNode('video')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-purple-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Generate video"
              >
                <Video size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Video</span>
              </button>
              <button 
                onClick={() => onAddNode('enhancer')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Enhance prompts"
              >
                <Wand2 size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Enhance</span>
              </button>
              <button 
                onClick={() => onAddNode('aiModel')} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group cursor-pointer min-w-[50px]"
                title="Generate AI model"
              >
                <User size={14} />
                <span className="text-[8px] font-black uppercase tracking-tight">Model</span>
              </button>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <button
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={cn(
                "p-2 rounded-lg transition-all flex flex-col items-center gap-1 px-3 group cursor-pointer min-w-[50px]",
                hasUnsavedChanges
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
                  : "bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 opacity-50 cursor-not-allowed"
              )}
              title={hasUnsavedChanges ? "Save all changes and media to database" : "No unsaved changes"}
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span className="text-[8px] font-black uppercase tracking-tight">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>

          {dbUser && (
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-amber-500 leading-none">{dbUser.credits}</span>
                <span className="text-[7px] text-amber-500/60 font-bold uppercase tracking-widest">Credits</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};
