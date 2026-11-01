import React, { useState } from 'react';
import { Project, SubtitleSegment, SubtitleStyle, MediaAsset } from '../../types';
import { generateSRT, generateVTT, formatTimecodeSRT, parseSRT } from '../../lib/subtitleUtils';
import {
  Captions,
  Plus,
  Trash2,
  Download,
  Scissors,
  Merge,
  Sparkles,
  FileText,
  Play,
  Upload,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { safeFetchJson } from '../../lib/apiClient';

interface SubtitlesViewProps {
  project: Project;
  segments: SubtitleSegment[];
  onSaveSegments: (segments: SubtitleSegment[]) => void;
  style: SubtitleStyle;
  onSaveStyle: (style: SubtitleStyle) => void;
  mediaAssets: MediaAsset[];
}

export const SubtitlesView: React.FC<SubtitlesViewProps> = ({
  project,
  segments,
  onSaveSegments,
  style,
  onSaveStyle,
  mediaAssets,
}) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(segments[0]?.id || null);
  const [playbackTimeMs, setPlaybackTimeMs] = useState(1500);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [rawTranscriptText, setRawTranscriptText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeSegment = segments.find((s) => s.id === activeSegmentId) || null;

  // Active segment at current simulated playback
  const currentDisplayedSegment = segments.find(
    (s) => playbackTimeMs >= s.startMs && playbackTimeMs <= s.endMs
  );

  const handleUpdateSegment = (id: string, patch: Partial<SubtitleSegment>) => {
    const updated = segments.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onSaveSegments(updated);
  };

  const handleAddSegment = () => {
    const last = segments[segments.length - 1];
    const startMs = last ? last.endMs + 200 : 0;
    const endMs = startMs + 3000;
    const newSeg: SubtitleSegment = {
      id: `sub_${Date.now()}`,
      startMs,
      endMs,
      text: 'New subtitle line...',
    };
    const updated = [...segments, newSeg];
    onSaveSegments(updated);
    setActiveSegmentId(newSeg.id);
  };

  const handleDeleteSegment = (id: string) => {
    const updated = segments.filter((s) => s.id !== id);
    onSaveSegments(updated);
    if (activeSegmentId === id) {
      setActiveSegmentId(updated[0]?.id || null);
    }
  };

  const handleSplitSegment = (id: string) => {
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;
    const midMs = Math.round((seg.startMs + seg.endMs) / 2);
    const words = seg.text.split(' ');
    const midWord = Math.ceil(words.length / 2);

    const firstSeg: SubtitleSegment = {
      ...seg,
      endMs: midMs,
      text: words.slice(0, midWord).join(' '),
    };

    const secondSeg: SubtitleSegment = {
      id: `sub_${Date.now()}`,
      startMs: midMs + 100,
      endMs: seg.endMs,
      text: words.slice(midWord).join(' ') || 'Continued...',
    };

    const idx = segments.findIndex((s) => s.id === id);
    const updated = [...segments];
    updated.splice(idx, 1, firstSeg, secondSeg);
    onSaveSegments(updated);
  };

  const handleMergeNext = (id: string) => {
    const idx = segments.findIndex((s) => s.id === id);
    if (idx < 0 || idx >= segments.length - 1) return;
    const curr = segments[idx];
    const next = segments[idx + 1];

    const merged: SubtitleSegment = {
      id: curr.id,
      startMs: curr.startMs,
      endMs: next.endMs,
      text: `${curr.text} ${next.text}`.trim(),
    };

    const updated = [...segments];
    updated.splice(idx, 2, merged);
    onSaveSegments(updated);
  };

  const handleExportSRT = () => {
    const srt = generateSRT(segments);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_subtitles.srt`;
    a.click();
  };

  const handleExportVTT = () => {
    const vtt = generateVTT(segments);
    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_subtitles.vtt`;
    a.click();
  };

  const handleAITranscribeFromScript = async () => {
    setIsTranscribing(true);
    setError(null);
    try {
      // Generate timestamped breakdown from the project script or text
      const source = project.script || rawTranscriptText;
      if (!source) {
        throw new Error('Please enter text into the transcript box or add a script to the active project first.');
      }

      const res = await safeFetchJson<{ text: string; error?: string }>('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'script',
          prompt: `Convert the following text into concise, timestamped subtitle segments (2-4 seconds per segment). Output as standard SRT format with index, timestamp, and text:\n\n${source}`,
        }),
      });

      if (!res.ok || !res.data) throw new Error(res.error || res.data?.error || 'Failed to auto-generate subtitles.');

      const parsed = parseSRT(res.data.text || '');
      if (parsed.length > 0) {
        onSaveSegments(parsed);
        setActiveSegmentId(parsed[0].id);
      } else {
        // Fallback: chunk sentences into 3s blocks
        const sentences = source.split(/[.\n]/).map((s) => s.trim()).filter(Boolean);
        const autoSegs: SubtitleSegment[] = sentences.map((sent, i) => ({
          id: `sub_${Date.now()}_${i}`,
          startMs: i * 3200,
          endMs: i * 3200 + 2900,
          text: sent,
        }));
        onSaveSegments(autoSegs);
      }
    } catch (err: any) {
      setError(err?.message || 'Transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950">
      {/* Top Bar */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-200">Captions & Subtitle Studio</span>
          <span className="text-neutral-600">·</span>
          <span className="text-xs text-neutral-400 font-mono">{segments.length} segments</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAITranscribeFromScript}
            disabled={isTranscribing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-colors"
          >
            {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isTranscribing ? 'Generating Timings...' : 'AI Auto-Subtitles'}</span>
          </button>

          <button
            onClick={handleExportSRT}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SRT</span>
          </button>

          <button
            onClick={handleExportVTT}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export VTT</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 mx-4 mt-2 rounded bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Segment List */}
        <div className="w-80 border-r border-neutral-800 bg-neutral-900/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">Subtitle Segments</span>
            <button
              onClick={handleAddSegment}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {segments.map((seg, idx) => {
              const isSelected = activeSegmentId === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    setActiveSegmentId(seg.id);
                    setPlaybackTimeMs(seg.startMs);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors space-y-2 ${
                    isSelected
                      ? 'border-rose-500/60 bg-rose-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>#{idx + 1}</span>
                    <span>
                      {formatTimecodeSRT(seg.startMs).slice(3, 8)} → {formatTimecodeSRT(seg.endMs).slice(3, 8)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 line-clamp-2">{seg.text}</p>

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-neutral-800/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSplitSegment(seg.id);
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                      title="Split segment"
                    >
                      <Scissors className="w-3 h-3" />
                    </button>
                    {idx < segments.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMergeNext(seg.id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                        title="Merge with next segment"
                      >
                        <Merge className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSegment(seg.id);
                      }}
                      className="p-1 rounded text-neutral-500 hover:text-rose-400"
                      title="Delete segment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live Synchronized Video Preview with Overlay Subtitle */}
        <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-6 overflow-hidden relative">
          <div className="relative w-full max-w-2xl aspect-video rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Background project image */}
            {project.thumbnailUrl ? (
              <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="text-neutral-700 text-xs font-mono">Video Canvas Frame</div>
            )}

            {/* Subtitle Overlay Banner */}
            {currentDisplayedSegment && (
              <div
                className={`absolute left-6 right-6 flex justify-center text-center px-4 py-2 pointer-events-none transition-all ${
                  style.position === 'top' ? 'top-8' : style.position === 'middle' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'
                }`}
              >
                <div
                  style={{
                    backgroundColor: style.bgColor,
                    color: style.color,
                    fontSize: `${style.fontSize}px`,
                    fontFamily: style.fontFamily,
                  }}
                  className="font-bold px-4 py-1.5 rounded-lg max-w-lg shadow-lg tracking-wide"
                >
                  {currentDisplayedSegment.text}
                </div>
              </div>
            )}
          </div>

          {/* Timeline playback scrubber */}
          <div className="w-full max-w-2xl mt-4 px-4 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4 text-xs">
            <span className="font-mono text-rose-400">{(playbackTimeMs / 1000).toFixed(1)}s</span>
            <input
              type="range"
              min={0}
              max={segments[segments.length - 1]?.endMs || 15000}
              step={100}
              value={playbackTimeMs}
              onChange={(e) => setPlaybackTimeMs(Number(e.target.value))}
              className="flex-1 h-1 bg-neutral-800 rounded cursor-pointer"
            />
            <span className="font-mono text-neutral-500">
              {((segments[segments.length - 1]?.endMs || 15000) / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Right: Selected Segment Editor & Style Presets */}
        <div className="w-72 border-l border-neutral-800 bg-neutral-900/50 p-4 space-y-5 shrink-0 overflow-y-auto text-xs">
          {activeSegment ? (
            <div className="space-y-3">
              <span className="font-bold text-neutral-200 block border-b border-neutral-800/80 pb-2">
                Edit Current Segment
              </span>

              <div>
                <label className="block text-neutral-400 mb-1">Subtitle Text</label>
                <textarea
                  rows={3}
                  value={activeSegment.text}
                  onChange={(e) => handleUpdateSegment(activeSegment.id, { text: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400">Start (ms)</label>
                  <input
                    type="number"
                    step={100}
                    value={activeSegment.startMs}
                    onChange={(e) => handleUpdateSegment(activeSegment.id, { startMs: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400">End (ms)</label>
                  <input
                    type="number"
                    step={100}
                    value={activeSegment.endMs}
                    onChange={(e) => handleUpdateSegment(activeSegment.id, { endMs: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-neutral-500 text-center py-4">No segment selected.</div>
          )}

          {/* Subtitle Style Presets */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <span className="font-bold text-neutral-200 block">Typography & Styling</span>

            <div>
              <label className="text-[10px] text-neutral-400">Font Size ({style.fontSize}px)</label>
              <input
                type="range"
                min={16}
                max={48}
                value={style.fontSize}
                onChange={(e) => onSaveStyle({ ...style, fontSize: Number(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400">Screen Position</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(['bottom', 'middle', 'top'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => onSaveStyle({ ...style, position: pos })}
                    className={`py-1 rounded text-[11px] capitalize font-medium ${
                      style.position === pos ? 'bg-rose-600 text-white font-semibold' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400">Text Color</label>
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => onSaveStyle({ ...style, color: e.target.value })}
                  className="w-full h-7 bg-neutral-950 border border-neutral-800 rounded cursor-pointer mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400">Background Box</label>
                <select
                  value={style.bgColor}
                  onChange={(e) => onSaveStyle({ ...style, bgColor: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200 mt-1"
                >
                  <option value="rgba(0, 0, 0, 0.75)">Dark Box (75%)</option>
                  <option value="rgba(0, 0, 0, 0.4)">Subtle (40%)</option>
                  <option value="transparent">Transparent (None)</option>
                  <option value="rgba(225, 29, 72, 0.85)">Rose Pill</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
