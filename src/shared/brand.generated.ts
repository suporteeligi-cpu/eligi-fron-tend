// GERADO POR scripts/gen-brand.mjs - NAO EDITAR A MAO
// Fonte: src/shared/brand.tokens.json (Eligi Pack de Identidade Visual v1.0)
// Regenerar: npm run brand

export const brand = {
  "version": "1.0.0",
  "core": {
    "black": "#07070B",
    "graphite": "#111114",
    "white": "#FFFFFF",
    "red": "#FE0000",
    "redAction": "#dc2626",
    "redDeep": "#b91c1c",
    "redLight": "#ef4444"
  },
  "typography": {
    "display": "Space Grotesk",
    "body": "Inter",
    "mono": "JetBrains Mono",
    "fallbackSans": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    "fallbackMono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
  },
  "surfaceDark": {
    "base": "#07070B",
    "card": "#101017",
    "border": "#1E1E25",
    "textPrimary": "#E8E8EE",
    "textMuted": "#8C8C96"
  },
  "surfaceLight": {
    "page": "#f5f5f7",
    "card": "rgba(255,255,255,0.85)",
    "border": "rgba(17,17,20,0.07)",
    "ink": "#111114",
    "ink2": "#4b4b52",
    "ink3": "#8a8a93"
  },
  "documentNeutrals": {
    "textStrong": "#26262C",
    "textSecondary": "#5E5E68",
    "label": "#8C8C96",
    "rule": "#D8D8DE",
    "divider": "#EDEDF2",
    "surface": "#F6F6F8"
  },
  "functional": {
    "success": "#16A34A",
    "warning": "#F59E0B",
    "info": "#2563EB",
    "error": "#B91C1C",
    "whatsapp": "#25D366"
  },
  "functionalLegacy": {
    "successProduct": "#10B981",
    "successInk": "#0f6e56",
    "paid": "#00b80c",
    "amberInk": "#b45309"
  },
  "successScale": {
    "base": "#16A34A",
    "ink": "#0f6e56",
    "strong": "#15803d",
    "bg": "#ecfdf5"
  },
  "channel": {
    "online": "#7C3AED"
  },
  "radius": {
    "brandMin": 2,
    "brandMax": 4,
    "squareIcon": 0.22,
    "productCurrent": 16
  },
  "grid": {
    "base": 8,
    "touchMin": 44,
    "inputMinFontSize": 16,
    "interfaceMargin": [
      24,
      32
    ],
    "documentMargin": [
      76,
      84
    ],
    "socialMargin": 80
  },
  "motion": {
    "spring": "cubic-bezier(0.34,1.56,0.64,1)",
    "reveal": "cubic-bezier(0.22,1,0.36,1)",
    "standard": "cubic-bezier(0.4,0,0.2,1)",
    "modalDuration": "0.22s"
  },
  "focus": {
    "outline": "2px solid #dc2626",
    "ring": "0 0 0 3px rgba(220,38,38,0.35)",
    "offset": 2
  },
  "contrast": {
    "graphiteOnWhite": 18.85,
    "whiteOnBlack": 20.11,
    "lightTextOnDark": 16.48,
    "redOnBlack": 4.99,
    "redOnWhite": 4.03
  }
} as const;

export type BrandTokens = typeof brand;
