import React, { useCallback, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { useParams } from 'react-router-dom';
import { AppNodeData } from '../types';
import { cn } from '../lib/utils';

export const UploadNode = ({ id, data }: { id: string; data: AppNodeData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { projectId } = useParams<{ projectId: string }>();
  const uploadFile = (useMutation as any)("projects:uploadFile");

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && projectId) {
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const result = await uploadFile({
              projectId,
              fileBlob: base64,
              fileName: file.name,
            });
            // Store the Convex storage URL instead of data URL
            data.onUpdate?.(id, {
              value: result.url
            });
          } catch (error) {
            console.error('Upload failed:', error);
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('File reading failed:', error);
        setIsUploading(false);
      }
    }
  }, [projectId, uploadFile, data, id]);

  const getDisplayUrl = () => {
    const rawVal = Array.isArray(data.value) ? data.value[0] : data.value;
    if (typeof rawVal === 'object' && rawVal && 'url' in rawVal) {
      return rawVal.url;
    }
    return typeof rawVal === 'string' ? rawVal : null;
  };

  const displayUrl = getDisplayUrl();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Upload size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Upload</span>
        </div>
        <button
          onClick={() => data.onDelete?.(id)}
          className="text-zinc-600 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className={cn(
          "relative group aspect-square rounded-lg border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 overflow-hidden bg-zinc-950",
          displayUrl && "border-solid border-emerald-500/30"
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
            <span className="text-[9px] text-emerald-400 font-bold uppercase">Uploading...</span>
          </div>
        ) : displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/40 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                <Upload size={16} className="text-white" />
                <span className="text-[8px] text-white font-bold uppercase">Change</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="text-zinc-600" size={28} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Click to upload</span>
            <span className="text-[8px] text-zinc-600">PNG, JPG, WebP</span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={isUploading}
        />
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  );
};
