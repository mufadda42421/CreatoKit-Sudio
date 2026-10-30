import { SubtitleSegment } from '../types';

export function formatTimecodeSRT(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

export function formatTimecodeVTT(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

export function generateSRT(segments: SubtitleSegment[]): string {
  return segments
    .map((seg, idx) => {
      const index = idx + 1;
      const start = formatTimecodeSRT(seg.startMs);
      const end = formatTimecodeSRT(seg.endMs);
      return `${index}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

export function generateVTT(segments: SubtitleSegment[]): string {
  const header = 'WEBVTT - Exported from CreatorKit Studio\n\n';
  const body = segments
    .map((seg, idx) => {
      const index = idx + 1;
      const start = formatTimecodeVTT(seg.startMs);
      const end = formatTimecodeVTT(seg.endMs);
      return `${index}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
  return header + body;
}

export function parseSRT(srtContent: string): SubtitleSegment[] {
  const blocks = srtContent.replace(/\r\n/g, '\n').split('\n\n');
  const results: SubtitleSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeLine = lines[1]?.includes('-->') ? lines[1] : lines[0];
      const textLines = lines[1]?.includes('-->') ? lines.slice(2) : lines.slice(1);

      if (timeLine && timeLine.includes('-->')) {
        const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
        const parseTime = (str: string) => {
          const [hms, ms = '0'] = str.replace(',', '.').split('.');
          const [h = '0', m = '0', s = '0'] = hms.split(':');
          return (
            parseInt(h, 10) * 3600000 +
            parseInt(m, 10) * 60000 +
            parseInt(s, 10) * 1000 +
            parseInt(ms.padEnd(3, '0').slice(0, 3), 10)
          );
        };

        results.push({
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          startMs: parseTime(startStr),
          endMs: parseTime(endStr),
          text: textLines.join(' '),
        });
      }
    }
  }

  return results;
}
