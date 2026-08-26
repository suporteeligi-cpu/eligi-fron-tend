'use client'
// src/app/dashboard/servicos/components/ColorPicker.tsx
// @eligi:color-picker-tap
// Seletor de cor do servico.
//
// A PALETA NAO MUDA. `SERVICE_COLORS` e reexportada de
// `@/features/agenda/constants/serviceColors`: e a mesma lista que a agenda usa
// para pintar os cards. Podar cores aqui invalidaria a cor de servicos ja
// salvos e mudaria a aparencia da agenda — o problema nunca foi a quantidade.
//
// O problema era o ALVO: cada bolinha tinha 30px, bem abaixo dos 44 minimos
// para o polegar, e a diferenca entre selecionado e nao selecionado dependia de
// um anel fino. Agora:
//   - area de toque de 44px (a bolinha continua visualmente menor, centrada)
//   - selecionado ganha anel forte + check maior
//   - grid com colunas fluidas, sem estourar em tela estreita

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

export default function ColorPicker({ selected, onSelect }: Props) {
  return (
    <>
      <style>{`
        .clr-grid{
          display: grid;
          /* 44px e o alvo minimo de toque; o auto-fill acomoda a largura real */
          grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
          gap: 4px;
          max-width: 100%;
        }
        .clr-tap{
          width: 44px; height: 44px;
          margin: 0 auto;
          padding: 0; border: none; background: transparent;
          display: grid; place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .clr-dot{
          width: 30px; height: 30px;
          border-radius: 50%;
          display: grid; place-items: center;
          transition: transform .15s cubic-bezier(0.34,1.56,0.64,1), box-shadow .15s ease;
        }
        .clr-tap:active .clr-dot{ transform: scale(0.90) }
        .clr-tap.selected .clr-dot{ transform: scale(1.18) }
        @media (hover: hover){ .clr-tap:hover .clr-dot{ transform: scale(1.10) } }
        @media (prefers-reduced-motion: reduce){
          .clr-dot{ transition: none }
          .clr-tap.selected .clr-dot{ transform: none }
        }
      `}</style>

      <div className="clr-grid">
        {SERVICE_COLORS.map((hex) => {
          const isSelected = selected?.toLowerCase() === hex.toLowerCase()
          const gradient   = colorToGradient(hex)
          const glow       = colorToGlow(hex)

          return (
            <button
              key={hex}
              type="button"
              className={`clr-tap${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(hex)}
              aria-label={`Selecionar cor ${hex}`}
              aria-pressed={isSelected}
              title={hex}
            >
              <span
                className="clr-dot"
                style={{
                  background: gradient,
                  boxShadow: isSelected
                    ? `0 0 0 3px #fff, 0 0 0 5.5px ${hex}, 0 4px 12px ${glow}`
                    : `0 2px 6px ${glow}`,
                }}
              >
                {isSelected && <Check size={15} color="#fff" strokeWidth={3.2} />}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
