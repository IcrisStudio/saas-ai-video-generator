import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ModelPreviewSectionProps {
  displayUrl: string | null;
  isGenerating: boolean;
  parameters: Record<string, string>;
}

export const ModelPreviewSection: React.FC<ModelPreviewSectionProps> = ({
  displayUrl,
  isGenerating,
  parameters,
}) => {
  const getParameterSummary = () => {
    const { gender, age, ethnicity } = parameters;
    return `${age} ${ethnicity} ${gender}`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-purple-900/20 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-pink-400"></div>
        Generated Preview
      </h3>

      <div className="flex-1 flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-1">Generating model...</p>
              <p className="text-xs text-purple-300/70">
                {getParameterSummary()}
              </p>
            </div>
          </div>
        ) : displayUrl ? (
          <div className="w-full h-full">
            <img
              src={displayUrl}
              alt="Generated Model"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <AlertCircle className="text-purple-400/70" size={24} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">No model generated yet</p>
              <p className="text-xs text-purple-300/70">
                Select parameters and click Generate to create your model
              </p>
            </div>
          </div>
        )}
      </div>

      {displayUrl && (
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <p className="text-xs text-purple-300/60">
            <span className="font-semibold text-purple-300">Generated:</span> {getParameterSummary()}
          </p>
        </div>
      )}
    </div>
  );
};
