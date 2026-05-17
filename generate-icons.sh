#!/bin/bash
# generate-icons.sh
# Rode na raiz do projeto front-end após ter o arquivo public/icons/icon-base.png (512x512)
# Requer: imagemagick  →  sudo apt install imagemagick

SRC="public/icons/icon-base.png"
DIR="public/icons"
mkdir -p "$DIR"

echo "Gerando ícones a partir de $SRC..."

# Ícones PWA
for size in 32 72 96 128 144 152 192 384 512; do
  convert "$SRC" -resize "${size}x${size}" "$DIR/icon-${size}x${size}.png"
  echo "✓ icon-${size}x${size}.png"
done

# Apple Touch Icons
convert "$SRC" -resize "180x180" "$DIR/apple-touch-icon.png"
convert "$SRC" -resize "152x152" "$DIR/apple-touch-icon-152x152.png"
convert "$SRC" -resize "120x120" "$DIR/apple-touch-icon-120x120.png"
convert "$SRC" -resize "76x76"   "$DIR/apple-touch-icon-76x76.png"
echo "✓ Apple Touch Icons"

# Splash screens (fundo branco + ícone centralizado)
generate_splash() {
  local W=$1 H=$2 OUT=$3
  convert -size "${W}x${H}" xc:white \
    \( "$SRC" -resize "256x256" \) \
    -gravity center -composite \
    "$DIR/$OUT"
  echo "✓ $OUT"
}

generate_splash 1290 2796 "splash-1290x2796.png"
generate_splash 1179 2556 "splash-1179x2556.png"
generate_splash 1170 2532 "splash-1170x2532.png"
generate_splash 750  1334 "splash-750x1334.png"
generate_splash 2048 2732 "splash-2048x2732.png"

echo ""
echo "✅ Todos os ícones gerados em public/icons/"
echo "Agora coloque o manifest.json em public/ e o layout.tsx em src/app/"
