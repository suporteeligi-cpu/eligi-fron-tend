'use client'
// src/app/dashboard/servicos/components/ColorPicker.tsx

import { Check } from 'lucide-react'
import {
  SERVICE_COLORS,
  colorToGradient,
  colorToGlow,
} from '@/features/services/constants/colorPalette'

interface Props {
  selected: string | null
  onSelect: (hex: string) => void
}

/**
 * Picker de cores estilo Booksy.
 * 33 cores em grid responsivo (~5 por linha mobile, ~11 por linha desktop).
 * Cada swatch é uma bolinha que mostra o gradiente real renderizado depois.
 */
export default function ColorPicker({ selected, onSelect }: Props) {
  return (
    <>
      <style>{`
        .clr-grid{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
          gap: 8px;
          max-width: 100%;
        }
        .clr-swatch{
          width: 30px; height: 30px;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          cursor: pointer; border: none;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.15s ease;
          position: relative;
          padding: 0;
          margin: 0 auto;
          -webkit-tap-highlight-color: transparent;
        }
        .clr-swatch:hover{ transform: scale(1.10) }
        .clr-swatch:active{ transform: scale(0.92) }
        .clr-swatch.selected{ transform: scale(1.15) }
      `}</style>

      <div className="clr-grid">
        {SERVICE_COLORS.map((hex) => {
          const isSelected = selected?.toLowerCase() === hex.toLowerCase()
          const gradient   = colorToGradient(hex)
          const glow       = colorToGlow(hex)
          return (
            <button
              key={hex}
              className={`clr-swatch${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(hex)}
              aria-label={`Selecionar cor ${hex}`}
              aria-pressed={isSelected}
              title={hex}
              style={{
                background: gradient,
                boxShadow: isSelected
                  ? `0 0 0 3px rgba(255,255,255,0.95), 0 0 0 5px ${hex}, 0 4px 12px ${glow}`
                  : `0 2px 6px ${glow}`,
              }}
            >
              {isSelected && (
                <Check size={13} color="#fff" strokeWidth={3} />
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
