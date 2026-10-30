import { TimelineClip, TimelineTrack, AspectRatioPreset } from '../types';

export interface ExportOptions {
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: AspectRatioPreset;
  fps: number;
  format: 'webm' | 'mp4' | 'edl';
  quality: 'draft' | 'balanced' | 'high';
  onProgress: (percent: number, statusText: string) => void;
}

export function getResolutionDimensions(res: '720p' | '1080p' | '4k', aspect: AspectRatioPreset): { width: number; height: number } {
  const baseHeights: Record<'720p' | '1080p' | '4k', number> = {
    '720p': 720,
    '1080p': 1080,
    '4k': 2160,
  };

  const h = baseHeights[res];
  switch (aspect) {
    case '16:9':
      return { width: Math.round((h * 16) / 9), height: h };
    case '9:16':
      return { width: h, height: Math.round((h * 16) / 9) };
    case '1:1':
      return { width: h, height: h };
    case '4:5':
      return { width: Math.round((h * 4) / 5), height: h };
    default:
      return { width: 1920, height: 1080 };
  }
}

/**
 * Real In-Browser Canvas + MediaRecorder Video Render Engine.
 * Renders all active timeline clips, overlays, transformations, and texts frame-by-frame,
 * captures the stream with MediaRecorder, and returns a real playable video Blob.
 */
export async function renderTimelineToVideo(
  clips: TimelineClip[],
  _tracks: TimelineTrack[],
  options: ExportOptions
): Promise<Blob> {
  const { resolution, aspectRatio, fps, format, onProgress } = options;
  const { width, height } = getResolutionDimensions(resolution, aspectRatio);

  const totalDuration = clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0) || 5;

  onProgress(5, 'Preparing render canvas and loading media assets...');

  // Pre-load images
  const imageElements: Record<string, HTMLImageElement> = {};
  for (const clip of clips) {
    if (clip.mediaUrl && !imageElements[clip.mediaUrl]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = clip.mediaUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.warn(`Could not load media for render: ${clip.mediaUrl}`);
          resolve(null);
        };
      });
      imageElements[clip.mediaUrl] = img;
    }
  }

  onProgress(15, 'Initializing real-time video recorder...');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  // Set up MediaRecorder
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.quality === 'high' ? 8000000 : options.quality === 'balanced' ? 4000000 : 2000000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
      resolve(finalBlob);
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start(100);

  const totalFrames = Math.max(1, Math.round(totalDuration * fps));
  const frameIntervalMs = 1000 / fps;

  for (let f = 0; f < totalFrames; f++) {
    const currentTimeSec = f / fps;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Active clips at currentTimeSec
    const activeClips = clips
      .filter((c) => currentTimeSec >= c.start && currentTimeSec < c.start + c.duration)
      .sort((a, b) => (a.trackId > b.trackId ? 1 : -1));

    for (const clip of activeClips) {
      if (clip.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = clip.opacity;

      if (clip.type === 'image' && clip.mediaUrl && imageElements[clip.mediaUrl]) {
        const img = imageElements[clip.mediaUrl];
        if (img.width && img.height) {
          const drawScale = clip.scale || 1;
          const targetW = width * drawScale;
          const targetH = height * drawScale;
          const drawX = (width - targetW) / 2 + (clip.posX / 100) * width;
          const drawY = (height - targetH) / 2 + (clip.posY / 100) * height;

          // Maintain cover aspect ratio inside frame
          const imgAspect = img.width / img.height;
          const targetAspect = targetW / targetH;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgAspect > targetAspect) {
            sw = img.height * targetAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetAspect;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, targetW, targetH);
        }
      } else if (clip.type === 'color' && clip.color) {
        ctx.fillStyle = clip.color;
        ctx.fillRect(0, 0, width, height);
      } else if (clip.type === 'text' && clip.textContent) {
        const style = clip.textStyle || {
          fontSize: 32,
          color: '#ffffff',
          fontFamily: 'Plus Jakarta Sans',
          bold: true,
        };

        const fontSizePx = Math.round((style.fontSize / 1080) * height);
        ctx.font = `${style.bold ? 'bold ' : ''}${fontSizePx}px ${style.fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = width / 2 + (clip.posX / 100) * width;
        const textY = height / 2 + (clip.posY / 100) * height;

        if (style.bgColor) {
          const metrics = ctx.measureText(clip.textContent);
          const padX = fontSizePx * 0.4;
          const padY = fontSizePx * 0.25;
          ctx.fillStyle = style.bgColor;
          ctx.fillRect(
            textX - metrics.width / 2 - padX,
            textY - fontSizePx / 2 - padY,
            metrics.width + padX * 2,
            fontSizePx + padY * 2
          );
        }

        ctx.fillStyle = style.color || '#ffffff';
        ctx.fillText(clip.textContent, textX, textY);
      }

      ctx.restore();
    }

    // Update progress
    const percent = Math.min(95, 20 + Math.round((f / totalFrames) * 75));
    if (f % Math.max(1, Math.round(fps / 2)) === 0) {
      onProgress(percent, `Rendering frame ${f + 1} of ${totalFrames} (${currentTimeSec.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`);
    }

    // Yield control slightly so browser handles canvas updates smoothly
    await new Promise((r) => setTimeout(r, frameIntervalMs / 4));
  }

  onProgress(98, 'Finalizing video stream and encoding container...');
  recorder.stop();

  const finalBlob = await recordingPromise;
  onProgress(100, 'Render complete!');
  return finalBlob;
}

/**
 * Generates external EDL (Edit Decision List) / JSON format for DaVinci Resolve, Premiere, or desktop FFmpeg.
 */
export function generateEDLManifest(clips: TimelineClip[], tracks: TimelineTrack[], aspect: AspectRatioPreset): string {
  const manifest = {
    schemaVersion: '1.0',
    generator: 'CreatorKit Studio NLE Engine',
    aspectRatio: aspect,
    tracks: tracks.map((t) => ({ id: t.id, name: t.name, type: t.type })),
    events: clips.map((c, i) => ({
      index: i + 1,
      id: c.id,
      trackId: c.trackId,
      name: c.name,
      type: c.type,
      timelineInSec: c.start,
      timelineOutSec: c.start + c.duration,
      durationSec: c.duration,
      sourceInSec: c.offset,
      sourceMediaUrl: c.mediaUrl || null,
      transform: {
        scale: c.scale,
        posX: c.posX,
        posY: c.posY,
        opacity: c.opacity,
        volume: c.volume,
      },
    })),
  };
  return JSON.stringify(manifest, null, 2);
}
