'use client';
import { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'eligi-cd-overlay .2s ease',
      }}
    >
      <style>{`
        @keyframes eligi-cd-overlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes eligi-cd-pop { from { opacity: 0; transform: translateY(10px) scale(.97) } to { opacity: 1; transform: none } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(20,20,26,0.96)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20, padding: '22px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          animation: 'eligi-cd-pop .26s cubic-bezier(0.34,1.1,0.64,1)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: message ? 8 : 18, letterSpacing: '-.01em' }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 20 }}>
            {message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: '#f4f4f7', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
