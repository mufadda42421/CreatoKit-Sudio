import React, { useState, useRef, useEffect } from 'react';
import { Project, ThumbnailLayer, MediaAsset } from '../../types';
import {
  Type,
  Image as ImageIcon,
  Square,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Download,
  Save,
  Undo,
  Redo,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Check,
} from 'lucide-react';

interface ThumbnailStudioViewProps {
  project: Project;
  layers: ThumbnailLayer[];
  onSaveLayers: (layers: ThumbnailLayer[]) => void;
  mediaAssets: MediaAsset[];
}

export const ThumbnailStudioView: React.FC<ThumbnailStudioViewProps> = ({
  project,
  layers,
  onSaveLayers,
  mediaAssets,
}) => {
  const [activeLayers, setActiveLayers] = useState<ThumbnailLayer[]>(layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(layers[0]?.id || null);
  const [canvasPreset, setCanvasPreset] = useState<'youtube' | 'vertical' | 'square'>('youtube');
  const [bgColor, setBgColor] = useState('#09090b');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas dimensions
  const dimensions =
    canvasPreset === 'youtube'
      ? { width: 1280, height: 720 }
      : canvasPreset === 'vertical'
      ? { width: 1080, height: 1920 }
      : { width: 1080, height: 1080 };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedLayer = activeLayers.find((l) => l.id === selectedLayerId) || null;

  // Sync layers prop
  useEffect(() => {
    setActiveLayers(layers);
    if (!selectedLayerId && layers[0]) {
      setSelectedLayerId(layers[0].id);
    }
  }, [layers]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Render layers in array order
    activeLayers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      if (layer.type === 'image' && layer.imageUrl) {
        const img = new Image();
        img.src = layer.imageUrl;
        if (img.complete && img.naturalWidth) {
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        } else {
          img.onload = () => {
            // trigger re-render on next tick
            setActiveLayers([...activeLayers]);
          };
        }
      } else if (layer.type === 'shape') {
        ctx.fillStyle = layer.shapeFill || '#e11d48';
        if (layer.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(
            layer.x + layer.width / 2,
            layer.y + layer.height / 2,
            layer.width / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(layer.x, layer.y, layer.width, layer.height, 12);
          ctx.fill();
        }
      } else if (layer.type === 'text' && layer.text) {
        ctx.font = `bold ${layer.fontSize || 48}px ${layer.fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
        ctx.textBaseline = 'top';

        if (layer.shadow) {
          ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = layer.shadowBlur || 15;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
        }

        if (layer.strokeWidth && layer.strokeWidth > 0) {
          ctx.strokeStyle = layer.strokeColor || '#000000';
          ctx.lineWidth = layer.strokeWidth;
          ctx.lineJoin = 'miter';
          ctx.miterLimit = 2;
          ctx.strokeText(layer.text, layer.x, layer.y);
        }

        ctx.fillStyle = layer.color || '#FFFFFF';
        ctx.fillText(layer.text, layer.x, layer.y);
      }

      ctx.restore();
    });
  }, [activeLayers, dimensions, bgColor]);

  const updateSelectedLayer = (patch: Partial<ThumbnailLayer>) => {
    if (!selectedLayerId) return;
    const updated = activeLayers.map((l) => (l.id === selectedLayerId ? { ...l, ...patch } : l));
    setActiveLayers(updated);
    onSaveLayers(updated);
  };

  const handleAddTextLayer = () => {
    const newLayer: ThumbnailLayer = {
      id: `layer_text_${Date.now()}`,
      name: 'Text Layer',
      type: 'text',
      x: 100,
      y: 150,
      width: 600,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: 'BIG HOOK HEADLINE',
      fontSize: 64,
      fontFamily: 'Plus Jakarta Sans',
      color: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 6,
      shadow: true,
      shadowBlur: 16,
    };
    const updated = [...activeLayers, newLayer];
    setActiveLayers(updated);
    setSelectedLayerId(newLayer.id);
    onSaveLayers(updated);
  };

  const handleAddShapeLayer = () => {
    const newLayer: ThumbnailLayer = {
      id: `layer_shape_${Date.now()}`,
      name: 'Accent Pill',
      type: 'shape',
      x: 100,
      y: 280,
      width: 260,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      shapeType: 'rectangle',
      shapeFill: '#e11d48',
    };
    const updated = [...activeLayers, newLayer];
    setActiveLayers(updated);
    setSelectedLayerId(newLayer.id);
    onSaveLayers(updated);
  };

  const handleAddImageFromAsset = (asset: MediaAsset) => {
    const newLayer: ThumbnailLayer = {
      id: `layer_img_${Date.now()}`,
      name: asset.name,
      type: 'image',
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      imageUrl: asset.url,
    };
    // Place image at bottom as background
    const updated = [newLayer, ...activeLayers];
    setActiveLayers(updated);
    setSelectedLayerId(newLayer.id);
    onSaveLayers(updated);
  };

  const handleMoveLayer = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    const idx = activeLayers.findIndex((l) => l.id === selectedLayerId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= activeLayers.length) return;

    const copy = [...activeLayers];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    setActiveLayers(copy);
    onSaveLayers(copy);
  };

  const handleDeleteLayer = () => {
    if (!selectedLayerId) return;
    const updated = activeLayers.filter((l) => l.id !== selectedLayerId);
    setActiveLayers(updated);
    setSelectedLayerId(updated[0]?.id || null);
    onSaveLayers(updated);
  };

  const handleDuplicateLayer = () => {
    if (!selectedLayer) return;
    const copy: ThumbnailLayer = {
      ...selectedLayer,
      id: `layer_${Date.now()}`,
      name: `${selectedLayer.name} Copy`,
      x: selectedLayer.x + 20,
      y: selectedLayer.y + 20,
    };
    const updated = [...activeLayers, copy];
    setActiveLayers(updated);
    setSelectedLayerId(copy.id);
    onSaveLayers(updated);
  };

  const handleSaveDesign = () => {
    onSaveLayers(activeLayers);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportImage = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.name.replace(/\s+/g, '_')}_thumbnail.${format}`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950">
      {/* Top Bar */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-200">Thumbnail Studio</span>
          <div className="h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setCanvasPreset('youtube')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                canvasPreset === 'youtube' ? 'bg-rose-600 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              16:9 YouTube (1280x720)
            </button>
            <button
              onClick={() => setCanvasPreset('vertical')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                canvasPreset === 'vertical' ? 'bg-rose-600 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              9:16 Shorts/Reels (1080x1920)
            </button>
            <button
              onClick={() => setCanvasPreset('square')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                canvasPreset === 'square' ? 'bg-rose-600 text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              1:1 Feed Post (1080x1080)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved' : 'Save Design'}</span>
          </button>

          <button
            onClick={() => handleExportImage('png')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tools & Layers List */}
        <div className="w-64 border-r border-neutral-800 bg-neutral-900/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800 space-y-2">
            <span className="text-xs font-bold text-neutral-300 block">Add Layer</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleAddTextLayer}
                className="py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5"
              >
                <Type className="w-3.5 h-3.5 text-rose-400" />
                <span>Text</span>
              </button>
              <button
                onClick={handleAddShapeLayer}
                className="py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>Badge</span>
              </button>
            </div>
          </div>

          {/* Media Asset Quick Picker for background */}
          <div className="p-3 border-b border-neutral-800/80">
            <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">Background Assets</span>
            <div className="grid grid-cols-3 gap-1.5">
              {mediaAssets.filter((a) => a.type === 'image').slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleAddImageFromAsset(a)}
                  className="h-12 rounded border border-neutral-800 overflow-hidden cursor-pointer hover:border-rose-500 transition-colors"
                  title={`Add ${a.name}`}
                >
                  <img src={a.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Layer List */}
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">Layers ({activeLayers.length})</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveLayer('up')}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                title="Move Layer Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMoveLayer('down')}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                title="Move Layer Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeLayers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-semibold'
                      : 'border-neutral-800/60 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {layer.type === 'text' ? (
                      <Type className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : layer.type === 'image' ? (
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">{layer.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSelectedLayer({ visible: !layer.visible });
                    }}
                    className="text-neutral-500 hover:text-neutral-200"
                  >
                    <Eye className={`w-3.5 h-3.5 ${layer.visible ? 'text-neutral-400' : 'text-neutral-700'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Canvas Viewport */}
        <div className="flex-1 bg-neutral-950 flex items-center justify-center p-6 overflow-hidden">
          <div className="max-h-full max-w-full flex items-center justify-center shadow-2xl rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="max-h-[540px] max-w-full object-contain"
            />
          </div>
        </div>

        {/* Right: Layer Properties Inspector */}
        <div className="w-72 border-l border-neutral-800 bg-neutral-900/50 p-4 space-y-4 shrink-0 overflow-y-auto text-xs">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <span className="font-bold text-neutral-200">Layer Inspector</span>
            {selectedLayer && (
              <span className="text-[10px] text-neutral-500 uppercase font-mono">{selectedLayer.type}</span>
            )}
          </div>

          {selectedLayer ? (
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 mb-1">Layer Title</label>
                <input
                  type="text"
                  value={selectedLayer.name}
                  onChange={(e) => updateSelectedLayer({ name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {selectedLayer.type === 'text' && (
                <>
                  <div>
                    <label className="block text-neutral-400 mb-1">Headline Text</label>
                    <textarea
                      rows={2}
                      value={selectedLayer.text || ''}
                      onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-100 font-bold focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400">Font Size ({selectedLayer.fontSize}px)</label>
                      <input
                        type="range"
                        min={20}
                        max={140}
                        value={selectedLayer.fontSize || 48}
                        onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                        className="w-full h-1 bg-neutral-800 rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Outline Width ({selectedLayer.strokeWidth || 0}px)</label>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={selectedLayer.strokeWidth || 0}
                        onChange={(e) => updateSelectedLayer({ strokeWidth: Number(e.target.value) })}
                        className="w-full h-1 bg-neutral-800 rounded mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400">Text Fill</label>
                      <input
                        type="color"
                        value={selectedLayer.color || '#FFFFFF'}
                        onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                        className="w-full h-7 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400">Outline Color</label>
                      <input
                        type="color"
                        value={selectedLayer.strokeColor || '#000000'}
                        onChange={(e) => updateSelectedLayer({ strokeColor: e.target.value })}
                        className="w-full h-7 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedLayer.type === 'shape' && (
                <div>
                  <label className="text-[10px] text-neutral-400">Badge Fill Color</label>
                  <input
                    type="color"
                    value={selectedLayer.shapeFill || '#e11d48'}
                    onChange={(e) => updateSelectedLayer({ shapeFill: e.target.value })}
                    className="w-full h-7 bg-neutral-950 border border-neutral-800 rounded cursor-pointer mt-1"
                  />
                </div>
              )}

              {/* Coordinates & Geometry */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400">Position X (px)</label>
                    <input
                      type="number"
                      value={selectedLayer.x}
                      onChange={(e) => updateSelectedLayer({ x: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Position Y (px)</label>
                    <input
                      type="number"
                      value={selectedLayer.y}
                      onChange={(e) => updateSelectedLayer({ y: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Layer Opacity</span>
                    <span className="font-mono">{Math.round((selectedLayer.opacity || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedLayer.opacity || 1}
                    onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-800/80 flex gap-2">
                <button
                  onClick={handleDuplicateLayer}
                  className="flex-1 py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={handleDeleteLayer}
                  className="py-1.5 px-3 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-900/50 text-rose-300 font-medium flex items-center justify-center"
                  title="Delete Layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500">
              Select or add a layer from the panel on the left to edit its properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
