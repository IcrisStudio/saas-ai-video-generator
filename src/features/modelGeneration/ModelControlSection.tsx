import React from 'react';
import { Wand2, Download, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModelControlSectionProps {
  isGenerating: boolean;
  onGenerate: () => void;
  onDelete: () => void;
  displayUrl: string | null;
}

export const ModelControlSection: React.FC<ModelControlSectionProps> = ({
  isGenerating,
  onGenerate,
  onDelete,
  displayUrl,
}) => {
  const handleDownload = () => {
    if (!displayUrl) return;

    const link = document.createElement('a');
    link.href = displayUrl;
    link.download = `ai-model-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-zinc-900/40 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm space-y-3 h-fit">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-pink-400"></div>
        Actions
      </h3>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all",
          isGenerating
            ? "bg-purple-500/30 text-purple-300 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/50"
        )}
      >
        {isGenerating ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Generating
          </>
        ) : (
          <>
            <Wand2 size={14} />
            Generate
          </>
        )}
      </button>

      {displayUrl && (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
        >
          <Download size={14} />
          Download
        </button>
      )}

      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
};
