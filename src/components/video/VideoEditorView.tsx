import React, { useState, useRef, useEffect } from 'react';
import { Project, TimelineClip, TimelineTrack, MediaAsset, AspectRatioPreset } from '../../types';
import { renderTimelineToVideo, generateEDLManifest } from '../../lib/videoRenderer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Plus,
  Volume2,
  VolumeX,
  Eye,
  Lock,
  Layers,
  Film,
  Type,
  Palette,
  Undo2,
  Redo2,
  Sliders,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

interface VideoEditorViewProps {
  project: Project;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  onSaveTracks: (tracks: TimelineTrack[]) => void;
  onSaveClips: (clips: TimelineClip[]) => void;
  mediaAssets: MediaAsset[];
  onUploadMedia: (file: File) => Promise<void>;
}

export const VideoEditorView: React.FC<VideoEditorViewProps> = ({
  project,
  tracks,
  clips,
  onSaveTracks,
  onSaveClips,
  mediaAssets,
  onUploadMedia,
}) => {
  // Playback & playhead
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0); // in seconds
  const [zoomLevel, setZoomLevel] = useState(24); // pixels per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>(clips[0]?.id || null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>(project.aspectRatio || '16:9');
  const [snapping, setSnapping] = useState(true);

  // Undo / Redo history
  const [history, setHistory] = useState<TimelineClip[][]>([clips]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRes, setExportRes] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [exportFps, setExportFps] = useState(30);
  const [exportQuality, setExportQuality] = useState<'draft' | 'balanced' | 'high'>('high');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalDuration = Math.max(10, Math.ceil(clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0) + 3));

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;

  // Record history
  const pushHistory = (newClips: TimelineClip[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newClips);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    onSaveClips(newClips);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onSaveClips(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onSaveClips(next);
    }
  };

  // Playhead loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const deltaSec = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setPlayhead((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Synchronized canvas preview renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Active clips at playhead
    const activeClips = clips
      .filter((c) => playhead >= c.start && playhead < c.start + c.duration)
      .sort((a, b) => (a.trackId > b.trackId ? 1 : -1));

    activeClips.forEach((clip) => {
      if (clip.opacity <= 0) return;
      ctx.save();
      ctx.globalAlpha = clip.opacity;

      if (clip.type === 'image' && clip.mediaUrl) {
        const img = new Image();
        img.src = clip.mediaUrl;
        if (img.complete && img.naturalWidth) {
          const drawScale = clip.scale || 1;
          const targetW = width * drawScale;
          const targetH = height * drawScale;
          const drawX = (width - targetW) / 2 + (clip.posX / 100) * width;
          const drawY = (height - targetH) / 2 + (clip.posY / 100) * height;

          const imgAspect = img.naturalWidth / img.naturalHeight;
          const targetAspect = targetW / targetH;
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
          if (imgAspect > targetAspect) {
            sw = img.naturalHeight * targetAspect;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = img.naturalWidth / targetAspect;
            sy = (img.naturalHeight - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, targetW, targetH);
        }
      } else if (clip.type === 'color' && clip.color) {
        ctx.fillStyle = clip.color;
        ctx.fillRect(0, 0, width, height);
      } else if (clip.type === 'text' && clip.textContent) {
        const fontSizePx = Math.round(((clip.textStyle?.fontSize || 28) / 720) * height);
        ctx.font = `${clip.textStyle?.bold ? 'bold ' : ''}${fontSizePx}px ${clip.textStyle?.fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = width / 2 + (clip.posX / 100) * width;
        const textY = height / 2 + (clip.posY / 100) * height;

        if (clip.textStyle?.bgColor) {
          const metrics = ctx.measureText(clip.textContent);
          const padX = fontSizePx * 0.4;
          const padY = fontSizePx * 0.25;
          ctx.fillStyle = clip.textStyle.bgColor;
          ctx.fillRect(
            textX - metrics.width / 2 - padX,
            textY - fontSizePx / 2 - padY,
            metrics.width + padX * 2,
            fontSizePx + padY * 2
          );
        }

        ctx.fillStyle = clip.textStyle?.color || '#FFFFFF';
        ctx.fillText(clip.textContent, textX, textY);
      }

      ctx.restore();
    });
  }, [playhead, clips, aspectRatio]);

  // Operations
  const handleSplitClipAtPlayhead = () => {
    if (!selectedClip) return;
    if (playhead <= selectedClip.start || playhead >= selectedClip.start + selectedClip.duration) return;

    const firstDuration = playhead - selectedClip.start;
    const secondDuration = selectedClip.duration - firstDuration;

    const firstClip: TimelineClip = {
      ...selectedClip,
      duration: firstDuration,
    };

    const secondClip: TimelineClip = {
      ...selectedClip,
      id: `clip_${Date.now()}`,
      name: `${selectedClip.name} (Part 2)`,
      start: playhead,
      duration: secondDuration,
      offset: selectedClip.offset + firstDuration,
    };

    const updated = clips.map((c) => (c.id === selectedClip.id ? firstClip : c)).concat(secondClip);
    pushHistory(updated);
    setSelectedClipId(secondClip.id);
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    const updated = clips.filter((c) => c.id !== selectedClipId);
    pushHistory(updated);
    setSelectedClipId(updated[0]?.id || null);
  };

  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    const duplicate: TimelineClip = {
      ...selectedClip,
      id: `clip_${Date.now()}`,
      name: `${selectedClip.name} Copy`,
      start: selectedClip.start + selectedClip.duration + 0.5,
    };
    const updated = [...clips, duplicate];
    pushHistory(updated);
    setSelectedClipId(duplicate.id);
  };

  const handleAddMediaToTimeline = (asset: MediaAsset) => {
    const targetTrack = asset.type === 'audio' ? 'track_a1' : 'track_v1';
    const lastClipOnTrack = clips
      .filter((c) => c.trackId === targetTrack)
      .sort((a, b) => b.start + b.duration - (a.start + a.duration))[0];

    const newStart = lastClipOnTrack ? lastClipOnTrack.start + lastClipOnTrack.duration : 0;
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      trackId: targetTrack,
      name: asset.name,
      type: asset.type === 'audio' ? 'audio' : 'image',
      start: newStart,
      duration: asset.duration || 5,
      offset: 0,
      mediaId: asset.id,
      mediaUrl: asset.url,
      volume: 1,
      muted: false,
      opacity: 1,
      scale: 1,
      posX: 0,
      posY: 0,
      speed: 1,
    };

    const updated = [...clips, newClip];
    pushHistory(updated);
    setSelectedClipId(newClip.id);
  };

  const handleAddTextOverlay = () => {
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      trackId: 'track_v2',
      name: 'NEW TEXT OVERLAY',
      type: 'text',
      start: playhead,
      duration: 4,
      offset: 0,
      textContent: 'YOUR TEXT HERE',
      textStyle: {
        fontSize: 32,
        color: '#FFFFFF',
        fontFamily: 'Plus Jakarta Sans',
        bold: true,
        bgColor: 'rgba(0,0,0,0.7)',
      },
      volume: 1,
      muted: false,
      opacity: 1,
      scale: 1,
      posX: 0,
      posY: 25,
      speed: 1,
    };
    const updated = [...clips, newClip];
    pushHistory(updated);
    setSelectedClipId(newClip.id);
  };

  const handleAddColorSolid = (color: string) => {
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      trackId: 'track_v1',
      name: `Solid ${color}`,
      type: 'color',
      color,
      start: playhead,
      duration: 5,
      offset: 0,
      volume: 1,
      muted: false,
      opacity: 1,
      scale: 1,
      posX: 0,
      posY: 0,
      speed: 1,
    };
    const updated = [...clips, newClip];
    pushHistory(updated);
    setSelectedClipId(newClip.id);
  };

  const updateSelectedClip = (patch: Partial<TimelineClip>) => {
    if (!selectedClipId) return;
    const updated = clips.map((c) => (c.id === selectedClipId ? { ...c, ...patch } : c));
    pushHistory(updated);
  };

  // Real in-browser video export execution
  const handleStartExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setRenderedBlobUrl(null);

    try {
      const blob = await renderTimelineToVideo(clips, tracks, {
        resolution: exportRes,
        aspectRatio,
        fps: exportFps,
        format: 'webm',
        quality: exportQuality,
        onProgress: (p, status) => {
          setExportProgress(p);
          setExportStatusText(status);
        },
      });

      const url = URL.createObjectURL(blob);
      setRenderedBlobUrl(url);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Error rendering canvas stream'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadEDL = () => {
    const edl = generateEDLManifest(clips, tracks, aspectRatio);
    const blob = new Blob([edl], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-200 truncate max-w-xs">{project.name}</span>
          <div className="h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1.5 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Aspect Ratio Presets */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            {(['16:9', '9:16', '1:1', '4:5'] as AspectRatioPreset[]).map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  aspectRatio === ar ? 'bg-rose-600 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Video</span>
          </button>
        </div>
      </div>

      {/* Center Row: Media Bin (Left), Preview (Center), Inspector (Right) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Media Bin & Generator */}
        <div className="w-64 border-r border-neutral-800 bg-neutral-900/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">Media Bin</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              title="Import Local File"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onUploadMedia(e.target.files[0]);
              }}
            />
          </div>

          <div className="p-2 border-b border-neutral-800/60 flex gap-1.5">
            <button
              onClick={handleAddTextOverlay}
              className="flex-1 py-1.5 px-2 rounded bg-neutral-800/80 hover:bg-neutral-800 text-[11px] font-medium text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Type className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Text</span>
            </button>
            <button
              onClick={() => handleAddColorSolid('#0f172a')}
              className="flex-1 py-1.5 px-2 rounded bg-neutral-800/80 hover:bg-neutral-800 text-[11px] font-medium text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Solid</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => handleAddMediaToTimeline(asset)}
                className="p-2 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-rose-500/50 hover:bg-neutral-800/50 transition-all cursor-pointer group flex items-center gap-2.5"
                title="Click to add to timeline"
              >
                <div className="w-12 h-9 rounded bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-neutral-700/50">
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-neutral-200 truncate font-medium group-hover:text-rose-300">
                    {asset.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 capitalize">{asset.type} · {asset.duration || 5}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Live Video Preview Canvas & Transport */}
        <div className="flex-1 flex flex-col bg-neutral-950 items-center justify-center p-4 overflow-hidden relative">
          <div className="relative flex items-center justify-center w-full h-[calc(100%-4rem)] max-h-[460px]">
            <canvas
              ref={canvasRef}
              width={aspectRatio === '9:16' ? 540 : aspectRatio === '1:1' ? 720 : 960}
              height={aspectRatio === '9:16' ? 960 : aspectRatio === '1:1' ? 720 : 540}
              className="rounded-lg shadow-2xl border border-neutral-800 max-h-full max-w-full object-contain bg-black"
            />
          </div>

          {/* Transport Controls */}
          <div className="h-14 w-full flex items-center justify-between px-6 border-t border-neutral-800/80 bg-neutral-900/40">
            <div className="text-xs font-mono text-neutral-300">
              <span className="text-rose-400 font-bold">{playhead.toFixed(2)}s</span>
              <span className="text-neutral-600"> / </span>
              <span className="text-neutral-500">{totalDuration.toFixed(2)}s</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlayhead(Math.max(0, playhead - 1))}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                title="Step backward 1s"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => setPlayhead(Math.min(totalDuration, playhead + 1))}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                title="Step forward 1s"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSplitClipAtPlayhead}
                disabled={!selectedClip}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-medium text-neutral-300 transition-colors"
                title="Split selected clip at playhead"
              >
                <Scissors className="w-3.5 h-3.5 text-rose-400" />
                <span>Split</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Properties & Inspector */}
        <div className="w-72 border-l border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-xs font-bold text-neutral-200">Clip Inspector</span>
            {selectedClip && (
              <span className="text-[10px] text-neutral-400 uppercase font-mono">{selectedClip.type}</span>
            )}
          </div>

          {selectedClip ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Clip Name</label>
                <input
                  type="text"
                  value={selectedClip.name}
                  onChange={(e) => updateSelectedClip({ name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {selectedClip.type === 'text' && (
                <div>
                  <label className="block text-neutral-400 mb-1">Text Overlay Content</label>
                  <textarea
                    rows={2}
                    value={selectedClip.textContent || ''}
                    onChange={(e) => updateSelectedClip({ textContent: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-rose-500 resize-none font-bold"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">Font Size ({selectedClip.textStyle?.fontSize || 28}px)</label>
                      <input
                        type="range"
                        min={14}
                        max={72}
                        value={selectedClip.textStyle?.fontSize || 28}
                        onChange={(e) =>
                          updateSelectedClip({
                            textStyle: {
                              ...selectedClip.textStyle!,
                              fontSize: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full h-1 bg-neutral-800 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Color</label>
                      <input
                        type="color"
                        value={selectedClip.textStyle?.color || '#FFFFFF'}
                        onChange={(e) =>
                          updateSelectedClip({
                            textStyle: {
                              ...selectedClip.textStyle!,
                              color: e.target.value,
                            },
                          })
                        }
                        className="w-full h-7 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transform properties */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Scale</span>
                    <span className="font-mono">{(selectedClip.scale || 1).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={selectedClip.scale || 1}
                    onChange={(e) => updateSelectedClip({ scale: Number(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono">{Math.round((selectedClip.opacity || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedClip.opacity || 1}
                    onChange={(e) => updateSelectedClip({ opacity: Number(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500">Start (s)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={selectedClip.start}
                      onChange={(e) => updateSelectedClip({ start: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500">Duration (s)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      value={selectedClip.duration}
                      onChange={(e) => updateSelectedClip({ duration: Math.max(0.5, Number(e.target.value)) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                    />
                  </div>
                </div>

                {/* Volume & Audio */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Volume</span>
                    <span className="font-mono">{Math.round((selectedClip.volume || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedClip.volume || 1}
                    onChange={(e) => updateSelectedClip({ volume: Number(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/80 flex gap-2">
                <button
                  onClick={handleDuplicateClip}
                  className="flex-1 py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={handleDeleteClip}
                  className="py-1.5 px-3 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-900/50 text-rose-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Delete Clip"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500 text-xs">
              Select a clip on the timeline below to inspect and customize its properties.
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Multitrack Timeline */}
      <div className="h-60 border-t border-neutral-800 bg-neutral-900/95 flex flex-col shrink-0 select-none">
        {/* Timeline Controls & Zoom Bar */}
        <div className="h-9 px-4 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-300">Tracks ({tracks.length})</span>
            <div className="h-3 w-px bg-neutral-800" />
            <button
              onClick={() => setSnapping(!snapping)}
              className={`px-2 py-0.5 rounded text-[11px] ${
                snapping ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-neutral-500'
              }`}
            >
              Snap {snapping ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="range"
              min={10}
              max={60}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-24 h-1 bg-neutral-800 rounded cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
          </div>
        </div>

        {/* Tracks and Scrubber Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Track Headers (Left) */}
          <div className="w-48 border-r border-neutral-800 bg-neutral-950/60 shrink-0 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-12 border-b border-neutral-800/60 px-3 flex items-center justify-between text-xs"
              >
                <div className="truncate font-medium text-neutral-300">{track.name}</div>
                <div className="flex items-center gap-1 text-neutral-500">
                  {track.type === 'audio' ? <Volume2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Viewport & Clips */}
          <div
            className="flex-1 overflow-x-auto overflow-y-hidden relative bg-neutral-950/80"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft;
              setPlayhead(Math.max(0, clickX / zoomLevel));
            }}
          >
            {/* Time ruler */}
            <div className="h-6 border-b border-neutral-800/80 bg-neutral-900/60 relative font-mono text-[10px] text-neutral-500 pointer-events-none">
              {Array.from({ length: Math.ceil(totalDuration) }).map((_, sec) => (
                <div
                  key={sec}
                  style={{ left: `${sec * zoomLevel}px` }}
                  className="absolute top-0 bottom-0 border-l border-neutral-800/60 pl-1"
                >
                  {sec % 5 === 0 ? `${sec}s` : '·'}
                </div>
              ))}
            </div>

            {/* Playhead red vertical bar */}
            <div
              style={{ left: `${playhead * zoomLevel}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            >
              <div className="w-2.5 h-2.5 -ml-1 bg-rose-500 rotate-45" />
            </div>

            {/* Track lanes */}
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);
              return (
                <div key={track.id} className="h-12 border-b border-neutral-800/40 relative">
                  {trackClips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        style={{
                          left: `${clip.start * zoomLevel}px`,
                          width: `${Math.max(20, clip.duration * zoomLevel)}px`,
                        }}
                        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-xs font-medium cursor-pointer transition-shadow overflow-hidden border ${
                          isSelected
                            ? 'bg-rose-600/90 text-white border-white shadow-lg ring-1 ring-rose-400'
                            : clip.type === 'text'
                            ? 'bg-amber-600/60 text-amber-100 border-amber-500/40'
                            : clip.type === 'audio'
                            ? 'bg-emerald-600/60 text-emerald-100 border-emerald-500/40'
                            : 'bg-blue-600/60 text-blue-100 border-blue-500/40'
                        }`}
                      >
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[10px] font-mono opacity-70 ml-1">{clip.duration.toFixed(1)}s</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-neutral-100">Export Video Render</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Resolution</label>
                <select
                  value={exportRes}
                  onChange={(e) => setExportRes(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="720p">720p HD (Fast Draft)</option>
                  <option value="1080p">1080p Full HD (Recommended)</option>
                  <option value="4k">4K Ultra HD (High Quality)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Frame Rate</label>
                  <select
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value={24}>24 fps (Cinematic)</option>
                    <option value={30}>30 fps (Web Standard)</option>
                    <option value={60}>60 fps (Ultra Smooth)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Bitrate Preset</label>
                  <select
                    value={exportQuality}
                    onChange={(e) => setExportQuality(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="high">High (8 Mbps)</option>
                    <option value="balanced">Balanced (4 Mbps)</option>
                    <option value="draft">Draft (2 Mbps)</option>
                  </select>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-neutral-300">
                    <span>Rendering Stream...</span>
                    <span className="font-mono">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      style={{ width: `${exportProgress}%` }}
                      className="h-full bg-rose-600 transition-all duration-150"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 italic">{exportStatusText}</p>
                </div>
              )}

              {renderedBlobUrl && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Video Render Complete!</span>
                  </div>
                  <a
                    href={renderedBlobUrl}
                    download={`${project.name.replace(/\s+/g, '_')}_rendered.webm`}
                    className="block w-full text-center py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                  >
                    Download WebM Video
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadEDL}
                className="text-xs text-neutral-400 hover:text-neutral-200 underline"
                title="Download JSON manifest for Premiere or DaVinci"
              >
                Export JSON EDL
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:bg-neutral-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                  <span>{isExporting ? 'Rendering...' : 'Start Render'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
