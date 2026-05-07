import { useEffect, useRef, useState } from 'react';

function modifyGif(data: Uint8Array): Uint8Array {
  if (data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46) return data;

  const modified = new Uint8Array(data);
  const lsdFlags = data[10];
  const hasGCT   = (lsdFlags >> 7) & 1;
  const gctSize  = hasGCT ? 3 * (1 << ((lsdFlags & 0x07) + 1)) : 0;

  const delayOffsets: number[] = [];
  let i = 13 + gctSize;

  while (i < data.length - 1) {
    if (data[i] === 0x3B) break;

    if (data[i] === 0x21) {
      const label = data[i + 1];

      // Graphic Control Extension → collect delay offset
      if (label === 0xF9) {
        delayOffsets.push(i + 4);
        i += 8;

      // Application Extension → check for NETSCAPE loop, neutralise it
      } else if (label === 0xFF && data[i + 2] === 0x0B) {
        const appName = String.fromCharCode(...Array.from(data.slice(i + 3, i + 14)));
        if (appName === 'NETSCAPE2.0') {
          // Change 0xFF → 0xFE so browser treats this as a Comment Extension
          // and ignores the loop count → GIF plays exactly once, freezes on last frame
          modified[i + 1] = 0xFE;
        }
        i += 2;
        while (i < data.length && data[i] !== 0) i += data[i] + 1;
        i++;

      } else {
        i += 2;
        while (i < data.length && data[i] !== 0) i += data[i] + 1;
        i++;
      }

    } else if (data[i] === 0x2C) {
      i += 9;
      const f       = data[i++];
      const lctSize = ((f >> 7) & 1) ? 3 * (1 << ((f & 0x07) + 1)) : 0;
      i += lctSize + 1;
      while (i < data.length && data[i] !== 0) i += data[i] + 1;
      i++;
    } else {
      i++;
    }
  }

  // Speed up first 50% of frames so the "blank intro" passes fast
  const total = delayOffsets.length;
  delayOffsets.forEach((offset, idx) => {
    const orig   = data[offset] | (data[offset + 1] << 8);
    const factor = idx / Math.max(total - 1, 1) < 0.5 ? 0.12 : 1;
    const next   = Math.min(65535, Math.max(2, Math.round(orig * factor)));
    modified[offset]     = next & 0xFF;
    modified[offset + 1] = (next >> 8) & 0xFF;
  });

  return modified;
}

// Cache raw bytes; create fresh blob URL on each restart to force browser reset
let cachedData: Uint8Array | null = null;
let dataPromise: Promise<Uint8Array> | null = null;

function getModifiedGifData(): Promise<Uint8Array> {
  if (cachedData) return Promise.resolve(cachedData);
  if (!dataPromise) {
    dataPromise = fetch('/imagenes/logosinmarcaagua.gif')
      .then(r => r.arrayBuffer())
      .then((buf: ArrayBuffer) => {
        cachedData = modifyGif(new Uint8Array(buf));
        return cachedData;
      });
  }
  return dataPromise;
}

function createFreshBlobUrl(): string {
  const blob = new Blob([cachedData!.buffer as ArrayBuffer], { type: 'image/gif' });
  return URL.createObjectURL(blob);
}

export default function TalentionLogo({
  collapsed,
  activeView,
  height = 56,
}: {
  collapsed: boolean;
  activeView: string;
  height?: number;
  invertColors?: boolean;
}) {
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const prevView = useRef<string>(activeView);
  const prevBlobUrl = useRef<string | null>(null);

  function restartGif() {
    if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    const url = createFreshBlobUrl();
    prevBlobUrl.current = url;
    setGifSrc(url);
  }

  // Load on mount
  useEffect(() => {
    getModifiedGifData().then(() => restartGif());
  }, []);

  // Restart on section change
  useEffect(() => {
    if (prevView.current === activeView) return;
    prevView.current = activeView;
    if (!cachedData) return;
    restartGif();
  }, [activeView]);

  if (collapsed) {
    return (
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#1e2535' }}>
        T<span style={{ color: '#2563eb' }}>.</span>
      </span>
    );
  }

  if (!gifSrc) return null;

  return (
    <img
      key={gifSrc}
      src={gifSrc}
      alt="TalentionHR"
      style={{ height: `${height}px`, width: 'auto', objectFit: 'contain', marginLeft: height > 56 ? 0 : '12px' }}
    />
  );
}
