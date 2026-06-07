'use client';
// src/features/settings/components/ImageCropper.tsx
//
// Recortador reaproveitável (logo 1:1, capa 16:9, galeria 1:1).
// Arrasta pra posicionar + zoom no slider; recorta no <canvas> e devolve
// base64 já no tamanho final. Sem libs externas.

import { useEffect, useState, useRef, useCallback } from 'react';
import { Check, X, ZoomIn, Loader2 } from 'lucide-react';

const FRAME_W = 300;

interface Props {
  src: string;                 // object URL ou data URL do arquivo escolhido
  aspect: number;              // largura/altura (1 = quadrado, 16/9 = capa)
  outWidth: number;
  outHeight: number;
  outType?: 'image/png' | 'image/jpeg';
  quality?: number;
  title?: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}

export default function ImageCropper({
  src, aspect, outWidth, outHeight,
  outType = 'image/jpeg', quality = 0.85, title = 'Recortar imagem',
  onCancel, onApply,
}: Props) {
  const frameH = Math.round(FRAME_W / aspect);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    const i = new Image();
    i.onload = () => {
      if (!active) return;
      const base = Math.max(FRAME_W / i.naturalWidth, frameH / i.naturalHeight);
      const dispW = i.naturalWidth * base;
      const dispH = i.naturalHeight * base;
      setImg(i);
      setBaseScale(base);
      setZoom(1);
      setTx((FRAME_W - dispW) / 2);
      setTy((frameH - dispH) / 2);
    };
    i.src = src;
    return () => { active = false; };
  }, [src, frameH]);

  const clamp = useCallback((x: number, y: number, scale: number, image: HTMLImageElement) => {
    const dispW = image.naturalWidth * scale;
    const dispH = image.naturalHeight * scale;
    return {
      x: Math.min(0, Math.max(FRAME_W - dispW, x)),
      y: Math.min(0, Math.max(frameH - dispH, y)),
    };
  }, [frameH]);

  function onZoom(z: number) {
    if (!img) return;
    const scaleOld = baseScale * zoom;
    const scaleNew = baseScale * z;
    const cxImg = (FRAME_W / 2 - tx) / scaleOld; // ponto central do frame em coords da imagem
    const cyImg = (frameH / 2 - ty) / scaleOld;
    const c = clamp(FRAME_W / 2 - cxImg * scaleNew, frameH / 2 - cyImg * scaleNew, scaleNew, img);
    setZoom(z); setTx(c.x); setTy(c.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !img) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    const c = clamp(tx + dx, ty + dy, baseScale * zoom, img);
    setTx(c.x); setTy(c.y);
  }
  function onPointerUp() { drag.current = null; }

  function apply() {
    if (!img) return;
    const scale = baseScale * zoom;
    const cv = document.createElement('canvas');
    cv.width = outWidth; cv.height = outHeight;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, -tx / scale, -ty / scale, FRAME_W / scale, frameH / scale, 0, 0, outWidth, outHeight);
    onApply(cv.toDataURL(outType, quality));
  }

  const dispW = img ? img.naturalWidth * baseScale * zoom : 0;
  const dispH = img ? img.naturalHeight * baseScale * zoom : 0;

  return (
    <div style={overlay} onPointerUp={onPointerUp}>
      <div style={modal}>
        <div style={header}>
          <b style={{ fontWeight: 700, fontSize: 15 }}>{title}</b>
          <button onClick={onCancel} style={iconBtn} aria-label="Fechar"><X size={16} /></button>
        </div>

        <div style={{ background: '#111', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div
            style={{ position: 'relative', width: FRAME_W, height: frameH, overflow: 'hidden', borderRadius: 10, cursor: img ? 'grab' : 'default', touchAction: 'none', boxShadow: '0 0 0 1px rgba(255,255,255,.18)' }}
            onPointerDown={img ? onPointerDown : undefined}
            onPointerMove={img ? onPointerMove : undefined}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" draggable={false} style={{ position: 'absolute', left: tx, top: ty, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }} />
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: '#fff' }}>
                <Loader2 size={20} style={{ animation: 'eligi-spin 1s linear infinite' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
          <ZoomIn size={16} color="#71717a" />
          <input type="range" min={1} max={3} step={0.01} value={zoom} disabled={!img} onChange={e => onZoom(Number(e.target.value))} style={{ flex: 1, accentColor: '#dc2626' }} />
        </div>

        <div style={{ display: 'flex', gap: 9, padding: '0 18px 18px' }}>
          <button onClick={onCancel} style={ghostBtn}>Cancelar</button>
          <button onClick={apply} disabled={!img} style={goBtn}><Check size={16} /> Aplicar recorte</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(12,12,18,.55)', display: 'grid', placeItems: 'center', zIndex: 10000, padding: 18, fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 20, width: 'min(440px,100%)', overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0,0,0,.5)' };
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: '1px solid #f1f1f4' };
const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #e7e7ec', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#71717a' };
const ghostBtn: React.CSSProperties = { flex: 1, padding: 12, borderRadius: 11, border: '1px solid #e7e7ec', background: '#fff', color: '#71717a', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' };
const goBtn: React.CSSProperties = { flex: 2, padding: 12, borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 };
