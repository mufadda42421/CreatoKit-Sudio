import React, { useState } from 'react';
import { Project, SocialPlatform, AspectRatioPreset } from '../../types';
import { X, Film, Sparkles } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('youtube');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('16:9');
  const [targetDurationSec, setTargetDurationSec] = useState(60);

  if (!isOpen) return null;

  const handlePlatformChange = (p: SocialPlatform) => {
    setPlatform(p);
    if (p === 'youtube') setAspectRatio('16:9');
    else if (p === 'instagram' || p === 'tiktok') setAspectRatio('9:16');
    else if (p === 'x' || p === 'linkedin') setAspectRatio('16:9');
    else setAspectRatio('1:1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      platform,
      aspectRatio,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDurationSec,
    };

    onCreateProject(newProject);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-neutral-100">Create New Project</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5 Editing Tricks You Must Know in 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Description & Goal
            </label>
            <textarea
              rows={2}
              placeholder="What is this video about? Who is the target viewer?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Primary Platform
              </label>
              <select
                value={platform}
                onChange={(e) => handlePlatformChange(e.target.value as SocialPlatform)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              >
                <option value="youtube">YouTube (Longform & Shorts)</option>
                <option value="instagram">Instagram (Reels & Feed)</option>
                <option value="tiktok">TikTok Video</option>
                <option value="x">X (Twitter Video)</option>
                <option value="linkedin">LinkedIn Post & Video</option>
                <option value="facebook">Facebook Page</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Canvas Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatioPreset)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              >
                <option value="16:9">16:9 (Landscape / YouTube)</option>
                <option value="9:16">9:16 (Vertical / TikTok / Reels)</option>
                <option value="1:1">1:1 (Square Feed Post)</option>
                <option value="4:5">4:5 (Portrait Feed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Target Duration: <span className="text-neutral-400 font-mono">{targetDurationSec} seconds</span>
            </label>
            <input
              type="range"
              min={15}
              max={600}
              step={15}
              value={targetDurationSec}
              onChange={(e) => setTargetDurationSec(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
              <span>Short (15s)</span>
              <span>Reel (60s)</span>
              <span>Long-form (10m)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
