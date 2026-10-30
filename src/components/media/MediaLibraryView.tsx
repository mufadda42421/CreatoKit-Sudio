import React, { useState, useRef } from 'react';
import { MediaAsset, Project } from '../../types';
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  Trash2,
  Film,
  Music,
  Image as ImageIcon,
  Tag,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
  onUploadMedia: (file: File) => Promise<void>;
  onDeleteAsset: (id: string) => void;
  projects: Project[];
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  assets,
  onUploadMedia,
  onDeleteAsset,
  projects,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const folders = Array.from(new Set(assets.map((a) => a.folder).filter(Boolean))) as string[];

  const filteredAssets = assets.filter((asset) => {
    if (selectedType !== 'all' && asset.type !== selectedType) return false;
    if (selectedFolder !== 'all' && asset.folder !== selectedFolder) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchTags = asset.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTags) return false;
    }
    return true;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUploadMedia(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
        <div>
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-rose-500" />
            <span>Studio Media Library</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Organize high-resolution footage, B-roll, audio tracks, and graphic overlays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Importing Asset...' : 'Import Media'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by filename or tag (e.g. tech, ocean, broll)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200"
          >
            <option value="all">All Media Types</option>
            <option value="image">Images & Graphics</option>
            <option value="video">Video Footage</option>
            <option value="audio">Audio Tracks</option>
          </select>

          {folders.length > 0 && (
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="all">All Folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-neutral-500">
            No media assets found matching query. Click "Import Media" to add images, videos, or audio.
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="group rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden cursor-pointer hover:border-rose-500/50 transition-all flex flex-col"
            >
              <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : asset.type === 'audio' ? (
                  <Music className="w-8 h-8 text-neutral-600" />
                ) : (
                  <Film className="w-8 h-8 text-neutral-600" />
                )}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-black/60 text-neutral-300 backdrop-blur-sm">
                  {asset.type}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-neutral-200 truncate">{asset.name}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {formatFileSize(asset.size)} {asset.duration ? `· ${asset.duration}s` : ''}
                  </div>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-neutral-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Asset Details Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-bold text-neutral-200 truncate pr-4">{selectedAsset.name}</span>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg bg-black overflow-hidden flex items-center justify-center max-h-64">
              {selectedAsset.type === 'image' ? (
                <img src={selectedAsset.url} alt="" className="max-h-64 object-contain" />
              ) : selectedAsset.type === 'audio' ? (
                <audio controls src={selectedAsset.url} className="w-full m-4" />
              ) : (
                <video controls src={selectedAsset.url} className="max-h-64 w-full" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px]">Type</span>
                <span className="font-semibold text-neutral-200 uppercase">{selectedAsset.type}</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px]">File Size</span>
                <span className="font-semibold text-neutral-200">{formatFileSize(selectedAsset.size)}</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px]">Folder</span>
                <span className="font-semibold text-neutral-200">{selectedAsset.folder || 'Root Library'}</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px]">Resolution</span>
                <span className="font-semibold text-neutral-200 font-mono">
                  {selectedAsset.width && selectedAsset.height
                    ? `${selectedAsset.width} × ${selectedAsset.height}`
                    : 'Audio / Scalable'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              {deleteConfirmId === selectedAsset.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400">Confirm delete?</span>
                  <button
                    onClick={() => {
                      onDeleteAsset(selectedAsset.id);
                      setSelectedAsset(null);
                      setDeleteConfirmId(null);
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-semibold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2 py-1 rounded text-neutral-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(selectedAsset.id)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>
              )}

              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
