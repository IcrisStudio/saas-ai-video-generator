import React from 'react';
import { useQuery } from 'convex/react';
import { useParams } from 'react-router-dom';
import { Image as ImageIcon, Plus } from 'lucide-react';

export const ModelsGallery: React.FC<{ onImport?: (modelUrl: string) => void }> = ({ onImport }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useQuery as any;
  // Query models for current user
  const me = (useQuery as any)("users:currentUser") as any;
  const models = (useQuery as any)("projects:listAiModels", me ? me._id : "skip") as any[] || [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">My Models</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {models.map((m: any) => (
          <div key={m._id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
            <img src={m.resolvedUrl || m.imageUrl} alt={m.name} className="w-full h-36 object-cover" />
            <div className="p-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{m.name || 'Untitled'}</span>
                <span className="text-[9px] text-zinc-500">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onImport?.(m.resolvedUrl || m.imageUrl)} className="p-2 bg-emerald-600/10 hover:bg-emerald-600 rounded-md text-emerald-400">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
